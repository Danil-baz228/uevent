import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="empty-state">
      <span className="eyebrow">404</span>
      <h1>That page is not part of the first scaffold yet.</h1>
      <p>Use the main navigation to return to the starter routes.</p>
      <Link to="/" className="primary-button">
        Back home
      </Link>
    </section>
  );
}
