import { NavLink, Outlet, Route, Routes } from 'react-router-dom';

import { CreateEventPage } from './pages/CreateEventPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand">
          <span className="brand-mark">U</span>
          <span>
            <strong>Uevent</strong>
            <small>Find your people</small>
          </span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <NavLink to="/discover" className="nav-link">
            Discover
          </NavLink>
          <NavLink to="/create-event" className="nav-link">
            Create event
          </NavLink>
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>Scaffolded for the Innovation Campus full-stack brief.</span>
        <span>React + NestJS + PostgreSQL + Stripe.</span>
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
        <Route path="/create-event" element={<CreateEventPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
