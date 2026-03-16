import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useEvents } from '../hooks/useEvents';
import { fetchHealth, formatEventDate, formatPrice } from '../lib/api';

export function HomePage() {
  const { events, status, error } = useEvents();
  const [apiStatus, setApiStatus] = useState('Checking API...');

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      try {
        const payload = await fetchHealth();

        if (!active) {
          return;
        }

        setApiStatus(`${payload.service} is ${payload.status}`);
      } catch {
        if (!active) {
          return;
        }

        setApiStatus('API is unavailable');
      }
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, []);

  const featuredEvents = events.slice(0, 3);
  const palette = ['sunrise', 'mint', 'night'];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">Connect around shared interests</span>
          <h1 className="hero-title">
            Uevent helps people discover communities, gatherings, and creators
            that already feel like home.
          </h1>
          <p className="hero-text">
            The project now runs as a real full-stack MVP with React on the web,
            NestJS on the backend, and PostgreSQL for persistence.
          </p>
          <div className="hero-actions">
            <Link to="/discover" className="primary-button">
              Explore events
            </Link>
            <Link to="/create-event" className="secondary-button">
              Plan your first event
            </Link>
          </div>
          <p className="status-row">{apiStatus}</p>
        </div>

        <div className="stat-grid">
          <article className="stat-card">
            <strong>{events.length} live events</strong>
            <p>The homepage is already reading rows from the API.</p>
          </article>
          <article className="stat-card">
            <strong>Postgres-backed</strong>
            <p>TypeORM repositories now persist users and events in Docker.</p>
          </article>
          <article className="stat-card">
            <strong>Create and discover</strong>
            <p>The create-event flow writes directly to the database.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Live feed</span>
          <h2>Featured events coming from the API</h2>
        </div>

        <div className="card-grid">
          {status === 'loading' ? <p className="notice">Loading events...</p> : null}
          {status === 'error' ? <p className="notice error">{error}</p> : null}
          {status === 'success' && featuredEvents.length === 0 ? (
            <p className="notice">No events yet. Create the first one.</p>
          ) : null}
          {featuredEvents.map((event, index) => (
            <article
              key={event.id}
              className={`event-card ${palette[index % palette.length]}`}
            >
              <span className="pill">{event.category}</span>
              <h3>{event.title}</h3>
              <p>
                {event.city} / {formatEventDate(event.startsAt)}
              </p>
              <div className="event-meta">
                <span>{formatPrice(event.price)}</span>
                <span>{event.capacity} spots</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="spotlight">
        <article>
          <span className="eyebrow">Challenge</span>
          <h3>How do we bring together people with similar concerns?</h3>
          <p>
            By combining event discovery, creator visibility, and a simple
            organizer flow in one place instead of scattered chats and docs.
          </p>
        </article>
        <article>
          <span className="eyebrow">Technical base</span>
          <h3>Monorepo from day one</h3>
          <p>
            React on the web, NestJS on the backend, PostgreSQL in Docker, and
            clear modules for auth, events, users, and payments.
          </p>
        </article>
        <article>
          <span className="eyebrow">Next move</span>
          <h3>Ready for the next milestone</h3>
          <p>
            The MVP already stores real data. Next up can be JWT auth, search,
            participation flows, and Stripe checkout.
          </p>
        </article>
      </section>
    </>
  );
}
