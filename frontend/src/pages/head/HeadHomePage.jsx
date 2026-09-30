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
  const flash = useFlash();

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Home / Overview</h1>
      </div>
      {flash && <div className="alert alert-success">{flash}</div>}
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
          <p>You haven't submitted today's report yet.</p>
          <Link className="button" to="/head/report">
            Submit report
          </Link>
        </>
      )}

      {report?.status === 'SUBMITTED' && (
        <>
          <p className="muted">
            Submitted {formatDateTime(report.updated_at || report.created_at)} · waiting for the CEO's review.
          </p>
          <div className="actions">
            <Link className="button-secondary" to={`/reports/${report.id}`}>
              View
            </Link>
            {canEdit && (
              <Link className="button" to="/head/report">
                Edit
              </Link>
            )}
          </div>
        </>
      )}

      {report?.status === 'REJECTED' && (
        <>
          <div className="alert alert-rejected">
            <strong>The CEO rejected this report.</strong>
            {report.review_comment && <p>“{report.review_comment}”</p>}
          </div>
          <div className="actions">
            <Link className="button-secondary" to={`/reports/${report.id}`}>
              View
            </Link>
            {canEdit && (
              <Link className="button" to="/head/report">
                Fix &amp; resubmit
              </Link>
            )}
          </div>
        </>
      )}

      {report?.status === 'APPROVED' && (
        <>
          <p className="muted">
            Approved by {report.reviewer_title || 'the CEO'} · {formatDateTime(report.reviewed_at)}
          </p>
          {report.review_comment && <p>“{report.review_comment}”</p>}
          <Link className="button-secondary" to={`/reports/${report.id}`}>
            View
          </Link>
        </>
      )}
    </section>
  );
}

function RecentList({ reports, department }) {
  const navigate = useNavigate();
  const metric = headlineMetric(department);
  return (
    <ul className="row-list">
      {reports.map((r) => (
        <li key={r.id}>
          <button type="button" className="row-button" onClick={() => navigate(`/reports/${r.id}`)}>
            <span>{formatDate(r.report_date)}</span>
            <StatusBadge status={r.status} />
            <span className="muted">{metric ? formatUSD(r[metric.column]) : ''}</span>
            <span aria-hidden="true">→</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// Shows "Report submitted" etc. once after the form sends the user back here.
function useFlash() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(location.state?.flash || null);

  useEffect(() => {
    if (location.state?.flash) {
      setMessage(location.state.flash);
      navigate(location.pathname, { replace: true, state: null }); // don't show it again on refresh
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  return message;
}
