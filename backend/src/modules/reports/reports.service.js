// ============================================================
// Karios Backend — Reports Service
// Handles report creation, same-day editing, filtering, and CEO review
// ============================================================
import { query, getClient } from '../../config/db.js';
import { getTodayIST } from '../../utils/date.js';
import { BadRequest, NotFound, Forbidden, Conflict } from '../../utils/errors.js';

/**
 * List reports with role-based isolation and filters
 */
export async function listReports(user, filters = {}) {
  const { department, status, from, to, page = 1, limit = 20 } = filters;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

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

  params.push(parseInt(limit), offset);
  const dataRes = await query(dataSql, params);

  return {
    data: dataRes.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
    },
  };
}

/**
 * Get detailed report by ID
 */
export async function getReportById(reportId, user) {
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

  // RBAC check: non-CEO can only view own reports
  if (user.role !== 'CEO' && report.user_id !== user.id) {
    throw Forbidden('You do not have permission to view this report');
  }

  return report;
}

/**
 * Submit today's daily report (Department Head)
 */
export async function submitDailyReport(user, payload) {
  const todayIST = getTodayIST();
  const { department, data = {}, blockers = null, revenueClosed = 0, marketingSpend = 0, leads = 0, collections = 0 } = payload;

  const dept = department || user.department;

  // Check if already submitted today
  const existing = await query('SELECT id FROM reports WHERE user_id = $1 AND report_date = $2::date;', [user.id, todayIST]);
  if (existing.rows.length > 0) {
    throw Conflict(`Daily report for ${todayIST} has already been submitted.`);
  }

  const insertSql = `
    INSERT INTO reports (user_id, department, report_date, status, data, blockers, revenue_closed, marketing_spend, leads, collections)
    VALUES ($1, $2, $3::date, 'SUBMITTED', $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const result = await query(insertSql, [
    user.id,
    dept,
    todayIST,
    JSON.stringify(data),
    blockers,
    revenueClosed,
    marketingSpend,
    leads,
    collections,
  ]);

  return result.rows[0];
}

/**
 * Update today's report (Same-day edit only, not if approved)
 */
export async function updateDailyReport(reportId, user, payload) {
  const todayIST = getTodayIST();

  const current = await query('SELECT * FROM reports WHERE id = $1::uuid;', [reportId]);
  if (current.rows.length === 0) {
    throw NotFound('Report not found');
  }

  const report = current.rows[0];

  // Owner check
  if (report.user_id !== user.id) {
    throw Forbidden('You can only edit your own reports');
  }

  // Same-day check (IST)
  const reportDateStr = new Date(report.report_date).toISOString().split('T')[0];
  if (reportDateStr !== todayIST) {
    throw Forbidden('Past reports cannot be modified. Only same-day edits are allowed.');
  }

  // Approved check
  if (report.status === 'APPROVED') {
    throw Forbidden('Approved reports cannot be edited.');
  }

  const { data, blockers, revenueClosed, marketingSpend, leads, collections } = payload;

  const updateSql = `
    UPDATE reports
    SET data = COALESCE($1, data),
        blockers = COALESCE($2, blockers),
        revenue_closed = COALESCE($3, revenue_closed),
        marketing_spend = COALESCE($4, marketing_spend),
        leads = COALESCE($5, leads),
        collections = COALESCE($6, collections),
        status = 'SUBMITTED',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7::uuid
    RETURNING *;
  `;

  const updated = await query(updateSql, [
    data ? JSON.stringify(data) : null,
    blockers,
    revenueClosed,
    marketingSpend,
    leads,
    collections,
    reportId,
  ]);

  return updated.rows[0];
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
