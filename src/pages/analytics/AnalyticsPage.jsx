import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  AlertCircle,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AnalyticsKPIs from './components/AnalyticsKPIs.jsx';
import AnalyticsCharts from './components/AnalyticsCharts.jsx';
import StatusAndTimeliness from './components/StatusAndTimeliness.jsx';
import AnalyticsBreakdownTable from './components/AnalyticsBreakdownTable.jsx';

export default function AnalyticsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_ANALYTICS;

  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  // Chart view modes & limit states
  const [clientChartMode, setClientChartMode] = useState('donut'); // 'donut' | 'bar'
  const [projectLimitMode, setProjectLimitMode] = useState('top8'); // 'top8' | 'all'
  const [employeeLimitMode, setEmployeeLimitMode] = useState('all'); // 'top8' | 'all'

  // Detailed breakdown table state
  const [breakdownTab, setBreakdownTab] = useState('employees'); // 'employees' | 'projects' | 'clients'
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('hours');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async (filterValues = filters) => {
    try {
      setLoading(true);
      setError('');
      if (filterValues.startDate && filterValues.endDate && filterValues.endDate < filterValues.startDate) {
        throw new Error('End date cannot be earlier than start date.');
      }
      const params = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => Boolean(value))
      );
      const response = await api.get('/api/analytics', { params });
      setAnalytics(response.data || response);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authLoading && canView) {
      load();
    }
  }, [authLoading, canView, load]);

  function setDatePreset(preset) {
    setActivePreset(preset);
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    let start = '';

    if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      start = d.toISOString().slice(0, 10);
    } else if (preset === '90d') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      start = d.toISOString().slice(0, 10);
    } else if (preset === 'year') {
      start = `${now.getFullYear()}-01-01`;
    } else if (preset === 'all') {
      start = '';
    }

    const nextFilters = { startDate: start, endDate: start ? end : '' };
    setFilters(nextFilters);
    load(nextFilters);
  }

  function clearFilters() {
    setActivePreset('all');
    const nextFilters = { startDate: '', endDate: '' };
    setFilters(nextFilters);
    load(nextFilters);
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    setActivePreset('custom');
    load(filters);
  }

  // Pre-calculate summary KPI statistics
  const summaryKPIs = useMemo(() => {
    if (!analytics) return null;

    const totalHours = (analytics.weekly || []).reduce((acc, row) => acc + (Number(row.hours) || 0), 0);
    const totalEmployees = (analytics.employees || []).length;
    const topProject = (analytics.projects || [])[0] || null;
    const topClient = (analytics.clients || [])[0] || null;

    return {
      totalHours: totalHours.toFixed(1),
      totalEmployees,
      topProject: topProject ? { name: topProject.label, hours: Number(topProject.hours).toFixed(1) } : null,
      topClient: topClient ? { name: topClient.label, hours: Number(topClient.hours).toFixed(1) } : null,
    };
  }, [analytics]);

  // Formatted data for Weekly Area Chart
  const weeklyData = useMemo(() => {
    if (!analytics?.weekly) return [];
    return analytics.weekly.map((row) => ({
      week: row.week ? row.week.slice(5) : '', // 'MM-DD'
      fullWeek: row.week,
      hours: Number(row.hours) || 0,
    }));
  }, [analytics]);

  const avgWeeklyHours = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return 0;
    const sum = weeklyData.reduce((acc, row) => acc + row.hours, 0);
    return sum / weeklyData.length;
  }, [weeklyData]);

  // Formatted data for Projects Chart
  const allProjectsData = useMemo(() => {
    if (!analytics?.projects) return [];
    return analytics.projects.map((row) => ({
      name: row.label,
      hours: Number(row.hours) || 0,
    }));
  }, [analytics]);

  const displayedProjectsData = useMemo(() => {
    if (projectLimitMode === 'top8') {
      return allProjectsData.slice(0, 8);
    }
    return allProjectsData;
  }, [allProjectsData, projectLimitMode]);

  // Formatted data for Clients Chart
  const allClientsData = useMemo(() => {
    if (!analytics?.clients) return [];
    const total = analytics.clients.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    return analytics.clients.map((row) => ({
      name: row.label,
      value: Number(row.hours) || 0,
      hours: Number(row.hours) || 0,
      percentage: total > 0 ? ((Number(row.hours) / total) * 100).toFixed(1) : '0.0',
    }));
  }, [analytics]);

  const donutClientsData = useMemo(() => {
    if (!analytics?.clients || analytics.clients.length === 0) return [];
    const activeClients = analytics.clients.filter((r) => Number(r.hours) > 0);
    if (activeClients.length === 0) return [];

    const total = activeClients.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    if (total <= 0) return [];

    const sorted = [...activeClients].sort((a, b) => (Number(b.hours) || 0) - (Number(a.hours) || 0));

    if (sorted.length > 6) {
      const top5 = sorted.slice(0, 5).map((row) => ({
        name: row.label,
        value: Number(Number(row.hours).toFixed(2)),
        percentage: total > 0 ? ((Number(row.hours) / total) * 100).toFixed(1) : '0.0',
      }));
      const otherHours = sorted.slice(5).reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
      const otherCount = sorted.length - 5;
      top5.push({
        name: `Other (${otherCount} clients)`,
        value: Number(otherHours.toFixed(2)),
        percentage: total > 0 ? ((otherHours / total) * 100).toFixed(1) : '0.0',
      });
      return top5;
    }

    return sorted.map((row) => ({
      name: row.label,
      value: Number(Number(row.hours).toFixed(2)),
      percentage: total > 0 ? ((Number(row.hours) / total) * 100).toFixed(1) : '0.0',
    }));
  }, [analytics]);

  const totalDonutHours = useMemo(() => {
    return donutClientsData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [donutClientsData]);

  // Formatted data for Employees Chart
  const allEmployeesData = useMemo(() => {
    if (!analytics?.employees) return [];
    return analytics.employees.map((row) => ({
      name: row.label,
      hours: Number(row.hours) || 0,
    }));
  }, [analytics]);

  const displayedEmployeesData = useMemo(() => {
    if (employeeLimitMode === 'top8') {
      return allEmployeesData.slice(0, 8);
    }
    return allEmployeesData;
  }, [allEmployeesData, employeeLimitMode]);

  // Total approved hours for percentage share calculation
  const totalApprovedHours = useMemo(() => {
    return (analytics?.weekly || []).reduce((acc, row) => acc + (Number(row.hours) || 0), 0) || 1;
  }, [analytics]);

  // Raw rows for detailed breakdown table based on active tab
  const rawTableData = useMemo(() => {
    if (!analytics) return [];
    if (breakdownTab === 'employees') {
      return (analytics.employees || []).map((row) => {
        const hours = Number(row.hours) || 0;
        const share = totalApprovedHours > 0 ? (hours / totalApprovedHours) * 100 : 0;
        return {
          id: row.label,
          label: row.label,
          hours,
          share,
          badge: share > 25 ? 'Core Contributor' : share > 10 ? 'Active Member' : 'Contributor',
          badgeColor:
            share > 25
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : share > 10
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200',
        };
      });
    } else if (breakdownTab === 'projects') {
      return (analytics.projects || []).map((row) => {
        const hours = Number(row.hours) || 0;
        const share = totalApprovedHours > 0 ? (hours / totalApprovedHours) * 100 : 0;
        return {
          id: row.label,
          label: row.label,
          hours,
          share,
          badge: share > 30 ? 'Primary Initiative' : share > 10 ? 'Active Project' : 'Maintenance',
          badgeColor:
            share > 30
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : share > 10
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-100 text-slate-600 border-slate-200',
        };
      });
    } else if (breakdownTab === 'timeliness') {
      return (analytics.submissionTimeliness?.byPerson || []).map((row) => {
        const pct = Number(row.onTimePercentage) || 0;
        return {
          id: row.userId,
          label: row.name,
          hours: Number(row.avgLagDays) || 0,
          share: pct,
          badge: pct >= 90 ? 'Consistently On-Time' : pct >= 70 ? 'Acceptable' : 'Frequently Late',
          badgeColor:
            pct >= 90
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : pct >= 70
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200',
        };
      });
    } else {
      return (analytics.clients || []).map((row) => {
        const hours = Number(row.hours) || 0;
        const share = totalApprovedHours > 0 ? (hours / totalApprovedHours) * 100 : 0;
        return {
          id: row.label,
          label: row.label,
          hours,
          share,
          badge: share > 35 ? 'Tier-1 Enterprise' : share > 15 ? 'Key Account' : 'Standard Client',
          badgeColor:
            share > 35
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : share > 15
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200',
        };
      });
    }
  }, [analytics, breakdownTab, totalApprovedHours]);

  // Filter & sort table rows
  const sortedAndFilteredRows = useMemo(() => {
    let rows = rawTableData;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((r) => r.label.toLowerCase().includes(q) || r.badge.toLowerCase().includes(q));
    }

    return [...rows].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'label') {
        comparison = a.label.localeCompare(b.label);
      } else if (sortColumn === 'hours') {
        comparison = a.hours - b.hours;
      } else if (sortColumn === 'share') {
        comparison = a.share - b.share;
      } else if (sortColumn === 'badge') {
        comparison = a.badge.localeCompare(b.badge);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rawTableData, tableSearch, sortColumn, sortDirection]);

  const currentTableRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedAndFilteredRows.slice(startIdx, startIdx + pageSize);
  }, [sortedAndFilteredRows, currentPage, pageSize]);

  const handleTableSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'label' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setBreakdownTab(tab);
    setTableSearch('');
    setCurrentPage(1);
    setSortColumn('hours');
    setSortDirection('desc');
  };

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[400px] w-full max-w-7xl items-center justify-center gap-3 px-4 py-12 text-sm text-slate-500">
        <RefreshCw className="animate-spin text-slate-700" size={24} />
        Verifying permissions...
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 text-center text-sm text-slate-600">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-1 text-slate-500">You are not authorised to view analytics.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-6 sm:px-6">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Database-aggregated approved timesheets, project distributions, and team contributions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(filters)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 w-full sm:w-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-slate-900' : 'text-slate-500'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Quick Filter Bar ── */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 [scrollbar-width:none] touch-pan-x">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Calendar size={13} />
              Preset:
            </span>
            {[
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDatePreset(preset.id)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${activePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="shrink-0 font-medium">From:</span>
                <input
                  type="date"
                  max={filters.endDate || undefined}
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="shrink-0 font-medium">To:</span>
                <input
                  type="date"
                  min={filters.startDate || undefined}
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
              >
                <Filter size={13} />
                <span>Filter</span>
              </button>
              {(filters.startDate || filters.endDate) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <X size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => load(filters)}
            className="font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards ── */}
      <AnalyticsKPIs summaryKPIs={summaryKPIs} />

      {/* ── Main Charts Grid ── */}
      {loading && !analytics ? (
        <div className="flex min-h-72 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-500 shadow-xs">
          <RefreshCw className="animate-spin text-slate-700" size={24} />
          Loading charts &amp; calculations...
        </div>
      ) : analytics ? (
        <div className="relative space-y-6">
          <AnalyticsCharts
            weeklyData={weeklyData}
            avgWeeklyHours={avgWeeklyHours}
            activePreset={activePreset}
            allClientsData={allClientsData}
            donutClientsData={donutClientsData}
            clientChartMode={clientChartMode}
            setClientChartMode={setClientChartMode}
            totalDonutHours={totalDonutHours}
            displayedProjectsData={displayedProjectsData}
            allProjectsData={allProjectsData}
            projectLimitMode={projectLimitMode}
            setProjectLimitMode={setProjectLimitMode}
            displayedEmployeesData={displayedEmployeesData}
            allEmployeesData={allEmployeesData}
            employeeLimitMode={employeeLimitMode}
            setEmployeeLimitMode={setEmployeeLimitMode}
          />

          {/* ── Status Breakdown, Time-Off & Timeliness Row ── */}
          <StatusAndTimeliness analytics={analytics} />

          {/* ── Detailed Analytics Breakdown Table ── */}
          <AnalyticsBreakdownTable
            analytics={analytics}
            breakdownTab={breakdownTab}
            handleTabChange={handleTabChange}
            tableSearch={tableSearch}
            setTableSearch={setTableSearch}
            setCurrentPage={setCurrentPage}
            handleTableSort={handleTableSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            currentTableRows={currentTableRows}
            currentPage={currentPage}
            sortedAndFilteredRows={sortedAndFilteredRows}
            pageSize={pageSize}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-lg">
                <RefreshCw className="animate-spin text-indigo-600" size={16} />
                <span>Recalculating metrics...</span>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
