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

export function validateEnvironment(config: RawEnv) {
  return {
    PORT: getNumber(config, 'PORT', 4000),
    APP_ORIGIN: getString(config, 'APP_ORIGIN', 'http://localhost:5173'),
    AUTH_JWT_SECRET: getString(config, 'AUTH_JWT_SECRET', 'uevent-dev-secret'),
    DATABASE_ENABLED: String(config.DATABASE_ENABLED ?? 'true'),
    DATABASE_SYNCHRONIZE: String(config.DATABASE_SYNCHRONIZE ?? 'true'),
    DATABASE_HOST: getString(config, 'DATABASE_HOST', 'localhost'),
    DATABASE_PORT: getNumber(config, 'DATABASE_PORT', 5432),
    DATABASE_NAME: getString(config, 'DATABASE_NAME', 'uevent'),
    DATABASE_USER: getString(config, 'DATABASE_USER', 'postgres'),
    DATABASE_PASSWORD: getString(config, 'DATABASE_PASSWORD', 'postgres'),
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
  };
}
