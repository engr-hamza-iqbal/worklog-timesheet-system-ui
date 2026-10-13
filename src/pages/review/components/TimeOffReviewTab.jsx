import React from 'react';
import {
  Check,
  X,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Badge from '../../../components/Badge.jsx';
import Pagination from '../../../components/Pagination.jsx';

export default function TimeOffReviewTab({
  timeOffRequests,
  paginatedTimeOff,
  timeOffSortField,
  timeOffSortOrder,
  toggleTimeOffSort,
  timeOffPage,
  setTimeOffPage,
  timeOffPerPage,
  handleApproveTimeOff,
  handleOpenDeclineTimeOff,
  isProcessing,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Time Off Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {timeOffRequests.length} pending request{timeOffRequests.length === 1 ? '' : 's'} awaiting approval
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh
                onClick={() => toggleTimeOffSort('employee')}
                className="px-5 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee</span>
                  {timeOffSortField === 'employee' ? (
                    timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleTimeOffSort('type')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Leave Type</span>
                  {timeOffSortField === 'type' ? (
                    timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleTimeOffSort('startDate')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Dates</span>
                  {timeOffSortField === 'startDate' ? (
                    timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleTimeOffSort('days')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Days</span>
                  {timeOffSortField === 'days' ? (
                    timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleTimeOffSort('reason')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Reason</span>
                  {timeOffSortField === 'reason' ? (
                    timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Actions</span>
              </ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {paginatedTimeOff.length ? (
              paginatedTimeOff.map((reqItem) => (
                <TableRow key={reqItem.id} className="align-middle">
                  <TableTd className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-xs">{reqItem.user?.name}</div>
                    <div className="text-[11px] text-slate-400">{reqItem.user?.email}</div>
                  </TableTd>
                  <TableTd className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-lg font-medium text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {reqItem.type?.name || 'Leave'}
                    </span>
                  </TableTd>
                  <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium text-xs">
                    {reqItem.startDate} &rarr; {reqItem.endDate}
                  </TableTd>
                  <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                    {reqItem.days?.length || 1} day{(reqItem.days?.length || 1) > 1 ? 's' : ''}
                  </TableTd>
                  <TableTd className="px-4 py-3.5 text-slate-600 min-w-[150px] max-w-xs whitespace-normal text-xs">
                    <div className="line-clamp-2" title={reqItem.reason}>{reqItem.reason || '—'}</div>
                  </TableTd>
                  <TableTd className="px-5 py-3.5 text-right whitespace-nowrap">
                    {reqItem.status === 'EXPIRED' || reqItem.startDate < new Date().toISOString().split('T')[0] ? (
                      <div className="flex items-center justify-end">
                        <Badge variant="expired" label="Expired" dot />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveTimeOff(reqItem)}
                          disabled={Boolean(isProcessing)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeclineTimeOff(reqItem)}
                          disabled={Boolean(isProcessing)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </TableTd>
                </TableRow>
              ))
            ) : (
              <TableRow hover={false}>
                <TableTd colSpan={6} align="center" className="p-10 text-center text-xs text-slate-500">
                  No pending time off requests awaiting decision.
                </TableTd>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={timeOffPage}
        totalItems={timeOffRequests.length}
        itemsPerPage={timeOffPerPage}
        onPageChange={setTimeOffPage}
      />
    </div>
  );
}
