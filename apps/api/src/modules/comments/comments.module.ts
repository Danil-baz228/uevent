import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventEntity } from '../events/entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CommentsService } from './comments.service';
import { EventCommentEntity } from './entities/event-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventCommentEntity, EventEntity, UserEntity])],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
