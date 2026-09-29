import { useCallback, useEffect, useRef, useState } from 'react';
import { useDismiss } from '../hooks/useDismiss.js';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications.js';
import { useNotifications } from '../notifications/NotificationsContext.jsx';
import NotificationItems from './NotificationItems.jsx';

// 🔔 with the unread count. Click → panel with the latest notifications.
// Clicking one marks it read and opens its report.
export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listNotifications();
      setList(data.notifications);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message);
    }
  }, [setUnreadCount]);

  // Load when opened, and again if a new notification arrives while it's open.
  useEffect(() => {
    if (open) load();
  }, [open, unreadCount, load]);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrapRef, open, close);

  async function openItem(n) {
    setError(null);
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setList((items) => items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        setError(err.message);
        return;
      }
    }
    if (n.report_id) {
      setOpen(false);
      navigate(`/reports/${n.report_id}`);
    }
  }

  async function markAll() {
    setError(null);
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setList((items) => items?.map((x) => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7Z"
            fill="currentColor"
          />
        </svg>
        {unreadCount > 0 && <span className="bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="menu-panel bell-panel" role="dialog" aria-label="Notifications">
          <div className="bell-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="link-button small" disabled={busy} onClick={markAll}>
                Mark all as read
              </button>
            )}
          </div>

          {error && <p className="bell-message text-rejected small">{error}</p>}
          {!list && !error && <p className="bell-message muted small">Loading…</p>}
          {list?.length === 0 && (
            <p className="bell-message muted">No notifications yet. You'll be told here when the CEO reviews your report.</p>
          )}
          {list?.length > 0 && (
            <ul className="notification-list bell-list">
              <NotificationItems notifications={list} onOpen={openItem} />
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
