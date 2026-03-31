import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventCommentEntity } from '../comments/entities/event-comment.entity';
import { CompanyNewsEntity } from '../companies/entities/company-news.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { EventEntity } from '../events/entities/event.entity';
import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { EventRegistrationEntity } from '../registrations/entities/event-registration.entity';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
    @Optional()
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyNewsEntity)
    private readonly companyNewsRepository: Repository<CompanyNewsEntity> | undefined,
    @Optional()
    @InjectRepository(EventCommentEntity)
    private readonly commentsRepository: Repository<EventCommentEntity> | undefined,
    @Optional()
    @InjectRepository(EventRegistrationEntity)
    private readonly registrationsRepository:
      | Repository<EventRegistrationEntity>
      | undefined,
    @Optional()
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository:
      | Repository<NotificationEntity>
      | undefined,
  ) {}

  async getOverview(userId: string) {
    await this.ensureAdmin(userId);

    if (
      !this.usersRepository ||
      !this.eventsRepository ||
      !this.companiesRepository ||
      !this.commentsRepository
    ) {
      return {
        usersCount: this.inMemoryData.listUsers().length,
        eventsCount: this.inMemoryData.listEvents().length,
        companiesCount: this.inMemoryData.listCompanies().length,
        commentsCount: this.inMemoryData.listComments().length,
      };
    }

    const [usersCount, eventsCount, companiesCount, commentsCount] = await Promise.all([
      this.usersRepository.count(),
      this.eventsRepository.count(),
      this.companiesRepository.count(),
      this.commentsRepository.count(),
    ]);

    return {
      usersCount,
      eventsCount,
      companiesCount,
      commentsCount,
    };
  }

  async listUsers(userId: string) {
    await this.ensureAdmin(userId);

    if (!this.usersRepository) {
      return this.inMemoryData.listUsers().map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        interests: user.interests,
        subscribedCompanyIds: user.subscribedCompanyIds ?? [],
        isAdmin: user.isAdmin || this.isAdminEmail(user.email),
        companiesCount: this.inMemoryData.listCompaniesByOwner(user.id).length,
        createdAt: user.createdAt,
      }));
    }

    const users = await this.usersRepository.find({
      relations: { companies: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      interests: user.interests,
      subscribedCompanyIds: user.subscribedCompanyIds ?? [],
      isAdmin: user.isAdmin || this.isAdminEmail(user.email),
      companiesCount: user.companies?.length ?? 0,
      createdAt: user.createdAt,
    }));
  }

  async promoteUser(id: string, userId: string) {
    await this.ensureAdmin(userId);

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(id);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      this.inMemoryData.updateUser(id, { isAdmin: true });
      return { message: 'User promoted to admin' };
    }

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.isAdmin = true;
    await this.usersRepository.save(user);
    return { message: 'User promoted to admin' };
  }

  async revokeUser(id: string, userId: string) {
    const currentAdmin = await this.ensureAdmin(userId);

    if (currentAdmin.id === id) {
      throw new ForbiddenException('You cannot revoke your own admin access');
    }

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(id);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      this.inMemoryData.updateUser(id, { isAdmin: false });
      return { message: 'Admin access revoked' };
    }

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.isAdmin = false;
    await this.usersRepository.save(user);
    return { message: 'Admin access revoked' };
  }

  async removeUser(id: string, userId: string) {
    const currentAdmin = await this.ensureAdmin(userId);

    if (currentAdmin.id === id) {
      throw new ForbiddenException('You cannot delete your own account from admin panel');
    }

    if (!this.usersRepository) {
      throw new ForbiddenException('Deleting users requires database mode');
    }

    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    const ownedCompanies = await (this.companiesRepository?.find({
      where: { ownerId: id },
    }) ?? Promise.resolve([]));

    for (const company of ownedCompanies) {
      await this.removeCompany(company.id, userId);
    }

    if (this.eventsRepository) {
      await this.eventsRepository
        .createQueryBuilder()
        .update(EventEntity)
        .set({ organizerId: null })
        .where('organizerId = :organizerId', { organizerId: id })
        .execute();
    }

    if (this.notificationsRepository) {
      await this.notificationsRepository.delete({ userId: id });
    }

    if (this.commentsRepository) {
      await this.commentsRepository.delete({ authorId: id });
    }

    if (this.registrationsRepository) {
      await this.registrationsRepository.delete({ userId: id });
    }

    if (this.companyNewsRepository) {
      await this.companyNewsRepository.delete({ authorId: id });
    }

    await this.usersRepository.delete({ id });
    return { message: 'User deleted' };
  }

  async listEvents(userId: string) {
    await this.ensureAdmin(userId);

    if (!this.eventsRepository) {
      return this.inMemoryData.listEvents().map((event) => ({
        id: event.id,
        title: event.title,
        city: event.city,
        startsAt: event.startsAt,
        publishAt: event.publishAt,
        price: Number(event.price),
        company: event.company
          ? {
              id: event.company.id,
              name: event.company.name,
            }
          : null,
        organizer: event.organizer
          ? {
              id: event.organizer.id,
              displayName: event.organizer.displayName,
              email: event.organizer.email,
            }
          : null,
      }));
    }

    const events = await this.eventsRepository.find({
      relations: { organizer: true, company: true },
      order: { createdAt: 'DESC' },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      city: event.city,
      startsAt: event.startsAt,
      publishAt: event.publishAt,
      price: Number(event.price),
      company: event.company
        ? {
            id: event.company.id,
            name: event.company.name,
          }
        : null,
      organizer: event.organizer
        ? {
            id: event.organizer.id,
            displayName: event.organizer.displayName,
            email: event.organizer.email,
          }
        : null,
    }));
  }

  async listCompanies(userId: string) {
    await this.ensureAdmin(userId);

    if (!this.companiesRepository) {
      return this.inMemoryData.listCompanies().map((company) => ({
        id: company.id,
        name: company.name,
        email: company.email,
        location: company.location,
        owner: company.owner
          ? {
              id: company.owner.id,
              displayName: company.owner.displayName,
              email: company.owner.email,
            }
          : null,
        eventsCount: this.inMemoryData.listEvents().filter((event) => event.companyId === company.id)
          .length,
        newsCount: this.inMemoryData.listCompanyNewsByCompany(company.id).length,
        createdAt: company.createdAt,
      }));
    }

    const [companies, events, news] = await Promise.all([
      this.companiesRepository.find({
        relations: { owner: true },
        order: { createdAt: 'DESC' },
      }),
      this.eventsRepository?.find() ?? [],
      this.companyNewsRepository?.find() ?? [],
    ]);

    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.email,
      location: company.location,
      owner: company.owner
        ? {
            id: company.owner.id,
            displayName: company.owner.displayName,
            email: company.owner.email,
          }
        : null,
      eventsCount: events.filter((event) => event.companyId === company.id).length,
      newsCount: news.filter((item) => item.companyId === company.id).length,
      createdAt: company.createdAt,
    }));
  }

  async listComments(userId: string) {
    await this.ensureAdmin(userId);

    if (!this.commentsRepository) {
      return this.inMemoryData.listComments().map((comment) => ({
        id: comment.id,
        eventId: comment.eventId,
        eventTitle: comment.event?.title ?? 'Unknown event',
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        createdAt: comment.createdAt,
        author: comment.author
          ? {
              id: comment.author.id,
              displayName: comment.author.displayName,
              email: comment.author.email,
            }
          : null,
      }));
    }

    const comments = await this.commentsRepository.find({
      relations: { author: true, event: true },
      order: { createdAt: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      eventId: comment.eventId,
      eventTitle: comment.event?.title ?? 'Unknown event',
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
      author: comment.author
        ? {
            id: comment.author.id,
            displayName: comment.author.displayName,
            email: comment.author.email,
          }
        : null,
    }));
  }

  async removeEvent(id: string, userId: string) {
    await this.ensureAdmin(userId);

    if (!this.eventsRepository) {
      const removed = this.inMemoryData.removeEvent(id);

      if (!removed) {
        throw new NotFoundException('Event was not found');
      }

      return { message: 'Event deleted' };
    }

    const event = await this.eventsRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event was not found');
    }

    await this.eventsRepository.delete({ id });

    return { message: 'Event deleted' };
  }

  async removeCompany(id: string, userId: string) {
    await this.ensureAdmin(userId);

    if (!this.companiesRepository) {
      const removed = this.inMemoryData.removeCompany(id);

      if (!removed) {
        throw new NotFoundException('Company was not found');
      }

      return { message: 'Company deleted' };
    }

    const company = await this.companiesRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company was not found');
    }

    if (this.eventsRepository) {
      await this.eventsRepository
        .createQueryBuilder()
        .update(EventEntity)
        .set({ companyId: null })
        .where('companyId = :companyId', { companyId: id })
        .execute();
    }

    if (this.companyNewsRepository) {
      await this.companyNewsRepository.delete({ companyId: id });
    }

    await this.companiesRepository.delete({ id });

    return { message: 'Company deleted' };
  }

  async removeComment(id: string, userId: string) {
    await this.ensureAdmin(userId);

    if (!this.commentsRepository) {
      const comment = this.inMemoryData.findCommentById(id);

      if (!comment) {
        throw new NotFoundException('Comment was not found');
      }

      this.inMemoryData.removeComment(id);
      return { message: 'Comment deleted' };
    }

    const comment = await this.commentsRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment was not found');
    }

    await this.commentsRepository.delete({ parentCommentId: id });
    await this.commentsRepository.delete({ id });

    return { message: 'Comment deleted' };
  }

  private async ensureAdmin(userId: string) {
    const user = !this.usersRepository
      ? this.inMemoryData.findUserById(userId)
      : await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    if (!(user.isAdmin || this.isAdminEmail(user.email))) {
      throw new ForbiddenException('Admin access is required');
    }

    return user;
  }

  private isAdminEmail(email: string) {
    const configuredAdmins = (this.configService.get<string>('ADMIN_EMAILS', '') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (configuredAdmins.length === 0) {
      return true;
    }

    return configuredAdmins.includes(email.toLowerCase());
  }
}
