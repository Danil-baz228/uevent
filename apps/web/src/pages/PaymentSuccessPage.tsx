import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { confirmCheckoutSession } from '../lib/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { token, isReady } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your event registration...');

  useEffect(() => {
    let active = true;

    async function confirmPayment() {
      if (!sessionId) {
        if (active) {
          setStatus('error');
          setMessage('Stripe returned without a session id.');
        }
        return;
      }

      if (!isReady) {
        return;
      }

      if (!token) {
        if (active) {
          setStatus('error');
          setMessage('Please sign in again to confirm your ticket registration.');
        }
        return;
      }

      try {
        const registration = await confirmCheckoutSession(sessionId, token);

        if (!active) {
          return;
        }

        setStatus('success');
        setMessage(`Registration confirmed for ${registration.event.title}.`);
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to confirm your payment session',
        );
      }
    }

    void confirmPayment();

    return () => {
      active = false;
    };
  }, [isReady, sessionId, token]);

  return (
    <section className="empty-state">
      <span className="eyebrow">Payment success</span>
      <h1>Stripe checkout completed.</h1>
      <p>{message}</p>
      {sessionId ? <p className="muted">Session: {sessionId}</p> : null}
      {status === 'error' ? <p className="notice error">{message}</p> : null}
      {status === 'success' ? <p className="notice success">{message}</p> : null}
      <div className="hero-actions">
        <Link to="/discover" className="primary-button">
          Back to events
        </Link>
        <Link to="/" className="secondary-button">
          Open homepage
        </Link>
      </div>
    </section>
  );
}
