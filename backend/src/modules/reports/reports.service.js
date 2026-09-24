// Business rules for reports (one per day, same-day edit, review status changes).
// Owner: Member 1 (submit / edit / list), Member 3 (review)
//
// Always use todayIST() from utils/date.js — never new Date() directly — to decide "today".

import { query, getClient } from '../../config/db.js';
import { BadRequest, NotFound } from '../../utils/errors.js';

/**
 * Review report: CEO Approve / Reject with optional or mandatory comment
 * Owner: Member 3
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
