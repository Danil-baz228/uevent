import 'dotenv/config';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { isDatabaseEnabled } from './config/database-mode';
import { validateEnvironment } from './config/env.validation';
import { createDatabaseOptions } from './database/database.config';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DatabaseSeederModule } from './modules/database-seeder/database-seeder.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { InMemoryDataModule } from './modules/in-memory-data/in-memory-data.module';
import { UsersModule } from './modules/users/users.module';

const databaseImports = isDatabaseEnabled
  ? [
      TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const databaseUrl = configService.get<string>('DATABASE_URL');

          return createDatabaseOptions({
            url: databaseUrl,
            host: databaseUrl ? undefined : configService.getOrThrow<string>('DATABASE_HOST'),
            port: databaseUrl
              ? undefined
              : Number(configService.getOrThrow<number>('DATABASE_PORT')),
            username: databaseUrl ? undefined : configService.getOrThrow<string>('DATABASE_USER'),
            password: databaseUrl
              ? undefined
              : configService.getOrThrow<string>('DATABASE_PASSWORD'),
            database: databaseUrl ? undefined : configService.getOrThrow<string>('DATABASE_NAME'),
            synchronize: false,
            migrationsRun: true,
            ssl: configService.get<boolean>('DATABASE_SSL'),
            sslRejectUnauthorized: configService.get<boolean>(
              'DATABASE_SSL_REJECT_UNAUTHORIZED',
            ),
          });
        },
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
    AdminModule,
    AuthModule,
    CommentsModule,
    CompaniesModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
