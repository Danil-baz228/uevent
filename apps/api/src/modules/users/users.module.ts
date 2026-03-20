import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from '../../config/database-mode';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

const databaseImports = isDatabaseEnabled
  ? [TypeOrmModule.forFeature([UserEntity])]
  : [];

@Module({
  imports: databaseImports,
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
