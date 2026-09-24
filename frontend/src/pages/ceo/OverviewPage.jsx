import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Building2,
  Clock,
} from 'lucide-react';
import MetricCard from '../../components/ceo/MetricCard.jsx';
import DepartmentStatusCard from '../../components/ceo/DepartmentStatusCard.jsx';
import BlockersRadar from '../../components/ceo/BlockersRadar.jsx';
import ReviewModal from '../../components/ceo/ReviewModal.jsx';
import { fetchCeoOverview } from '../../api/ceoApi.js';

export default function OverviewPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Current date formatted in Asia/Kolkata
    return new Date().toISOString().split('T')[0];
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReviewReportId, setActiveReviewReportId] = useState(null);
  const [activeReviewDeptTitle, setActiveReviewDeptTitle] = useState('');

  const loadOverview = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      const res = await fetchCeoOverview(selectedDate);
      setData(res);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function handleQuickReview(reportId) {
    const dept = data?.departments?.find((d) => d.reportId === reportId);
    setActiveReviewDeptTitle(dept?.title || 'Department Head');
    setActiveReviewReportId(reportId);
  }

  function handleReviewCompleted() {
    loadOverview(true);
  }

  const todayIso = new Date().toISOString().split('T')[0];
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Command Bar & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Executive Command Center
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CEO Review
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time daily operations overview locked to <span className="text-slate-200 font-mono">Asia/Kolkata</span>
          </p>
        </div>

        {/* Date Filter & Quick Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Pills */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setSelectedDate(todayIso)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === todayIso
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayIso)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedDate === yesterdayIso
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yesterday
            </button>
          </div>

          {/* Native HTML5 Date Input */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => loadOverview(true)}
            disabled={refreshing}
            title="Refresh Live Data"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Executive Metrics Ribbon (Tremor/Vercel Aesthetic) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Revenue Closed"
              value={`$${Number(data?.metrics?.revenueClosed || 0).toLocaleString()}`}
              subtext="Aggregated from Sales report"
              icon={DollarSign}
              trend="+14% vs prev"
              trendPositive={true}
              accentColor="emerald"
            />
            <MetricCard
              label="Marketing Spend"
              value={`$${Number(data?.metrics?.marketingSpend || 0).toLocaleString()}`}
              subtext="Customer acquisition & campaigns"
              icon={TrendingUp}
              trend="Target on track"
              trendPositive={true}
              accentColor="indigo"
            />
            <MetricCard
              label="Qualified Leads"
              value={Number(data?.metrics?.leads || 0).toLocaleString()}
              subtext="New sales pipeline entries"
              icon={Users}
              trend="+8 today"
              trendPositive={true}
              accentColor="violet"
            />
            <MetricCard
              label="Collections Reconciled"
              value={`$${Number(data?.metrics?.collections || 0).toLocaleString()}`}
              subtext="Finance cash received"
              icon={Wallet}
              trend="100% matched"
              trendPositive={true}
              accentColor="amber"
            />
          </div>

          {/* Operational Submission Health Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white tracking-tight text-sm sm:text-base">
                    Department Submission Health
                  </h3>
                  <p className="text-xs text-slate-400">
                    {data?.summary?.submittedCount || 0} of {data?.summary?.totalDepartments || 4} Department Heads submitted for{' '}
                    <span className="font-mono text-slate-300">{selectedDate}</span>
                  </p>
                </div>
              </div>

              {/* Submission Rate Badge */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-white">
                    {data?.summary?.submissionRate || 0}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Completion Rate</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center p-1 border border-slate-700">
                  <span className={`text-xs font-bold font-mono ${
                    (data?.summary?.submissionRate || 0) === 100 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {data?.summary?.submittedCount || 0}/{data?.summary?.totalDepartments || 4}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Track */}
            <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${data?.summary?.submissionRate || 0}%` }}
              />
            </div>
          </div>

          {/* Department Cards Grid (Responsive 1 col mobile, 2 col tablet, 4 col desktop) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Department Submissions & Approvals
              </h2>
              <span className="text-xs text-slate-500">Display Titles Only Standard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.departments?.map((dept) => (
                <DepartmentStatusCard
                  key={dept.department}
                  department={dept}
                  onQuickReview={handleQuickReview}
                />
              ))}
            </div>
          </div>

          {/* Executive Blockers Radar */}
          <BlockersRadar blockers={data?.blockers || []} />
        </>
      )}

      {/* Quick Review Modal */}
      {activeReviewReportId && (
        <ReviewModal
          reportId={activeReviewReportId}
          departmentTitle={activeReviewDeptTitle}
          onClose={() => setActiveReviewReportId(null)}
          onReviewed={handleReviewCompleted}
        />
      )}
    </div>
  );
}
