import { Link, useSearchParams } from 'react-router-dom';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <section className="empty-state">
      <span className="eyebrow">Payment success</span>
      <h1>Stripe checkout completed.</h1>
      <p>
        Payment returned successfully from Stripe.
        {sessionId ? ` Session: ${sessionId}` : ''}
      </p>
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
