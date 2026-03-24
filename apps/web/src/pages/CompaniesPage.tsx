import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../i18n/LanguageContext';
import { CompanyListItem, fetchCompanies, formatEventDate } from '../lib/api';

function truncate(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

export function CompaniesPage() {
  const { language, locale } = useLanguage();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  const copy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Компанії',
            title: 'Публічні компанії та їх новини',
            text: 'Знаходьте організаторів, відкривайте їхні події та слідкуйте за останніми оновленнями.',
            latestNews: 'Остання новина',
            noNews: 'Новин ще немає.',
            eventsCount: (count: number) => `${count} подій`,
            openCompany: 'Відкрити компанію',
            loading: 'Завантаження компаній...',
            openError: 'Не вдалося завантажити компанії.',
            empty: 'Поки що компаній ще немає.',
            locationFallback: 'Локацію ще не додали',
          }
        : {
            eyebrow: 'Companies',
            title: 'Public companies and their news',
            text: 'Browse organizers, open their event pages, and catch the latest updates in one place.',
            latestNews: 'Latest news',
            noNews: 'No news yet.',
            eventsCount: (count: number) => `${count} events`,
            openCompany: 'Open company',
            loading: 'Loading companies...',
            openError: 'Failed to load companies.',
            empty: 'No companies yet.',
            locationFallback: 'Location coming soon',
          },
    [language],
  );

  useEffect(() => {
    let active = true;

    async function loadCompanies() {
      setStatus('loading');
      setError('');

      try {
        const payload = await fetchCompanies();

        if (!active) {
          return;
        }

        setCompanies(payload);
        setStatus('success');
      } catch (loadError) {
        if (!active) {
          return;
        }

        setStatus('error');
        setError(loadError instanceof Error ? loadError.message : copy.openError);
      }
    }

    void loadCompanies();

    return () => {
      active = false;
    };
  }, [copy.openError]);

  return (
    <section className="section">
      <div className="section-header section-header-panel">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
      </div>

      {status === 'loading' ? <p className="notice">{copy.loading}</p> : null}
      {status === 'error' ? <p className="notice error">{error || copy.openError}</p> : null}
      {status === 'success' && companies.length === 0 ? (
        <p className="notice">{copy.empty}</p>
      ) : null}

      <div className="company-grid">
        {companies.map((company, index) => (
          <article
            key={company.id}
            className={`event-card company-card ${index % 3 === 0 ? 'sunrise' : index % 3 === 1 ? 'mint' : 'night'}`}
          >
            <div className="company-card-topline">
              <span className="pill">{company.location || copy.locationFallback}</span>
              <span className="pill">{copy.eventsCount(company.eventsCount)}</span>
            </div>

            <h3>{company.name}</h3>
            <p>{truncate(company.description || copy.locationFallback, 140)}</p>

            <div className="company-news-preview">
              <strong>{copy.latestNews}</strong>
              {company.latestNews ? (
                <>
                  <span className="muted">
                    {formatEventDate(company.latestNews.createdAt, locale)}
                  </span>
                  <p>
                    <strong>{company.latestNews.title}</strong>
                  </p>
                  <p>{truncate(company.latestNews.content, 120)}</p>
                </>
              ) : (
                <p>{copy.noNews}</p>
              )}
            </div>

            <Link to={`/companies/${company.id}`} className="inline-link company-open-link">
              {copy.openCompany}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
