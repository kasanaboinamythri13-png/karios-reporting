import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Bell,
  User,
  LogOut,
  Clock,
  Shield,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function CeoHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Maintain live Asia/Kolkata (IST) clock
  useEffect(() => {
    function updateIstClock() {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const dateOptions = {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      const timeStr = new Intl.DateTimeFormat('en-IN', options).format(now);
      const dateStr = new Intl.DateTimeFormat('en-IN', dateOptions).format(now);
      setCurrentTime(`${dateStr} • ${timeStr} IST`);
    }

    updateIstClock();
    const interval = setInterval(updateIstClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/ceo', label: 'Executive Overview', icon: LayoutDashboard, end: true },
    { to: '/ceo/reports', label: 'All Reports & Audits', icon: FileSpreadsheet },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Executive Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 text-white">
      {/* Top Notification / Environment Ribbon */}
      <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 py-1 text-xs bg-slate-950/70 border-b border-slate-800/40 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-medium">LIVE ZERO-PULL SYNC</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="font-mono">{currentTime || 'Asia/Kolkata (UTC+05:30)'}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Strict Display Standard: <strong className="text-slate-200">Titles Only</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400 font-mono">Currency: USD ($)</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-white">KARIOS</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  COMMAND CENTER
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Executive Enterprise Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-inner border border-slate-700/60'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Display Role Badge */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                C
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white tracking-wide">{user.title || 'CEO'}</div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="End Executive Session"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu (Android & Tablet Viewports) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-4 space-y-1">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <span>Signed in as: <strong className="text-white">{user.title || 'CEO'}</strong></span>
            <span className="font-mono text-emerald-400">Asia/Kolkata</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-indigo-400" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}
