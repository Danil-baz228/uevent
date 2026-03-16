import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      service: 'uevent-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
