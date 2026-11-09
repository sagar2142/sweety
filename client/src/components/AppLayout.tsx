import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ChartIcon, DropIcon, ListIcon, LogoutIcon } from './Icons';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="app-header">
        <div className="container app-header__inner">
          <NavLink to="/" className="brand" aria-label="Sweety home">
            <span className="brand__mark">
              <DropIcon size={18} strokeWidth={2.4} />
            </span>
            <span className="brand__name">Sweety</span>
          </NavLink>

          <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end className="main-nav__link">
              <ListIcon size={18} />
              Readings
            </NavLink>
            <NavLink to="/reports" className="main-nav__link">
              <ChartIcon size={18} />
              Reports
            </NavLink>
          </nav>

          <div className="user-menu">
            <span className="user-menu__name" title={user?.email}>
              {user?.name}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              <LogoutIcon size={18} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="container app-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="app-footer">
        <p className="container">
          Sweety helps you keep a log. It does not give medical advice – talk to your doctor about your readings.
        </p>
      </footer>
    </div>
  );
}
