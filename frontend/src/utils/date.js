// Display helpers only. The backend decides what "today" is (Asia/Kolkata).

// "2026-09-25" → "25 Sep 2026"
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(`${String(isoDate).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// "2026-09-25" → "Thu, 25 Sep 2026"
export function formatLongDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(`${String(isoDate).slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Timestamp → "25 Sep 2026, 14:05" (shown in India time, like the rest of the app)
export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

// Timestamp → "just now" / "5 min ago" / "3 h ago" / "2 days ago"
export function timeAgo(timestamp) {
  const seconds = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  const days = Math.floor(seconds / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
