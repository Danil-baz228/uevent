import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  ApiEvent,
  VerifiedTicketResponse,
  checkInTicket,
  fetchCompanyById,
  formatEventDate,
  verifyTicket,
} from '../lib/api';

type ManageableEvent = Pick<ApiEvent, 'id' | 'title' | 'city' | 'startsAt' | 'company'>;

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export function AdminCheckInPage() {
  const { user, token, isReady } = useAuth();
  const { locale, language, copy } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [events, setEvents] = useState<ManageableEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [eventsMessage, setEventsMessage] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [actionStatus, setActionStatus] = useState<'idle' | 'verifying' | 'checking_in'>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<VerifiedTicketResponse | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  const yesNoCopy = locale === 'uk-UA' ? { yes: 'Так', no: 'Ні' } : { yes: 'Yes', no: 'No' };
  const fallbackError =
    language === 'uk' ? 'Щось пішло не так. Спробуйте ще раз.' : 'Something went wrong. Please try again.';
  const signInCta = language === 'uk' ? 'Увійти' : 'Sign in';

  const ui = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Check-in',
            title: 'Перевірка QR-квитків',
            text: 'Скануйте QR-код або введіть код квитка вручну, щоб перевірити його й відмітити відвідувача на вході.',
            signInNotice: 'Увійдіть, щоб відкрити адмін-перевірку квитків.',
            noEvents: 'У вас поки немає подій, які можна перевіряти на вході.',
            eventsLoading: 'Завантажуємо події для check-in...',
            selectEvent: 'Подія для перевірки',
            manualTitle: 'Ручна перевірка',
            ticketCode: 'Код квитка',
            ticketPlaceholder: 'UE-XXXXXX-XXXXXXXX',
            verify: 'Перевірити квиток',
            verifying: 'Перевіряємо...',
            scannerTitle: 'QR-сканер',
            scannerHint: 'Відкрийте камеру й наведіть її на QR-код з листа або квитка.',
            openScanner: 'Відкрити камеру',
            closeScanner: 'Закрити камеру',
            scannerUnsupported: 'У цьому браузері немає вбудованого QR-сканера. Можна перевірити код вручну.',
            scannerReady: 'Сканер активний. Наведіть камеру на QR-код.',
            scannerDetected: 'QR-код зчитано. Перевіряємо квиток...',
            resultTitle: 'Результат перевірки',
            attendee: 'Відвідувач',
            event: 'Подія',
            quantity: 'Квитків',
            status: 'Статус',
            checkedIn: 'Вхід вже підтверджено',
            checkedInAt: 'Час check-in',
            markCheckedIn: 'Підтвердити вхід',
            checkingIn: 'Підтверджуємо...',
            confirmed: 'Підтверджено',
            pending: 'Очікує оплату',
            ready: 'Квиток дійсний і готовий до check-in.',
            success: 'Квиток успішно відмічено на вході.',
            backToAccount: 'Повернутися до акаунта',
          }
        : {
            eyebrow: 'Check-in',
            title: 'QR ticket verification',
            text: 'Scan a QR code or enter the ticket code manually to validate it and mark the attendee as checked in.',
            signInNotice: 'Sign in to open the ticket verification admin tool.',
            noEvents: 'You do not have any events available for ticket verification yet.',
            eventsLoading: 'Loading events for check-in...',
            selectEvent: 'Event to verify',
            manualTitle: 'Manual verification',
            ticketCode: 'Ticket code',
            ticketPlaceholder: 'UE-XXXXXX-XXXXXXXX',
            verify: 'Verify ticket',
            verifying: 'Verifying...',
            scannerTitle: 'QR scanner',
            scannerHint: 'Open the camera and point it at the QR code from the email or ticket.',
            openScanner: 'Open camera',
            closeScanner: 'Close camera',
            scannerUnsupported: 'This browser has no built-in QR scanner. You can still verify the code manually.',
            scannerReady: 'Scanner is active. Point the camera at a QR code.',
            scannerDetected: 'QR detected. Verifying ticket...',
            resultTitle: 'Verification result',
            attendee: 'Attendee',
            event: 'Event',
            quantity: 'Tickets',
            status: 'Status',
            checkedIn: 'Already checked in',
            checkedInAt: 'Check-in time',
            markCheckedIn: 'Confirm entry',
            checkingIn: 'Confirming...',
            confirmed: 'Confirmed',
            pending: 'Pending payment',
            ready: 'This ticket is valid and ready for check-in.',
            success: 'Ticket was successfully checked in.',
            backToAccount: 'Back to account',
          },
    [language],
  );

  useEffect(() => {
    let active = true;

    async function loadManageableEvents() {
      if (!token || !user) {
        setEvents([]);
        setEventsStatus('success');
        return;
      }

      setEventsStatus('loading');
      setEventsMessage('');

      try {
        const companies = await Promise.all(
          user.companies.map((company) => fetchCompanyById(company.id, token)),
        );

        const nextEvents = companies
          .flatMap((company) => company.events)
          .map((event) => ({
            id: event.id,
            title: event.title,
            city: event.city,
            startsAt: event.startsAt,
            company: null,
          }))
          .sort(
            (left, right) =>
              new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
          );

        if (!active) {
          return;
        }

        setEvents(nextEvents);
        setSelectedEventId((current) =>
          current && nextEvents.some((event) => event.id === current)
            ? current
            : nextEvents[0]?.id ?? '',
        );
        setEventsStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setEvents([]);
        setEventsStatus('error');
        setEventsMessage(error instanceof Error ? error.message : ui.eventsLoading);
      }
    }

    void loadManageableEvents();

    return () => {
      active = false;
    };
  }, [token, ui.eventsLoading, user]);

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    if (!window.BarcodeDetector) {
      setScannerMessage(ui.scannerUnsupported);
      setCameraOpen(false);
      return;
    }

    let active = true;
    const detector = new window.BarcodeDetector({
      formats: ['qr_code'],
    });

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setScannerMessage(ui.scannerReady);

        const loop = async () => {
          if (!active || !videoRef.current) {
            return;
          }

          try {
            const detections = await detector.detect(videoRef.current);
            const value = detections[0]?.rawValue?.trim();

            if (value) {
              setTicketCode(value);
              setScannerMessage(ui.scannerDetected);
              setCameraOpen(false);
              void handleVerify(value);
              return;
            }
          } catch {
            // ignore intermittent detector failures while camera is warming up
          }

          scanLoopRef.current = window.setTimeout(loop, 700);
        };

        void loop();
      } catch (error) {
        setScannerMessage(error instanceof Error ? error.message : ui.scannerUnsupported);
        setCameraOpen(false);
      }
    }

    void startScanner();

    return () => {
      active = false;

      if (scanLoopRef.current) {
        window.clearTimeout(scanLoopRef.current);
        scanLoopRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraOpen, ui.scannerDetected, ui.scannerReady, ui.scannerUnsupported]);

  async function handleVerify(rawTicketCode?: string) {
    if (!token || !selectedEventId) {
      return;
    }

    setActionStatus('verifying');
    setMessage('');

    try {
      const verified = await verifyTicket(
        {
          ticketCode: rawTicketCode ?? ticketCode,
          eventId: selectedEventId,
        },
        token,
      );

      setResult(verified);
      setMessage(verified.alreadyCheckedIn ? ui.checkedIn : ui.ready);
    } catch (error) {
      setResult(null);
      setMessage(error instanceof Error ? error.message : fallbackError);
    } finally {
      setActionStatus('idle');
    }
  }

  async function handleCheckIn() {
    if (!token || !result) {
      return;
    }

    setActionStatus('checking_in');
    setMessage('');

    try {
      const checkedIn = await checkInTicket(
        {
          ticketCode: result.ticketCode,
          eventId: selectedEventId || result.registration.eventId,
        },
        token,
      );

      setResult(checkedIn);
      setMessage(ui.success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : fallbackError);
    } finally {
      setActionStatus('idle');
    }
  }

  if (!isReady) {
    return <p className="notice">{copy.common.loadingSession}</p>;
  }

  if (!user) {
    return (
      <section className="empty-state">
        <strong>{ui.signInNotice}</strong>
        <Link to="/auth" className="primary-button">
          {signInCta}
        </Link>
      </section>
    );
  }

  return (
    <section className="stack account-shell">
      <div className="section-header section-header-panel account-tickets-header">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.text}</p>
      </div>

      {eventsStatus === 'loading' ? (
        <p className="notice">{ui.eventsLoading}</p>
      ) : eventsStatus === 'error' ? (
        <p className="notice error">{eventsMessage}</p>
      ) : events.length === 0 ? (
        <p className="notice">{ui.noEvents}</p>
      ) : (
        <div className="admin-checkin-grid">
          <article className="form-card admin-checkin-card">
            <label className="field">
              <span>{ui.selectEvent}</span>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} · {formatEventDate(event.startsAt, locale)}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-checkin-scanner">
              <div>
                <strong>{ui.scannerTitle}</strong>
                <p className="muted">{ui.scannerHint}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCameraOpen((current) => !current)}
              >
                {cameraOpen ? ui.closeScanner : ui.openScanner}
              </button>
            </div>

            <div className="scanner-preview">
              {cameraOpen ? (
                <video ref={videoRef} className="scanner-video" muted playsInline />
              ) : (
                <div className="scanner-placeholder">{ui.scannerTitle}</div>
              )}
            </div>

            {scannerMessage ? <p className="notice">{scannerMessage}</p> : null}
          </article>

          <article className="form-card admin-checkin-card">
            <span className="eyebrow">{ui.manualTitle}</span>
            <label className="field">
              <span>{ui.ticketCode}</span>
              <input
                value={ticketCode}
                onChange={(event) => setTicketCode(event.target.value.toUpperCase())}
                placeholder={ui.ticketPlaceholder}
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="primary-button"
                disabled={actionStatus !== 'idle' || !ticketCode.trim() || !selectedEventId}
                onClick={() => void handleVerify()}
              >
                {actionStatus === 'verifying' ? ui.verifying : ui.verify}
              </button>
              <Link to="/account" className="secondary-button">
                {ui.backToAccount}
              </Link>
            </div>

            {message ? (
              <p
                className={`notice ${
                  result?.alreadyCheckedIn || message === ui.success ? 'success' : ''
                }`}
              >
                {message}
              </p>
            ) : null}

            {result ? (
              <div className="admin-checkin-result">
                <strong>{ui.resultTitle}</strong>
                <div className="admin-checkin-meta">
                  <span>{ui.attendee}</span>
                  <strong>{result.attendee.displayName}</strong>
                </div>
                <div className="admin-checkin-meta">
                  <span>{ui.event}</span>
                  <strong>{result.registration.event.title}</strong>
                </div>
                <div className="admin-checkin-meta">
                  <span>{ui.quantity}</span>
                  <strong>{result.registration.quantity}</strong>
                </div>
                <div className="admin-checkin-meta">
                  <span>{ui.status}</span>
                  <strong>
                    {result.registration.status === 'confirmed'
                      ? ui.confirmed
                      : ui.pending}
                  </strong>
                </div>
                <div className="admin-checkin-meta">
                  <span>{ui.checkedIn}</span>
                  <strong>{result.alreadyCheckedIn ? yesNoCopy.yes : yesNoCopy.no}</strong>
                </div>
                {result.checkedInAt ? (
                  <div className="admin-checkin-meta">
                    <span>{ui.checkedInAt}</span>
                    <strong>{formatEventDate(result.checkedInAt, locale)}</strong>
                  </div>
                ) : null}

                {!result.alreadyCheckedIn ? (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={actionStatus !== 'idle'}
                    onClick={() => void handleCheckIn()}
                  >
                    {actionStatus === 'checking_in' ? ui.checkingIn : ui.markCheckedIn}
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        </div>
      )}
    </section>
  );
}
