import { Link } from 'react-router-dom';

export function PaymentCancelPage() {
  return (
    <section className="empty-state">
      <span className="eyebrow">Payment canceled</span>
      <h1>Checkout was canceled before payment.</h1>
      <p>
        You can go back to the catalogue and start the Stripe checkout flow
        again for any paid event.
      </p>
      <div className="hero-actions">
        <Link to="/discover" className="primary-button">
          Try again
        </Link>
        <Link to="/" className="secondary-button">
          Open homepage
        </Link>
      </div>
    </section>
  );
}
