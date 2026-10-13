import React from 'react';

export default function StatusAndTimeliness({ analytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Review Status & Time-Off Card */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Review Status &amp; Time-Off</h2>
            <p className="text-[11px] text-slate-500">Lifecycle state distribution of recorded hours and leave</p>
          </div>
          {analytics.timeOff?.length > 0 && (
            <span className="self-start sm:self-auto text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
              {analytics.timeOff.reduce((acc, t) => acc + (t.days || 0), 0)} leave days
            </span>
          )}
        </div>

        {/* Status pills / progress meters */}
        <div className="space-y-2.5 sm:space-y-3">
          {(analytics.statusBreakdown || []).map((sb) => {
            const statusColors = {
              APPROVED: { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              SUBMITTED: { bg: 'bg-gradient-to-r from-indigo-500 to-blue-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              DRAFT: { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', light: 'bg-slate-50 text-slate-700 border-slate-200' },
              RETURNED: { bg: 'bg-gradient-to-r from-rose-500 to-red-500', light: 'bg-rose-50 text-rose-700 border-rose-200' },
            };
            const colors = statusColors[sb.status] || { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', light: 'bg-slate-50 text-slate-700 border-slate-200' };
            const totalHrs = (analytics.statusBreakdown || []).reduce((acc, x) => acc + Number(x.hours || 0), 0);
            const pct = totalHrs > 0 ? ((Number(sb.hours || 0) / totalHrs) * 100).toFixed(1) : 0;

            return (
              <div key={sb.status} className="p-2 sm:p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-1.5 gap-1">
                  <span className="font-semibold text-slate-800">{sb.status}</span>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-mono text-slate-900 font-bold">{Number(sb.hours || 0).toFixed(1)} hrs</span>
                    <span className="text-slate-400 text-[10px] sm:text-[11px]">({sb.entries || 0} entries &bull; {pct}%)</span>
                  </div>
                </div>
                {/* 2-Layer Progress Bar: Inactive Grey Track with Vibrant Gradient Active Line */}
                <div className="relative w-full bg-slate-100 rounded-full h-2.5 p-0.5 overflow-hidden border border-slate-200/60 shadow-inner">
                  <div
                    className={`h-full ${colors.bg} rounded-full transition-all duration-700 shadow-xs relative`}
                    style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Time Off breakdown */}
          {analytics.timeOff && analytics.timeOff.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Time-Off Requests:</span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {analytics.timeOff.map((t) => (
                  <span key={t.status} className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {t.status}: <strong className="text-slate-900">{t.days}d</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Submission Timeliness Card */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Submission Timeliness</h2>
            <p className="text-[11px] text-slate-500">How promptly work logs are submitted after execution</p>
          </div>
          <span className={`self-start sm:self-auto text-xs font-mono font-bold px-2 py-0.5 rounded border ${(analytics.submissionTimeliness?.overall?.onTimePercentage ?? 100) >= 80
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
            {analytics.submissionTimeliness?.overall?.onTimePercentage ?? 100}% on-time
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">Avg Lag</div>
            <div className="mt-1 text-base sm:text-xl font-bold text-slate-900 font-mono">
              {analytics.submissionTimeliness?.overall?.avgLagDays ?? 0} <span className="text-[10px] sm:text-xs font-normal text-slate-500">days</span>
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">On-Time</div>
            <div className="mt-1 text-base sm:text-xl font-bold text-emerald-600 font-mono">
              {analytics.submissionTimeliness?.overall?.onTimeCount ?? 0}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
            <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">Late (&gt;2d)</div>
            <div className="mt-1 text-base sm:text-xl font-bold text-rose-600 font-mono">
              {analytics.submissionTimeliness?.overall?.lateCount ?? 0}
            </div>
          </div>
        </div>

        {/* By-person top late submitters */}
        <div className="overflow-y-auto max-h-40 [scrollbar-width:thin] space-y-1.5">
          {(analytics.submissionTimeliness?.byPerson || []).slice(0, 5).map((person) => (
            <div key={person.userId} className="flex items-center justify-between text-xs py-1 px-1.5 sm:px-2 rounded hover:bg-slate-50 gap-2">
              <span className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[140px]">{person.name}</span>
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] shrink-0">
                <span className="text-slate-500">{person.avgLagDays}d lag</span>
                <span className={person.lateCount > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                  {person.onTimePercentage}% on-time
                </span>
              </div>
            </div>
          ))}
          {(!analytics.submissionTimeliness?.byPerson || analytics.submissionTimeliness.byPerson.length === 0) && (
            <div className="text-center text-xs text-slate-400 py-3">No submission history in range.</div>
          )}
        </div>
      </section>
    </div>
  );
}
