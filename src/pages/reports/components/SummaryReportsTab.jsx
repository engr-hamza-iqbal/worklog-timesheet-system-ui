import React from 'react';
import { BarChart3, X, RefreshCw } from 'lucide-react';
import MetricTable from './MetricTable.jsx';

export default function SummaryReportsTab({
  filters,
  setFilters,
  handleFilterSubmit,
  clearFilters,
  loading,
  report,
  canViewBilling,
}) {
  return (
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
  );
}
