import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { CommentsModule } from '../comments/comments.module';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { EventsController } from './events.controller';
import { EventEntity } from './entities/event.entity';
import { EventsService } from './events.service';
import { UserEntity } from '../users/entities/user.entity';

const databaseImports = isDatabaseEnabled
  ? [
      TypeOrmModule.forFeature([
        EventEntity,
        UserEntity,
        CompanyEntity,
        EventCommentEntity,
        EventRegistrationEntity,
      ]),
    ]
  : [];

@Module({
  imports: [
    ...databaseImports,
    RegistrationsModule,
    CommentsModule,
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
