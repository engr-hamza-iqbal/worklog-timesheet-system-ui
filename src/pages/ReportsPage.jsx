import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, X, Send, AlertCircle, CheckCircle2, UserX } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function MetricTable({ title, rows = [], columns = [] }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {rows && rows.length ? (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.projectId || row.clientId || row.userId || row.status || index}
                className="border-t border-slate-100 hover:bg-slate-50/50"
              >
                <td className="px-5 py-3 font-medium text-slate-800">{columns[0].value(row)}</td>
                {columns.slice(1).map((column) => (
                  <td key={column.key} className="px-5 py-3 text-slate-600">
                    {column.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No approved work in this date range.</p>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_REPORTS;

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'missing'
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Missing timesheets state
  const [missingDate, setMissingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [missingData, setMissingData] = useState(null);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chasing, setChasing] = useState(false);
  const [chaseFeedback, setChaseFeedback] = useState(null);

  async function loadSummary(filterValues = filters) {
    try {
      setLoading(true);
      setError('');
      if (filterValues.startDate && filterValues.endDate && filterValues.endDate < filterValues.startDate) {
        throw new Error('End date cannot be earlier than start date.');
      }
      const params = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => Boolean(value))
      );
      const response = await api.get('/api/reports', { params });
      setReport(response.data || response);
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMissing(dateVal = missingDate) {
    try {
      setLoadingMissing(true);
      setChaseFeedback(null);
      const response = await api.get('/api/reports/missing-timesheets', {
        params: { date: dateVal },
      });
      const data = response.data || response;
      setMissingData(data);
      setSelectedUsers([]);
    } catch (err) {
      setError(err.message || 'Failed to load missing timesheets.');
    } finally {
      setLoadingMissing(false);
    }
  }

  useEffect(() => {
    if (!authLoading && canView) {
      loadSummary();
      loadMissing();
    }
  }, [authLoading, canView]);

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
    if (!selectedUsers.length) return;
    try {
      setChasing(true);
      setChaseFeedback(null);
      const res = await api.post('/api/reports/missing-timesheets/chase', {
        date: missingDate,
        userIds: selectedUsers,
      });
      const data = res.data || res;
      setChaseFeedback({
        type: 'success',
        message: `Sent ${data.sentCount} reminder(s). ${data.skippedCount ? `${data.skippedCount} skipped (already reminded today).` : ''}`,
      });
      await loadMissing(missingDate);
    } catch (err) {
      setChaseFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch reminders.',
      });
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
    <main className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Financial & Operational summaries
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Database-aggregated hours, financial values, and missing timesheet auditing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (activeTab === 'summary' ? loadSummary() : loadMissing())}
            disabled={loading || loadingMissing}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading || loadingMissing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
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
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'missing'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Missing Timesheets & Reminders
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => (activeTab === 'summary' ? loadSummary() : loadMissing())}
            className="font-medium underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <>
          <form
            onSubmit={handleFilterSubmit}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <label className="text-xs font-medium text-slate-600">
              Start date
              <input
                type="date"
                max={filters.endDate || undefined}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              End date
              <input
                type="date"
                min={filters.startDate || undefined}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              <BarChart3 size={15} className={loading ? 'animate-pulse' : ''} />
              {loading ? 'Updating report...' : 'Run report'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={15} />
              Clear
            </button>
          </form>

          {loading && !report ? (
            <div className="flex min-h-64 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
              <RefreshCw className="animate-spin" size={22} />
              Loading reports...
            </div>
          ) : report ? (
            <div className="relative">
              <div className="grid gap-5 xl:grid-cols-2">
                <MetricTable
                  title="Hours by project"
                  rows={report.byProject}
                  columns={[
                    {
                      key: 'project',
                      label: 'Project',
                      value: (row) => `${row.projectName} · ${row.clientName}`,
                    },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                    {
                      key: 'value',
                      label: 'Billable value',
                      value: (row) => `$${row.billableValue}`,
                    },
                  ]}
                />
                <MetricTable
                  title="Billable value by client"
                  rows={report.byClient}
                  columns={[
                    { key: 'client', label: 'Client', value: (row) => row.clientName },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                    {
                      key: 'value',
                      label: 'Billable value',
                      value: (row) => `$${row.billableValue}`,
                    },
                  ]}
                />
                <MetricTable
                  title="Hours by employee"
                  rows={report.byEmployee}
                  columns={[
                    { key: 'employee', label: 'Employee', value: (row) => row.userName },
                    { key: 'email', label: 'Email', value: (row) => row.email },
                    { key: 'hours', label: 'Hours', value: (row) => `${row.hours} h` },
                  ]}
                />
                <MetricTable
                  title="Entry status breakdown"
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

      {/* Missing Timesheets Tab */}
      {activeTab === 'missing' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-end gap-3">
              <label className="text-xs font-medium text-slate-600">
                Working Day
                <input
                  type="date"
                  value={missingDate}
                  onChange={(e) => {
                    setMissingDate(e.target.value);
                    loadMissing(e.target.value);
                  }}
                  className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => loadMissing(missingDate)}
                disabled={loadingMissing}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Check date
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleChaseSubmit}
                disabled={chasing || !selectedUsers.length}
                className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-800 disabled:opacity-40"
              >
                <Send size={15} />
                {chasing ? 'Sending reminders...' : `Chase Selected (${selectedUsers.length})`}
              </button>
            )}
          </div>

          {chaseFeedback && (
            <div
              className={`flex items-center gap-2 rounded-md p-4 text-sm ${
                chaseFeedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {chaseFeedback.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{chaseFeedback.message}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
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
                  className="text-xs font-semibold text-slate-700 underline hover:text-slate-900"
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
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {isAdmin && <th className="w-12 px-5 py-3">Select</th>}
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Chase Status</th>
                  </tr>
                </thead>
                <tbody>
                  {missingData.employees.map((emp) => (
                    <tr
                      key={emp.userId}
                      className="border-t border-slate-100 hover:bg-slate-50/50"
                    >
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            disabled={emp.chasedToday}
                            checked={selectedUsers.includes(emp.userId)}
                            onChange={() => toggleSelectUser(emp.userId)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:opacity-40"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3 font-medium text-slate-800">{emp.userName}</td>
                      <td className="px-5 py-3 text-slate-600">{emp.email}</td>
                      <td className="px-5 py-3">
                        {emp.chasedToday ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Reminded today
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                            Unsent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
                All active staff either recorded time or had approved time off on this date.
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
