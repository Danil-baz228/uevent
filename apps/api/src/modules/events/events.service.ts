import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, MoreThan, Repository } from 'typeorm';

import { CommentsService } from '../comments/comments.service';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
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
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EventCommentEntity)
    private readonly commentsRepository: Repository<EventCommentEntity>,
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository: Repository<EventRegistrationEntity>,
    private readonly registrationsService: RegistrationsService,
    private readonly commentsService: CommentsService,
  ) {}

  async findAll(query: FindEventsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 6;
    const where = this.buildFindWhere(query);

    const [events, total] = await this.eventsRepository.findAndCount({
      where,
      relations: { organizer: true },
      order: { startsAt: 'ASC' },
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

  async findOne(id: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    const [organizerEvents, similarEvents, attendees, comments] = await Promise.all([
      event.organizerId
        ? this.eventsRepository.find({
            where: { organizerId: event.organizerId },
            relations: { organizer: true },
            order: { startsAt: 'ASC' },
            take: 4,
          })
        : Promise.resolve([]),
      this.eventsRepository.find({
        where: { category: event.category },
        relations: { organizer: true },
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

    return {
      ...this.serializeEvent(event),
      attendees: event.hideAttendeeNames
        ? attendees.map((attendee, index) => ({
            ...attendee,
            displayName: `Guest ${index + 1}`,
            email: '',
          }))
        : attendees,
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
    const organizer = await this.usersRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer was not found');
    }

    const event = this.eventsRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      city: dto.city,
      posterUrl: dto.posterUrl?.trim() || null,
      startsAt: new Date(dto.startsAt),
      price: dto.price ?? 0,
      capacity: dto.capacity ?? 50,
      hideAttendeeNames: false,
      commentsClosed: false,
      organizerId: organizer.id,
    });

    const savedEvent = await this.eventsRepository.save(event);
    const hydratedEvent = await this.eventsRepository.findOne({
      where: { id: savedEvent.id },
      relations: { organizer: true },
    });

    if (!hydratedEvent) {
      throw new NotFoundException('Saved event could not be loaded');
    }

    return this.serializeEvent(hydratedEvent);
  }

  async update(id: string, dto: UpdateEventDto, organizerId: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    this.ensureOrganizerAccess(event, organizerId);

    if (dto.title !== undefined) {
      event.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      event.description = dto.description.trim();
    }

    if (dto.category !== undefined) {
      event.category = dto.category.trim();
    }

    if (dto.city !== undefined) {
      event.city = dto.city.trim();
    }

    if (dto.posterUrl !== undefined) {
      event.posterUrl = dto.posterUrl?.trim() || null;
    }

    if (dto.startsAt !== undefined) {
      event.startsAt = new Date(dto.startsAt);
    }

    if (dto.price !== undefined) {
      event.price = dto.price;
    }

    if (dto.capacity !== undefined) {
      event.capacity = dto.capacity;
    }

    if (dto.hideAttendeeNames !== undefined) {
      event.hideAttendeeNames = dto.hideAttendeeNames;
    }

    if (dto.commentsClosed !== undefined) {
      event.commentsClosed = dto.commentsClosed;
    }

    const savedEvent = await this.eventsRepository.save(event);
    return this.serializeEvent(savedEvent);
  }

  async remove(id: string, organizerId: string) {
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
    const priceType = query.priceType ?? 'all';
    const baseWhere = {
      ...(category ? { category } : {}),
      ...(priceType === 'free'
        ? { price: 0 }
        : priceType === 'paid'
          ? { price: MoreThan(0) }
          : {}),
    };

    if (!search) {
      return baseWhere;
    }

    return [
      { ...baseWhere, title: ILike(`%${search}%`) },
      { ...baseWhere, description: ILike(`%${search}%`) },
      { ...baseWhere, city: ILike(`%${search}%`) },
    ];
  }

  private serializeEvent(event: EventEntity) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      city: event.city,
      posterUrl: event.posterUrl,
      startsAt: event.startsAt,
      price: Number(event.price),
      capacity: event.capacity,
      hideAttendeeNames: event.hideAttendeeNames,
      commentsClosed: event.commentsClosed,
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
}
