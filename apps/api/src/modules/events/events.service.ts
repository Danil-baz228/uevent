import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEventDto } from './dto/create-event.dto';
import { EventEntity } from './entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAll() {
    const events = await this.eventsRepository.find({
      relations: { organizer: true },
      order: { startsAt: 'ASC' },
    });

    return events.map((event) => this.serializeEvent(event));
  }

  async findOne(id: string) {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    return this.serializeEvent(event);
  }

  async create(dto: CreateEventDto, organizerId: string) {
    const organizer = await this.usersRepository.findOne({
      where: { id: organizerId },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer was not found');
    }

    const event = this.eventsRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      city: dto.city,
      startsAt: new Date(dto.startsAt),
      price: dto.price ?? 0,
      capacity: dto.capacity ?? 50,
      organizerId: organizer.id,
    });

    const savedEvent = await this.eventsRepository.save(event);
    const hydratedEvent = await this.eventsRepository.findOne({
      where: { id: savedEvent.id },
      relations: { organizer: true },
    });

    if (!hydratedEvent) {
      throw new NotFoundException('Saved event could not be loaded');
    }

    return this.serializeEvent(hydratedEvent);
  }

  private serializeEvent(event: EventEntity) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      city: event.city,
      startsAt: event.startsAt,
      price: Number(event.price),
      capacity: event.capacity,
      organizer: event.organizer
        ? {
            id: event.organizer.id,
            displayName: event.organizer.displayName,
            email: event.organizer.email,
          }
        : null,
      createdAt: event.createdAt,
    };
  }
}
