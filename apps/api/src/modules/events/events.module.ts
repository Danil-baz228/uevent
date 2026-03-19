import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentsModule } from '../comments/comments.module';
import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { RegistrationsModule } from '../registrations/registrations.module';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { EventsController } from './events.controller';
import { EventEntity } from './entities/event.entity';
import { EventsService } from './events.service';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      UserEntity,
      EventCommentEntity,
      EventRegistrationEntity,
    ]),
    RegistrationsModule,
    CommentsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
