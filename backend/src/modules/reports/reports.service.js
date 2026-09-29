// ============================================================
// Karios Backend — Reports Service
// Handles report creation, editing, filtering, and CEO review
// ============================================================
import { query, getClient } from '../../config/db.js';
import { getTodayIST } from '../../utils/date.js';
import { BadRequest, NotFound, Forbidden, Conflict } from '../../utils/errors.js';
import { isUuid, isDateString } from '../../utils/validators.js';
import { validateReportData, extractSummaryColumns } from './reports.validation.js';
import { linkAttachments } from '../attachments/attachments.service.js';
import { notifyCeosAboutReport } from '../notifications/notifications.service.js';

const STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED'];
const MAX_PAGE_SIZE = 100;

export function formatReport(row) {
  if (!row) return null;
  const data = typeof row.data === 'object' && row.data !== null ? row.data : {};
  const dateStr = row.report_date instanceof Date
    ? row.report_date.toISOString().split('T')[0]
    : String(row.report_date || '').split('T')[0];

  const headTitle = row.head_title || row.department_title || (
    row.department ? `${row.department.charAt(0) + row.department.slice(1).toLowerCase()} Head` : 'Department Head'
  );

  return {
    ...data,
    ...row,
    id: row.id,
    user_id: row.user_id,
    department: row.department,
    department_title: headTitle,
    head_title: headTitle,
    report_date: dateStr,
    status: row.status,
    summary: data.summary || row.summary || '',
    blockers: row.blockers || data.blockers || '',
    revenue_closed: row.revenue_closed != null ? Number(row.revenue_closed) : (data.revenue_closed != null ? Number(data.revenue_closed) : 0),
    marketing_spend: row.marketing_spend != null ? Number(row.marketing_spend) : (data.marketing_spend != null ? Number(data.marketing_spend) : 0),
    leads: row.leads != null ? Number(row.leads) : (data.leads != null ? Number(data.leads) : 0),
    collections: row.collections != null ? Number(row.collections) : (data.collections != null ? Number(data.collections) : 0),
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    review_comment: row.review_comment,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

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
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(filters.limit) || 100));
  const offset = (page - 1) * limit;

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
  } else if (department && department.trim() !== '') {
    conditions.push(`r.department = $${paramIdx++}`);
    params.push(department.toUpperCase());
  }

  if (status && status.trim() !== '') {
    conditions.push(`r.status = $${paramIdx++}`);
    params.push(status.toUpperCase());
  }

  if (from && from.trim() !== '') {
    conditions.push(`r.report_date >= $${paramIdx++}::date`);
    params.push(from);
  }

  if (to && to.trim() !== '') {
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
           r.data, r.blockers, r.revenue_closed, r.marketing_spend, r.leads, r.collections,
           r.reviewed_by, r.reviewed_at, r.review_comment, r.created_at, r.updated_at,
           u.title AS head_title,
           rev.title AS reviewer_title,
           COALESCE(
             (SELECT json_agg(json_build_object(
                'id', a.id, 'fileName', a.file_name, 'filename', a.file_name, 'mimeType', a.mime_type, 'sizeBytes', a.size_bytes, 'storagePath', a.storage_path, 'url', a.storage_path
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
  const formatted = dataRes.rows.map(formatReport);

  return {
    data: formatted,
    reports: formatted,
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
  if (isUuid && !isUuid(reportId)) {
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
                'id', a.id, 'fileName', a.file_name, 'filename', a.file_name, 'mimeType', a.mime_type, 'sizeBytes', a.size_bytes, 'storagePath', a.storage_path, 'url', a.storage_path
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

  // RBAC check: non-CEO can only view own reports
  if (user.role !== 'CEO' && report.user_id !== user.id) {
    throw NotFound('Report not found');
  }

  return formatReport(report);
}

/**
 * Get today's report for the authenticated head
 */
export async function getTodayReport(user) {
  const today = getTodayIST();
  const sql = `
    SELECT r.id, r.user_id, r.department, r.report_date, r.status,
           r.data, r.blockers, r.revenue_closed, r.marketing_spend, r.leads, r.collections,
           r.reviewed_by, r.reviewed_at, r.review_comment, r.created_at, r.updated_at,
           u.title AS head_title,
           rev.title AS reviewer_title,
           COALESCE(
             (SELECT json_agg(json_build_object(
                'id', a.id, 'fileName', a.file_name, 'filename', a.file_name, 'mimeType', a.mime_type, 'sizeBytes', a.size_bytes, 'storagePath', a.storage_path, 'url', a.storage_path
              )) FROM attachments a WHERE a.report_id = r.id), '[]'::json
           ) AS attachments
    FROM reports r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN users rev ON r.reviewed_by = rev.id
    WHERE r.user_id = $1 AND r.report_date = $2::date
    LIMIT 1;
  `;

  const res = await query(sql, [user.id, today]);
  if (res.rows.length === 0) {
    return { date: today, report: null, canEdit: false };
  }
  const report = formatReport(res.rows[0]);
  return { date: today, report, canEdit: report.status !== 'APPROVED', ...report };
}

/**
 * Submit today's daily report (Department Head)
 */
export async function submitDailyReport(user, payload) {
  const reportDate = getTodayIST();
  const department = user.department || payload?.department;

  const data = payload?.data ? validateReportData(department, payload.data) : payload;
  const columns = extractSummaryColumns ? extractSummaryColumns(department, data) : {
    blockers: payload.blockers || null,
    revenue_closed: Number(payload.revenue_closed || payload.revenueClosed || 0),
    marketing_spend: Number(payload.marketing_spend || payload.spend || 0),
    leads: Number(payload.leads || payload.newLeads || 0),
    collections: Number(payload.collections || 0),
  };

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

    if (Array.isArray(payload?.attachmentIds) && linkAttachments) {
      await linkAttachments(client, { reportId: id, userId: user.id, attachmentIds: payload.attachmentIds });
    }

    if (notifyCeosAboutReport) {
      await notifyCeosAboutReport(client, { headTitle: user.title, reportId: id, reportDate });
    }
    return id;
  });

  return getReportById(reportId, user);
}

/**
 * Update today's report (Same-day edit only, not if approved)
 */
export async function updateDailyReport(reportId, user, payload) {
  if (isUuid && !isUuid(reportId)) {
    throw NotFound('Report not found');
  }

  const today = getTodayIST();
  const data = payload?.data ? validateReportData(user.department, payload.data) : payload;
  const columns = extractSummaryColumns ? extractSummaryColumns(user.department, data) : {
    blockers: payload.blockers,
    revenue_closed: payload.revenue_closed,
    marketing_spend: payload.marketing_spend,
    leads: payload.leads,
    collections: payload.collections,
  };

  await inTransaction(async (client) => {
    const current = await client.query(
      'SELECT id, report_date, status FROM reports WHERE id = $1 AND user_id = $2 FOR UPDATE;',
      [reportId, user.id],
    );
    const report = current.rows[0];

    if (!report) {
      throw NotFound('Report not found');
    }
    const reportDateStr = new Date(report.report_date).toISOString().split('T')[0];
    if (reportDateStr !== today && report.report_date !== today) {
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

    if (Array.isArray(payload?.attachmentIds) && linkAttachments) {
      await linkAttachments(client, { reportId, userId: user.id, attachmentIds: payload.attachmentIds });
    }

    if (report.status === 'REJECTED' && notifyCeosAboutReport) {
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
      ? (comment ? `CEO approved your ${report.department} daily report. Note: ${comment}` : `CEO approved your ${report.department} daily report.`)
      : `CEO rejected your ${report.department} daily report. Reason: ${comment}`;

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, report_id)
       VALUES ($1, $2, $3, $4, $5);`,
      [report.user_id, 'REPORT_REVIEW', notifTitle, notifBody, reportId]
    );

    await client.query('COMMIT');
    return formatReport(updatedRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
