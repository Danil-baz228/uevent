import { Link } from 'react-router-dom';

import { mockEvents } from '../data/mockEvents';

export function HomePage() {
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
            The brief asks for a service that unites people with the same
            interests. This scaffold starts with discovery, event creation, and
            a future-ready payments flow for paid experiences.
          </p>
          <div className="hero-actions">
            <Link to="/discover" className="primary-button">
              Explore events
            </Link>
            <Link to="/create-event" className="secondary-button">
              Plan your first event
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          <article className="stat-card">
            <strong>Interest-first</strong>
            <p>People find events through topics, not just dates and cities.</p>
          </article>
          <article className="stat-card">
            <strong>Free or paid</strong>
            <p>Stripe is already reserved in the architecture for ticketing.</p>
          </article>
          <article className="stat-card">
            <strong>Community-led</strong>
            <p>Organizers can launch intimate meetups or bigger public events.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Starter feed</span>
          <h2>Mock events that can become the first real API-connected cards</h2>
        </div>

        <div className="card-grid">
          {mockEvents.map((event) => (
            <article key={event.id} className={`event-card ${event.mood}`}>
              <span className="pill">{event.category}</span>
              <h3>{event.title}</h3>
              <p>
                {event.city} · {event.startsAt}
              </p>
              <div className="event-meta">
                <span>{event.price}</span>
                <span>{event.attendance}</span>
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
            By combining profiles, events, and shared intent into one discovery
            flow instead of scattering them across chats and spreadsheets.
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
          <h3>Replace mocks with real data</h3>
          <p>
            The UI and API are shaped to let us wire repositories, JWT auth,
            search, and checkout without rewriting the project structure later.
          </p>
        </article>
      </section>
    </>
  );
}
