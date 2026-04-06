export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
  subscribedCompanyIds: string[];
  showAttendeeNameByDefault: boolean;
  isAdmin: boolean;
  companies: {
    id: string;
    name: string;
    email: string;
    location: string;
    description: string | null;
    ownerId: string;
    createdAt: string;
  }[];
  createdAt: string;
};

export type ApiCompany = {
  id: string;
  name: string;
  email: string;
  location: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
};

export type ApiCompanyNews = {
  id: string;
  companyId: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    email: string;
  } | null;
};

export type CompanyListItem = ApiCompany & {
  eventsCount: number;
  latestNews: ApiCompanyNews | null;
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
  format: string;
  theme: string;
  city: string;
  address: string | null;
  company: {
    id: string;
    name: string;
    email: string;
    location: string;
    description: string | null;
  } | null;
  posterUrl: string | null;
  startsAt: string;
  publishAt: string | null;
  redirectAfterPurchaseUrl: string | null;
  price: number;
  promoCodes: Array<{ code: string; discountPercent: number }>;
  capacity: number;
  hideAttendeeNames: boolean;
  attendeeVisibility: 'everyone' | 'registered_only' | 'nobody';
  notifyOnNewAttendee: boolean;
  commentAccess: 'everyone' | 'registered_only' | 'closed';
  commentsClosed: boolean;
  commentsClosedByAdmin: boolean;
  isPublished: boolean;
  organizer: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  createdAt: string;
};

export type EventAttendee = {
  id: string;
  displayName: string;
  email: string;
  quantity: number;
  showAttendeeName: boolean;
  joinedAt: string;
};

export type EventComment = {
  id: string;
  eventId: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    email: string;
  };
};

export type EventDetailsResponse = ApiEvent & {
  canViewAttendees: boolean;
  attendees: EventAttendee[];
  comments: EventComment[];
  organizerEvents: ApiEvent[];
  similarEvents: ApiEvent[];
};

export type EventListResponse = {
  items: ApiEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type EventQueryParams = {
  q?: string;
  category?: string;
  format?: string;
  theme?: string;
  priceType?: 'free' | 'paid' | 'all';
  sortBy?: 'date_asc' | 'date_desc' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
};

export type CreateEventPayload = {
  title: string;
  description: string;
  category: string;
  format: string;
  theme: string;
  city: string;
  address?: string;
  companyId: string;
  posterUrl?: string;
  startsAt: string;
  publishAt?: string | null;
  redirectAfterPurchaseUrl?: string | null;
  price?: number;
  promoCodes?: Array<{ code: string; discountPercent: number }>;
  capacity?: number;
  attendeeVisibility?: 'everyone' | 'registered_only' | 'nobody';
  notifyOnNewAttendee?: boolean;
  commentAccess?: 'everyone' | 'registered_only' | 'closed';
};

export type UpdateEventPayload = Partial<CreateEventPayload> & {
  hideAttendeeNames?: boolean;
  commentsClosed?: boolean;
};
export type CreateCompanyPayload = {
  name: string;
  email: string;
  location: string;
  description?: string;
};
export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;
export type CreateCompanyNewsPayload = {
  title: string;
  content: string;
};
export type CompanyDetailsResponse = ApiCompany & {
  owner: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  canManage: boolean;
  events: Pick<
    ApiEvent,
    'id' | 'title' | 'city' | 'startsAt' | 'publishAt' | 'isPublished' | 'price' | 'posterUrl' | 'category'
  >[];
  news: ApiCompanyNews[];
};

export type CompanySubscriptionResponse = {
  companyId: string;
  isSubscribed: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type CheckoutSessionPayload = {
  eventId: string;
  quantity?: number;
  promoCode?: string;
};

export type CheckoutSessionResponse = {
  provider: string;
  status: string | null;
  registrationId: string;
  sessionId: string;
  url: string | null;
  amount: number;
  originalAmount: number;
  discountPercent: number;
  promoCode: string | null;
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
  reminderAt: string | null;
  reminderSentAt: string | null;
  showAttendeeName: boolean;
  ticketAssetPath: string | null;
  paymentReceiptPreviewPath: string | null;
  paymentReceiptMessageId: string | null;
  paymentReceiptSentAt: string | null;
  checkedInAt: string | null;
  checkedInByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  event: ApiEvent;
};

export type VerifyTicketPayload = {
  ticketCode: string;
  eventId?: string;
};

export type VerifiedTicketResponse = {
  ticketCode: string;
  registration: ApiRegistration;
  attendee: {
    id: string;
    displayName: string;
    email: string;
  };
  alreadyCheckedIn: boolean;
  checkedInAt: string | null;
  checkedInByUserId: string | null;
};

export type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

export type UpdateCurrentUserPayload = {
  displayName?: string;
  interests?: string[];
  showAttendeeNameByDefault?: boolean;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type ChangeEmailPayload = {
  newEmail: string;
  password: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateCommentPayload = {
  content: string;
  parentCommentId?: string;
};

export type ApiNotification = {
  id: string;
  userId: string;
  eventId: string | null;
  companyId: string | null;
  type:
    | 'registration_confirmed'
    | 'payment_confirmed'
    | 'new_attendee'
    | 'new_comment'
    | 'event_reminder'
    | 'company_news'
    | 'company_event';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminOverview = {
  usersCount: number;
  eventsCount: number;
  companiesCount: number;
  commentsCount: number;
};

export type AdminUserItem = {
  id: string;
  email: string;
  displayName: string;
  interests: string[];
  subscribedCompanyIds: string[];
  isAdmin: boolean;
  companiesCount: number;
  createdAt: string;
};

export type AdminEventItem = {
  id: string;
  title: string;
  city: string;
  startsAt: string;
  publishAt: string | null;
  price: number;
  company: {
    id: string;
    name: string;
  } | null;
  organizer: {
    id: string;
    displayName: string;
    email: string;
  } | null;
};

export type AdminCompanyItem = {
  id: string;
  name: string;
  email: string;
  location: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  eventsCount: number;
  newsCount: number;
  createdAt: string;
};

export type AdminCommentItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    email: string;
  } | null;
};

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function requestJson<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!headers.has('Content-Type') && init?.body && !isFormData) {
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
  return requestJson<EventListResponse>('/events');
}

export function fetchEventsWithQuery(params: EventQueryParams) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set('q', params.q);
  }

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  if (params.format && params.format !== 'all') {
    searchParams.set('format', params.format);
  }

  if (params.theme && params.theme !== 'all') {
    searchParams.set('theme', params.theme);
  }

  if (params.priceType && params.priceType !== 'all') {
    searchParams.set('priceType', params.priceType);
  }

  if (params.sortBy && params.sortBy !== 'date_asc') {
    searchParams.set('sortBy', params.sortBy);
  }

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();

  return requestJson<EventListResponse>(`/events${query ? `?${query}` : ''}`);
}

export function fetchEventById(eventId: string, token?: string | null) {
  return requestJson<EventDetailsResponse>(`/events/${eventId}`, {
    token,
  });
}

export function fetchMyScheduledEvents(token: string) {
  return requestJson<ApiEvent[]>('/events/me/scheduled', {
    token,
  });
}

export function createEventComment(
  eventId: string,
  payload: CreateCommentPayload,
  token: string,
) {
  return requestJson<EventComment>(`/events/${eventId}/comments`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateEventComment(
  eventId: string,
  commentId: string,
  payload: CreateCommentPayload,
  token: string,
) {
  return requestJson<EventComment>(`/events/${eventId}/comments/${commentId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteEventComment(eventId: string, commentId: string, token: string) {
  return requestJson<{ message: string }>(`/events/${eventId}/comments/${commentId}`, {
    method: 'DELETE',
    token,
  });
}

export function createEvent(payload: CreateEventPayload | FormData, token: string) {
  return requestJson<ApiEvent>('/events', {
    method: 'POST',
    token,
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function updateEvent(
  eventId: string,
  payload: UpdateEventPayload | FormData,
  token: string,
) {
  return requestJson<ApiEvent>(`/events/${eventId}`, {
    method: 'PATCH',
    token,
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function deleteEvent(eventId: string, token: string) {
  return requestJson<{ message: string }>(`/events/${eventId}`, {
    method: 'DELETE',
    token,
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

export function verifyTicket(payload: VerifyTicketPayload, token: string) {
  return requestJson<VerifiedTicketResponse>('/registrations/verify-ticket', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function checkInTicket(payload: VerifyTicketPayload, token: string) {
  return requestJson<VerifiedTicketResponse>('/registrations/check-in', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function createCompany(payload: CreateCompanyPayload, token: string) {
  return requestJson<ApiCompany>('/companies', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function fetchMyCompanies(token: string) {
  return requestJson<ApiCompany[]>('/companies/me', {
    token,
  });
}

export function fetchCompanies() {
  return requestJson<CompanyListItem[]>('/companies');
}

export function fetchCompanyById(companyId: string, token?: string | null) {
  return requestJson<CompanyDetailsResponse>(`/companies/${companyId}`, {
    token,
  });
}

export function updateCompany(
  companyId: string,
  payload: UpdateCompanyPayload,
  token: string,
) {
  return requestJson<ApiCompany>(`/companies/${companyId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function createCompanyNews(
  companyId: string,
  payload: CreateCompanyNewsPayload,
  token: string,
) {
  return requestJson<ApiCompanyNews>(`/companies/${companyId}/news`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function subscribeToCompanyNotifications(companyId: string, token: string) {
  return requestJson<CompanySubscriptionResponse>(`/companies/${companyId}/subscriptions`, {
    method: 'POST',
    token,
  });
}

export function unsubscribeFromCompanyNotifications(companyId: string, token: string) {
  return requestJson<CompanySubscriptionResponse>(`/companies/${companyId}/subscriptions`, {
    method: 'DELETE',
    token,
  });
}

export function updateRegistrationReminder(
  eventId: string,
  payload: { reminderAt: string | null; showAttendeeName?: boolean },
  token: string,
) {
  return requestJson<ApiRegistration>(`/registrations/${eventId}/reminder`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/auth/google/login`;
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

export function changeEmail(payload: ChangeEmailPayload, token: string) {
  return requestJson<AuthResponse>('/auth/change-email', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function changePassword(payload: ChangePasswordPayload, token: string) {
  return requestJson<{ message: string }>('/auth/change-password', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return requestJson<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return requestJson<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token: string) {
  return requestJson<AuthUser>('/users/me', {
    token,
  });
}

export function fetchMyNotifications(token: string) {
  return requestJson<ApiNotification[]>('/notifications/me', {
    token,
  });
}

export function markNotificationAsRead(notificationId: string, token: string) {
  return requestJson<ApiNotification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export function markAllNotificationsAsRead(token: string) {
  return requestJson<{ message: string }>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}

export function clearAllNotifications(token: string) {
  return requestJson<{ message: string }>('/notifications/clear-all', {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminOverview(token: string) {
  return requestJson<AdminOverview>('/admin/overview', {
    token,
  });
}

export function fetchAdminUsers(token: string) {
  return requestJson<AdminUserItem[]>('/admin/users', {
    token,
  });
}

export function promoteAdminUser(userId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/users/${userId}/promote`, {
    method: 'PATCH',
    token,
  });
}

export function revokeAdminUser(userId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/users/${userId}/revoke`, {
    method: 'PATCH',
    token,
  });
}

export function deleteAdminUser(userId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminEvents(token: string) {
  return requestJson<AdminEventItem[]>('/admin/events', {
    token,
  });
}

export function deleteAdminEvent(eventId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/events/${eventId}`, {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminCompanies(token: string) {
  return requestJson<AdminCompanyItem[]>('/admin/companies', {
    token,
  });
}

export function deleteAdminCompany(companyId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/companies/${companyId}`, {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminComments(token: string) {
  return requestJson<AdminCommentItem[]>('/admin/comments', {
    token,
  });
}

export function deleteAdminComment(commentId: string, token: string) {
  return requestJson<{ message: string }>(`/admin/comments/${commentId}`, {
    method: 'DELETE',
    token,
  });
}

export function updateCurrentUser(
  payload: UpdateCurrentUserPayload,
  token: string,
) {
  return requestJson<AuthUser>('/users/me', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function formatEventDate(value: string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPrice(price: number, locale = 'en-US', freeLabel = 'Free') {
  if (!price) {
    return freeLabel;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getEventPosterUrl(event: Pick<ApiEvent, 'posterUrl' | 'title' | 'category'>) {
  if (event.posterUrl) {
    if (event.posterUrl.startsWith('http') || event.posterUrl.startsWith('data:')) {
      return event.posterUrl;
    }

    return `${API_ORIGIN}${event.posterUrl}`;
  }

  const truncateText = (value: string, limit: number) =>
    value.length > limit ? `${value.slice(0, limit - 1).trimEnd()}…` : value;

  const wrapTitle = (value: string, maxLines: number, maxCharsPerLine: number) => {
    const words = value.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(truncateText(word, maxCharsPerLine));
        currentLine = '';
      }

      if (lines.length === maxLines) {
        return lines.map((line, index) =>
          index === maxLines - 1 ? truncateText(line, maxCharsPerLine) : line,
        );
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).map((line, index) =>
        index === maxLines - 1 ? truncateText(line, maxCharsPerLine) : line,
      );
    }

    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
      lines[maxLines - 1] = truncateText(lines[maxLines - 1], maxCharsPerLine);
    }

    return lines;
  };

  const title = event.title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const category = truncateText(event.category, 18)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const titleLines = wrapTitle(event.title, 2, 26).map(
    (line) =>
      line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;'),
  );
  const titleText = titleLines
    .map(
      (line, index) =>
        `<tspan x="70" dy="${index === 0 ? 0 : 76}">${line}</tspan>`,
    )
    .join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffecd6"/>
          <stop offset="55%" stop-color="#f7fbff"/>
          <stop offset="100%" stop-color="#daf4ee"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <circle cx="1030" cy="120" r="120" fill="#ffd29b" opacity="0.55"/>
      <circle cx="180" cy="560" r="170" fill="#8fd0c5" opacity="0.2"/>
      <text x="70" y="110" font-family="Segoe UI, sans-serif" font-size="28" font-weight="700" fill="#c4572d">${category}</text>
      <text x="70" y="250" font-family="Segoe UI, sans-serif" font-size="64" font-weight="700" fill="#172033">${titleText}</text>
      <text x="70" y="600" font-family="Segoe UI, sans-serif" font-size="28" fill="#445066">Uevent poster</text>
    </svg>`,
  )}`;
}

export function getMapEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function getApiAssetUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
