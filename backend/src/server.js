import app from './app.js';
import { env } from './config/env.js';
import { startDailyReminder } from './jobs/dailyReminder.js';

app.listen(env.port, () => {
  console.log(`Karios API running on http://localhost:${env.port}`);
  startDailyReminder();
});
