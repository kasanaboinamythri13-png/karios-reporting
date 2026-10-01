// src/components/ceo/ReviewModal.jsx
import React, { useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { departmentLabel } from "../../auth/roles";

export default function ReviewModal({ report, onClose, onReviewed }) {
  const [status,  setStatus]  = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!status) { toast.error("Select decision", "Choose Approve or Reject."); return; }
    if (status === "REJECTED" && !comment.trim()) {
      toast.error("Comment required", "Please enter a comment explaining why the report was rejected.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/reports/${report.id}/review`, { status, comment: comment.trim() || null });
      if (status === "REJECTED") {
        toast.error(
          "Report Rejected",
          `The ${report.department?.toLowerCase()} report has been rejected.`
        );
      } else {
        toast.success(
          "Report Approved",
          `The ${report.department?.toLowerCase()} report has been approved.`
        );
      }
      onReviewed();
      onClose();
    } catch (err) {
      toast.error("Review failed", err?.response?.data?.error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title" id="review-modal-title">Review Report</h2>
          <button
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            id="review-modal-close"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* Department info */}
          <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-sm)", padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>Department</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{departmentLabel(report.department)}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
              {new Date(report.report_date || report.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </div>
          </div>

          {/* Decision buttons */}
          <div className="form-group">
            <label className="form-label">Decision *</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className={`btn ${status === "APPROVED" ? "btn--success" : "btn--outline"}`}
                style={{ flex: 1 }}
                onClick={() => setStatus("APPROVED")}
                id="review-approve-btn"
              >
                ✓ Approve
              </button>
              <button
                className={`btn ${status === "REJECTED" ? "btn--danger" : "btn--outline"}`}
                style={{ flex: 1 }}
                onClick={() => setStatus("REJECTED")}
                id="review-reject-btn"
              >
                ✕ Reject
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label" htmlFor="review-comment">
              Comment
            </label>
            <textarea
              id="review-comment"
              className="form-textarea"
              rows={4}
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--outline" onClick={onClose} id="review-cancel-btn">
            Cancel
          </button>
          <button
            className={`btn ${status === "REJECTED" ? "btn--danger" : "btn--primary"}`}
            onClick={handleSubmit}
            disabled={loading || !status}
            id="review-submit-btn"
          >
            {loading ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
