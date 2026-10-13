import React from 'react';
import { RefreshCw, Send, CheckCircle2, Loader2, Download } from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Pagination from '../../../components/Pagination.jsx';
import { exportToCsv } from '../utils/reportUtils.js';

export default function MissingTimesheetsTab({
  missingDate,
  setMissingDate,
  loadMissing,
  loadingMissing,
  missingData,
  selectedUsers,
  toggleSelectUser,
  toggleSelectAll,
  handleChaseSubmit,
  chasing,
  isAdmin,
  missingPage,
  setMissingPage,
  missingPageSize,
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-end justify-between gap-3.5 sm:gap-4 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadMissing(missingDate);
          }}
          className="flex flex-col sm:flex-row sm:items-end gap-2.5 sm:gap-3 w-full sm:w-auto"
        >
          <label className="text-xs font-medium text-slate-600 w-full sm:w-auto">
            <span>Working Day</span>
            <input
              type="date"
              value={missingDate}
              onChange={(e) => setMissingDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-slate-900 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loadingMissing || !missingDate}
            className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-medium"
          >
            {loadingMissing && <Loader2 size={13} className="animate-spin shrink-0" />}
            Check date
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {missingData?.employees?.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportToCsv(
                  `missing_timesheets_${missingDate}`,
                  [
                    { key: 'userName', label: 'Employee Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'chasedToday', label: 'Chased Today', value: (row) => (row.chasedToday ? 'Yes' : 'No') },
                  ],
                  missingData.employees
                )
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Download size={13} />
              Export CSV
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleChaseSubmit}
              disabled={chasing || !selectedUsers.length}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-red-800 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {chasing ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Send size={15} />}
              {chasing ? 'Sending...' : `Chase Selected (${selectedUsers.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 sm:px-5 py-3.5 sm:py-4 gap-2 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Employees with Missing Timesheets
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Active employees with 0 recorded hours on {missingDate}, excluding those with approved time off.
            </p>
          </div>
          {missingData?.employees?.length > 0 && isAdmin && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-slate-700 underline hover:text-slate-900 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {selectedUsers.length > 0 ? 'Deselect all' : 'Select all eligible'}
            </button>
          )}
        </div>

        {loadingMissing ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={20} />
            Checking timesheets and approved leave...
          </div>
        ) : missingData?.employees?.length ? (
          <>
            <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
              <Table>
                <TableHead>
                  <tr>
                    {isAdmin && (
                      <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 w-12 text-xs">
                        <span>Select</span>
                      </ResizableTh>
                    )}
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap">
                      <span>Employee</span>
                    </ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap">
                      <span>Email</span>
                    </ResizableTh>
                    <ResizableTh className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap">
                      <span>Chase Status</span>
                    </ResizableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {missingData.employees
                    .slice((missingPage - 1) * missingPageSize, missingPage * missingPageSize)
                    .map((emp) => (
                      <TableRow key={emp.userId}>
                        {isAdmin && (
                          <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 w-12">
                            <input
                              type="checkbox"
                              disabled={emp.chasedToday}
                              checked={selectedUsers.includes(emp.userId)}
                              onChange={() => toggleSelectUser(emp.userId)}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:opacity-40"
                            />
                          </TableTd>
                        )}
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-medium text-slate-800 text-xs whitespace-nowrap">
                          <span title={emp.userName}>{emp.userName}</span>
                        </TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-slate-600 text-xs whitespace-nowrap">
                          <span title={emp.email}>{emp.email}</span>
                        </TableTd>
                        <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs whitespace-nowrap">
                          {emp.chasedToday ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              Reminded today
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                              Unsent
                            </span>
                          )}
                        </TableTd>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="shrink-0 border-t border-slate-200/90">
              <Pagination
                currentPage={missingPage}
                totalItems={missingData.employees.length}
                itemsPerPage={missingPageSize}
                onPageChange={setMissingPage}
                className="border-t-0"
              />
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
            All active staff either recorded time or had approved time off on this date.
          </div>
        )}
      </div>
    </section>
  );
}
