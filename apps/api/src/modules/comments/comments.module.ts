import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CommentsService } from './comments.service';
import { EventCommentEntity } from './entities/event-comment.entity';

const databaseImports = isDatabaseEnabled
  ? [
      TypeOrmModule.forFeature([
        EventCommentEntity,
        EventEntity,
        EventRegistrationEntity,
        UserEntity,
      ]),
    ]
  : [];

@Module({
  imports: [...databaseImports, NotificationsModule],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
