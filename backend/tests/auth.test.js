import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { requireRole } from '../src/middleware/requireRole.js';

// Runs requireRole(...) for a fake user and returns the error it produced (or undefined if allowed)
function roleCheck(allowed, role) {
  let error;
  requireRole(...allowed)({ user: { role } }, {}, (err) => { error = err; });
  return error;
}

test('dev tokens are refused unless ALLOW_DEV_TOKENS=true', async () => {
  const original = env.allowDevTokens;
  env.allowDevTokens = false;
  try {
    const res = await request(app).get('/api/reports/today').set('Authorization', 'Bearer dev-ceo');
    assert.equal(res.status, 401);
  } finally {
    env.allowDevTokens = original;
  }
});

test('a real (non-test) token that happens to contain "ceo" is not treated as the CEO', async () => {
  const res = await request(app).get('/api/reports/today').set('Authorization', 'Bearer eyJceo.fake.token');
  assert.equal(res.status, 401);
});

test('cron endpoints refuse requests without the CRON_SECRET', async () => {
  const original = env.cronSecret;
  env.cronSecret = 'test-secret';
  try {
    assert.equal((await request(app).get('/api/cron/daily-reminder')).status, 401);
    const wrong = await request(app).get('/api/cron/daily-reminder').set('Authorization', 'Bearer nope');
    assert.equal(wrong.status, 401);
  } finally {
    env.cronSecret = original;
  }
});

test('all four head roles pass requireRole("HEAD")', () => {
  for (const role of ['DEVELOPER_HEAD', 'SALES_HEAD', 'MARKETING_HEAD', 'FINANCE_HEAD']) {
    assert.equal(roleCheck(['HEAD'], role), undefined, role);
  }
});

test('CEO is blocked from head-only endpoints (403)', () => {
  assert.equal(roleCheck(['HEAD'], 'CEO').statusCode, 403);
});
