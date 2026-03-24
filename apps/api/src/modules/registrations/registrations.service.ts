import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import {
  EventRegistrationEntity,
  RegistrationStatus,
} from './entities/event-registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationReminderDto } from './dto/update-registration-reminder.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    @Optional()
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository:
      | Repository<EventRegistrationEntity>
      | undefined,
    @Optional()
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity> | undefined,
  ) {}

  async createFreeRegistration(dto: CreateRegistrationDto, userId: string) {
    if (!this.registrationsRepository || !this.eventsRepository) {
      const event = this.inMemoryData.findEventById(dto.eventId);

      if (!event) {
        throw new NotFoundException(`Event ${dto.eventId} was not found`);
      }

      this.ensureEventIsPublished(event);

      if (Number(event.price) > 0) {
        throw new BadRequestException(
          'Paid events require Stripe checkout before registration is confirmed',
        );
      }

      await this.ensureCapacity(event.id, dto.quantity, event.capacity);
      await this.ensureNoExistingRegistration(event.id, userId);

      const registration = this.inMemoryData.createRegistration({
        eventId: event.id,
        userId,
        status: 'confirmed',
        paymentProvider: 'free',
        quantity: dto.quantity,
        amountTotal: 0,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'free',
        reminderAt: null,
        reminderSentAt: null,
      });

      const attendee = await this.usersService.getCurrentUser(userId);
      await this.notificationsService.notifyRegistrationConfirmed(userId, event);
      await this.notificationsService.notifyNewAttendee(
        event.organizerId,
        event,
        attendee.displayName,
        userId,
      );

      return this.serializeRegistration(registration, event);
    }

    const event = await this.eventsRepository.findOne({
      where: { id: dto.eventId },
      relations: { organizer: true, company: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${dto.eventId} was not found`);
    }

    this.ensureEventIsPublished(event);

    if (Number(event.price) > 0) {
      throw new BadRequestException(
        'Paid events require Stripe checkout before registration is confirmed',
      );
    }

    await this.ensureCapacity(event.id, dto.quantity, event.capacity);
    await this.ensureNoExistingRegistration(event.id, userId);

    const registration = await this.registrationsRepository.save(
      this.registrationsRepository.create({
        eventId: event.id,
        userId,
        status: 'confirmed',
        paymentProvider: 'free',
        quantity: dto.quantity,
        amountTotal: 0,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'free',
        reminderAt: null,
        reminderSentAt: null,
      }),
    );

    const attendee = await this.usersService.getCurrentUser(userId);
    await this.notificationsService.notifyRegistrationConfirmed(userId, event);
    await this.notificationsService.notifyNewAttendee(
      event.organizer?.id ?? null,
      event,
      attendee.displayName,
      userId,
    );

    return this.serializeRegistration(registration, event);
  }

  async findMine(userId: string) {
    if (!this.registrationsRepository) {
      return this.inMemoryData
        .listRegistrationsByUser(userId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .map((registration) => this.serializeRegistration(registration, registration.event));
    }

    const registrations = await this.registrationsRepository.find({
      where: { userId },
      relations: { event: { organizer: true, company: true } },
      order: { createdAt: 'DESC' },
    });

    return registrations.map((registration) =>
      this.serializeRegistration(registration, registration.event),
    );
  }

  async updateReminder(
    eventId: string,
    dto: UpdateRegistrationReminderDto,
    userId: string,
  ) {
    if (!this.registrationsRepository) {
      const registration = this.inMemoryData.findRegistrationByEventAndUser(eventId, userId);

      if (!registration || registration.status !== 'confirmed') {
        throw new NotFoundException('Confirmed registration was not found');
      }

      const reminderAt = dto.reminderAt ? new Date(dto.reminderAt) : null;
      this.ensureReminderIsValid(reminderAt, registration.event.startsAt);
      const savedRegistration = this.inMemoryData.updateRegistration(registration.id, {
        reminderAt,
        reminderSentAt: null,
      });

      if (!savedRegistration) {
        throw new NotFoundException('Confirmed registration was not found');
      }

      return this.serializeRegistration(savedRegistration, savedRegistration.event);
    }

    const registration = await this.registrationsRepository.findOne({
      where: { eventId, userId, status: 'confirmed' },
      relations: { event: { organizer: true, company: true } },
    });

    if (!registration) {
      throw new NotFoundException('Confirmed registration was not found');
    }

    const reminderAt = dto.reminderAt ? new Date(dto.reminderAt) : null;
    this.ensureReminderIsValid(reminderAt, registration.event.startsAt);
    registration.reminderAt = reminderAt;
    registration.reminderSentAt = null;
    const savedRegistration = await this.registrationsRepository.save(registration);

    return this.serializeRegistration(savedRegistration, registration.event);
  }

  async findConfirmedAttendees(eventId: string) {
    if (!this.registrationsRepository) {
      return this.inMemoryData
        .listRegistrationsByEvent(eventId, ['confirmed'])
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .map((registration) => ({
          id: registration.user.id,
          displayName: registration.user.displayName,
          email: registration.user.email,
          quantity: registration.quantity,
          joinedAt: registration.createdAt,
        }));
    }

    const registrations = await this.registrationsRepository.find({
      where: { eventId, status: 'confirmed' },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return registrations.map((registration) => ({
      id: registration.user.id,
      displayName: registration.user.displayName,
      email: registration.user.email,
      quantity: registration.quantity,
      joinedAt: registration.createdAt,
    }));
  }

  async findOneBySessionId(sessionId: string, userId: string) {
    if (!this.registrationsRepository) {
      const registration = this.inMemoryData.findRegistrationBySessionId(sessionId, userId);

      if (!registration) {
        throw new NotFoundException(
          'Registration for this checkout session was not found',
        );
      }

      return registration;
    }

    const registration = await this.registrationsRepository.findOne({
      where: { stripeCheckoutSessionId: sessionId, userId },
      relations: { event: { organizer: true, company: true } },
    });

    if (!registration) {
      throw new NotFoundException('Registration for this checkout session was not found');
    }

    return registration;
  }

  async findEventForCheckout(eventId: string) {
    if (!this.eventsRepository) {
      const event = this.inMemoryData.findEventById(eventId);

      if (!event) {
        throw new NotFoundException(`Event ${eventId} was not found`);
      }

      this.ensureEventIsPublished(event);
      return event;
    }

    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: { organizer: true, company: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} was not found`);
    }

    this.ensureEventIsPublished(event);
    return event;
  }

  async createPendingStripeRegistration(
    eventId: string,
    userId: string,
    quantity: number,
    amountTotal?: number,
  ) {
    if (!this.registrationsRepository || !this.eventsRepository) {
      const event = this.inMemoryData.findEventById(eventId);

      if (!event) {
        throw new NotFoundException(`Event ${eventId} was not found`);
      }

      this.ensureEventIsPublished(event);

      const eventPrice = Number(event.price);

      if (eventPrice <= 0) {
        throw new BadRequestException(
          'Free events should be joined through the registration flow',
        );
      }

      await this.ensureCapacity(event.id, quantity, event.capacity);
      await this.ensureNoExistingRegistration(event.id, userId);

      const registration = this.inMemoryData.createRegistration({
        eventId: event.id,
        userId,
        status: 'pending_payment',
        paymentProvider: 'stripe',
        quantity,
        amountTotal: amountTotal ?? eventPrice * quantity,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'unpaid',
        reminderAt: null,
        reminderSentAt: null,
      });

      return {
        registration,
        event,
      };
    }

    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: { organizer: true, company: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} was not found`);
    }

    this.ensureEventIsPublished(event);

    const eventPrice = Number(event.price);

    if (eventPrice <= 0) {
      throw new BadRequestException(
        'Free events should be joined through the registration flow',
      );
    }

    await this.ensureCapacity(event.id, quantity, event.capacity);
    await this.ensureNoExistingRegistration(event.id, userId);

    const registration = await this.registrationsRepository.save(
      this.registrationsRepository.create({
        eventId: event.id,
        userId,
        status: 'pending_payment',
        paymentProvider: 'stripe',
        quantity,
        amountTotal: amountTotal ?? eventPrice * quantity,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'unpaid',
        reminderAt: null,
        reminderSentAt: null,
      }),
    );

    return {
      registration,
      event,
    };
  }

  async attachCheckoutSession(registrationId: string, sessionId: string, paymentStatus: string) {
    if (!this.registrationsRepository) {
      this.inMemoryData.updateRegistration(registrationId, {
        stripeCheckoutSessionId: sessionId,
        stripePaymentStatus: paymentStatus,
      });
      return;
    }

    await this.registrationsRepository.update(registrationId, {
      stripeCheckoutSessionId: sessionId,
      stripePaymentStatus: paymentStatus,
    });
  }

  async confirmStripeRegistration(
    registration: EventRegistrationEntity,
    paymentStatus: string,
  ) {
    const event = registration.event
      ? registration.event
      : this.eventsRepository
        ? await this.eventsRepository.findOne({
            where: { id: registration.eventId },
            relations: { organizer: true, company: true },
          })
        : this.inMemoryData.findEventById(registration.eventId);

    if (!event) {
      throw new NotFoundException(`Event ${registration.eventId} was not found`);
    }

    if (!this.registrationsRepository) {
      if (registration.status === 'confirmed') {
        return this.serializeRegistration(registration, event);
      }

      const savedRegistration = this.inMemoryData.updateRegistration(registration.id, {
        status: 'confirmed',
        stripePaymentStatus: paymentStatus,
      });

      if (!savedRegistration) {
        throw new NotFoundException('Registration was not found');
      }

      return this.serializeRegistration(savedRegistration, event);
    }

    if (registration.status === 'confirmed') {
      return this.serializeRegistration(registration, event);
    }

    registration.status = 'confirmed';
    registration.stripePaymentStatus = paymentStatus;

    const savedRegistration = await this.registrationsRepository.save(registration);

    return this.serializeRegistration(savedRegistration, event);
  }

  async markStripePaymentStatus(registrationId: string, paymentStatus: string) {
    if (!this.registrationsRepository) {
      this.inMemoryData.updateRegistration(registrationId, {
        stripePaymentStatus: paymentStatus,
      });
      return;
    }

    await this.registrationsRepository.update(registrationId, {
      stripePaymentStatus: paymentStatus,
    });
  }

  private async ensureNoExistingRegistration(eventId: string, userId: string) {
    if (!this.registrationsRepository) {
      const existingRegistration = this.inMemoryData.findRegistrationByEventAndUser(
        eventId,
        userId,
      );

      if (existingRegistration) {
        throw new ConflictException('You already have a registration for this event');
      }

      return;
    }

    const existingRegistration = await this.registrationsRepository.findOne({
      where: { eventId, userId },
    });

    if (existingRegistration) {
      throw new ConflictException('You already have a registration for this event');
    }
  }

  private async ensureCapacity(eventId: string, quantity: number, capacity: number) {
    if (!this.registrationsRepository) {
      const reservedSpots = this.inMemoryData
        .listRegistrationsByEvent(eventId, ['pending_payment', 'confirmed'])
        .reduce((sum, registration) => sum + registration.quantity, 0);

      if (reservedSpots + quantity > capacity) {
        throw new BadRequestException('Event capacity has been reached');
      }

      return;
    }

    const existingRegistrations = await this.registrationsRepository.find({
      where: {
        eventId,
        status: In<RegistrationStatus>(['pending_payment', 'confirmed']),
      },
    });
    const reservedSpots = existingRegistrations.reduce(
      (sum, registration) => sum + registration.quantity,
      0,
    );

    if (reservedSpots + quantity > capacity) {
      throw new BadRequestException('Event capacity has been reached');
    }
  }

  private serializeRegistration(
    registration: EventRegistrationEntity,
    event: EventEntity,
  ) {
    return {
      id: registration.id,
      eventId: event.id,
      userId: registration.userId,
      status: registration.status,
      paymentProvider: registration.paymentProvider,
      quantity: registration.quantity,
      amountTotal: Number(registration.amountTotal),
      stripeCheckoutSessionId: registration.stripeCheckoutSessionId,
      stripePaymentStatus: registration.stripePaymentStatus,
      reminderAt: registration.reminderAt,
      reminderSentAt: registration.reminderSentAt,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        format: event.format,
        theme: event.theme,
        city: event.city,
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
        price: Number(event.price),
        capacity: event.capacity,
        hideAttendeeNames: event.hideAttendeeNames,
        attendeeVisibility: event.attendeeVisibility,
        notifyOnNewAttendee: event.notifyOnNewAttendee,
        commentAccess: event.commentAccess,
        commentsClosed: event.commentsClosed,
        isPublished: !event.publishAt || event.publishAt.getTime() <= Date.now(),
        createdAt: event.createdAt,
        organizer: event.organizer
          ? {
              id: event.organizer.id,
              displayName: event.organizer.displayName,
              email: event.organizer.email,
            }
          : null,
      },
    };
  }

  private ensureReminderIsValid(reminderAt: Date | null, startsAt: Date) {
    if (!reminderAt) {
      return;
    }

    if (reminderAt.getTime() >= startsAt.getTime()) {
      throw new BadRequestException('Reminder must be scheduled before the event starts');
    }
  }

  private ensureEventIsPublished(event: EventEntity) {
    if (!event.publishAt || event.publishAt.getTime() <= Date.now()) {
      return;
    }

    throw new NotFoundException(`Event ${event.id} was not found`);
  }
}
