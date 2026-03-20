import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';

import { useAuth } from './auth/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import {
  ApiNotification,
  clearAllNotifications,
  fetchMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './lib/api';
import { AuthPage } from './pages/AuthPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { TicketsPage } from './pages/TicketsPage';
import { useTheme } from './theme/ThemeContext';

function Layout() {
  const { user, token, logout } = useAuth();
  const { language, setLanguage, copy } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const themeCopy =
    language === 'uk'
      ? { label: 'Тема', light: 'Світла', dark: 'Темна' }
      : { label: 'Theme', light: 'Light', dark: 'Dark' };

  const notificationsCopy =
    language === 'uk'
      ? {
          label: 'Сповіщення',
          title: 'Сповіщення',
          allTitle: 'Усі сповіщення',
          empty: 'Поки що немає сповіщень.',
          loading: 'Завантаження...',
          markAll: 'Прочитати все',
          clearAll: 'Очистити все',
          viewAll: 'Переглянути все',
          openEvent: 'Відкрити подію',
          openAccount: 'Відкрити акаунт',
          close: 'Закрити',
        }
      : {
          label: 'Notifications',
          title: 'Notifications',
          allTitle: 'All notifications',
          empty: 'No notifications yet.',
          loading: 'Loading...',
          markAll: 'Mark all as read',
          clearAll: 'Clear all',
          viewAll: 'View all',
          openEvent: 'Open event',
          openAccount: 'Open account',
          close: 'Close',
        };

  const accountPath = user ? '/account' : '/auth';
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);
  const hasMoreNotifications = notifications.length > 5;

  function localizeNotification(notification: ApiNotification) {
    const extractEventTitle = () => {
      switch (notification.type) {
        case 'registration_confirmed':
          return (
            notification.body.match(/^You are registered for (.+)\.$/)?.[1] ?? notification.body
          );
        case 'payment_confirmed':
          return (
            notification.body.match(/^Your ticket for (.+) is confirmed\.$/)?.[1] ??
            notification.body
          );
        case 'new_attendee':
          return notification.body.match(/ registered for (.+)\.$/)?.[1] ?? notification.body;
        case 'new_comment':
          return notification.body.match(/ commented on (.+)\.$/)?.[1] ?? notification.body;
        default:
          return notification.body;
      }
    };

    const extractActorName = () => {
      switch (notification.type) {
        case 'new_attendee':
          return notification.body.match(/^(.+) registered for /)?.[1] ?? 'Someone';
        case 'new_comment':
          return notification.body.match(/^(.+) commented on /)?.[1] ?? 'Someone';
        default:
          return null;
      }
    };

    const eventTitle = extractEventTitle();
    const rawActorName = extractActorName();
    const actorName =
      rawActorName === 'A new attendee' || rawActorName === 'Someone'
        ? null
        : rawActorName;

    if (language === 'uk') {
      switch (notification.type) {
        case 'registration_confirmed':
          return {
            title: 'Реєстрацію підтверджено',
            body: `Ви успішно зареєстровані на подію ${eventTitle}.`,
          };
        case 'payment_confirmed':
          return {
            title: 'Оплату підтверджено',
            body: `Ваш квиток на подію ${eventTitle} підтверджено.`,
          };
        case 'new_attendee':
          return {
            title: 'Новий учасник',
            body: `${actorName ?? 'Новий користувач'} зареєструвався на подію ${eventTitle}.`,
          };
        case 'new_comment':
          return {
            title: 'Новий коментар',
            body: `${actorName ?? 'Користувач'} залишив коментар до події ${eventTitle}.`,
          };
        default:
          return {
            title: notification.title,
            body: notification.body,
          };
      }
    }

    return {
      title: notification.title,
      body: notification.body,
    };
  }

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    const authToken = token;
    let active = true;

    async function loadNotifications() {
      setNotificationsLoading(true);

      try {
        const payload = await fetchMyNotifications(authToken);

        if (active) {
          setNotifications(payload);
        }
      } catch {
        if (active) {
          setNotifications([]);
        }
      } finally {
        if (active) {
          setNotificationsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsModalOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!modalRef.current?.contains(event.target as Node)) {
        setNotificationsModalOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [notificationsModalOpen]);

  function getNotificationDestination(notification: ApiNotification) {
    return notification.eventId ? `/events/${notification.eventId}` : '/account';
  }

  async function markNotificationRead(notification: ApiNotification) {
    const authToken = token;

    if (!authToken || notification.isRead) {
      return;
    }

    try {
      const updated = await markNotificationAsRead(notification.id, authToken);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      // Ignore read-state failures to keep the dropdown responsive.
    }
  }

  async function handleOpenNotification(notification: ApiNotification) {
    void markNotificationRead(notification);

    setNotificationsOpen(false);
    setNotificationsModalOpen(false);
    navigate(getNotificationDestination(notification));
  }

  async function handleMarkAllNotificationsAsRead() {
    const authToken = token;

    if (!authToken) {
      return;
    }

    await markAllNotificationsAsRead(authToken);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
  }

  async function handleClearAllNotifications() {
    const authToken = token;

    if (!authToken) {
      return;
    }

    await clearAllNotifications(authToken);
    setNotifications([]);
    setNotificationsModalOpen(false);
  }

  function renderNotificationItem(notification: ApiNotification) {
    const localizedNotification = localizeNotification(notification);
    const destination = getNotificationDestination(notification);

    return (
      <div
        key={notification.id}
        className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
        onClick={() => void markNotificationRead(notification)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void markNotificationRead(notification);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <strong>{localizedNotification.title}</strong>
        <p>{localizedNotification.body}</p>
        <button
          type="button"
          className="notification-open"
          onClick={(event) => {
            event.stopPropagation();
            void handleOpenNotification(notification);
          }}
        >
          {destination === '/account'
            ? notificationsCopy.openAccount
            : notificationsCopy.openEvent}
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true">
        <div className="layout-orb orb-coral" />
        <div className="layout-orb orb-ink" />
        <div className="layout-orb orb-mint" />
        <div className="layout-grid" />
      </div>

      <header className="app-header">
        <div className="header-panel">
          <div className="header-topline">
            <NavLink to="/" className="brand">
              <span className="brand-mark">U</span>
              <span>
                <strong>{copy.brand.title}</strong>
                <small>{copy.brand.tagline}</small>
              </span>
            </NavLink>

            <div className="header-actions">
              <div className="theme-switch" aria-label={themeCopy.label}>
                <button
                  type="button"
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  {themeCopy.light}
                </button>
                <button
                  type="button"
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  {themeCopy.dark}
                </button>
              </div>

              <div className="language-switch" aria-label={copy.header.language}>
                <button
                  type="button"
                  className={`language-button ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`language-button ${language === 'uk' ? 'active' : ''}`}
                  onClick={() => setLanguage('uk')}
                >
                  UA
                </button>
              </div>

              {user ? (
                <>
                  <div className="notifications-shell" ref={dropdownRef}>
                    <button
                      type="button"
                      className={`notification-button ${notificationsOpen ? 'active' : ''}`}
                      aria-label={notificationsCopy.label}
                      onClick={() => setNotificationsOpen((value) => !value)}
                    >
                      <span className="notification-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" role="presentation">
                          <path
                            d="M12 3a4 4 0 0 0-4 4v1.1c0 .7-.2 1.4-.5 2l-1 2.1a2 2 0 0 0 1.8 2.9h7.4a2 2 0 0 0 1.8-2.9l-1-2.1a4.8 4.8 0 0 1-.5-2V7a4 4 0 0 0-4-4Zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21Z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                      {unreadCount > 0 ? (
                        <span className="notification-badge">{unreadCount}</span>
                      ) : null}
                    </button>

                    {notificationsOpen ? (
                      <div className="notifications-dropdown">
                        <div className="notifications-dropdown-head">
                          <strong>{notificationsCopy.title}</strong>
                        </div>

                        {notificationsLoading ? (
                          <p className="notifications-empty">{notificationsCopy.loading}</p>
                        ) : null}

                        {!notificationsLoading && recentNotifications.length === 0 ? (
                          <p className="notifications-empty">{notificationsCopy.empty}</p>
                        ) : null}

                        {!notificationsLoading && recentNotifications.length > 0 ? (
                          <>
                            <div className="notifications-list">
                              {recentNotifications.map((notification) =>
                                renderNotificationItem(notification),
                              )}
                            </div>

                            {hasMoreNotifications ? (
                              <button
                                type="button"
                                className="notifications-view-all"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  setNotificationsModalOpen(true);
                                }}
                              >
                                {notificationsCopy.viewAll}
                              </button>
                            ) : null}

                            <div className="notifications-footer-actions">
                              <button
                                type="button"
                                className="notifications-mark-all footer"
                                onClick={() => void handleMarkAllNotificationsAsRead()}
                              >
                                {notificationsCopy.markAll}
                              </button>
                              <button
                                type="button"
                                className="notifications-clear-all footer"
                                onClick={() => void handleClearAllNotifications()}
                              >
                                {notificationsCopy.clearAll}
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="user-chip">
                    <strong>{user.displayName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button type="button" className="secondary-button" onClick={logout}>
                    {copy.header.logout}
                  </button>
                </>
              ) : (
                <NavLink to="/auth" className="secondary-button">
                  {copy.header.signIn}
                </NavLink>
              )}
            </div>
          </div>

          <div className="header-bottomline">
            <nav className="nav">
              <NavLink to="/" end className="nav-link">
                {copy.nav.home}
              </NavLink>
              <NavLink to="/discover" className="nav-link">
                {copy.nav.discover}
              </NavLink>
              <NavLink to="/create-event" className="nav-link">
                {copy.nav.createEvent}
              </NavLink>
              <NavLink to={accountPath} className="nav-link">
                {user ? copy.nav.account : copy.nav.login}
              </NavLink>
            </nav>
            <p className="header-caption">{copy.footer.lead}</p>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>{copy.footer.lead}</span>
        <span>{copy.footer.caption}</span>
      </footer>

      {notificationsModalOpen ? (
        <div className="notifications-modal-backdrop">
          <div className="notifications-modal" ref={modalRef}>
            <div className="notifications-modal-head">
              <strong>{notificationsCopy.allTitle}</strong>
              <button
                type="button"
                className="notifications-modal-close"
                onClick={() => setNotificationsModalOpen(false)}
              >
                {notificationsCopy.close}
              </button>
            </div>

            <div className="notifications-modal-body">
              {notifications.length === 0 ? (
                <p className="notifications-empty">{notificationsCopy.empty}</p>
              ) : (
                <div className="notifications-modal-list">
                  {notifications.map((notification) => renderNotificationItem(notification))}
                </div>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="notifications-footer-actions modal">
                <button
                  type="button"
                  className="notifications-mark-all footer"
                  onClick={() => void handleMarkAllNotificationsAsRead()}
                >
                  {notificationsCopy.markAll}
                </button>
                <button
                  type="button"
                  className="notifications-clear-all footer"
                  onClick={() => void handleClearAllNotifications()}
                >
                  {notificationsCopy.clearAll}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/account" element={<TicketsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
