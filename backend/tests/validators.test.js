import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { isUuid, isDateString } from '../src/utils/validators.js';

test('isUuid', () => {
  assert.equal(isUuid('3f2b8c1e-9a4d-4e2f-8b1a-2c3d4e5f6a7b'), true);
  assert.equal(isUuid('123'), false);
  assert.equal(isUuid("1' OR '1'='1"), false);
});

test('isDateString', () => {
  assert.equal(isDateString('2026-09-24'), true);
  assert.equal(isDateString('24-09-2026'), false);
  assert.equal(isDateString('2026-13-45'), false);
});

test('GET /api/reports/form-schema without login → 401', async () => {
  const res = await request(app).get('/api/reports/form-schema');
  assert.equal(res.status, 401);
});

test('POST /api/attachments without login → 401', async () => {
  const res = await request(app).post('/api/attachments').send({});
  assert.equal(res.status, 401);
});
