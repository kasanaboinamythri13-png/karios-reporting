import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications.js';
import { useApi } from '../../hooks/useApi.js';
import { useNotifications } from '../../notifications/NotificationsContext.jsx';
import { EmptyState, ErrorBanner, Loading } from '../../components/Feedback.jsx';
import NotificationItems from '../../components/NotificationItems.jsx';

// Owner: Member 2
// Newest first. Clicking one marks it read and opens its report.
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotifications();
  const { data, error, loading, reload } = useApi(listNotifications, [], { refreshOnFocus: true });
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const notifications = data?.notifications || [];
  const unread = notifications.filter((n) => !n.is_read).length;

  async function open(n) {
    setActionError(null);
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        setActionError(err.message);
      }
    }
    if (n.report_id) navigate(`/reports/${n.report_id}`);
    else reload({ silent: true });
  }

  async function markAll() {
    setActionError(null);
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      await reload({ silent: true });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Notifications</h1>
        {unread > 0 && (
          <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={markAll}>
            Mark all as read
          </button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={reload} />
      <ErrorBanner error={actionError} />
      {loading && !data && <Loading />}

      {data && notifications.length === 0 && (
        <EmptyState title="No notifications yet">You'll be told here when the CEO reviews your report.</EmptyState>
      )}

      {notifications.length > 0 && (
        <ul className="card notification-list">
          <NotificationItems notifications={notifications} onOpen={open} />
        </ul>
      )}
    </>
  );
}
