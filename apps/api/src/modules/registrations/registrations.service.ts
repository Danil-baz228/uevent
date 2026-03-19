import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { EventEntity } from '../events/entities/event.entity';
import {
  EventRegistrationEntity,
  RegistrationStatus,
} from './entities/event-registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async createFreeRegistration(dto: CreateRegistrationDto, userId: string) {
    const event = await this.eventsRepository.findOne({
      where: { id: dto.eventId },
      relations: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${dto.eventId} was not found`);
    }

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
      }),
    );

    return this.serializeRegistration(registration, event);
  }

  async findMine(userId: string) {
    const registrations = await this.registrationsRepository.find({
      where: { userId },
      relations: { event: { organizer: true } },
      order: { createdAt: 'DESC' },
    });

    return registrations.map((registration) =>
      this.serializeRegistration(registration, registration.event),
    );
  }

  async findConfirmedAttendees(eventId: string) {
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
    const registration = await this.registrationsRepository.findOne({
      where: { stripeCheckoutSessionId: sessionId, userId },
      relations: { event: { organizer: true } },
    });

    if (!registration) {
      throw new NotFoundException('Registration for this checkout session was not found');
    }

    return registration;
  }

  async createPendingStripeRegistration(
    eventId: string,
    userId: string,
    quantity: number,
  ) {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} was not found`);
    }

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
        amountTotal: eventPrice * quantity,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'unpaid',
      }),
    );

    return {
      registration,
      event,
    };
  }

  async attachCheckoutSession(registrationId: string, sessionId: string, paymentStatus: string) {
    await this.registrationsRepository.update(registrationId, {
      stripeCheckoutSessionId: sessionId,
      stripePaymentStatus: paymentStatus,
    });
  }

  async confirmStripeRegistration(
    registration: EventRegistrationEntity,
    paymentStatus: string,
  ) {
    if (registration.status === 'confirmed') {
      return this.serializeRegistration(registration, registration.event);
    }

    registration.status = 'confirmed';
    registration.stripePaymentStatus = paymentStatus;

    const savedRegistration = await this.registrationsRepository.save(registration);

    return this.serializeRegistration(savedRegistration, registration.event);
  }

  async markStripePaymentStatus(registrationId: string, paymentStatus: string) {
    await this.registrationsRepository.update(registrationId, {
      stripePaymentStatus: paymentStatus,
    });
  }

  private async ensureNoExistingRegistration(eventId: string, userId: string) {
    const existingRegistration = await this.registrationsRepository.findOne({
      where: { eventId, userId },
    });

    if (existingRegistration) {
      throw new ConflictException('You already have a registration for this event');
    }
  }

  private async ensureCapacity(eventId: string, quantity: number, capacity: number) {
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
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
      event: {
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
}
