import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';

export default function BlockersRadar({ blockers = [] }) {
  const hasBlockers = blockers && blockers.length > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${hasBlockers ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {hasBlockers ? <AlertOctagon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-white tracking-tight text-base">
              Executive Blockers Radar
            </h3>
            <p className="text-xs text-slate-400">
              Company-wide operational hurdles requiring CEO intervention
            </p>
          </div>
        </div>

        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
          hasBlockers
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {hasBlockers ? `${blockers.length} Active Blocker${blockers.length > 1 ? 's' : ''}` : 'Zero Blockers'}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {hasBlockers ? (
          blockers.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-950/20 p-3.5 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.title || item.department}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium">
                  {item.blocker}
                </p>
              </div>

              {item.reportId && (
                <Link
                  to={`/reports/${item.reportId}`}
                  className="self-end sm:self-auto shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <span>Resolve / View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-slate-800/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mb-2" />
            <p className="text-sm font-medium text-slate-300">All Departments Clear</p>
            <p className="text-xs text-slate-500 mt-0.5">No critical engineering, sales, or finance blockers reported for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
