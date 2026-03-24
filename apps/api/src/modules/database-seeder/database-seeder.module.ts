import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyNewsEntity } from '../companies/entities/company-news.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { UserEntity } from '../users/entities/user.entity';
import { EventEntity } from '../events/entities/event.entity';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CompanyEntity, CompanyNewsEntity, EventEntity])],
  providers: [DatabaseSeederService],
})
export class DatabaseSeederModule {}
