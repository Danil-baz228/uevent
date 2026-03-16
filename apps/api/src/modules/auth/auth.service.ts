import { Injectable } from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    return {
      message: 'Registration flow scaffolded',
      user: {
        id: 'usr_demo',
        email: dto.email,
        displayName: dto.displayName,
      },
    };
  }

  login(dto: LoginDto) {
    return {
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
      user: {
        id: 'usr_demo',
        email: dto.email,
        displayName: 'Starter User',
      },
    };
  }
}
