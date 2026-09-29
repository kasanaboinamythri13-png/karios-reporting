import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { isCeo } from '../auth/roles.js';
import { NotificationsProvider, useNotifications } from '../notifications/NotificationsContext.jsx';
import logo from '../assets/karios-logo.png';

const HEAD_LINKS = [
  { to: '/head', label: 'Home', end: true },
  { to: '/head/history', label: 'My reports' },
]; // heads reach notifications + profile through the bell and profile icons on Home

const CEO_LINKS = [
  { to: '/ceo', label: 'Overview', end: true },
  { to: '/ceo/reports', label: 'All reports' },
  { to: '/notifications', label: 'Notifications', badge: true },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  return (
    <NotificationsProvider>
      <Shell />
    </NotificationsProvider>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const links = isCeo(user) ? CEO_LINKS : HEAD_LINKS;

  // Close the phone menu after navigating.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="layout">
      <header className="mobile-bar">
        <button
          type="button"
          className="menu-button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <img className="logo logo-small" src={logo} alt="Karios" />
      </header>

      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <img className="logo" src={logo} alt="Karios" />
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              <span>{l.label}</span>
              {l.badge && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="muted small">{user.title}</span>
          <button type="button" className="button-secondary logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
