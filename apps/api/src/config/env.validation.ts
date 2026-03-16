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
    DATABASE_ENABLED: String(config.DATABASE_ENABLED ?? 'true'),
    DATABASE_HOST: getString(config, 'DATABASE_HOST', 'localhost'),
    DATABASE_PORT: getNumber(config, 'DATABASE_PORT', 5432),
    DATABASE_NAME: getString(config, 'DATABASE_NAME', 'uevent'),
    DATABASE_USER: getString(config, 'DATABASE_USER', 'postgres'),
    DATABASE_PASSWORD: getString(config, 'DATABASE_PASSWORD', 'postgres'),
    STRIPE_SECRET_KEY: getString(config, 'STRIPE_SECRET_KEY', 'sk_test_replace_me'),
  };
}
