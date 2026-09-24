// ============================================================
// Karios Backend — Database Migration & Seed Runner (PostgreSQL)
// ============================================================
import { query, pool } from '../config/db.js';

async function runMigrations() {
  console.log('[Migration] Starting Neon PostgreSQL database migration...');

  // Enable UUID extension
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // Drop old tables to ensure schema matches exact specification
  console.log('[Migration] Cleaning up existing tables...');
  await query(`DROP TABLE IF EXISTS notifications CASCADE;`);
  await query(`DROP TABLE IF EXISTS attachments CASCADE;`);
  await query(`DROP TABLE IF EXISTS reports CASCADE;`);
  await query(`DROP TABLE IF EXISTS users CASCADE;`);

  // 1. Users Table
  console.log('[Migration] Creating users table...');
  await query(`
    CREATE TABLE users (
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
    CREATE TABLE reports (
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
    CREATE TABLE attachments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Notifications Table
  console.log('[Migration] Creating notifications table...');
  await query(`
    CREATE TABLE notifications (
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

  // Indexes (using IF NOT EXISTS)
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_dept ON reports(department);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`);

  console.log('[Migration] All tables and indexes created successfully!');

  // Seed default 5 user accounts
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

  // Seed sample reports for testing CEO overview and review flow
  console.log('[Migration] Seeding sample reports for development & testing...');
  const devUser = await query(`SELECT id FROM users WHERE role = 'DEVELOPER_HEAD' LIMIT 1;`);
  const salesUser = await query(`SELECT id FROM users WHERE role = 'SALES_HEAD' LIMIT 1;`);
  const marketingUser = await query(`SELECT id FROM users WHERE role = 'MARKETING_HEAD' LIMIT 1;`);

  const todayStr = new Date().toISOString().split('T')[0];

  if (devUser.rows.length > 0) {
    await query(`
      INSERT INTO reports (user_id, department, report_date, status, data, blockers)
      VALUES ($1, 'DEVELOPMENT', $2, 'SUBMITTED', $3, $4)
      ON CONFLICT DO NOTHING;
    `, [
      devUser.rows[0].id,
      todayStr,
      JSON.stringify({ tasksCompleted: ['Auth API integration', 'Database migration'], inProgress: ['Dashboard API'] }),
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
      JSON.stringify({ closedDeals: 3, callsCompleted: 24 }),
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
      JSON.stringify({ activeCampaigns: ['Google Ads Q3', 'LinkedIn Inbound'], impressions: 45000 }),
      1200.00,
      35
    ]);
  }

  console.log('[Migration] All sample reports and accounts created in Neon database!');
  await pool.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
