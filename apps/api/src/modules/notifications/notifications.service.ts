import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { EventEntity } from '../events/entities/event.entity';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotificationEntity, NotificationType } from './entities/notification.entity';

type CreateNotificationInput = {
  userId: string;
  eventId?: string | null;
  companyId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity> | undefined,
    @Optional()
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository:
      | Repository<EventRegistrationEntity>
      | undefined,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
  ) {}

  async create(input: CreateNotificationInput) {
    if (!this.notificationsRepository) {
      return this.inMemoryData.createNotification({
        userId: input.userId,
        eventId: input.eventId ?? null,
        companyId: input.companyId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        isRead: false,
      });
    }

    return this.notificationsRepository.save(
      this.notificationsRepository.create({
        userId: input.userId,
        eventId: input.eventId ?? null,
        companyId: input.companyId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        isRead: false,
      }),
    );
  }

  async findMine(userId: string) {
    await this.processDueReminders(userId);

    if (!this.notificationsRepository) {
      return this.inMemoryData
        .listNotificationsByUser(userId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .map((notification) => this.serialize(notification));
    }

    const notifications = await this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => this.serialize(notification));
  }

  async markAsRead(notificationId: string, userId: string) {
    if (!this.notificationsRepository) {
      const notification = this.inMemoryData.findNotificationById(notificationId);

      if (!notification) {
        throw new NotFoundException('Notification was not found');
      }

      if (notification.userId !== userId) {
        throw new ForbiddenException('You can update only your own notifications');
      }

      const savedNotification = this.inMemoryData.updateNotification(notificationId, {
        isRead: true,
      });

      if (!savedNotification) {
        throw new NotFoundException('Notification was not found');
      }

      return this.serialize(savedNotification);
    }

    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification was not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can update only your own notifications');
    }

    notification.isRead = true;
    const savedNotification = await this.notificationsRepository.save(notification);
    return this.serialize(savedNotification);
  }

  async markAllAsRead(userId: string) {
    if (!this.notificationsRepository) {
      this.inMemoryData.markAllNotificationsAsRead(userId);
      return { message: 'Notifications marked as read' };
    }

    await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
    return { message: 'Notifications marked as read' };
  }

  async clearAll(userId: string) {
    if (!this.notificationsRepository) {
      this.inMemoryData.clearAllNotifications(userId);
      return { message: 'Notifications cleared' };
    }

    await this.notificationsRepository.delete({ userId });
    return { message: 'Notifications cleared' };
  }

  async notifyRegistrationConfirmed(userId: string, event: EventEntity) {
    return this.create({
      userId,
      eventId: event.id,
      companyId: event.companyId ?? null,
      type: 'registration_confirmed',
      title: 'Registration confirmed',
      body: `You are registered for ${event.title}.`,
    });
  }

  async notifyPaymentConfirmed(userId: string, event: EventEntity) {
    return this.create({
      userId,
      eventId: event.id,
      companyId: event.companyId ?? null,
      type: 'payment_confirmed',
      title: 'Payment confirmed',
      body: `Your ticket for ${event.title} is confirmed.`,
    });
  }

  async notifyNewAttendee(
    organizerId: string | null,
    event: EventEntity,
    attendeeName: string,
    attendeeId: string,
  ) {
    if (!organizerId || organizerId === attendeeId || !event.notifyOnNewAttendee) {
      return null;
    }

    return this.create({
      userId: organizerId,
      eventId: event.id,
      companyId: event.companyId ?? null,
      type: 'new_attendee',
      title: 'New attendee joined',
      body: `${attendeeName} registered for ${event.title}.`,
    });
  }

  async notifyNewComment(
    organizerId: string | null,
    event: EventEntity,
    authorName: string,
    authorId: string,
  ) {
    if (!organizerId || organizerId === authorId) {
      return null;
    }

    return this.create({
      userId: organizerId,
      eventId: event.id,
      companyId: event.companyId ?? null,
      type: 'new_comment',
      title: 'New comment on your event',
      body: `${authorName} commented on ${event.title}.`,
    });
  }

  async notifyCompanyNewsPublished(
    company: { id: string; name: string },
    newsTitle: string,
    actorId?: string | null,
  ) {
    const subscriberIds = await this.findSubscribedUserIds(company.id, actorId);

    await Promise.all(
      subscriberIds.map((userId) =>
        this.create({
          userId,
          companyId: company.id,
          type: 'company_news',
          title: 'New organizer update',
          body: `${company.name} shared update: ${newsTitle}.`,
        }),
      ),
    );
  }

  async notifyCompanyEventPublished(
    company: { id: string; name: string },
    event: EventEntity,
    actorId?: string | null,
  ) {
    const subscriberIds = await this.findSubscribedUserIds(company.id, actorId);

    await Promise.all(
      subscriberIds.map((userId) =>
        this.create({
          userId,
          eventId: event.id,
          companyId: company.id,
          type: 'company_event',
          title: 'New event from organizer',
          body: `${company.name} published a new event: ${event.title}.`,
        }),
      ),
    );
  }

  async notifyEventReminder(userId: string, event: EventEntity) {
    return this.create({
      userId,
      eventId: event.id,
      companyId: event.companyId ?? null,
      type: 'event_reminder',
      title: 'Event reminder',
      body: `${event.title} starts on ${event.startsAt.toLocaleString('en-US')}.`,
    });
  }

  private serialize(notification: NotificationEntity) {
    return {
      id: notification.id,
      userId: notification.userId,
      eventId: notification.eventId,
      companyId: notification.companyId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  private async processDueReminders(userId: string) {
    const now = new Date();

    if (!this.registrationsRepository) {
      const dueRegistrations = this.inMemoryData
        .listRegistrationsByUser(userId)
        .filter(
          (registration) =>
            registration.status === 'confirmed' &&
            Boolean(
              registration.reminderAt &&
                registration.reminderAt.getTime() <= now.getTime() &&
                !registration.reminderSentAt,
            ),
        );

      for (const registration of dueRegistrations) {
        await this.notifyEventReminder(userId, registration.event);
        this.inMemoryData.updateRegistration(registration.id, {
          reminderSentAt: now,
        });
      }

      return;
    }

    const dueRegistrations = await this.registrationsRepository.find({
      where: {
        userId,
        status: 'confirmed',
      },
      relations: { event: true },
    });

    for (const registration of dueRegistrations) {
      if (
        !registration.reminderAt ||
        registration.reminderAt.getTime() > now.getTime() ||
        registration.reminderSentAt
      ) {
        continue;
      }

      await this.notifyEventReminder(userId, registration.event);
      registration.reminderSentAt = now;
      await this.registrationsRepository.save(registration);
    }
  }

  private async findSubscribedUserIds(
    companyId: string,
    excludeUserId?: string | null,
  ) {
    if (!this.usersRepository) {
      return this.inMemoryData
        .listUsers()
        .filter((user) => (user.subscribedCompanyIds ?? []).includes(companyId))
        .filter((user) => user.id !== excludeUserId)
        .map((user) => user.id);
    }

    const users = await this.usersRepository.find({
      where: {
        subscribedCompanyIds: ArrayContains([companyId]),
      },
    });

    return users.filter((user) => user.id !== excludeUserId).map((user) => user.id);
  }
}
