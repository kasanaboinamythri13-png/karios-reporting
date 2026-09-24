import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import CeoHeader from './ceo/CeoHeader.jsx';

const HEAD_LINKS = [
  { to: '/head', label: 'Home', end: true },
  { to: '/head/history', label: 'My reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  // If CEO, render executive command center layout
  if (user?.role === 'CEO') {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
        <CeoHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    );
  }

  // Fallback for HEAD roles (untouched to preserve team member code)
  return (
    <div className="layout">
      <header className="topbar">
        <strong>Karios Reporting</strong>
        <nav>
          {HEAD_LINKS.map((l) => (
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
