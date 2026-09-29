import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUploadRequest, MAX_FILE_BYTES } from '../src/modules/attachments/attachments.service.js';

const rejects = (body, messagePart) =>
  assert.throws(() => validateUploadRequest(body), (err) => {
    assert.equal(err.statusCode, 400);
    assert.match(err.message, messagePart);
    return true;
  });

test('JPG, PNG and PDF are accepted', () => {
  assert.equal(validateUploadRequest({ fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 100 }).mimeType, 'image/jpeg');
  assert.equal(validateUploadRequest({ fileName: 'a.PNG', mimeType: 'image/png', sizeBytes: 100 }).mimeType, 'image/png');
  assert.equal(validateUploadRequest({ fileName: 'q3.pdf', mimeType: 'application/pdf', sizeBytes: MAX_FILE_BYTES }).sizeBytes, MAX_FILE_BYTES);
});

test('other file types are rejected', () => {
  rejects({ fileName: 'virus.exe', mimeType: 'application/x-msdownload', sizeBytes: 100 }, /Only JPG, PNG and PDF/);
});

test('extension must match the type', () => {
  rejects({ fileName: 'virus.exe', mimeType: 'application/pdf', sizeBytes: 100 }, /does not match/);
});

test('files over 10 MB or empty are rejected', () => {
  rejects({ fileName: 'big.pdf', mimeType: 'application/pdf', sizeBytes: MAX_FILE_BYTES + 1 }, /larger than 10 MB/);
  rejects({ fileName: 'empty.pdf', mimeType: 'application/pdf', sizeBytes: 0 }, /empty/);
});

test('file names are made safe (no folders or odd characters)', () => {
  const { fileName } = validateUploadRequest({ fileName: '../../secret plan (v2).pdf', mimeType: 'application/pdf', sizeBytes: 10 });
  assert.equal(fileName, '.._.._secret_plan_v2_.pdf');
  assert.ok(!fileName.includes('/'));
});
