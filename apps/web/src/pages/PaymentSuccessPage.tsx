import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { ApiRegistration, confirmCheckoutSession, getApiAssetUrl } from '../lib/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { token, isReady } = useAuth();
  const { copy, language } = useLanguage();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(copy.paymentSuccess.loading);
  const [registration, setRegistration] = useState<ApiRegistration | null>(null);

  const paymentMetaCopy =
    language === 'uk'
      ? {
          previewTitle: 'Лист про оплату вже підготовлено',
          previewText:
            'Відкрийте локальний preview листа або сам згенерований квиток, щоб показати сценарій оплати повністю.',
          openPreview: 'Відкрити email-preview',
          openTicket: 'Відкрити квиток',
          sentAt: (value: string) => `Надіслано: ${value}`,
        }
      : {
          previewTitle: 'Your payment email is ready',
          previewText:
            'Open the local mailbox preview or the generated ticket to demonstrate the full payment flow.',
          openPreview: 'Open email preview',
          openTicket: 'Open generated ticket',
          sentAt: (value: string) => `Sent at: ${value}`,
        };

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
        setRegistration(registration);
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
      {registration?.paymentReceiptPreviewPath || registration?.ticketAssetPath ? (
        <article className="form-card payment-artifacts-card">
          <strong>{paymentMetaCopy.previewTitle}</strong>
          <p className="muted">{paymentMetaCopy.previewText}</p>
          {registration.paymentReceiptSentAt ? (
            <p className="muted">
              {paymentMetaCopy.sentAt(
                new Intl.DateTimeFormat(language === 'uk' ? 'uk-UA' : 'en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(registration.paymentReceiptSentAt)),
              )}
            </p>
          ) : null}
          <div className="hero-actions payment-artifacts-actions">
            {registration.paymentReceiptPreviewPath ? (
              <a
                href={getApiAssetUrl(registration.paymentReceiptPreviewPath) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="primary-button"
              >
                {paymentMetaCopy.openPreview}
              </a>
            ) : null}
            {registration.ticketAssetPath ? (
              <a
                href={getApiAssetUrl(registration.ticketAssetPath) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
              >
                {paymentMetaCopy.openTicket}
              </a>
            ) : null}
          </div>
        </article>
      ) : null}
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
