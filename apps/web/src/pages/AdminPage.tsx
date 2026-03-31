import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AdminCommentItem,
  AdminCompanyItem,
  AdminEventItem,
  AdminOverview,
  AdminUserItem,
  deleteAdminComment,
  deleteAdminCompany,
  deleteAdminEvent,
  deleteAdminUser,
  fetchAdminComments,
  fetchAdminCompanies,
  fetchAdminEvents,
  fetchAdminOverview,
  fetchAdminUsers,
  formatEventDate,
  formatPrice,
  promoteAdminUser,
  revokeAdminUser,
} from '../lib/api';

type LoadStatus = 'loading' | 'success' | 'error';
type AdminTab = 'overview' | 'events' | 'companies' | 'comments' | 'users';

export function AdminPage() {
  const { user, token, isReady } = useAuth();
  const { language, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyItem[]>([]);
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [message, setMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const ui = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Панель адміністратора',
            title: 'Керуйте всією платформою',
            text: 'Тут можна переглядати користувачів, модерувати коментарі, видаляти чужі події та компанії й контролювати загальний стан сервісу.',
            signInNotice: 'Увійдіть, щоб відкрити глобальну адмін-панель.',
            denied: 'Ця сторінка доступна лише адміністратору.',
            loading: 'Завантажуємо адмін-панель...',
            tabs: {
              overview: 'Огляд',
              events: 'Усі події',
              companies: 'Усі компанії',
              comments: 'Усі коментарі',
              users: 'Усі користувачі',
            },
            stats: {
              users: 'Користувачі',
              events: 'Події',
              companies: 'Компанії',
              comments: 'Коментарі',
            },
            actions: {
              qr: 'Перевірка QR-квитків',
              qrHint: 'Швидкий вхід до сканера та ручної перевірки квитків',
              discover: 'Каталог подій',
              discoverHint: 'Переглянути публічну частину сервісу',
            },
            empty: {
              users: 'Користувачів поки немає.',
              events: 'Подій поки немає.',
              companies: 'Компаній поки немає.',
              comments: 'Коментарів поки немає.',
            },
            labels: {
              organizer: 'Організатор',
              company: 'Компанія',
              price: 'Ціна',
              owner: 'Власник',
              news: 'Новин',
              eventCount: 'Подій',
              subscriptions: 'Підписки',
              admin: 'Адміністратор',
              createdAt: 'Створено',
              author: 'Автор',
              reply: 'Відповідь',
            },
            buttons: {
              open: 'Відкрити',
              makeAdmin: 'Зробити адміном',
              removeAdmin: 'Зняти адміна',
              deleteUser: 'Видалити користувача',
              deleteEvent: 'Видалити подію',
              deleteCompany: 'Видалити компанію',
              deleteComment: 'Видалити коментар',
            },
            confirm: {
              promote: 'Призначити цього користувача адміністратором?',
              revoke: 'Зняти права адміністратора з цього користувача?',
              user: 'Видалити цього користувача?',
              event: 'Видалити цю подію?',
              company: 'Видалити цю компанію?',
              comment: 'Видалити цей коментар?',
            },
            success: {
              promote: 'Адмін-доступ надано.',
              revoke: 'Адмін-доступ знято.',
              user: 'Користувача видалено.',
              event: 'Подію видалено.',
              company: 'Компанію видалено.',
              comment: 'Коментар видалено.',
            },
            failed: 'Не вдалося виконати дію',
            free: 'Безкоштовно',
            yes: 'Так',
            no: 'Ні',
          }
        : {
            eyebrow: 'Admin panel',
            title: 'Manage the whole platform',
            text: 'Review users, moderate comments, remove events and companies, and keep the platform under control.',
            signInNotice: 'Sign in to open the global admin panel.',
            denied: 'This page is available to administrators only.',
            loading: 'Loading admin panel...',
            tabs: {
              overview: 'Overview',
              events: 'All events',
              companies: 'All companies',
              comments: 'All comments',
              users: 'All users',
            },
            stats: {
              users: 'Users',
              events: 'Events',
              companies: 'Companies',
              comments: 'Comments',
            },
            actions: {
              qr: 'QR ticket check-in',
              qrHint: 'Open the scanner and manual ticket verification tool',
              discover: 'Discover events',
              discoverHint: 'Open the public side of the service',
            },
            empty: {
              users: 'No users yet.',
              events: 'No events yet.',
              companies: 'No companies yet.',
              comments: 'No comments yet.',
            },
            labels: {
              organizer: 'Organizer',
              company: 'Company',
              price: 'Price',
              owner: 'Owner',
              news: 'News',
              eventCount: 'Events',
              subscriptions: 'Subscriptions',
              admin: 'Administrator',
              createdAt: 'Created',
              author: 'Author',
              reply: 'Reply',
            },
            buttons: {
              open: 'Open',
              makeAdmin: 'Make admin',
              removeAdmin: 'Remove admin',
              deleteUser: 'Delete user',
              deleteEvent: 'Delete event',
              deleteCompany: 'Delete company',
              deleteComment: 'Delete comment',
            },
            confirm: {
              promote: 'Promote this user to admin?',
              revoke: 'Remove admin rights from this user?',
              user: 'Delete this user?',
              event: 'Delete this event?',
              company: 'Delete this company?',
              comment: 'Delete this comment?',
            },
            success: {
              promote: 'Admin access granted.',
              revoke: 'Admin access revoked.',
              user: 'User deleted.',
              event: 'Event deleted.',
              company: 'Company deleted.',
              comment: 'Comment deleted.',
            },
            failed: 'Action failed',
            free: 'Free',
            yes: 'Yes',
            no: 'No',
          },
    [language],
  );

  useEffect(() => {
    if (!token || !user?.isAdmin) {
      setOverview(null);
      setUsers([]);
      setEvents([]);
      setCompanies([]);
      setComments([]);
      setStatus('success');
      return;
    }

    let active = true;
    const authToken = token;

    async function loadAdminData() {
      setStatus('loading');
      setMessage('');

      try {
        const [overviewData, usersData, eventsData, companiesData, commentsData] =
          await Promise.all([
            fetchAdminOverview(authToken),
            fetchAdminUsers(authToken),
            fetchAdminEvents(authToken),
            fetchAdminCompanies(authToken),
            fetchAdminComments(authToken),
          ]);

        if (!active) {
          return;
        }

        setOverview(overviewData);
        setUsers(usersData);
        setEvents(eventsData);
        setCompanies(companiesData);
        setComments(commentsData);
        setStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : ui.failed);
      }
    }

    void loadAdminData();

    return () => {
      active = false;
    };
  }, [token, ui.failed, user?.isAdmin]);

  async function handleDeleteEvent(eventId: string) {
    if (!token || !window.confirm(ui.confirm.event)) {
      return;
    }

    setBusyKey(`event:${eventId}`);
    setActionMessage('');

    try {
      await deleteAdminEvent(eventId, token);
      setEvents((current) => current.filter((item) => item.id !== eventId));
      setOverview((current) =>
        current ? { ...current, eventsCount: Math.max(0, current.eventsCount - 1) } : current,
      );
      setActionMessage(ui.success.event);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function handleDeleteCompany(companyId: string) {
    if (!token || !window.confirm(ui.confirm.company)) {
      return;
    }

    setBusyKey(`company:${companyId}`);
    setActionMessage('');

    try {
      await deleteAdminCompany(companyId, token);
      setCompanies((current) => current.filter((item) => item.id !== companyId));
      setOverview((current) =>
        current ? { ...current, companiesCount: Math.max(0, current.companiesCount - 1) } : current,
      );
      setActionMessage(ui.success.company);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!token || !window.confirm(ui.confirm.comment)) {
      return;
    }

    setBusyKey(`comment:${commentId}`);
    setActionMessage('');

    try {
      await deleteAdminComment(commentId, token);
      setComments((current) => current.filter((item) => item.id !== commentId));
      setOverview((current) =>
        current ? { ...current, commentsCount: Math.max(0, current.commentsCount - 1) } : current,
      );
      setActionMessage(ui.success.comment);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function handlePromoteUser(userId: string) {
    if (!token || !window.confirm(ui.confirm.promote)) {
      return;
    }

    setBusyKey(`promote:${userId}`);
    setActionMessage('');

    try {
      await promoteAdminUser(userId, token);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? { ...item, isAdmin: true } : item)),
      );
      setActionMessage(ui.success.promote);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function handleRevokeUser(userId: string) {
    if (!token || !window.confirm(ui.confirm.revoke)) {
      return;
    }

    setBusyKey(`revoke:${userId}`);
    setActionMessage('');

    try {
      await revokeAdminUser(userId, token);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? { ...item, isAdmin: false } : item)),
      );
      setActionMessage(ui.success.revoke);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!token || !window.confirm(ui.confirm.user)) {
      return;
    }

    setBusyKey(`user:${userId}`);
    setActionMessage('');

    try {
      await deleteAdminUser(userId, token);
      setUsers((current) => current.filter((item) => item.id !== userId));
      setOverview((current) =>
        current ? { ...current, usersCount: Math.max(0, current.usersCount - 1) } : current,
      );
      setActionMessage(ui.success.user);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : ui.failed);
    } finally {
      setBusyKey('');
    }
  }

  if (!isReady) {
    return <p className="notice">{ui.loading}</p>;
  }

  if (!token || !user) {
    return (
      <section className="account-page">
        <p className="notice">{ui.signInNotice}</p>
      </section>
    );
  }

  if (!user.isAdmin) {
    return (
      <section className="account-page">
        <p className="notice error">{ui.denied}</p>
      </section>
    );
  }

  return (
    <section className="account-page">
      <div className="section-header section-header-panel account-tickets-header">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.text}</p>
      </div>

      <div className="admin-page-tabs">
        {(Object.keys(ui.tabs) as AdminTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`settings-tile ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <strong>{ui.tabs[tab]}</strong>
          </button>
        ))}
      </div>

      {status === 'loading' ? <p className="notice">{ui.loading}</p> : null}
      {status === 'error' ? <p className="notice error">{message}</p> : null}
      {actionMessage ? <p className="notice success">{actionMessage}</p> : null}

      {status === 'success' && activeTab === 'overview' && overview ? (
        <>
          <div className="admin-dashboard-grid">
            <article className="account-stat-card">
              <span>{ui.stats.users}</span>
              <strong>{overview.usersCount}</strong>
            </article>
            <article className="account-stat-card">
              <span>{ui.stats.events}</span>
              <strong>{overview.eventsCount}</strong>
            </article>
            <article className="account-stat-card">
              <span>{ui.stats.companies}</span>
              <strong>{overview.companiesCount}</strong>
            </article>
            <article className="account-stat-card">
              <span>{ui.stats.comments}</span>
              <strong>{overview.commentsCount}</strong>
            </article>
          </div>

          <div className="admin-actions-grid">
            <Link to="/admin/check-in" className="related-card admin-action-card">
              <strong>{ui.actions.qr}</strong>
              <span className="muted">{ui.actions.qrHint}</span>
            </Link>
            <Link to="/discover" className="related-card admin-action-card">
              <strong>{ui.actions.discover}</strong>
              <span className="muted">{ui.actions.discoverHint}</span>
            </Link>
          </div>
        </>
      ) : null}

      {status === 'success' && activeTab === 'events' ? (
        events.length === 0 ? (
          <p className="notice">{ui.empty.events}</p>
        ) : (
          <div className="admin-entity-list">
            {events.map((event) => (
              <article key={event.id} className="admin-entity-card">
                <div className="admin-entity-main">
                  <div>
                    <h3>{event.title}</h3>
                    <p className="muted">
                      {event.city} / {formatEventDate(event.startsAt, locale)}
                    </p>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.company}</span>
                    <strong>{event.company?.name ?? '—'}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.organizer}</span>
                    <strong>{event.organizer?.displayName ?? '—'}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.price}</span>
                    <strong>{formatPrice(event.price, locale, ui.free)}</strong>
                  </div>
                </div>
                <div className="admin-entity-actions">
                  <Link to={`/events/${event.id}`} className="secondary-button">
                    {ui.buttons.open}
                  </Link>
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => void handleDeleteEvent(event.id)}
                    disabled={busyKey === `event:${event.id}`}
                  >
                    {ui.buttons.deleteEvent}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {status === 'success' && activeTab === 'companies' ? (
        companies.length === 0 ? (
          <p className="notice">{ui.empty.companies}</p>
        ) : (
          <div className="admin-entity-list">
            {companies.map((company) => (
              <article key={company.id} className="admin-entity-card">
                <div className="admin-entity-main">
                  <div>
                    <h3>{company.name}</h3>
                    <p className="muted">{company.location}</p>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.owner}</span>
                    <strong>{company.owner?.displayName ?? '—'}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.eventCount}</span>
                    <strong>{company.eventsCount}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.news}</span>
                    <strong>{company.newsCount}</strong>
                  </div>
                </div>
                <div className="admin-entity-actions">
                  <Link to={`/companies/${company.id}`} className="secondary-button">
                    {ui.buttons.open}
                  </Link>
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => void handleDeleteCompany(company.id)}
                    disabled={busyKey === `company:${company.id}`}
                  >
                    {ui.buttons.deleteCompany}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {status === 'success' && activeTab === 'comments' ? (
        comments.length === 0 ? (
          <p className="notice">{ui.empty.comments}</p>
        ) : (
          <div className="admin-entity-list">
            {comments.map((comment) => (
              <article key={comment.id} className="admin-entity-card">
                <div className="admin-entity-main">
                  <div>
                    <h3>{comment.eventTitle}</h3>
                    <p>{comment.content}</p>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.author}</span>
                    <strong>{comment.author?.displayName ?? '—'}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.createdAt}</span>
                    <strong>{formatEventDate(comment.createdAt, locale)}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.reply}</span>
                    <strong>{comment.parentCommentId ? ui.yes : ui.no}</strong>
                  </div>
                </div>
                <div className="admin-entity-actions">
                  <Link to={`/events/${comment.eventId}`} className="secondary-button">
                    {ui.buttons.open}
                  </Link>
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => void handleDeleteComment(comment.id)}
                    disabled={busyKey === `comment:${comment.id}`}
                  >
                    {ui.buttons.deleteComment}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {status === 'success' && activeTab === 'users' ? (
        users.length === 0 ? (
          <p className="notice">{ui.empty.users}</p>
        ) : (
          <div className="admin-entity-list">
            {users.map((item) => (
              <article key={item.id} className="admin-entity-card">
                <div className="admin-entity-main">
                  <div>
                    <h3>{item.displayName}</h3>
                    <p className="muted">{item.email}</p>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.admin}</span>
                    <strong>{item.isAdmin ? ui.yes : ui.no}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.subscriptions}</span>
                    <strong>{item.subscribedCompanyIds.length}</strong>
                  </div>
                  <div className="admin-entity-meta">
                    <span>{ui.labels.eventCount}</span>
                    <strong>{item.companiesCount}</strong>
                  </div>
                </div>
                <div className="admin-entity-actions">
                  {item.isAdmin ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void handleRevokeUser(item.id)}
                      disabled={busyKey === `revoke:${item.id}` || item.id === user.id}
                    >
                      {ui.buttons.removeAdmin}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void handlePromoteUser(item.id)}
                      disabled={busyKey === `promote:${item.id}`}
                    >
                      {ui.buttons.makeAdmin}
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => void handleDeleteUser(item.id)}
                    disabled={busyKey === `user:${item.id}` || item.id === user.id}
                  >
                    {ui.buttons.deleteUser}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
