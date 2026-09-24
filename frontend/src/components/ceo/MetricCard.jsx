import React from 'react';

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive,
  accentColor = 'indigo',
}) {
  const accentClasses = {
    indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    violet: 'from-violet-500/10 to-violet-500/0 text-violet-400 border-violet-500/20 group-hover:border-violet-500/40',
    cyan: 'from-cyan-500/10 to-cyan-500/0 text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/40',
  };

  const currentAccent = accentClasses[accentColor] || accentClasses.indigo;

  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-slate-900/80 p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${currentAccent}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        {Icon && (
          <div className="rounded-lg bg-slate-800/80 p-2 text-slate-300 group-hover:text-white transition-colors">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-400 truncate">
          {subtext}
        </p>
      )}

      {/* Subtle bottom glow line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
    </div>
  );
}
