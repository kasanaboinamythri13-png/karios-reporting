import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { getTodayReport, listReports } from '../../api/reports.js';
import { useApi } from '../../hooks/useApi.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { ErrorBanner, Loading } from '../../components/Feedback.jsx';
import { formatDate, formatDateTime, formatLongDate } from '../../utils/date.js';
import { formatUSD } from '../../utils/currency.js';
import { headlineMetric } from '../../utils/reportForm.js';

// Owner: Member 2
// Today's report status + this head's totals + recent reports.
// Refreshes when the tab gets focus, so a CEO review shows up without a page reload.
async function loadHome() {
  const count = (status) => listReports({ status, limit: 1 }).then((r) => r.pagination.total);
  const [today, recent, pending, approved, rejected] = await Promise.all([
    getTodayReport(),
    listReports({ limit: 5 }),
    count('SUBMITTED'),
    count('APPROVED'),
    count('REJECTED'),
  ]);
  return { today, recent: recent.data, total: recent.pagination.total, pending, approved, rejected };
}

export default function HeadHomePage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(loadHome, [], { refreshOnFocus: true });

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Overview</h1>
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="stat-grid">
            <Stat value={data.total} label="Reports submitted" />
            <Stat value={data.pending} label="Pending review" tone="pending" />
            <Stat value={data.approved} label="Approved" tone="approved" />
            <Stat value={data.rejected} label="Rejected" tone="rejected" />
          </div>

          <TodayCard title={user.title} today={data.today} />

          <section className="card">
            <div className="card-head">
              <h2>Recent reports</h2>
              <Link to="/head/history" className="link">
                View all
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="muted">No reports yet. Your submitted reports will show here.</p>
            ) : (
              <RecentList reports={data.recent} department={user.department} />
            )}
          </section>
        </>
      )}
    </>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div className="card stat">
      <span className={tone ? `stat-value text-${tone}` : 'stat-value'}>{value}</span>
      <span className="muted">{label}</span>
    </div>
  );
}

function TodayCard({ title, today }) {
  const { date, report, canEdit } = today;
  const status = report?.status || 'NOT_SUBMITTED';

  return (
    <section className="card today">
      <div className="card-head">
        <div>
          <h2>Today's report</h2>
          <span className="muted small">
            {title} · {formatLongDate(date)}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {!report && (
        <>
          <p style={{ marginBottom: 16 }}>You haven't submitted today's report yet.</p>
          <Link className="btn btn--primary" to="/head/report">
            Submit report
          </Link>
        </>
      )}

      {report?.status === 'SUBMITTED' && (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            Submitted {formatDateTime(report.updated_at || report.created_at)} · waiting for the CEO's review.
          </p>
          <div className="actions" style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn--outline btn--sm" to={`/reports/${report.id}`}>
              View
            </Link>
            {canEdit && (
              <Link className="btn btn--primary btn--sm" to="/head/report">
                Edit
              </Link>
            )}
          </div>
        </>
      )}

      {report?.status === 'REJECTED' && (
        <>
          <div className="alert alert-rejected" style={{ marginBottom: 16 }}>
            <strong>The CEO rejected this report.</strong>
            {report.review_comment && <p>“{report.review_comment}”</p>}
          </div>
          <div className="actions" style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn--outline btn--sm" to={`/reports/${report.id}`}>
              View
            </Link>
            {canEdit && (
              <Link className="btn btn--primary btn--sm" to="/head/report">
                Fix &amp; resubmit
              </Link>
            )}
          </div>
        </>
      )}

      {report?.status === 'APPROVED' && (
        <>
          <div className="alert alert-approved" style={{ marginBottom: 16 }}>
            <strong>Approved by {report.reviewer_title || 'the CEO'}.</strong>
            {report.reviewed_at && (
              <span className="small"> · {formatDateTime(report.reviewed_at)}</span>
            )}
            {report.review_comment && <p>“{report.review_comment}”</p>}
          </div>
          <div className="actions" style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn--outline btn--sm" to={`/reports/${report.id}`}>
              View
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function RecentList({ reports }) {
  const navigate = useNavigate();
  return (
    <ul className="row-list">
      {reports.map((r) => (
        <li key={r.id}>
          <button type="button" className="row-button" onClick={() => navigate(`/reports/${r.id}`)}>
            <span>{formatDate(r.report_date)}</span>
            <StatusBadge status={r.status} />
            <span aria-hidden="true" style={{ marginLeft: "auto" }}>→</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
