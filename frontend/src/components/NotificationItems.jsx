import { formatDateTime, timeAgo } from '../utils/date.js';

// Notification rows, used by the Home bell and the notifications page.
export default function NotificationItems({ notifications, onOpen }) {
  return notifications.map((n) => {
    const { icon, tone } = kind(n);
    return (
      <li key={n.id}>
        <button type="button" className={n.is_read ? 'notification' : 'notification unread'} onClick={() => onOpen(n)}>
          <span className={`notification-icon ${tone}`} aria-hidden="true">
            {icon}
          </span>
          <span className="notification-body">
            <strong>{n.title}</strong>
            {n.body && <span className="muted">{n.body}</span>}
          </span>
          <time className="muted small" dateTime={n.created_at} title={formatDateTime(n.created_at)}>
            {timeAgo(n.created_at)}
          </time>
          {!n.is_read && <span className="unread-dot" aria-label="Unread" />}
        </button>
      </li>
    );
  });
}

// Icon + color per notification: review result, reminder, or a head's submission (CEO).
function kind(n) {
  const text = `${n.title} ${n.body || ''}`.toLowerCase();
  if (n.type === 'REMINDER') return { icon: '⏰', tone: 'tone-pending' };
  if (n.type === 'REPORT_REVIEW' && text.includes('reject')) return { icon: '✕', tone: 'tone-rejected' };
  if (n.type === 'REPORT_REVIEW') return { icon: '✓', tone: 'tone-approved' };
  return { icon: '📄', tone: 'tone-neutral' };
}
