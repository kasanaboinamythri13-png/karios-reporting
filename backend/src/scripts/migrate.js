// ============================================================
// Karios Backend — Database Migration & Seed Runner (PostgreSQL)
// ============================================================
import { query, pool } from '../config/db.js';
import { getTodayIST } from '../utils/date.js';

const args = process.argv.slice(2);
const RESET = args.includes('--reset');
const SAMPLE = args.includes('--sample') || true;

async function runMigrations() {
  console.log('[Migration] Starting Neon PostgreSQL database migration...');

  // Enable UUID extension
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  if (RESET) {
    console.log('[Migration] --reset: dropping all tables (all data will be lost)...');
    await query(`DROP TABLE IF EXISTS notifications CASCADE;`);
    await query(`DROP TABLE IF EXISTS attachments CASCADE;`);
    await query(`DROP TABLE IF EXISTS reports CASCADE;`);
    await query(`DROP TABLE IF EXISTS users CASCADE;`);
  }

  // 1. Users Table
  console.log('[Migration] Creating users table...');
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      firebase_uid VARCHAR(128) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('DEVELOPER_HEAD', 'SALES_HEAD', 'MARKETING_HEAD', 'FINANCE_HEAD', 'CEO', 'HEAD')),
      department VARCHAR(50) CHECK (department IN ('DEVELOPMENT', 'SALES', 'MARKETING', 'FINANCE', 'EXECUTIVE')),
      title VARCHAR(100) NOT NULL,
      fcm_token TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Reports Table
  console.log('[Migration] Creating reports table...');
  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department VARCHAR(50) NOT NULL,
      report_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      blockers TEXT,
      revenue_closed NUMERIC(15,2) DEFAULT 0,
      marketing_spend NUMERIC(15,2) DEFAULT 0,
      leads INTEGER DEFAULT 0,
      collections NUMERIC(15,2) DEFAULT 0,
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      review_comment TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_user_report_date UNIQUE (user_id, report_date)
    );
  `);

  // 3. Attachments Table
  console.log('[Migration] Creating attachments table...');
  await query(`
    CREATE TABLE IF NOT EXISTS attachments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
      uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      storage_path TEXT NOT NULL UNIQUE,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE;`);
  await query(`ALTER TABLE attachments ALTER COLUMN report_id DROP NOT NULL;`);
  // The file itself (attachments are stored in the database)
  await query(`ALTER TABLE attachments ADD COLUMN IF NOT EXISTS content BYTEA;`);

  // 4. Notifications Table
  console.log('[Migration] Creating notifications table...');
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_dept ON reports(department);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_attachments_report ON attachments(report_id);`);

  console.log('[Migration] All tables and indexes created successfully!');

  // Seed default team accounts
  console.log('[Migration] Seeding initial team accounts...');
  const seedUsers = [
    { email: 'ceo@karios.internal', role: 'CEO', department: 'EXECUTIVE', title: 'CEO' },
    { email: 'developer.head@karios.internal', role: 'DEVELOPER_HEAD', department: 'DEVELOPMENT', title: 'Developer Head' },
    { email: 'sales.head@karios.internal', role: 'SALES_HEAD', department: 'SALES', title: 'Sales Head' },
    { email: 'marketing.head@karios.internal', role: 'MARKETING_HEAD', department: 'MARKETING', title: 'Marketing Head' },
    { email: 'finance.head@karios.internal', role: 'FINANCE_HEAD', department: 'FINANCE', title: 'Finance Head' },
  ];

  for (const u of seedUsers) {
    await query(`
      INSERT INTO users (email, role, department, title)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
      SET role = EXCLUDED.role, department = EXCLUDED.department, title = EXCLUDED.title;
    `, [u.email, u.role, u.department, u.title]);
  }

  if (SAMPLE) {
    await seedSampleReports();
  }

  console.log('[Migration] Done.');
  await pool.end();
  process.exit(0);
}

async function seedSampleReports() {
  console.log('[Migration] Seeding sample reports for development & testing...');
  const devUser = await query(`SELECT id FROM users WHERE role = 'DEVELOPER_HEAD' LIMIT 1;`);
  const salesUser = await query(`SELECT id FROM users WHERE role = 'SALES_HEAD' LIMIT 1;`);
  const marketingUser = await query(`SELECT id FROM users WHERE role = 'MARKETING_HEAD' LIMIT 1;`);

  const todayStr = getTodayIST();

  if (devUser.rows.length > 0) {
    await query(`
      INSERT INTO reports (user_id, department, report_date, status, data, blockers)
      VALUES ($1, 'DEVELOPMENT', $2, 'SUBMITTED', $3, $4)
      ON CONFLICT DO NOTHING;
    `, [
      devUser.rows[0].id,
      todayStr,
      JSON.stringify({
        tasksCompleted: 'Auth API integration, Database migration',
        tasksInProgress: 'Dashboard API',
        bugsFixed: 4,
        deployments: 1,
        blockers: 'Awaiting third-party payment gateway documentation',
      }),
      'Awaiting third-party payment gateway documentation'
    ]);
  }

  if (salesUser.rows.length > 0) {
    await query(`
      INSERT INTO reports (user_id, department, report_date, status, data, revenue_closed, leads)
      VALUES ($1, 'SALES', $2, 'SUBMITTED', $3, $4, $5)
      ON CONFLICT DO NOTHING;
    `, [
      salesUser.rows[0].id,
      todayStr,
      JSON.stringify({ newLeads: 12, followUps: 24, dealsClosed: 3, revenueClosed: 14500 }),
      14500.00,
      12
    ]);
  }

  if (marketingUser.rows.length > 0) {
    await query(`
      INSERT INTO reports (user_id, department, report_date, status, data, marketing_spend, leads)
      VALUES ($1, 'MARKETING', $2, 'APPROVED', $3, $4, $5)
      ON CONFLICT DO NOTHING;
    `, [
      marketingUser.rows[0].id,
      todayStr,
      JSON.stringify({ activeCampaigns: 2, spend: 1200, impressions: 45000, leadsGenerated: 35 }),
      1200.00,
      35
    ]);
  }

  // Seed sample notifications for the CEO
  const ceoUser = await query(`SELECT id FROM users WHERE role = 'CEO' LIMIT 1;`);
  if (ceoUser.rows.length > 0) {
    const ceoId = ceoUser.rows[0].id;
    const devRpt = await query(`SELECT id FROM reports WHERE department = 'DEVELOPMENT' LIMIT 1;`);
    const salesRpt = await query(`SELECT id FROM reports WHERE department = 'SALES' LIMIT 1;`);

    if (devRpt.rows.length > 0) {
      await query(`
        INSERT INTO notifications (user_id, type, title, body, report_id, is_read)
        VALUES ($1, 'REPORT_SUBMITTED', 'New Daily Report: DEVELOPMENT', 'Developer Head submitted the daily report for today.', $2, false)
        ON CONFLICT DO NOTHING;
      `, [ceoId, devRpt.rows[0].id]);
    }

    if (salesRpt.rows.length > 0) {
      await query(`
        INSERT INTO notifications (user_id, type, title, body, report_id, is_read)
        VALUES ($1, 'REPORT_SUBMITTED', 'New Daily Report: SALES', 'Sales Head submitted the daily report for today.', $2, false)
        ON CONFLICT DO NOTHING;
      `, [ceoId, salesRpt.rows[0].id]);
    }
  }

  console.log('[Migration] Sample reports and notifications created.');
}

runMigrations().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
