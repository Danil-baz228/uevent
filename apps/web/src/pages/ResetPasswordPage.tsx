import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { resetPassword as resetPasswordRequest } from '../lib/api';

export function ResetPasswordPage() {
  const { language } = useLanguage();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error' | 'success'>('idle');
  const [message, setMessage] = useState('');

  const token = useMemo(
    () => new URLSearchParams(location.search).get('token')?.trim() ?? '',
    [location.search],
  );

  const copy = useMemo(
    () =>
      language === 'uk'
        ? {
            eyebrow: 'Відновлення пароля',
            title: 'Створіть новий пароль',
            text: 'Введіть новий пароль та підтвердження. Після збереження потрібно буде увійти ще раз.',
            newPassword: 'Новий пароль',
            confirmPassword: 'Підтвердження нового пароля',
            submit: 'Зберегти пароль',
            saving: 'Зберігаємо...',
            missingToken: 'Посилання для відновлення недійсне або неповне.',
            success: 'Пароль змінено. Увійдіть ще раз з новим паролем.',
            fallback: 'Не вдалося змінити пароль',
            backToAuth: 'Повернутися до входу',
          }
        : {
            eyebrow: 'Password reset',
            title: 'Create a new password',
            text: 'Enter the new password and confirmation. You will need to sign in again after saving.',
            newPassword: 'New password',
            confirmPassword: 'Confirm new password',
            submit: 'Save password',
            saving: 'Saving...',
            missingToken: 'The password reset link is invalid or incomplete.',
            success: 'Password updated. Please sign in again with your new password.',
            fallback: 'Failed to reset password',
            backToAuth: 'Back to login',
          },
    [language],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setStatus('error');
      setMessage(copy.missingToken);
      return;
    }

    setStatus('saving');
    setMessage('');

    try {
      const response = await resetPasswordRequest({
        token,
        newPassword,
        confirmPassword,
      });

      await logout();
      setStatus('success');
      setMessage(response.message || copy.success);
      setTimeout(() => navigate('/auth?reset=success', { replace: true }), 1200);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : copy.fallback);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.text}</p>

        {!token ? (
          <div className="form-card auth-form">
            <p className="notice error">{copy.missingToken}</p>
            <Link to="/auth" className="secondary-button">
              {copy.backToAuth}
            </Link>
          </div>
        ) : (
          <form className="form-card auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{copy.newPassword}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            <label className="field">
              <span>{copy.confirmPassword}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </label>

            {message ? (
              <p className={`notice ${status === 'error' ? 'error' : 'success'}`}>{message}</p>
            ) : null}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={status === 'saving'}
              >
                {status === 'saving' ? copy.saving : copy.submit}
              </button>
              <Link to="/auth" className="secondary-button">
                {copy.backToAuth}
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
