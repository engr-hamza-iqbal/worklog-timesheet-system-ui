import React from 'react';
import { RefreshCw } from 'lucide-react';
import SearchableEmployeeSelect from './SearchableEmployeeSelect.jsx';
import MetricTable from './MetricTable.jsx';

export default function EmployeeTrendsTab({
  employeeUsers,
  selectedEmployeeId,
  setSelectedEmployeeId,
  empFilters,
  setEmpFilters,
  loadEmployeeDetails,
  loadingEmp,
  empBreakdown,
  empTrend,
  canViewBilling,
}) {
  return (
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
  );
}
