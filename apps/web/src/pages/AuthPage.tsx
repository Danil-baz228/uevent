import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

export function AuthPage() {
  const { isReady, user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
      setMessage(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    } finally {
      setStatus('idle');
    }
  }

  if (!isReady) {
    return <p className="notice">Loading session...</p>;
  }

  if (user) {
    return (
      <section className="auth-shell">
        <div className="auth-panel">
          <span className="eyebrow">Account</span>
          <h1>You are already signed in.</h1>
          <p className="muted">
            Logged in as {user.displayName} ({user.email}).
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/create-event')}
          >
            Create an event
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">Auth</span>
        <h1>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        <p className="muted">
          Use the demo account `demo@uevent.local` / `demo12345`, or create a
          new user and start publishing events under that profile.
        </p>

        <div className="pill-row">
          <button
            type="button"
            className={`toggle-pill ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`toggle-pill ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="form-card auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="field">
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Community Builder"
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="demo@uevent.local"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={status === 'saving'}
          >
            {mode === 'login' ? 'Sign in' : 'Register'}
          </button>

          {message ? <p className="notice error">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
