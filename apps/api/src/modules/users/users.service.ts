import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompanyEntity } from '../companies/entities/company.entity';
import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    private readonly configService: ConfigService,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity> | undefined,
  ) {}

  async getCurrentUser(userId: string) {
    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      return this.serializeUser(user);
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { companies: true },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    return this.serializeUser(user);
  }

  async updateCurrentUser(userId: string, dto: UpdateCurrentUserDto) {
    const nextDisplayName = dto.displayName?.trim();
    const nextInterests = dto.interests
      ?.map((interest) => interest.trim())
      .filter((interest) => interest.length > 0);

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      this.inMemoryData.updateUser(userId, {
        displayName: nextDisplayName || user.displayName,
        interests: nextInterests ?? user.interests,
      });

      const updatedUser = this.inMemoryData.findUserById(userId);

      if (!updatedUser) {
        throw new NotFoundException('User was not found');
      }

      return this.serializeUser(updatedUser);
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { companies: true },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.displayName = nextDisplayName || user.displayName;
    user.interests = nextInterests ?? user.interests;

    const savedUser = await this.usersRepository.save(user);

    return this.serializeUser(savedUser);
  }

  private async serializeUser(user: UserEntity) {
    const companies = !this.companiesRepository
      ? this.inMemoryData.listCompaniesByOwner(user.id).map((company) => ({
          id: company.id,
          name: company.name,
          email: company.email,
          location: company.location,
          description: company.description,
          ownerId: company.ownerId,
          createdAt: company.createdAt,
        }))
      : (user.companies ?? []).map((company) => ({
          id: company.id,
          name: company.name,
          email: company.email,
          location: company.location,
          description: company.description,
          ownerId: company.ownerId,
          createdAt: company.createdAt,
        })) ??
        [];

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin || this.isAdminEmail(user.email),
      interests: user.interests,
      subscribedCompanyIds: user.subscribedCompanyIds ?? [],
      companies:
        !this.companiesRepository || (user.companies ?? []).length > 0
          ? companies
          : (await this.companiesRepository.find({
              where: { ownerId: user.id },
              order: { createdAt: 'ASC' },
            })).map((company) => ({
              id: company.id,
              name: company.name,
              email: company.email,
              location: company.location,
              description: company.description,
              ownerId: company.ownerId,
              createdAt: company.createdAt,
            })),
      createdAt: user.createdAt,
    };
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
