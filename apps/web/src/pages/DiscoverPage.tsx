import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useEvents } from '../hooks/useEvents';
import {
  ApiRegistration,
  createCheckoutSession,
  createRegistration,
  fetchMyRegistrations,
  formatEventDate,
  formatPrice,
} from '../lib/api';

export function DiscoverPage() {
  const { events, status, error } = useEvents();
  const { token, isReady } = useAuth();
  const navigate = useNavigate();
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
    navigate('/auth');
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
    </section>
  );
}
