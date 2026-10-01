import 'dotenv/config';

// Hosting dashboards (e.g. Vercel's ".env paste") can keep the quotes and spaces around a value.
// Strip them so FIREBASE_PRIVATE_KEY="-----BEGIN…" works however it was entered.
function clean(value) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  const quoted = /^(["']).*\1$/s.test(trimmed);
  return quoted ? trimmed.slice(1, -1) : trimmed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()),
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  databaseUrl: process.env.DATABASE_URL,
  // "Bearer dev-sales" style test logins. Must stay false on the live server.
  allowDevTokens: process.env.ALLOW_DEV_TOKENS === 'true',
  // When the daily reminder runs (cron format, IST). Default: every day at 18:00.
  reminderCron: process.env.REMINDER_CRON || '0 18 * * *',
  // Secret Vercel Cron sends to /api/cron/* (live server only). Without it those endpoints refuse everyone.
  cronSecret: process.env.CRON_SECRET,
  firebase: {
    projectId: clean(process.env.FIREBASE_PROJECT_ID),
    clientEmail: clean(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: clean(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    storageBucket: clean(process.env.FIREBASE_STORAGE_BUCKET),
  },
};
