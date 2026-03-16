import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { AuthTokenPayload, AuthenticatedUser } from './auth.types';

type JwtPayload = AuthTokenPayload & {
  iat: number;
  exp: number;
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signTokenPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function getJwtSecret() {
  return process.env.AUTH_JWT_SECRET ?? 'uevent-dev-secret';
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hashedPassword] = storedHash.split(':');

  if (!salt || !hashedPassword) {
    return false;
  }

  const expectedHash = Buffer.from(hashedPassword, 'hex');
  const receivedHash = scryptSync(password, salt, 64);

  return timingSafeEqual(expectedHash, receivedHash);
}

function createJwtToken(
  payload: AuthTokenPayload,
  expiresInSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = signTokenPayload(`${header}.${body}`, getJwtSecret());

  return `${header}.${body}.${signature}`;
}

export function createAccessToken(payload: Omit<AuthTokenPayload, 'type'>) {
  return createJwtToken({ ...payload, type: 'access' }, 60 * 60);
}

export function createRefreshToken(payload: Omit<AuthTokenPayload, 'type'>) {
  return createJwtToken({ ...payload, type: 'refresh' }, 60 * 60 * 24 * 7);
}

export function verifyAccessToken(token: string) {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new Error('Malformed token');
  }

  const expectedSignature = signTokenPayload(`${header}.${body}`, getJwtSecret());

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  if (payload.exp * 1000 <= Date.now()) {
    throw new Error('Token expired');
  }

  return payload as AuthenticatedUser;
}
