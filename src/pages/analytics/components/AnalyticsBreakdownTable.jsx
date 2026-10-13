import React from 'react';
import {
  Table as TableIcon, Search, X, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import Pagination from '../../../components/Pagination.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';

export default function AnalyticsBreakdownTable({
  analytics,
  breakdownTab,
  handleTabChange,
  tableSearch,
  setTableSearch,
  setCurrentPage,
  handleTableSort,
  sortColumn,
  sortDirection,
  currentTableRows,
  currentPage,
  sortedAndFilteredRows,
  pageSize,
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/50 p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon size={16} className="text-indigo-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">Detailed Performance Breakdown</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on table column headers to sort ascending or descending. Use real-time search to filter.
          </p>
        </div>

        {/* Tab Selector & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs overflow-x-auto [scrollbar-width:none] touch-pan-x w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('employees')}
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition cursor-pointer text-xs ${breakdownTab === 'employees'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Team ({analytics?.employees?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('projects')}
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition cursor-pointer text-xs ${breakdownTab === 'projects'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Projects ({analytics?.projects?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('clients')}
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition cursor-pointer text-xs ${breakdownTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Clients ({analytics?.clients?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('timeliness')}
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition cursor-pointer text-xs ${breakdownTab === 'timeliness'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Timeliness ({analytics?.submissionTimeliness?.byPerson?.length || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Filter ${breakdownTab}...`}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table with Clickable Headers inside horizontal scroll wrapper */}
      <div className="overflow-x-auto flex-1 min-w-0">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh
                onClick={() => handleTableSort('label')}
                className="py-2.5 sm:py-3 px-3.5 sm:px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    {breakdownTab === 'employees'
                      ? 'Contributor Name'
                      : breakdownTab === 'projects'
                        ? 'Project Initiative'
                        : breakdownTab === 'timeliness'
                          ? 'Team Member'
                          : 'Client Organization'}
                  </span>
                  {sortColumn === 'label' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => handleTableSort('hours')}
                className="py-2.5 sm:py-3 px-3 sm:px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition text-right sm:text-left text-xs"
              >
                <div className="flex items-center justify-end sm:justify-start gap-1.5">
                  <span>
                    {breakdownTab === 'timeliness' ? 'Avg Lag (Days)' : 'Approved Hours'}
                  </span>
                  {sortColumn === 'hours' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => handleTableSort('share')}
                className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    {breakdownTab === 'timeliness' ? 'On-Time Submission Rate' : 'Share of Total Effort'}
                  </span>
                  {sortColumn === 'share' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => handleTableSort('badge')}
                className="py-2.5 sm:py-3 px-3.5 sm:px-5 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition text-xs"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Status / Tier</span>
                  {sortColumn === 'badge' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {currentTableRows.map((row) => (
              <TableRow key={row.id}>
                <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {row.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="truncate block max-w-[130px] sm:max-w-none text-xs" title={row.label}>{row.label}</span>
                      <span className="block sm:hidden text-[10px] text-slate-400 font-mono">
                        {breakdownTab === 'timeliness' ? `${row.share.toFixed(1)}% on-time` : `${row.share.toFixed(1)}% share`}
                      </span>
                    </div>
                  </div>
                </TableTd>
                <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono font-semibold text-slate-800 text-right sm:text-left text-xs whitespace-nowrap">
                  {breakdownTab === 'timeliness' ? (
                    <>
                      {row.hours.toFixed(1)} <span className="text-[10px] font-sans text-slate-400">days</span>
                    </>
                  ) : (
                    <>
                      {row.hours.toFixed(2)} <span className="text-[10px] font-sans text-slate-400">h</span>
                    </>
                  )}
                </TableTd>
                <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 hidden sm:table-cell text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs w-11 text-right">{row.share.toFixed(1)}%</span>
                    <div className="w-20 lg:w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${breakdownTab === 'timeliness' ? (row.share >= 80 ? 'bg-emerald-600' : 'bg-amber-500') : 'bg-indigo-600'} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.max(2, row.share))}%` }}
                      />
                    </div>
                  </div>
                </TableTd>
                <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 text-right whitespace-nowrap">
                  <span
                    className={`inline-block px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.badgeColor}`}
                  >
                    {row.badge}
                  </span>
                </TableTd>
              </TableRow>
            ))}
            {currentTableRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-xs text-slate-500">
                  No entries found matching your query "{tableSearch}".
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedAndFilteredRows.length}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}
