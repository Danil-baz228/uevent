import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsController } from './events.controller';
import { EventEntity } from './entities/event.entity';
import { EventsService } from './events.service';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, UserEntity])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
