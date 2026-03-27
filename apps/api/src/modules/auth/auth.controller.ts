import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google/login')
  googleLogin(@Res() res: any) {
    res.redirect(this.authService.getGoogleAuthUrl());
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Res() res: any,
  ) {
    const appOrigin =
      this.configService
        .get<string>('APP_ORIGIN', 'http://localhost:5173')
        .split(',')[0]
        ?.trim() || 'http://localhost:5173';

    if (!code) {
      res.redirect(`${appOrigin}/auth?googleError=missing_code`);
      return;
    }

    try {
      const payload = await this.authService.loginWithGoogle(code);
      const redirectUrl = new URL('/auth', appOrigin);

      redirectUrl.searchParams.set('social', 'google');
      redirectUrl.searchParams.set('accessToken', payload.accessToken);
      redirectUrl.searchParams.set('refreshToken', payload.refreshToken);
      redirectUrl.searchParams.set(
        'user',
        Buffer.from(JSON.stringify(payload.user), 'utf8').toString('base64url'),
      );

      res.redirect(redirectUrl.toString());
    } catch {
      res.redirect(`${appOrigin}/auth?googleError=auth_failed`);
    }
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-email')
  changeEmail(
    @CurrentUser() user: { sub: string },
    @Body() dto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: { sub: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }
}
