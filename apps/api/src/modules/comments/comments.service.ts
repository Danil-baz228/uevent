import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { EventEntity } from '../events/entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateEventCommentDto } from './dto/create-event-comment.dto';
import { UpdateEventCommentDto } from './dto/update-event-comment.dto';
import { EventCommentEntity } from './entities/event-comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(EventCommentEntity)
    private readonly commentsRepository: Repository<EventCommentEntity> | undefined,
    @Optional()
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity> | undefined,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
  ) {}

  async create(eventId: string, dto: CreateEventCommentDto, authorId: string) {
    if (!this.commentsRepository || !this.eventsRepository || !this.usersRepository) {
      const event = this.inMemoryData.findEventById(eventId);
      const author = this.inMemoryData.findUserById(authorId);

      if (!event) {
        throw new NotFoundException(`Event ${eventId} was not found`);
      }

      if (!author) {
        throw new NotFoundException('Author was not found');
      }

      if (event.commentsClosed) {
        throw new BadRequestException('Comments are closed for this event');
      }

      if (dto.parentCommentId) {
        const parentComment = this.inMemoryData.findCommentById(dto.parentCommentId);

        if (!parentComment || parentComment.eventId !== eventId) {
          throw new NotFoundException('Parent comment was not found');
        }
      }

      const savedComment = this.inMemoryData.createComment({
        eventId,
        authorId,
        parentCommentId: dto.parentCommentId ?? null,
        content: dto.content.trim(),
      });

      return this.serializeComment(savedComment);
    }

    const [event, author] = await Promise.all([
      this.eventsRepository.findOne({ where: { id: eventId } }),
      this.usersRepository.findOne({ where: { id: authorId } }),
    ]);

    if (!event) {
      throw new NotFoundException(`Event ${eventId} was not found`);
    }

    if (!author) {
      throw new NotFoundException('Author was not found');
    }

    if (event.commentsClosed) {
      throw new BadRequestException('Comments are closed for this event');
    }

    if (dto.parentCommentId) {
      const parentComment = await this.commentsRepository.findOne({
        where: { id: dto.parentCommentId, eventId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment was not found');
      }
    }

    const savedComment = await this.commentsRepository.save(
      this.commentsRepository.create({
        eventId,
        authorId,
        parentCommentId: dto.parentCommentId ?? null,
        content: dto.content.trim(),
      }),
    );

    const comment = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Saved comment could not be loaded');
    }

    return this.serializeComment(comment);
  }

  async update(
    eventId: string,
    commentId: string,
    dto: UpdateEventCommentDto,
    authorId: string,
  ) {
    if (!this.commentsRepository) {
      const comment = this.inMemoryData.findCommentById(commentId);

      if (!comment || comment.eventId !== eventId) {
        throw new NotFoundException('Comment was not found');
      }

      if (comment.authorId !== authorId) {
        throw new ForbiddenException('You can edit only your own comments');
      }

      const savedComment = this.inMemoryData.updateComment(comment.id, {
        content: dto.content.trim(),
      });

      if (!savedComment) {
        throw new NotFoundException('Comment was not found');
      }

      return this.serializeComment(savedComment);
    }

    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, eventId },
      relations: { author: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment was not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can edit only your own comments');
    }

    comment.content = dto.content.trim();
    const savedComment = await this.commentsRepository.save(comment);

    return this.serializeComment(savedComment);
  }

  async remove(eventId: string, commentId: string, authorId: string) {
    if (!this.commentsRepository) {
      const comment = this.inMemoryData.findCommentById(commentId);

      if (!comment || comment.eventId !== eventId) {
        throw new NotFoundException('Comment was not found');
      }

      if (comment.authorId !== authorId) {
        throw new ForbiddenException('You can delete only your own comments');
      }

      this.inMemoryData.removeComment(commentId);

      return { message: 'Comment deleted' };
    }

    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, eventId },
    });

    if (!comment) {
      throw new NotFoundException('Comment was not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can delete only your own comments');
    }

    await this.commentsRepository.delete({ parentCommentId: commentId });
    await this.commentsRepository.delete({ id: commentId });

    return { message: 'Comment deleted' };
  }

  serializeComment(comment: EventCommentEntity) {
    return {
      id: comment.id,
      eventId: comment.eventId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        displayName: comment.author.displayName,
        email: comment.author.email,
      },
    };
  }
}
