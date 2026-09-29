import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { departmentLabel, isCeo } from '../auth/roles.js';
import { useDismiss } from '../hooks/useDismiss.js';

// 👤 button next to the bell → title, role, department + Log out. No personal names.
export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrapRef, open, close);

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-button"
        aria-label="Profile"
        title="Profile"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.24-8 5v1.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V19c0-2.76-3.6-5-8-5Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open && (
        <div className="menu-panel profile-panel" role="dialog" aria-label="Profile">
          <div className="profile-panel-head">
            <span className="profile-avatar" aria-hidden="true">
              {initials(user.title)}
            </span>
            <div>
              <strong>{user.title}</strong>
              <span className="muted small">{isCeo(user) ? 'CEO' : 'Department Head'}</span>
            </div>
          </div>
          <dl className="profile-panel-rows">
            {user.department && (
              <div>
                <dt className="muted small">Department</dt>
                <dd>{departmentLabel(user.department)}</dd>
              </div>
            )}
            {user.email && (
              <div>
                <dt className="muted small">Login email</dt>
                <dd>{user.email}</dd>
              </div>
            )}
          </dl>
          <div className="profile-panel-foot">
            <button type="button" className="button-secondary logout" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// "Finance Head" → "FH"
function initials(title = '') {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
