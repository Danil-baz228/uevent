import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
  ) {}

  async getCurrentUser(userId: string) {
    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user) {
        throw new NotFoundException('User was not found');
      }

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        interests: user.interests,
        createdAt: user.createdAt,
      };
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      interests: user.interests,
      createdAt: user.createdAt,
    };
  }
}
