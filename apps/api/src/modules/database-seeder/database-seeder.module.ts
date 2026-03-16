import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../users/entities/user.entity';
import { EventEntity } from '../events/entities/event.entity';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, EventEntity])],
  providers: [DatabaseSeederService],
})
export class DatabaseSeederModule {}
