import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  TrendingUp,
  Megaphone,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const DEPT_META = {
  DEVELOPMENT: {
    icon: Code2,
    badgeColor: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    description: 'Engineering, deployments, tech blockers',
  },
  SALES: {
    icon: TrendingUp,
    badgeColor: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    description: 'Pipeline, meetings, revenue closed ($)',
  },
  MARKETING: {
    icon: Megaphone,
    badgeColor: 'text-violet-400 border-violet-500/20 bg-violet-500/10',
    description: 'Campaigns, lead volume, marketing spend ($)',
  },
  FINANCE: {
    icon: Landmark,
    badgeColor: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    description: 'Collections ($), burn rate, monthly runway',
  },
};

export default function DepartmentStatusCard({ department, onQuickReview }) {
  const meta = DEPT_META[department.department] || {
    icon: Code2,
    badgeColor: 'text-slate-400 border-slate-500/20 bg-slate-500/10',
    description: 'Daily operational status',
  };

  const Icon = meta.icon;
  const isSubmitted = department.status === 'SUBMITTED';
  const isApproved = department.status === 'APPROVED';
  const isRejected = department.status === 'REJECTED';
  const isMissing = department.status === 'MISSING';

  return (
    <div className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
      isMissing
        ? 'border-rose-900/40 bg-rose-950/10 hover:border-rose-800/60'
        : isApproved
        ? 'border-emerald-900/40 bg-slate-900/90 hover:border-emerald-800/50'
        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:shadow-lg'
    }`}>
      {/* Top Department Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${meta.badgeColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-tight text-base">
                {department.title}
              </h3>
              <p className="text-xs text-slate-400">{meta.description}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isSubmitted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Submitted
              </span>
            )}
            {isApproved && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Approved
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Revision Req.
              </span>
            )}
            {isMissing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                Missing
              </span>
            )}
          </div>
        </div>

        {/* Highlights / Description */}
        <div className="mt-4 rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-slate-300">
          {department.highlights ? (
            <p className="line-clamp-2">{department.highlights}</p>
          ) : isMissing ? (
            <p className="text-rose-400/90 italic flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Department has not submitted report for today yet.
            </p>
          ) : (
            <p className="text-slate-400">Report details logged for review.</p>
          )}
        </div>
      </div>

      {/* Footer Info & Action Button */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          {department.submittedAt ? (
            <>
              <Clock className="w-3 h-3 text-slate-500" />
              <span>
                {new Date(department.submittedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}{' '}
                IST
              </span>
            </>
          ) : (
            <span className="text-slate-500 font-mono">No timestamp</span>
          )}
        </div>

        <div>
          {department.reportId ? (
            <div className="flex items-center gap-2">
              {onQuickReview && isSubmitted && (
                <button
                  onClick={() => onQuickReview(department.reportId)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm cursor-pointer"
                >
                  Quick Review
                </button>
              )}
              <Link
                to={`/reports/${department.reportId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-all"
              >
                <span>Full Report</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <span className="text-xs text-rose-400/80 font-medium px-2 py-1 rounded bg-rose-500/10">
              Pending Head
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
