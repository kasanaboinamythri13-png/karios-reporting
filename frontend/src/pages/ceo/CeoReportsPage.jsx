// src/pages/ceo/CeoReportsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/shared/StatusBadge";
import { format } from "date-fns";

const DEPARTMENTS = [
  { value: "",            label: "All Departments" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "SALES",       label: "Sales" },
  { value: "MARKETING",   label: "Marketing" },
  { value: "FINANCE",     label: "Finance" },
];

const DEPT_BADGE_STYLE = {
  DEVELOPMENT: { bg: "#f3e8ff", color: "#6b21a8", border: "#d8b4fe" },
  SALES:       { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  MARKETING:   { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  FINANCE:     { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
};

export default function CeoReportsPage() {
  const [reports,      setReports]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("ALL");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [department,   setDepartment]   = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");

  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (department) params.append("department", department);
      if (dateFrom)   params.append("from",       dateFrom);
      if (dateTo)     params.append("to",         dateTo);
      const { data } = await api.get(`/reports?${params}`);
      setReports(Array.isArray(data) ? data : data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [department, dateFrom, dateTo]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Counts for top pill tabs
  const counts = useMemo(() => {
    return {
      all:       reports.length,
      pending:   reports.filter((r) => r.status === "SUBMITTED").length,
      approved:  reports.filter((r) => r.status === "APPROVED").length,
      rejected:  reports.filter((r) => r.status === "REJECTED").length,
    };
  }, [reports]);

  // Filtered reports by Tab and Search Query
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Tab filter
      if (activeTab === "PENDING"  && r.status !== "SUBMITTED") return false;
      if (activeTab === "APPROVED" && r.status !== "APPROVED")  return false;
      if (activeTab === "REJECTED" && r.status !== "REJECTED")  return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dept = (r.department || "").toLowerCase();
        const head = (r.head_title || r.submitted_by || "").toLowerCase();
        const tasks = (r.tasks_completed || r.summary || r.notes || "").toLowerCase();
        const id = (r.id || "").toLowerCase();
        if (!dept.includes(q) && !head.includes(q) && !tasks.includes(q) && !id.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [reports, activeTab, searchQuery]);

  const hasActiveFilters = department || dateFrom || dateTo || searchQuery || activeTab !== "ALL";

  const clearAllFilters = () => {
    setActiveTab("ALL");
    setSearchQuery("");
    setDepartment("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="page-content">
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.4px" }}>
          Reports
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0 }}>
          Company-wide daily submissions, reviews, and approval history
        </p>
      </div>

      {/* ── Top Filter Pills (Karios Inventory style) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        {[
          { key: "ALL",      label: "All",       count: counts.all },
          { key: "PENDING",  label: "Pending",   count: counts.pending },
          { key: "APPROVED", label: "Approved",  count: counts.approved },
          { key: "REJECTED", label: "Rejected",  count: counts.rejected },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 16px",
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid",
                borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                background: isActive ? "var(--color-primary)" : "var(--color-card)",
                color: isActive ? "#ffffff" : "var(--color-text)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 12,
                  background: isActive ? "rgba(255, 255, 255, 0.25)" : "var(--color-bg)",
                  color: isActive ? "#ffffff" : "var(--color-text-muted)",
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls Bar (Image 3 style) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "14px 18px",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          marginBottom: 20,
        }}
      >
        {/* Search input with search icon */}
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 34, height: 38, fontSize: 13, width: "100%" }}
            placeholder="Search reports by department, head, tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="reports-search-input"
          />
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Department dropdown */}
          <select
            className="form-select"
            style={{ height: 38, fontSize: 13, minWidth: 160 }}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            id="filter-department"
            aria-label="Filter by department"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Date range inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="date"
              className="form-input"
              style={{ height: 38, fontSize: 12, width: 135 }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              id="filter-from"
              title="From date"
            />
            <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ height: 38, fontSize: 12, width: 135 }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              id="filter-to"
              title="To date"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={clearAllFilters}
              style={{ fontSize: 12, color: "var(--color-danger)" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table (Karios Inventory style) ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="loading-overlay" style={{ minHeight: 240 }}>
            <div className="loading-spinner" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <div className="empty-state__icon">📄</div>
            <div className="empty-state__title">No reports found</div>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {hasActiveFilters
                ? "Try clearing or adjusting the search and filters above."
                : "No reports have been submitted yet."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={clearAllFilters}
                style={{ marginTop: 14 }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table table--clickable">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Date</th>
                  <th style={{ width: 160 }}>Department</th>
                  <th style={{ width: 160 }}>Submitted By</th>
                  <th>Key Highlights / Tasks</th>
                  <th style={{ width: 150 }}>Status</th>
                  <th style={{ width: 160 }}>Reviewed</th>
                  <th style={{ width: 90, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const deptStyle = DEPT_BADGE_STYLE[r.department] || {
                    bg: "#f3f4f6", color: "#374151", border: "#e5e7eb",
                  };
                  const dateStr = r.report_date
                    ? format(new Date(r.report_date), "dd MMM yyyy")
                    : "—";

                  const previewText = r.summary || r.tasks_completed || r.notes || "Report submitted";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/ceo/reports/${r.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/ceo/reports/${r.id}`)}
                    >
                      {/* Date */}
                      <td style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)" }}>
                        {dateStr}
                      </td>

                      {/* Department pill badge */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 700,
                            background: deptStyle.bg,
                            color: deptStyle.color,
                            border: `1px solid ${deptStyle.border}`,
                          }}
                        >
                          {r.department_title || r.department}
                        </span>
                      </td>

                      {/* Submitted By */}
                      <td style={{ fontSize: 13, fontWeight: 600 }}>
                        {r.head_title || r.submitted_by || "—"}
                      </td>

                      {/* Highlights / Tasks */}
                      <td
                        style={{
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 13,
                          color: "var(--color-text)",
                        }}
                        title={previewText}
                      >
                        {previewText}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Reviewed Info */}
                      <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {r.reviewed_at
                          ? format(new Date(r.reviewed_at), "dd MMM, HH:mm")
                          : <span style={{ opacity: 0.5 }}>Pending review</span>}
                      </td>

                      {/* Action button */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ceo/reports/${r.id}`);
                          }}
                          style={{ color: "var(--color-primary)", fontWeight: 600 }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
