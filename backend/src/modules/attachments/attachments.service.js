// Report attachments (images + PDF), stored in the database (attachments.content).
// Owner: Member 2
//
// How an upload works:
//   1. Head uploads the file → POST /api/attachments (raw file body, name in the X-File-Name header)
//      We check type, size and the file's real content, then save it (not linked to a report yet).
//   2. Head submits / edits the report with attachmentIds → linkAttachments() connects them.
// Files are only ever sent to the head who uploaded them, or the CEO — never public.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { BadRequest, NotFound } from '../../utils/errors.js';
import { isUuid } from '../../utils/validators.js';

export const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — files live in the database, and Vercel refuses requests over 4.5 MB
export const MAX_FILES_PER_REPORT = 5;

// Uploads never attached to a report (form abandoned, file removed) are deleted after this long.
const UNLINKED_KEEP_HOURS = 24;

// First bytes of each allowed type, so a renamed .exe can't pass as a .pdf.
const SIGNATURES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1, 'fileName is required').max(200, 'fileName is too long'),
  mimeType: z.enum(Object.keys(ALLOWED_TYPES), { error: 'Only JPG, PNG and PDF files are allowed' }),
  sizeBytes: z
    .number({ error: 'sizeBytes must be a number' })
    .int()
    .min(1, 'File is empty')
    .max(MAX_FILE_BYTES, 'File is larger than 4 MB'),
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

/** True if the file's first bytes match its declared type. */
export function contentMatchesType(buffer, mimeType) {
  const signature = SIGNATURES[mimeType];
  return Boolean(signature) && buffer.length >= signature.length && signature.every((byte, i) => buffer[i] === byte);
}

/**
 * Saves an uploaded file. `content` is the raw file (Buffer), `rawFileName` comes from the X-File-Name header.
 * Returns { attachmentId, fileName, mimeType, sizeBytes }.
 */
export async function saveUpload(user, { rawFileName, mimeType, content }) {
  let decodedName = rawFileName ?? '';
  try {
    decodedName = decodeURIComponent(decodedName);
  } catch {
    // not URI-encoded — use as is
  }

  const buffer = Buffer.isBuffer(content) ? content : Buffer.alloc(0);
  const { fileName, sizeBytes } = validateUploadRequest({
    fileName: decodedName,
    mimeType,
    sizeBytes: buffer.length,
  });
  if (!contentMatchesType(buffer, mimeType)) {
    throw BadRequest(`The file is not a real ${ALLOWED_TYPES[mimeType][0].slice(1).toUpperCase()}`);
  }

  // Housekeeping: drop old uploads that never made it onto a report.
  await query(
    `DELETE FROM attachments
     WHERE report_id IS NULL AND created_at < NOW() - make_interval(hours => $1);`,
    [UNLINKED_KEEP_HOURS],
  );

  const inserted = await query(
    `INSERT INTO attachments (uploaded_by, file_name, storage_path, mime_type, size_bytes, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id;`,
    [user.id, fileName, `db:${randomUUID()}`, mimeType, sizeBytes, buffer],
  );

  return { attachmentId: inserted.rows[0].id, fileName, mimeType, sizeBytes };
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
      `SELECT id
       FROM attachments
       WHERE id = ANY($1::uuid[])
         AND uploaded_by = $2
         AND (report_id IS NULL OR report_id = $3);`,
      [ids, userId, reportId],
    );
    if (owned.rows.length !== ids.length) {
      throw BadRequest('One or more attachments are invalid, expired or belong to another report. Please upload them again.');
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

/**
 * Returns { fileName, mimeType, content } for viewing/downloading a file.
 * Heads: only files on their own reports (or their own not-yet-linked uploads). The CEO: every file.
 * Anyone else gets 404, so they can't even tell the file exists.
 */
export async function getFile(user, attachmentId) {
  if (!isUuid(attachmentId)) throw NotFound('Attachment not found');

  const result = await query(
    `SELECT a.file_name, a.mime_type, a.content, a.uploaded_by, r.user_id AS report_owner
     FROM attachments a
     LEFT JOIN reports r ON r.id = a.report_id
     WHERE a.id = $1;`,
    [attachmentId],
  );
  const row = result.rows[0];
  const owner = row?.report_owner ?? row?.uploaded_by;

  if (!row || (user.role !== 'CEO' && owner !== user.id)) {
    throw NotFound('Attachment not found');
  }
  if (!row.content) {
    // Uploaded under the old Firebase Storage setup — the file isn't in the database.
    throw NotFound('This file is no longer available. Please upload it again.');
  }

  return { fileName: row.file_name, mimeType: row.mime_type, content: row.content };
}
