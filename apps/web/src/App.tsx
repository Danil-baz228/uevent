import { NavLink, Outlet, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth/AuthContext';
import { useLanguage } from './i18n/LanguageContext';
import { AuthPage } from './pages/AuthPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { useTheme } from './theme/ThemeContext';

function Layout() {
  const { user, logout } = useAuth();
  const { language, setLanguage, copy } = useLanguage();
  const { theme, setTheme } = useTheme();
  const themeCopy =
    language === 'uk'
      ? { label: 'Тема', light: 'Світла', dark: 'Темна' }
      : { label: 'Theme', light: 'Light', dark: 'Dark' };

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden="true">
        <div className="layout-orb orb-coral" />
        <div className="layout-orb orb-ink" />
        <div className="layout-orb orb-mint" />
        <div className="layout-grid" />
      </div>

      <header className="app-header">
        <div className="header-panel">
          <div className="header-topline">
            <NavLink to="/" className="brand">
              <span className="brand-mark">U</span>
              <span>
                <strong>{copy.brand.title}</strong>
                <small>{copy.brand.tagline}</small>
              </span>
            </NavLink>

            <div className="header-actions">
              <div className="theme-switch" aria-label={themeCopy.label}>
                <button
                  type="button"
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  {themeCopy.light}
                </button>
                <button
                  type="button"
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  {themeCopy.dark}
                </button>
              </div>

              <div className="language-switch" aria-label={copy.header.language}>
                <button
                  type="button"
                  className={`language-button ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`language-button ${language === 'uk' ? 'active' : ''}`}
                  onClick={() => setLanguage('uk')}
                >
                  UA
                </button>
              </div>

              {user ? (
                <>
                  <div className="user-chip">
                    <strong>{user.displayName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button type="button" className="secondary-button" onClick={logout}>
                    {copy.header.logout}
                  </button>
                </>
              ) : (
                <NavLink to="/auth" className="secondary-button">
                  {copy.header.signIn}
                </NavLink>
              )}
            </div>
          </div>

          <div className="header-bottomline">
            <nav className="nav">
              <NavLink to="/" end className="nav-link">
                {copy.nav.home}
              </NavLink>
              <NavLink to="/discover" className="nav-link">
                {copy.nav.discover}
              </NavLink>
              <NavLink to="/create-event" className="nav-link">
                {copy.nav.createEvent}
              </NavLink>
              <NavLink to="/auth" className="nav-link">
                {user ? copy.nav.account : copy.nav.login}
              </NavLink>
            </nav>
            <p className="header-caption">{copy.footer.lead}</p>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>{copy.footer.lead}</span>
        <span>{copy.footer.caption}</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
