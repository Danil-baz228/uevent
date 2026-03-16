import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getCurrentUser() {
    return {
      id: 'usr_demo',
      email: 'demo@uevent.local',
      displayName: 'Starter User',
      interests: ['tech meetups', 'design jams', 'local communities'],
    };
  }
}
