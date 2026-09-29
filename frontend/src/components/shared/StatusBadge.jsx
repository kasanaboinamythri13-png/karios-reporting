// src/components/shared/StatusBadge.jsx
import React from "react";

const STATUS_MAP = {
  APPROVED:  { cls: "badge--approved", label: "Approved",       dot: "#059669" },
  REJECTED:  { cls: "badge--rejected", label: "Rejected",       dot: "#dc2626" },
  SUBMITTED: { cls: "badge--submitted",label: "Pending review", dot: "#d97706" },
  MISSING:   { cls: "badge--missing",  label: "Not submitted",  dot: "#9ca3af" },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.MISSING;
  return (
    <span className={`badge ${cfg.cls}`}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}
