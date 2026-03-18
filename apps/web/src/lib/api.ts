export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export type ApiHealth = {
  service: string;
  status: string;
  timestamp: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  interests: string[];
  createdAt: string;
};

export type AuthResponse = {
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  capacity: number;
  organizer: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  createdAt: string;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  category: string;
  city: string;
  startsAt: string;
  price?: number;
  capacity?: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CheckoutSessionPayload = {
  eventId: string;
  quantity?: number;
};

export type CheckoutSessionResponse = {
  provider: string;
  status: string | null;
  registrationId: string;
  sessionId: string;
  url: string | null;
  amount: number;
  currency: string;
  eventId: string;
  eventTitle: string;
  quantity: number;
};

export type RegistrationStatus = 'pending_payment' | 'confirmed';

export type ApiRegistration = {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  paymentProvider: 'free' | 'stripe';
  quantity: number;
  amountTotal: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentStatus: string | null;
  createdAt: string;
  updatedAt: string;
  event: ApiEvent;
};

export type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function requestJson<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (init?.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string | string[] };
      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message;

      throw new Error(message ?? fallbackMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  return response.json() as Promise<T>;
}

export function fetchHealth() {
  return requestJson<ApiHealth>('/health');
}

export function fetchEvents() {
  return requestJson<ApiEvent[]>('/events');
}

export function createEvent(payload: CreateEventPayload, token: string) {
  return requestJson<ApiEvent>('/events', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function createCheckoutSession(payload: CheckoutSessionPayload, token: string) {
  return requestJson<CheckoutSessionResponse>('/payments/checkout-session', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function confirmCheckoutSession(sessionId: string, token: string) {
  return requestJson<ApiRegistration>('/payments/confirm-session', {
    method: 'POST',
    token,
    body: JSON.stringify({ sessionId }),
  });
}

export function createRegistration(eventId: string, token: string, quantity = 1) {
  return requestJson<ApiRegistration>('/registrations', {
    method: 'POST',
    token,
    body: JSON.stringify({ eventId, quantity }),
  });
}

export function fetchMyRegistrations(token: string) {
  return requestJson<ApiRegistration[]>('/registrations/me', {
    token,
  });
}

export function login(payload: LoginPayload) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refreshSession(payload: RefreshTokenPayload) {
  return requestJson<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutSession(payload: RefreshTokenPayload) {
  return requestJson<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token: string) {
  return requestJson<AuthUser>('/users/me', {
    token,
  });
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPrice(price: number) {
  if (!price) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}
