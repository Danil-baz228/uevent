import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
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

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        interests: updatedUser.interests,
        createdAt: updatedUser.createdAt,
      };
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    user.displayName = nextDisplayName || user.displayName;
    user.interests = nextInterests ?? user.interests;

    const savedUser = await this.usersRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      displayName: savedUser.displayName,
      interests: savedUser.interests,
      createdAt: savedUser.createdAt,
    };
  }
}
