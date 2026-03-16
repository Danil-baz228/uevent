import 'dotenv/config';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { validateEnvironment } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseSeederModule } from './modules/database-seeder/database-seeder.module';
import { EventEntity } from './modules/events/entities/event.entity';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UserEntity } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';

const databaseEnabled = process.env.DATABASE_ENABLED !== 'false';

const databaseImports = databaseEnabled
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
          entities: [UserEntity, EventEntity],
          synchronize: configService.get<string>('DATABASE_SYNCHRONIZE') === 'true',
        }),
      }),
    ]
  : [];

const seederImports = databaseEnabled ? [DatabaseSeederModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ...databaseImports,
    ...seederImports,
    HealthModule,
    AuthModule,
    UsersModule,
    EventsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
