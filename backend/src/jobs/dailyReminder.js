// Daily reminder: at 6 PM IST, notify every active head who has not submitted today.
// Owner: Member 2
//
// Runs inside the API server (started from server.js). To test without waiting for 6 PM:
//   npm run reminder:run
import cron from 'node-cron';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { todayIST } from '../utils/date.js';

/**
 * Creates a REMINDER notification for each active head with no report today.
 * Skips heads who already got a reminder today, so running it twice sends nothing new.
 * Returns how many reminders were created.
 */
export async function sendDailyReminders(now = new Date()) {
  const today = todayIST(now);

  const result = await query(
    `INSERT INTO notifications (user_id, type, title, body)
     SELECT u.id, 'REMINDER', 'Daily report pending',
            'Your daily report for ' || $1 || ' has not been submitted yet.'
     FROM users u
     WHERE u.is_active = TRUE
       AND u.role <> 'CEO'
       AND NOT EXISTS (
         SELECT 1 FROM reports r WHERE r.user_id = u.id AND r.report_date = $1::date
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = u.id
           AND n.type = 'REMINDER'
           AND (n.created_at AT TIME ZONE $2)::date = $1::date
       );`,
    [today, env.timezone],
  );

  return result.rowCount;
}

export function startDailyReminder() {
  if (!cron.validate(env.reminderCron)) {
    console.error(`[Reminder] Invalid REMINDER_CRON "${env.reminderCron}" — daily reminder is OFF`);
    return;
  }

  cron.schedule(
    env.reminderCron,
    async () => {
      try {
        const count = await sendDailyReminders();
        console.log(`[Reminder] Sent ${count} reminder(s)`);
      } catch (err) {
        console.error('[Reminder] Failed:', err.message);
      }
    },
    { timezone: env.timezone },
  );

  console.log(`[Reminder] Scheduled "${env.reminderCron}" (${env.timezone})`);
}
