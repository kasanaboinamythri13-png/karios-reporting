import { env } from '../config/env.js';

// The ONLY place that decides what "today" means. Always Asia/Kolkata, never the server clock's zone.
// Returns "YYYY-MM-DD".
export function todayIST(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.timezone }).format(now);
}

export function isToday(dateString, now = new Date()) {
  return dateString === todayIST(now);
}
