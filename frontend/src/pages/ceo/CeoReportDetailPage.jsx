// src/pages/ceo/CeoReportDetailPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/shared/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { format } from "date-fns";

export default function CeoReportDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [comment,  setComment]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const { data } = await api.get(`/reports/${id}`);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // ── Inline review handler ────────────────────────────────────────────────
  const handleReview = async (status) => {
    setSubmitting(true);
    try {
      await api.post(`/reports/${id}/review`, { status, comment: comment.trim() || null });
      toast.success(
        status === "APPROVED" ? "Report Approved ✅" : "Report Rejected",
        `The ${report?.department?.toLowerCase()} report has been ${status.toLowerCase()}.`
      );
      setComment("");
      await fetchReport();
    } catch (err) {
      toast.error("Review failed", err?.response?.data?.error?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Department field maps ────────────────────────────────────────────────
  const fieldsByDept = {
    DEVELOPMENT: [
      { label: "Tasks Completed",    value: report?.tasks_completed },
      { label: "Tasks In Progress",  value: report?.tasks_in_progress },
      { label: "Bugs Fixed",         value: report?.bugs_fixed },
      { label: "Deployments",        value: report?.deployments },
      { label: "PRs Merged",         value: report?.prs_merged },
      { label: "Code Reviews Done",  value: report?.code_reviews },
      { label: "Sprint Progress",    value: report?.sprint_progress != null ? `${report.sprint_progress}%` : null },
      { label: "Tech Debt Notes",    value: report?.tech_debt_notes },
    ],
    SALES: [
      { label: "Calls Made",          value: report?.calls_made },
      { label: "Meetings Held",       value: report?.meetings_held },
      { label: "Leads Generated",     value: report?.leads },
      { label: "Proposals Sent",      value: report?.proposals_sent },
      { label: "Deals Closed",        value: report?.deals_closed },
      { label: "Revenue Closed",      value: report?.revenue_closed != null ? `$${Number(report.revenue_closed).toLocaleString()}` : null },
      { label: "Pipeline Value",      value: report?.pipeline_value  != null ? `$${Number(report.pipeline_value).toLocaleString()}`  : null },
      { label: "Follow-ups Pending",  value: report?.follow_ups_pending },
    ],
    MARKETING: [
      { label: "Campaigns Active",    value: report?.campaigns_active },
      { label: "Impressions",         value: report?.impressions?.toLocaleString() },
      { label: "Clicks",              value: report?.clicks?.toLocaleString() },
      { label: "Conversions",         value: report?.conversions },
      { label: "Leads Generated",     value: report?.leads },
      { label: "Marketing Spend",     value: report?.marketing_spend != null ? `$${Number(report.marketing_spend).toLocaleString()}` : null },
      { label: "Social Media Posts",  value: report?.social_posts },
      { label: "Email Campaigns",     value: report?.email_campaigns },
    ],
    FINANCE: [
      { label: "Revenue",             value: report?.revenue       != null ? `$${Number(report.revenue).toLocaleString()}`       : null },
      { label: "Expenses",            value: report?.expenses      != null ? `$${Number(report.expenses).toLocaleString()}`      : null },
      { label: "Net Profit",          value: report?.net_profit    != null ? `$${Number(report.net_profit).toLocaleString()}`    : null },
      { label: "Collections",         value: report?.collections   != null ? `$${Number(report.collections).toLocaleString()}`   : null },
      { label: "Pending Invoices",    value: report?.pending_invoices },
      { label: "Payments Made",       value: report?.payments_made != null ? `$${Number(report.payments_made).toLocaleString()}` : null },
      { label: "Budget Variance",     value: report?.budget_variance != null ? `${report.budget_variance}%`                     : null },
    ],
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="loading-spinner" />
    </div>
  );

  if (!report) return (
    <div className="page-content">
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <div className="empty-state__title">Report not found</div>
        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => navigate("/ceo/reports")}>
          Back to Reports
        </button>
      </div>
    </div>
  );

  const dept   = report.department;
  const fields = (fieldsByDept[dept] || []).filter(
    (f) => f.value != null && f.value !== "" && f.value !== 0
  );

  const isPending  = report.status === "SUBMITTED";
  const isApproved = report.status === "APPROVED";
  const isRejected = report.status === "REJECTED";

  return (
    <div className="page-content">
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => navigate(-1)}
          id="back-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          / {report.department_title || dept}
          {report.report_date ? ` / ${format(new Date(report.report_date), "dd MMM yyyy")}` : ""}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ══ Left: Report content ══ */}
        <div>
          <div className="card">
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                  {report.department_title || dept} — Daily Report
                </h1>
                <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                  {report.report_date ? format(new Date(report.report_date), "EEEE, dd MMMM yyyy") : "—"}
                </div>
              </div>
              <StatusBadge status={report.status} />
            </div>

            <hr className="divider" />

            {/* Metrics grid */}
            {fields.length > 0 && (
              <div className="report-section">
                <div className="report-section__title">Daily Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 28px" }}>
                  {fields.map((f) => (
                    <div key={f.label} className="report-field">
                      <div className="report-field__label">{f.label}</div>
                      <div className="report-field__value">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {report.summary && (
              <div className="report-section">
                <div className="report-section__title">Summary</div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{report.summary}</div>
              </div>
            )}

            {/* Blockers */}
            {report.blockers && report.blockers.trim() && (
              <div className="report-section">
                <div className="report-section__title">Blockers</div>
                <div className="blocker-card">
                  <div className="blocker-card__text">{report.blockers}</div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {report.attachments?.length > 0 && (
              <div className="report-section">
                <div className="report-section__title">Attachments</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {report.attachments.map((att) => (
                    <a key={att.id} href={att.url || "#"} target="_blank" rel="noopener noreferrer"
                      className="btn btn--outline btn--sm">
                      📎 {att.filename || att.id}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ Right: Review panel ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Review card */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Review</h2>

            {/* Current status */}
            <div className="report-field" style={{ marginBottom: 16 }}>
              <div className="report-field__label">Current Status</div>
              <StatusBadge status={report.status} />
            </div>

            {/* ── PENDING: inline comment + action buttons ── */}
            {isPending && (
              <>
                <hr className="divider" style={{ margin: "0 0 16px" }} />

                {/* Comment textarea — always visible */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    htmlFor="review-comment-box"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <span>CEO Comment</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="review-comment-box"
                    className="form-textarea"
                    rows={4}
                    placeholder="Add an optional comment for the department head…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ resize: "vertical", minHeight: 96 }}
                  />
                  {comment.trim().length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                      {comment.trim().length} characters
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    className="btn btn--success w-full"
                    onClick={() => handleReview("APPROVED")}
                    disabled={submitting}
                    id="approve-report-btn"
                    style={{ padding: "11px 16px", fontSize: 14, fontWeight: 700 }}
                  >
                    {submitting ? "Processing…" : "✓ Approve Report"}
                  </button>

                  <button
                    className="btn btn--danger w-full"
                    onClick={() => handleReview("REJECTED")}
                    disabled={submitting}
                    id="reject-report-btn"
                    style={{ padding: "11px 16px", fontSize: 14, fontWeight: 700 }}
                  >
                    {submitting ? "Processing…" : "✕ Reject Report"}
                  </button>
                </div>
              </>
            )}

            {/* ── APPROVED: read-only review info ── */}
            {isApproved && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 16px",
                  marginTop: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span style={{ fontWeight: 700, color: "#065f46", fontSize: 14 }}>Approved</span>
                </div>
                {report.review_comment && (
                  <div style={{ fontSize: 13, color: "#065f46", fontStyle: "italic" }}>
                    "{report.review_comment}"
                  </div>
                )}
                {report.reviewed_at && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                    {format(new Date(report.reviewed_at), "dd MMM yyyy, HH:mm")}
                  </div>
                )}
              </div>
            )}

            {/* ── REJECTED: read-only review info ── */}
            {isRejected && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 16px",
                  marginTop: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>❌</span>
                  <span style={{ fontWeight: 700, color: "#b91c1c", fontSize: 14 }}>Rejected</span>
                </div>
                {report.review_comment && (
                  <div style={{ fontSize: 13, color: "#7f1d1d", fontStyle: "italic" }}>
                    "{report.review_comment}"
                  </div>
                )}
                {report.reviewed_at && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                    {format(new Date(report.reviewed_at), "dd MMM yyyy, HH:mm")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission info card */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Submission Info</h2>
            <div className="report-field">
              <div className="report-field__label">Submitted By</div>
              <div style={{ fontWeight: 600 }}>{report.head_title || "—"}</div>
            </div>
            <div className="report-field">
              <div className="report-field__label">Submitted At</div>
              <div style={{ fontSize: 13 }}>
                {report.created_at ? format(new Date(report.created_at), "dd MMM yyyy, HH:mm") : "—"}
              </div>
            </div>
            {report.reviewed_at && (
              <div className="report-field">
                <div className="report-field__label">Reviewed At</div>
                <div style={{ fontSize: 13 }}>
                  {format(new Date(report.reviewed_at), "dd MMM yyyy, HH:mm")}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}