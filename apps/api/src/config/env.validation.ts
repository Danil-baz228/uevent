type RawEnv = Record<string, unknown>;

function getString(config: RawEnv, key: string, fallback?: string) {
  const value = config[key] ?? fallback;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

function getNumber(config: RawEnv, key: string, fallback?: number) {
  const value = Number(config[key] ?? fallback);

  if (Number.isNaN(value)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return value;
}

function getBoolean(config: RawEnv, key: string, fallback = false) {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean environment variable: ${key}`);
}

function getOptionalBoolean(config: RawEnv, key: string) {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return getBoolean(config, key);
}

function getOptionalNumber(config: RawEnv, key: string) {
  const value = config[key];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return getNumber(config, key);
}

function getOptionalString(config: RawEnv, key: string) {
  const value = config[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized === '' ? undefined : normalized;
}

export function validateEnvironment(config: RawEnv) {
  const databaseUrl = getOptionalString(config, 'DATABASE_URL');

  return {
    PORT: getNumber(config, 'PORT', 4000),
    APP_ORIGIN: getString(config, 'APP_ORIGIN', 'http://localhost:5173'),
    AUTH_JWT_SECRET: getString(config, 'AUTH_JWT_SECRET', 'uevent-dev-secret'),
    DATABASE_ENABLED: String(config.DATABASE_ENABLED ?? 'true'),
    DATABASE_SYNCHRONIZE: String(config.DATABASE_SYNCHRONIZE ?? 'false'),
    DATABASE_URL: databaseUrl,
    DATABASE_HOST: databaseUrl ? getOptionalString(config, 'DATABASE_HOST') : getString(config, 'DATABASE_HOST', 'localhost'),
    DATABASE_PORT: databaseUrl ? getOptionalNumber(config, 'DATABASE_PORT') : getNumber(config, 'DATABASE_PORT', 5432),
    DATABASE_NAME: databaseUrl ? getOptionalString(config, 'DATABASE_NAME') : getString(config, 'DATABASE_NAME', 'uevent'),
    DATABASE_USER: databaseUrl ? getOptionalString(config, 'DATABASE_USER') : getString(config, 'DATABASE_USER', 'postgres'),
    DATABASE_PASSWORD: databaseUrl
      ? getOptionalString(config, 'DATABASE_PASSWORD')
      : getString(config, 'DATABASE_PASSWORD', 'postgres'),
    DATABASE_SSL: getOptionalBoolean(config, 'DATABASE_SSL'),
    DATABASE_SSL_REJECT_UNAUTHORIZED: getOptionalBoolean(
      config,
      'DATABASE_SSL_REJECT_UNAUTHORIZED',
    ),
    STRIPE_SECRET_KEY: getString(config, 'STRIPE_SECRET_KEY', 'sk_test_replace_me'),
    STRIPE_CURRENCY: getString(config, 'STRIPE_CURRENCY', 'usd'),
    STRIPE_SUCCESS_URL: getString(
      config,
      'STRIPE_SUCCESS_URL',
      'http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}',
    ),
    STRIPE_CANCEL_URL: getString(
      config,
      'STRIPE_CANCEL_URL',
      'http://localhost:5173/payment/cancel',
    ),
    MAIL_FROM: getString(config, 'MAIL_FROM', 'tickets@uevent.local'),
    SMTP_HOST: getOptionalString(config, 'SMTP_HOST'),
    SMTP_PORT: getNumber(config, 'SMTP_PORT', 587),
    SMTP_SECURE: String(config.SMTP_SECURE ?? 'false'),
    SMTP_USER: getOptionalString(config, 'SMTP_USER'),
    SMTP_PASS: getOptionalString(config, 'SMTP_PASS'),
    GOOGLE_CLIENT_ID: getOptionalString(config, 'GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: getOptionalString(config, 'GOOGLE_CLIENT_SECRET'),
    GOOGLE_CALLBACK_URL: getString(
      config,
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/google/callback',
    ),
  };
}
