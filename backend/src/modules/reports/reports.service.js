// Business rules for reports (one per day, same-day edit, review status changes).
// Owner: Member 1 (submit / edit / list), Member 3 (review)
//
// Always use todayIST() from utils/date.js — never new Date() directly — to decide "today".

import { query, getClient } from '../../config/db.js';
import { getTodayIST } from '../../utils/date.js';
import { BadRequest, NotFound, Forbidden, Conflict } from '../../utils/errors.js';
import { isUuid, isDateString } from '../../utils/validators.js';
import { validateReportData, extractSummaryColumns } from './reports.validation.js';
import { linkAttachments } from '../attachments/attachments.service.js';
import { notifyCeosAboutReport } from '../notifications/notifications.service.js';

const STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED'];
const MAX_PAGE_SIZE = 100;

/**
 * Runs `work(client)` inside one database transaction:
 * either every change is saved, or (on any error) none of them are.
 */
async function inTransaction(work) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List reports with role-based isolation and filters
 */
export async function listReports(user, filters = {}) {
  const { department, status, from, to } = filters;
  // Keep page/limit sensible: page >= 1, 1 <= limit <= 100 (bad values fall back to defaults)
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(filters.limit) || 20));
  const offset = (page - 1) * limit;

  // Reject bad filters with 400 instead of letting PostgreSQL fail with a 500
  if (status && !STATUSES.includes(String(status).toUpperCase())) {
    throw BadRequest(`status must be one of ${STATUSES.join(', ')}`);
  }
  if ((from && !isDateString(from)) || (to && !isDateString(to))) {
    throw BadRequest('from / to must be dates in YYYY-MM-DD format');
  }

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  // Role isolation: Non-CEO users can only view their own department reports
  if (user.role !== 'CEO') {
    conditions.push(`r.user_id = $${paramIdx++}`);
    params.push(user.id);
  } else if (department) {
    conditions.push(`r.department = $${paramIdx++}`);
    params.push(department.toUpperCase());
  }

  if (status) {
    conditions.push(`r.status = $${paramIdx++}`);
    params.push(status.toUpperCase());
  }

  if (from) {
    conditions.push(`r.report_date >= $${paramIdx++}::date`);
    params.push(from);
  }

  if (to) {
    conditions.push(`r.report_date <= $${paramIdx++}::date`);
    params.push(to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM reports r ${whereClause};`;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0]?.total || '0');

  // Fetch paginated reports
  const dataSql = `
    SELECT r.id, r.user_id, r.department, r.report_date, r.status,
           r.blockers, r.revenue_closed, r.marketing_spend, r.leads, r.collections,
           r.reviewed_by, r.reviewed_at, r.review_comment, r.created_at, r.updated_at,
           u.title AS head_title,
           rev.title AS reviewer_title,
           COALESCE(
             (SELECT json_agg(json_build_object(
                'id', a.id, 'fileName', a.file_name, 'mimeType', a.mime_type, 'sizeBytes', a.size_bytes
              )) FROM attachments a WHERE a.report_id = r.id), '[]'::json
           ) AS attachments
    FROM reports r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN users rev ON r.reviewed_by = rev.id
    ${whereClause}
    ORDER BY r.report_date DESC, r.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;

  params.push(limit, offset);
  const dataRes = await query(dataSql, params);

  return {
    data: dataRes.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Get detailed report by ID
 */
export async function getReportById(reportId, user) {
  if (!isUuid(reportId)) {
    throw NotFound('Report not found');
  }

  const sql = `
    SELECT r.id, r.user_id, r.department, r.report_date, r.status,
           r.data, r.blockers, r.revenue_closed, r.marketing_spend, r.leads, r.collections,
           r.reviewed_by, r.reviewed_at, r.review_comment, r.created_at, r.updated_at,
           u.title AS head_title, u.email AS head_email,
           rev.title AS reviewer_title,
           COALESCE(
             (SELECT json_agg(json_build_object(
                'id', a.id, 'fileName', a.file_name, 'mimeType', a.mime_type, 'sizeBytes', a.size_bytes, 'storagePath', a.storage_path
              )) FROM attachments a WHERE a.report_id = r.id), '[]'::json
           ) AS attachments
    FROM reports r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN users rev ON r.reviewed_by = rev.id
    WHERE r.id = $1::uuid;
  `;

  const res = await query(sql, [reportId]);
  if (res.rows.length === 0) {
    throw NotFound(`Report not found with ID ${reportId}`);
  }

  const report = res.rows[0];

  // RBAC check: non-CEO can only view own reports.
  // 404 (not 403) so a head can't even find out that another head's report id exists.
  if (user.role !== 'CEO' && report.user_id !== user.id) {
    throw NotFound('Report not found');
  }

  return report;
}

/**
 * Today's (IST) report for the logged-in head, or null if not submitted yet.
 * canEdit tells the website whether to show the "Edit" button.
 */
export async function getTodayReport(user) {
  const today = getTodayIST();

  const found = await query('SELECT id FROM reports WHERE user_id = $1 AND report_date = $2::date;', [user.id, today]);
  if (found.rows.length === 0) {
    return { date: today, report: null, canEdit: false };
  }

  const report = await getReportById(found.rows[0].id, user);
  return { date: today, report, canEdit: report.status !== 'APPROVED' };
}

/**
 * Submit today's daily report (Department Head)
 * Body: { data: { ...department form fields }, attachmentIds?: [uuid, ...] }
 *
 * - Department always comes from the logged-in user, never from the request.
 * - Date is always today in IST, decided by the server.
 * - One report per head per day: the database's UNIQUE (user_id, report_date) is the final guard,
 *   so even two clicks at the same moment can't create two reports.
 */
export async function submitDailyReport(user, payload) {
  const reportDate = getTodayIST();
  const department = user.department;

  const data = validateReportData(department, payload?.data);
  const columns = extractSummaryColumns(department, data);

  const reportId = await inTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO reports (user_id, department, report_date, status, data,
                            blockers, revenue_closed, marketing_spend, leads, collections)
       VALUES ($1, $2, $3::date, 'SUBMITTED', $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, report_date) DO NOTHING
       RETURNING id;`,
      [
        user.id,
        department,
        reportDate,
        JSON.stringify(data),
        columns.blockers,
        columns.revenue_closed,
        columns.marketing_spend,
        columns.leads,
        columns.collections,
      ],
    );

    if (inserted.rows.length === 0) {
      throw Conflict(`Daily report for ${reportDate} has already been submitted.`);
    }
    const id = inserted.rows[0].id;

    if (Array.isArray(payload?.attachmentIds)) {
      await linkAttachments(client, { reportId: id, userId: user.id, attachmentIds: payload.attachmentIds });
    }

    await notifyCeosAboutReport(client, { headTitle: user.title, reportId: id, reportDate });
    return id;
  });

  return getReportById(reportId, user);
}

/**
 * Update today's report (Same-day edit only, not if approved)
 * Body: { data: { ...complete form }, attachmentIds?: [uuid, ...] (complete list) }
 *
 * Rules, checked in this order:
 *   not your report / doesn't exist → 404
 *   not from today (IST)            → 403
 *   already APPROVED                → 403
 *   invalid form data               → 400
 * A REJECTED report goes back to SUBMITTED (review cleared) and the CEO is told it was corrected.
 */
export async function updateDailyReport(reportId, user, payload) {
  if (!isUuid(reportId)) {
    throw NotFound('Report not found');
  }

  const today = getTodayIST();
  const data = validateReportData(user.department, payload?.data);
  const columns = extractSummaryColumns(user.department, data);

  await inTransaction(async (client) => {
    // FOR UPDATE locks the row so a CEO review can't happen halfway through this edit
    const current = await client.query(
      'SELECT id, report_date, status FROM reports WHERE id = $1 AND user_id = $2 FOR UPDATE;',
      [reportId, user.id],
    );
    const report = current.rows[0];

    if (!report) {
      throw NotFound('Report not found');
    }
    if (report.report_date !== today) {
      throw Forbidden('Past reports cannot be modified. Only same-day edits are allowed.');
    }
    if (report.status === 'APPROVED') {
      throw Forbidden('Approved reports cannot be edited.');
    }

    await client.query(
      `UPDATE reports
       SET data = $1,
           blockers = $2,
           revenue_closed = $3,
           marketing_spend = $4,
           leads = $5,
           collections = $6,
           status = 'SUBMITTED',
           reviewed_by = NULL,
           reviewed_at = NULL,
           review_comment = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7;`,
      [
        JSON.stringify(data),
        columns.blockers,
        columns.revenue_closed,
        columns.marketing_spend,
        columns.leads,
        columns.collections,
        reportId,
      ],
    );

    if (Array.isArray(payload?.attachmentIds)) {
      await linkAttachments(client, { reportId, userId: user.id, attachmentIds: payload.attachmentIds });
    }

    if (report.status === 'REJECTED') {
      await notifyCeosAboutReport(client, { headTitle: user.title, reportId, reportDate: today, resubmitted: true });
    }
  });

  return getReportById(reportId, user);
}

/**
 * Review report: CEO Approve / Reject with optional or mandatory comment
 */
export async function reviewReport(reportId, ceoUser, decision) {
  const { status, comment } = decision;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw BadRequest("Status must be either 'APPROVED' or 'REJECTED'");
  }

  if (status === 'REJECTED' && (!comment || comment.trim().length === 0)) {
    throw BadRequest('A comment is required when rejecting a report');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const checkSql = 'SELECT * FROM reports WHERE id = $1::uuid FOR UPDATE;';
    const checkRes = await client.query(checkSql, [reportId]);

    if (checkRes.rows.length === 0) {
      throw NotFound('Report not found');
    }

    const report = checkRes.rows[0];

    // Update report review details
    const updateSql = `
      UPDATE reports
      SET status = $1,
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          review_comment = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4::uuid
      RETURNING *;
    `;

    const updatedRes = await client.query(updateSql, [status, ceoUser.id, comment || null, reportId]);

    // Create In-App Notification for the department head
    const notifTitle = `Daily Report ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`;
    const notifBody = status === 'APPROVED'
      ? `CEO approved your ${report.department} daily report.`
      : `CEO rejected your ${report.department} daily report. Reason: ${comment}`;

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, report_id)
       VALUES ($1, $2, $3, $4, $5);`,
      [report.user_id, 'REPORT_REVIEW', notifTitle, notifBody, reportId]
    );

    await client.query('COMMIT');
    return updatedRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
