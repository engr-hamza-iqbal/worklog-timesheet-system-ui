import React from 'react';
import { Clock, FileText, CalendarDays, CheckCircle2 } from 'lucide-react';

export default function ReviewKpiCards({
  activeTab,
  setActiveTab,
  allEntriesCount,
  totalSubmittedHours,
  canDecideTimeOff,
  timeOffRequestsCount,
  selectedCount,
  selectedHours,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        onClick={() => setActiveTab('timesheets')}
        className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
          activeTab === 'timesheets' ? "border-indigo-300 ring-2 ring-indigo-50" : "border-slate-200/90 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Timesheets Pending</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{allEntriesCount}</div>
            <div className="text-[11px] text-slate-400">Entries awaiting review</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Volume to Review</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalSubmittedHours} <span className="text-xs font-semibold text-slate-500">hrs</span></div>
            <div className="text-[11px] text-slate-400">Submitted work hours</div>
          </div>
        </div>
      </div>

      {canDecideTimeOff && (
        <div
          onClick={() => setActiveTab('timeoff')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
            activeTab === 'timeoff' ? "border-amber-300 ring-2 ring-amber-50" : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Time Off Requests</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{timeOffRequestsCount}</div>
              <div className="text-[11px] text-slate-400">Awaiting approval</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Selected for Approval</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {selectedCount} <span className="text-xs font-normal text-slate-400">({selectedHours}h)</span>
            </div>
            <div className="text-[11px] text-slate-400">Ready for batch action</div>
          </div>
        </div>
      </div>
    </div>
  );
}
