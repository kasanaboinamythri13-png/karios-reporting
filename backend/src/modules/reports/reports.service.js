// ============================================================
// Karios Backend — Reports Service
// Handles report creation, editing, filtering, and CEO review
// ============================================================
import { query, getClient } from '../../config/db.js';
import { todayIST, getTodayIST } from '../../utils/date.js';
import { BadRequest, NotFound, Forbidden, Conflict } from '../../utils/errors.js';

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
 * List reports with role-based isolation and filters
 */
export async function listReports(user, filters = {}) {
  const { department, status, from, to, page = 1, limit = 100 } = filters;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

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

  // Fetch reports
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

  params.push(parseInt(limit), offset);
  const dataRes = await query(dataSql, params);
  const formatted = dataRes.rows.map(formatReport);

  return {
    data: formatted,
    reports: formatted,
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
    throw Forbidden('You do not have permission to view this report');
  }

  return formatReport(report);
}

/**
 * Get today's report for the authenticated head
 */
export async function getTodayReport(user) {
  const today = todayIST();
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
    return null;
  }
  return formatReport(res.rows[0]);
}

/**
 * Submit today's daily report (Department Head)
 */
export async function submitDailyReport(user, payload) {
  const today = todayIST();
  const dept = payload.department || user.department;

  // Check if already submitted today
  const existing = await query('SELECT id FROM reports WHERE user_id = $1 AND report_date = $2::date;', [user.id, today]);
  if (existing.rows.length > 0) {
    throw Conflict(`Daily report for ${today} has already been submitted.`);
  }

  const blockers = payload.blockers || null;
  const revenueClosed = Number(payload.revenue_closed || payload.revenueClosed || 0);
  const marketingSpend = Number(payload.marketing_spend || payload.spend || 0);
  const leads = Number(payload.leads || payload.newLeads || 0);
  const collections = Number(payload.collections || 0);

  const insertSql = `
    INSERT INTO reports (user_id, department, report_date, status, data, blockers, revenue_closed, marketing_spend, leads, collections)
    VALUES ($1, $2, $3::date, 'SUBMITTED', $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const result = await query(insertSql, [
    user.id,
    dept,
    today,
    JSON.stringify(payload),
    blockers,
    revenueClosed,
    marketingSpend,
    leads,
    collections,
  ]);

  const newReport = result.rows[0];

  // Notify CEO that a department head submitted a report
  try {
    const ceoRes = await query(`SELECT id FROM users WHERE role = 'CEO' LIMIT 1;`);
    if (ceoRes.rows.length > 0) {
      const ceoId = ceoRes.rows[0].id;
      const headName = user.title || `${dept} Head`;
      await query(
        `INSERT INTO notifications (user_id, type, title, body, report_id)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          ceoId,
          'REPORT_SUBMITTED',
          `New Daily Report: ${dept}`,
          `${headName} submitted the daily report for ${today}.`,
          newReport.id,
        ]
      );
    }
  } catch (notifErr) {
    console.error('[Notification] Failed to create notification for CEO:', notifErr.message);
  }

  return formatReport(newReport);
}

/**
 * Update today's report (Same-day edit only, not if approved)
 */
export async function updateDailyReport(reportId, user, payload) {
  const today = todayIST();

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
  if (reportDateStr !== today) {
    throw Forbidden('Past reports cannot be modified. Only same-day edits are allowed.');
  }

  // Approved check
  if (report.status === 'APPROVED') {
    throw Forbidden('Approved reports cannot be edited.');
  }

  const blockers = payload.blockers !== undefined ? payload.blockers : report.blockers;
  const revenueClosed = payload.revenue_closed !== undefined ? Number(payload.revenue_closed) : report.revenue_closed;
  const marketingSpend = payload.marketing_spend !== undefined ? Number(payload.marketing_spend) : report.marketing_spend;
  const leads = payload.leads !== undefined ? Number(payload.leads) : report.leads;
  const collections = payload.collections !== undefined ? Number(payload.collections) : report.collections;

  const mergedData = {
    ...(typeof report.data === 'object' && report.data !== null ? report.data : {}),
    ...payload,
  };

  const updateSql = `
    UPDATE reports
    SET data = $1,
        blockers = $2,
        revenue_closed = $3,
        marketing_spend = $4,
        leads = $5,
        collections = $6,
        status = 'SUBMITTED',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7::uuid
    RETURNING *;
  `;

  const updated = await query(updateSql, [
    JSON.stringify(mergedData),
    blockers,
    revenueClosed,
    marketingSpend,
    leads,
    collections,
    reportId,
  ]);

  const updatedReport = updated.rows[0];

  // Notify CEO if report was resubmitted/updated
  try {
    const ceoRes = await query(`SELECT id FROM users WHERE role = 'CEO' LIMIT 1;`);
    if (ceoRes.rows.length > 0) {
      const ceoId = ceoRes.rows[0].id;
      const headName = user.title || `${report.department} Head`;
      const isResubmit = report.status === 'REJECTED';
      await query(
        `INSERT INTO notifications (user_id, type, title, body, report_id)
         VALUES ($1, $2, $3, $4, $5);`,
        [
          ceoId,
          'REPORT_SUBMITTED',
          isResubmit ? `Report Resubmitted: ${report.department}` : `Report Updated: ${report.department}`,
          `${headName} ${isResubmit ? 'resubmitted' : 'updated'} their daily report.`,
          reportId,
        ]
      );
    }
  } catch (notifErr) {
    console.error('[Notification] Failed to notify CEO on update:', notifErr.message);
  }

  return formatReport(updatedReport);
}

/**
 * Review report: CEO Approve / Reject with optional or mandatory comment
 */
export async function reviewReport(reportId, ceoUser, decision) {
  const { status, comment } = decision;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw BadRequest("Status must be either 'APPROVED' or 'REJECTED'");
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
      : (comment ? `CEO rejected your ${report.department} daily report. Reason: ${comment}` : `CEO rejected your ${report.department} daily report.`);

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
