import { Link } from 'react-router-dom';

import { useLanguage } from '../i18n/LanguageContext';

export function NotFoundPage() {
  const { copy } = useLanguage();

  return (
    <section className="empty-state">
      <span className="eyebrow">{copy.notFound.eyebrow}</span>
      <h1>{copy.notFound.title}</h1>
      <p>{copy.notFound.text}</p>
      <Link to="/" className="primary-button">
        {copy.notFound.backHome}
      </Link>
    </section>
  );
}
