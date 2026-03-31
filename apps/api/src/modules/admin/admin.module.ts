import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { CompanyNewsEntity } from '../companies/entities/company-news.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { EventEntity } from '../events/entities/event.entity';
import { InMemoryDataModule } from '../in-memory-data/in-memory-data.module';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    InMemoryDataModule,
    TypeOrmModule.forFeature([
      UserEntity,
      EventEntity,
      CompanyEntity,
      CompanyNewsEntity,
      EventCommentEntity,
      EventRegistrationEntity,
      NotificationEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
