import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { departmentLabel, isHead } from '../../auth/roles.js';
import { getFormSchema, getReport, getTodayReport } from '../../api/reports.js';
import { useApi } from '../../hooks/useApi.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import ReportFields from '../../components/ReportFields.jsx';
import AttachmentList from '../../components/AttachmentList.jsx';
import { ErrorBanner, Loading } from '../../components/Feedback.jsx';
import { formatDateTime, formatLongDate } from '../../utils/date.js';

// Owner: Member 3 (head view: Member 2)
// TODO (Member 3): CEO only: Approve / Reject + optional comment → POST /api/reports/:id/review
export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const head = isHead(user);

  const { data, error, loading, reload } = useApi(
    async () => {
      // Heads also load their form (labels, $ fields) and today's report (to know if Edit is allowed).
      const [{ report }, schema, today] = await Promise.all([
        getReport(id),
        head ? getFormSchema() : null,
        head ? getTodayReport() : null,
      ]);
      const canEdit = Boolean(today?.report && today.report.id === report.id && today.canEdit);
      return { report, fields: schema?.fields, canEdit };
    },
    [id, head],
    { refreshOnFocus: true },
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Home / Report</h1>
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <ErrorBanner error={error} onRetry={error?.status === 404 ? undefined : reload} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <section className="card">
            <div className="card-head">
              <div>
                <h2>
                  {data.report.head_title} — {departmentLabel(data.report.department)}
                </h2>
                <span className="muted small">
                  {formatLongDate(data.report.report_date)} · last saved {formatDateTime(data.report.updated_at)}
                </span>
              </div>
              <StatusBadge status={data.report.status} />
            </div>

            <ReviewPanel report={data.report} />

            <ReportFields fields={data.fields} data={data.report.data} />

            {data.canEdit && (
              <div className="actions">
                <Link className="button" to="/head/report">
                  {data.report.status === 'REJECTED' ? 'Fix & resubmit' : 'Edit report'}
                </Link>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Attachments</h2>
            <AttachmentList attachments={data.report.attachments} />
          </section>

          {!head && <div className="card muted">Approve / Reject panel goes here.</div>}
        </>
      )}
    </>
  );
}

function ReviewPanel({ report }) {
  if (report.status === 'SUBMITTED') return null;
  const rejected = report.status === 'REJECTED';
  return (
    <div className={rejected ? 'alert alert-rejected' : 'alert alert-approved'}>
      <strong>
        {rejected ? 'Rejected' : 'Approved'} by {report.reviewer_title || 'the CEO'}
      </strong>
      <span className="small"> · {formatDateTime(report.reviewed_at)}</span>
      {report.review_comment && <p>“{report.review_comment}”</p>}
    </div>
  );
}
