export type AuthTokenPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
};

export type AuthenticatedUser = {
  sub: string;
  email: string;
  type: 'access';
  iat: number;
  exp: number;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
} & Record<string, unknown>;

export type CurrentUserPayload = NonNullable<AuthenticatedRequest['user']>;
