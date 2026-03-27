import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { AuthResponse, getGoogleLoginUrl } from '../lib/api';

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
  const googleCopy =
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
        };

  function decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded =
      normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    return atob(padded);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userPayload = params.get('user');
    const googleError = params.get('googleError');

    if (googleError) {
      setStatus('error');
      setMessage(googleCopy.failed);
      navigate('/auth', { replace: true });
      return;
    }

    if (!accessToken || !refreshToken || !userPayload) {
      return;
    }

    try {
      const decodedUser = JSON.parse(
        decodeBase64Url(userPayload),
      ) as AuthResponse['user'];

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
  }, [applyAuthResponse, googleCopy.failed, location.search, navigate]);

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
        <h1>{mode === 'login' ? copy.auth.titleLogin : copy.auth.titleRegister}</h1>
        <p className="muted">{copy.auth.text}</p>

        <div className="pill-row">
          <button
            type="button"
            className={`toggle-pill ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            {copy.auth.loginTab}
          </button>
          <button
            type="button"
            className={`toggle-pill ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            {copy.auth.registerTab}
          </button>
        </div>

        <form className="form-card auth-form" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            className="primary-button"
            disabled={status === 'saving'}
          >
            {mode === 'login' ? copy.auth.signInAction : copy.auth.registerAction}
          </button>

          {message ? <p className="notice error">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
