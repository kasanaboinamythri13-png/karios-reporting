import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const HEAD_LINKS = [
  { to: '/head', label: 'Home', end: true },
  { to: '/head/history', label: 'My reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

const CEO_LINKS = [
  { to: '/ceo', label: 'Overview', end: true },
  { to: '/ceo/reports', label: 'All reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const links = user.role === 'CEO' ? CEO_LINKS : HEAD_LINKS;

  return (
    <div className="layout">
      <header className="topbar">
        <strong>Karios Reporting</strong>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span>{user.title}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
