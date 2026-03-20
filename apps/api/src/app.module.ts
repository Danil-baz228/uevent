import 'dotenv/config';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from './config/database-mode';
import { validateEnvironment } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { EventCommentEntity } from './modules/comments/entities/event-comment.entity';
import { DatabaseSeederModule } from './modules/database-seeder/database-seeder.module';
import { EventEntity } from './modules/events/entities/event.entity';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationEntity } from './modules/notifications/entities/notification.entity';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventRegistrationEntity } from './modules/registrations/entities/event-registration.entity';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { InMemoryDataModule } from './modules/in-memory-data/in-memory-data.module';
import { UserEntity } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';

const databaseImports = isDatabaseEnabled
  ? [
      TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres' as const,
          host: configService.get<string>('DATABASE_HOST'),
          port: Number(configService.get<number>('DATABASE_PORT')),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          entities: [
            UserEntity,
            EventEntity,
            EventRegistrationEntity,
            EventCommentEntity,
            NotificationEntity,
          ],
          synchronize: false,
        }),
      }),
    ]
  : [];

const seederImports = isDatabaseEnabled ? [DatabaseSeederModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    InMemoryDataModule,
    ...databaseImports,
    ...seederImports,
    HealthModule,
    AuthModule,
    CommentsModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
