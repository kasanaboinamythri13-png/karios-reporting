// src/services/mockData.js
// In-memory mock store that simulates the backend.
// All state is keyed in sessionStorage so it survives hot-reload but resets on tab close.
//
// Pre-seeded state (today IST):
//   DEVELOPMENT  → SUBMITTED  (pending review)
//   SALES        → SUBMITTED  (pending review)
//   MARKETING    → SUBMITTED  (pending review)
//   FINANCE      → MISSING    (not submitted yet)

const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const NOW   = new Date().toISOString();

// ── Helper ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ── Initial seed ──────────────────────────────────────────────────────────────
const SEED_REPORTS = [
  {
    id: "rpt-dev-001",
    department: "DEVELOPMENT",
    department_title: "Developer Head",
    head_title: "Developer Head",
    report_date: TODAY,
    status: "SUBMITTED",
    summary: "Fixed 3 critical bugs in the payment gateway. Deployed staging build v2.4.1. Completed sprint review session.",
    blockers: "Third-party payment SDK has a rate-limit issue on sandbox — waiting for vendor response.",
    tasks_completed: 8,
    tasks_in_progress: 3,
    bugs_fixed: 3,
    deployments: 1,
    prs_merged: 5,
    code_reviews: 7,
    sprint_progress: 72,
    tech_debt_notes: "Refactoring of auth module deferred to next sprint.",
    user_id: "mock-dev-id",
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
    attachments: [],
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "rpt-sales-001",
    department: "SALES",
    department_title: "Sales Head",
    head_title: "Sales Head",
    report_date: TODAY,
    status: "SUBMITTED",
    summary: "Closed 2 enterprise deals. Had 6 discovery calls. Pipeline is healthy for Q4.",
    blockers: "",
    calls_made: 14,
    meetings_held: 6,
    leads: 11,
    proposals_sent: 4,
    deals_closed: 2,
    revenue_closed: 48000,
    pipeline_value: 320000,
    follow_ups_pending: 9,
    user_id: "mock-sales-id",
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
    attachments: [],
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "rpt-mktg-001",
    department: "MARKETING",
    department_title: "Marketing Head",
    head_title: "Marketing Head",
    report_date: TODAY,
    status: "SUBMITTED",
    summary: "Launched new LinkedIn ad campaign. Published 3 blog posts. Email open rate 28%.",
    blockers: "Design team bandwidth is tight — campaign assets delayed by 2 days.",
    campaigns_active: 4,
    impressions: 52000,
    clicks: 3100,
    conversions: 87,
    leads: 43,
    marketing_spend: 6200,
    social_posts: 5,
    email_campaigns: 2,
    user_id: "mock-mktg-id",
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
    attachments: [],
    created_at: NOW,
    updated_at: NOW,
  },
  // FINANCE is intentionally MISSING today
];

// Past approved/rejected reports for history
const SEED_PAST_REPORTS = [
  {
    id: "rpt-dev-past-01",
    department: "DEVELOPMENT",
    department_title: "Developer Head",
    head_title: "Developer Head",
    report_date: "2026-09-27",
    status: "APPROVED",
    summary: "Completed API integration for mobile app.",
    blockers: "",
    tasks_completed: 6,
    tasks_in_progress: 2,
    bugs_fixed: 1,
    deployments: 0,
    prs_merged: 3,
    code_reviews: 4,
    sprint_progress: 55,
    tech_debt_notes: "",
    user_id: "mock-dev-id",
    reviewed_by: "mock-ceo-id",
    reviewed_at: "2026-09-27T14:30:00.000Z",
    review_comment: "Great progress on the API!",
    attachments: [],
    created_at: "2026-09-27T09:00:00.000Z",
    updated_at: "2026-09-27T14:30:00.000Z",
  },
  {
    id: "rpt-sales-past-01",
    department: "SALES",
    department_title: "Sales Head",
    head_title: "Sales Head",
    report_date: "2026-09-27",
    status: "REJECTED",
    summary: "Missed 3 follow-ups.",
    blockers: "",
    calls_made: 5,
    meetings_held: 2,
    leads: 3,
    proposals_sent: 1,
    deals_closed: 0,
    revenue_closed: 0,
    pipeline_value: 180000,
    follow_ups_pending: 12,
    user_id: "mock-sales-id",
    reviewed_by: "mock-ceo-id",
    reviewed_at: "2026-09-27T15:00:00.000Z",
    review_comment: "Report incomplete — please include missed follow-up reasons.",
    attachments: [],
    created_at: "2026-09-27T09:30:00.000Z",
    updated_at: "2026-09-27T15:00:00.000Z",
  },
  {
    id: "rpt-fin-past-01",
    department: "FINANCE",
    department_title: "Finance Head",
    head_title: "Finance Head",
    report_date: "2026-09-27",
    status: "APPROVED",
    summary: "All invoices processed. Monthly close on track.",
    blockers: "",
    revenue: 125000,
    expenses: 72000,
    net_profit: 53000,
    collections: 38000,
    pending_invoices: 4,
    payments_made: 29000,
    budget_variance: -2,
    user_id: "mock-fin-id",
    reviewed_by: "mock-ceo-id",
    reviewed_at: "2026-09-27T16:00:00.000Z",
    review_comment: "Solid numbers!",
    attachments: [],
    created_at: "2026-09-27T10:00:00.000Z",
    updated_at: "2026-09-27T16:00:00.000Z",
  },
];

const NOTIFICATIONS_SEED = [
  {
    id: "notif-001",
    type: "REPORT_REVIEW",
    title: "Daily Report Approved",
    body: "CEO approved your DEVELOPMENT daily report.",
    report_id: "rpt-dev-past-01",
    read_at: "2026-09-27T14:35:00.000Z",
    created_at: "2026-09-27T14:30:00.000Z",
    user_id: "mock-dev-id",
  },
  {
    id: "notif-002",
    type: "REPORT_REVIEW",
    title: "Daily Report Rejected",
    body: "CEO rejected your SALES daily report. Reason: Report incomplete — please include missed follow-up reasons.",
    report_id: "rpt-sales-past-01",
    read_at: null,
    created_at: "2026-09-27T15:00:00.000Z",
    user_id: "mock-sales-id",
  },
];

// ── Store (sessionStorage for persistence across HMR) ─────────────────────────
function loadStore() {
  try {
    const stored = sessionStorage.getItem("karios_mock_store");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    reports:       [...SEED_REPORTS, ...SEED_PAST_REPORTS],
    notifications: [...NOTIFICATIONS_SEED],
  };
}

function saveStore(store) {
  sessionStorage.setItem("karios_mock_store", JSON.stringify(store));
}

let STORE = loadStore();
const persist = () => saveStore(STORE);

// ── Public API ─────────────────────────────────────────────────────────────────

export function resetStore() {
  STORE = {
    reports:       [...SEED_REPORTS, ...SEED_PAST_REPORTS],
    notifications: [...NOTIFICATIONS_SEED],
  };
  persist();
}

// GET /api/dashboard/overview?date=
export function mockGetOverview(date) {
  const d = date || TODAY;
  const DEPARTMENTS = [
    { department: "DEVELOPMENT", title: "Developer Head" },
    { department: "SALES",       title: "Sales Head" },
    { department: "MARKETING",   title: "Marketing Head" },
    { department: "FINANCE",     title: "Finance Head" },
  ];

  const todayReports = STORE.reports.filter((r) => r.report_date === d);
  const byDept = Object.fromEntries(todayReports.map((r) => [r.department, r]));

  let submittedCount = 0, approvedCount = 0, rejectedCount = 0;
  const blockersList = [];
  let totalRevenueClosed = 0, totalMarketingSpend = 0, totalLeads = 0, totalCollections = 0;

  const departments = DEPARTMENTS.map((dept) => {
    const r = byDept[dept.department];
    if (r) {
      submittedCount++;
      if (r.status === "APPROVED")  approvedCount++;
      if (r.status === "REJECTED")  rejectedCount++;
      if (r.blockers && r.blockers.trim()) {
        blockersList.push({ department: dept.department, title: dept.title, blocker: r.blockers.trim(), reportId: r.id });
      }
      totalRevenueClosed  += Number(r.revenue_closed  || 0);
      totalMarketingSpend += Number(r.marketing_spend || 0);
      totalLeads          += Number(r.leads           || 0);
      totalCollections    += Number(r.collections     || 0);
      return { department: dept.department, title: dept.title, status: r.status, reportId: r.id, submittedAt: r.created_at };
    }
    return { department: dept.department, title: dept.title, status: "MISSING", reportId: null, submittedAt: null };
  });

  return {
    date: d,
    summary: {
      totalDepartments: 4,
      submittedCount,
      missingCount: 4 - submittedCount,
      approvedCount,
      rejectedCount,
      submissionRate: Math.round((submittedCount / 4) * 100),
    },
    departments,
    blockers: blockersList,
    metrics: {
      revenueClosed:  totalRevenueClosed,
      marketingSpend: totalMarketingSpend,
      leads:          totalLeads,
      collections:    totalCollections,
      currency: "$",
    },
  };
}

// GET /api/reports  (CEO sees all; Head sees own dept)
export function mockListReports(currentUser, filters = {}) {
  let list = [...STORE.reports];
  if (currentUser.role !== "CEO") {
    list = list.filter((r) => r.user_id === currentUser.id);
  }
  if (filters.department) list = list.filter((r) => r.department === filters.department);
  if (filters.status)     list = list.filter((r) => r.status     === filters.status);
  if (filters.from)       list = list.filter((r) => r.report_date >= filters.from);
  if (filters.to)         list = list.filter((r) => r.report_date <= filters.to);
  return list.sort((a, b) => b.report_date.localeCompare(a.report_date));
}

// GET /api/reports/today
export function mockGetToday(currentUser) {
  return STORE.reports.find((r) => r.report_date === TODAY && r.user_id === currentUser.id) || null;
}

// GET /api/reports/:id
export function mockGetReport(id) {
  return STORE.reports.find((r) => r.id === id) || null;
}

// POST /api/reports
export function mockSubmitReport(currentUser, body) {
  const existing = mockGetToday(currentUser);
  if (existing) throw { status: 409, message: "You have already submitted a report today." };
  const report = {
    id: "rpt-" + uid(),
    department: currentUser.department,
    department_title: currentUser.title,
    head_title: currentUser.title,
    report_date: TODAY,
    status: "SUBMITTED",
    user_id: currentUser.id,
    reviewed_by: null, reviewed_at: null, review_comment: null,
    attachments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...body,
  };
  STORE.reports.unshift(report);

  // Notify CEO
  STORE.notifications.unshift({
    id: "notif-" + uid(),
    type: "REPORT_SUBMITTED",
    title: `New Daily Report: ${currentUser.department}`,
    body: `${currentUser.title || currentUser.department + " Head"} submitted their daily report.`,
    report_id: report.id,
    read_at: null,
    created_at: report.created_at,
    user_id: "mock-ceo-id",
  });

  persist();
  return report;
}

// PATCH /api/reports/:id
export function mockUpdateReport(id, currentUser, body) {
  const idx = STORE.reports.findIndex((r) => r.id === id);
  if (idx < 0) throw { status: 404, message: "Report not found." };
  const r = STORE.reports[idx];
  if (r.user_id !== currentUser.id) throw { status: 403, message: "Forbidden." };
  if (r.status === "APPROVED")      throw { status: 403, message: "Cannot edit an approved report." };
  if (r.report_date !== TODAY)      throw { status: 403, message: "Can only edit today's report." };
  const now = new Date().toISOString();
  STORE.reports[idx] = { ...r, ...body, status: "SUBMITTED", updated_at: now };

  // Notify CEO of update
  STORE.notifications.unshift({
    id: "notif-" + uid(),
    type: "REPORT_SUBMITTED",
    title: `Report Updated: ${r.department}`,
    body: `${currentUser.title || r.department + " Head"} updated their daily report.`,
    report_id: r.id,
    read_at: null,
    created_at: now,
    user_id: "mock-ceo-id",
  });

  persist();
  return STORE.reports[idx];
}

// POST /api/reports/:id/review  { status, comment }
export function mockReviewReport(id, ceoUser, { status, comment }) {
  if (!["APPROVED", "REJECTED"].includes(status)) throw { status: 400, message: "Invalid status." };

  const idx = STORE.reports.findIndex((r) => r.id === id);
  if (idx < 0) throw { status: 404, message: "Report not found." };

  const now = new Date().toISOString();
  STORE.reports[idx] = {
    ...STORE.reports[idx],
    status,
    reviewed_by: ceoUser.id,
    reviewed_at: now,
    review_comment: comment || null,
    updated_at: now,
  };

  // Create notification for the head
  const r = STORE.reports[idx];
  const notif = {
    id: "notif-" + uid(),
    type: "REPORT_REVIEW",
    title: `Daily Report ${status === "APPROVED" ? "Approved" : "Rejected"}`,
    body: status === "APPROVED"
      ? (comment ? `CEO approved your ${r.department} daily report. Note: ${comment}` : `CEO approved your ${r.department} daily report.`)
      : (comment ? `CEO rejected your ${r.department} daily report. Reason: ${comment}` : `CEO rejected your ${r.department} daily report.`),
    report_id: id,
    read_at: null,
    created_at: now,
    user_id: r.user_id,
  };
  STORE.notifications.unshift(notif);
  persist();
  return STORE.reports[idx];
}

// GET /api/notifications
export function mockGetNotifications(currentUser) {
  return STORE.notifications
    .filter((n) => n.user_id === currentUser.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// PATCH /api/notifications/:id/read
export function mockMarkNotifRead(id, currentUser) {
  const idx = STORE.notifications.findIndex((n) => n.id === id && n.user_id === currentUser.id);
  if (idx >= 0) {
    STORE.notifications[idx].read_at = new Date().toISOString();
    persist();
  }
}