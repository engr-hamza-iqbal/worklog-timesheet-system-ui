import React from 'react';
import {
  Check,
  RotateCcw,
  Search,
  X,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
} from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Pagination from '../../../components/Pagination.jsx';

export default function TimesheetsReviewTab({
  filters,
  handleFilterChange,
  clearFilters,
  hasActiveFilters,
  selected,
  setSelected,
  approve,
  approveOne,
  setReturningId,
  loading,
  isProcessing,
  selectedHours,
  filteredEntries,
  allEntries,
  paginatedEntries,
  toggleAllEntries,
  entrySortField,
  entrySortOrder,
  toggleEntrySort,
  page,
  setPage,
  itemsPerPage,
}) {
  return (
    <div className="space-y-4">
      {/* ── Integrated Table & Filter Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Toolbar & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee
              </label>
              <div className="relative">
                <input
                  placeholder="Search name or email..."
                  value={filters.userQuery}
                  onChange={(e) => handleFilterChange("userQuery", e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl pl-8 pr-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                />
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project
              </label>
              <input
                placeholder="Search project..."
                value={filters.projectQuery}
                onChange={(e) => handleFilterChange("projectQuery", e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                aria-label="Start date"
                type="date"
                max={filters.endDate || undefined}
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  aria-label="End date"
                  type="date"
                  min={filters.startDate || undefined}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 inline-flex items-center justify-center gap-1 hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs"
                  title="Clear active filters"
                >
                  <X size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Batch Actions & Selection Header */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                disabled={!selected.length || loading || Boolean(isProcessing)}
                onClick={approve}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Check size={13} />}
                <span>{isProcessing ? "Processing..." : `Approve Selected ${selected.length > 0 ? `(${selected.length})` : ""}`}</span>
              </button>
              {selected.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  Selected volume: <strong className="text-slate-800">{selectedHours} hrs</strong>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <div className="text-xs text-slate-500">
                Filtered <strong className="text-slate-800">{filteredEntries.length}</strong> of{" "}
                <strong className="text-slate-800">{allEntries.length}</strong> entries
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <ResizableTh className="p-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all entries on this page"
                    disabled={loading || !paginatedEntries.length}
                    checked={
                      paginatedEntries.length > 0 &&
                      paginatedEntries.every((entry) => selected.includes(entry.id))
                    }
                    onChange={(e) => toggleAllEntries(e.target.checked)}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleEntrySort('employee')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    {entrySortField === 'employee' ? (
                      entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleEntrySort('workDate')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {entrySortField === 'workDate' ? (
                      entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleEntrySort('project')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Project</span>
                    {entrySortField === 'project' ? (
                      entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleEntrySort('durationMinutes')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hours</span>
                    {entrySortField === 'durationMinutes' ? (
                      entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleEntrySort('description')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Description</span>
                    {entrySortField === 'description' ? (
                      entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
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
              {loading && !allEntries.length ? (
                <TableRow hover={false}>
                  <TableTd colSpan={7} align="center" className="p-12 text-center text-xs text-slate-500">
                    <Loader2 className="mx-auto mb-2 animate-spin text-slate-400" size={20} />
                    <span>Loading submitted entries...</span>
                  </TableTd>
                </TableRow>
              ) : paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id} className="align-middle">
                    <TableTd className="p-3.5 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selected.includes(entry.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, entry.id]
                              : selected.filter((id) => id !== entry.id)
                          )
                        }
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </TableTd>
                    <TableTd className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{entry.user?.name}</div>
                      <div className="text-[11px] text-slate-400">{entry.user?.email}</div>
                    </TableTd>
                    <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-700 text-xs font-medium">
                      {entry.workDate}
                    </TableTd>
                    <TableTd className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium">
                        <FolderOpen size={12} className="text-slate-500" />
                        <span title={entry.project?.name}>{entry.project?.name}</span>
                      </span>
                    </TableTd>
                    <TableTd className="px-4 py-3.5 whitespace-nowrap text-xs">
                      <span className="font-bold text-slate-900">{entry.durationHours}</span>
                      <span className="text-slate-400 ml-1">hrs</span>
                    </TableTd>
                    <TableTd className="px-4 py-3.5 text-slate-600 text-xs min-w-[180px] max-w-sm whitespace-normal">
                      <div className="line-clamp-2" title={entry.description}>{entry.description}</div>
                    </TableTd>
                    <TableTd className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Approve entry"
                          onClick={() => approveOne(entry.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          title="Return with comment"
                          onClick={() => setReturningId(entry.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </TableTd>
                  </TableRow>
                ))
              ) : (
                <TableRow hover={false}>
                  <TableTd colSpan={7} align="center" className="p-10 text-center text-xs text-slate-500">
                    {hasActiveFilters
                      ? "No submitted entries match the active filters."
                      : "No submitted entries pending review."}
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredEntries.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
