import { mockEvents } from '../data/mockEvents';

export function DiscoverPage() {
  return (
    <section className="section">
      <div className="section-header">
        <span className="eyebrow">Discover</span>
        <h1>Browse the first event catalogue layout</h1>
        <p>
          This page is ready to be connected to `/api/events` once the backend
          moves from mock services to repositories.
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
        {mockEvents.map((event) => (
          <article key={event.id} className="list-card">
            <div>
              <span className="pill">{event.category}</span>
              <h3>{event.title}</h3>
              <p>
                {event.city} · {event.startsAt}
              </p>
            </div>

            <div className="list-card-meta">
              <strong>{event.price}</strong>
              <span>{event.attendance}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
