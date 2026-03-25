import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  fetchCompanyById,
  fetchMyRegistrations,
  formatEventDate,
  formatPrice,
  getApiAssetUrl,
  getEventPosterUrl,
} from '../lib/api';

type TicketsStatus = 'loading' | 'success' | 'error';
type SaveStatus = 'idle' | 'saving' | 'error';
type AccountSettingsTab = 'profile' | 'email' | 'password' | 'recovery';
type AccountSectionTab = 'tickets' | 'companies' | 'publications';

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
  const [activeSectionTab, setActiveSectionTab] =
    useState<AccountSectionTab>('tickets');
  const [companyPublications, setCompanyPublications] = useState<
    Awaited<ReturnType<typeof fetchCompanyById>>[]
  >([]);
  const [publicationsStatus, setPublicationsStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [publicationsMessage, setPublicationsMessage] = useState('');

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

  const confirmedCount = registrations.filter(
    (registration) => registration.status === 'confirmed',
  ).length;
  const pendingCount = registrations.length - confirmedCount;
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

    async function loadCompanyPublications() {
      if (!token || !user || user.companies.length === 0) {
        if (active) {
          setCompanyPublications([]);
          setPublicationsStatus('success');
          setPublicationsMessage('');
        }
        return;
      }

      setPublicationsStatus('loading');
      setPublicationsMessage('');

      try {
        const payload = await Promise.all(
          user.companies.map((company) => fetchCompanyById(company.id, token)),
        );

        if (!active) {
          return;
        }

        setCompanyPublications(payload);
        setPublicationsStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setCompanyPublications([]);
        setPublicationsStatus('error');
        setPublicationsMessage(
          error instanceof Error ? error.message : sectionCopy.publicationsFailed,
        );
      }
    }

    void loadCompanyPublications();

    return () => {
      active = false;
    };
  }, [sectionCopy.publicationsFailed, token, user]);

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
        <button
          type="button"
          className={`settings-tile ${activeSectionTab === 'publications' ? 'active' : ''}`}
          onClick={() => setActiveSectionTab('publications')}
        >
          <strong>{sectionCopy.publications}</strong>
        </button>
      </div>

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

      {activeSectionTab === 'publications' ? (
        <>
          <div className="section-header section-header-panel account-tickets-header">
            <span className="eyebrow">{sectionCopy.publicationsEyebrow}</span>
            <h2>{sectionCopy.publicationsTitle}</h2>
            <p>{sectionCopy.publicationsText}</p>
          </div>

          {publicationsStatus === 'loading' ? (
            <p className="notice">{sectionCopy.publicationsLoading}</p>
          ) : null}
          {publicationsStatus === 'error' ? (
            <p className="notice error">
              {publicationsMessage || sectionCopy.publicationsFailed}
            </p>
          ) : null}
          {publicationsStatus === 'success' &&
          companyPublications.every(
            (company) => company.events.length === 0 && company.news.length === 0,
          ) ? (
            <p className="notice">{sectionCopy.noPublications}</p>
          ) : null}

          {companyPublications.length > 0 ? (
            <div className="card-grid">
              {companyPublications.map((company) => (
                <article key={company.id} className="event-card company-card">
                  <div className="company-card-topline">
                    <span className="pill">{company.location}</span>
                    <Link to={`/companies/${company.id}`} className="inline-link company-open-link">
                      {pageCopy.openCompany}
                    </Link>
                  </div>

                  <h3>{company.name}</h3>

                  <div className="company-news-preview">
                    <strong>{sectionCopy.latestNews}</strong>
                    {company.news[0] ? (
                      <>
                        <span className="muted">
                          {formatEventDate(company.news[0].createdAt, locale)}
                        </span>
                        <p>{company.news[0].title}</p>
                      </>
                    ) : (
                      <p>{sectionCopy.noCompanyNews}</p>
                    )}
                  </div>

                  <div className="company-news-preview">
                    <strong>{sectionCopy.companyEvents}</strong>
                    {company.events.length > 0 ? (
                      company.events.slice(0, 2).map((event) => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="inline-link company-open-link"
                        >
                          {event.title}
                        </Link>
                      ))
                    ) : (
                      <p>{sectionCopy.noCompanyEvents}</p>
                    )}
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
