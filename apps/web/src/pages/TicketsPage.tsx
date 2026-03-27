import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ApiEvent,
  ApiNotification,
  clearAllNotifications,
  fetchMyNotifications,
  fetchMyRegistrations,
  fetchMyScheduledEvents,
  formatEventDate,
  formatPrice,
  getApiAssetUrl,
  getEventPosterUrl,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/api';

type TicketsStatus = 'loading' | 'success' | 'error';
type SaveStatus = 'idle' | 'saving' | 'error';
type AccountSettingsTab = 'profile' | 'email' | 'password' | 'recovery';
type AccountSectionTab =
  | 'admin'
  | 'events'
  | 'notifications'
  | 'tickets'
  | 'companies';

export function TicketsPage() {
  const {
    user,
    token,
    isReady,
    updateProfile,
    changeEmail,
    changePassword,
  } = useAuth();
  const { copy, locale, language, translateCategory } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<TicketsStatus>('loading');
  const [message, setMessage] = useState('');
  const [registrations, setRegistrations] = useState<
    Awaited<ReturnType<typeof fetchMyRegistrations>>
  >([]);
  const [scheduledEvents, setScheduledEvents] = useState<ApiEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<TicketsStatus>('loading');
  const [eventsMessage, setEventsMessage] = useState('');
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationsStatus, setNotificationsStatus] =
    useState<TicketsStatus>('loading');
  const [notificationsMessage, setNotificationsMessage] = useState('');
  const [activeSectionTab, setActiveSectionTab] =
    useState<AccountSectionTab>('admin');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<AccountSettingsTab>('profile');

  const [settingsName, setSettingsName] = useState('');
  const [settingsInterests, setSettingsInterests] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<SaveStatus>('idle');
  const [settingsMessage, setSettingsMessage] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailStatus, setEmailStatus] = useState<SaveStatus>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  const pageCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Профіль',
            title: 'Ваш акаунт і квитки',
            text: 'Спочатку коротка інформація про профіль, а нижче всі реєстрації та покупки в одному місці.',
            signInNotice: 'Увійдіть, щоб переглянути профіль і ваші квитки.',
            signInCta: 'Перейти до входу',
            loading: 'Завантажуємо ваші квитки...',
            profileEyebrow: 'Профіль',
            profileTitle: 'Інформація про акаунт',
            profileText: 'Тут зібрано основні дані профілю, статуси реєстрацій та швидкий доступ до ваших подій.',
            memberSince: 'З нами з',
            interests: 'Інтереси',
            noInterests: 'Поки не вказано',
            ticketsEyebrow: 'Мої квитки',
            ticketsTitle: 'Мої квитки та реєстрації',
            ticketsText: 'Переглядайте підтверджені участі, незавершені оплати та швидко відкривайте потрібну подію.',
            emptyTitle: 'Поки немає квитків',
            emptyText:
              'Зареєструйтесь на безкоштовну подію або купіть платний квиток, щоб тут з’явилася ваша колекція.',
            openDiscover: 'Перейти до подій',
            openEvent: 'Відкрити подію',
            statusConfirmed: 'Підтверджено',
            statusPending: 'Очікує оплату',
            statConfirmed: 'Підтверджені',
            statPending: 'Очікують оплату',
            statTotal: 'Усього реєстрацій',
            settingsCta: 'Налаштування',
            settingsClose: 'Закрити',
            settingsTitle: 'Налаштування акаунта',
            tabsTitle: 'Ваш акаунт',
            profileTab: 'Основне',
            emailTab: 'Змінити пошту',
            passwordTab: 'Змінити пароль',
            recoveryTab: 'Забули пароль?',
            displayName: 'Ім’я профілю',
            emailLabel: 'Електронна пошта',
            interestsLabel: 'Інтереси',
            interestsHint: 'Через кому: networking, design, music',
            saveSettings: 'Зберегти зміни',
            savingSettings: 'Зберігаємо...',
            settingsSaved: 'Профіль оновлено.',
            modalProfileTitle: 'Основна інформація',
            modalProfileText:
              'Тут можна змінити нік та вподобання. Email лишається окремою дією в сусідній вкладці.',
            changeEmailTitle: 'Зміна пошти',
            changeEmailText:
              'Введіть нову електронну пошту та підтвердьте дію поточним паролем.',
            newEmailLabel: 'Нова пошта',
            currentPasswordLabel: 'Поточний пароль',
            saveEmail: 'Змінити пошту',
            savingEmail: 'Оновлюємо пошту...',
            emailSaved: 'Пошту оновлено.',
            passwordTitle: 'Зміна пароля',
            passwordText:
              'Для зміни пароля введіть старий пароль, новий пароль та підтвердження нового пароля.',
            passwordCurrent: 'Старий пароль',
            passwordNew: 'Новий пароль',
            passwordRepeat: 'Підтвердження пароля',
            savePassword: 'Змінити пароль',
            savingPassword: 'Оновлюємо пароль...',
            passwordSaved: 'Пароль оновлено.',
            recoveryTitle: 'Відновлення доступу',
            recoveryText:
              'Цю вкладку підготуємо пізніше. Зараз це лише фронтова заглушка для майбутнього forgot-password flow.',
            recoveryHint:
              'Тут пізніше з’явиться відправка листа для скидання пароля або окремий recovery сценарій.',
            nameLabel: 'Ім’я',
            failedProfile: 'Не вдалося оновити профіль',
            failedEmail: 'Не вдалося оновити пошту',
            failedPassword: 'Не вдалося оновити пароль',
            companiesEyebrow: 'Компанії',
            companiesTitle: 'Ваші компанії',
            companiesText:
              'Тут зібрані компанії, від імені яких можна створювати події та публікувати новини.',
            noCompanies: 'Поки що ви не створили жодної компанії.',
            openCompany: 'Відкрити компанію',
          }
        : {
            eyebrow: 'Account',
            title: 'Your profile and tickets',
            text: 'Profile details come first, and all registrations live right below in one clean place.',
            signInNotice: 'Please sign in to view your profile and tickets.',
            signInCta: 'Go to login',
            loading: 'Loading your tickets...',
            profileEyebrow: 'Profile',
            profileTitle: 'Account information',
            profileText:
              'Your core profile details, registration status, and quick event access live here.',
            memberSince: 'Member since',
            interests: 'Interests',
            noInterests: 'Not specified yet',
            ticketsEyebrow: 'My tickets',
            ticketsTitle: 'My tickets and registrations',
            ticketsText:
              'Review confirmed spots, pending payments, and jump back into any event page quickly.',
            emptyTitle: 'No tickets yet',
            emptyText:
              'Register for a free event or buy a paid ticket to start building your personal event collection.',
            openDiscover: 'Open discover',
            openEvent: 'Open event',
            statusConfirmed: 'Confirmed',
            statusPending: 'Payment pending',
            statConfirmed: 'Confirmed',
            statPending: 'Pending',
            statTotal: 'Total registrations',
            settingsCta: 'Settings',
            settingsClose: 'Close',
            settingsTitle: 'Account settings',
            tabsTitle: 'Your account',
            profileTab: 'General',
            emailTab: 'Change email',
            passwordTab: 'Change password',
            recoveryTab: 'Forgot password?',
            displayName: 'Display name',
            emailLabel: 'Email',
            interestsLabel: 'Interests',
            interestsHint: 'Comma separated: networking, design, music',
            saveSettings: 'Save changes',
            savingSettings: 'Saving...',
            settingsSaved: 'Profile updated.',
            modalProfileTitle: 'General information',
            modalProfileText:
              'Update your nickname and interests here. Email is handled in a separate security tab.',
            changeEmailTitle: 'Change email',
            changeEmailText:
              'Enter a new email address and confirm the action with your current password.',
            newEmailLabel: 'New email',
            currentPasswordLabel: 'Current password',
            saveEmail: 'Update email',
            savingEmail: 'Updating email...',
            emailSaved: 'Email updated.',
            passwordTitle: 'Change password',
            passwordText:
              'Enter your old password, then the new password and confirmation to update access.',
            passwordCurrent: 'Old password',
            passwordNew: 'New password',
            passwordRepeat: 'Password confirmation',
            savePassword: 'Update password',
            savingPassword: 'Updating password...',
            passwordSaved: 'Password updated.',
            recoveryTitle: 'Account recovery',
            recoveryText:
              'This tab is frontend-only for now and will later become the forgot-password flow.',
            recoveryHint:
              'Later this screen can send a recovery email or explain the recovery steps.',
            nameLabel: 'Name',
            failedProfile: 'Failed to update profile',
            failedEmail: 'Failed to update email',
            failedPassword: 'Failed to update password',
            companiesEyebrow: 'Companies',
            companiesTitle: 'Your companies',
            companiesText:
              'These companies can publish events and post company news on the platform.',
            noCompanies: 'You have not created any companies yet.',
            openCompany: 'Open company',
          },
    [language],
  );

  const deliveryCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            ready: 'Лист про оплату та квиток уже згенеровані.',
            sentAt: (value: string) => `Надіслано: ${value}`,
            openPreview: 'Відкрити email-preview',
            openTicket: 'Відкрити квиток',
          }
        : {
            ready: 'Payment email and generated ticket are ready.',
            sentAt: (value: string) => `Sent at: ${value}`,
            openPreview: 'Open email preview',
            openTicket: 'Open generated ticket',
          },
    [language],
  );

  const sectionCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            tickets: 'Мої квитки та реєстрації',
            companies: 'Мої компанії',
            publications: 'Публікації компаній',
            publicationsEyebrow: 'Публікації',
            publicationsTitle: 'Публікації ваших компаній',
            publicationsText:
              'Переглядайте новини та події, які публікують ваші компанії.',
            publicationsLoading: 'Завантаження публікацій...',
            publicationsFailed: 'Не вдалося завантажити публікації компаній.',
            noPublications:
              'Поки що немає новин чи подій, опублікованих від ваших компаній.',
            latestNews: 'Остання новина',
            companyEvents: 'Події компанії',
            noCompanyNews: 'Новин ще немає.',
            noCompanyEvents: 'Подій ще немає.',
          }
        : {
            tickets: 'My tickets and registrations',
            companies: 'My companies',
            publications: 'Company publications',
            publicationsEyebrow: 'Publications',
            publicationsTitle: 'Publications from your companies',
            publicationsText:
              'Review the latest company news and events published on behalf of your companies.',
            publicationsLoading: 'Loading company publications...',
            publicationsFailed: 'Failed to load company publications.',
            noPublications:
              'There are no news posts or events published from your companies yet.',
            latestNews: 'Latest news',
            companyEvents: 'Company events',
            noCompanyNews: 'No news yet.',
            noCompanyEvents: 'No events yet.',
          },
    [language],
  );

  const tabCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            admin: 'Адмін панель',
            events: 'Події користувача',
            notifications: 'Сповіщення користувача',
          }
        : {
            admin: 'Admin panel',
            events: 'User events',
            notifications: 'User notifications',
          },
    [language],
  );

  const adminCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Адмін панель',
            title: 'Керуйте профілем і контентом',
            text: 'Це ваш центр керування: швидкі дії, основна статистика та доступ до подій, компаній і налаштувань.',
            eventsCount: 'Події користувача',
            companiesCount: 'Компанії',
            unreadNotifications: 'Непрочитані сповіщення',
            ticketsCount: 'Квитки',
            createEvent: 'Створити подію',
            openCompanies: 'Відкрити компанії',
            openNotifications: 'Відкрити сповіщення',
            openSettings: 'Відкрити налаштування',
            latestEvents: 'Останні події',
            noEvents: 'У вас ще немає подій. Створіть першу прямо з адмін-панелі.',
            jumpToEvent: 'Відкрити подію',
          }
        : {
            eyebrow: 'Admin panel',
            title: 'Manage your profile and content',
            text: 'This is your control center: quick actions, key stats, and shortcuts to events, companies, and settings.',
            eventsCount: 'User events',
            companiesCount: 'Companies',
            unreadNotifications: 'Unread notifications',
            ticketsCount: 'Tickets',
            createEvent: 'Create event',
            openCompanies: 'Open companies',
            openNotifications: 'Open notifications',
            openSettings: 'Open settings',
            latestEvents: 'Latest events',
            noEvents: 'You do not have any events yet. Create the first one from the admin panel.',
            jumpToEvent: 'Open event',
          },
    [language],
  );

  const eventsCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Мої події',
            title: 'Події користувача',
            text: 'Тут зібрані всі події, створені вами, із поточним статусом і швидким доступом до сторінки події.',
            loading: 'Завантаження ваших подій...',
            empty: 'Ви ще не створили жодної події.',
            failed: 'Не вдалося завантажити події користувача.',
            openEvent: 'Відкрити подію',
            published: 'Опубліковано',
            scheduled: 'Заплановано',
            ended: 'Завершилась',
          }
        : {
            eyebrow: 'My events',
            title: 'User events',
            text: 'All events created by you live here with their current status and a quick jump back to the event page.',
            loading: 'Loading your events...',
            empty: 'You have not created any events yet.',
            failed: 'Failed to load user events.',
            openEvent: 'Open event',
            published: 'Published',
            scheduled: 'Scheduled',
            ended: 'Ended',
          },
    [language],
  );

  const notificationsPanelCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Сповіщення',
            title: 'Сповіщення користувача',
            text: 'Тут зібрані всі ваші сповіщення: оплати, нові події, новини компаній і нагадування.',
            loading: 'Завантаження сповіщень...',
            empty: 'У вас ще немає сповіщень.',
            failed: 'Не вдалося завантажити сповіщення.',
            markAll: 'Прочитати все',
            clearAll: 'Очистити все',
            openEvent: 'Відкрити подію',
            openCompany: 'Відкрити організатора',
            openAccount: 'Відкрити акаунт',
            unread: 'Непрочитане',
            read: 'Прочитане',
          }
        : {
            eyebrow: 'Notifications',
            title: 'User notifications',
            text: 'All your notifications live here: payments, new events, company updates, and reminders.',
            loading: 'Loading notifications...',
            empty: 'You do not have any notifications yet.',
            failed: 'Failed to load notifications.',
            markAll: 'Mark all as read',
            clearAll: 'Clear all',
            openEvent: 'Open event',
            openCompany: 'Open organizer',
            openAccount: 'Open account',
            unread: 'Unread',
            read: 'Read',
          },
    [language],
  );

  const notificationContentCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            organizer: 'Організатор',
            someone: 'Хтось',
            registrationConfirmed: (eventTitle: string) =>
              `Ви успішно зареєструвалися на подію ${eventTitle}.`,
            paymentConfirmed: (eventTitle: string) =>
              `Ваш квиток на подію ${eventTitle} підтверджено.`,
            newAttendee: (actorName: string, eventTitle: string) =>
              `${actorName} зареєструвався на подію ${eventTitle}.`,
            newComment: (actorName: string, eventTitle: string) =>
              `${actorName} залишив коментар до події ${eventTitle}.`,
            reminder: (eventTitle: string) =>
              `Незабаром починається подія ${eventTitle}. Перевірте час і не пропустіть її.`,
            companyNews: (companyName: string, newsTitle: string) =>
              `${companyName} поділився оновленням: ${newsTitle}.`,
            companyEvent: (companyName: string, eventTitle: string) =>
              `${companyName} опублікував нову подію ${eventTitle}.`,
          }
        : {
            organizer: 'Organizer',
            someone: 'Someone',
            registrationConfirmed: (eventTitle: string) =>
              `You are registered for ${eventTitle}.`,
            paymentConfirmed: (eventTitle: string) =>
              `Your ticket for ${eventTitle} is confirmed.`,
            newAttendee: (actorName: string, eventTitle: string) =>
              `${actorName} registered for ${eventTitle}.`,
            newComment: (actorName: string, eventTitle: string) =>
              `${actorName} commented on ${eventTitle}.`,
            reminder: (eventTitle: string) =>
              `${eventTitle} is coming up soon. Check the time and do not miss it.`,
            companyNews: (companyName: string, newsTitle: string) =>
              `${companyName} shared an update: ${newsTitle}.`,
            companyEvent: (companyName: string, eventTitle: string) =>
              `${companyName} published a new event: ${eventTitle}.`,
          },
    [language],
  );

  const confirmedCount = registrations.filter(
    (registration) => registration.status === 'confirmed',
  ).length;
  const pendingCount = registrations.length - confirmedCount;
  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const memberSinceLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(user?.createdAt ?? Date.now()));

  useEffect(() => {
    if (!user) {
      return;
    }

    setSettingsName(user.displayName);
    setSettingsInterests(user.interests.join(', '));
    setNewEmail(user.email);
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      if (!token) {
        if (active) {
          setRegistrations([]);
          setStatus('success');
        }
        return;
      }

      setStatus('loading');
      setMessage('');

      try {
        const payload = await fetchMyRegistrations(token);

        if (!active) {
          return;
        }

        setRegistrations(payload);
        setStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to load tickets');
      }
    }

    void loadTickets();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadScheduledEvents() {
      if (!token) {
        if (active) {
          setScheduledEvents([]);
          setEventsStatus('success');
          setEventsMessage('');
        }
        return;
      }

      setEventsStatus('loading');
      setEventsMessage('');

      try {
        const payload = await fetchMyScheduledEvents(token);

        if (!active) {
          return;
        }

        setScheduledEvents(payload);
        setEventsStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setScheduledEvents([]);
        setEventsStatus('error');
        setEventsMessage(
          error instanceof Error ? error.message : eventsCopy.failed,
        );
      }
    }

    void loadScheduledEvents();

    return () => {
      active = false;
    };
  }, [eventsCopy.failed, token]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      if (!token) {
        if (active) {
          setNotifications([]);
          setNotificationsStatus('success');
          setNotificationsMessage('');
        }
        return;
      }

      setNotificationsStatus('loading');
      setNotificationsMessage('');

      try {
        const payload = await fetchMyNotifications(token);

        if (!active) {
          return;
        }

        setNotifications(payload);
        setNotificationsStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setNotifications([]);
        setNotificationsStatus('error');
        setNotificationsMessage(
          error instanceof Error ? error.message : notificationsPanelCopy.failed,
        );
      }
    }

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [notificationsPanelCopy.failed, token]);

  useEffect(() => {
    if (!location.state || typeof location.state !== 'object') {
      return;
    }

    if ('openSettings' in location.state && location.state.openSettings) {
      setSettingsOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  if (!isReady) {
    return <p className="notice">{copy.common.loadingSession}</p>;
  }

  if (!user) {
    return (
      <section className="empty-state">
        <span className="eyebrow">{pageCopy.eyebrow}</span>
        <h1>{pageCopy.title}</h1>
        <p>{pageCopy.signInNotice}</p>
        <Link to="/auth" className="primary-button">
          {pageCopy.signInCta}
        </Link>
      </section>
    );
  }

  function resetModalFeedback() {
    setSettingsStatus('idle');
    setSettingsMessage('');
    setEmailStatus('idle');
    setEmailMessage('');
    setPasswordStatus('idle');
    setPasswordMessage('');
  }

  function getNotificationDestination(notification: ApiNotification) {
    if (notification.eventId) {
      return `/events/${notification.eventId}`;
    }

    if (notification.companyId) {
      return `/companies/${notification.companyId}`;
    }

    return '/account';
  }

  function getNotificationActionLabel(notification: ApiNotification) {
    const destination = getNotificationDestination(notification);

    if (destination === '/account') {
      return notificationsPanelCopy.openAccount;
    }

    if (destination.startsWith('/companies/')) {
      return notificationsPanelCopy.openCompany;
    }

    return notificationsPanelCopy.openEvent;
  }

  function localizeNotification(notification: ApiNotification) {
    const extractEventTitle = () =>
      notification.body.match(
        /(registered for|ticket for|commented on|published a new event:)\s(.+?)(?:\.|$)/,
      )?.[2] ?? notification.body;
    const extractCompanyName = () =>
      notification.body.match(/^(.+?)\s(shared update:|published a new event:)/)?.[1] ??
      notificationContentCopy.organizer;
    const extractNewsTitle = () =>
      notification.body.match(/^.+ shared update:\s(.+?)(?:\.|$)/)?.[1] ??
      notification.body;
    const extractActorName = () =>
      notification.body.match(/^(.+?)\s(registered for|commented on)/)?.[1] ??
      notificationContentCopy.someone;

    switch (notification.type) {
      case 'registration_confirmed':
        return {
          title: notification.title,
          body: notificationContentCopy.registrationConfirmed(extractEventTitle()),
        };
      case 'payment_confirmed':
        return {
          title: notification.title,
          body: notificationContentCopy.paymentConfirmed(extractEventTitle()),
        };
      case 'new_attendee':
        return {
          title: notification.title,
          body: notificationContentCopy.newAttendee(
            extractActorName(),
            extractEventTitle(),
          ),
        };
      case 'new_comment':
        return {
          title: notification.title,
          body: notificationContentCopy.newComment(
            extractActorName(),
            extractEventTitle(),
          ),
        };
      case 'event_reminder':
        return {
          title: notification.title,
          body: notificationContentCopy.reminder(extractEventTitle()),
        };
      case 'company_news':
        return {
          title: notification.title,
          body: notificationContentCopy.companyNews(
            extractCompanyName(),
            extractNewsTitle(),
          ),
        };
      case 'company_event':
        return {
          title: notification.title,
          body: notificationContentCopy.companyEvent(
            extractCompanyName(),
            extractEventTitle(),
          ),
        };
      default:
        return {
          title: notification.title,
          body: notification.body,
        };
    }
  }

  async function handleOpenNotification(notification: ApiNotification) {
    if (token && !notification.isRead) {
      try {
        const updated = await markNotificationAsRead(notification.id, token);
        setNotifications((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      } catch {
        // Keep navigation working even if read-state update fails.
      }
    }

    navigate(getNotificationDestination(notification));
  }

  async function handleMarkAllNotificationsRead() {
    if (!token) {
      return;
    }

    await markAllNotificationsAsRead(token);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
  }

  async function handleClearNotifications() {
    if (!token) {
      return;
    }

    await clearAllNotifications(token);
    setNotifications([]);
  }

  return (
    <section className="section">
      <div className="section-header section-header-panel">
        <span className="eyebrow">{pageCopy.eyebrow}</span>
        <h1>{pageCopy.title}</h1>
        <p>{pageCopy.text}</p>
      </div>

      <div className="account-overview">
        <article className="account-profile-card">
          <div className="account-panel-topline">
            <span className="eyebrow">{pageCopy.profileEyebrow}</span>
            <button
              type="button"
              className={`secondary-button account-settings-button ${
                settingsOpen ? 'active' : ''
              }`}
              onClick={() => {
                setSettingsOpen((value) => !value);
                setActiveSettingsTab('profile');
                resetModalFeedback();
              }}
            >
              {settingsOpen ? pageCopy.settingsClose : pageCopy.settingsCta}
            </button>
          </div>

          <div className="account-profile-head">
            <div className="account-avatar" aria-hidden="true">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="account-profile-copy">
              <h2>{pageCopy.profileTitle}</h2>
              <p>{pageCopy.profileText}</p>
            </div>
          </div>

          <div className="account-profile-grid">
            <div className="account-profile-item">
              <span>{pageCopy.nameLabel}</span>
              <strong>{user.displayName}</strong>
            </div>
            <div className="account-profile-item">
              <span>{pageCopy.emailLabel}</span>
              <strong>{user.email}</strong>
            </div>
            <div className="account-profile-item">
              <span>{pageCopy.memberSince}</span>
              <strong>{memberSinceLabel}</strong>
            </div>
            <div className="account-profile-item">
              <span>{pageCopy.interests}</span>
              <strong>
                {user.interests.length > 0 ? user.interests.join(', ') : pageCopy.noInterests}
              </strong>
            </div>
          </div>
        </article>

        <div className="account-stats-grid">
          <article className="account-stat-card">
            <span>{pageCopy.statConfirmed}</span>
            <strong>{confirmedCount}</strong>
          </article>
          <article className="account-stat-card">
            <span>{pageCopy.statPending}</span>
            <strong>{pendingCount}</strong>
          </article>
          <article className="account-stat-card">
            <span>{pageCopy.statTotal}</span>
            <strong>{registrations.length}</strong>
          </article>
        </div>
      </div>

      <div className="settings-toggle-grid account-section-tabs">
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('admin')}
        >
          <strong>{tabCopy.admin}</strong>
        </button>
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('events')}
        >
          <strong>{tabCopy.events}</strong>
        </button>
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('notifications')}
        >
          <strong>{tabCopy.notifications}</strong>
        </button>
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('tickets')}
        >
          <strong>{sectionCopy.tickets}</strong>
        </button>
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('companies')}
        >
          <strong>{sectionCopy.companies}</strong>
        </button>
      </div>

      {activeSectionTab === 'admin' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{adminCopy.eyebrow}</span>
            <h2>{adminCopy.title}</h2>
            <p>{adminCopy.text}</p>
          </div>

          <div className="admin-dashboard-grid">
            <article className="account-stat-card">
              <span>{adminCopy.eventsCount}</span>
              <strong>{scheduledEvents.length}</strong>
            </article>
            <article className="account-stat-card">
              <span>{adminCopy.companiesCount}</span>
              <strong>{user.companies.length}</strong>
            </article>
            <article className="account-stat-card">
              <span>{adminCopy.unreadNotifications}</span>
              <strong>{unreadNotificationsCount}</strong>
            </article>
            <article className="account-stat-card">
              <span>{adminCopy.ticketsCount}</span>
              <strong>{registrations.length}</strong>
            </article>
          </div>

          <div className="admin-actions-grid">
            <Link to="/create-event" className="related-card admin-action-card">
              <strong>{adminCopy.createEvent}</strong>
              <span className="muted">{copy.nav.createEvent}</span>
            </Link>
            <button
              type="button"
              className="related-card admin-action-card"
              onClick={() => setActiveSectionTab('companies')}
            >
              <strong>{adminCopy.openCompanies}</strong>
              <span className="muted">{pageCopy.companiesTitle}</span>
            </button>
            <button
              type="button"
              className="related-card admin-action-card"
              onClick={() => setActiveSectionTab('notifications')}
            >
              <strong>{adminCopy.openNotifications}</strong>
              <span className="muted">{notificationsPanelCopy.title}</span>
            </button>
            <button
              type="button"
              className="related-card admin-action-card"
              onClick={() => {
                setSettingsOpen(true);
                setActiveSettingsTab('profile');
                resetModalFeedback();
              }}
            >
              <strong>{adminCopy.openSettings}</strong>
              <span className="muted">{pageCopy.settingsTitle}</span>
            </button>
          </div>

          <div className="section-header section-header-panel account-tickets-header account-subsection-header">
            <span className="eyebrow">{adminCopy.latestEvents}</span>
            <h2>{eventsCopy.title}</h2>
          </div>

          {scheduledEvents.length === 0 ? (
            <p className="notice">{adminCopy.noEvents}</p>
          ) : (
            <div className="related-list">
              {scheduledEvents.slice(0, 3).map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="related-card">
                  <strong>{event.title}</strong>
                  <span className="muted">
                    {event.city} / {formatEventDate(event.startsAt, locale)}
                  </span>
                  <span>{adminCopy.jumpToEvent}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}

      {activeSectionTab === 'events' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{eventsCopy.eyebrow}</span>
            <h2>{eventsCopy.title}</h2>
            <p>{eventsCopy.text}</p>
          </div>

          {eventsStatus === 'loading' ? <p className="notice">{eventsCopy.loading}</p> : null}
          {eventsStatus === 'error' ? <p className="notice error">{eventsMessage}</p> : null}
          {eventsStatus === 'success' && scheduledEvents.length === 0 ? (
            <p className="notice">{eventsCopy.empty}</p>
          ) : null}

          {scheduledEvents.length > 0 ? (
            <div className="ticket-grid">
              {scheduledEvents.map((event) => {
                const isEventEnded = new Date(event.startsAt).getTime() < Date.now();
                const eventStatusLabel = !event.isPublished
                  ? eventsCopy.scheduled
                  : isEventEnded
                    ? eventsCopy.ended
                    : eventsCopy.published;

                return (
                  <article key={event.id} className="ticket-card">
                    <img
                      src={getEventPosterUrl(event)}
                      alt={`${event.title} poster`}
                      className="ticket-poster"
                    />
                    <div className="ticket-copy">
                      <div className="ticket-topline">
                        <span className="pill ticket-status">{eventStatusLabel}</span>
                        <span className="pill">{translateCategory(event.category)}</span>
                      </div>
                      <h3>{event.title}</h3>
                      <p>
                        {event.city} / {formatEventDate(event.startsAt, locale)}
                      </p>
                      <div className="ticket-meta-row">
                        <span className="ticket-price">
                          {formatPrice(event.price, locale, copy.common.free)}
                        </span>
                      </div>
                      <div className="ticket-actions">
                        <Link to={`/events/${event.id}`} className="inline-link ticket-open-link">
                          {eventsCopy.openEvent}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}

      {activeSectionTab === 'notifications' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{notificationsPanelCopy.eyebrow}</span>
            <h2>{notificationsPanelCopy.title}</h2>
            <p>{notificationsPanelCopy.text}</p>
          </div>

          <div className="notifications-inline-actions">
            <button
              type="button"
              className="notifications-mark-all footer"
              onClick={() => void handleMarkAllNotificationsRead()}
              disabled={notifications.length === 0}
            >
              {notificationsPanelCopy.markAll}
            </button>
            <button
              type="button"
              className="notifications-clear-all footer"
              onClick={() => void handleClearNotifications()}
              disabled={notifications.length === 0}
            >
              {notificationsPanelCopy.clearAll}
            </button>
          </div>

          {notificationsStatus === 'loading' ? (
            <p className="notice">{notificationsPanelCopy.loading}</p>
          ) : null}
          {notificationsStatus === 'error' ? (
            <p className="notice error">{notificationsMessage}</p>
          ) : null}
          {notificationsStatus === 'success' && notifications.length === 0 ? (
            <p className="notice">{notificationsPanelCopy.empty}</p>
          ) : null}

          {notifications.length > 0 ? (
            <div className="notifications-modal-list notifications-page-list">
              {notifications.map((notification) => {
                const localizedNotification = localizeNotification(notification);

                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      notification.isRead ? 'read' : 'unread'
                    }`}
                  >
                    <div className="notification-item-copy">
                      <strong>{localizedNotification.title}</strong>
                      <p>{localizedNotification.body}</p>
                      <span className="muted notification-item-state">
                        {notification.isRead
                          ? notificationsPanelCopy.read
                          : notificationsPanelCopy.unread}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="notification-open"
                      onClick={() => void handleOpenNotification(notification)}
                    >
                      {getNotificationActionLabel(notification)}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}

      {activeSectionTab === 'companies' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{pageCopy.companiesEyebrow}</span>
            <h2>{pageCopy.companiesTitle}</h2>
            <p>{pageCopy.companiesText}</p>
          </div>

          {user.companies.length === 0 ? (
            <p className="notice">{pageCopy.noCompanies}</p>
          ) : (
            <div className="related-list">
              {user.companies.map((company) => (
                <Link key={company.id} to={`/companies/${company.id}`} className="related-card">
                  <strong>{company.name}</strong>
                  <span className="muted">
                    {company.location} / {company.email}
                  </span>
                  <span>{pageCopy.openCompany}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}

      {activeSectionTab === 'tickets' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{pageCopy.ticketsEyebrow}</span>
            <h2>{pageCopy.ticketsTitle}</h2>
            <p>{pageCopy.ticketsText}</p>
          </div>

          {status === 'loading' ? <p className="notice">{pageCopy.loading}</p> : null}
          {status === 'error' ? <p className="notice error">{message}</p> : null}

          {status === 'success' && registrations.length === 0 ? (
            <section className="empty-state tickets-empty">
              <span className="eyebrow">{pageCopy.ticketsEyebrow}</span>
              <h1>{pageCopy.emptyTitle}</h1>
              <p>{pageCopy.emptyText}</p>
              <Link to="/discover" className="primary-button">
                {pageCopy.openDiscover}
              </Link>
            </section>
          ) : null}

          {registrations.length > 0 ? (
            <div className="ticket-grid">
              {registrations.map((registration) => (
                <article key={registration.id} className="ticket-card">
                  <img
                    src={getEventPosterUrl(registration.event)}
                    alt={`${registration.event.title} poster`}
                    className="ticket-poster"
                  />
                  <div className="ticket-copy">
                    <div className="ticket-topline">
                      <span
                        className={`pill ticket-status ${
                          registration.status === 'confirmed'
                            ? 'ticket-status-confirmed'
                            : 'ticket-status-pending'
                        }`}
                      >
                        {registration.status === 'confirmed'
                          ? pageCopy.statusConfirmed
                          : pageCopy.statusPending}
                      </span>
                      <span className="pill">
                        {translateCategory(registration.event.category)}
                      </span>
                    </div>

                    <h3>{registration.event.title}</h3>
                    <p>
                      {registration.event.city} /{' '}
                      {formatEventDate(registration.event.startsAt, locale)}
                    </p>
                    <div className="ticket-meta-row">
                      <span className="ticket-price">
                        {formatPrice(
                          registration.amountTotal || registration.event.price,
                          locale,
                          copy.common.free,
                        )}
                      </span>
                    </div>
                    {registration.paymentReceiptPreviewPath ||
                    registration.ticketAssetPath ? (
                      <div className="ticket-delivery-note">
                        <span>{deliveryCopy.ready}</span>
                        {registration.paymentReceiptSentAt ? (
                          <span className="muted">
                            {deliveryCopy.sentAt(
                              new Intl.DateTimeFormat(locale, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              }).format(new Date(registration.paymentReceiptSentAt)),
                            )}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="ticket-actions">
                      <Link
                        to={`/events/${registration.eventId}`}
                        className="inline-link ticket-open-link"
                      >
                        {pageCopy.openEvent}
                      </Link>
                      {registration.paymentReceiptPreviewPath ? (
                        <a
                          href={getApiAssetUrl(registration.paymentReceiptPreviewPath) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link ticket-open-link"
                        >
                          {deliveryCopy.openPreview}
                        </a>
                      ) : null}
                      {registration.ticketAssetPath ? (
                        <a
                          href={getApiAssetUrl(registration.ticketAssetPath) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link ticket-open-link"
                        >
                          {deliveryCopy.openTicket}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {settingsOpen ? (
        <div
          className="account-modal-backdrop"
          onClick={() => {
            setSettingsOpen(false);
            resetModalFeedback();
          }}
        >
          <div
            className="account-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={pageCopy.settingsTitle}
          >
            <aside className="account-modal-nav">
              <span className="eyebrow">{pageCopy.tabsTitle}</span>
              <button
                type="button"
                className={`account-modal-tab ${activeSettingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('profile')}
              >
                {pageCopy.profileTab}
              </button>
              <button
                type="button"
                className={`account-modal-tab ${activeSettingsTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('email')}
              >
                {pageCopy.emailTab}
              </button>
              <button
                type="button"
                className={`account-modal-tab ${
                  activeSettingsTab === 'password' ? 'active' : ''
                }`}
                onClick={() => setActiveSettingsTab('password')}
              >
                {pageCopy.passwordTab}
              </button>
              <button
                type="button"
                className={`account-modal-tab ${
                  activeSettingsTab === 'recovery' ? 'active' : ''
                }`}
                onClick={() => setActiveSettingsTab('recovery')}
              >
                {pageCopy.recoveryTab}
              </button>
            </aside>

            <div className="account-modal-panel">
              <button
                type="button"
                className="account-modal-close"
                onClick={() => {
                  setSettingsOpen(false);
                  resetModalFeedback();
                }}
                aria-label={pageCopy.settingsClose}
              >
                x
              </button>

              {activeSettingsTab === 'profile' ? (
                <form
                  className="account-settings-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setSettingsStatus('saving');
                    setSettingsMessage('');

                    try {
                      const interests = settingsInterests
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean);

                      await updateProfile({
                        displayName: settingsName.trim(),
                        interests,
                      });

                      setSettingsStatus('idle');
                      setSettingsMessage(pageCopy.settingsSaved);
                    } catch (error) {
                      setSettingsStatus('error');
                      setSettingsMessage(
                        error instanceof Error ? error.message : pageCopy.failedProfile,
                      );
                    }
                  }}
                >
                  <div className="account-settings-copy">
                    <h3>{pageCopy.modalProfileTitle}</h3>
                    <p>{pageCopy.modalProfileText}</p>
                  </div>

                  <label className="field">
                    <span>{pageCopy.displayName}</span>
                    <input
                      value={settingsName}
                      onChange={(event) => setSettingsName(event.target.value)}
                      placeholder={pageCopy.displayName}
                    />
                  </label>

                  <label className="field">
                    <span>{pageCopy.interestsLabel}</span>
                    <input
                      value={settingsInterests}
                      onChange={(event) => setSettingsInterests(event.target.value)}
                      placeholder={pageCopy.interestsHint}
                    />
                  </label>

                  {settingsMessage ? (
                    <p className={`notice ${settingsStatus === 'error' ? 'error' : 'success'}`}>
                      {settingsMessage}
                    </p>
                  ) : null}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={settingsStatus === 'saving'}
                    >
                      {settingsStatus === 'saving'
                        ? pageCopy.savingSettings
                        : pageCopy.saveSettings}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeSettingsTab === 'email' ? (
                <form
                  className="account-settings-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setEmailStatus('saving');
                    setEmailMessage('');

                    try {
                      await changeEmail({
                        newEmail: newEmail.trim(),
                        password: emailPassword,
                      });

                      setEmailPassword('');
                      setEmailStatus('idle');
                      setEmailMessage(pageCopy.emailSaved);
                    } catch (error) {
                      setEmailStatus('error');
                      setEmailMessage(
                        error instanceof Error ? error.message : pageCopy.failedEmail,
                      );
                    }
                  }}
                >
                  <div className="account-settings-copy">
                    <h3>{pageCopy.changeEmailTitle}</h3>
                    <p>{pageCopy.changeEmailText}</p>
                  </div>

                  <label className="field">
                    <span>{pageCopy.newEmailLabel}</span>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>

                  <label className="field">
                    <span>{pageCopy.currentPasswordLabel}</span>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(event) => setEmailPassword(event.target.value)}
                      placeholder="********"
                    />
                  </label>

                  {emailMessage ? (
                    <p className={`notice ${emailStatus === 'error' ? 'error' : 'success'}`}>
                      {emailMessage}
                    </p>
                  ) : null}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={emailStatus === 'saving'}
                    >
                      {emailStatus === 'saving' ? pageCopy.savingEmail : pageCopy.saveEmail}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeSettingsTab === 'password' ? (
                <form
                  className="account-settings-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setPasswordStatus('saving');
                    setPasswordMessage('');

                    try {
                      const responseMessage = await changePassword({
                        currentPassword,
                        newPassword: nextPassword,
                        confirmPassword,
                      });

                      setCurrentPassword('');
                      setNextPassword('');
                      setConfirmPassword('');
                      setPasswordStatus('idle');
                      setPasswordMessage(responseMessage || pageCopy.passwordSaved);
                    } catch (error) {
                      setPasswordStatus('error');
                      setPasswordMessage(
                        error instanceof Error ? error.message : pageCopy.failedPassword,
                      );
                    }
                  }}
                >
                  <div className="account-settings-copy">
                    <h3>{pageCopy.passwordTitle}</h3>
                    <p>{pageCopy.passwordText}</p>
                  </div>

                  <label className="field">
                    <span>{pageCopy.passwordCurrent}</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="********"
                    />
                  </label>

                  <label className="field">
                    <span>{pageCopy.passwordNew}</span>
                    <input
                      type="password"
                      value={nextPassword}
                      onChange={(event) => setNextPassword(event.target.value)}
                      placeholder="********"
                    />
                  </label>

                  <label className="field">
                    <span>{pageCopy.passwordRepeat}</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="********"
                    />
                  </label>

                  {passwordMessage ? (
                    <p
                      className={`notice ${
                        passwordStatus === 'error' ? 'error' : 'success'
                      }`}
                    >
                      {passwordMessage}
                    </p>
                  ) : null}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={passwordStatus === 'saving'}
                    >
                      {passwordStatus === 'saving'
                        ? pageCopy.savingPassword
                        : pageCopy.savePassword}
                    </button>
                  </div>
                </form>
              ) : null}

              {activeSettingsTab === 'recovery' ? (
                <div className="account-settings-form">
                  <div className="account-settings-copy">
                    <h3>{pageCopy.recoveryTitle}</h3>
                    <p>{pageCopy.recoveryText}</p>
                  </div>

                  <label className="field">
                    <span>{pageCopy.emailLabel}</span>
                    <input value={user.email} disabled />
                  </label>

                  <p className="notice">{pageCopy.recoveryHint}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
