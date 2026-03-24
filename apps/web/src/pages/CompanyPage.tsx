import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { MapPickerModal } from '../components/MapPickerModal';
import { useLanguage } from '../i18n/LanguageContext';
import {
  CompanyDetailsResponse,
  createCompanyNews,
  fetchCompanyById,
  formatEventDate,
  formatPrice,
  getEventPosterUrl,
  getMapEmbedUrl,
  updateCompany,
} from '../lib/api';

export function CompanyPage() {
  const { companyId = '' } = useParams();
  const { token, user, reloadUser } = useAuth();
  const { locale, language } = useLanguage();
  const [company, setCompany] = useState<CompanyDetailsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    location: '',
    description: '',
  });
  const [newsForm, setNewsForm] = useState({ title: '', content: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving'>('idle');
  const [newsStatus, setNewsStatus] = useState<'idle' | 'saving'>('idle');
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const copy = useMemo(
    () =>
      language === 'uk'
        ? {
            loading: 'Завантаження компанії...',
            openError: 'Не вдалося відкрити компанію.',
            profile: 'Профіль компанії',
            basedIn: 'Локація',
            email: 'Email',
            owner: 'Власник',
            events: 'Події компанії',
            news: 'Новини компанії',
            noEvents: 'Поки що компанія не має подій.',
            noNews: 'Поки що компанія не публікувала новин.',
            manage: 'Керування компанією',
            save: 'Зберегти компанію',
            saving: 'Зберігаємо...',
            saved: 'Компанію оновлено.',
            newsTitle: 'Заголовок новини',
            newsContent: 'Текст новини',
            publishNews: 'Опублікувати новину',
            publishedNews: 'Новину опубліковано.',
            back: 'Назад до профілю',
          }
        : {
            loading: 'Loading company...',
            openError: 'Failed to open company.',
            profile: 'Company profile',
            basedIn: 'Location',
            email: 'Email',
            owner: 'Owner',
            events: 'Company events',
            news: 'Company news',
            noEvents: 'This company has no events yet.',
            noNews: 'This company has not published news yet.',
            manage: 'Manage company',
            save: 'Save company',
            saving: 'Saving...',
            saved: 'Company updated.',
            newsTitle: 'News title',
            newsContent: 'News content',
            publishNews: 'Publish news',
            publishedNews: 'News published.',
            back: 'Back to account',
          },
    [language],
  );
  const mapCopy = useMemo(
    () =>
      language === 'uk'
        ? {
            title: 'Розташування на мапі',
            locationHint: 'Додайте повнішу адресу, щоб карта була точнішою.',
          }
        : {
            title: 'Location on map',
            locationHint: 'Use a fuller address if you want a more precise map.',
          },
    [language],
  );
  const pickOnMapLabel = language === 'uk' ? 'Указати на мапі' : 'Pick on map';
  const mapModalHint =
    language === 'uk'
      ? 'Клікніть по мапі, щоб визначити адресу компанії і підставити її в форму.'
      : 'Click the map to resolve the company address and fill the form automatically.';
  const mapConfirmLabel = language === 'uk' ? 'Використати адресу' : 'Use address';

  useEffect(() => {
    let active = true;

    async function loadCompany() {
      setStatus('loading');
      setMessage('');

      try {
        const payload = await fetchCompanyById(companyId, token);

        if (!active) {
          return;
        }

        setCompany(payload);
        setCompanyForm({
          name: payload.name,
          email: payload.email,
          location: payload.location,
          description: payload.description ?? '',
        });
        setStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : copy.openError);
      }
    }

    void loadCompany();

    return () => {
      active = false;
    };
  }, [companyId, token, copy.openError]);

  async function handleCompanySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !company) {
      return;
    }

    setSaveStatus('saving');
    setMessage('');

    try {
      const updatedCompany = await updateCompany(company.id, companyForm, token);
      await reloadUser();
      setCompany((current) =>
        current
          ? {
              ...current,
              ...updatedCompany,
            }
          : current,
      );
      setMessage(copy.saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.openError);
    } finally {
      setSaveStatus('idle');
    }
  }

  async function handlePublishNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !company) {
      return;
    }

    setNewsStatus('saving');
    setMessage('');

    try {
      const newsItem = await createCompanyNews(company.id, newsForm, token);
      setCompany((current) =>
        current
          ? {
              ...current,
              news: [newsItem, ...current.news],
            }
          : current,
      );
      setNewsForm({ title: '', content: '' });
      setMessage(copy.publishedNews);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.openError);
    } finally {
      setNewsStatus('idle');
    }
  }

  if (status === 'loading') {
    return <p className="notice">{copy.loading}</p>;
  }

  if (status === 'error' || !company) {
    return <p className="notice error">{message || copy.openError}</p>;
  }

  return (
    <section className="section">
      <div className="section-header section-header-panel">
        <span className="eyebrow">{copy.profile}</span>
        <h1>{company.name}</h1>
        <p>{company.description || company.location}</p>
      </div>

      <div className="account-overview">
        <article className="account-profile-card">
          <div className="account-profile-grid">
            <div className="account-profile-item">
              <span>{copy.basedIn}</span>
              <strong>{company.location}</strong>
            </div>
            <div className="account-profile-item">
              <span>{copy.email}</span>
              <strong>{company.email}</strong>
            </div>
            <div className="account-profile-item">
              <span>{copy.owner}</span>
              <strong>{company.owner?.displayName ?? '-'}</strong>
            </div>
          </div>
        </article>

        <article className="account-profile-card map-card">
          <span className="eyebrow">{mapCopy.title}</span>
          <iframe
            title="Company map"
            src={getMapEmbedUrl(company.location)}
            className="map-frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </article>

        {company.canManage ? (
          <article className="account-profile-card">
            <span className="eyebrow">{copy.manage}</span>
            <form className="account-settings-form" onSubmit={handleCompanySave}>
              <div className="form-grid">
                <label className="field">
                  <span>{language === 'uk' ? 'Назва' : 'Name'}</span>
                  <input
                    value={companyForm.name}
                    onChange={(event) =>
                      setCompanyForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>{copy.email}</span>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(event) =>
                      setCompanyForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>{copy.basedIn}</span>
                  <input
                    value={companyForm.location}
                    onChange={(event) =>
                      setCompanyForm((current) => ({ ...current, location: event.target.value }))
                    }
                  />
                  <small className="field-hint">{mapCopy.locationHint}</small>
                  <button
                    type="button"
                    className="secondary-button inline-map-button"
                    onClick={() => setMapPickerOpen(true)}
                  >
                    {pickOnMapLabel}
                  </button>
                </label>
              </div>
              {companyForm.location.trim() ? (
                <div className="map-card map-preview-card">
                  <div className="map-card-header">
                    <strong>{mapCopy.title}</strong>
                  </div>
                  <iframe
                    title="Company map preview"
                    src={getMapEmbedUrl(companyForm.location)}
                    className="map-frame"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
              <label className="field">
                <span>{language === 'uk' ? 'Опис' : 'Description'}</span>
                <textarea
                  rows={4}
                  value={companyForm.description}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" className="primary-button" disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? copy.saving : copy.save}
              </button>
            </form>
          </article>
        ) : null}
      </div>

      {company.canManage ? (
        <article className="form-card">
          <span className="eyebrow">{copy.news}</span>
          <form className="account-settings-form" onSubmit={handlePublishNews}>
            <label className="field">
              <span>{copy.newsTitle}</span>
              <input
                value={newsForm.title}
                onChange={(event) =>
                  setNewsForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span>{copy.newsContent}</span>
              <textarea
                rows={4}
                value={newsForm.content}
                onChange={(event) =>
                  setNewsForm((current) => ({ ...current, content: event.target.value }))
                }
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={newsStatus === 'saving'}>
              {newsStatus === 'saving' ? copy.saving : copy.publishNews}
            </button>
          </form>
        </article>
      ) : null}

      {message ? <p className="notice success">{message}</p> : null}

      <div className="section-header section-header-panel account-tickets-header">
        <span className="eyebrow">{copy.events}</span>
        <h2>{company.name}</h2>
      </div>

      {company.events.length === 0 ? (
        <p className="notice">{copy.noEvents}</p>
      ) : (
        <div className="ticket-grid">
          {company.events.map((event) => (
            <article key={event.id} className="ticket-card">
              <img
                src={getEventPosterUrl({
                  posterUrl: event.posterUrl,
                  title: event.title,
                  category: event.category,
                })}
                alt={`${event.title} poster`}
                className="ticket-poster"
              />
              <div className="ticket-copy">
                <h3>{event.title}</h3>
                <p>
                  {event.city} / {formatEventDate(event.startsAt, locale)}
                </p>
                <div className="ticket-meta-row">
                  <span className="ticket-price">
                    {formatPrice(event.price, locale, language === 'uk' ? 'Безкоштовно' : 'Free')}
                  </span>
                </div>
                <Link to={`/events/${event.id}`} className="inline-link ticket-open-link">
                  {language === 'uk' ? 'Відкрити подію' : 'Open event'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="section-header section-header-panel account-tickets-header">
        <span className="eyebrow">{copy.news}</span>
        <h2>{company.name}</h2>
      </div>

      {company.news.length === 0 ? (
        <p className="notice">{copy.noNews}</p>
      ) : (
        <div className="related-list">
          {company.news.map((item) => (
            <article key={item.id} className="related-card">
              <strong>{item.title}</strong>
              <span className="muted">{formatEventDate(item.createdAt, locale)}</span>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      )}

      {user ? (
        <Link to="/account" className="secondary-button">
          {copy.back}
        </Link>
      ) : null}

      <MapPickerModal
        open={mapPickerOpen}
        title={language === 'uk' ? 'Виберіть розташування компанії' : 'Choose company location'}
        confirmLabel={mapConfirmLabel}
        cancelLabel={language === 'uk' ? 'Скасувати' : 'Cancel'}
        hint={mapModalHint}
        initialQuery={companyForm.location || company.location}
        language={language}
        onClose={() => setMapPickerOpen(false)}
        onSelect={(value) => {
          setCompanyForm((current) => ({ ...current, location: value.address }));
          setMapPickerOpen(false);
        }}
      />
    </section>
  );
}
