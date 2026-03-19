import 'dotenv/config';

export const isDatabaseEnabled = process.env.DATABASE_ENABLED !== 'false';
