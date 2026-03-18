import 'dotenv/config';

import { DataSource } from 'typeorm';

import { EventEntity } from '../modules/events/entities/event.entity';
import { EventRegistrationEntity } from '../modules/registrations/entities/event-registration.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { InitialSchema1760000000000 } from './migrations/1760000000000-InitialSchema';
import { AddRefreshTokenHashToUsers1760000000001 } from './migrations/1760000000001-AddRefreshTokenHashToUsers';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'uevent',
  entities: [UserEntity, EventEntity, EventRegistrationEntity],
  migrations: [
    InitialSchema1760000000000,
    AddRefreshTokenHashToUsers1760000000001,
  ],
  synchronize: false,
});

export default dataSource;
