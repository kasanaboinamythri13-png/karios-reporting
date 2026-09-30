// Brings the attachments table up to date so files can be stored in the database.
// Safe to run any number of times, and it touches nothing else (unlike db:migrate, which also seeds sample data).
//   npm run db:attachments
import { query, pool } from '../config/db.js';

try {
  // Who uploaded the file (a file belongs to its head before the report is submitted)
  await query(`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE;`);
  // Files are uploaded before the report exists, so report_id starts empty
  await query(`ALTER TABLE attachments ALTER COLUMN report_id DROP NOT NULL;`);
  // The file itself
  await query(`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS content BYTEA;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_attachments_report ON attachments(report_id);`);
  const { rows } = await query(
    `SELECT COUNT(*)::int AS files, COALESCE(SUM(size_bytes), 0)::bigint AS bytes
     FROM attachments WHERE content IS NOT NULL;`,
  );
  const mb = (Number(rows[0].bytes) / 1024 / 1024).toFixed(1);
  console.log(`✅ Attachments are stored in the database (${rows[0].files} file(s), ${mb} MB so far).`);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
