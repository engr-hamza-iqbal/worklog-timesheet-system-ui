import React from 'react';
import { RefreshCw, CheckCircle2, Loader2, Download } from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { exportToCsv } from '../utils/reportUtils.js';

export default function WhoIsAwayTab({
  awayDate,
  setAwayDate,
  loadWhoIsAway,
  loadingAway,
  awayData,
  awayPage,
  setAwayPage,
  awayPageSize,
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-end justify-between gap-3.5 sm:gap-4 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadWhoIsAway(awayDate);
          }}
          className="flex flex-col sm:flex-row sm:items-end gap-2.5 sm:gap-3 w-full sm:w-auto"
        >
          <label className="text-xs font-medium text-slate-600 w-full sm:w-auto">
            <span>Target Date</span>
            <input
              type="date"
              value={awayDate}
              onChange={(e) => setAwayDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-slate-900 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loadingAway || !awayDate}
            className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 font-medium w-full sm:w-auto"
          >
            {loadingAway && <Loader2 size={13} className="animate-spin shrink-0" />}
            View Absences
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
              Approved: {awayData?.totalAway ?? 0}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              Pending: {awayData?.totalPending ?? 0}
            </span>
          </div>
          {awayData?.awayUsers?.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportToCsv(
                  `who_is_away_${awayDate}`,
                  [
                    { key: 'userName', label: 'Employee' },
                    { key: 'userEmail', label: 'Email' },
                    { key: 'timeOffType', label: 'Leave Type' },
                    { key: 'startDate', label: 'Start Date' },
                    { key: 'endDate', label: 'End Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'reason', label: 'Reason' },
                  ],
                  awayData.awayUsers
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-200 bg-slate-50 px-3.5 sm:px-5 py-3.5 sm:py-4 shrink-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Employees Away on {awayDate}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Staff members scheduled on approved time off or pending review on this date.
          </p>
        </div>

        {loadingAway ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={20} />
            Loading absences...
          </div>
        ) : awayData?.awayUsers?.length ? (
          <>
            <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
              <Table>
                <TableHead>
                  <tr>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Employee</span></ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Email</span></ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Leave Type</span></ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Period</span></ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Status</span></ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap"><span>Reason</span></ResizableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {awayData.awayUsers
                    .slice((awayPage - 1) * awayPageSize, awayPage * awayPageSize)
                    .map((item) => (
                      <TableRow key={item.requestId + item.userId}>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-medium text-slate-800 text-xs whitespace-nowrap">{item.userName}</TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-slate-600 text-xs whitespace-nowrap">{item.userEmail}</TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-semibold text-slate-700 text-xs whitespace-nowrap">{item.timeOffType}</TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-slate-600 text-xs whitespace-nowrap">
                          {item.startDate} &rarr; {item.endDate}
                        </TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status === 'APPROVED'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-slate-500 text-xs max-w-xs truncate" title={item.reason}>
                          {item.reason}
                        </TableTd>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="shrink-0 border-t border-slate-200/90">
              <Pagination
                currentPage={awayPage}
                totalItems={awayData.awayUsers.length}
                itemsPerPage={awayPageSize}
                onPageChange={setAwayPage}
                className="border-t-0"
              />
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
            No employees are on time off on {awayDate}.
          </div>
        )}
      </div>
    </section>
  );
}
