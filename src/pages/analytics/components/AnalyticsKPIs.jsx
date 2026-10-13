import React from 'react';
import { Clock, Users, Briefcase, Building } from 'lucide-react';

export default function AnalyticsKPIs({ summaryKPIs }) {
  if (!summaryKPIs) return null;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Approved</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {summaryKPIs.totalHours} <span className="text-xs font-medium text-slate-500">hrs</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Locked &amp; billable time</p>
      </div>

      <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Contributors</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {summaryKPIs.totalEmployees} <span className="text-xs font-medium text-slate-500">members</span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">With approved entries</p>
      </div>

      <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Project</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase size={16} />
            </div>
          </div>
          <div
            className="mt-2 text-base font-bold text-slate-900 break-words line-clamp-2"
            title={summaryKPIs.topProject?.name || ''}
          >
            {summaryKPIs.topProject ? summaryKPIs.topProject.name : '—'}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {summaryKPIs.topProject ? `${summaryKPIs.topProject.hours} hrs logged` : 'No data in range'}
        </p>
      </div>

      <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Client</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Building size={16} />
            </div>
          </div>
          <div
            className="mt-2 text-base font-bold text-slate-900 break-words line-clamp-2"
            title={summaryKPIs.topClient?.name || ''}
          >
            {summaryKPIs.topClient ? summaryKPIs.topClient.name : '—'}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {summaryKPIs.topClient ? `${summaryKPIs.topClient.hours} hrs logged` : 'No data in range'}
        </p>
      </div>
    </div>
  );
}
