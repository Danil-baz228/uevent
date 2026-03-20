import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateFormat, translateTheme } from '../i18n/translations';
import {
  ApiRegistration,
  createCheckoutSession,
  createRegistration,
  fetchMyRegistrations,
  formatEventDate,
  formatPrice,
  getEventPosterUrl,
} from '../lib/api';
import { useEvents } from '../hooks/useEvents';

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, isReady } = useAuth();
  const { copy, locale, translateCategory } = useLanguage();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const format = searchParams.get('format') ?? 'all';
  const theme = searchParams.get('theme') ?? 'all';
  const priceType = searchParams.get('priceType') ?? 'all';
  const sortBy = searchParams.get('sortBy') ?? 'date_asc';
  const page = Number(searchParams.get('page') ?? '1');
  const { events, meta, status, error } = useEvents({
    q: query,
    category,
    format,
    theme,
    priceType: priceType as 'free' | 'paid' | 'all',
    sortBy: sortBy as 'date_asc' | 'date_desc' | 'newest' | 'price_asc' | 'price_desc',
    page,
    limit: 6,
  });
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeRegistrationId, setActiveRegistrationId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const filterCopy =
    locale === 'uk-UA'
      ? {
          format: 'Формат',
          theme: 'Тема',
          sortBy: 'Сортування',
          sortDateAsc: 'За датою: найближчі спочатку',
          sortDateDesc: 'За датою: пізніші спочатку',
          sortNewest: 'Нові спочатку',
          sortPriceAsc: 'За ціною: від дешевих',
          sortPriceDesc: 'За ціною: від дорогих',
        }
      : {
          format: 'Format',
          theme: 'Theme',
          sortBy: 'Sort by',
          sortDateAsc: 'Date: soonest first',
          sortDateDesc: 'Date: latest first',
          sortNewest: 'Newest added',
          sortPriceAsc: 'Price: low to high',
          sortPriceDesc: 'Price: high to low',
        };

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

    setPaymentMessage(copy.discover.signInRequired);
    window.location.assign('/auth');
    return false;
  }

  async function handleCheckout(eventId: string) {
    if (!requireAuth() || !token) {
      return;
    }

    setActivePaymentId(eventId);
    setPaymentMessage('');

    try {
      const session = await createCheckoutSession(
        {
          eventId,
          quantity: 1,
        },
        token,
      );

      if (!session.url) {
        throw new Error(copy.eventDetails.buyFailed);
      }

      window.location.assign(session.url);
    } catch (checkoutError) {
      setPaymentMessage(
        checkoutError instanceof Error ? checkoutError.message : copy.eventDetails.buyFailed,
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
      setPaymentMessage(copy.eventDetails.joinSuccess);
    } catch (registrationError) {
      setPaymentMessage(
        registrationError instanceof Error ? registrationError.message : copy.eventDetails.joinFailed,
      );
    } finally {
      setActiveRegistrationId(null);
    }
  }

  function getRegistration(eventId: string) {
    return registrations.find((registration) => registration.eventId === eventId);
  }

  function updateQuery(next: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    if (!('page' in next)) {
      nextParams.set('page', '1');
    }

    setSearchParams(nextParams);
  }

  return (
    <section className="section">
      <div className="section-header section-header-panel">
        <span className="eyebrow">{copy.discover.eyebrow}</span>
        <h1>{copy.discover.title}</h1>
        <p>{copy.discover.text}</p>
      </div>

      <div className="discover-toolbar discover-surface">
        <label className="field search-field">
          <span>{copy.common.search}</span>
          <input
            value={query}
            placeholder={copy.discover.searchPlaceholder}
            onChange={(event) => updateQuery({ q: event.target.value })}
          />
        </label>

        <div className="filter-grid">
          <label className="field compact-field">
            <span>{copy.common.category}</span>
            <select
              value={category}
              onChange={(event) => updateQuery({ category: event.target.value })}
            >
              <option value="all">{copy.common.all}</option>
              <option value="Networking">{translateCategory('Networking')}</option>
              <option value="Workshop">{translateCategory('Workshop')}</option>
              <option value="Meetup">{translateCategory('Meetup')}</option>
            </select>
          </label>

          <label className="field compact-field">
            <span>{filterCopy.format}</span>
            <select
              value={format}
              onChange={(event) => updateQuery({ format: event.target.value })}
            >
              <option value="all">{copy.common.all}</option>
              <option value="Meetup">{translateFormat('Meetup', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Workshop">{translateFormat('Workshop', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Conference">{translateFormat('Conference', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Lecture">{translateFormat('Lecture', locale === 'uk-UA' ? 'uk' : 'en')}</option>
            </select>
          </label>

          <label className="field compact-field">
            <span>{filterCopy.theme}</span>
            <select
              value={theme}
              onChange={(event) => updateQuery({ theme: event.target.value })}
            >
              <option value="all">{copy.common.all}</option>
              <option value="Community">{translateTheme('Community', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Technology">{translateTheme('Technology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Startups">{translateTheme('Startups', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Design">{translateTheme('Design', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Business">{translateTheme('Business', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Education">{translateTheme('Education', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Art">{translateTheme('Art', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Psychology">{translateTheme('Psychology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
              <option value="Sports">{translateTheme('Sports', locale === 'uk-UA' ? 'uk' : 'en')}</option>
            </select>
          </label>

          <label className="field compact-field">
            <span>{copy.common.price}</span>
            <select
              value={priceType}
              onChange={(event) => updateQuery({ priceType: event.target.value })}
            >
              <option value="all">{copy.common.all}</option>
              <option value="free">{copy.common.free}</option>
              <option value="paid">{copy.common.paid}</option>
            </select>
          </label>

          <label className="field compact-field">
            <span>{filterCopy.sortBy}</span>
            <select
              value={sortBy}
              onChange={(event) => updateQuery({ sortBy: event.target.value })}
            >
              <option value="date_asc">{filterCopy.sortDateAsc}</option>
              <option value="date_desc">{filterCopy.sortDateDesc}</option>
              <option value="newest">{filterCopy.sortNewest}</option>
              <option value="price_asc">{filterCopy.sortPriceAsc}</option>
              <option value="price_desc">{filterCopy.sortPriceDesc}</option>
            </select>
          </label>
        </div>
      </div>

      {paymentMessage ? <p className="notice error">{paymentMessage}</p> : null}
      {meta ? (
        <p className="muted results-summary">
          {copy.discover.resultsSummary(events.length, meta.total)}
        </p>
      ) : null}

      <div className="list-grid">
        {status === 'loading' ? <p className="notice">{copy.common.loadingEvents}</p> : null}
        {status === 'error' ? <p className="notice error">{error}</p> : null}
        {status === 'success' && events.length === 0 ? (
          <p className="notice">{copy.discover.noEvents}</p>
        ) : null}
        {events.map((event) => (
          <article key={event.id} className="list-card">
            <div className="list-card-main">
              <img
                src={getEventPosterUrl(event)}
                alt={`${event.title} poster`}
                className="event-poster-thumb"
              />
              <div className="list-card-copy">
                <div className="list-card-topline">
                  <span className="pill">{translateCategory(event.category)}</span>
                  <span className="pill">{translateFormat(event.format, locale === 'uk-UA' ? 'uk' : 'en')}</span>
                  <span className="pill">{translateTheme(event.theme, locale === 'uk-UA' ? 'uk' : 'en')}</span>
                </div>
                <h3>
                  <Link to={`/events/${event.id}`} className="event-link">
                    {event.title}
                  </Link>
                </h3>
                <p>
                  {event.city} / {formatEventDate(event.startsAt, locale)}
                </p>
                <p className="muted">
                  {copy.common.organizer}:{' '}
                  {event.organizer?.displayName ?? copy.discover.organizerFallback}
                </p>
                <Link to={`/events/${event.id}`} className="inline-link">
                  {copy.discover.openEventDetails}
                </Link>
              </div>
            </div>

            <div className="list-card-meta">
              <div className="list-card-pricing">
                <strong>{formatPrice(event.price, locale, copy.common.free)}</strong>
                <span>{event.capacity} {copy.common.spots}</span>
              </div>
              {getRegistration(event.id)?.status === 'confirmed' ? (
                <span className="pill status-pill">{copy.common.registered}</span>
              ) : getRegistration(event.id)?.status === 'pending_payment' ? (
                <span className="pill status-pill">{copy.common.paymentPending}</span>
              ) : event.price > 0 ? (
                <button
                  type="button"
                  className="primary-button pay-button"
                  onClick={() => void handleCheckout(event.id)}
                  disabled={activePaymentId === event.id}
                >
                  {activePaymentId === event.id
                    ? copy.common.openingStripe
                    : copy.common.buyTicket}
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button pay-button"
                  onClick={() => void handleFreeRegistration(event.id)}
                  disabled={!isReady || activeRegistrationId === event.id}
                >
                  {activeRegistrationId === event.id
                    ? copy.common.joining
                    : copy.common.joinEvent}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            disabled={meta.page <= 1}
            onClick={() => updateQuery({ page: String(meta.page - 1) })}
          >
            {copy.common.previous}
          </button>
          <span className="pill">{copy.common.pageOf(meta.page, meta.totalPages)}</span>
          <button
            type="button"
            className="secondary-button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => updateQuery({ page: String(meta.page + 1) })}
          >
            {copy.common.next}
          </button>
        </div>
      ) : null}
    </section>
  );
}
