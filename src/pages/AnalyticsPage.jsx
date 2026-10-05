import React, { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw,
  X,
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
  Briefcase,
  Building,
  Calendar,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  PieChart as PieIcon,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import useTableResize from '../hooks/useTableResize.js';
import ResizableTh from '../components/ResizableTh.jsx';

// Curated sleek palette for charts
const CHART_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

function CustomTooltip({ active, payload, label, unit = 'h' }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-md">
        <p className="font-semibold text-slate-200">{label || data.name}</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-emerald-400">
          <span>{Number(data.value).toFixed(2)}</span>
          <span className="text-slate-400 font-sans">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_ANALYTICS;

  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  // Chart view modes & limit states (handles cases with many items)
  const [clientChartMode, setClientChartMode] = useState('donut'); // 'donut' | 'bar'
  const [projectLimitMode, setProjectLimitMode] = useState('top8'); // 'top8' | 'all'
  const [employeeLimitMode, setEmployeeLimitMode] = useState('all'); // 'top8' | 'all'

  // Detailed breakdown table state with click-to-sort and search filter
  const [breakdownTab, setBreakdownTab] = useState('employees'); // 'employees' | 'projects' | 'clients'
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('hours');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Resizable columns for breakdown table
  const { columnWidths, startResize } = useTableResize({
    label: 260,
    hours: 140,
    share: 220,
    badge: 140,
  });

  async function load(filterValues = filters) {
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
  }

  useEffect(() => {
    if (!authLoading && canView) {
      load();
    }
  }, [authLoading, canView]);

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

  // Formatted data for Clients Chart (robust grouping for many clients in Donut, plus full data for Bar)
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
    const total = analytics.clients.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    const sorted = [...analytics.clients].sort((a, b) => (Number(b.hours) || 0) - (Number(a.hours) || 0));

    // If more than 6 clients, bundle the rest into an "Other" slice so pie chart doesn't mess up
    if (sorted.length > 6) {
      const top5 = sorted.slice(0, 5).map((row) => ({
        name: row.label,
        value: Number(row.hours) || 0,
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
      value: Number(row.hours) || 0,
      percentage: total > 0 ? ((Number(row.hours) / total) * 100).toFixed(1) : '0.0',
    }));
  }, [analytics]);

  // Formatted data for Employees Chart (robust scrolling / display for many team members)
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

  // Dynamic Pagination calculations
  const totalTablePages = Math.max(1, Math.ceil(sortedAndFilteredRows.length / pageSize));
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-1.5">
            <TrendingUp size={12} />
            <span>Executive Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Database-aggregated approved timesheets, project distributions, and team contributions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(filters)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-slate-900' : 'text-slate-500'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Quick Filter Bar ── */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer shrink-0 ${
                  activePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-500 flex items-center gap-1">
                From
                <input
                  type="date"
                  max={filters.endDate || undefined}
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-xs text-slate-500 flex items-center gap-1">
                To
                <input
                  type="date"
                  min={filters.startDate || undefined}
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
            >
              <Filter size={13} />
              Filter
            </button>
            {(filters.startDate || filters.endDate) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <X size={13} />
                Reset
              </button>
            )}
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

      {/* ── Summary KPI Cards (Responsive grid-cols-1 on mobile so content shows in full without cramping) ── */}
      {summaryKPIs && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Approved</span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Clock size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {summaryKPIs.totalHours} <span className="text-xs font-medium text-slate-500">hrs</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Locked &amp; billable time</p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Contributors</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {summaryKPIs.totalEmployees} <span className="text-xs font-medium text-slate-500">members</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">With approved entries</p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Project</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase size={16} />
                </div>
              </div>
              <div
                className="mt-2 text-base font-bold text-slate-900 break-words line-clamp-2"
                title={summaryKPIs.topProject?.name || ''}
              >
                {summaryKPIs.topProject ? summaryKPIs.topProject.name : '—'}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {summaryKPIs.topProject ? `${summaryKPIs.topProject.hours} hrs logged` : 'No data in range'}
            </p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Client</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Building size={16} />
                </div>
              </div>
              <div
                className="mt-2 text-base font-bold text-slate-900 break-words line-clamp-2"
                title={summaryKPIs.topClient?.name || ''}
              >
                {summaryKPIs.topClient ? summaryKPIs.topClient.name : '—'}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {summaryKPIs.topClient ? `${summaryKPIs.topClient.hours} hrs logged` : 'No data in range'}
            </p>
          </div>
        </div>
      )}

      {/* ── Main Charts Grid ── */}
      {loading && !analytics ? (
        <div className="flex min-h-72 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-500 shadow-xs">
          <RefreshCw className="animate-spin text-slate-700" size={24} />
          Loading charts &amp; calculations...
        </div>
      ) : analytics ? (
        <div className="relative space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 1. Weekly Hours Trend (Area Chart) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Weekly Hours Trend</h2>
                  <p className="text-[11px] text-slate-500">Aggregated approved hours by week start</p>
                </div>
                <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {weeklyData.length} weeks
                </span>
              </div>
              <div className="overflow-x-auto pb-1 scrollbar-thin">
                <div style={{ minWidth: `${Math.max(280, weeklyData.length * 32)}px`, height: '260px' }}>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                        <Tooltip content={<CustomTooltip unit="h" />} />
                        <Area
                          type="monotone"
                          dataKey="hours"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#hoursGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No approved weekly records in this time frame.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Hours by Client (Donut Pie Chart or Bar View) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Client</h2>
                  <p className="text-[11px] text-slate-500">Distribution across active client portfolios</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {allClientsData.length} clients
                  </span>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setClientChartMode('donut')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                        clientChartMode === 'donut'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <PieIcon size={12} />
                      <span className="hidden sm:inline">Donut</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientChartMode('bar')}
                      className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                        clientChartMode === 'bar'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BarChart2 size={12} />
                      <span className="hidden sm:inline">Bars</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                {allClientsData.length > 0 ? (
                  clientChartMode === 'donut' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutClientsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="46%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {donutClientsData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, item) => [
                            `${Number(value).toFixed(2)} h (${item.payload.percentage}%)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#38bdf8' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={44}
                          formatter={(val) => (
                            <span className="text-[11px] text-slate-600 truncate max-w-[110px] inline-block align-middle">
                              {val}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overflow-y-auto max-h-64 scrollbar-thin pr-1">
                      <div style={{ height: `${Math.max(240, allClientsData.length * 32)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={allClientsData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="h" />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="#64748b"
                              fontSize={11}
                              tickLine={false}
                              width={95}
                            />
                            <Tooltip content={<CustomTooltip unit="h" />} />
                            <Bar dataKey="hours" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No client hours logged in selected period.
                  </div>
                )}
              </div>
            </section>

            {/* 3. Hours by Project (Bar Chart with dynamic scaling and scroll) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Project</h2>
                  <p className="text-[11px] text-slate-500">Top project initiatives by approved volume</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                    {displayedProjectsData.length} shown
                  </span>
                  {allProjectsData.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setProjectLimitMode((m) => (m === 'top8' ? 'all' : 'top8'))}
                      className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {projectLimitMode === 'top8' ? `Show All (${allProjectsData.length})` : 'Show Top 8'}
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto max-h-72 scrollbar-thin pr-1">
                <div style={{ height: `${Math.max(250, displayedProjectsData.length * 34)}px` }}>
                  {displayedProjectsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedProjectsData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="h" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          width={110}
                        />
                        <Tooltip content={<CustomTooltip unit="h" />} />
                        <Bar dataKey="hours" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No project hours recorded in this range.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Hours by Employee (Bar Chart with horizontal scroll when many team members) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Team Member</h2>
                  <p className="text-[11px] text-slate-500">Approved effort across individual contributors</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {displayedEmployeesData.length} members
                  </span>
                  {allEmployeesData.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setEmployeeLimitMode((m) => (m === 'top8' ? 'all' : 'top8'))}
                      className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {employeeLimitMode === 'top8' ? `Show All (${allEmployeesData.length})` : 'Show Top 8'}
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div
                  style={{
                    minWidth: `${Math.max(300, displayedEmployeesData.length * 56)}px`,
                    height: '280px',
                  }}
                >
                  {displayedEmployeesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedEmployeesData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={55}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                        <Tooltip content={<CustomTooltip unit="h" />} />
                        <Bar dataKey="hours" fill="#334155" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No employee hours recorded in this range.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ── Detailed Analytics Breakdown Table (With click-to-sort headers and search filter) ── */}
          <section className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <TableIcon size={16} className="text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Detailed Performance Breakdown</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on table column headers to sort ascending or descending. Use real-time search to filter.
                </p>
              </div>

              {/* Tab Selector & Search Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleTabChange('employees')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      breakdownTab === 'employees'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Team ({analytics?.employees?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('projects')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      breakdownTab === 'projects'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Projects ({analytics?.projects?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('clients')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      breakdownTab === 'clients'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Clients ({analytics?.clients?.length || 0})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={`Filter ${breakdownTab}...`}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Table with Clickable Headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <ResizableTh
                      width={columnWidths.label}
                      onResizeStart={(e) => startResize('label', e)}
                      onClick={() => handleTableSort('label')}
                      className="py-3 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">
                          {breakdownTab === 'employees'
                            ? 'Contributor Name'
                            : breakdownTab === 'projects'
                            ? 'Project Initiative'
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
                      width={columnWidths.hours}
                      onResizeStart={(e) => startResize('hours', e)}
                      onClick={() => handleTableSort('hours')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition text-right sm:text-left"
                    >
                      <div className="flex items-center justify-end sm:justify-start gap-1.5 truncate">
                        <span className="truncate">Approved Hours</span>
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
                      width={columnWidths.share}
                      onResizeStart={(e) => startResize('share', e)}
                      onClick={() => handleTableSort('share')}
                      className="py-3 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">Share of Total Effort</span>
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
                      width={columnWidths.badge}
                      onResizeStart={(e) => startResize('badge', e)}
                      onClick={() => handleTableSort('badge')}
                      className="py-3 px-5 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <div className="flex items-center justify-end gap-1.5 truncate">
                        <span className="truncate">Status / Tier</span>
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
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-medium text-slate-900 truncate whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {row.label.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate" title={row.label}>{row.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-right sm:text-left truncate whitespace-nowrap overflow-hidden">
                        {row.hours.toFixed(2)} <span className="text-[10px] font-sans text-slate-400">h</span>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600 truncate whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs w-11 text-right">{row.share.toFixed(1)}%</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(2, row.share))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right truncate whitespace-nowrap overflow-hidden">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.badgeColor}`}
                        >
                          {row.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {currentTableRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-xs text-slate-500">
                        No entries found matching your query "{tableSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Max 10 per page, dynamic navigation) */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {sortedAndFilteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * pageSize, sortedAndFilteredRows.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{sortedAndFilteredRows.length}</span> entries
              </div>

              {totalTablePages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalTablePages }, (_, idx) => idx + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition cursor-pointer ${
                        currentPage === pg
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalTablePages, p + 1))}
                    disabled={currentPage === totalTablePages}
                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>

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
