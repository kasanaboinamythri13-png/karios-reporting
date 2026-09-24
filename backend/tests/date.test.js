import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayIST } from '../src/utils/date.js';

test('todayIST uses Asia/Kolkata, not UTC', () => {
  // 2026-01-01 19:00 UTC = 2026-01-02 00:30 IST
  assert.equal(todayIST(new Date('2026-01-01T19:00:00Z')), '2026-01-02');
  // 2026-01-01 18:29 UTC = 2026-01-01 23:59 IST
  assert.equal(todayIST(new Date('2026-01-01T18:29:00Z')), '2026-01-01');
});
