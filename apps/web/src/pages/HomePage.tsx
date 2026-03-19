import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../i18n/LanguageContext';
import {
  fetchHealth,
  formatEventDate,
  formatPrice,
  getEventPosterUrl,
} from '../lib/api';
import { useEvents } from '../hooks/useEvents';

export function HomePage() {
  const { events, status, error } = useEvents({ page: 1, limit: 6, priceType: 'all' });
  const { copy, locale, translateCategory } = useLanguage();
  const [apiStatus, setApiStatus] = useState(copy.home.apiChecking);

  useEffect(() => {
    let active = true;

    setApiStatus(copy.home.apiChecking);

    async function loadHealth() {
      try {
        const payload = await fetchHealth();

        if (!active) {
          return;
        }

        setApiStatus(copy.home.apiStatus(payload.service, payload.status));
      } catch {
        if (!active) {
          return;
        }

        setApiStatus(copy.home.apiUnavailable);
      }
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, [copy]);

  const featuredEvents = events.slice(0, 3);
  const leadEvent = featuredEvents[0] ?? null;
  const palette = ['sunrise', 'mint', 'night'];

  return (
    <>
      <section className="hero hero-home">
        <div className="hero-copy">
          <span className="hero-badge">{copy.home.heroBadge}</span>
          <h1 className="hero-title">{copy.home.heroTitle}</h1>
          <p className="hero-text">{copy.home.heroText}</p>

          <div className="hero-actions">
            <Link to="/discover" className="primary-button">
              {copy.home.primaryCta}
            </Link>
            <Link to="/create-event" className="secondary-button">
              {copy.home.secondaryCta}
            </Link>
          </div>

          <div className="hero-status-row">
            <span className="status-dot" />
            <span>{apiStatus}</span>
          </div>

          <div className="hero-metrics">
            <article className="metric-card">
              <strong>{copy.home.liveEvents(events.length)}</strong>
              <p>{copy.home.liveEventsText}</p>
            </article>
            <article className="metric-card">
              <strong>{copy.home.buildFlowTitle}</strong>
              <p>{copy.home.buildFlowText}</p>
            </article>
            <article className="metric-card">
              <strong>{copy.home.bilingualTitle}</strong>
              <p>{copy.home.bilingualText}</p>
            </article>
          </div>
        </div>

        <div className="hero-visual">
          {leadEvent ? (
            <article className="hero-feature-card">
              <img
                src={getEventPosterUrl(leadEvent)}
                alt={`${leadEvent.title} poster`}
                className="event-poster-large hero-poster"
              />
              <div className="hero-feature-body">
                <span className="pill">{translateCategory(leadEvent.category)}</span>
                <h3>{leadEvent.title}</h3>
                <p>
                  {leadEvent.city} / {formatEventDate(leadEvent.startsAt, locale)}
                </p>
                <div className="event-meta">
                  <span>{formatPrice(leadEvent.price, locale, copy.common.free)}</span>
                  <span>{leadEvent.capacity} {copy.common.spots}</span>
                </div>
                <Link to={`/events/${leadEvent.id}`} className="inline-link">
                  {copy.discover.openEventDetails}
                </Link>
              </div>
            </article>
          ) : (
            <article className="hero-feature-card hero-placeholder-card">
              <div className="placeholder-spark" />
              <h3>{copy.home.sectionTitle}</h3>
              <p>{copy.home.sectionText}</p>
            </article>
          )}

          <div className="hero-mini-grid">
            {featuredEvents.slice(1).map((event, index) => (
              <article key={event.id} className={`mini-event-card ${palette[index % palette.length]}`}>
                <span className="pill">{translateCategory(event.category)}</span>
                <strong>{event.title}</strong>
                <span className="muted">
                  {event.city} / {formatEventDate(event.startsAt, locale)}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header section-header-wide">
          <div>
            <span className="eyebrow">{copy.home.sectionEyebrow}</span>
            <h2>{copy.home.sectionTitle}</h2>
            <p>{copy.home.sectionText}</p>
          </div>
          <Link to="/discover" className="secondary-button">
            {copy.home.primaryCta}
          </Link>
        </div>

        <div className="card-grid home-feature-grid">
          {status === 'loading' ? <p className="notice">{copy.common.loadingEvents}</p> : null}
          {status === 'error' ? <p className="notice error">{error}</p> : null}
          {status === 'success' && featuredEvents.length === 0 ? (
            <p className="notice">{copy.home.noEvents}</p>
          ) : null}
          {featuredEvents.map((event, index) => (
            <article key={event.id} className={`event-card feature-card ${palette[index % palette.length]}`}>
              <img
                src={getEventPosterUrl(event)}
                alt={`${event.title} poster`}
                className="event-poster-thumb"
              />
              <span className="pill">{translateCategory(event.category)}</span>
              <h3>{event.title}</h3>
              <p>
                {event.city} / {formatEventDate(event.startsAt, locale)}
              </p>
              <div className="event-meta">
                <span>{formatPrice(event.price, locale, copy.common.free)}</span>
                <span>{event.capacity} {copy.common.spots}</span>
              </div>
              <Link to={`/events/${event.id}`} className="inline-link">
                {copy.discover.openEventDetails}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="spotlight">
        <article>
          <span className="eyebrow">{copy.home.challengeEyebrow}</span>
          <h3>{copy.home.challengeTitle}</h3>
          <p>{copy.home.challengeText}</p>
        </article>
        <article>
          <span className="eyebrow">{copy.home.stackEyebrow}</span>
          <h3>{copy.home.stackTitle}</h3>
          <p>{copy.home.stackText}</p>
        </article>
        <article>
          <span className="eyebrow">{copy.home.momentumEyebrow}</span>
          <h3>{copy.home.momentumTitle}</h3>
          <p>{copy.home.momentumText}</p>
        </article>
      </section>
    </>
  );
}
