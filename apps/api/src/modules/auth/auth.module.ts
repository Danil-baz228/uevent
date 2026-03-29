import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { CompanyEntity } from '../companies/entities/company.entity';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/entities/user.entity';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([UserEntity, CompanyEntity])]
  : [];

@Module({
  imports: [...databaseImports, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

