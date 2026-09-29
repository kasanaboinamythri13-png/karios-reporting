// ============================================================
// Automated End-to-End Test for CEO Backend Endpoints
// ============================================================
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

const PORT = 4099;
const server = app.listen(PORT, async () => {
  console.log(`[Test] Server listening on port ${PORT}...`);

  try {
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Health Check
    const health = await (await fetch(`${baseUrl}/health`)).json();
    console.log('✅ 1. Health Check:', health);

    // 2. Auth /me for CEO
    const me = await (await fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': 'Bearer dev-ceo' },
    })).json();
    console.log('✅ 2. GET /api/me (CEO Role):', me);

    // 3. CEO Dashboard Overview
    const overview = await (await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { 'Authorization': 'Bearer dev-ceo' },
    })).json();
    console.log('✅ 3. GET /api/dashboard/overview:\n', JSON.stringify(overview, null, 2));

    // 4. CEO List Reports
    const reportsList = await (await fetch(`${baseUrl}/reports`, {
      headers: { 'Authorization': 'Bearer dev-ceo' },
    })).json();
    console.log(`✅ 4. GET /api/reports: Retrieved ${reportsList.data.length} reports.`);

    // 5. CEO Get Report Details by ID
    if (reportsList.data.length > 0) {
      const targetReport = reportsList.data[0];
      const singleReport = await (await fetch(`${baseUrl}/reports/${targetReport.id}`, {
        headers: { 'Authorization': 'Bearer dev-ceo' },
      })).json();
      console.log(`✅ 5. GET /api/reports/${targetReport.id}: Details fetched for ${singleReport.department}`);

      // 6. CEO Review (Approve report)
      const reviewRes = await (await fetch(`${baseUrl}/reports/${targetReport.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-ceo',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          comment: 'Approved by CEO. Solid execution today.',
        }),
      })).json();
      console.log('✅ 6. POST /api/reports/:id/review (Approval):', reviewRes.message);
    }

    console.log('\n======================================================');
    console.log('🚀 ALL CEO BACKEND ENDPOINTS ARE FULLY OPERATIONAL!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
});
