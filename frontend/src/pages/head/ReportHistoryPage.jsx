import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listReports } from '../../api/reports.js';
import { useApi } from '../../hooks/useApi.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, Loading } from '../../components/Feedback.jsx';
import { formatDate } from '../../utils/date.js';
import { formatUSD } from '../../utils/currency.js';
import { headlineMetric } from '../../utils/reportForm.js';

// Owner: Member 2
// Own reports only (the backend filters by the logged-in head).
// Filters live in the URL, so Back from a report keeps them.
const PAGE_SIZE = 20;

export default function ReportHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const { data, error, loading, reload } = useApi(
    () => listReports({ status, from, to, page, limit: PAGE_SIZE }),
    [status, from, to, page],
    { refreshOnFocus: true },
  );

  const metric = headlineMetric(user.department);
  const hasFilters = Boolean(status || from || to);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // new filter → back to page 1
    setParams(next);
  }

  function goToPage(n) {
    const next = new URLSearchParams(params);
    next.set('page', String(n));
    setParams(next);
  }

  return (
    <>
      <h1 className="page-title">Home / My reports</h1>

      <div className="card filters">
        <label className="field">
          Status
          <select value={status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All</option>
            <option value="SUBMITTED">Pending review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label className="field">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFilter('from', e.target.value)} />
        </label>
        <label className="field">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => setFilter('to', e.target.value)} />
        </label>
        {hasFilters && (
          <button type="button" className="button-secondary" onClick={() => setParams({})}>
            Clear
          </button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={reload} />
      {loading && !data && <Loading />}

      {data && data.data.length === 0 && (
        <EmptyState title={hasFilters ? 'No reports match these filters' : 'No reports yet'}>
          {hasFilters ? 'Try a different status or date range.' : 'Reports you submit will appear here.'}
        </EmptyState>
      )}

      {data && data.data.length > 0 && (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  {metric && <th className="num">{metric.label}</th>}
                  <th>Files</th>
                  <th>CEO comment</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => navigate(`/reports/${r.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/reports/${r.id}`)}
                  >
                    <td data-label="Date">{formatDate(r.report_date)}</td>
                    <td data-label="Status">
                      <StatusBadge status={r.status} />
                    </td>
                    {metric && (
                      <td data-label={metric.label} className="num">
                        {formatUSD(r[metric.column])}
                      </td>
                    )}
                    <td data-label="Files">{r.attachments?.length ? `📎 ${r.attachments.length}` : '—'}</td>
                    <td data-label="CEO comment" className="comment-cell">
                      {r.review_comment || <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="muted small">
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} reports
            </span>
            <div className="actions">
              <button type="button" className="button-secondary" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={page >= data.pagination.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
