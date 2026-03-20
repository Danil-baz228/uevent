import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([NotificationEntity, EventRegistrationEntity])]
  : [];

@Module({
  imports: databaseImports,
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
