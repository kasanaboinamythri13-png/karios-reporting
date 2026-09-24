// ============================================================
// Karios Frontend — CEO API Service
// Connects to /api/dashboard/overview and /api/reports
// Includes intelligent offline/mock fallback for standalone demo & testing
// ============================================================
import { api } from './client.js';

// Realistic sample seed data for standalone testing & fallback
const FALLBACK_OVERVIEW = {
  date: new Date().toISOString().split('T')[0],
  summary: {
    totalDepartments: 4,
    submittedCount: 3,
    missingCount: 1,
    approvedCount: 1,
    rejectedCount: 0,
    submissionRate: 75,
  },
  departments: [
    {
      department: 'DEVELOPMENT',
      title: 'Developer Head',
      status: 'SUBMITTED',
      reportId: 'rep-dev-001',
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      highlights: 'Sprint 24 deployed to staging. Core auth endpoints completed.',
    },
    {
      department: 'SALES',
      title: 'Sales Head',
      status: 'APPROVED',
      reportId: 'rep-sales-001',
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      highlights: 'Closed 2 enterprise deals. $32,500 pipeline added.',
    },
    {
      department: 'MARKETING',
      title: 'Marketing Head',
      status: 'MISSING',
      reportId: null,
      submittedAt: null,
      highlights: 'No submission recorded today yet.',
    },
    {
      department: 'FINANCE',
      title: 'Finance Head',
      status: 'SUBMITTED',
      reportId: 'rep-fin-001',
      submittedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      highlights: 'Monthly runway audit done. $54,000 collections reconciled.',
    },
  ],
  blockers: [
    {
      id: 'blk-1',
      department: 'DEVELOPMENT',
      title: 'Developer Head',
      blocker: 'Staging environment AWS RDS connection timeouts during load testing.',
      severity: 'HIGH',
      reportId: 'rep-dev-001',
    },
  ],
  metrics: {
    revenueClosed: 48500,
    marketingSpend: 14200,
    leads: 142,
    collections: 54000,
    currency: '$',
  },
};

const FALLBACK_REPORTS = [
  {
    id: 'rep-dev-001',
    department: 'DEVELOPMENT',
    title: 'Developer Head',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    blockers: 'Staging environment AWS RDS connection timeouts during load testing.',
    revenueClosed: 0,
    marketingSpend: 0,
    leads: 0,
    collections: 0,
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
    data: {
      tasksCompleted: 'Completed Sprint 24 deployment to staging; resolved 4 critical P1 security bugs in auth gateway.',
      inProgress: 'Migrating legacy session tokens to Firebase Admin SDK tokens.',
      prsMerged: 8,
      deployments: 'Staging v2.4.1 deployed successfully',
      uptime: '99.98%',
    },
    attachments: [
      { name: 'staging_load_test_results.pdf', size: '2.4 MB', type: 'application/pdf', url: '#' },
      { name: 'service_latency_chart.png', size: '640 KB', type: 'image/png', url: '#' },
    ],
  },
  {
    id: 'rep-sales-001',
    department: 'SALES',
    title: 'Sales Head',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    blockers: 'Legal review bottleneck delaying Acme Corp enterprise contract signing.',
    revenueClosed: 48500,
    marketingSpend: 0,
    leads: 18,
    collections: 0,
    reviewedBy: 'CEO',
    reviewedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    reviewComment: 'Outstanding revenue numbers today. Legal has been instructed to expedite Acme Corp.',
    data: {
      pipelineDeals: 'Acme Corp ($35,000), Global Logistics ($13,500)',
      meetingsHeld: 9,
      newQuotesSent: 4,
      targetAttainment: '112% of weekly quota',
    },
    attachments: [
      { name: 'q3_sales_pipeline.pdf', size: '1.8 MB', type: 'application/pdf', url: '#' },
    ],
  },
  {
    id: 'rep-fin-001',
    department: 'FINANCE',
    title: 'Finance Head',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    blockers: 'Pending approval for international wire transfer gateway fees ($1,200).',
    revenueClosed: 0,
    marketingSpend: 0,
    leads: 0,
    collections: 54000,
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
    data: {
      dailyCollections: '$54,000 collected across 12 client accounts.',
      burnRateMonthly: '$82,000',
      runwayMonths: '18.4 months',
      taxCompliance: 'Q2 GST & TDS filings submitted to auditor.',
    },
    attachments: [
      { name: 'collections_breakdown.pdf', size: '890 KB', type: 'application/pdf', url: '#' },
    ],
  },
  {
    id: 'rep-mktg-yesterday',
    department: 'MARKETING',
    title: 'Marketing Head',
    reportDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    blockers: 'None',
    revenueClosed: 0,
    marketingSpend: 14200,
    leads: 142,
    collections: 0,
    reviewedBy: 'CEO',
    reviewedAt: new Date(Date.now() - 80000000).toISOString(),
    reviewComment: 'Good lead volume. Keep monitoring CPA on LinkedIn ads.',
    data: {
      campaignsRunning: 'Google Search Q3 Enterprise, LinkedIn B2B Founders campaign',
      cpa: '$100.00 per qualified lead',
      impressions: '145,000 impressions',
      ctr: '3.4%',
    },
    attachments: [],
  },
];

// In-memory mock storage during session for interactive testing if backend is in progress
let localReports = [...FALLBACK_REPORTS];
let localOverview = JSON.parse(JSON.stringify(FALLBACK_OVERVIEW));

export async function fetchCeoOverview(date) {
  try {
    const queryParam = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await api(`/dashboard/overview${queryParam}`);
    if (res && res.summary) return res;
  } catch (err) {
    console.warn('[CEO API] Real API unavailable, using high-fidelity fallback:', err.message);
  }

  // Update fallback date if specific date requested
  return {
    ...localOverview,
    date: date || localOverview.date,
  };
}

export async function fetchReportsList(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.department && filters.department !== 'ALL') params.append('department', filters.department);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.date) params.append('date', filters.date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await api(`/reports${qs}`);
    if (Array.isArray(res)) return res;
    if (res?.reports) return res.reports;
  } catch (err) {
    console.warn('[CEO API] Real reports list unavailable, using high-fidelity fallback:', err.message);
  }

  // Filter local reports
  return localReports.filter((rep) => {
    if (filters.department && filters.department !== 'ALL' && rep.department !== filters.department) {
      return false;
    }
    if (filters.status && filters.status !== 'ALL' && rep.status !== filters.status) {
      return false;
    }
    if (filters.date && rep.reportDate !== filters.date) {
      return false;
    }
    return true;
  });
}

export async function fetchReportDetails(id) {
  try {
    const res = await api(`/reports/${id}`);
    if (res && res.id) return res;
  } catch (err) {
    console.warn('[CEO API] Real report detail unavailable, using fallback:', err.message);
  }

  const found = localReports.find((r) => r.id === id);
  if (found) return found;

  // Return a generic report if ID doesn't match
  return {
    id,
    department: 'DEVELOPMENT',
    title: 'Developer Head',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    blockers: 'None reported.',
    revenueClosed: 0,
    marketingSpend: 0,
    leads: 0,
    collections: 0,
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null,
    data: {
      tasksCompleted: 'Sprint deliverables in review.',
      inProgress: 'Security scanning and code optimization.',
    },
    attachments: [],
  };
}

export async function submitCeoReview(reportId, { status, comment }) {
  try {
    const res = await api(`/reports/${reportId}/review`, {
      method: 'POST',
      body: { status, comment },
    });
    if (res) return res;
  } catch (err) {
    console.warn('[CEO API] Real review endpoint unavailable, applying to local state:', err.message);
  }

  // Apply to local in-memory store so UI reacts immediately
  localReports = localReports.map((r) => {
    if (r.id === reportId) {
      return {
        ...r,
        status,
        reviewedBy: 'CEO',
        reviewedAt: new Date().toISOString(),
        reviewComment: comment || null,
      };
    }
    return r;
  });

  // Update overview department status
  localOverview.departments = localOverview.departments.map((d) => {
    if (d.reportId === reportId) {
      return { ...d, status };
    }
    return d;
  });

  // Recount approvals
  const approved = localReports.filter((r) => r.status === 'APPROVED').length;
  const rejected = localReports.filter((r) => r.status === 'REJECTED').length;
  localOverview.summary.approvedCount = approved;
  localOverview.summary.rejectedCount = rejected;

  return {
    message: `Report ${status.toLowerCase()} successfully`,
    report: localReports.find((r) => r.id === reportId),
  };
}
