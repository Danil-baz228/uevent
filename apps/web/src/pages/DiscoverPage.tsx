import { useEvents } from '../hooks/useEvents';
import { formatEventDate, formatPrice } from '../lib/api';

export function DiscoverPage() {
  const { events, status, error } = useEvents();

  return (
    <section className="section">
      <div className="section-header">
        <span className="eyebrow">Discover</span>
        <h1>Browse live events from PostgreSQL</h1>
        <p>
          This catalogue now reads directly from `/api/events` instead of static
          mock data.
        </p>
      </div>

      <div className="pill-row">
        <span className="pill">Networking</span>
        <span className="pill">Workshop</span>
        <span className="pill">Meetup</span>
        <span className="pill">Free</span>
        <span className="pill">Paid</span>
      </div>

      <div className="list-grid">
        {status === 'loading' ? <p className="notice">Loading events...</p> : null}
        {status === 'error' ? <p className="notice error">{error}</p> : null}
        {status === 'success' && events.length === 0 ? (
          <p className="notice">No events in the database yet.</p>
        ) : null}
        {events.map((event) => (
          <article key={event.id} className="list-card">
            <div>
              <span className="pill">{event.category}</span>
              <h3>{event.title}</h3>
              <p>
                {event.city} / {formatEventDate(event.startsAt)}
              </p>
              <p className="muted">
                Organizer: {event.organizer?.displayName ?? 'Community Host'}
              </p>
            </div>

            <div className="list-card-meta">
              <strong>{formatPrice(event.price)}</strong>
              <span>{event.capacity} spots</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
