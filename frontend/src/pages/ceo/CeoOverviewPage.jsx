// src/pages/ceo/CeoOverviewPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === "true";

const STAT_CONFIG = [
  {
    key: "submittedCount",
    label: "Reports submitted",
    getValue: (s) => `${s.submittedCount}/${s.totalDepartments}`,
    color: "var(--color-text)",
  },
  {
    key: "pending",
    label: "Pending review",
    getValue: (s) => s.submittedCount - s.approvedCount - s.rejectedCount,
    color: "#d97706",
  },
  {
    key: "approvedCount",
    label: "Approved",
    getValue: (s) => s.approvedCount,
    color: "#059669",
  },
  {
    key: "rejectedCount",
    label: "Rejected",
    getValue: (s) => s.rejectedCount,
    color: "#dc2626",
  },
];

const STATUS_LABEL = {
  APPROVED: { label: "Approved", color: "#059669", dot: "#059669", bg: "#d1fae5" },
  REJECTED: { label: "Rejected", color: "#dc2626", dot: "#dc2626", bg: "#fee2e2" },
  SUBMITTED: { label: "Pending review", color: "#d97706", dot: "#d97706", bg: "#fef3c7" },
  MISSING: { label: "Not submitted", color: "#6b7280", dot: "#9ca3af", bg: "#f3f4f6" },
};

export default function CeoOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
  );
  const navigate = useNavigate();

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dashboard/overview", { params: { date } });
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // Live polling every 30 s
  useEffect(() => {
    const id = setInterval(fetchOverview, 30_000);
    return () => clearInterval(id);
  }, [fetchOverview]);

  const handleResetMock = async () => {
    if (!USE_MOCK) return;
    const { resetStore } = await import("../../services/mockData.js");
    resetStore();
    fetchOverview();
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="page-content">
      {/* ── Page header ── */}
      <div
        style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 4 }}>
            Home / Overview
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {todayStr} &nbsp;·&nbsp; Asia/Kolkata timezone
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="date"
            className="form-input"
            style={{ width: "auto" }}
            value={date}
            max={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}
            onChange={(e) => setDate(e.target.value)}
            id="overview-date-picker"
            aria-label="Select date"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : !overview ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>
            Could not load overview
          </div>
          <p style={{ fontSize: 14 }}>Check your connection or API status.</p>
          <button className="btn btn--primary" style={{ marginTop: 20 }} onClick={fetchOverview}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* ── Submission summary stats ── */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {STAT_CONFIG.map((s) => (
              <div key={s.key} className="stat-card">
                <span className="stat-card__value" style={{ color: s.color }}>
                  {s.getValue(overview.summary)}
                </span>
                <span className="stat-card__label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Department Status Cards ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
              Department Status
            </h2>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {overview.summary.submittedCount} of {overview.summary.totalDepartments} submitted
            </span>
          </div>

          <div className="dept-grid" style={{ marginBottom: 28 }}>
            {overview.departments.map((dept) => {
              const statusCfg = STATUS_LABEL[dept.status] || STATUS_LABEL.MISSING;
              const isClickable = !!dept.reportId;

              return (
                <div
                  key={dept.department}
                  className="dept-card"
                  style={{
                    cursor: isClickable ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 112,
                    position: "relative",
                  }}
                  onClick={() => isClickable && navigate(`/ceo/reports/${dept.reportId}`)}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => e.key === "Enter" && isClickable && navigate(`/ceo/reports/${dept.reportId}`)}
                  aria-label={`${dept.title} — ${statusCfg.label}${isClickable ? ". Click to view report." : ""}`}
                  onMouseEnter={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>
                      {dept.title.replace(" Head", "")}
                    </div>
                  </div>

                  <div>
                    {/* Status badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 9px",
                        borderRadius: "var(--radius-sm)",
                        background: statusCfg.bg,
                        fontSize: 11,
                        fontWeight: 700,
                        color: statusCfg.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        border: `1px solid ${statusCfg.color}33`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: statusCfg.dot,
                          display: "inline-block",
                        }}
                      />
                      {statusCfg.label}
                    </div>

                    {/* Submitted time */}
                    <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 8 }}>
                      {dept.submittedAt
                        ? `Submitted ${new Date(dept.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : "Not submitted today"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}