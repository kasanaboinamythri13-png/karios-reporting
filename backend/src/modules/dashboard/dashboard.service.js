// ============================================================
// Karios Backend — CEO Dashboard Service
// Aggregates department report statuses, blockers, and KPI metrics
// ============================================================
import { query } from '../../config/db.js';
import { getTodayIST } from '../../utils/date.js';

const DEPARTMENTS = [
  { department: 'DEVELOPMENT', title: 'Developer Head', role: 'DEVELOPER_HEAD' },
  { department: 'SALES', title: 'Sales Head', role: 'SALES_HEAD' },
  { department: 'MARKETING', title: 'Marketing Head', role: 'MARKETING_HEAD' },
  { department: 'FINANCE', title: 'Finance Head', role: 'FINANCE_HEAD' },
];

export async function getExecutiveOverview(targetDate) {
  const dateStr = targetDate || getTodayIST();

  // 1. Fetch all reports for the given date
  const reportsResult = await query(
    `SELECT r.id, r.department, r.status, r.blockers, r.revenue_closed, 
            r.marketing_spend, r.leads, r.collections, r.created_at,
            u.title AS head_title
     FROM reports r
     JOIN users u ON r.user_id = u.id
     WHERE r.report_date = $1::date;`,
    [dateStr]
  );

  const reportsByDept = new Map();
  for (const row of reportsResult.rows) {
    reportsByDept.set(row.department, row);
  }

  // 2. Build department status array
  let submittedCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  const blockersList = [];

  let totalRevenueClosed = 0;
  let totalMarketingSpend = 0;
  let totalLeads = 0;
  let totalCollections = 0;

  const departmentStatuses = DEPARTMENTS.map((dept) => {
    const report = reportsByDept.get(dept.department);

    if (report) {
      submittedCount++;
      if (report.status === 'APPROVED') approvedCount++;
      if (report.status === 'REJECTED') rejectedCount++;

      if (report.blockers && report.blockers.trim().length > 0) {
        blockersList.push({
          department: dept.department,
          title: dept.title,
          blocker: report.blockers.trim(),
          reportId: report.id,
        });
      }

      totalRevenueClosed += Number(report.revenue_closed || 0);
      totalMarketingSpend += Number(report.marketing_spend || 0);
      totalLeads += Number(report.leads || 0);
      totalCollections += Number(report.collections || 0);

      return {
        department: dept.department,
        title: dept.title,
        status: report.status,
        reportId: report.id,
        submittedAt: report.created_at,
      };
    }

    return {
      department: dept.department,
      title: dept.title,
      status: 'MISSING',
      reportId: null,
      submittedAt: null,
    };
  });

  const missingCount = DEPARTMENTS.length - submittedCount;

  return {
    date: dateStr,
    summary: {
      totalDepartments: DEPARTMENTS.length,
      submittedCount,
      missingCount,
      approvedCount,
      rejectedCount,
      submissionRate: Math.round((submittedCount / DEPARTMENTS.length) * 100),
    },
    departments: departmentStatuses,
    blockers: blockersList,
    metrics: {
      revenueClosed: totalRevenueClosed,
      marketingSpend: totalMarketingSpend,
      leads: totalLeads,
      collections: totalCollections,
      currency: '$',
    },
  };
}
