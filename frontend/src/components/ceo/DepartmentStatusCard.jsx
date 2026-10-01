import React from "react";
import StatusBadge from "../shared/StatusBadge";
import { departmentLabel } from "../../auth/roles";

const DEPT_ICONS = {
  DEVELOPMENT: "💻",
  SALES:       "📊",
  MARKETING:   "📣",
  FINANCE:     "💰",
};

export default function DepartmentStatusCard({ dept, onClick }) {
  return (
    <div
      className="dept-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${dept.title} department status`}
      onKeyDown={(e) => e.key === "Enter" && onClick && onClick()}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{DEPT_ICONS[dept.department] || "📋"}</span>
        <span className="dept-card__name">{departmentLabel(dept.department)}</span>
      </div>
      <StatusBadge status={dept.status === "MISSING" ? "MISSING" : dept.status} />
    </div>
  );
}
