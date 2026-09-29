// Runs the daily reminder once, right now (for testing).  →  npm run reminder:run
import { pool } from '../config/db.js';
import { sendDailyReminders } from '../jobs/dailyReminder.js';

try {
  const count = await sendDailyReminders();
  console.log(`[Reminder] Sent ${count} reminder(s)`);
} catch (err) {
  console.error('[Reminder] Failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
