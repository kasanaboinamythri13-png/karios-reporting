// src/utils/formatters.js
// Currency and date helpers for mobile UI

export function formatCurrency(value, currency = '$') {
  const num = Number(value || 0);
  if (num >= 1_000_000) return `${currency}${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${currency}${(num / 1_000).toFixed(1)}K`;
  return `${currency}${num.toLocaleString()}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function getISTDateString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function formatISTTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateStr) {
  const today = getISTDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yesterday);

  if (dateStr === today) return 'Today';
  if (dateStr === yStr) return 'Yesterday';
  return formatDisplayDate(dateStr);
}

export function departmentLabel(dept) {
  const labels = {
    DEVELOPMENT: 'Development',
    SALES: 'Sales',
    MARKETING: 'Marketing',
    FINANCE: 'Finance',
  };
  return labels[dept] || dept;
}

export function departmentLetter(dept) {
  const upper = String(dept || '').toUpperCase();
  if (upper.includes('DEV')) return 'D';
  if (upper.includes('SALE')) return 'S';
  if (upper.includes('MARKET')) return 'M';
  if (upper.includes('FINAN')) return 'F';
  if (upper.includes('EXEC') || upper.includes('CEO')) return 'C';
  return upper.charAt(0) || 'D';
}

export function departmentEmoji(dept) {
  return departmentLetter(dept);
}

