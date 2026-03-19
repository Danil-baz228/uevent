import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useEvents } from '../hooks/useEvents';
import {
  ApiRegistration,
  createCheckoutSession,
  createRegistration,
  fetchMyRegistrations,
  formatEventDate,
  formatPrice,
  getEventPosterUrl,
} from '../lib/api';

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, isReady } = useAuth();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const priceType = searchParams.get('priceType') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');
  const { events, meta, status, error } = useEvents({
    q: query,
    category,
    priceType: priceType as 'free' | 'paid' | 'all',
    page,
    limit: 6,
  });
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeRegistrationId, setActiveRegistrationId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);

  useEffect(() => {
    let active = true;

    async function loadRegistrations() {
      if (!token) {
        setRegistrations([]);
        return;
      }

      try {
        const payload = await fetchMyRegistrations(token);

        if (!active) {
          return;
        }

        setRegistrations(payload);
      } catch {
        if (active) {
          setRegistrations([]);
        }
      }
    }

    void loadRegistrations();

    return () => {
      active = false;
    };
  }, [token]);

  function requireAuth() {
    if (token) {
      return true;
    }

    setPaymentMessage('Please sign in before joining or buying a ticket.');
    window.location.assign('/auth');
    return false;
  }

  async function handleCheckout(eventId: string) {
    if (!requireAuth() || !token) {
      return;
    }

    setActivePaymentId(eventId);
    setPaymentMessage('');

    try {
      const session = await createCheckoutSession({
        eventId,
        quantity: 1,
      }, token);

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

  async function handleFreeRegistration(eventId: string) {
    if (!requireAuth() || !token) {
      return;
    }

    setActiveRegistrationId(eventId);
    setPaymentMessage('');

    try {
      const registration = await createRegistration(eventId, token);

      setRegistrations((current) => {
        const rest = current.filter((item) => item.eventId !== registration.eventId);
        return [registration, ...rest];
      });
      setPaymentMessage('You are registered for this free event.');
    } catch (registrationError) {
      setPaymentMessage(
        registrationError instanceof Error
          ? registrationError.message
          : 'Failed to register for the event',
      );
    } finally {
      setActiveRegistrationId(null);
    }
  }

  function getRegistration(eventId: string) {
    return registrations.find((registration) => registration.eventId === eventId);
  }

  function updateQuery(next: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    if (!('page' in next)) {
      nextParams.set('page', '1');
    }

    setSearchParams(nextParams);
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

      <div className="discover-toolbar">
        <label className="field search-field">
          <span>Search</span>
          <input
            value={query}
            placeholder="Title, city, or description"
            onChange={(event) => updateQuery({ q: event.target.value })}
          />
        </label>

        <div className="filter-grid">
          <label className="field compact-field">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => updateQuery({ category: event.target.value })}
            >
              <option value="all">All</option>
              <option value="Networking">Networking</option>
              <option value="Workshop">Workshop</option>
              <option value="Meetup">Meetup</option>
            </select>
          </label>

          <label className="field compact-field">
            <span>Price</span>
            <select
              value={priceType}
              onChange={(event) => updateQuery({ priceType: event.target.value })}
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
      </div>

      {paymentMessage ? <p className="notice error">{paymentMessage}</p> : null}
      {meta ? (
        <p className="muted results-summary">
          Showing {events.length} of {meta.total} events
        </p>
      ) : null}

      <div className="list-grid">
        {status === 'loading' ? <p className="notice">Loading events...</p> : null}
        {status === 'error' ? <p className="notice error">{error}</p> : null}
        {status === 'success' && events.length === 0 ? (
          <p className="notice">No events in the database yet.</p>
        ) : null}
        {events.map((event) => (
          <article key={event.id} className="list-card">
            <div className="list-card-main">
              <img
                src={getEventPosterUrl(event)}
                alt={`${event.title} poster`}
                className="event-poster-thumb"
              />
              <div>
                <span className="pill">{event.category}</span>
                <h3>
                  <Link to={`/events/${event.id}`} className="event-link">
                    {event.title}
                  </Link>
                </h3>
                <p>
                  {event.city} / {formatEventDate(event.startsAt)}
                </p>
                <p className="muted">
                  Organizer: {event.organizer?.displayName ?? 'Community Host'}
                </p>
                <Link to={`/events/${event.id}`} className="muted event-detail-link">
                  Open event details
                </Link>
              </div>
            </div>

            <div className="list-card-meta">
              <strong>{formatPrice(event.price)}</strong>
              <span>{event.capacity} spots</span>
              {getRegistration(event.id)?.status === 'confirmed' ? (
                <span className="pill status-pill">Registered</span>
              ) : getRegistration(event.id)?.status === 'pending_payment' ? (
                <span className="pill status-pill">Payment pending</span>
              ) : event.price > 0 ? (
                <button
                  type="button"
                  className="primary-button pay-button"
                  onClick={() => void handleCheckout(event.id)}
                  disabled={activePaymentId === event.id}
                >
                  {activePaymentId === event.id ? 'Opening Stripe...' : 'Buy ticket'}
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button pay-button"
                  onClick={() => void handleFreeRegistration(event.id)}
                  disabled={!isReady || activeRegistrationId === event.id}
                >
                  {activeRegistrationId === event.id ? 'Joining...' : 'Join event'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            disabled={meta.page <= 1}
            onClick={() => updateQuery({ page: String(meta.page - 1) })}
          >
            Previous
          </button>
          <span className="pill">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => updateQuery({ page: String(meta.page + 1) })}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
