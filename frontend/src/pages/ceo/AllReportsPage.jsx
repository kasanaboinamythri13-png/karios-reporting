import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Code2,
  TrendingUp,
  Megaphone,
  Landmark,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { fetchReportsList } from '../../api/ceoApi.js';
import ReviewModal from '../../components/ceo/ReviewModal.jsx';

const DEPARTMENTS = [
  { key: 'ALL', label: 'All Departments' },
  { key: 'DEVELOPMENT', label: 'Developer Head', icon: Code2 },
  { key: 'SALES', label: 'Sales Head', icon: TrendingUp },
  { key: 'MARKETING', label: 'Marketing Head', icon: Megaphone },
  { key: 'FINANCE', label: 'Finance Head', icon: Landmark },
];

const STATUSES = [
  { key: 'ALL', label: 'All Statuses' },
  { key: 'SUBMITTED', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Revision Requested' },
];

export default function AllReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [reviewReportId, setReviewReportId] = useState(null);
  const [reviewDeptTitle, setReviewDeptTitle] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchReportsList({
        department: deptFilter,
        status: statusFilter,
        date: dateFilter || undefined,
      });
      setReports(res || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, statusFilter, dateFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Client-side text filter on tasks/highlights/blockers
  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = r.title?.toLowerCase().includes(q);
    const blockersMatch = r.blockers?.toLowerCase().includes(q);
    const tasksMatch = r.data?.tasksCompleted?.toLowerCase().includes(q);
    return titleMatch || blockersMatch || tasksMatch;
  });

  function handleQuickReview(report) {
    setReviewDeptTitle(report.title);
    setReviewReportId(report.id);
  }

  function handleReviewSuccess() {
    loadReports();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Company-Wide Report Audits
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CEO Oversight
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit history, track departmental progress, and conduct executive reviews
          </p>
        </div>

        <button
          onClick={loadReports}
          title="Refresh List"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Sync Feed</span>
        </button>
      </div>

      {/* Enterprise Filters & Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or blockers..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept.key} value={dept.key}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop High-Density Table (hidden on small mobile viewports) */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3.5">Department Head</th>
              <th className="px-4 py-3.5">Report Date (IST)</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Key Highlights</th>
              <th className="px-4 py-3.5">Blockers</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No reports match the selected filters.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="px-4 py-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>{report.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {report.reportDate}
                  </td>
                  <td className="px-4 py-3">
                    {report.status === 'SUBMITTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Submitted
                      </span>
                    )}
                    {report.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Approved
                      </span>
                    )}
                    {report.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <XCircle className="w-3 h-3" />
                        Revision Req.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-400">
                    {report.data?.tasksCompleted || report.data?.pipelineDeals || report.data?.campaignsRunning || report.data?.dailyCollections || 'No details provided'}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {report.blockers && report.blockers !== 'None' ? (
                      <span className="text-amber-400 font-medium truncate block">
                        ⚠️ {report.blockers}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {report.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleQuickReview(report)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card View (Touch-optimized for Android & Tablets) */}
      <div className="lg:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500 text-xs">
            No reports match the selected filters.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight">{report.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{report.reportDate}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {report.status === 'SUBMITTED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Submitted
                    </span>
                  )}
                  {report.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Approved
                    </span>
                  )}
                  {report.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Revision
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5 text-xs text-slate-300">
                <p className="line-clamp-2">
                  {report.data?.tasksCompleted || report.data?.pipelineDeals || report.data?.campaignsRunning || report.data?.dailyCollections || 'Operational submission logged.'}
                </p>
              </div>

              {/* Blockers alert if present */}
              {report.blockers && report.blockers !== 'None' && (
                <div className="flex items-start gap-1.5 text-xs text-amber-400 bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">{report.blockers}</p>
                </div>
              )}

              {/* Mobile Actions */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end gap-2">
                {report.status === 'SUBMITTED' && (
                  <button
                    onClick={() => handleQuickReview(report)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Quick Review
                  </button>
                )}
                <Link
                  to={`/reports/${report.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
                >
                  <span>Full Report</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewReportId && (
        <ReviewModal
          reportId={reviewReportId}
          departmentTitle={reviewDeptTitle}
          onClose={() => setReviewReportId(null)}
          onReviewed={handleReviewSuccess}
        />
      )}
    </div>
  );
}
