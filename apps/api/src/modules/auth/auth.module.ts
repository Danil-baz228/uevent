import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/entities/user.entity';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([UserEntity])]
  : [];

@Module({
  imports: databaseImports,
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
