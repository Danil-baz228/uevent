import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { hashPassword } from '../auth/auth.utils';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { EventEntity } from '../events/entities/event.entity';
import {
  EventRegistrationEntity,
  PaymentProvider,
  RegistrationStatus,
} from '../registrations/entities/event-registration.entity';
import { UserEntity } from '../users/entities/user.entity';

type CreateUserInput = {
  id?: string;
  email: string;
  displayName: string;
  passwordHash: string;
  refreshTokenHash?: string | null;
  interests?: string[];
  createdAt?: Date;
};

type CreateEventInput = {
  id?: string;
  title: string;
  description: string;
  category: string;
  city: string;
  posterUrl?: string | null;
  startsAt: Date;
  price?: number;
  capacity?: number;
  hideAttendeeNames?: boolean;
  commentsClosed?: boolean;
  organizerId?: string | null;
  createdAt?: Date;
};

type CreateRegistrationInput = {
  id?: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  paymentProvider: PaymentProvider;
  quantity?: number;
  amountTotal?: number;
  stripeCheckoutSessionId?: string | null;
  stripePaymentStatus?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type CreateCommentInput = {
  id?: string;
  eventId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  createdAt?: Date;
};

@Injectable()
export class InMemoryDataService {
  private readonly users: UserEntity[];
  private readonly events: EventEntity[];
  private readonly registrations: EventRegistrationEntity[];
  private readonly comments: EventCommentEntity[];

  constructor() {
    const organizer = this.buildUser({
      id: 'usr-organizer-demo',
      email: 'organizer@uevent.local',
      displayName: 'Mila Organizer',
      passwordHash: hashPassword('demo12345'),
      interests: ['networking', 'community', 'events'],
      createdAt: new Date('2026-02-11T09:00:00.000Z'),
    });

    const attendee = this.buildUser({
      id: 'usr-attendee-demo',
      email: 'guest@uevent.local',
      displayName: 'Alex Guest',
      passwordHash: hashPassword('demo12345'),
      interests: ['design', 'music', 'meetups'],
      createdAt: new Date('2026-02-18T12:00:00.000Z'),
    });

    this.users = [organizer, attendee];

    this.events = [
      this.buildEvent({
        id: 'evt-product-night',
        title: 'Product Night for Curious Builders',
        description:
          'A live evening for founders, PMs, and developers who want to test ideas and meet future collaborators.',
        category: 'Networking',
        city: 'Kharkiv',
        startsAt: new Date('2026-04-08T15:30:00.000Z'),
        price: 0,
        capacity: 120,
        organizerId: organizer.id,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
      }),
      this.buildEvent({
        id: 'evt-design-jam',
        title: 'Design Jam for Community Organizers',
        description:
          'Hands-on workshop about event flows, volunteer onboarding, and building stronger local communities.',
        category: 'Workshop',
        city: 'Kyiv',
        startsAt: new Date('2026-04-12T13:00:00.000Z'),
        price: 15,
        capacity: 60,
        organizerId: organizer.id,
        createdAt: new Date('2026-03-02T11:00:00.000Z'),
      }),
      this.buildEvent({
        id: 'evt-sound-and-code',
        title: 'Sound and Code Meetup',
        description:
          'An evening for creative coders and sound artists exploring performance, tooling, and collaboration.',
        category: 'Meetup',
        city: 'Lviv',
        startsAt: new Date('2026-04-19T16:15:00.000Z'),
        price: 0,
        capacity: 80,
        organizerId: organizer.id,
        createdAt: new Date('2026-03-03T12:00:00.000Z'),
      }),
    ];

    this.registrations = [
      this.buildRegistration({
        id: 'reg-demo-1',
        eventId: 'evt-product-night',
        userId: attendee.id,
        status: 'confirmed',
        paymentProvider: 'free',
        quantity: 1,
        amountTotal: 0,
        stripeCheckoutSessionId: null,
        stripePaymentStatus: 'free',
        createdAt: new Date('2026-03-10T09:30:00.000Z'),
        updatedAt: new Date('2026-03-10T09:30:00.000Z'),
      }),
    ];

    this.comments = [
      this.buildComment({
        id: 'cmt-demo-1',
        eventId: 'evt-product-night',
        authorId: attendee.id,
        content: 'Looking forward to this one. Bringing two product friends with me.',
        createdAt: new Date('2026-03-11T08:45:00.000Z'),
      }),
    ];
  }

  findUserById(id: string) {
    const user = this.users.find((candidate) => candidate.id === id);
    return user ? this.cloneUser(user) : null;
  }

  findUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = this.users.find((candidate) => candidate.email === normalizedEmail);
    return user ? this.cloneUser(user) : null;
  }

  createUser(input: CreateUserInput) {
    const user = this.buildUser(input);
    this.users.push(user);
    return this.cloneUser(user);
  }

  updateUser(id: string, update: Partial<UserEntity>) {
    const user = this.users.find((candidate) => candidate.id === id);

    if (!user) {
      return null;
    }

    Object.assign(user, update);
    return this.cloneUser(user);
  }

  listEvents() {
    return this.events.map((event) => this.hydrateEvent(event));
  }

  findEventById(id: string) {
    const event = this.events.find((candidate) => candidate.id === id);
    return event ? this.hydrateEvent(event) : null;
  }

  createEvent(input: CreateEventInput) {
    const event = this.buildEvent(input);
    this.events.push(event);
    return this.hydrateEvent(event);
  }

  updateEvent(id: string, update: Partial<EventEntity>) {
    const event = this.events.find((candidate) => candidate.id === id);

    if (!event) {
      return null;
    }

    Object.assign(event, update);
    return this.hydrateEvent(event);
  }

  removeEvent(id: string) {
    const eventIndex = this.events.findIndex((candidate) => candidate.id === id);

    if (eventIndex === -1) {
      return false;
    }

    this.events.splice(eventIndex, 1);

    for (let index = this.comments.length - 1; index >= 0; index -= 1) {
      if (this.comments[index]?.eventId === id) {
        this.comments.splice(index, 1);
      }
    }

    for (let index = this.registrations.length - 1; index >= 0; index -= 1) {
      if (this.registrations[index]?.eventId === id) {
        this.registrations.splice(index, 1);
      }
    }

    return true;
  }

  listCommentsByEvent(eventId: string) {
    return this.comments
      .filter((comment) => comment.eventId === eventId)
      .map((comment) => this.hydrateComment(comment));
  }

  findCommentById(commentId: string) {
    const comment = this.comments.find((candidate) => candidate.id === commentId);
    return comment ? this.hydrateComment(comment) : null;
  }

  createComment(input: CreateCommentInput) {
    const comment = this.buildComment(input);
    this.comments.push(comment);
    return this.hydrateComment(comment);
  }

  updateComment(id: string, update: Partial<EventCommentEntity>) {
    const comment = this.comments.find((candidate) => candidate.id === id);

    if (!comment) {
      return null;
    }

    Object.assign(comment, update);
    return this.hydrateComment(comment);
  }

  removeComment(id: string) {
    const idsToDelete = new Set(
      this.comments
        .filter((comment) => comment.id === id || comment.parentCommentId === id)
        .map((comment) => comment.id),
    );

    for (let index = this.comments.length - 1; index >= 0; index -= 1) {
      if (idsToDelete.has(this.comments[index]!.id)) {
        this.comments.splice(index, 1);
      }
    }
  }

  listRegistrationsByUser(userId: string) {
    return this.registrations
      .filter((registration) => registration.userId === userId)
      .map((registration) => this.hydrateRegistration(registration));
  }

  listRegistrationsByEvent(eventId: string, statuses?: RegistrationStatus[]) {
    return this.registrations
      .filter(
        (registration) =>
          registration.eventId === eventId &&
          (!statuses || statuses.includes(registration.status)),
      )
      .map((registration) => this.hydrateRegistration(registration));
  }

  findRegistrationByEventAndUser(eventId: string, userId: string) {
    const registration = this.registrations.find(
      (candidate) => candidate.eventId === eventId && candidate.userId === userId,
    );

    return registration ? this.hydrateRegistration(registration) : null;
  }

  findRegistrationBySessionId(sessionId: string, userId: string) {
    const registration = this.registrations.find(
      (candidate) =>
        candidate.stripeCheckoutSessionId === sessionId && candidate.userId === userId,
    );

    return registration ? this.hydrateRegistration(registration) : null;
  }

  createRegistration(input: CreateRegistrationInput) {
    const registration = this.buildRegistration(input);
    this.registrations.push(registration);
    return this.hydrateRegistration(registration);
  }

  updateRegistration(id: string, update: Partial<EventRegistrationEntity>) {
    const registration = this.registrations.find((candidate) => candidate.id === id);

    if (!registration) {
      return null;
    }

    Object.assign(registration, update, { updatedAt: new Date() });
    return this.hydrateRegistration(registration);
  }

  private buildUser(input: CreateUserInput): UserEntity {
    return {
      id: input.id ?? `usr-${randomUUID()}`,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      refreshTokenHash: input.refreshTokenHash ?? null,
      interests: input.interests ?? [],
      createdAt: input.createdAt ?? new Date(),
      events: [],
      registrations: [],
      comments: [],
    };
  }

  private buildEvent(input: CreateEventInput): EventEntity {
    return {
      id: input.id ?? `evt-${randomUUID()}`,
      title: input.title,
      description: input.description,
      category: input.category,
      city: input.city,
      posterUrl: input.posterUrl ?? null,
      startsAt: input.startsAt,
      price: input.price ?? 0,
      capacity: input.capacity ?? 50,
      hideAttendeeNames: input.hideAttendeeNames ?? false,
      commentsClosed: input.commentsClosed ?? false,
      organizerId: input.organizerId ?? null,
      createdAt: input.createdAt ?? new Date(),
      organizer: null,
      registrations: [],
      comments: [],
    };
  }

  private buildRegistration(input: CreateRegistrationInput): EventRegistrationEntity {
    return {
      id: input.id ?? `reg-${randomUUID()}`,
      eventId: input.eventId,
      userId: input.userId,
      status: input.status,
      paymentProvider: input.paymentProvider,
      quantity: input.quantity ?? 1,
      amountTotal: input.amountTotal ?? 0,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
      stripePaymentStatus: input.stripePaymentStatus ?? null,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? input.createdAt ?? new Date(),
      event: null as never,
      user: null as never,
    };
  }

  private buildComment(input: CreateCommentInput): EventCommentEntity {
    return {
      id: input.id ?? `cmt-${randomUUID()}`,
      eventId: input.eventId,
      authorId: input.authorId,
      parentCommentId: input.parentCommentId ?? null,
      content: input.content,
      createdAt: input.createdAt ?? new Date(),
      event: null as never,
      author: null as never,
    };
  }

  private cloneUser(user: UserEntity): UserEntity {
    return {
      ...user,
      interests: [...user.interests],
      createdAt: new Date(user.createdAt),
      events: [],
      registrations: [],
      comments: [],
    };
  }

  private hydrateEvent(event: EventEntity): EventEntity {
    return {
      ...event,
      startsAt: new Date(event.startsAt),
      createdAt: new Date(event.createdAt),
      organizer: event.organizerId ? this.findUserById(event.organizerId) : null,
      registrations: [],
      comments: [],
    };
  }

  private hydrateComment(comment: EventCommentEntity): EventCommentEntity {
    return {
      ...comment,
      createdAt: new Date(comment.createdAt),
      event: this.findEventById(comment.eventId) as EventEntity,
      author: this.findUserById(comment.authorId) as UserEntity,
    };
  }

  private hydrateRegistration(
    registration: EventRegistrationEntity,
  ): EventRegistrationEntity {
    return {
      ...registration,
      createdAt: new Date(registration.createdAt),
      updatedAt: new Date(registration.updatedAt),
      event: this.findEventById(registration.eventId) as EventEntity,
      user: this.findUserById(registration.userId) as UserEntity,
    };
  }
}
