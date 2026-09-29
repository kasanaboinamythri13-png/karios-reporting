// Checks the database connection and lists the tables.  →  npm run db:check
import { query, pool } from '../config/db.js';

try {
  const version = await query('SELECT version();');
  console.log('✅ Connected:', version.rows[0].version.split(',')[0]);

  const tables = await query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`,
  );
  console.log('Tables:', tables.rows.map((r) => r.table_name).join(', ') || '(none yet — run npm run db:migrate)');
} catch (err) {
  console.error('❌ Could not connect:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
