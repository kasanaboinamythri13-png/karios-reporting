import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReportData, extractSummaryColumns } from '../src/modules/reports/reports.validation.js';

const fails = (dept, data, messagePart) =>
  assert.throws(() => validateReportData(dept, data), (err) => {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, messagePart);
    return true;
  });

test('valid Sales report passes and text is trimmed', () => {
  const data = validateReportData('SALES', { newLeads: 5, revenueClosed: 1250.5, blockers: '  none  ' });
  assert.deepEqual(data, { newLeads: 5, revenueClosed: 1250.5, blockers: 'none' });
});

test('missing required field → 400 "is required"', () => {
  fails('SALES', {}, /New leads is required/);
  fails('DEVELOPMENT', { tasksCompleted: '   ' }, /Tasks completed is required/);
});

test('wrong types → 400', () => {
  fails('SALES', { newLeads: '5' }, /New leads must be a number/);
  fails('SALES', { newLeads: 1.5 }, /whole number/);
  fails('DEVELOPMENT', { tasksCompleted: 42 }, /must be text/);
});

test('negative numbers and more than 2 decimals → 400', () => {
  fails('SALES', { newLeads: -1 }, /cannot be negative/);
  fails('FINANCE', { collections: 10.123 }, /at most 2 decimals/);
});

test('unknown fields are rejected', () => {
  fails('SALES', { newLeads: 1, department: 'FINANCE' }, /Unknown field\(s\): department/);
});

test('text longer than 2000 characters → 400', () => {
  fails('DEVELOPMENT', { tasksCompleted: 'x'.repeat(2001) }, /too long/);
});

test('department without a form (CEO / EXECUTIVE) → 400', () => {
  fails('EXECUTIVE', {}, /No report form/);
});

test('summary columns are copied for the CEO dashboard', () => {
  assert.deepEqual(
    extractSummaryColumns('MARKETING', { activeCampaigns: 2, spend: 300, leadsGenerated: 7, blockers: 'Budget' }),
    { blockers: 'Budget', revenue_closed: 0, marketing_spend: 300, leads: 7, collections: 0 },
  );
  assert.deepEqual(
    extractSummaryColumns('FINANCE', { collections: 99.5 }),
    { blockers: null, revenue_closed: 0, marketing_spend: 0, leads: 0, collections: 99.5 },
  );
});
