import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { confirmCheckoutSession } from '../lib/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { token, isReady } = useAuth();
  const { copy } = useLanguage();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(copy.paymentSuccess.loading);

  useEffect(() => {
    let active = true;

    async function confirmPayment() {
      if (!sessionId) {
        if (active) {
          setStatus('error');
          setMessage(copy.paymentSuccess.noSession);
        }
        return;
      }

      if (!isReady) {
        return;
      }

      if (!token) {
        if (active) {
          setStatus('error');
          setMessage(copy.paymentSuccess.noToken);
        }
        return;
      }

      try {
        const registration = await confirmCheckoutSession(sessionId, token);

        if (!active) {
          return;
        }

        setStatus('success');
        setMessage(copy.paymentSuccess.success(registration.event.title));
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : copy.paymentSuccess.failure,
        );
      }
    }

    void confirmPayment();

    return () => {
      active = false;
    };
  }, [copy, isReady, sessionId, token]);

  return (
    <section className="empty-state">
      <span className="eyebrow">{copy.paymentSuccess.eyebrow}</span>
      <h1>{copy.paymentSuccess.title}</h1>
      <p>{message}</p>
      {sessionId ? <p className="muted">{copy.paymentSuccess.session(sessionId)}</p> : null}
      {status === 'error' ? <p className="notice error">{message}</p> : null}
      {status === 'success' ? <p className="notice success">{message}</p> : null}
      <div className="hero-actions">
        <Link to="/discover" className="primary-button">
          {copy.paymentSuccess.backToEvents}
        </Link>
        <Link to="/" className="secondary-button">
          {copy.common.openHomepage}
        </Link>
      </div>
    </section>
  );
}
