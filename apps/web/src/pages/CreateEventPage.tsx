import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateFormat, translateTheme } from '../i18n/translations';
import { ApiEvent, createEvent, fetchMyScheduledEvents, formatEventDate } from '../lib/api';

const initialForm = {
  title: '',
  description: '',
  category: '',
  format: 'Meetup',
  theme: 'Community',
  attendeeVisibility: 'everyone' as 'everyone' | 'registered_only' | 'nobody',
  notifyOnNewAttendee: true,
  commentAccess: 'everyone' as 'everyone' | 'registered_only' | 'closed',
  city: '',
  startsAt: '',
  publishAt: '',
  price: '0',
  capacity: '50',
};

export function CreateEventPage() {
  const { user, token, isReady } = useAuth();
  const { copy, locale } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [scheduledEvents, setScheduledEvents] = useState<ApiEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const formCopy =
    locale === 'uk-UA'
      ? { format: 'Формат', theme: 'Тема' }
      : { format: 'Format', theme: 'Theme' };
  const attendeeCopy =
    locale === 'uk-UA'
      ? {
          label: 'Хто бачить учасників',
          everyone: 'Усі',
          registeredOnly: 'Тільки зареєстровані',
          nobody: 'Ніхто',
        }
      : {
          label: 'Who can see attendees',
          everyone: 'Everyone',
          registeredOnly: 'Registered users only',
          nobody: 'Nobody',
        };
  const eventSettingsCopy =
    locale === 'uk-UA'
      ? {
          notifyOnNewAttendee: 'Сповіщати про нових відвідувачів',
          commentAccess: 'Коментарі',
          commentsEveryone: 'Відкриті для всіх авторизованих',
          commentsRegisteredOnly: 'Тільки для зареєстрованих',
          commentsClosed: 'Закриті',
        }
      : {
          notifyOnNewAttendee: 'Notify me about new attendees',
          commentAccess: 'Comments',
          commentsEveryone: 'Open for signed-in users',
          commentsRegisteredOnly: 'Registered attendees only',
          commentsClosed: 'Closed',
        };
  const booleanCopy =
    locale === 'uk-UA'
      ? { yes: 'Так', no: 'Ні' }
      : { yes: 'Yes', no: 'No' };
  const publicationCopy =
    locale === 'uk-UA'
      ? {
          startsAtLabel: 'Дата і час проведення',
          label: 'Дата викладення',
          helper: 'Залиште порожнім, якщо подію треба опублікувати одразу.',
          panelTitle: 'Заплановані публікації',
          panelText: 'Тут зберігаються події, які ще чекають на свою дату викладення.',
          empty: 'Поки що немає запланованих публікацій.',
          publishOn: 'Викладення',
        }
      : {
          startsAtLabel: 'Event date and time',
          label: 'Publish date',
          helper: 'Leave empty if the event should appear immediately.',
          panelTitle: 'Scheduled publications',
          panelText: 'Events waiting for their publication date will appear here.',
          empty: 'No scheduled publications yet.',
          publishOn: 'Publishes',
        };

  useEffect(() => {
    return () => {
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
    };
  }, [posterPreview]);

  useEffect(() => {
    let active = true;

    async function loadScheduledEvents() {
      if (!token) {
        setScheduledEvents([]);
        return;
      }

      try {
        const payload = await fetchMyScheduledEvents(token);

        if (active) {
          setScheduledEvents(payload);
        }
      } catch {
        if (active) {
          setScheduledEvents([]);
        }
      }
    }

    void loadScheduledEvents();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      if (!token) {
        throw new Error(copy.create.signInNotice);
      }

      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('category', form.category);
      payload.append('format', form.format);
      payload.append('theme', form.theme);
      payload.append('attendeeVisibility', form.attendeeVisibility);
      payload.append('notifyOnNewAttendee', String(form.notifyOnNewAttendee));
      payload.append('commentAccess', form.commentAccess);
      payload.append('city', form.city);
      payload.append('startsAt', new Date(form.startsAt).toISOString());
      payload.append('publishAt', form.publishAt ? new Date(form.publishAt).toISOString() : '');
      payload.append('price', String(Number(form.price)));
      payload.append('capacity', String(Number(form.capacity)));

      if (posterFile) {
        payload.append('poster', posterFile);
      }

      await createEvent(payload, token);
      const refreshedScheduled = await fetchMyScheduledEvents(token);

      setStatus('success');
      setMessage(copy.create.successMessage);
      setForm(initialForm);
      setPosterFile(null);
      setPosterPreview('');
      setScheduledEvents(refreshedScheduled);
    } catch (submitError) {
      setStatus('error');
      setMessage(
        submitError instanceof Error ? submitError.message : copy.create.failedMessage,
      );
    }
  }

  return (
    <section className="form-shell">
      <div className="form-sidebar">
        <span className="eyebrow">{copy.create.eyebrow}</span>
        <h1>{copy.create.title}</h1>
        <p>{copy.create.text}</p>

        <ul className="feature-list">
          {copy.create.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <p className="muted">{copy.create.demoAccount}</p>
        {user ? <p className="muted">{copy.create.signedInAs(user.displayName, user.email)}</p> : null}

        {user ? (
          <div className="scheduled-publications-panel">
            <div className="scheduled-panel-header">
              <strong>{publicationCopy.panelTitle}</strong>
              <p className="muted">{publicationCopy.panelText}</p>
            </div>

            {scheduledEvents.length === 0 ? (
              <p className="muted">{publicationCopy.empty}</p>
            ) : (
              <div className="scheduled-publications-list">
                {scheduledEvents.map((item) => (
                  <Link key={item.id} to={`/events/${item.id}`} className="scheduled-publication-card">
                    <strong>{item.title}</strong>
                    <span className="muted">
                      {publicationCopy.publishOn}: {formatEventDate(item.publishAt ?? item.createdAt, locale)}
                    </span>
                    <span className="muted">
                      {item.city} / {formatEventDate(item.startsAt, locale)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!isReady ? <p className="notice">{copy.common.loadingSession}</p> : null}
      {isReady && !user ? (
        <div className="form-card">
          <p className="notice">{copy.create.signInNotice}</p>
          <Link to="/auth" className="primary-button">
            {copy.create.signInCta}
          </Link>
        </div>
      ) : null}

      {isReady && user ? (
        <form className="form-card" onSubmit={handleSubmit}>
          <label className="field">
            <span>{copy.create.titleLabel}</span>
            <input
              placeholder={copy.create.titlePlaceholder}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </label>

          <label className="field">
            <span>{copy.create.descriptionLabel}</span>
            <textarea
              placeholder={copy.create.descriptionPlaceholder}
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              required
            />
          </label>

          <div className="event-structure-grid">
            <label className="field">
              <span>{copy.create.categoryLabel}</span>
              <input
                placeholder={copy.create.categoryPlaceholder}
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{formCopy.format}</span>
              <select
                value={form.format}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    format: event.target.value,
                  }))
                }
                required
              >
                <option value="Meetup">{translateFormat('Meetup', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Workshop">{translateFormat('Workshop', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Conference">{translateFormat('Conference', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Lecture">{translateFormat('Lecture', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              </select>
            </label>

            <label className="field">
              <span>{formCopy.theme}</span>
              <select
                value={form.theme}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    theme: event.target.value,
                  }))
                }
                required
              >
                <option value="Community">{translateTheme('Community', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Technology">{translateTheme('Technology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Startups">{translateTheme('Startups', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Design">{translateTheme('Design', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Business">{translateTheme('Business', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Education">{translateTheme('Education', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Art">{translateTheme('Art', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Psychology">{translateTheme('Psychology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                <option value="Sports">{translateTheme('Sports', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              </select>
            </label>

            <label className="field">
              <span>{copy.create.cityLabel}</span>
              <input
                placeholder={copy.create.cityPlaceholder}
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{attendeeCopy.label}</span>
              <select
                value={form.attendeeVisibility}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attendeeVisibility: event.target.value as
                      | 'everyone'
                      | 'registered_only'
                      | 'nobody',
                  }))
                }
              >
                <option value="everyone">{attendeeCopy.everyone}</option>
                <option value="registered_only">{attendeeCopy.registeredOnly}</option>
                <option value="nobody">{attendeeCopy.nobody}</option>
              </select>
            </label>

            <label className="field">
              <span>{eventSettingsCopy.notifyOnNewAttendee}</span>
              <select
                value={form.notifyOnNewAttendee ? 'yes' : 'no'}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notifyOnNewAttendee: event.target.value === 'yes',
                  }))
                }
              >
                <option value="yes">{booleanCopy.yes}</option>
                <option value="no">{booleanCopy.no}</option>
              </select>
            </label>

            <label className="field">
              <span>{eventSettingsCopy.commentAccess}</span>
              <select
                value={form.commentAccess}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    commentAccess: event.target.value as
                      | 'everyone'
                      | 'registered_only'
                      | 'closed',
                  }))
                }
              >
                <option value="everyone">{eventSettingsCopy.commentsEveryone}</option>
                <option value="registered_only">{eventSettingsCopy.commentsRegisteredOnly}</option>
                <option value="closed">{eventSettingsCopy.commentsClosed}</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>{copy.create.posterLabel}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                if (posterPreview) {
                  URL.revokeObjectURL(posterPreview);
                }

                setPosterFile(nextFile);
                setPosterPreview(nextFile ? URL.createObjectURL(nextFile) : '');
              }}
            />
          </label>

          {posterPreview ? (
            <img src={posterPreview} alt="Poster preview" className="event-poster-large" />
          ) : null}

          <div className="event-timing-grid">
            <label className="field">
              <span>{publicationCopy.startsAtLabel}</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{publicationCopy.label}</span>
              <input
                type="datetime-local"
                value={form.publishAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publishAt: event.target.value,
                  }))
                }
              />
              <small className="field-hint">{publicationCopy.helper}</small>
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>{copy.create.priceLabel}</span>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>{copy.create.capacityLabel}</span>
              <input
                type="number"
                placeholder="50"
                min="1"
                step="1"
                value={form.capacity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={status === 'saving'}
            >
              {status === 'saving' ? copy.common.saving : copy.create.createAction}
            </button>
            <Link to="/discover" className="secondary-button">
              {copy.create.openDiscover}
            </Link>
          </div>

          {message ? (
            <p className={`notice ${status === 'error' ? 'error' : 'success'}`}>{message}</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
