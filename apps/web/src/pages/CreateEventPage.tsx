import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
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
        throw new Error('Please sign in before creating an event');
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
      setMessage('Event saved to PostgreSQL successfully.');
      setForm(initialForm);
      setPosterFile(null);
      setPosterPreview('');
    } catch (submitError) {
      setStatus('error');
      setMessage(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create the event',
      );
    }
  }

  return (
    <section className="form-shell">
      <div className="form-sidebar">
        <span className="eyebrow">Organizer flow</span>
        <h1>Create a real event in the database</h1>
        <p>
          This form writes directly to the NestJS API, and each successful
          submit becomes a row in PostgreSQL.
        </p>

        <ul className="feature-list">
          <li>TypeORM persists every created event</li>
          <li>The logged-in user becomes the organizer</li>
          <li>New events appear on the Discover page after reload</li>
          <li>You can upload a poster from your computer or use the default cover</li>
        </ul>

        <p className="muted">Demo account: demo@uevent.local / demo12345</p>
        {user ? (
          <p className="muted">
            Signed in as {user.displayName} ({user.email})
          </p>
        ) : null}
      </div>

      {!isReady ? <p className="notice">Loading session...</p> : null}
      {isReady && !user ? (
        <div className="form-card">
          <p className="notice">
            Please sign in first. Event creation is now protected by JWT auth.
          </p>
          <Link to="/auth" className="primary-button">
            Go to login
          </Link>
        </div>
      ) : null}

      {isReady && user ? (
      <form className="form-card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>
          <input
            placeholder="Product Night for Curious Builders"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            placeholder="What should people expect from this gathering?"
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
            <span>Category</span>
            <input
              placeholder="Networking"
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
            <span>City</span>
            <input
              placeholder="Kharkiv"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Poster image</span>
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
          <img
            src={posterPreview}
            alt="Poster preview"
            className="event-poster-large"
          />
        ) : null}

        <div className="form-grid">
          <label className="field">
            <span>Date and time</span>
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
            <span>Ticket price</span>
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
            <span>Capacity</span>
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
            {status === 'saving' ? 'Saving...' : 'Create event'}
          </button>
          <Link to="/discover" className="secondary-button">
            Open discover page
          </Link>
        </div>

        {message ? (
          <p className={`notice ${status === 'error' ? 'error' : 'success'}`}>
            {message}
          </p>
        ) : null}
      </form>
      ) : null}
    </section>
  );
}
