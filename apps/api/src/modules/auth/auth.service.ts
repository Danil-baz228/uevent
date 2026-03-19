import {
  ConflictException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { InMemoryDataService } from '../in-memory-data/in-memory-data.service';
import { UserEntity } from '../users/entities/user.entity';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  hashPassword,
  verifyRefreshToken,
  verifyPassword,
} from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly inMemoryData: InMemoryDataService,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
  ) {}

  async register(dto: RegisterDto) {
    if (!this.usersRepository) {
      const existingUser = this.inMemoryData.findUserByEmail(dto.email);

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const savedUser = this.inMemoryData.createUser({
        email: dto.email,
        displayName: dto.displayName,
        passwordHash: hashPassword(dto.password),
        interests: ['networking', 'community', 'events'],
      });
      const refreshToken = createRefreshToken({
        sub: savedUser.id,
        email: savedUser.email,
      });

      this.inMemoryData.updateUser(savedUser.id, {
        refreshTokenHash: hashToken(refreshToken),
      });

      return {
        message: 'Registration completed',
        accessToken: createAccessToken({
          sub: savedUser.id,
          email: savedUser.email,
        }),
        refreshToken,
        user: this.serializeUser(savedUser),
      };
    }

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
    const refreshToken = createRefreshToken({
      sub: savedUser.id,
      email: savedUser.email,
    });

    await this.usersRepository.update(savedUser.id, {
      refreshTokenHash: hashToken(refreshToken),
    });

    return {
      message: 'Registration completed',
      accessToken: createAccessToken({
        sub: savedUser.id,
        email: savedUser.email,
      }),
      refreshToken,
      user: this.serializeUser(savedUser),
    };
  }

  async login(dto: LoginDto) {
    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserByEmail(dto.email);

      if (!user || !verifyPassword(dto.password, user.passwordHash)) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const refreshToken = createRefreshToken({
        sub: user.id,
        email: user.email,
      });

      this.inMemoryData.updateUser(user.id, {
        refreshTokenHash: hashToken(refreshToken),
      });

      return {
        accessToken: createAccessToken({
          sub: user.id,
          email: user.email,
        }),
        refreshToken,
        user: this.serializeUser(user),
      };
    }

    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const refreshToken = createRefreshToken({
      sub: user.id,
      email: user.email,
    });

    await this.usersRepository.update(user.id, {
      refreshTokenHash: hashToken(refreshToken),
    });

    return {
      accessToken: createAccessToken({
        sub: user.id,
        email: user.email,
      }),
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  async refresh(dto: RefreshTokenDto) {
    if (!this.usersRepository) {
      const payload = verifyRefreshToken(dto.refreshToken);
      const user = this.inMemoryData.findUserById(payload.sub);

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Refresh session is not available');
      }

      if (user.refreshTokenHash !== hashToken(dto.refreshToken)) {
        throw new UnauthorizedException('Refresh token was revoked');
      }

      const nextRefreshToken = createRefreshToken({
        sub: user.id,
        email: user.email,
      });

      this.inMemoryData.updateUser(user.id, {
        refreshTokenHash: hashToken(nextRefreshToken),
      });

      return {
        accessToken: createAccessToken({
          sub: user.id,
          email: user.email,
        }),
        refreshToken: nextRefreshToken,
        user: this.serializeUser(user),
      };
    }

    const payload = verifyRefreshToken(dto.refreshToken);
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session is not available');
    }

    if (user.refreshTokenHash !== hashToken(dto.refreshToken)) {
      throw new UnauthorizedException('Refresh token was revoked');
    }

    const nextRefreshToken = createRefreshToken({
      sub: user.id,
      email: user.email,
    });

    await this.usersRepository.update(user.id, {
      refreshTokenHash: hashToken(nextRefreshToken),
    });

    return {
      accessToken: createAccessToken({
        sub: user.id,
        email: user.email,
      }),
      refreshToken: nextRefreshToken,
      user: this.serializeUser(user),
    };
  }

  async logout(dto: LogoutDto) {
    if (!this.usersRepository) {
      const payload = verifyRefreshToken(dto.refreshToken);
      const user = this.inMemoryData.findUserById(payload.sub);

      if (!user || !user.refreshTokenHash) {
        return { message: 'Logout completed' };
      }

      if (user.refreshTokenHash === hashToken(dto.refreshToken)) {
        this.inMemoryData.updateUser(user.id, {
          refreshTokenHash: null,
        });
      }

      return { message: 'Logout completed' };
    }

    const payload = verifyRefreshToken(dto.refreshToken);
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      return { message: 'Logout completed' };
    }

    if (user.refreshTokenHash === hashToken(dto.refreshToken)) {
      await this.usersRepository.update(user.id, {
        refreshTokenHash: null,
      });
    }

    return { message: 'Logout completed' };
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
