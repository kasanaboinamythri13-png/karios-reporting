// Creating in-app notifications.
// Owner: Member 2
//
// `db` is either the shared `query` helper's pool or a transaction client,
// so a notification can be saved in the same transaction as the report.

/**
 * Tells every active CEO that a head submitted (or re-submitted) a report.
 */
export async function notifyCeosAboutReport(db, { headTitle, reportId, reportDate, resubmitted = false }) {
  const title = resubmitted ? `${headTitle} updated a report` : `${headTitle} submitted a report`;
  const body = resubmitted
    ? `The rejected report for ${reportDate} was corrected and is ready for review again.`
    : `Daily report for ${reportDate} is ready for review.`;

  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, report_id)
     SELECT id, 'REPORT_SUBMITTED', $1, $2, $3
     FROM users
     WHERE role = 'CEO' AND is_active = TRUE;`,
    [title, body, reportId],
  );
}
