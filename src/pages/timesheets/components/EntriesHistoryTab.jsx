import React from 'react';
import { Search, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import { statusVariant } from '../utils/timesheetUtils.jsx';

export default function EntriesHistoryTab({
  historySearch,
  isFiltering,
  handleFilterSearchChange,
  historyProject,
  handleFilterProjectChange,
  allDropdownProjects,
  historyStatus,
  handleFilterStatusChange,
  isSilentFetching,
  toggleHistorySort,
  historySortField,
  historySortOrder,
  historyLoading,
  paginatedHistory,
  user,
  editEntry,
  removeEntry,
  historyPage,
  historyTotal,
  itemsPerPage,
  handleHistoryPageChange,
}) {
  return (
    <div className="space-y-4">
      {/* History Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 w-full md:flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <input
              type="text"
              placeholder="Search description or project..."
              value={historySearch}
              disabled={isFiltering}
              onChange={(e) => handleFilterSearchChange(e.target.value)}
              className={`w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none transition ${isFiltering ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
                }`}
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Project filter */}
          <select
            value={historyProject}
            disabled={isFiltering}
            onChange={(e) => handleFilterProjectChange(e.target.value)}
            className={`w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:border-slate-900 focus:outline-none transition ${isFiltering ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer"
              }`}
          >
            <option value="">All Projects</option>
            {allDropdownProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status filter buttons */}
          <div className="flex overflow-x-auto no-scrollbar rounded-lg border border-slate-200 text-xs w-full sm:w-auto shrink-0 whitespace-nowrap">
            {["ALL", "DRAFT", "SUBMITTED", "APPROVED", "RETURNED"].map((st) => {
              const isActive = historyStatus === st;
              const isOtherDisabled = isFiltering && !isActive;
              return (
                <button
                  key={st}
                  type="button"
                  disabled={isOtherDisabled}
                  onClick={() => handleFilterStatusChange(st)}
                  className={`px-2.5 py-1 transition font-medium ${isActive
                    ? "bg-slate-900 text-white cursor-default"
                    : isOtherDisabled
                      ? "bg-white text-slate-300 opacity-40 cursor-not-allowed border-slate-100"
                      : "bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                    }`}
                >
                  {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historical Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs relative">
        {isSilentFetching && (
          <div className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs px-4 py-1.5 flex items-center gap-2 font-medium">
            <Loader2 size={12} className="animate-spin text-slate-500" />
            <span>Updating entries...</span>
          </div>
        )}
        <Table>
          <TableHead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] select-none">
              <ResizableTh
                onClick={() => toggleHistorySort('workDate')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {historySortField === 'workDate' ? (
                    historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleHistorySort('project')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Project</span>
                  {historySortField === 'project' ? (
                    historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleHistorySort('durationHours')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Hours</span>
                  {historySortField === 'durationHours' ? (
                    historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleHistorySort('description')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Description</span>
                  {historySortField === 'description' ? (
                    historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleHistorySort('status')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {historySortField === 'status' ? (
                    historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                className="py-3 px-4 text-right"
                resizable={false}
              >
                <span>Actions</span>
              </ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {historyLoading && !isSilentFetching ? (
              <TableRow hover={false}>
                <TableTd colSpan={6} align="center" className="p-8 text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                    <span>Loading entries...</span>
                  </div>
                </TableTd>
              </TableRow>
            ) : paginatedHistory.length ? (
              paginatedHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {entry.workDate}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    <span>{entry.project?.name}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {entry.durationHours}h
                  </td>
                  <td className="py-3 px-4 text-slate-600 min-w-[200px] max-w-md">
                    <div className="line-clamp-2" title={entry.description}>{entry.description}</div>
                    {entry.returnComment && (
                      <div className="mt-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 leading-normal" title={`Reason returned: ${entry.returnComment}`}>
                        <strong>Reason:</strong> {entry.returnComment}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={statusVariant[entry.status]} label={entry.status} />
                      {entry.status !== 'RETURNED' && (entry.wasReturned || entry.returnComment) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="This entry was previously returned and re-submitted">
                          Re-submitted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {(() => {
                      const isOwnEntry = Boolean(user?.id && entry.userId === user.id);
                      const canEdit = isOwnEntry && entry.status === "DRAFT";
                      const canDelete = isOwnEntry && entry.status === "DRAFT";

                      if (!canEdit && !canDelete) return null;

                      return (
                        <div className="inline-flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => editEntry(entry)}
                              className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.id)}
                              className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </TableRow>
              ))
            ) : (
              <TableRow hover={false}>
                <TableTd colSpan={6} align="center" className="p-8 text-xs text-slate-400">
                  No time entries match the selected filters.
                </TableTd>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <Pagination
          currentPage={historyPage}
          totalItems={historyTotal}
          itemsPerPage={itemsPerPage}
          onPageChange={handleHistoryPageChange}
        />
      </div>
    </div>
  );
}
