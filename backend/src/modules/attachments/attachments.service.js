// Report attachments (images + PDF) in a PRIVATE Firebase Storage bucket.
// Owner: Member 2
//
// How an upload works:
//   1. Head asks for an upload link   → POST /api/attachments/upload-url
//      We check type + size, save a row (not linked to a report yet) and return a signed link.
//   2. Browser uploads the file straight to that link (the file never passes through our server).
//   3. Head submits / edits the report with attachmentIds → linkAttachments() connects them.
// Files are only ever handed out as short-lived signed links, never as public URLs.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { bucket } from '../../config/firebase.js';
import { AppError, BadRequest, NotFound } from '../../utils/errors.js';
import { isUuid } from '../../utils/validators.js';

export const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_REPORT = 5;

const UPLOAD_LINK_MINUTES = 10;
const DOWNLOAD_LINK_MINUTES = 5;

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1, 'fileName is required').max(200, 'fileName is too long'),
  mimeType: z.enum(Object.keys(ALLOWED_TYPES), { error: 'Only JPG, PNG and PDF files are allowed' }),
  sizeBytes: z
    .number({ error: 'sizeBytes must be a number' })
    .int()
    .min(1, 'File is empty')
    .max(MAX_FILE_BYTES, 'File is larger than 10 MB'),
});

/**
 * Checks an upload request and returns { fileName, mimeType, sizeBytes } with a safe file name.
 * Throws 400 if the type, extension or size is not allowed.
 */
export function validateUploadRequest(body) {
  const result = uploadRequestSchema.safeParse(body ?? {});
  if (!result.success) {
    throw BadRequest(result.error.issues.map((i) => i.message).join('; '));
  }

  const { fileName, mimeType, sizeBytes } = result.data;
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_TYPES[mimeType].includes(extension)) {
    throw BadRequest(`File extension does not match its type (${mimeType})`);
  }

  // Keep letters, numbers, dot, dash and underscore only — no paths or odd characters.
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(-100);
  return { fileName: safeName, mimeType, sizeBytes };
}

function requireBucket() {
  if (!bucket) {
    throw new AppError(503, 'File storage is not configured on the server', 'STORAGE_UNAVAILABLE');
  }
  return bucket;
}

/**
 * Step 1 of an upload: returns a signed link the browser can PUT the file to.
 */
export async function createUploadUrl(user, body) {
  const { fileName, mimeType, sizeBytes } = validateUploadRequest(body);
  const storage = requireBucket();

  const storagePath = `reports/${user.id}/${randomUUID()}-${fileName}`;

  const inserted = await query(
    `INSERT INTO attachments (uploaded_by, file_name, storage_path, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id;`,
    [user.id, fileName, storagePath, mimeType, sizeBytes],
  );

  const expires = Date.now() + UPLOAD_LINK_MINUTES * 60 * 1000;
  const [uploadUrl] = await storage.file(storagePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires,
    contentType: mimeType,
  });

  return {
    attachmentId: inserted.rows[0].id,
    uploadUrl,
    method: 'PUT',
    headers: { 'Content-Type': mimeType }, // the browser must send exactly this header
    expiresAt: new Date(expires).toISOString(),
  };
}

/**
 * Connects uploaded files to a report. `attachmentIds` is the COMPLETE list the report should have:
 * files left out of the list are detached from the report.
 * Runs inside the report's transaction (`client`).
 */
export async function linkAttachments(client, { reportId, userId, attachmentIds }) {
  const ids = [...new Set(attachmentIds)];

  if (ids.some((id) => !isUuid(id))) {
    throw BadRequest('attachmentIds must be a list of attachment ids');
  }
  if (ids.length > MAX_FILES_PER_REPORT) {
    throw BadRequest(`A report can have at most ${MAX_FILES_PER_REPORT} attachments`);
  }

  if (ids.length > 0) {
    // Only files this head uploaded, that are free or already on this report.
    const owned = await client.query(
      `SELECT id, storage_path, mime_type, report_id
       FROM attachments
       WHERE id = ANY($1::uuid[])
         AND uploaded_by = $2
         AND (report_id IS NULL OR report_id = $3);`,
      [ids, userId, reportId],
    );
    if (owned.rows.length !== ids.length) {
      throw BadRequest('One or more attachments are invalid or belong to another report');
    }

    // New files: make sure they were really uploaded and match what was promised.
    for (const row of owned.rows.filter((r) => r.report_id === null)) {
      await verifyStoredFile(row);
    }
  }

  await client.query(
    `UPDATE attachments SET report_id = NULL
     WHERE report_id = $1 AND NOT (id = ANY($2::uuid[]));`,
    [reportId, ids],
  );
  await client.query(
    `UPDATE attachments SET report_id = $1 WHERE id = ANY($2::uuid[]);`,
    [reportId, ids],
  );
}

async function verifyStoredFile({ storage_path: storagePath, mime_type: mimeType }) {
  if (!bucket) return; // local development without Firebase Storage

  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw BadRequest('An attachment was not uploaded. Please upload it again.');
  }

  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) > MAX_FILE_BYTES || metadata.contentType !== mimeType) {
    await file.delete({ ignoreNotFound: true });
    throw BadRequest('An uploaded file is larger than 10 MB or not the promised type');
  }
}

/**
 * Returns a 5-minute link to view/download a file.
 * Heads: only files on their own reports (or their own not-yet-linked uploads).
 * Anyone else gets 404, so they can't even tell the file exists.
 */
export async function createDownloadUrl(user, attachmentId) {
  if (!isUuid(attachmentId)) throw NotFound('Attachment not found');

  const result = await query(
    `SELECT a.storage_path, a.file_name, a.uploaded_by, r.user_id AS report_owner
     FROM attachments a
     LEFT JOIN reports r ON r.id = a.report_id
     WHERE a.id = $1;`,
    [attachmentId],
  );
  const row = result.rows[0];
  const owner = row?.report_owner ?? row?.uploaded_by;

  // Member 3: add CEO access here (the CEO may open every report's files).
  if (!row || owner !== user.id) {
    throw NotFound('Attachment not found');
  }

  const expires = Date.now() + DOWNLOAD_LINK_MINUTES * 60 * 1000;
  const [url] = await requireBucket().file(row.storage_path).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires,
    responseDisposition: `inline; filename="${row.file_name}"`,
  });

  return { url, fileName: row.file_name, expiresAt: new Date(expires).toISOString() };
}
