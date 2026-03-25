import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateCompanyNewsDto } from './dto/create-company-news.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyNewsEntity } from './entities/company-news.entity';
import { CompanyEntity } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    private readonly notificationsService: NotificationsService,
    @Optional()
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyNewsEntity)
    private readonly companyNewsRepository: Repository<CompanyNewsEntity> | undefined,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
  ) {}

  async create(ownerId: string, dto: CreateCompanyDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedName = dto.name.trim();

    if (!this.companiesRepository) {
      const owner = this.inMemoryData.findUserById(ownerId);

      if (!owner) {
        throw new NotFoundException('Owner was not found');
      }

      const existing = this.inMemoryData
        .listCompaniesByOwner(ownerId)
        .find((company) => company.name.toLowerCase() === normalizedName.toLowerCase());

      if (existing) {
        throw new ConflictException('Company with this name already exists');
      }

      return this.serializeCompany(
        this.inMemoryData.createCompany({
          ownerId,
          name: normalizedName,
          email: normalizedEmail,
          location: dto.location.trim(),
          description: dto.description?.trim() || null,
        }),
      );
    }

    const existing = await this.companiesRepository.findOne({
      where: {
        ownerId,
        name: normalizedName,
      },
    });

    if (existing) {
      throw new ConflictException('Company with this name already exists');
    }

    const company = await this.companiesRepository.save(
      this.companiesRepository.create({
        ownerId,
        name: normalizedName,
        email: normalizedEmail,
        location: dto.location.trim(),
        description: dto.description?.trim() || null,
      }),
    );

    return this.serializeCompany(company);
  }

  async findAll() {
    if (!this.companiesRepository) {
      return this.inMemoryData
        .listCompanies()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((company) =>
          this.serializeCompanyListItem({
            ...company,
            events: this.inMemoryData
              .listEvents()
              .filter((event) => event.companyId === company.id),
            news: this.inMemoryData.listCompanyNewsByCompany(company.id),
          }),
        );
    }

    const companies = await this.companiesRepository.find({
      relations: { events: true, news: { author: true } },
      order: { createdAt: 'DESC' },
    });

    return companies
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((company) => this.serializeCompanyListItem(company));
  }

  async findMine(ownerId: string) {
    if (!this.companiesRepository) {
      return this.inMemoryData
        .listCompaniesByOwner(ownerId)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .map((company) => this.serializeCompany(company));
    }

    const companies = await this.companiesRepository.find({
      where: { ownerId },
      order: { createdAt: 'ASC' },
    });

    return companies.map((company) => this.serializeCompany(company));
  }

  async findOne(companyId: string, viewerId?: string | null) {
    if (!this.companiesRepository || !this.companyNewsRepository) {
      const company = this.inMemoryData.findCompanyById(companyId);

      if (!company) {
        throw new NotFoundException('Company was not found');
      }

      const events = this.inMemoryData
        .listEvents()
        .filter(
          (event) =>
            event.companyId === companyId &&
            (this.isEventPublished(event) || company.ownerId === viewerId),
        )
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
      const news = this.inMemoryData
        .listCompanyNewsByCompany(companyId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

      return {
        ...this.serializeCompany(company),
        owner: company.owner
          ? {
              id: company.owner.id,
              displayName: company.owner.displayName,
              email: company.owner.email,
            }
          : null,
        canManage: company.ownerId === viewerId,
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          city: event.city,
          startsAt: event.startsAt,
          publishAt: event.publishAt,
          isPublished: this.isEventPublished(event),
          price: Number(event.price),
          posterUrl: event.posterUrl,
          category: event.category,
        })),
        news: news.map((item) => this.serializeCompanyNews(item)),
      };
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
      relations: { owner: true, events: true, news: { author: true } },
    });

    if (!company) {
      throw new NotFoundException('Company was not found');
    }

    const events = (company.events ?? [])
      .filter(
        (event) => this.isEventPublished(event) || (viewerId && company.ownerId === viewerId),
      )
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
    const news = (company.news ?? []).sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );

    return {
      ...this.serializeCompany(company),
      owner: company.owner
        ? {
            id: company.owner.id,
            displayName: company.owner.displayName,
            email: company.owner.email,
          }
        : null,
      canManage: company.ownerId === viewerId,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        city: event.city,
        startsAt: event.startsAt,
        publishAt: event.publishAt,
        isPublished: this.isEventPublished(event),
        price: Number(event.price),
        posterUrl: event.posterUrl,
        category: event.category,
      })),
      news: news.map((item) => this.serializeCompanyNews(item)),
    };
  }

  async update(companyId: string, ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.findOwnedByUser(companyId, ownerId);

    if (!this.companiesRepository) {
      const updatedCompany = this.inMemoryData.updateCompany(companyId, {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.location !== undefined ? { location: dto.location.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      });

      if (!updatedCompany) {
        throw new NotFoundException('Company was not found');
      }

      return this.serializeCompany(updatedCompany);
    }

    if (dto.name !== undefined) {
      company.name = dto.name.trim();
    }

    if (dto.email !== undefined) {
      company.email = dto.email.trim().toLowerCase();
    }

    if (dto.location !== undefined) {
      company.location = dto.location.trim();
    }

    if (dto.description !== undefined) {
      company.description = dto.description.trim() || null;
    }

    const savedCompany = await this.companiesRepository.save(company);
    return this.serializeCompany(savedCompany);
  }

  async createNews(companyId: string, ownerId: string, dto: CreateCompanyNewsDto) {
    const company = await this.findOwnedByUser(companyId, ownerId);

    if (!this.companyNewsRepository) {
      const newsItem = this.inMemoryData.createCompanyNews({
          companyId: company.id,
          authorId: ownerId,
          title: dto.title.trim(),
          content: dto.content.trim(),
        });

      await this.notificationsService.notifyCompanyNewsPublished(
        company,
        newsItem.title,
        ownerId,
      );

      return this.serializeCompanyNews(newsItem);
    }

    const newsItem = await this.companyNewsRepository.save(
      this.companyNewsRepository.create({
        companyId: company.id,
        authorId: ownerId,
        title: dto.title.trim(),
        content: dto.content.trim(),
      }),
    );

    const hydratedNews = await this.companyNewsRepository.findOne({
      where: { id: newsItem.id },
      relations: { author: true },
    });

    if (!hydratedNews) {
      throw new NotFoundException('Company news was not found');
    }

    await this.notificationsService.notifyCompanyNewsPublished(
      company,
      hydratedNews.title,
      ownerId,
    );

    return this.serializeCompanyNews(hydratedNews);
  }

  async subscribeToNotifications(companyId: string, userId: string) {
    await this.ensureCompanyExists(companyId);

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      const subscribedCompanyIds = Array.from(
        new Set([...(user.subscribedCompanyIds ?? []), companyId]),
      );

      this.inMemoryData.updateUser(userId, { subscribedCompanyIds });

      return {
        companyId,
        isSubscribed: true,
      };
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.subscribedCompanyIds = Array.from(
      new Set([...(user.subscribedCompanyIds ?? []), companyId]),
    );
    await this.usersRepository.save(user);

    return {
      companyId,
      isSubscribed: true,
    };
  }

  async unsubscribeFromNotifications(companyId: string, userId: string) {
    await this.ensureCompanyExists(companyId);

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      const subscribedCompanyIds = (user.subscribedCompanyIds ?? []).filter(
        (currentCompanyId) => currentCompanyId !== companyId,
      );

      this.inMemoryData.updateUser(userId, { subscribedCompanyIds });

      return {
        companyId,
        isSubscribed: false,
      };
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.subscribedCompanyIds = (user.subscribedCompanyIds ?? []).filter(
      (currentCompanyId) => currentCompanyId !== companyId,
    );
    await this.usersRepository.save(user);

    return {
      companyId,
      isSubscribed: false,
    };
  }

  async findOwnedByUser(companyId: string, ownerId: string) {
    if (!this.companiesRepository) {
      const company = this.inMemoryData.findCompanyById(companyId);

      if (!company || company.ownerId !== ownerId) {
        throw new NotFoundException('Company was not found');
      }

      return company;
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId, ownerId },
      relations: { owner: true },
    });

    if (!company) {
      throw new NotFoundException('Company was not found');
    }

    return company;
  }

  serializeCompany(company: CompanyEntity) {
    return {
      id: company.id,
      name: company.name,
      email: company.email,
      location: company.location,
      description: company.description,
      ownerId: company.ownerId,
      createdAt: company.createdAt,
    };
  }

  private async ensureCompanyExists(companyId: string) {
    if (!this.companiesRepository) {
      const company = this.inMemoryData.findCompanyById(companyId);

      if (!company) {
        throw new NotFoundException('Company was not found');
      }

      return company;
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company was not found');
    }

    return company;
  }

  private serializeCompanyListItem(company: CompanyEntity) {
    const events = (company.events ?? []).filter((event) => this.isEventPublished(event));
    const latestNews = [...(company.news ?? [])]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

    return {
      ...this.serializeCompany(company),
      eventsCount: events.length,
      latestNews: latestNews ? this.serializeCompanyNews(latestNews) : null,
    };
  }

  private serializeCompanyNews(newsItem: CompanyNewsEntity) {
    return {
      id: newsItem.id,
      companyId: newsItem.companyId,
      title: newsItem.title,
      content: newsItem.content,
      createdAt: newsItem.createdAt,
      author: newsItem.author
        ? {
            id: newsItem.author.id,
            displayName: newsItem.author.displayName,
            email: newsItem.author.email,
          }
        : null,
    };
  }

  private isEventPublished(event: { publishAt: Date | null }) {
    return !event.publishAt || event.publishAt.getTime() <= Date.now();
  }
}
