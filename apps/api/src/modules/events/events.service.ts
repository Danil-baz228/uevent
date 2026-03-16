import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateEventDto } from './dto/create-event.dto';

const starterEvents = [
  {
    id: 'evt_product-night',
    title: 'Product Night for Curious Builders',
    category: 'Networking',
    city: 'Kharkiv',
    startsAt: '2026-04-08T18:30:00.000Z',
    price: 0,
  },
  {
    id: 'evt_design-jam',
    title: 'Design Jam for Community Organizers',
    category: 'Workshop',
    city: 'Kyiv',
    startsAt: '2026-04-12T16:00:00.000Z',
    price: 15,
  },
];

@Injectable()
export class EventsService {
  findAll() {
    return starterEvents;
  }

  findOne(id: string) {
    const event = starterEvents.find((item) => item.id === id);

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found`);
    }

    return event;
  }

  create(dto: CreateEventDto) {
    return {
      id: `evt_${dto.title.toLowerCase().replace(/\s+/g, '-')}`,
      ...dto,
      status: 'draft',
    };
  }
}
