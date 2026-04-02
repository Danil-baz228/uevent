import 'dotenv/config';

import { DataSource } from 'typeorm';

import { createDatabaseOptions } from './database.config';

const dataSource = new DataSource(
  createDatabaseOptions({
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_URL ? undefined : process.env.DATABASE_HOST ?? 'localhost',
    port: process.env.DATABASE_URL ? undefined : Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_URL ? undefined : process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_URL ? undefined : process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_URL ? undefined : process.env.DATABASE_NAME ?? 'uevent',
    synchronize: false,
    ssl:
      process.env.DATABASE_SSL === undefined
        ? undefined
        : ['true', '1', 'yes', 'on'].includes(process.env.DATABASE_SSL.toLowerCase()),
    sslRejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === undefined
        ? false
        : ['true', '1', 'yes', 'on'].includes(
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED.toLowerCase(),
          ),
  }),
);

export default dataSource;
