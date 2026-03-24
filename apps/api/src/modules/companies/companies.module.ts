import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyNewsEntity } from './entities/company-news.entity';
import { CompanyEntity } from './entities/company.entity';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([CompanyEntity, CompanyNewsEntity])]
  : [];

@Module({
  imports: databaseImports,
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
