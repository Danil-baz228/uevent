import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';

import { CommentsService } from '../comments/comments.service';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { RegistrationsService } from '../registrations/registrations.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FindEventsDto } from './dto/find-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventEntity } from './entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity> | undefined,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity> | undefined,
    @Optional()
    @InjectRepository(EventCommentEntity)
    private readonly commentsRepository: Repository<EventCommentEntity> | undefined,
    @Optional()
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository:
      | Repository<EventRegistrationEntity>
      | undefined,
    private readonly registrationsService: RegistrationsService,
    private readonly commentsService: CommentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: FindEventsDto) {
    if (!this.eventsRepository) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 6;
      const filteredEvents = this.inMemoryData
        .listEvents()
        .filter((event) => this.isEventPublished(event))
        .filter((event) => this.matchesEventQuery(event, query))
        .sort((left, right) => this.compareEvents(left, right, query.sortBy));
      const total = filteredEvents.length;
      const items = filteredEvents
        .slice((page - 1) * limit, page * limit)
        .map((event) => this.serializeEvent(event));

      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 6;
    const where = this.buildFindWhere(query);

    const [events, total] = await this.eventsRepository.findAndCount({
      where,
      relations: { organizer: true, company: true },
      order: this.buildFindOrder(query.sortBy),
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: events.map((event) => this.serializeEvent(event)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findScheduledByOrganizer(organizerId: string) {
    if (!this.eventsRepository) {
      return this.inMemoryData
        .listEvents()
        .filter(
          (event) =>
            event.organizerId === organizerId &&
            Boolean(event.publishAt && event.publishAt.getTime() > Date.now()),
        )
        .sort(
          (left, right) =>
            (left.publishAt?.getTime() ?? 0) - (right.publishAt?.getTime() ?? 0),
        )
        .map((event) => this.serializeEvent(event));
    }

    const events = await this.eventsRepository.find({
      where: {
        organizerId,
        publishAt: MoreThan(new Date()),
      },
      relations: { organizer: true, company: true },
      order: { publishAt: 'ASC', startsAt: 'ASC' },
    });

    return events.map((event) => this.serializeEvent(event));
  }

  async findOne(id: string, viewerId?: string | null) {
    if (!this.eventsRepository || !this.commentsRepository) {
      const event = this.inMemoryData.findEventById(id);

      if (!event) {
        throw new NotFoundException(`Event ${id} was not found`);
      }

      this.ensureViewerCanOpenEvent(event, viewerId);

      const allEvents = this.inMemoryData.listEvents();
      const [attendees, comments] = await Promise.all([
        this.registrationsService.findConfirmedAttendees(event.id),
        Promise.resolve(
          this.inMemoryData
            .listCommentsByEvent(event.id)
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .slice(0, 20),
        ),
      ]);
      const organizerEvents = event.organizerId
        ? allEvents
            .filter(
              (candidate) =>
                candidate.organizerId === event.organizerId &&
                this.canViewerSeeReferencedEvent(candidate, viewerId),
            )
            .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
        : [];
      const similarEvents = allEvents
        .filter(
          (candidate) =>
            candidate.category === event.category &&
            this.canViewerSeeReferencedEvent(candidate, viewerId),
        )
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
      const canViewAttendees = await this.canViewerSeeAttendees(event, viewerId);

      return {
        ...this.serializeEvent(event),
        canViewAttendees,
        attendees: canViewAttendees ? this.serializeAttendeesForView(attendees, event) : [],
        comments: comments.map((comment) => this.commentsService.serializeComment(comment)),
        organizerEvents: organizerEvents
          .filter((candidate) => candidate.id !== event.id)
          .slice(0, 3)
          .map((candidate) => this.serializeEvent(candidate)),
        similarEvents: similarEvents
          .filter((candidate) => candidate.id !== event.id)
          .slice(0, 3)
          .map((candidate) => this.serializeEvent(candidate)),
      };
    }

    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { organizer: true, company: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    this.ensureViewerCanOpenEvent(event, viewerId);

    const [organizerEvents, similarEvents, attendees, comments] = await Promise.all([
      event.organizerId
        ? this.eventsRepository.find({
            where: this.buildVisibleEventWhere({ organizerId: event.organizerId }, viewerId),
            relations: { organizer: true, company: true },
            order: { startsAt: 'ASC' },
            take: 4,
          })
        : Promise.resolve([]),
      this.eventsRepository.find({
        where: this.buildVisibleEventWhere({ category: event.category }, viewerId),
        relations: { organizer: true, company: true },
        order: { startsAt: 'ASC' },
        take: 6,
      }),
      this.registrationsService.findConfirmedAttendees(event.id),
      this.commentsRepository.find({
        where: { eventId: event.id },
        relations: { author: true },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);
    const canViewAttendees = await this.canViewerSeeAttendees(event, viewerId);

    return {
      ...this.serializeEvent(event),
      canViewAttendees,
      attendees: canViewAttendees ? this.serializeAttendeesForView(attendees, event) : [],
      comments: comments.map((comment) => this.commentsService.serializeComment(comment)),
      organizerEvents: organizerEvents
        .filter((candidate) => candidate.id !== event.id)
        .slice(0, 3)
        .map((candidate) => this.serializeEvent(candidate)),
      similarEvents: similarEvents
        .filter((candidate) => candidate.id !== event.id)
        .slice(0, 3)
        .map((candidate) => this.serializeEvent(candidate)),
    };
  }

  async create(dto: CreateEventDto, organizerId: string) {
    const promoCodes = this.normalizePromoCodes(dto.promoCodes);

    if (!this.eventsRepository || !this.usersRepository || !this.companiesRepository) {
      const organizer = this.inMemoryData.findUserById(organizerId);
      const company = this.inMemoryData.findCompanyById(dto.companyId);

      if (!organizer) {
        throw new NotFoundException('Organizer was not found');
      }

      if (!company || company.ownerId !== organizerId) {
        throw new ForbiddenException('You can create events only for your own company');
      }

      const savedEvent = this.inMemoryData.createEvent({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        format: dto.format,
        theme: dto.theme,
        city: dto.city,
        address: dto.address?.trim() || null,
        posterUrl: dto.posterUrl?.trim() || null,
        startsAt: new Date(dto.startsAt),
        publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
        redirectAfterPurchaseUrl: dto.redirectAfterPurchaseUrl ?? null,
        price: dto.price ?? 0,
        promoCodes,
        capacity: dto.capacity ?? 50,
        hideAttendeeNames: false,
        attendeeVisibility: dto.attendeeVisibility ?? 'everyone',
        notifyOnNewAttendee: dto.notifyOnNewAttendee ?? true,
        commentAccess: dto.commentAccess ?? 'everyone',
        commentsClosed: (dto.commentAccess ?? 'everyone') === 'closed',
        organizerId: organizer.id,
        companyId: company.id,
      });

      if (this.isEventPublished(savedEvent) && savedEvent.company) {
        await this.notificationsService.notifyCompanyEventPublished(
          savedEvent.company,
          savedEvent,
          organizerId,
        );
      }

      return this.serializeEvent(savedEvent);
    }

    const organizer = await this.usersRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer was not found');
    }

    const company = await this.companiesRepository.findOne({
      where: { id: dto.companyId, ownerId: organizerId },
    });

    if (!company) {
      throw new ForbiddenException('You can create events only for your own company');
    }

    const event = this.eventsRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      format: dto.format,
      theme: dto.theme,
      city: dto.city,
      address: dto.address?.trim() || null,
      posterUrl: dto.posterUrl?.trim() || null,
      startsAt: new Date(dto.startsAt),
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      redirectAfterPurchaseUrl: dto.redirectAfterPurchaseUrl ?? null,
      price: dto.price ?? 0,
      promoCodes,
      capacity: dto.capacity ?? 50,
      hideAttendeeNames: false,
      attendeeVisibility: dto.attendeeVisibility ?? 'everyone',
      notifyOnNewAttendee: dto.notifyOnNewAttendee ?? true,
      commentAccess: dto.commentAccess ?? 'everyone',
      commentsClosed: (dto.commentAccess ?? 'everyone') === 'closed',
      organizerId: organizer.id,
      companyId: company.id,
    });

    const savedEvent = await this.eventsRepository.save(event);
    const hydratedEvent = await this.eventsRepository.findOne({
      where: { id: savedEvent.id },
      relations: { organizer: true, company: true },
    });

    if (!hydratedEvent) {
      throw new NotFoundException('Saved event could not be loaded');
    }

    if (this.isEventPublished(hydratedEvent) && hydratedEvent.company) {
      await this.notificationsService.notifyCompanyEventPublished(
        hydratedEvent.company,
        hydratedEvent,
        organizerId,
      );
    }

    return this.serializeEvent(hydratedEvent);
  }

  async update(id: string, dto: UpdateEventDto, organizerId: string) {
    const promoCodes = dto.promoCodes !== undefined ? this.normalizePromoCodes(dto.promoCodes) : undefined;

    if (!this.eventsRepository) {
      const event = this.inMemoryData.findEventById(id);

      if (!event) {
        throw new NotFoundException(`Event ${id} was not found`);
      }

      this.ensureOrganizerAccess(event, organizerId);
      const wasPublished = this.isEventPublished(event);

      if (dto.companyId !== undefined) {
        const company = this.inMemoryData.findCompanyById(dto.companyId);

        if (!company || company.ownerId !== organizerId) {
          throw new ForbiddenException('You can assign events only to your own company');
        }
      }

      const savedEvent = this.inMemoryData.updateEvent(id, {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.format !== undefined ? { format: dto.format.trim() } : {}),
        ...(dto.theme !== undefined ? { theme: dto.theme.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
        ...(dto.companyId !== undefined ? { companyId: dto.companyId } : {}),
        ...(dto.posterUrl !== undefined ? { posterUrl: dto.posterUrl?.trim() || null } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.publishAt !== undefined
          ? { publishAt: dto.publishAt ? new Date(dto.publishAt) : null }
          : {}),
        ...(dto.redirectAfterPurchaseUrl !== undefined
          ? { redirectAfterPurchaseUrl: dto.redirectAfterPurchaseUrl }
          : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(promoCodes !== undefined ? { promoCodes } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.hideAttendeeNames !== undefined
          ? { hideAttendeeNames: dto.hideAttendeeNames }
          : {}),
        ...(dto.attendeeVisibility !== undefined
          ? { attendeeVisibility: dto.attendeeVisibility }
          : {}),
        ...(dto.notifyOnNewAttendee !== undefined
          ? { notifyOnNewAttendee: dto.notifyOnNewAttendee }
          : {}),
        ...(dto.commentAccess !== undefined
          ? {
              commentAccess: dto.commentAccess,
              commentsClosed: dto.commentAccess === 'closed',
            }
          : {}),
        ...(dto.commentsClosed !== undefined
          ? {
              commentsClosed: dto.commentsClosed,
              commentAccess: dto.commentsClosed ? 'closed' : 'everyone',
            }
          : {}),
      });

      if (!savedEvent) {
        throw new NotFoundException(`Event ${id} was not found`);
      }

      if (!wasPublished && this.isEventPublished(savedEvent) && savedEvent.company) {
        await this.notificationsService.notifyCompanyEventPublished(
          savedEvent.company,
          savedEvent,
          organizerId,
        );
      }

      return this.serializeEvent(savedEvent);
    }

    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { organizer: true, company: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    this.ensureOrganizerAccess(event, organizerId);
    const wasPublished = this.isEventPublished(event);

    if (dto.title !== undefined) {
      event.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      event.description = dto.description.trim();
    }

    if (dto.category !== undefined) {
      event.category = dto.category.trim();
    }

    if (dto.format !== undefined) {
      event.format = dto.format.trim();
    }

    if (dto.theme !== undefined) {
      event.theme = dto.theme.trim();
    }

    if (dto.city !== undefined) {
      event.city = dto.city.trim();
    }

    if (dto.address !== undefined) {
      event.address = dto.address.trim() || null;
    }

    if (dto.companyId !== undefined) {
      const company = await this.companiesRepository?.findOne({
        where: { id: dto.companyId, ownerId: organizerId },
      });

      if (!company) {
        throw new ForbiddenException('You can assign events only to your own company');
      }

      event.companyId = company.id;
      event.company = company;
    }

    if (dto.posterUrl !== undefined) {
      event.posterUrl = dto.posterUrl?.trim() || null;
    }

    if (dto.startsAt !== undefined) {
      event.startsAt = new Date(dto.startsAt);
    }

    if (dto.publishAt !== undefined) {
      event.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    }

    if (dto.redirectAfterPurchaseUrl !== undefined) {
      event.redirectAfterPurchaseUrl = dto.redirectAfterPurchaseUrl;
    }

    if (dto.price !== undefined) {
      event.price = dto.price;
    }

    if (promoCodes !== undefined) {
      event.promoCodes = promoCodes;
    }

    if (dto.capacity !== undefined) {
      event.capacity = dto.capacity;
    }

    if (dto.hideAttendeeNames !== undefined) {
      event.hideAttendeeNames = dto.hideAttendeeNames;
    }

    if (dto.attendeeVisibility !== undefined) {
      event.attendeeVisibility = dto.attendeeVisibility;
    }

    if (dto.notifyOnNewAttendee !== undefined) {
      event.notifyOnNewAttendee = dto.notifyOnNewAttendee;
    }

    if (dto.commentAccess !== undefined) {
      event.commentAccess = dto.commentAccess;
      event.commentsClosed = dto.commentAccess === 'closed';
    }

    if (dto.commentsClosed !== undefined) {
      event.commentsClosed = dto.commentsClosed;
      event.commentAccess = dto.commentsClosed ? 'closed' : 'everyone';
    }

    const savedEvent = await this.eventsRepository.save(event);

    if (!wasPublished && this.isEventPublished(savedEvent) && savedEvent.company) {
      await this.notificationsService.notifyCompanyEventPublished(
        savedEvent.company,
        savedEvent,
        organizerId,
      );
    }

    return this.serializeEvent(savedEvent);
  }

  async remove(id: string, organizerId: string) {
    if (!this.eventsRepository || !this.commentsRepository || !this.registrationsRepository) {
      const event = this.inMemoryData.findEventById(id);

      if (!event) {
        throw new NotFoundException(`Event ${id} was not found`);
      }

      this.ensureOrganizerAccess(event, organizerId);
      this.inMemoryData.removeEvent(id);

      return { message: 'Event deleted' };
    }

    const event = await this.eventsRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    this.ensureOrganizerAccess(event, organizerId);

    await this.commentsRepository.delete({ eventId: id });
    await this.registrationsRepository.delete({ eventId: id });
    await this.eventsRepository.delete({ id });

    return { message: 'Event deleted' };
  }

  private buildFindWhere(query: FindEventsDto) {
    const search = query.q?.trim();
    const category = query.category?.trim();
    const format = query.format?.trim();
    const theme = query.theme?.trim();
    const priceType = query.priceType ?? 'all';
    const baseWhere = {
      ...(category ? { category } : {}),
      ...(format ? { format } : {}),
      ...(theme ? { theme } : {}),
      ...(priceType === 'free'
        ? { price: 0 }
        : priceType === 'paid'
          ? { price: MoreThan(0) }
          : {}),
    };

    const visibleWhere = this.buildVisibleEventWhere(baseWhere);

    if (!search) {
      return visibleWhere;
    }

    return visibleWhere.flatMap((whereClause) => [
      { ...whereClause, title: ILike(`%${search}%`) },
      { ...whereClause, description: ILike(`%${search}%`) },
      { ...whereClause, city: ILike(`%${search}%`) },
      { ...whereClause, address: ILike(`%${search}%`) },
    ]);
  }

  private matchesEventQuery(event: EventEntity, query: FindEventsDto) {
    if (!this.isEventPublished(event)) {
      return false;
    }

    const search = query.q?.trim().toLowerCase();
    const category = query.category?.trim();
    const format = query.format?.trim();
    const theme = query.theme?.trim();
    const priceType = query.priceType ?? 'all';

    if (category && event.category !== category) {
      return false;
    }

    if (format && event.format !== format) {
      return false;
    }

    if (theme && event.theme !== theme) {
      return false;
    }

    if (priceType === 'free' && Number(event.price) > 0) {
      return false;
    }

    if (priceType === 'paid' && Number(event.price) <= 0) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [event.title, event.description, event.city, event.address ?? ''].some((value) =>
      value.toLowerCase().includes(search),
    );
  }

  private serializeEvent(event: EventEntity) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      format: event.format,
      theme: event.theme,
      city: event.city,
      address: event.address,
      company: event.company
        ? {
            id: event.company.id,
            name: event.company.name,
            email: event.company.email,
            location: event.company.location,
            description: event.company.description,
          }
        : null,
      posterUrl: event.posterUrl,
      startsAt: event.startsAt,
      publishAt: event.publishAt,
      redirectAfterPurchaseUrl: event.redirectAfterPurchaseUrl,
      price: Number(event.price),
      promoCodes: event.promoCodes ?? [],
      capacity: event.capacity,
      hideAttendeeNames: event.hideAttendeeNames,
      attendeeVisibility: event.attendeeVisibility,
      notifyOnNewAttendee: event.notifyOnNewAttendee,
      commentAccess: event.commentAccess,
      commentsClosed: event.commentsClosed,
      isPublished: this.isEventPublished(event),
      organizer: event.organizer
        ? {
            id: event.organizer.id,
            displayName: event.organizer.displayName,
            email: event.organizer.email,
          }
        : null,
      createdAt: event.createdAt,
    };
  }

  private ensureOrganizerAccess(event: EventEntity, organizerId: string) {
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can manage this event');
    }
  }

  private normalizePromoCodes(
    promoCodes?: Array<{ code: string; discountPercent: number }> | null,
  ) {
    if (!promoCodes?.length) {
      return [];
    }

    const uniqueCodes = new Set<string>();

    return promoCodes
      .map((item) => ({
        code: item.code.trim().toUpperCase(),
        discountPercent: Math.max(1, Math.min(99, Math.round(Number(item.discountPercent)))),
      }))
      .filter((item) => {
        if (!item.code || uniqueCodes.has(item.code)) {
          return false;
        }

        uniqueCodes.add(item.code);
        return true;
      });
  }

  private buildVisibleEventWhere(
    baseWhere: FindOptionsWhere<EventEntity>,
    viewerId?: string | null,
  ): FindOptionsWhere<EventEntity>[] {
    const visiblePublished = [
      { ...baseWhere, publishAt: IsNull() },
      { ...baseWhere, publishAt: LessThanOrEqual(new Date()) },
    ];

    if (!viewerId) {
      return visiblePublished;
    }

    return [...visiblePublished, { ...baseWhere, organizerId: viewerId }];
  }

  private isEventPublished(event: EventEntity) {
    return !event.publishAt || event.publishAt.getTime() <= Date.now();
  }

  private ensureViewerCanOpenEvent(event: EventEntity, viewerId?: string | null) {
    if (this.isEventPublished(event) || event.organizerId === viewerId) {
      return;
    }

    throw new NotFoundException(`Event ${event.id} was not found`);
  }

  private canViewerSeeReferencedEvent(event: EventEntity, viewerId?: string | null) {
    return this.isEventPublished(event) || event.organizerId === viewerId;
  }

  private async canViewerSeeAttendees(
    event: EventEntity,
    viewerId?: string | null,
  ) {
    if (event.attendeeVisibility === 'everyone') {
      return true;
    }

    if (!viewerId) {
      return false;
    }

    if (event.organizerId === viewerId) {
      return true;
    }

    if (event.attendeeVisibility === 'nobody') {
      return false;
    }

    if (!this.registrationsRepository) {
      return Boolean(this.inMemoryData.findRegistrationByEventAndUser(event.id, viewerId));
    }

    const registration = await this.registrationsRepository.findOne({
      where: { eventId: event.id, userId: viewerId },
    });

    return Boolean(registration);
  }

  private serializeAttendeesForView(
    attendees: Array<{
      id: string;
      displayName: string;
      email: string;
      quantity: number;
      showAttendeeName: boolean;
      joinedAt: Date;
    }>,
    event: EventEntity,
  ) {
    return attendees.map((attendee, index) =>
      event.hideAttendeeNames || !attendee.showAttendeeName
        ? {
            ...attendee,
            displayName: `Guest ${index + 1}`,
            email: '',
          }
        : attendee,
    );
  }

  private buildFindOrder(
    sortBy: FindEventsDto['sortBy'],
  ): FindOptionsOrder<EventEntity> {
    switch (sortBy) {
      case 'date_desc':
        return { startsAt: 'DESC' };
      case 'newest':
        return { createdAt: 'DESC' };
      case 'price_asc':
        return { price: 'ASC' };
      case 'price_desc':
        return { price: 'DESC' };
      case 'date_asc':
      default:
        return { startsAt: 'ASC' };
    }
  }

  private compareEvents(
    left: EventEntity,
    right: EventEntity,
    sortBy: FindEventsDto['sortBy'],
  ) {
    switch (sortBy) {
      case 'date_desc':
        return right.startsAt.getTime() - left.startsAt.getTime();
      case 'newest':
        return right.createdAt.getTime() - left.createdAt.getTime();
      case 'price_asc':
        return Number(left.price) - Number(right.price);
      case 'price_desc':
        return Number(right.price) - Number(left.price);
      case 'date_asc':
      default:
        return left.startsAt.getTime() - right.startsAt.getTime();
    }
  }
}
