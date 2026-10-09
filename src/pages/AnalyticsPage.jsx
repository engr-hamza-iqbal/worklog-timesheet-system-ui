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
  ReferenceLine,
} from 'recharts';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';
import Pagination from '../components/Pagination.jsx';

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
    const val = Number(data.value || 0).toFixed(2);
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 px-3.5 py-2.5 text-xs text-white shadow-2xl backdrop-blur-md ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">{label || data.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            {val}
          </span>
          <span className="text-slate-400 font-sans font-medium text-xs">{unit} approved</span>
        </div>
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
    // Filter out zero-hour records to prevent NaN arc angles in Recharts Pie
    const activeClients = analytics.clients.filter((r) => Number(r.hours) > 0);
    if (activeClients.length === 0) return [];

    const total = activeClients.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    if (total <= 0) return [];

    const sorted = [...activeClients].sort((a, b) => (Number(b.hours) || 0) - (Number(a.hours) || 0));

    // If more than 6 clients, bundle the rest into an "Other" slice so pie chart doesn't mess up
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
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Weekly Hours Trend</h2>
                  <p className="text-[11px] text-slate-500">Aggregated approved hours by week start</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="self-start sm:self-auto text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    {weeklyData.length} weeks
                  </span>
                  {avgWeeklyHours > 0 && (
                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Avg: <strong className="text-slate-900">{avgWeeklyHours.toFixed(1)}h</strong>/wk
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto pb-1 [scrollbar-width:thin] touch-pan-x">
                <div style={{ minWidth: `${Math.max(260, weeklyData.length * 32)}px`, height: '260px' }}>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240} debounce={50}>
                      <AreaChart data={weeklyData} margin={{ top: 12, right: 12, left: -22, bottom: 4 }}>
                        <defs>
                          {/* Luminous multi-stop gradient fill */}
                          <linearGradient id="stunningAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.38} />
                            <stop offset="45%" stopColor="#818cf8" stopOpacity={0.14} />
                            <stop offset="85%" stopColor="#c7d2fe" stopOpacity={0.02} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                          </linearGradient>

                          {/* Glowing multi-stop gradient for line stroke */}
                          <linearGradient id="stunningLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#4338ca" />
                            <stop offset="35%" stopColor="#6366f1" />
                            <stop offset="70%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.7} vertical={false} />
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} dy={4} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                        <Tooltip content={<CustomTooltip unit="h" />} />

                        {avgWeeklyHours > 0 && (
                          <ReferenceLine
                            y={Number(avgWeeklyHours.toFixed(1))}
                            stroke="#94a3b8"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `Avg ${avgWeeklyHours.toFixed(1)}h`,
                              position: 'insideTopRight',
                              fill: '#64748b',
                              fontSize: 10,
                              fontWeight: 600,
                              offset: 8,
                            }}
                          />
                        )}

                        <Area
                          key={`area-${activePreset}-${weeklyData.length}`}
                          type="monotone"
                          dataKey="hours"
                          stroke="url(#stunningLineGrad)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#stunningAreaGrad)"
                          dot={{ stroke: '#6366f1', strokeWidth: 2, r: 3.5, fill: '#ffffff' }}
                          activeDot={{
                            stroke: '#4f46e5',
                            strokeWidth: 3,
                            r: 6,
                            fill: '#ffffff',
                          }}
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={700}
                          animationEasing="ease-out"
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

            {/* 2. Hours by Client (Donut Pie Chart or 2-Layer Bar View) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Client</h2>
                  <p className="text-[11px] text-slate-500">Distribution across active client portfolios</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
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
                      <span className="inline">Donut</span>
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
                      <span className="inline">Bars</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="min-h-64 w-full flex flex-col justify-center">
                {allClientsData.length > 0 ? (
                  clientChartMode === 'donut' ? (
                    donutClientsData.length > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className="h-56 w-full relative">
                          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                            <PieChart>
                              <Pie
                                key={`pie-${activePreset}-${donutClientsData.length}`}
                                data={donutClientsData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={54}
                                outerRadius={80}
                                paddingAngle={3}
                                startAngle={90}
                                endAngle={-270}
                                isAnimationActive={true}
                                animationBegin={0}
                                animationDuration={800}
                                animationEasing="ease-out"
                                stroke="#ffffff"
                                strokeWidth={2}
                              >
                                {donutClientsData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${entry.name}-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    className="transition-all duration-150 hover:opacity-80 cursor-pointer"
                                  />
                                ))}
                              </Pie>
                              {/* Central Donut Hole Metric Indicator */}
                              <text
                                x="50%"
                                y="47%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-extrabold font-mono text-xl fill-slate-900 select-none"
                              >
                                {totalDonutHours.toFixed(1)}h
                              </text>
                              <text
                                x="50%"
                                y="57%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[10px] font-semibold uppercase tracking-wider fill-slate-400 select-none"
                              >
                                Total Effort
                              </text>
                              <Tooltip
                                formatter={(value, name, item) => [
                                  `${Number(value).toFixed(2)} h (${item.payload.percentage}%)`,
                                  name,
                                ]}
                                contentStyle={{
                                  backgroundColor: '#0f172a',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  fontSize: '11px',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                }}
                                itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Fluent Auto-Wrapping HTML Legend (No clipping / jitter) */}
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-2 max-h-20 overflow-y-auto [scrollbar-width:thin]">
                          {donutClientsData.map((entry, index) => (
                            <div
                              key={entry.name}
                              className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100"
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="font-medium text-slate-700 truncate max-w-[110px] sm:max-w-[130px]">
                                {entry.name}
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">({entry.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-56 items-center justify-center text-xs text-slate-400 gap-2">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                          <PieIcon size={20} />
                        </div>
                        <span>No approved client hours logged in selected period.</span>
                      </div>
                    )
                  ) : (
                    /* 2-Layer Bar View for Clients */
                    <div className="overflow-y-auto max-h-64 [scrollbar-width:thin] pr-1">
                      <div style={{ height: `${Math.max(220, allClientsData.length * 32)}px` }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                          <BarChart
                            data={allClientsData}
                            layout="vertical"
                            margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="clientBarGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              width={85}
                            />
                            <Tooltip content={<CustomTooltip unit="h" />} />
                            <Bar
                              key={`bar-client-${activePreset}-${allClientsData.length}`}
                              dataKey="hours"
                              fill="url(#clientBarGrad)"
                              radius={[0, 8, 8, 0]}
                              barSize={16}
                              background={{ fill: '#f1f5f9', radius: [0, 8, 8, 0] }}
                              isAnimationActive={true}
                              animationBegin={0}
                              animationDuration={650}
                              animationEasing="ease-out"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-slate-400">
                    No client hours logged in selected period.
                  </div>
                )}
              </div>
            </section>

            {/* 3. Hours by Project (Bar Chart with dynamic scaling and scroll) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Project</h2>
                  <p className="text-[11px] text-slate-500">Top project initiatives by approved volume</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
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
              <div className="overflow-y-auto max-h-72 [scrollbar-width:thin] pr-1">
                <div style={{ height: `${Math.max(240, displayedProjectsData.length * 32)}px` }}>
                  {displayedProjectsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedProjectsData}
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="projectBarGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip content={<CustomTooltip unit="h" />} />
                        <Bar
                          key={`bar-project-${activePreset}-${projectLimitMode}-${displayedProjectsData.length}`}
                          dataKey="hours"
                          fill="url(#projectBarGrad)"
                          radius={[0, 8, 8, 0]}
                          barSize={16}
                          background={{ fill: '#f1f5f9', radius: [0, 8, 8, 0] }}
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={650}
                          animationEasing="ease-out"
                        />
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
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Team Member</h2>
                  <p className="text-[11px] text-slate-500">Approved effort across individual contributors</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
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
              <div className="overflow-x-auto pb-2 [scrollbar-width:thin] touch-pan-x">
                <div
                  style={{
                    minWidth: `${Math.max(280, displayedEmployeesData.length * 52)}px`,
                    height: '280px',
                  }}
                >
                  {displayedEmployeesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={displayedEmployeesData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 45 }}
                      >
                        <defs>
                          <linearGradient id="employeeBarGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={55}
                        />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                        <Tooltip content={<CustomTooltip unit="h" />} />
                        <Bar
                          key={`bar-emp-${activePreset}-${employeeLimitMode}-${displayedEmployeesData.length}`}
                          dataKey="hours"
                          fill="url(#employeeBarGrad)"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={32}
                          background={{ fill: '#f1f5f9', radius: [8, 8, 0, 0] }}
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={650}
                          animationEasing="ease-out"
                        />
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

          {/* ── Status Breakdown, Time-Off & Timeliness Row ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Review Status & Time-Off Card */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Review Status &amp; Time-Off</h2>
                  <p className="text-[11px] text-slate-500">Lifecycle state distribution of recorded hours and leave</p>
                </div>
                {analytics.timeOff?.length > 0 && (
                  <span className="self-start sm:self-auto text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    {analytics.timeOff.reduce((acc, t) => acc + (t.days || 0), 0)} leave days
                  </span>
                )}
              </div>

              {/* Status pills / progress meters */}
              <div className="space-y-2.5 sm:space-y-3">
                {(analytics.statusBreakdown || []).map((sb) => {
                  const statusColors = {
                    APPROVED: { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    SUBMITTED: { bg: 'bg-gradient-to-r from-indigo-500 to-blue-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    DRAFT: { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', light: 'bg-slate-50 text-slate-700 border-slate-200' },
                    RETURNED: { bg: 'bg-gradient-to-r from-rose-500 to-red-500', light: 'bg-rose-50 text-rose-700 border-rose-200' },
                  };
                  const colors = statusColors[sb.status] || { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', light: 'bg-slate-50 text-slate-700 border-slate-200' };
                  const totalHrs = (analytics.statusBreakdown || []).reduce((acc, x) => acc + Number(x.hours || 0), 0);
                  const pct = totalHrs > 0 ? ((Number(sb.hours || 0) / totalHrs) * 100).toFixed(1) : 0;

                  return (
                    <div key={sb.status} className="p-2 sm:p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-1.5 gap-1">
                        <span className="font-semibold text-slate-800">{sb.status}</span>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <span className="font-mono text-slate-900 font-bold">{Number(sb.hours || 0).toFixed(1)} hrs</span>
                          <span className="text-slate-400 text-[10px] sm:text-[11px]">({sb.entries || 0} entries &bull; {pct}%)</span>
                        </div>
                      </div>
                      {/* 2-Layer Progress Bar: Inactive Grey Track with Vibrant Gradient Active Line */}
                      <div className="relative w-full bg-slate-100 rounded-full h-2.5 p-0.5 overflow-hidden border border-slate-200/60 shadow-inner">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-700 shadow-xs relative`}
                          style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Time Off breakdown */}
                {analytics.timeOff && analytics.timeOff.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Time-Off Requests:</span>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {analytics.timeOff.map((t) => (
                        <span key={t.status} className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.status}: <strong className="text-slate-900">{t.days}d</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submission Timeliness Card */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Submission Timeliness</h2>
                  <p className="text-[11px] text-slate-500">How promptly work logs are submitted after execution</p>
                </div>
                <span className={`self-start sm:self-auto text-xs font-mono font-bold px-2 py-0.5 rounded border ${(analytics.submissionTimeliness?.overall?.onTimePercentage ?? 100) >= 80
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {analytics.submissionTimeliness?.overall?.onTimePercentage ?? 100}% on-time
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4">
                <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                  <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">Avg Lag</div>
                  <div className="mt-1 text-base sm:text-xl font-bold text-slate-900 font-mono">
                    {analytics.submissionTimeliness?.overall?.avgLagDays ?? 0} <span className="text-[10px] sm:text-xs font-normal text-slate-500">days</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                  <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">On-Time</div>
                  <div className="mt-1 text-base sm:text-xl font-bold text-emerald-600 font-mono">
                    {analytics.submissionTimeliness?.overall?.onTimeCount ?? 0}
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-lg border border-slate-100 bg-slate-50 text-center">
                  <div className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-semibold">Late (&gt;2d)</div>
                  <div className="mt-1 text-base sm:text-xl font-bold text-rose-600 font-mono">
                    {analytics.submissionTimeliness?.overall?.lateCount ?? 0}
                  </div>
                </div>
              </div>

              {/* By-person top late submitters */}
              <div className="overflow-y-auto max-h-40 [scrollbar-width:thin] space-y-1.5">
                {(analytics.submissionTimeliness?.byPerson || []).slice(0, 5).map((person) => (
                  <div key={person.userId} className="flex items-center justify-between text-xs py-1 px-1.5 sm:px-2 rounded hover:bg-slate-50 gap-2">
                    <span className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[140px]">{person.name}</span>
                    <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] shrink-0">
                      <span className="text-slate-500">{person.avgLagDays}d lag</span>
                      <span className={person.lateCount > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                        {person.onTimePercentage}% on-time
                      </span>
                    </div>
                  </div>
                ))}
                {(!analytics.submissionTimeliness?.byPerson || analytics.submissionTimeliness.byPerson.length === 0) && (
                  <div className="text-center text-xs text-slate-400 py-3">No submission history in range.</div>
                )}
              </div>
            </section>
          </div>

          {/* ── Detailed Analytics Breakdown Table (With click-to-sort headers and search filter) ── */}
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
