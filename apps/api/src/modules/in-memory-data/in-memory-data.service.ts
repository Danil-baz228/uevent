import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { hashPassword } from '../auth/auth.utils';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { CompanyNewsEntity } from '../companies/entities/company-news.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationEntity, NotificationType } from '../notifications/entities/notification.entity';
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
  subscribedCompanyIds?: string[];
  isAdmin?: boolean;
  createdAt?: Date;
};

type CreateEventInput = {
  id?: string;
  title: string;
  description: string;
  category: string;
  format: string;
  theme: string;
  city: string;
  address?: string | null;
  posterUrl?: string | null;
  startsAt: Date;
  publishAt?: Date | null;
  redirectAfterPurchaseUrl?: string | null;
  price?: number;
  promoCodes?: EventEntity['promoCodes'];
  capacity?: number;
  hideAttendeeNames?: boolean;
  attendeeVisibility?: EventEntity['attendeeVisibility'];
  notifyOnNewAttendee?: boolean;
  commentAccess?: EventEntity['commentAccess'];
  commentsClosed?: boolean;
  commentsClosedByAdmin?: boolean;
  organizerId?: string | null;
  companyId?: string | null;
  createdAt?: Date;
};

type CreateCompanyInput = {
  id?: string;
  name: string;
  email: string;
  location: string;
  description?: string | null;
  ownerId: string;
  createdAt?: Date;
};

type CreateCompanyNewsInput = {
  id?: string;
  companyId: string;
  authorId: string;
  title: string;
  content: string;
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
  reminderAt?: Date | null;
  reminderSentAt?: Date | null;
  showAttendeeName?: boolean;
  ticketAssetPath?: string | null;
  paymentReceiptPreviewPath?: string | null;
  paymentReceiptMessageId?: string | null;
  paymentReceiptSentAt?: Date | null;
  checkedInAt?: Date | null;
  checkedInByUserId?: string | null;
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

type CreateNotificationInput = {
  id?: string;
  userId: string;
  eventId?: string | null;
  companyId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  isRead?: boolean;
  createdAt?: Date;
};

@Injectable()
export class InMemoryDataService {
  private readonly users: UserEntity[];
  private readonly events: EventEntity[];
  private readonly companies: CompanyEntity[];
  private readonly companyNews: CompanyNewsEntity[];
  private readonly registrations: EventRegistrationEntity[];
  private readonly comments: EventCommentEntity[];
  private readonly notifications: NotificationEntity[];

  constructor() {
    const organizer = this.buildUser({
      id: 'usr-organizer-demo',
      email: 'organizer@uevent.local',
      displayName: 'Mila Organizer',
      passwordHash: hashPassword('demo12345'),
      interests: ['networking', 'community', 'events'],
      isAdmin: true,
      createdAt: new Date('2026-02-11T09:00:00.000Z'),
    });

    const attendee = this.buildUser({
      id: 'usr-attendee-demo',
      email: 'guest@uevent.local',
      displayName: 'Alex Guest',
      passwordHash: hashPassword('demo12345'),
      interests: ['design', 'music', 'meetups'],
      isAdmin: false,
      createdAt: new Date('2026-02-18T12:00:00.000Z'),
    });

    this.users = [organizer, attendee];
    this.companies = [
      this.buildCompany({
        id: 'cmp-demo-main',
        name: 'Uevent Community',
        email: 'team@uevent.local',
        location: 'Kharkiv',
        description: 'Demo organizer company for seeded events.',
        ownerId: organizer.id,
        createdAt: new Date('2026-02-20T10:00:00.000Z'),
      }),
    ];

    this.events = [
      this.buildEvent({
        id: 'evt-product-night',
        title: 'Product Night for Curious Builders',
        description:
          'A live evening for founders, PMs, and developers who want to test ideas and meet future collaborators.',
        category: 'Networking',
        format: 'Meetup',
        theme: 'Startups',
        city: 'Kharkiv',
        address: '61002, Sumska Street 40, Kharkiv',
        startsAt: new Date('2026-04-08T15:30:00.000Z'),
        publishAt: null,
        redirectAfterPurchaseUrl: '/account',
        price: 0,
        promoCodes: [],
        capacity: 120,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
        commentsClosedByAdmin: false,
        organizerId: organizer.id,
        companyId: 'cmp-demo-main',
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
      }),
      this.buildEvent({
        id: 'evt-design-jam',
        title: 'Design Jam for Community Organizers',
        description:
          'Hands-on workshop about event flows, volunteer onboarding, and building stronger local communities.',
        category: 'Workshop',
        format: 'Workshop',
        theme: 'Community',
        city: 'Kyiv',
        address: '01001, Khreshchatyk Street 22, Kyiv',
        startsAt: new Date('2026-04-12T13:00:00.000Z'),
        publishAt: null,
        redirectAfterPurchaseUrl: '/account',
        price: 15,
        promoCodes: [{ code: 'SPRING20', discountPercent: 20 }],
        capacity: 60,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
        commentsClosedByAdmin: false,
        organizerId: organizer.id,
        companyId: 'cmp-demo-main',
        createdAt: new Date('2026-03-02T11:00:00.000Z'),
      }),
      this.buildEvent({
        id: 'evt-sound-and-code',
        title: 'Sound and Code Meetup',
        description:
          'An evening for creative coders and sound artists exploring performance, tooling, and collaboration.',
        category: 'Meetup',
        format: 'Meetup',
        theme: 'Technology',
        city: 'Lviv',
        address: '79000, Rynok Square 1, Lviv',
        startsAt: new Date('2026-04-19T16:15:00.000Z'),
        publishAt: null,
        redirectAfterPurchaseUrl: '/account',
        price: 0,
        promoCodes: [],
        capacity: 80,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
        commentsClosedByAdmin: false,
        organizerId: organizer.id,
        companyId: 'cmp-demo-main',
        createdAt: new Date('2026-03-03T12:00:00.000Z'),
      }),
    ];

    this.companyNews = [
      this.buildCompanyNews({
        id: 'news-demo-1',
        companyId: 'cmp-demo-main',
        authorId: organizer.id,
        title: 'Spring season is open',
        content:
          'We are preparing a new set of local meetups and workshops for builders, designers, and creative teams.',
        createdAt: new Date('2026-03-05T10:30:00.000Z'),
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
        reminderAt: null,
        reminderSentAt: null,
        showAttendeeName: true,
        ticketAssetPath: null,
        paymentReceiptPreviewPath: null,
        paymentReceiptMessageId: null,
        paymentReceiptSentAt: null,
        checkedInAt: null,
        checkedInByUserId: null,
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

    this.notifications = [
      this.buildNotification({
        id: 'ntf-demo-1',
        userId: attendee.id,
        eventId: 'evt-product-night',
        type: 'registration_confirmed',
        title: 'Registration confirmed',
        body: 'You are registered for Product Night for Curious Builders.',
        isRead: false,
        createdAt: new Date('2026-03-11T09:00:00.000Z'),
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

  listUsers() {
    return this.users.map((user) => this.cloneUser(user));
  }

  updateUser(id: string, update: Partial<UserEntity>) {
    const user = this.users.find((candidate) => candidate.id === id);

    if (!user) {
      return null;
    }

    Object.assign(user, update);
    return this.cloneUser(user);
  }

  listCompaniesByOwner(ownerId: string) {
    return this.companies
      .filter((company) => company.ownerId === ownerId)
      .map((company) => this.hydrateCompany(company));
  }

  listCompanies() {
    return this.companies.map((company) => this.hydrateCompany(company));
  }

  findCompanyById(id: string) {
    const company = this.companies.find((candidate) => candidate.id === id);
    return company ? this.hydrateCompany(company) : null;
  }

  createCompany(input: CreateCompanyInput) {
    const company = this.buildCompany(input);
    this.companies.push(company);
    return this.hydrateCompany(company);
  }

  updateCompany(id: string, update: Partial<CompanyEntity>) {
    const company = this.companies.find((candidate) => candidate.id === id);

    if (!company) {
      return null;
    }

    Object.assign(company, update);
    return this.hydrateCompany(company);
  }

  listCompanyNewsByCompany(companyId: string) {
    return this.companyNews
      .filter((item) => item.companyId === companyId)
      .map((item) => this.hydrateCompanyNews(item));
  }

  listCompanyNews() {
    return this.companyNews.map((item) => this.hydrateCompanyNews(item));
  }

  createCompanyNews(input: CreateCompanyNewsInput) {
    const newsItem = this.buildCompanyNews(input);
    this.companyNews.push(newsItem);
    return this.hydrateCompanyNews(newsItem);
  }

  removeCompany(id: string) {
    const companyIndex = this.companies.findIndex((candidate) => candidate.id === id);

    if (companyIndex === -1) {
      return false;
    }

    this.companies.splice(companyIndex, 1);

    for (let index = this.companyNews.length - 1; index >= 0; index -= 1) {
      if (this.companyNews[index]?.companyId === id) {
        this.companyNews.splice(index, 1);
      }
    }

    for (const event of this.events) {
      if (event.companyId === id) {
        event.companyId = null;
      }
    }

    return true;
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

  listComments() {
    return this.comments.map((comment) => this.hydrateComment(comment));
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

  listNotificationsByUser(userId: string) {
    return this.notifications
      .filter((notification) => notification.userId === userId)
      .map((notification) => this.cloneNotification(notification));
  }

  findNotificationById(id: string) {
    const notification = this.notifications.find((candidate) => candidate.id === id);
    return notification ? this.cloneNotification(notification) : null;
  }

  createNotification(input: CreateNotificationInput) {
    const notification = this.buildNotification(input);
    this.notifications.push(notification);
    return this.cloneNotification(notification);
  }

  updateNotification(id: string, update: Partial<NotificationEntity>) {
    const notification = this.notifications.find((candidate) => candidate.id === id);

    if (!notification) {
      return null;
    }

    Object.assign(notification, update);
    return this.cloneNotification(notification);
  }

  markAllNotificationsAsRead(userId: string) {
    for (const notification of this.notifications) {
      if (notification.userId === userId) {
        notification.isRead = true;
      }
    }
  }

  clearAllNotifications(userId: string) {
    for (let index = this.notifications.length - 1; index >= 0; index -= 1) {
      if (this.notifications[index]?.userId === userId) {
        this.notifications.splice(index, 1);
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
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
      interests: input.interests ?? [],
      subscribedCompanyIds: input.subscribedCompanyIds ?? [],
      isAdmin: input.isAdmin ?? false,
      createdAt: input.createdAt ?? new Date(),
      events: [],
      companies: [],
      companyNews: [],
      registrations: [],
      comments: [],
      notifications: [],
    };
  }

  private buildEvent(input: CreateEventInput): EventEntity {
    return {
      id: input.id ?? `evt-${randomUUID()}`,
      title: input.title,
      description: input.description,
      category: input.category,
      format: input.format,
      theme: input.theme,
      city: input.city,
      address: input.address ?? null,
      posterUrl: input.posterUrl ?? null,
      startsAt: input.startsAt,
      publishAt: input.publishAt ?? null,
      redirectAfterPurchaseUrl: input.redirectAfterPurchaseUrl ?? null,
      price: input.price ?? 0,
      promoCodes: input.promoCodes ?? [],
      capacity: input.capacity ?? 50,
      hideAttendeeNames: input.hideAttendeeNames ?? false,
      attendeeVisibility: input.attendeeVisibility ?? 'everyone',
      notifyOnNewAttendee: input.notifyOnNewAttendee ?? true,
      commentAccess: input.commentAccess ?? 'everyone',
      commentsClosed:
        input.commentsClosed ?? (input.commentAccess ? input.commentAccess === 'closed' : false),
      commentsClosedByAdmin: input.commentsClosedByAdmin ?? false,
      organizerId: input.organizerId ?? null,
      companyId: input.companyId ?? null,
      createdAt: input.createdAt ?? new Date(),
      organizer: null,
      company: null,
      registrations: [],
      comments: [],
    };
  }

  private buildCompany(input: CreateCompanyInput): CompanyEntity {
    return {
      id: input.id ?? `cmp-${randomUUID()}`,
      name: input.name,
      email: input.email.toLowerCase(),
      location: input.location,
      description: input.description ?? null,
      ownerId: input.ownerId,
      createdAt: input.createdAt ?? new Date(),
      owner: null as never,
      events: [],
      news: [],
    };
  }

  private buildCompanyNews(input: CreateCompanyNewsInput): CompanyNewsEntity {
    return {
      id: input.id ?? `cnews-${randomUUID()}`,
      companyId: input.companyId,
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      createdAt: input.createdAt ?? new Date(),
      company: null as never,
      author: null as never,
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
      reminderAt: input.reminderAt ?? null,
      reminderSentAt: input.reminderSentAt ?? null,
      showAttendeeName: input.showAttendeeName ?? true,
      ticketAssetPath: input.ticketAssetPath ?? null,
      paymentReceiptPreviewPath: input.paymentReceiptPreviewPath ?? null,
      paymentReceiptMessageId: input.paymentReceiptMessageId ?? null,
      paymentReceiptSentAt: input.paymentReceiptSentAt ?? null,
      checkedInAt: input.checkedInAt ?? null,
      checkedInByUserId: input.checkedInByUserId ?? null,
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

  private buildNotification(input: CreateNotificationInput): NotificationEntity {
    return {
      id: input.id ?? `ntf-${randomUUID()}`,
      userId: input.userId,
      eventId: input.eventId ?? null,
      companyId: input.companyId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      isRead: input.isRead ?? false,
      createdAt: input.createdAt ?? new Date(),
      user: null as never,
      event: null,
      company: null,
    };
  }

  private cloneUser(user: UserEntity): UserEntity {
    return {
      ...user,
      interests: [...user.interests],
      subscribedCompanyIds: [...(user.subscribedCompanyIds ?? [])],
      createdAt: new Date(user.createdAt),
      events: [],
      companies: [],
      companyNews: [],
      registrations: [],
      comments: [],
      notifications: [],
    };
  }

  private cloneNotification(notification: NotificationEntity): NotificationEntity {
    return {
      ...notification,
      createdAt: new Date(notification.createdAt),
      event: notification.eventId ? (this.findEventById(notification.eventId) as EventEntity) : null,
      company: notification.companyId
        ? (this.findCompanyById(notification.companyId) as CompanyEntity)
        : null,
      user: this.findUserById(notification.userId) as UserEntity,
    };
  }

  private hydrateEvent(event: EventEntity): EventEntity {
    return {
      ...event,
      startsAt: new Date(event.startsAt),
      publishAt: event.publishAt ? new Date(event.publishAt) : null,
      createdAt: new Date(event.createdAt),
      organizer: event.organizerId ? this.findUserById(event.organizerId) : null,
      company: event.companyId ? this.findCompanyById(event.companyId) : null,
      registrations: [],
      comments: [],
    };
  }

  private hydrateCompany(company: CompanyEntity): CompanyEntity {
    return {
      ...company,
      createdAt: new Date(company.createdAt),
      owner: this.findUserById(company.ownerId) as UserEntity,
      events: [],
      news: [],
    };
  }

  private hydrateCompanyNews(newsItem: CompanyNewsEntity): CompanyNewsEntity {
    return {
      ...newsItem,
      createdAt: new Date(newsItem.createdAt),
      company: this.findCompanyById(newsItem.companyId) as CompanyEntity,
      author: this.findUserById(newsItem.authorId) as UserEntity,
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
      reminderAt: registration.reminderAt ? new Date(registration.reminderAt) : null,
      reminderSentAt: registration.reminderSentAt
        ? new Date(registration.reminderSentAt)
        : null,
      showAttendeeName: registration.showAttendeeName,
      ticketAssetPath: registration.ticketAssetPath ?? null,
      paymentReceiptPreviewPath: registration.paymentReceiptPreviewPath ?? null,
      paymentReceiptMessageId: registration.paymentReceiptMessageId ?? null,
      paymentReceiptSentAt: registration.paymentReceiptSentAt
        ? new Date(registration.paymentReceiptSentAt)
        : null,
      checkedInAt: registration.checkedInAt
        ? new Date(registration.checkedInAt)
        : null,
      checkedInByUserId: registration.checkedInByUserId ?? null,
      event: this.findEventById(registration.eventId) as EventEntity,
      user: this.findUserById(registration.userId) as UserEntity,
    };
  }
}
