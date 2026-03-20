import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { EventRegistrationEntity } from './entities/event-registration.entity';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([EventEntity, EventRegistrationEntity])]
  : [];

@Module({
  imports: [...databaseImports, NotificationsModule, UsersModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
