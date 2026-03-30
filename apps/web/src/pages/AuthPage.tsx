import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AuthResponse, forgotPassword, getGoogleLoginUrl } from '../lib/api';

export function AuthPage() {
  const { isReady, user, login, register, applyAuthResponse } = useAuth();
  const { copy, locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState('');

  const isForgotMode = mode === 'login' && forgotOpen;

  const googleCopy = useMemo(
    () =>
      locale === 'uk-UA'
        ? {
            action: 'Продовжити через Google',
            processing: 'Завершуємо вхід через Google...',
            failed: 'Не вдалося увійти через Google',
            divider: 'або',
          }
        : {
            action: 'Continue with Google',
            processing: 'Completing Google sign-in...',
            failed: 'Failed to sign in with Google',
            divider: 'or',
          },
    [locale],
  );

  const forgotCopy = useMemo(
    () =>
      locale === 'uk-UA'
        ? {
            trigger: 'Забули пароль?',
            title: 'Відновлення доступу',
            text: 'Введіть email, і ми надішлемо лист із кнопкою для створення нового пароля.',
            action: 'Надіслати лист',
            back: 'Повернутися до входу',
            sending: 'Надсилаємо...',
            success: 'Лист для відновлення пароля відправлено. Перевірте пошту.',
            failed: 'Не вдалося надіслати лист для відновлення',
          }
        : {
            trigger: 'Forgot password?',
            title: 'Restore access',
            text: 'Enter your email and we will send a message with a button to create a new password.',
            action: 'Send email',
            back: 'Back to sign in',
            sending: 'Sending...',
            success: 'Password reset email sent. Check your inbox.',
            failed: 'Failed to send password reset email',
          },
    [locale],
  );

  function decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    return atob(padded);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userPayload = params.get('user');
    const googleError = params.get('googleError');
    const resetStatus = params.get('reset');

    if (googleError) {
      setStatus('error');
      setMessage(googleCopy.failed);
      navigate('/auth', { replace: true });
      return;
    }

    if (resetStatus === 'success') {
      setStatus('idle');
      setMessage(forgotCopy.success);
      navigate('/auth', { replace: true });
      return;
    }

    if (!accessToken || !refreshToken || !userPayload) {
      return;
    }

    try {
      const decodedUser = JSON.parse(decodeBase64Url(userPayload)) as AuthResponse['user'];

      applyAuthResponse({
        accessToken,
        refreshToken,
        user: decodedUser,
      });
      navigate('/create-event', { replace: true });
    } catch {
      setStatus('error');
      setMessage(googleCopy.failed);
      navigate('/auth', { replace: true });
    }
  }, [applyAuthResponse, forgotCopy.success, googleCopy.failed, location.search, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ displayName, email, password });
      }

      navigate('/create-event');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : copy.auth.authFailed);
    } finally {
      setStatus('idle');
    }
  }

  async function handleForgotPassword() {
    setForgotStatus('saving');
    setForgotMessage('');

    try {
      await forgotPassword({ email: forgotEmail.trim() || email.trim() });
      setForgotStatus('idle');
      setForgotMessage(forgotCopy.success);
    } catch (error) {
      setForgotStatus('error');
      setForgotMessage(error instanceof Error ? error.message : forgotCopy.failed);
    }
  }

  function openForgotMode() {
    setForgotOpen(true);
    setForgotEmail(email);
    setForgotStatus('idle');
    setForgotMessage('');
    setMessage('');
  }

  function closeForgotMode() {
    setForgotOpen(false);
    setForgotStatus('idle');
    setForgotMessage('');
  }

  if (!isReady) {
    return <p className="notice">{copy.common.loadingSession}</p>;
  }

  if (user) {
    return (
      <section className="auth-shell">
        <div className="auth-panel">
          <span className="eyebrow">{copy.nav.account}</span>
          <h1>{copy.auth.alreadySignedIn}</h1>
          <p className="muted">{copy.auth.loggedInAs(user.displayName, user.email)}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/create-event')}
          >
            {copy.auth.createEventCta}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">{copy.auth.eyebrow}</span>
        <h1>
          {isForgotMode
            ? forgotCopy.title
            : mode === 'login'
              ? copy.auth.titleLogin
              : copy.auth.titleRegister}
        </h1>
        <p className="muted">{isForgotMode ? forgotCopy.text : copy.auth.text}</p>

        <div className="pill-row">
          <button
            type="button"
            className={`toggle-pill ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              closeForgotMode();
            }}
          >
            {copy.auth.loginTab}
          </button>
          <button
            type="button"
            className={`toggle-pill ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              closeForgotMode();
            }}
          >
            {copy.auth.registerTab}
          </button>
        </div>

        <form className="form-card auth-form" onSubmit={handleSubmit}>
          {!isForgotMode ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setStatus('saving');
                  setMessage(googleCopy.processing);
                  window.location.href = getGoogleLoginUrl();
                }}
              >
                {googleCopy.action}
              </button>

              <div className="auth-divider">
                <span>{googleCopy.divider}</span>
              </div>

              {mode === 'register' ? (
                <label className="field">
                  <span>{copy.auth.displayName}</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={copy.auth.displayNamePlaceholder}
                    required
                  />
                </label>
              ) : null}

              <label className="field">
                <span>{copy.auth.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="demo@uevent.local"
                  required
                />
              </label>

              <label className="field">
                <span>{copy.auth.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={copy.auth.passwordPlaceholder}
                  minLength={8}
                  required
                />
              </label>

              {mode === 'login' ? (
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={openForgotMode}
                >
                  {forgotCopy.trigger}
                </button>
              ) : null}

              <button
                type="submit"
                className="primary-button"
                disabled={status === 'saving'}
              >
                {mode === 'login' ? copy.auth.signInAction : copy.auth.registerAction}
              </button>
            </>
          ) : (
            <>
              <label className="field">
                <span>{copy.auth.email}</span>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </label>

              {forgotMessage ? (
                <p className={`notice ${forgotStatus === 'error' ? 'error' : 'success'}`}>
                  {forgotMessage}
                </p>
              ) : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={forgotStatus === 'saving'}
                  onClick={() => void handleForgotPassword()}
                >
                  {forgotStatus === 'saving' ? forgotCopy.sending : forgotCopy.action}
                </button>
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={closeForgotMode}
                >
                  {forgotCopy.back}
                </button>
              </div>
            </>
          )}

          {message && !isForgotMode ? (
            <p className={`notice ${status === 'error' ? 'error' : 'success'}`}>{message}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
