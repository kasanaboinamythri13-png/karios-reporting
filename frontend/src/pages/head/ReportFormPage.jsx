import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { departmentLabel } from '../../auth/roles.js';
import { getFormSchema, getTodayReport, submitReport, updateReport } from '../../api/reports.js';
import { useApi } from '../../hooks/useApi.js';
import FieldInput from '../../components/FieldInput.jsx';
import AttachmentPicker from '../../components/AttachmentPicker.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { ErrorBanner, Loading } from '../../components/Feedback.jsx';
import { buildReportData, toFormValues } from '../../utils/reportForm.js';
import { formatLongDate } from '../../utils/date.js';
import { useToast } from '../../context/ToastContext.jsx';

// Owner: Member 2
// One page for both: no report today → Submit (POST). Report today → Edit (PATCH, same day only).
// Fields come from GET /reports/form-schema, so the form always matches the backend.
async function loadForm() {
  const [schema, today] = await Promise.all([getFormSchema(), getTodayReport()]);
  return { fields: schema.fields, today };
}

export default function ReportFormPage() {
  const { data, error, loading, reload } = useApi(loadForm, []);
  const [notice, setNotice] = useState(null);

  if (loading && !data) return <Loading />;
  if (error) {
    return (
      <>
        <h1 className="page-title">Daily Report</h1>
        <ErrorBanner error={error} onRetry={reload} />
      </>
    );
  }

  const { report, canEdit } = data.today;
  if (report && !canEdit) return <Navigate to={`/reports/${report.id}`} replace />; // approved → read-only

  // key: start fresh if the page reloads into a different mode (e.g. after a 409)
  return (
    <ReportForm
      key={report?.id || 'new'}
      fields={data.fields}
      today={data.today}
      notice={notice}
      onConflict={() => {
        setNotice('You already submitted a report today. It has been loaded so you can edit it.');
        reload();
      }}
    />
  );
}

function ReportForm({ fields, today, notice, onConflict }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const report = today.report;
  const isEdit = Boolean(report);

  const [values, setValues] = useState(() => toFormValues(fields, report?.data));
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState(() =>
    (report?.attachments || []).map((a) => ({ ...a, key: a.id, status: 'done', progress: 100 })),
  );
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(notice);
  const [dirty, setDirty] = useState(false);

  const uploading = files.some((f) => f.status === 'uploading');

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function onChange(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    setDirty(true);
  }

  // Back / Cancel: ask first if there are unsaved changes.
  function leave(to) {
    if (dirty && !window.confirm('Leave without saving? Your changes will be lost.')) return;
    setDirty(false);
    if (to) navigate(to);
    else if (location.key !== 'default') navigate(-1); // came from another page in the app
    else navigate('/head'); // opened directly (bookmark / new tab)
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const { data, errors: found } = buildReportData(fields, values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    // Complete list: files left out are detached from the report.
    const body = { data, attachmentIds: files.filter((f) => f.status === 'done' && f.id).map((f) => f.id) };

    setSaving(true);
    try {
      if (isEdit) await updateReport(report.id, body);
      else await submitReport(body);
      setDirty(false);
      const title = isEdit ? "Report Updated" : "Report Submitted";
      const msg = isEdit
        ? report.status === 'REJECTED'
          ? 'Report corrected and sent back to the CEO for review.'
          : 'Your daily report has been updated.'
        : 'Your daily report has been submitted. The CEO has been notified.';
      toast.success(title, msg);
      navigate('/head');
    } catch (err) {
      if (err.status === 409) {
        // Already submitted today (e.g. from another tab) → reload in edit mode.
        onConflict();
      } else {
        setServerError(err.message);
        toast.error("Submission failed", err.message || "Please check your inputs and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="page-title">{isEdit ? 'Edit Report' : 'Submit Report'}</h1>

      <form className="card report-form" onSubmit={onSubmit} noValidate>
        <div className="card-head">
          <div>
            <h2>
              {user.title} — {departmentLabel(user.department)} daily report
            </h2>
            <span className="muted small">{formatLongDate(today.date)}</span>
          </div>
          {isEdit && <StatusBadge status={report.status} />}
        </div>

        {report?.status === 'REJECTED' && (
          <div className="alert alert-rejected">
            <strong>Rejected by the CEO.</strong>
            {report.review_comment && <p>“{report.review_comment}”</p>}
            <p className="small">Saving your changes sends the report back for review.</p>
          </div>
        )}

        <ErrorBanner error={serverError} />

        <div className="form-grid">
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key]}
              error={errors[field.key]}
              onChange={onChange}
              disabled={saving}
            />
          ))}
        </div>

        <AttachmentPicker
          items={files}
          setItems={(update) => {
            setFiles(update);
            setDirty(true);
          }}
          disabled={saving}
        />

        <div className="actions form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn--outline" disabled={saving} onClick={() => leave('/head')}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : uploading ? 'Uploading files…' : isEdit ? 'Save changes' : 'Submit report'}
          </button>
        </div>
      </form>
    </>
  );
}
