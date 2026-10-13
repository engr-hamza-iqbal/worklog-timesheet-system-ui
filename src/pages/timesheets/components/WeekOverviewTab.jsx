import React from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import { addDays, mondayOf, iso, statusVariant } from '../utils/timesheetUtils.jsx';

export default function WeekOverviewTab({
  weekStart,
  setWeekStart,
  weekEnd,
  totalWeekMinutes,
  allWeekEditableEntries,
  isProcessing,
  submitEntries,
  dayMap,
}) {
  return (
    <div className="space-y-6">
      {/* Week Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(mondayOf(new Date()))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-900">
            {iso(weekStart)} &rarr; {iso(weekEnd)}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-600">
            Week Total: <span className="text-slate-900 font-bold">{totalWeekMinutes / 60}h</span>
          </span>

          {allWeekEditableEntries.length > 0 && (
            <button
              type="button"
              disabled={Boolean(isProcessing)}
              onClick={() =>
                submitEntries(
                  allWeekEditableEntries.map((e) => e.id),
                  "whole week entries",
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Submit Whole Week ({allWeekEditableEntries.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => {
          const date = iso(addDays(weekStart, index));
          const day = dayMap[date] || { date, totalMinutes: 0, entries: [] };
          const editable = day.entries.filter(
            (entry) => entry.status === "DRAFT" || entry.status === "RETURNED",
          );
          return (
            <section
              key={date}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs min-w-0 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {addDays(weekStart, index).toLocaleDateString(undefined, {
                        weekday: "short",
                      })}
                    </h3>
                    <p className="text-[11px] text-slate-400">{date}</p>
                  </div>
                  <span
                    className={`text-xs font-bold ${day.totalMinutes >= 1440 ? "text-rose-600" : "text-slate-700"
                      }`}
                  >
                    {day.totalMinutes / 60} / 24h
                  </span>
                </div>

                {day.timeOff && (
                  <div className={`mb-3 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium flex items-center justify-between ${day.timeOff.status === 'PENDING'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-sky-200 bg-sky-50 text-sky-800'
                    }`}>
                    <span>
                      {day.timeOff.status === 'PENDING' ? 'Pending Leave: ' : 'Absence: '}
                      {day.timeOff.type?.name}
                    </span>
                    {day.timeOff.status === 'PENDING' && (
                      <span className="text-[10px] text-amber-600 font-normal">Pending</span>
                    )}
                  </div>
                )}

                <div className="space-y-2.5 min-h-16 max-h-64 overflow-y-auto pr-1">
                  {day.entries.length ? (
                    day.entries.map((entry) => (
                      <div key={entry.id} className="border-t border-slate-100 pt-2 text-xs">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-medium text-slate-900 truncate">
                            {entry.project?.name}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant={statusVariant[entry.status]} label={entry.status} />
                            {entry.status !== 'RETURNED' && (entry.wasReturned || entry.returnComment) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="This entry was previously returned and re-submitted">
                                Re-submitted
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {entry.durationHours}h · {entry.description}
                        </p>
                        {entry.returnComment && (
                          <p className="mt-1 text-[11px] text-rose-600 bg-rose-50 rounded p-1.5">
                            <span className="font-semibold">{entry.status === 'RETURNED' ? 'Returned reason:' : 'Previous return reason:'}</span> {entry.returnComment}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 py-3 text-center">No entries logged</p>
                  )}
                </div>
              </div>

              {editable.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(isProcessing)}
                  onClick={() => submitEntries(editable.map((e) => e.id), "day entries")}
                  className="mt-3 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium inline-flex justify-center items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Send size={12} />
                  <span>Submit Day</span>
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
