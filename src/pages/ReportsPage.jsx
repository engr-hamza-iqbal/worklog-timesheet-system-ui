import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  RefreshCw,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Search,
  Check,
} from 'lucide-react';
import api from '../api/client.js';
import { chaseSchema } from '../validation/formSchemas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';
import Pagination from '../components/Pagination.jsx';
import SearchableSelect from '../components/SearchableSelect.jsx';

/**
 * Universal CSV export utility
 */
export function exportToCsv(filename, columns, rows) {
  if (!rows || rows.length === 0) return;

  const escapeCsv = (val) => {
    if (val == null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = columns.map((c) => escapeCsv(c.label)).join(',');
  const rowLines = rows.map((row) =>
    columns.map((c) => escapeCsv(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  );

  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function MetricTable({ title, rows = [], columns = [], filename, onExport, defaultPageSize = 10 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = defaultPageSize;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const valA = col.value ? col.value(a) : a[sortKey];
      const valB = col.value ? col.value(b) : b[sortKey];
      const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace(/[^0-9.-]/g, ''));
      const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
      return sortOrder === 'asc'
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }, [rows, columns, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil((sortedRows?.length || 0) / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  const handleCsvClick = () => {
    if (onExport) {
      onExport(sortedRows);
    } else {
      const defaultFilename = (filename || title || 'report').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      exportToCsv(defaultFilename, columns, sortedRows);
    }
  };

  return (
    <section className="flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0">
        <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{rows.length} rows</span>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={handleCsvClick}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              title="Export as CSV"
            >
              <Download size={12} />
              CSV
            </button>
          )}
        </div>
      </div>
      {sortedRows && sortedRows.length ? (
        <>
          <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
            <Table>
              <TableHead className="bg-slate-50/40">
                <tr>
                  {columns.map((column) => (
                    <ResizableTh
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="px-3.5 sm:px-5 py-2.5 sm:py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{column.label}</span>
                        {sortKey === column.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={12} className="text-indigo-600 shrink-0" />
                          ) : (
                            <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-50 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                  ))}
                </tr>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, index) => (
                  <TableRow
                    key={row.projectId || row.clientId || row.userId || row.periodDate || row.status || index}
                  >
                    {columns.map((column, idx) => (
                      <td
                        key={column.key}
                        className={`px-3.5 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap text-xs ${
                          idx === 0 ? 'font-medium text-slate-800' : 'text-slate-600'
                        }`}
                      >
                        <div title={String(typeof column.value === 'function' ? column.value(row) : (row[column.key] ?? ''))}>
                          {typeof column.value === 'function' ? column.value(row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 border-t border-slate-200/90">
            <Pagination
              currentPage={safePage}
              totalItems={sortedRows.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              className="border-t-0"
            />
          </div>
        </>
      ) : (
        <p className="px-5 py-10 text-center text-xs sm:text-sm text-slate-500">No data found for this selection.</p>
      )}
    </section>
  );
}

function ReviewerEntriesTable({ entries = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [entries]);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, safePage, pageSize]);

  if (!entries.length) {
    return <p className="text-xs text-slate-500 py-3 text-center">No pending entries for this reviewer.</p>;
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs flex flex-col">
      <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Employee</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Project</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Work Date</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Hours</span></ResizableTh>
              <ResizableTh className="px-3 sm:px-4 py-2 text-xs whitespace-nowrap"><span>Description</span></ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {paginated.map((entry) => (
              <TableRow key={entry.id}>
                <TableTd className="px-3 sm:px-4 py-2 text-xs font-medium text-slate-800 whitespace-nowrap">{entry.userName}</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-600 whitespace-nowrap">
                  {entry.projectName} <span className="text-slate-400">· {entry.clientName}</span>
                </TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-600 whitespace-nowrap">{entry.workDate}</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs font-bold text-slate-900 whitespace-nowrap">{entry.hours} h</TableTd>
                <TableTd className="px-3 sm:px-4 py-2 text-xs text-slate-500 max-w-[200px] sm:max-w-sm truncate" title={entry.description}>
                  {entry.description}
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {entries.length > pageSize && (
        <div className="shrink-0 border-t border-slate-200/90">
          <Pagination
            currentPage={safePage}
            totalItems={entries.length}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            className="border-t-0"
          />
        </div>
      )}
    </div>
  );
}

function SearchableEmployeeSelect({
  users = [],
  selectedId = '',
  onSelect,
  disabled = false,
}) {
  return (
    <div className="w-full sm:w-80">
      <SearchableSelect
        items={users}
        selectedId={selectedId}
        onSelect={onSelect}
        disabled={disabled}
        placeholder="Select employee..."
        searchPlaceholder="Search by name or email..."
        emptyMessage="No employees"
        getItemLabel={(u) => u.name}
        getItemSubtext={(u) => u.email}
        renderIcon={(u, isSelected) => (
          <div
            className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
              isSelected
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      />
    </div>
  );
}

export default function ReportsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_REPORTS;
  const canViewBilling = isAdmin || !!capabilities?.VIEW_BILLING;
  const { notify } = useNotification();

  // Active Tab: 'summary' | 'missing' | 'away' | 'reviewQueue' | 'employee'
  const [activeTab, setActiveTab] = useState('summary');

  // Summary Tab State
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Missing Timesheets State
  const [missingDate, setMissingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [missingData, setMissingData] = useState(null);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chasing, setChasing] = useState(false);
  const [missingPage, setMissingPage] = useState(1);
  const missingPageSize = 10;

  // Who is Away State
  const [awayDate, setAwayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [awayData, setAwayData] = useState(null);
  const [loadingAway, setLoadingAway] = useState(false);
  const [awayPage, setAwayPage] = useState(1);
  const awayPageSize = 10;

  // Review Queue by Reviewer State
  const [reviewQueueData, setReviewQueueData] = useState(null);
  const [loadingReviewQueue, setLoadingReviewQueue] = useState(false);
  const [expandedReviewerId, setExpandedReviewerId] = useState(null);
  const [reviewerPage, setReviewerPage] = useState(1);
  const reviewerPageSize = 5;

  // Employee Breakdown & Trend State
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [empFilters, setEmpFilters] = useState({ startDate: '', endDate: '', period: 'week' });
  const [empBreakdown, setEmpBreakdown] = useState(null);
  const [empTrend, setEmpTrend] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(false);

  // Loaders
  async function loadSummary(filterValues = filters) {
    try {
      setLoading(true);
      if (filterValues.startDate && filterValues.endDate && filterValues.endDate < filterValues.startDate) {
        throw new Error('End date cannot be earlier than start date.');
      }
      const params = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => Boolean(value))
      );
      const response = await api.get('/api/reports', { params });
      setReport(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load reports.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMissing(dateVal = missingDate) {
    try {
      setLoadingMissing(true);
      const response = await api.get('/api/reports/missing-timesheets', {
        params: { date: dateVal },
      });
      const data = response.data || response;
      setMissingData(data);
      setSelectedUsers([]);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load missing timesheets.');
      }
    } finally {
      setLoadingMissing(false);
    }
  }

  async function loadWhoIsAway(dateVal = awayDate) {
    try {
      setLoadingAway(true);
      const response = await api.get('/api/reports/who-is-away', {
        params: { date: dateVal },
      });
      setAwayData(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load away employees.');
      }
    } finally {
      setLoadingAway(false);
    }
  }

  async function loadReviewQueueByReviewer() {
    try {
      setLoadingReviewQueue(true);
      const response = await api.get('/api/reports/review-queue-by-reviewer');
      setReviewQueueData(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load review queue summary.');
      }
    } finally {
      setLoadingReviewQueue(false);
    }
  }

  async function loadEmployees() {
    try {
      const response = await api.get('/api/users');
      const users = (response.data || response || []).filter((u) => u.isActive);
      setEmployeeUsers(users);
      if (users.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(users[0].id);
      }
    } catch (err) {
      // Ignore user list fetch errors if permissions are restricted
    }
  }

  async function loadEmployeeDetails(userId = selectedEmployeeId, f = empFilters) {
    if (!userId) return;
    try {
      setLoadingEmp(true);
      const [breakdownRes, trendRes] = await Promise.allSettled([
        api.get('/api/reports/employee-project-breakdown', {
          params: { userId, startDate: f.startDate || undefined, endDate: f.endDate || undefined },
        }),
        api.get('/api/reports/employee-time-trend', {
          params: { userId, period: f.period, startDate: f.startDate || undefined, endDate: f.endDate || undefined },
        }),
      ]);

      if (breakdownRes.status === 'fulfilled') {
        setEmpBreakdown(breakdownRes.value.data || breakdownRes.value);
      }
      if (trendRes.status === 'fulfilled') {
        setEmpTrend(trendRes.value.data || trendRes.value);
      }
    } catch (err) {
      notify.error(err.message || 'Failed to load employee breakdown.');
    } finally {
      setLoadingEmp(false);
    }
  }

  useEffect(() => {
    if (!authLoading && canView) {
      loadSummary();
      loadMissing();
      loadWhoIsAway();
      loadReviewQueueByReviewer();
      loadEmployees();
    }
  }, [authLoading, canView]);

  useEffect(() => {
    if (activeTab === 'employee' && selectedEmployeeId) {
      loadEmployeeDetails(selectedEmployeeId, empFilters);
    }
  }, [activeTab, selectedEmployeeId]);

  function clearFilters() {
    const nextFilters = { startDate: '', endDate: '' };
    setFilters(nextFilters);
    loadSummary(nextFilters);
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadSummary(filters);
  }

  async function handleChaseSubmit(e) {
    e.preventDefault();
    const parsed = chaseSchema.safeParse({ date: missingDate, userIds: selectedUsers });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Select at least one employee.');
      return;
    }
    try {
      setChasing(true);
      const res = await api.post('/api/reports/missing-timesheets/chase', parsed.data);
      const data = res.data || res;
      notify.success(
        `Sent ${data.sentCount} reminder(s). ${data.skippedCount ? `${data.skippedCount} skipped (already reminded today).` : ''}`
      );
      await loadMissing(missingDate);
    } catch (err) {
      notify.error(err.message || 'Failed to dispatch reminders.');
    } finally {
      setChasing(false);
    }
  }

  function toggleSelectUser(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function toggleSelectAll() {
    if (!missingData?.employees) return;
    const eligible = missingData.employees.filter((e) => !e.chasedToday).map((e) => e.userId);
    if (selectedUsers.length === eligible.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligible);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[400px] w-full max-w-[1680px] items-center justify-center gap-3 px-4 py-12 text-sm text-slate-500">
        <RefreshCw className="animate-spin text-slate-700" size={24} />
        Verifying permissions...
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="mx-auto w-full max-w-[1680px] px-4 py-16 text-center text-sm text-slate-600">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-1 text-slate-500">You are not authorised to view reports.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Database-aggregated hours, financial values, absences, and review backlog auditing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'summary') loadSummary();
              else if (activeTab === 'missing') loadMissing();
              else if (activeTab === 'away') loadWhoIsAway();
              else if (activeTab === 'reviewQueue') loadReviewQueueByReviewer();
              else if (activeTab === 'employee') loadEmployeeDetails();
            }}
            disabled={loading || loadingMissing || loadingAway || loadingReviewQueue || loadingEmp}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw
              size={14}
              className={
                loading || loadingMissing || loadingAway || loadingReviewQueue || loadingEmp
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-200 overflow-x-auto [scrollbar-width:none] touch-pan-x whitespace-nowrap gap-1 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'summary'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Approved Hours & Billing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'missing'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Missing Timesheets & Reminders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('away')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'away'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Who is Away
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviewQueue')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'reviewQueue'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Review Queue by Reviewer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('employee')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'employee'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Employee Breakdown & Trends
        </button>
      </div>

      {/* ─── TAB 1: SUMMARY (PROJECTS, CLIENTS, EMPLOYEES) ─── */}
      {activeTab === 'summary' && (
        <>
          <form
            onSubmit={handleFilterSubmit}
            className="mb-6 flex flex-col sm:flex-row flex-wrap sm:items-end gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-600 flex flex-col gap-1">
                <span>Start date</span>
                <input
                  type="date"
                  max={filters.endDate || undefined}
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-xs font-medium text-slate-600 flex flex-col gap-1">
                <span>End date</span>
                <input
                  type="date"
                  min={filters.startDate || undefined}
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <BarChart3 size={15} className={loading ? 'animate-pulse' : ''} />
                {loading ? 'Updating...' : 'Run report'}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <X size={15} />
                Clear
              </button>
            </div>
          </form>

          {loading && !report ? (
            <div className="flex min-h-64 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
              <RefreshCw className="animate-spin" size={22} />
              Loading reports...
            </div>
          ) : report ? (
            <div className="relative">
              <div className="grid gap-5 lg:grid-cols-2 items-start">
                <MetricTable
                  title="Total approved hours per project"
                  filename="report_approved_hours_by_project"
                  rows={report.byProject}
                  columns={[
                    {
                      key: 'project',
                      label: 'Project',
                      value: (row) => `${row.projectName} · ${row.clientName}`,
                    },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                    ...(canViewBilling
                      ? [
                          {
                            key: 'value',
                            label: 'Billable value',
                            value: (row) => (row.billableValue != null ? `$${row.billableValue}` : '—'),
                          },
                        ]
                      : []),
                  ]}
                />
                <MetricTable
                  title={canViewBilling ? 'Total billable value per client' : 'Hours by client'}
                  filename="report_billable_value_by_client"
                  rows={report.byClient}
                  columns={[
                    { key: 'client', label: 'Client', value: (row) => row.clientName },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                    ...(canViewBilling
                      ? [
                          {
                            key: 'value',
                            label: 'Billable value',
                            value: (row) => (row.billableValue != null ? `$${row.billableValue}` : '—'),
                          },
                        ]
                      : []),
                  ]}
                />
                <MetricTable
                  title="Hours per employee"
                  filename="report_hours_per_employee"
                  rows={report.byEmployee}
                  columns={[
                    { key: 'employee', label: 'Employee', value: (row) => row.userName },
                    { key: 'email', label: 'Email', value: (row) => row.email },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                  ]}
                />
                <MetricTable
                  title="Entry status breakdown"
                  filename="report_entry_status_breakdown"
                  rows={report.byStatus}
                  columns={[
                    { key: 'status', label: 'Status', value: (row) => row.status },
                    { key: 'entries', label: 'Entries', value: (row) => row.entries },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                  ]}
                />
              </div>

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
                    <RefreshCw className="animate-spin" size={18} />
                    Refreshing reports...
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* ─── TAB 2: MISSING TIMESHEETS & REMINDERS ─── */}
      {activeTab === 'missing' && (
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
      )}

      {/* ─── TAB 3: WHO IS AWAY ─── */}
      {activeTab === 'away' && (
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
      )}

      {/* ─── TAB 4: REVIEW QUEUE BY REVIEWER ─── */}
      {activeTab === 'reviewQueue' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Entries Waiting for Review by Reviewer
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Submitted work entries grouped by managers and administrators authorized to review them.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 sm:px-3 py-1.5 rounded-md">
                Total Pending Work: {reviewQueueData?.totalPendingEntries ?? 0} entries
              </span>
              {reviewQueueData?.reviewers?.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const rows = reviewQueueData.reviewers.flatMap((r) =>
                      r.entries.map((e) => ({
                        reviewerName: r.reviewerName,
                        reviewerEmail: r.reviewerEmail,
                        reviewerRole: r.role,
                        scopeType: r.scopeType,
                        userName: e.userName,
                        projectName: e.projectName,
                        clientName: e.clientName,
                        workDate: e.workDate,
                        hours: e.hours,
                        description: e.description,
                      }))
                    );
                    exportToCsv('unreviewed_entries_by_reviewer', [
                      { key: 'reviewerName', label: 'Reviewer' },
                      { key: 'reviewerRole', label: 'Role' },
                      { key: 'scopeType', label: 'Scope' },
                      { key: 'userName', label: 'Employee' },
                      { key: 'projectName', label: 'Project' },
                      { key: 'clientName', label: 'Client' },
                      { key: 'workDate', label: 'Date' },
                      { key: 'hours', label: 'Hours' },
                      { key: 'description', label: 'Description' },
                    ], rows);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  <Download size={13} />
                  Export All CSV
                </button>
              )}
            </div>
          </div>

          {loadingReviewQueue ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-8">
              <RefreshCw className="animate-spin" size={20} />
              Evaluating reviewer capabilities and scopes...
            </div>
          ) : reviewQueueData?.reviewers?.length ? (
            <div className="space-y-4">
              {reviewQueueData.reviewers
                .slice((reviewerPage - 1) * reviewerPageSize, reviewerPage * reviewerPageSize)
                .map((rev) => {
                  const isExpanded = expandedReviewerId === rev.reviewerId;
                  return (
                    <div
                      key={rev.reviewerId}
                      className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedReviewerId(isExpanded ? null : rev.reviewerId)}
                        className="p-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer transition border-b border-slate-200"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                            {rev.reviewerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{rev.reviewerName}</h3>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  rev.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {rev.role}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {rev.scopeType}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-500 truncate">{rev.reviewerEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{rev.waitingEntryCount} entries</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">{rev.waitingHours} hours waiting</p>
                          </div>
                          {isExpanded ? <ChevronUp size={18} className="text-slate-400 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 sm:p-5 bg-slate-50/40">
                          <ReviewerEntriesTable entries={rev.entries} />
                        </div>
                      )}
                    </div>
                  );
                })}

              <Pagination
                currentPage={reviewerPage}
                totalItems={reviewQueueData.reviewers.length}
                itemsPerPage={reviewerPageSize}
                onPageChange={setReviewerPage}
                className="rounded-xl border border-slate-200"
              />
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-lg">
              <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
              Review queue is clear! No entries currently waiting for review.
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 5: EMPLOYEE BREAKDOWN & TIME TRENDS ─── */}
      {activeTab === 'employee' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row flex-wrap sm:items-end justify-between gap-3.5 sm:gap-4 rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Select Employee
                </label>
                <SearchableEmployeeSelect
                  users={employeeUsers}
                  selectedId={selectedEmployeeId}
                  onSelect={(newId) => setSelectedEmployeeId(newId)}
                  disabled={loadingEmp || employeeUsers.length === 0}
                />
              </div>

              <div className="w-full sm:w-auto">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Trend Period
                </label>
                <select
                  value={empFilters.period}
                  onChange={(e) => {
                    const next = { ...empFilters, period: e.target.value };
                    setEmpFilters(next);
                    loadEmployeeDetails(selectedEmployeeId, next);
                  }}
                  className="block w-full sm:w-36 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 shadow-2xs hover:bg-slate-50 focus:border-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                Total Logged: {empBreakdown?.totalHours ?? 0} h
              </span>
            </div>
          </div>

          {loadingEmp ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-8">
              <RefreshCw className="animate-spin" size={20} />
              Aggregating employee projects and trends in database...
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              {/* Project Split Table */}
              <MetricTable
                title={`Project Split: ${empBreakdown?.user?.name || 'Employee'}`}
                filename={`employee_project_split_${empBreakdown?.user?.name || 'employee'}`}
                rows={empBreakdown?.projects || []}
                columns={[
                  { key: 'projectName', label: 'Project', value: (row) => `${row.projectName} · ${row.clientName}` },
                  { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                  { key: 'percentage', label: 'Share', value: (row) => `${row.percentage}%` },
                  ...(canViewBilling
                    ? [
                        {
                          key: 'billableValue',
                          label: 'Billable Value',
                          value: (row) => (row.billableValue != null ? `$${row.billableValue}` : '—'),
                        },
                      ]
                    : []),
                ]}
              />

              {/* Weekly/Monthly Trend Table */}
              <MetricTable
                title={`Hours by ${empFilters.period === 'month' ? 'Month' : 'Week'}`}
                filename={`employee_hours_trend_${empFilters.period}`}
                rows={empTrend?.trend || []}
                columns={[
                  { key: 'periodDate', label: empFilters.period === 'month' ? 'Month' : 'Week Start', value: (row) => row.periodDate },
                  { key: 'userName', label: 'Employee', value: (row) => row.userName },
                  { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                ]}
              />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
