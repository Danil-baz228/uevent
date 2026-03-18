import { useState } from 'react';

import { createCheckoutSession, formatEventDate, formatPrice } from '../lib/api';
import { useEvents } from '../hooks/useEvents';

export function DiscoverPage() {
  const { events, status, error } = useEvents();
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  async function handleCheckout(eventId: string) {
    setActivePaymentId(eventId);
    setPaymentMessage('');

    try {
      const session = await createCheckoutSession({
        eventId,
        quantity: 1,
      });

      if (!session.url) {
        throw new Error('Stripe session URL was not returned by the API');
      }

      window.location.assign(session.url);
    } catch (checkoutError) {
      setPaymentMessage(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Failed to start Stripe checkout',
      );
      setActivePaymentId(null);
    }
  }

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

      {paymentMessage ? <p className="notice error">{paymentMessage}</p> : null}

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
              {event.price > 0 ? (
                <button
                  type="button"
                  className="primary-button pay-button"
                  onClick={() => void handleCheckout(event.id)}
                  disabled={activePaymentId === event.id}
                >
                  {activePaymentId === event.id ? 'Opening Stripe...' : 'Buy ticket'}
                </button>
              ) : (
                <span className="muted">Free entry</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
