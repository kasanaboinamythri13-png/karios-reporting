// src/pages/ceo/CeoReportDetailPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/shared/StatusBadge";
import AttachmentList from "../../components/AttachmentList";
import { useToast } from "../../context/ToastContext";
import { format } from "date-fns";
import { formatUSD } from "../../utils/currency";

const FORM_FIELDS = {
  DEVELOPMENT: [
    { key: "tasksCompleted", label: "Tasks Completed", type: "textarea", required: true },
    { key: "tasksInProgress", label: "Tasks In Progress", type: "textarea" },
    { key: "bugsFixed", label: "Bugs Fixed", type: "number" },
    { key: "deployments", label: "Deployments", type: "number" },
    { key: "blockers", label: "Blockers", type: "textarea", column: "blockers" },
    { key: "planTomorrow", label: "Plan for Tomorrow", type: "textarea" },
  ],
  SALES: [
    { key: "newLeads", label: "New Leads", type: "number", required: true, column: "leads" },
    { key: "followUps", label: "Follow-ups", type: "number" },
    { key: "dealsClosed", label: "Deals Closed", type: "number" },
    { key: "revenueClosed", label: "Revenue Closed", type: "currency", column: "revenue_closed" },
    { key: "pipelineValue", label: "Pipeline Value", type: "currency" },
    { key: "blockers", label: "Blockers", type: "textarea", column: "blockers" },
    { key: "planTomorrow", label: "Plan for Tomorrow", type: "textarea" },
  ],
  MARKETING: [
    { key: "activeCampaigns", label: "Active Campaigns", type: "number", required: true },
    { key: "spend", label: "Spend", type: "currency", column: "marketing_spend" },
    { key: "impressions", label: "Impressions", type: "number" },
    { key: "clicks", label: "Clicks", type: "number" },
    { key: "leadsGenerated", label: "Leads Generated", type: "number", column: "leads" },
    { key: "blockers", label: "Blockers", type: "textarea", column: "blockers" },
    { key: "planTomorrow", label: "Plan for Tomorrow", type: "textarea" },
  ],
  FINANCE: [
    { key: "collections", label: "Collections", type: "currency", required: true, column: "collections" },
    { key: "paymentsMade", label: "Payments Made", type: "currency" },
    { key: "expenses", label: "Expenses", type: "currency" },
    { key: "pendingInvoices", label: "Pending Invoices", type: "number" },
    { key: "cashPosition", label: "Cash Position", type: "currency" },
    { key: "blockers", label: "Blockers", type: "textarea", column: "blockers" },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
};

function getFieldValue(report, key, column) {
  if (!report) return null;
  const data = report.data || {};

  if (data[key] != null && data[key] !== "") return data[key];
  if (report[key] != null && report[key] !== "") return report[key];

  if (column && report[column] != null && report[column] !== "") return report[column];
  if (column && data[column] != null && data[column] !== "") return data[column];

  const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (data[snake] != null && data[snake] !== "") return data[snake];
  if (report[snake] != null && report[snake] !== "") return report[snake];

  return null;
}

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
      const res = await api.get(`/reports/${id}`);
      const data = res.data?.report || res.data || res;
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

  const dept = report.department || "DEVELOPMENT";
  const deptFields = FORM_FIELDS[dept] || FORM_FIELDS.DEVELOPMENT;

  // Split into metric/number fields and text/narrative fields
  const metricFields = [];
  const textFields = [];
  let blockersValue = report.blockers || report.data?.blockers || null;

  deptFields.forEach((f) => {
    const val = getFieldValue(report, f.key, f.column);
    if (f.key === "blockers") {
      if (val) blockersValue = val;
      return;
    }

    if (val != null && val !== "") {
      if (f.type === "textarea" || f.type === "text") {
        textFields.push({ label: f.label, value: val });
      } else if (f.type === "currency") {
        metricFields.push({ label: f.label, value: formatUSD(val) });
      } else {
        metricFields.push({ label: f.label, value: Number(val).toLocaleString() });
      }
    }
  });

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
          / {report.department_title || report.head_title || dept}
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
                  {report.department_title || report.head_title || dept} — Daily Report
                </h1>
                <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                  {report.report_date ? format(new Date(report.report_date), "EEEE, dd MMMM yyyy") : "—"}
                </div>
              </div>
              <StatusBadge status={report.status} />
            </div>

            <hr className="divider" />

            {/* Metrics grid */}
            {metricFields.length > 0 && (
              <div className="report-section" style={{ marginBottom: 24 }}>
                <div className="report-section__title" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 12 }}>
                  Daily Metrics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px 20px" }}>
                  {metricFields.map((f) => (
                    <div key={f.label} className="report-field" style={{ background: "var(--color-bg)", padding: "12px 16px", borderRadius: "var(--radius-sm)" }}>
                      <div className="report-field__label" style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>{f.label}</div>
                      <div className="report-field__value" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text / narrative fields (Tasks completed, Tasks in progress, Plan for tomorrow, Notes) */}
            {textFields.map((f) => (
              <div key={f.label} className="report-section" style={{ marginBottom: 22 }}>
                <div className="report-section__title" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.7, background: "var(--color-bg)", padding: "14px 16px", borderRadius: "var(--radius-sm)", color: "var(--color-text)" }}>
                  {f.value}
                </div>
              </div>
            ))}

            {/* Blockers */}
            {blockersValue && blockersValue.trim() && (
              <div className="report-section" style={{ marginBottom: 22 }}>
                <div className="report-section__title" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-pending-text, #c27a13)", marginBottom: 8 }}>
                  Blockers
                </div>
                <div className="blocker-card" style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", background: "var(--color-pending-bg, #fef3c7)", border: "1px solid #fde68a" }}>
                  <div className="blocker-card__text" style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--color-text)" }}>{blockersValue}</div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {report.attachments?.length > 0 && (
              <div className="report-section">
                <div className="report-section__title" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Attachments
                </div>
                <AttachmentList attachments={report.attachments} />
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
              <div className="report-field__label" style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>Current Status</div>
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
              <div className="report-field__label" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Submitted By</div>
              <div style={{ fontWeight: 600 }}>{report.head_title || report.department_title || "—"}</div>
            </div>
            <div className="report-field" style={{ marginTop: 10 }}>
              <div className="report-field__label" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Submitted At</div>
              <div style={{ fontSize: 13 }}>
                {report.created_at ? format(new Date(report.created_at), "dd MMM yyyy, HH:mm") : "—"}
              </div>
            </div>
            {report.reviewed_at && (
              <div className="report-field" style={{ marginTop: 10 }}>
                <div className="report-field__label" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Reviewed At</div>
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