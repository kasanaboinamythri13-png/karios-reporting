// ============================================================
// End-to-End Test for Department Heads endpoints (real database)
//   npm run test:heads
// Needs DATABASE_URL + ALLOW_DEV_TOKENS=true in .env and sample data (npm run db:reset).
// Uses the Finance Head; resets Finance Head's data first, so it can be run again and again.
// ============================================================
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { query, pool } from '../src/config/db.js';
import { todayIST } from '../src/utils/date.js';
import { sendDailyReminders } from '../src/jobs/dailyReminder.js';

const as = (who) => ({ Authorization: `Bearer dev-${who}` });
const api = request(app);
let passed = 0;

async function step(name, fn) {
  await fn();
  passed++;
  console.log(`✅ ${passed}. ${name}`);
}

const finance = (await query(`SELECT id FROM users WHERE role = 'FINANCE_HEAD' LIMIT 1;`)).rows[0];
await query(`DELETE FROM reports WHERE user_id = $1;`, [finance.id]);
await query(`DELETE FROM notifications WHERE user_id = $1 OR type = 'REPORT_SUBMITTED';`, [finance.id]);
const today = todayIST();
let reportId;

try {
  await step('GET /me → Finance Head (no personal name)', async () => {
    const res = await api.get('/api/me').set(as('finance'));
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Finance Head');
    assert.equal(res.body.department, 'FINANCE');
  });

  await step('Daily reminder goes to Finance Head only (others submitted), no duplicates', async () => {
    assert.equal(await sendDailyReminders(), 1);
    assert.equal(await sendDailyReminders(), 0);
  });

  await step('GET /reports/form-schema → Finance fields', async () => {
    const res = await api.get('/api/reports/form-schema').set(as('finance'));
    assert.equal(res.status, 200);
    assert.equal(res.body.department, 'FINANCE');
    assert.ok(res.body.fields.some((f) => f.key === 'collections' && f.required));
  });

  await step('GET /reports/today → null before submitting', async () => {
    const res = await api.get('/api/reports/today').set(as('finance'));
    assert.equal(res.status, 200);
    assert.equal(res.body.date, today);
    assert.equal(res.body.report, null);
  });

  await step('POST /reports with invalid data → 400', async () => {
    const res = await api.post('/api/reports').set(as('finance')).send({ data: { collections: -5, department: 'SALES' } });
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /cannot be negative/);
    assert.match(res.body.error.message, /Unknown field/);
  });

  await step('POST /reports with an attachment that does not exist → 400 (nothing saved)', async () => {
    const res = await api.post('/api/reports').set(as('finance'))
      .send({ data: { collections: 100 }, attachmentIds: ['3f2b8c1e-9a4d-4e2f-8b1a-2c3d4e5f6a7b'] });
    assert.equal(res.status, 400);
    const check = await api.get('/api/reports/today').set(as('finance'));
    assert.equal(check.body.report, null, 'report must not be half-saved');
  });

  await step('POST /reports → 201, department + date set by server, $ columns filled', async () => {
    const res = await api.post('/api/reports').set(as('finance'))
      .send({ data: { collections: 5400.75, expenses: 1200, blockers: 'Two invoices overdue' } });
    assert.equal(res.status, 201);
    reportId = res.body.report.id;
    assert.equal(res.body.report.department, 'FINANCE');
    assert.equal(res.body.report.report_date, today);
    assert.equal(res.body.report.status, 'SUBMITTED');
    assert.equal(Number(res.body.report.collections), 5400.75);
    assert.equal(res.body.report.blockers, 'Two invoices overdue');
  });

  await step('CEO got a "Finance Head submitted" notification', async () => {
    const res = await api.get('/api/notifications').set(as('ceo'));
    assert.ok(res.body.notifications.some((n) => n.type === 'REPORT_SUBMITTED' && n.report_id === reportId));
  });

  await step('POST /reports again the same day → 409', async () => {
    const res = await api.post('/api/reports').set(as('finance')).send({ data: { collections: 1 } });
    assert.equal(res.status, 409);
  });

  await step('GET /reports/today → report with canEdit = true', async () => {
    const res = await api.get('/api/reports/today').set(as('finance'));
    assert.equal(res.body.report.id, reportId);
    assert.equal(res.body.canEdit, true);
  });

  await step('PATCH /reports/:id → 200, data and $ columns updated', async () => {
    const res = await api.patch(`/api/reports/${reportId}`).set(as('finance')).send({ data: { collections: 6000 } });
    assert.equal(res.status, 200);
    assert.equal(Number(res.body.report.collections), 6000);
    assert.equal(res.body.report.blockers, null);
  });

  await step('GET /reports → only Finance Head\'s own reports', async () => {
    const res = await api.get('/api/reports').set(as('finance'));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.ok(res.body.data.every((r) => r.user_id === finance.id));
  });

  await step('Another head\'s report: view → 404, edit → 404', async () => {
    const sales = await api.get('/api/reports/today').set(as('sales'));
    const salesId = sales.body.report.id;
    assert.equal((await api.get(`/api/reports/${salesId}`).set(as('finance'))).status, 404);
    assert.equal((await api.patch(`/api/reports/${salesId}`).set(as('finance')).send({ data: { collections: 1 } })).status, 404);
  });

  await step('Edit an APPROVED report → 403', async () => {
    const mkt = await api.get('/api/reports/today').set(as('marketing'));
    assert.equal(mkt.body.report.status, 'APPROVED');
    assert.equal(mkt.body.canEdit, false);
    const res = await api.patch(`/api/reports/${mkt.body.report.id}`).set(as('marketing')).send({ data: { activeCampaigns: 3 } });
    assert.equal(res.status, 403);
  });

  await step('Edit yesterday\'s report → 403', async () => {
    const old = await query(
      `INSERT INTO reports (user_id, department, report_date, data)
       VALUES ($1, 'FINANCE', ($2::date - 1), '{"collections": 10}') RETURNING id;`,
      [finance.id, today],
    );
    const res = await api.patch(`/api/reports/${old.rows[0].id}`).set(as('finance')).send({ data: { collections: 20 } });
    assert.equal(res.status, 403);
    assert.match(res.body.error.message, /same-day/);
  });

  await step('CEO rejects → head notified → head edits → back to SUBMITTED, review cleared, CEO told', async () => {
    const review = await api.post(`/api/reports/${reportId}/review`).set(as('ceo')).send({ status: 'REJECTED', comment: 'Add expenses' });
    assert.equal(review.status, 200);

    const notes = await api.get('/api/notifications').set(as('finance'));
    assert.ok(notes.body.notifications.some((n) => n.type === 'REPORT_REVIEW' && n.report_id === reportId));

    const detail = await api.get(`/api/reports/${reportId}`).set(as('finance'));
    assert.equal(detail.body.report.status, 'REJECTED');
    assert.equal(detail.body.report.review_comment, 'Add expenses');

    const edit = await api.patch(`/api/reports/${reportId}`).set(as('finance')).send({ data: { collections: 6000, expenses: 800 } });
    assert.equal(edit.status, 200);
    assert.equal(edit.body.report.status, 'SUBMITTED');
    assert.equal(edit.body.report.review_comment, null);

    const ceoNotes = await api.get('/api/notifications').set(as('ceo'));
    assert.ok(ceoNotes.body.notifications.some((n) => n.title === 'Finance Head updated a report'));
  });

  await step('Notifications: mark all read → unreadCount 0', async () => {
    const res = await api.patch('/api/notifications/read-all').set(as('finance'));
    assert.equal(res.status, 200);
    const after = await api.get('/api/notifications').set(as('finance'));
    assert.equal(after.body.unreadCount, 0);
  });

  await step('Bad ids and filters → 404 / 400 (never 500)', async () => {
    assert.equal((await api.get('/api/reports/not-a-uuid').set(as('finance'))).status, 404);
    assert.equal((await api.patch('/api/notifications/xyz/read').set(as('finance'))).status, 404);
    assert.equal((await api.get('/api/reports?status=DONE').set(as('finance'))).status, 400);
    assert.equal((await api.get('/api/reports?from=yesterday').set(as('finance'))).status, 400);
  });

  await step('CEO cannot use head-only endpoints → 403', async () => {
    assert.equal((await api.get('/api/reports/today').set(as('ceo'))).status, 403);
    assert.equal((await api.post('/api/reports').set(as('ceo')).send({ data: {} })).status, 403);
  });

  await step('Attachment: upload → owner and CEO can open it, other heads get 404, fake PDF refused', async () => {
    const pdf = Buffer.from('%PDF-1.4\n% test invoice\n');
    const up = await api.post('/api/attachments').set(as('finance'))
      .set('Content-Type', 'application/pdf').set('X-File-Name', encodeURIComponent('invoice q3.pdf'))
      .send(pdf);
    assert.equal(up.status, 201);
    assert.equal(up.body.fileName, 'invoice_q3.pdf');

    const own = await api.get(`/api/attachments/${up.body.attachmentId}/file`).set(as('finance'));
    assert.equal(own.status, 200);
    assert.equal(own.headers['content-type'], 'application/pdf');
    assert.equal((await api.get(`/api/attachments/${up.body.attachmentId}/file`).set(as('ceo'))).status, 200);
    assert.equal((await api.get(`/api/attachments/${up.body.attachmentId}/file`).set(as('sales'))).status, 404);

    const fake = await api.post('/api/attachments').set(as('finance'))
      .set('Content-Type', 'application/pdf').set('X-File-Name', 'virus.pdf').send(Buffer.from('MZ not a pdf'));
    assert.equal(fake.status, 400);

    await query('DELETE FROM attachments WHERE id = $1;', [up.body.attachmentId]);
  });

  console.log(`\n🚀 All ${passed} Department Heads checks passed against the real database.\n`);
} catch (err) {
  console.error(`\n❌ Failed after ${passed} passing checks:\n`, err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
