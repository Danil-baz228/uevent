import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hashPassword } from '../auth/auth.utils';
import { CompanyNewsEntity } from '../companies/entities/company-news.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { AttendeeVisibility, EventEntity } from '../events/entities/event.entity';
import { UserEntity } from '../users/entities/user.entity';

type StarterEvent = {
  title: string;
  description: string;
  category: string;
  format: string;
  theme: string;
  city: string;
  startsAt: Date;
  publishAt: Date | null;
  price: number;
  capacity: number;
  attendeeVisibility: AttendeeVisibility;
  notifyOnNewAttendee: boolean;
  commentAccess: EventEntity['commentAccess'];
};

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity>,
    @InjectRepository(CompanyNewsEntity)
    private readonly companyNewsRepository: Repository<CompanyNewsEntity>,
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async onApplicationBootstrap() {
    let organizer = await this.usersRepository.findOne({
      where: { email: 'demo@uevent.local' },
    });

    if (!organizer) {
      organizer = await this.usersRepository.save(
        this.usersRepository.create({
          email: 'demo@uevent.local',
          displayName: 'Community Host',
          passwordHash: hashPassword('demo12345'),
          interests: ['networking', 'design jams', 'community meetups'],
        }),
      );
    }

    const existingEvents = await this.eventsRepository.count();
    let company = await this.companiesRepository.findOne({
      where: { ownerId: organizer.id, name: 'Uevent Community' },
    });

    if (!company) {
      company = await this.companiesRepository.save(
        this.companiesRepository.create({
          ownerId: organizer.id,
          name: 'Uevent Community',
          email: 'team@uevent.local',
          location: 'Kharkiv',
          description: 'Seeded company profile for demo events.',
        }),
      );
    }

    const existingNews = await this.companyNewsRepository.count({
      where: { companyId: company.id },
    });

    if (existingNews === 0) {
      await this.companyNewsRepository.save(
        this.companyNewsRepository.create({
          companyId: company.id,
          authorId: organizer.id,
          title: 'Spring season is open',
          content:
            'We are preparing a new set of local meetups and workshops for builders, designers, and creative teams.',
        }),
      );
    }

    if (existingEvents > 0) {
      return;
    }

    const starterEvents: StarterEvent[] = [
      {
        title: 'Product Night for Curious Builders',
        description:
          'A community meetup for product people, developers, and founders who want to exchange ideas and meet like-minded builders.',
        category: 'Networking',
        format: 'Meetup',
        theme: 'Startups',
        city: 'Kharkiv',
        startsAt: new Date('2026-04-08T18:30:00.000Z'),
        publishAt: null,
        price: 0,
        capacity: 90,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
      },
      {
        title: 'Design Jam for Community Organizers',
        description:
          'A collaborative workshop for designers and organizers building better local events and community touchpoints.',
        category: 'Workshop',
        format: 'Workshop',
        theme: 'Community',
        city: 'Kyiv',
        startsAt: new Date('2026-04-12T16:00:00.000Z'),
        publishAt: null,
        price: 15,
        capacity: 45,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
      },
      {
        title: 'Sound and Code Meetup',
        description:
          'An evening for developers, musicians, and creative technologists exploring playful projects at the intersection of audio and software.',
        category: 'Meetup',
        format: 'Meetup',
        theme: 'Technology',
        city: 'Lviv',
        startsAt: new Date('2026-04-19T19:15:00.000Z'),
        publishAt: null,
        price: 0,
        capacity: 70,
        attendeeVisibility: 'everyone',
        notifyOnNewAttendee: true,
        commentAccess: 'everyone',
      },
    ];

    await this.eventsRepository.save(
      starterEvents.map((event) =>
        this.eventsRepository.create({
          ...event,
          organizerId: organizer.id,
          companyId: company.id,
        }),
      ),
    );
  }
}
