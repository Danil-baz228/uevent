import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RegistrationsModule } from '../registrations/registrations.module';

@Module({
  imports: [RegistrationsModule, NotificationsModule, UsersModule, MailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
