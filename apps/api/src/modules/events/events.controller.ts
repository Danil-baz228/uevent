import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

import { CommentsService } from '../comments/comments.service';
import { CreateEventCommentDto } from '../comments/dto/create-event-comment.dto';
import { UpdateEventCommentDto } from '../comments/dto/update-event-comment.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { FindEventsDto } from './dto/find-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';
import { verifyAccessToken } from '../auth/auth.utils';
import { UPLOADS_ROOT } from '../../utils/paths';

const uploadDirectory = UPLOADS_ROOT;
mkdirSync(uploadDirectory, { recursive: true });

function buildPosterFilename(
  _: unknown,
  file: { originalname: string },
  callback: (error: Error | null, filename: string) => void,
) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  callback(null, `poster-${suffix}${extname(file.originalname)}`);
}

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  findAll(@Query() query: FindEventsDto) {
    return this.eventsService.findAll(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/scheduled')
  findScheduled(@CurrentUser() user: { sub: string }) {
    return this.eventsService.findScheduledByOrganizer(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;
    const viewerId = token
      ? (() => {
          try {
            return verifyAccessToken(token).sub;
          } catch {
            return null;
          }
        })()
      : null;

    return this.eventsService.findOne(id, viewerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: uploadDirectory,
        filename: buildPosterFilename,
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (
        _request,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const isAllowed = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);

        if (!isAllowed) {
          callback(
            new Error('Only PNG, JPG, JPEG, and WEBP images are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateEventDto,
    @UploadedFile()
    poster: { filename: string } | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    const posterUrl = poster ? `/uploads/${poster.filename}` : dto.posterUrl;

    return this.eventsService.create({ ...dto, posterUrl }, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('poster', {
      storage: diskStorage({
        destination: uploadDirectory,
        filename: buildPosterFilename,
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (
        _request,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const isAllowed = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);

        if (!isAllowed) {
          callback(
            new Error('Only PNG, JPG, JPEG, and WEBP images are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @UploadedFile()
    poster: { filename: string } | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    const posterUrl = poster ? `/uploads/${poster.filename}` : dto.posterUrl;

    return this.eventsService.update(id, { ...dto, posterUrl }, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.eventsService.remove(id, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateEventCommentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.commentsService.create(id, dto, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':eventId/comments/:commentId')
  updateComment(
    @Param('eventId') eventId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateEventCommentDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.commentsService.update(eventId, commentId, dto, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':eventId/comments/:commentId')
  removeComment(
    @Param('eventId') eventId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.commentsService.remove(eventId, commentId, user.sub);
  }
}
