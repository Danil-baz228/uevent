import { Link } from 'react-router-dom';

import { useLanguage } from '../i18n/LanguageContext';

export function PaymentCancelPage() {
  const { copy } = useLanguage();

  return (
    <section className="empty-state">
      <span className="eyebrow">{copy.paymentCancel.eyebrow}</span>
      <h1>{copy.paymentCancel.title}</h1>
      <p>{copy.paymentCancel.text}</p>
      <div className="hero-actions">
        <Link to="/discover" className="primary-button">
          {copy.paymentCancel.tryAgain}
        </Link>
        <Link to="/" className="secondary-button">
          {copy.common.openHomepage}
        </Link>
      </div>
    </section>
  );
}
