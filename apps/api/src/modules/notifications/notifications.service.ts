import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationEntity, NotificationType } from './entities/notification.entity';

type CreateNotificationInput = {
  userId: string;
  eventId?: string | null;
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
  ) {}

  async create(input: CreateNotificationInput) {
    if (!this.notificationsRepository) {
      return this.inMemoryData.createNotification({
        userId: input.userId,
        eventId: input.eventId ?? null,
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
        type: input.type,
        title: input.title,
        body: input.body,
        isRead: false,
      }),
    );
  }

  async findMine(userId: string) {
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
      type: 'registration_confirmed',
      title: 'Registration confirmed',
      body: `You are registered for ${event.title}.`,
    });
  }

  async notifyPaymentConfirmed(userId: string, event: EventEntity) {
    return this.create({
      userId,
      eventId: event.id,
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
    if (!organizerId || organizerId === attendeeId) {
      return null;
    }

    return this.create({
      userId: organizerId,
      eventId: event.id,
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
      type: 'new_comment',
      title: 'New comment on your event',
      body: `${authorName} commented on ${event.title}.`,
    });
  }

  private serialize(notification: NotificationEntity) {
    return {
      id: notification.id,
      userId: notification.userId,
      eventId: notification.eventId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
