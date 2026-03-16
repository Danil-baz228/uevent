import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from '../users/entities/user.entity';
import {
  createAccessToken,
  createRefreshToken,
  hashPassword,
  verifyPassword,
} from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      displayName: dto.displayName,
      passwordHash: hashPassword(dto.password),
      interests: ['networking', 'community', 'events'],
    });

    const savedUser = await this.usersRepository.save(user);

    return {
      message: 'Registration completed',
      accessToken: createAccessToken({
        sub: savedUser.id,
        email: savedUser.email,
      }),
      refreshToken: createRefreshToken({
        sub: savedUser.id,
        email: savedUser.email,
      }),
      user: this.serializeUser(savedUser),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: createAccessToken({
        sub: user.id,
        email: user.email,
      }),
      refreshToken: createRefreshToken({
        sub: user.id,
        email: user.email,
      }),
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      interests: user.interests,
      createdAt: user.createdAt,
    };
  }
}
