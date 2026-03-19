import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { createEvent } from '../lib/api';

const initialForm = {
  title: '',
  description: '',
  category: '',
  city: '',
  startsAt: '',
  price: '0',
  capacity: '50',
};

export function CreateEventPage() {
  const { user, token, isReady } = useAuth();
  const { copy } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
    };
  }, [posterPreview]);

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
      payload.append('city', form.city);
      payload.append('startsAt', new Date(form.startsAt).toISOString());
      payload.append('price', String(Number(form.price)));
      payload.append('capacity', String(Number(form.capacity)));

      if (posterFile) {
        payload.append('poster', posterFile);
      }

      await createEvent(payload, token);

      setStatus('success');
      setMessage(copy.create.successMessage);
      setForm(initialForm);
      setPosterFile(null);
      setPosterPreview('');
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

          <div className="form-grid">
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

          <div className="form-grid">
            <label className="field">
              <span>{copy.create.dateTimeLabel}</span>
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
