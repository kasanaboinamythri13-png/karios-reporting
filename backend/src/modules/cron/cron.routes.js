import { Router } from 'express';
import { env } from '../../config/env.js';
import { Unauthorized } from '../../utils/errors.js';
import { sendDailyReminders } from '../../jobs/dailyReminder.js';

// Scheduled jobs called by Vercel Cron (see backend/vercel.json → "crons").
// On Vercel nothing stays running, so the in-process timer in server.js never fires there.
// Vercel sends "Authorization: Bearer <CRON_SECRET>"; anyone else is refused.
const router = Router();

router.use((req, res, next) => {
  if (!env.cronSecret || req.get('Authorization') !== `Bearer ${env.cronSecret}`) {
    return next(Unauthorized('Not allowed'));
  }
  next();
});

// GET /api/cron/daily-reminder → { sent } (heads who haven't submitted today get a REMINDER notification)
router.get('/daily-reminder', async (req, res) => {
  const sent = await sendDailyReminders();
  console.log(`[Reminder] Sent ${sent} reminder(s) (cron)`);
  res.json({ sent });
});

export default router;
