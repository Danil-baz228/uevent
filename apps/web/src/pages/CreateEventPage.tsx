import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { MapPickerModal } from '../components/MapPickerModal';
import { useLanguage } from '../i18n/LanguageContext';
import { translateFormat, translateTheme } from '../i18n/translations';
import {
  ApiEvent,
  createCompany,
  createEvent,
  fetchMyScheduledEvents,
  formatEventDate,
  getMapEmbedUrl,
} from '../lib/api';

const initialEventForm = {
  title: '',
  description: '',
  category: '',
  format: 'Meetup',
  theme: 'Community',
  attendeeVisibility: 'everyone' as 'everyone' | 'registered_only' | 'nobody',
  notifyOnNewAttendee: true,
  commentAccess: 'everyone' as 'everyone' | 'registered_only' | 'closed',
  city: '',
  address: '',
  startsAt: '',
  publishAt: '',
  redirectAfterPurchaseUrl: '',
  price: '0',
  capacity: '50',
  companyId: '',
};

const initialCompanyForm = { name: '', email: '', location: '', description: '' };
const initialPromoForm = { code: '', discountPercent: '10' };

export function CreateEventPage() {
  const { user, token, isReady, reloadUser } = useAuth();
  const { copy, locale, translateCategory } = useLanguage();
  const language = locale === 'uk-UA' ? 'uk' : 'en';
  const ui = language === 'uk'
    ? {
        companyCreated: 'Компанію створено.',
        createCompanyFirst: 'Спочатку створіть компанію.',
        eventSaved: 'Подію успішно збережено.',
        enterPromo: 'Введіть промокод.',
        discountRange: 'Знижка має бути від 1 до 99%.',
        promoExists: 'Такий промокод уже існує.',
        scheduledTitle: 'Заплановані публікації',
        scheduledHint: 'Події, які чекають на дату публікації, зʼявляться тут.',
        noScheduled: 'Поки що немає запланованих публікацій.',
        publishes: 'Викладення',
        event: 'Подія',
        company: 'Компанія',
        companyName: 'Назва компанії',
        location: 'Локація',
        pickOnMap: 'Указати на мапі',
        description: 'Опис',
        createCompany: 'Створити компанію',
        format: 'Формат',
        theme: 'Тема',
        eventAddress: 'Адреса події',
        mapPreview: 'Попередній перегляд мапи',
        eventLocationPreview: 'Попередній перегляд локації події',
        eventDateTime: 'Дата і час проведення',
        oneUserManyCompanies: 'Один користувач може мати кілька компаній.',
        goToCompany: 'Перейти до компанії',
        eventSettings: 'Налаштування події',
        eventSettingsHint: 'Видимість, коментарі та дата публікації.',
        whoCanSeeAttendees: 'Хто бачить учасників',
        notifyOnNewAttendee: 'Сповіщати про нових відвідувачів',
        comments: 'Коментарі',
        publishDate: 'Дата викладення',
        redirectAfterPurchase: 'Редірект після покупки',
        promoCodes: 'Промокоди',
        promoHint: 'Додайте коди зі знижкою для квитка. Покупець введе їх у вікні оплати.',
        promoCode: 'Промокод',
        discountPercent: 'Знижка, %',
        addPromoCode: 'Додати промокод',
        noPromoCodes: 'Поки що немає промокодів',
        noPromoCodesHint: 'Додайте хоча б один код, якщо хочете дати знижку на квиток.',
        discountLabel: (value: number) => `Знижка ${value}%`,
        done: 'Готово',
        close: 'Закрити',
        mapHint: 'Клікніть по мапі, щоб визначити адресу і підставити її у форму.',
        chooseCompanyLocation: 'Виберіть розташування компанії',
        chooseEventLocation: 'Виберіть місце проведення події',
        useAddress: 'Використати адресу',
      }
    : {
        companyCreated: 'Company created.',
        createCompanyFirst: 'Create a company first.',
        eventSaved: 'Event saved successfully.',
        enterPromo: 'Enter a promo code.',
        discountRange: 'Discount must be between 1 and 99.',
        promoExists: 'This promo code already exists.',
        scheduledTitle: 'Scheduled publications',
        scheduledHint: 'Events waiting for their publication date appear here.',
        noScheduled: 'No scheduled publications yet.',
        publishes: 'Publishes',
        event: 'Event',
        company: 'Company',
        companyName: 'Company name',
        location: 'Location',
        pickOnMap: 'Pick on map',
        description: 'Description',
        createCompany: 'Create company',
        format: 'Format',
        theme: 'Theme',
        eventAddress: 'Event address',
        mapPreview: 'Map preview',
        eventLocationPreview: 'Event location preview',
        eventDateTime: 'Event date and time',
        oneUserManyCompanies: 'One user can own multiple companies.',
        goToCompany: 'Go to company',
        eventSettings: 'Event settings',
        eventSettingsHint: 'Visibility, comments, and publication date.',
        whoCanSeeAttendees: 'Who can see attendees',
        notifyOnNewAttendee: 'Notify about new attendees',
        comments: 'Comments',
        publishDate: 'Publish date',
        redirectAfterPurchase: 'Redirect after purchase',
        promoCodes: 'Promo codes',
        promoHint: 'Add discount codes for this ticket. Buyers will enter them in the payment window.',
        promoCode: 'Promo code',
        discountPercent: 'Discount, %',
        addPromoCode: 'Add promo code',
        noPromoCodes: 'No promo codes yet',
        noPromoCodesHint: 'Add at least one code if you want to offer a ticket discount.',
        discountLabel: (value: number) => `${value}% discount`,
        done: 'Done',
        close: 'Close',
        mapHint: 'Click the map to resolve an address and put it into the form.',
        chooseCompanyLocation: 'Choose company location',
        chooseEventLocation: 'Choose event location',
        useAddress: 'Use address',
      };
  const [mode, setMode] = useState<'event' | 'company'>('event');
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [scheduledEvents, setScheduledEvents] = useState<ApiEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [companyStatus, setCompanyStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [companyMessage, setCompanyMessage] = useState('');
  const [mapPickerTarget, setMapPickerTarget] = useState<'event' | 'company' | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoCodes, setPromoCodes] = useState<Array<{ code: string; discountPercent: number }>>([]);
  const [promoForm, setPromoForm] = useState(initialPromoForm);
  const [promoMessage, setPromoMessage] = useState('');

  const companies = user?.companies ?? [];

  useEffect(() => {
    if (!companies.length) {
      setEventForm((current) => ({ ...current, companyId: '' }));
      return;
    }

    setEventForm((current) => ({
      ...current,
      companyId:
        current.companyId && companies.some((company) => company.id === current.companyId)
          ? current.companyId
          : companies[0]!.id,
    }));
  }, [companies]);

  useEffect(() => {
    return () => {
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview);
      }
    };
  }, [posterPreview]);

  useEffect(() => {
    let active = true;

    async function loadScheduledEvents() {
      if (!token) {
        setScheduledEvents([]);
        return;
      }

      try {
        const payload = await fetchMyScheduledEvents(token);
        if (active) setScheduledEvents(payload);
      } catch {
        if (active) setScheduledEvents([]);
      }
    }

    void loadScheduledEvents();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompanyStatus('saving');
    setCompanyMessage('');

    try {
      if (!token) throw new Error(copy.create.signInNotice);
      const createdCompany = await createCompany(companyForm, token);
      await reloadUser();
      setCompanyForm(initialCompanyForm);
      setMode('event');
      setCompanyStatus('success');
      setCompanyMessage(ui.companyCreated);
      setEventForm((current) => ({ ...current, companyId: createdCompany.id }));
    } catch (error) {
      setCompanyStatus('error');
      setCompanyMessage(error instanceof Error ? error.message : copy.create.failedMessage);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      if (!token) throw new Error(copy.create.signInNotice);
      if (!eventForm.companyId) {
        throw new Error(
          ui.createCompanyFirst,
        );
      }

      const payload = new FormData();
      payload.append('title', eventForm.title);
      payload.append('description', eventForm.description);
      payload.append('category', eventForm.category);
      payload.append('format', eventForm.format);
      payload.append('theme', eventForm.theme);
      payload.append('attendeeVisibility', eventForm.attendeeVisibility);
      payload.append('notifyOnNewAttendee', String(eventForm.notifyOnNewAttendee));
      payload.append('commentAccess', eventForm.commentAccess);
      payload.append('city', eventForm.city);
      payload.append('address', eventForm.address);
      payload.append('companyId', eventForm.companyId);
      payload.append('startsAt', new Date(eventForm.startsAt).toISOString());
      payload.append('publishAt', eventForm.publishAt ? new Date(eventForm.publishAt).toISOString() : '');
      payload.append('redirectAfterPurchaseUrl', eventForm.redirectAfterPurchaseUrl.trim());
      payload.append('price', String(Number(eventForm.price)));
      payload.append('promoCodes', JSON.stringify(promoCodes));
      payload.append('capacity', String(Number(eventForm.capacity)));
      if (posterFile) payload.append('poster', posterFile);

      await createEvent(payload, token);
      const refreshedScheduled = await fetchMyScheduledEvents(token);
      setStatus('success');
      setMessage(ui.eventSaved);
      setEventForm((current) => ({ ...initialEventForm, companyId: current.companyId }));
      setPromoCodes([]);
      setPromoForm(initialPromoForm);
      setPromoMessage('');
      setPosterFile(null);
      setPosterPreview('');
      setScheduledEvents(refreshedScheduled);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : copy.create.failedMessage);
    }
  }

  function handleAddPromoCode() {
    const code = promoForm.code.trim().toUpperCase();
    const discountPercent = Number(promoForm.discountPercent);
    if (!code) {
      return setPromoMessage(ui.enterPromo);
    }
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 99) {
      return setPromoMessage(ui.discountRange);
    }
    if (promoCodes.some((item) => item.code === code)) {
      return setPromoMessage(ui.promoExists);
    }
    setPromoCodes((current) => [...current, { code, discountPercent }]);
    setPromoForm(initialPromoForm);
    setPromoMessage('');
  }

  function handleRemovePromoCode(code: string) {
    setPromoCodes((current) => current.filter((item) => item.code !== code));
    setPromoMessage('');
  }

  return (
    <section className="form-shell">
      <div className="form-sidebar">
        <span className="eyebrow">{copy.create.eyebrow}</span>
        <h1>{copy.create.title}</h1>
        <p>{copy.create.text}</p>
        <ul className="feature-list">
          {copy.create.features.map((feature) => <li key={feature}>{feature}</li>)}
        </ul>
        <p className="muted">{copy.create.demoAccount}</p>
        {user ? <p className="muted">{copy.create.signedInAs(user.displayName, user.email)}</p> : null}
        {user ? (
          <div className="scheduled-publications-panel">
            <div className="scheduled-panel-header">
              <strong>{ui.scheduledTitle}</strong>
              <p className="muted">{ui.scheduledHint}</p>
            </div>
            {scheduledEvents.length === 0 ? <p className="muted">{ui.noScheduled}</p> : (
              <div className="scheduled-publications-list">
                {scheduledEvents.map((item) => (
                  <Link key={item.id} to={`/events/${item.id}`} className="scheduled-publication-card">
                    <strong>{item.title}</strong>
                    <span className="muted">{ui.publishes}: {formatEventDate(item.publishAt ?? item.createdAt, locale)}</span>
                    <span className="muted">{item.city} / {formatEventDate(item.startsAt, locale)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!isReady ? <p className="notice">{copy.common.loadingSession}</p> : null}
      {isReady && !user ? (
        <div className="form-card">
          <p className="notice">{copy.create.signInNotice}</p>
          <Link to="/auth" className="primary-button">{copy.create.signInCta}</Link>
        </div>
      ) : null}

      {isReady && user ? (
        <div className="form-card">
          <div className="pill-row">
            <button type="button" className={mode === 'event' ? 'primary-button' : 'secondary-button'} onClick={() => setMode('event')}>{ui.event}</button>
            <button type="button" className={mode === 'company' ? 'primary-button' : 'secondary-button'} onClick={() => setMode('company')}>{ui.company}</button>
          </div>

          {mode === 'company' ? (
            <form className="form-card" onSubmit={handleCreateCompany}>
              <label className="field"><span>{ui.companyName}</span><input value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} required /></label>
              <div className="form-grid">
                <label className="field"><span>Email</span><input type="email" value={companyForm.email} onChange={(event) => setCompanyForm((current) => ({ ...current, email: event.target.value }))} required /></label>
                <label className="field"><span>{ui.location}</span><input value={companyForm.location} onChange={(event) => setCompanyForm((current) => ({ ...current, location: event.target.value }))} required /><button type="button" className="secondary-button inline-map-button" onClick={() => setMapPickerTarget('company')}>{ui.pickOnMap}</button></label>
              </div>
              <label className="field"><span>{ui.description}</span><textarea rows={5} value={companyForm.description} onChange={(event) => setCompanyForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="form-actions"><button type="submit" className="primary-button" disabled={companyStatus === 'saving'}>{companyStatus === 'saving' ? copy.common.saving : ui.createCompany}</button></div>
              {companyMessage ? <p className={`notice ${companyStatus === 'error' ? 'error' : 'success'}`}>{companyMessage}</p> : null}
            </form>
          ) : companies.length > 0 ? (
            <form className="form-card" onSubmit={handleCreateEvent}>
              <label className="field"><span>{copy.create.titleLabel}</span><input placeholder={copy.create.titlePlaceholder} value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} required /></label>
              <label className="field"><span>{copy.create.descriptionLabel}</span><textarea placeholder={copy.create.descriptionPlaceholder} rows={5} value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} required /></label>
              <div className="form-grid">
                <label className="field"><span>{copy.common.category}</span><input value={eventForm.category} placeholder={translateCategory('Networking')} onChange={(event) => setEventForm((current) => ({ ...current, category: event.target.value }))} required /></label>
                <label className="field"><span>{ui.format}</span><select value={eventForm.format} onChange={(event) => setEventForm((current) => ({ ...current, format: event.target.value }))}><option value="Meetup">{translateFormat('Meetup', language)}</option><option value="Workshop">{translateFormat('Workshop', language)}</option><option value="Conference">{translateFormat('Conference', language)}</option><option value="Festival">{translateFormat('Festival', language)}</option></select></label>
                <label className="field"><span>{ui.theme}</span><select value={eventForm.theme} onChange={(event) => setEventForm((current) => ({ ...current, theme: event.target.value }))}><option value="Community">{translateTheme('Community', language)}</option><option value="Technology">{translateTheme('Technology', language)}</option><option value="Startups">{translateTheme('Startups', language)}</option><option value="Education">{translateTheme('Education', language)}</option></select></label>
              </div>
              <div className="form-grid"><label className="field"><span>{ui.company}</span><select value={eventForm.companyId} onChange={(event) => setEventForm((current) => ({ ...current, companyId: event.target.value }))}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label></div>
              <div className="form-grid">
                <label className="field city-field"><span>{copy.create.cityLabel}</span><input placeholder={copy.create.cityPlaceholder} value={eventForm.city} onChange={(event) => setEventForm((current) => ({ ...current, city: event.target.value }))} required /></label>
                <label className="field address-field"><span>{ui.eventAddress}</span><input value={eventForm.address} onChange={(event) => setEventForm((current) => ({ ...current, address: event.target.value }))} /><button type="button" className="secondary-button inline-map-button" onClick={() => setMapPickerTarget('event')}>{ui.pickOnMap}</button></label>
              </div>
              {(eventForm.address.trim() || eventForm.city.trim()) ? <div className="map-preview-card"><div className="map-card-header"><strong>{ui.mapPreview}</strong></div><iframe title={ui.eventLocationPreview} src={getMapEmbedUrl(eventForm.address.trim() || eventForm.city.trim())} className="map-frame" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}
              <label className="field"><span>{copy.create.posterLabel}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; if (posterPreview) URL.revokeObjectURL(posterPreview); setPosterFile(nextFile); setPosterPreview(nextFile ? URL.createObjectURL(nextFile) : ''); }} /></label>
              {posterPreview ? <img src={posterPreview} alt={locale === 'uk-UA' ? 'Попередній перегляд постера' : 'Poster preview'} className="event-poster-large" /> : null}
              <div className="form-grid"><label className="field"><span>{copy.create.priceLabel}</span><input type="number" placeholder="0" min="0" step="1" value={eventForm.price} onChange={(event) => setEventForm((current) => ({ ...current, price: event.target.value }))} /></label><label className="field"><span>{copy.create.capacityLabel}</span><input type="number" placeholder="50" min="1" step="1" value={eventForm.capacity} onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))} /></label></div>
              <div className="event-timing-grid"><label className="field"><span>{ui.eventDateTime}</span><input type="datetime-local" value={eventForm.startsAt} onChange={(event) => setEventForm((current) => ({ ...current, startsAt: event.target.value }))} required /></label></div>
              <div className="form-actions"><button type="submit" className="primary-button" disabled={status === 'saving'}>{status === 'saving' ? copy.common.saving : copy.create.createAction}</button><button type="button" className="secondary-button" onClick={() => setSettingsModalOpen(true)}>{ui.eventSettings}</button><button type="button" className="secondary-button" onClick={() => setPromoModalOpen(true)}>{ui.promoCodes}</button></div>
              {message ? <p className={`notice ${status === 'error' ? 'error' : 'success'}`}>{message}</p> : null}
            </form>
          ) : (
            <div className="empty-state compact-empty"><strong>{ui.createCompanyFirst}</strong><p>{ui.oneUserManyCompanies}</p><button type="button" className="primary-button" onClick={() => setMode('company')}>{ui.goToCompany}</button></div>
          )}
        </div>
      ) : null}

      {settingsModalOpen ? <div className="settings-modal-backdrop" onClick={() => setSettingsModalOpen(false)}><div className="settings-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><div className="settings-modal-head"><div><strong>{ui.eventSettings}</strong><p className="muted">{ui.eventSettingsHint}</p></div><button type="button" className="settings-modal-close" onClick={() => setSettingsModalOpen(false)} aria-label={ui.close}>×</button></div><div className="display-settings-grid"><label className="field"><span>{ui.whoCanSeeAttendees}</span><select value={eventForm.attendeeVisibility} onChange={(event) => setEventForm((current) => ({ ...current, attendeeVisibility: event.target.value as 'everyone' | 'registered_only' | 'nobody' }))}><option value="everyone">{locale === 'uk-UA' ? 'Усі' : 'Everyone'}</option><option value="registered_only">{locale === 'uk-UA' ? 'Тільки зареєстровані' : 'Registered users only'}</option><option value="nobody">{locale === 'uk-UA' ? 'Ніхто' : 'Nobody'}</option></select></label><label className="field"><span>{ui.notifyOnNewAttendee}</span><select value={eventForm.notifyOnNewAttendee ? 'yes' : 'no'} onChange={(event) => setEventForm((current) => ({ ...current, notifyOnNewAttendee: event.target.value === 'yes' }))}><option value="yes">{locale === 'uk-UA' ? 'Так' : 'Yes'}</option><option value="no">{locale === 'uk-UA' ? 'Ні' : 'No'}</option></select></label><label className="field comments-field"><span>{ui.comments}</span><select value={eventForm.commentAccess} onChange={(event) => setEventForm((current) => ({ ...current, commentAccess: event.target.value as 'everyone' | 'registered_only' | 'closed' }))}><option value="everyone">{locale === 'uk-UA' ? 'Відкриті' : 'Open'}</option><option value="registered_only">{locale === 'uk-UA' ? 'Тільки зареєстровані' : 'Registered only'}</option><option value="closed">{locale === 'uk-UA' ? 'Закриті' : 'Closed'}</option></select></label><label className="field"><span>{ui.publishDate}</span><input type="datetime-local" value={eventForm.publishAt} onChange={(event) => setEventForm((current) => ({ ...current, publishAt: event.target.value }))} /></label><label className="field comments-field"><span>{ui.redirectAfterPurchase}</span><input value={eventForm.redirectAfterPurchaseUrl} placeholder="/account" onChange={(event) => setEventForm((current) => ({ ...current, redirectAfterPurchaseUrl: event.target.value }))} /><small className="field-hint">{locale === 'uk-UA' ? 'Наприклад: /account або https://example.com/thanks' : 'For example: /account or https://example.com/thanks'}</small></label></div><div className="form-actions"><button type="button" className="primary-button" onClick={() => setSettingsModalOpen(false)}>{ui.done}</button></div></div></div> : null}

      {promoModalOpen ? <div className="settings-modal-backdrop" onClick={() => setPromoModalOpen(false)}><div className="settings-modal settings-modal-compact" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true"><div className="settings-modal-head"><div><strong>{ui.promoCodes}</strong><p className="muted">{ui.promoHint}</p></div><button type="button" className="settings-modal-close" onClick={() => setPromoModalOpen(false)} aria-label={ui.close}>×</button></div><div className="display-settings-grid"><label className="field"><span>{ui.promoCode}</span><input value={promoForm.code} placeholder="SPRING20" onChange={(event) => setPromoForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></label><label className="field"><span>{ui.discountPercent}</span><input type="number" min="1" max="99" value={promoForm.discountPercent} onChange={(event) => setPromoForm((current) => ({ ...current, discountPercent: event.target.value }))} /></label></div><div className="form-actions promo-actions"><button type="button" className="primary-button" onClick={handleAddPromoCode}>{ui.addPromoCode}</button></div>{promoMessage ? <p className="notice error">{promoMessage}</p> : null}{promoCodes.length > 0 ? <div className="scheduled-publications-list promo-list">{promoCodes.map((item) => <div key={item.code} className="scheduled-publication-card"><strong>{item.code}</strong><span className="muted">{ui.discountLabel(item.discountPercent)}</span><button type="button" className="secondary-button" onClick={() => handleRemovePromoCode(item.code)}>{copy.common.delete}</button></div>)}</div> : <div className="empty-state compact-empty promo-list"><strong>{ui.noPromoCodes}</strong><p>{ui.noPromoCodesHint}</p></div>}<div className="form-actions"><button type="button" className="primary-button" onClick={() => setPromoModalOpen(false)}>{ui.done}</button></div></div></div> : null}

      <MapPickerModal open={mapPickerTarget !== null} title={mapPickerTarget === 'company' ? ui.chooseCompanyLocation : ui.chooseEventLocation} confirmLabel={ui.useAddress} cancelLabel={copy.common.cancel} hint={ui.mapHint} initialQuery={mapPickerTarget === 'company' ? companyForm.location : eventForm.address || eventForm.city} language={locale === 'uk-UA' ? 'uk' : 'en'} onClose={() => setMapPickerTarget(null)} onSelect={(value) => { if (mapPickerTarget === 'company') { setCompanyForm((current) => ({ ...current, location: value.address })); } else { setEventForm((current) => ({ ...current, address: value.address, city: current.city.trim() ? current.city : value.city })); } setMapPickerTarget(null); }} />
    </section>
  );
}

