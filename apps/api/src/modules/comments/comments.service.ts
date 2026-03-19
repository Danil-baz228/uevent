import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventEntity } from '../events/entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateEventCommentDto } from './dto/create-event-comment.dto';
import { UpdateEventCommentDto } from './dto/update-event-comment.dto';
import { EventCommentEntity } from './entities/event-comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(EventCommentEntity)
    private readonly commentsRepository: Repository<EventCommentEntity>,
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(eventId: string, dto: CreateEventCommentDto, authorId: string) {
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
