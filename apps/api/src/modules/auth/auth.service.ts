import {
  BadRequestException,
  ConflictException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';

import { CompanyEntity } from '../companies/entities/company.entity';
import { MailService } from '../mail/mail.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
    private readonly configService: ConfigService,
    private readonly inMemoryData: InMemoryDataService,
    private readonly mailService: MailService,
    @Optional()
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity> | undefined,
    @Optional()
    @InjectRepository(CompanyEntity)
    private readonly companiesRepository: Repository<CompanyEntity> | undefined,
  ) {}

  getGoogleAuthUrl() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl ?? 'http://localhost:4000/api/auth/google/callback');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return url.toString();
  }

  async loginWithGoogle(code: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl ?? 'http://localhost:4000/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenPayload.access_token) {
      throw new UnauthorizedException('Google access token was not returned');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Google profile request failed');
    }

    const profile = (await profileResponse.json()) as {
      email?: string;
      name?: string;
      given_name?: string;
    };

    if (!profile.email) {
      throw new UnauthorizedException('Google account email was not returned');
    }

    const email = profile.email.toLowerCase().trim();
    const displayName =
      profile.name?.trim() || profile.given_name?.trim() || email.split('@')[0]!;

    if (!this.usersRepository) {
      let user = this.inMemoryData.findUserByEmail(email);

      if (!user) {
        user = this.inMemoryData.createUser({
          email,
          displayName,
          passwordHash: hashPassword(randomUUID()),
          interests: ['networking', 'community', 'events'],
        });
      }

      const refreshToken = createRefreshToken({
        sub: user.id,
        email: user.email,
      });

      this.inMemoryData.updateUser(user.id, {
        displayName: user.displayName || displayName,
        refreshTokenHash: hashToken(refreshToken),
      });

      const savedUser = this.inMemoryData.findUserById(user.id) ?? user;

      return {
        accessToken: createAccessToken({
          sub: savedUser.id,
          email: savedUser.email,
        }),
        refreshToken,
        user: await this.serializeUser(savedUser),
      };
    }

    let user = await this.usersRepository.findOne({
      where: { email },
      relations: { companies: true },
    });

    if (!user) {
      user = await this.usersRepository.save(
        this.usersRepository.create({
          email,
          displayName,
          passwordHash: hashPassword(randomUUID()),
          interests: ['networking', 'community', 'events'],
        }),
      );
    }

    const refreshToken = createRefreshToken({
      sub: user.id,
      email: user.email,
    });

    user.refreshTokenHash = hashToken(refreshToken);

    if (!user.displayName?.trim()) {
      user.displayName = displayName;
    }

    const savedUser = await this.usersRepository.save(user);

    return {
      accessToken: createAccessToken({
        sub: savedUser.id,
        email: savedUser.email,
      }),
      refreshToken,
      user: await this.serializeUser(savedUser),
    };
  }

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
        user: await this.serializeUser(savedUser),
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
      user: await this.serializeUser(savedUser),
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
        user: await this.serializeUser(user),
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
      user: await this.serializeUser(user),
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
        user: await this.serializeUser(user),
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
      user: await this.serializeUser(user),
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

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const normalizedEmail = dto.newEmail.toLowerCase().trim();

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user || !verifyPassword(dto.password, user.passwordHash)) {
        throw new UnauthorizedException('Invalid password');
      }

      const existingUser = this.inMemoryData.findUserByEmail(normalizedEmail);

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('User with this email already exists');
      }

      const refreshToken = createRefreshToken({
        sub: user.id,
        email: normalizedEmail,
      });

      this.inMemoryData.updateUser(user.id, {
        email: normalizedEmail,
        refreshTokenHash: hashToken(refreshToken),
      });

      const updatedUser = this.inMemoryData.findUserById(user.id);

      if (!updatedUser) {
        throw new UnauthorizedException('User was not found');
      }

      return {
        message: 'Email updated',
        accessToken: createAccessToken({
          sub: updatedUser.id,
          email: updatedUser.email,
        }),
        refreshToken,
        user: await this.serializeUser(updatedUser),
      };
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid password');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('User with this email already exists');
    }

    user.email = normalizedEmail;
    const refreshToken = createRefreshToken({
      sub: user.id,
      email: normalizedEmail,
    });
    user.refreshTokenHash = hashToken(refreshToken);

    const savedUser = await this.usersRepository.save(user);

    return {
      message: 'Email updated',
      accessToken: createAccessToken({
        sub: savedUser.id,
        email: savedUser.email,
      }),
      refreshToken,
      user: await this.serializeUser(savedUser),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    if (!this.usersRepository) {
      const user = this.inMemoryData.findUserById(userId);

      if (!user || !verifyPassword(dto.currentPassword, user.passwordHash)) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      this.inMemoryData.updateUser(user.id, {
        passwordHash: hashPassword(dto.newPassword),
      });

      return { message: 'Password updated' };
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user || !verifyPassword(dto.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = hashPassword(dto.newPassword);
    await this.usersRepository.save(user);

    return { message: 'Password updated' };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:5173');

    if (!this.usersRepository) {
      // in-memory mode — silently succeed
      return { message: 'If this email is registered, a reset link has been sent' };
    }

    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If this email is registered, a reset link has been sent' };
    }

    const rawToken = randomUUID();
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;
    await this.usersRepository.save(user);

    const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, user.displayName, resetLink);

    return { message: 'If this email is registered, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    if (!this.usersRepository) {
      throw new BadRequestException('Password reset requires database mode');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.usersRepository.findOne({
      where: { passwordResetToken: tokenHash },
    });

    if (!user || !user.passwordResetTokenExpiresAt) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Password reset token has expired');
    }

    user.passwordHash = hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiresAt = null;
    user.refreshTokenHash = null; // invalidate all sessions
    await this.usersRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }

  private async serializeUser(user: UserEntity) {
    const companies = !this.companiesRepository
      ? this.inMemoryData
          .listCompaniesByOwner(user.id)
          .map((company) => ({
            id: company.id,
            name: company.name,
            email: company.email,
            location: company.location,
            description: company.description,
            ownerId: company.ownerId,
            createdAt: company.createdAt,
          }))
      : user.companies?.map((company) => ({
          id: company.id,
          name: company.name,
          email: company.email,
          location: company.location,
          description: company.description,
          ownerId: company.ownerId,
          createdAt: company.createdAt,
        })) ??
        (await this.companiesRepository.find({
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
        }));

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin || this.isAdminEmail(user.email),
      interests: user.interests,
      subscribedCompanyIds: user.subscribedCompanyIds ?? [],
      showAttendeeNameByDefault: user.showAttendeeNameByDefault ?? true,
      companies,
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
