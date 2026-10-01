import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
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
  const projectsData = useMemo(() => {
    if (!analytics?.projects) return [];
    return analytics.projects.slice(0, 8).map((row) => ({
      name: row.label,
      hours: Number(row.hours) || 0,
    }));
  }, [analytics]);

  // Formatted data for Clients Donut Chart
  const clientsData = useMemo(() => {
    if (!analytics?.clients) return [];
    const total = analytics.clients.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
    return analytics.clients.slice(0, 6).map((row) => ({
      name: row.label,
      value: Number(row.hours) || 0,
      percentage: total > 0 ? ((Number(row.hours) / total) * 100).toFixed(1) : 0,
    }));
  }, [analytics]);

  // Formatted data for Employees Chart
  const employeesData = useMemo(() => {
    if (!analytics?.employees) return [];
    return analytics.employees.slice(0, 8).map((row) => ({
      name: row.label,
      hours: Number(row.hours) || 0,
    }));
  }, [analytics]);

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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${activePreset === preset.id
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
            <div className="flex items-center gap-2">
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

      {/* ── Summary KPI Cards ── */}
      {summaryKPIs && (
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Approved</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {summaryKPIs.totalHours} <span className="text-xs font-medium text-slate-500">hrs</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Locked &amp; billable time</p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Contributors</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {summaryKPIs.totalEmployees} <span className="text-xs font-medium text-slate-500">members</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">With approved entries</p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Top Project</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="mt-2 text-base font-bold text-slate-900 truncate">
              {summaryKPIs.topProject ? summaryKPIs.topProject.name : '—'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {summaryKPIs.topProject ? `${summaryKPIs.topProject.hours} hrs logged` : 'No data in range'}
            </p>
          </div>

          <div className="glow-card rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Top Client</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Building size={16} />
              </div>
            </div>
            <div className="mt-2 text-base font-bold text-slate-900 truncate">
              {summaryKPIs.topClient ? summaryKPIs.topClient.name : '—'}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
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
        <div className="relative">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 1. Weekly Hours Trend (Area Chart) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Weekly Hours Trend</h2>
                  <p className="text-[11px] text-slate-500">Aggregated approved hours by week start</p>
                </div>
                <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {weeklyData.length} weeks
                </span>
              </div>
              <div className="h-64 w-full">
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
            </section>

            {/* 2. Hours by Client (Donut Pie Chart) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Client</h2>
                  <p className="text-[11px] text-slate-500">Distribution across active client portfolios</p>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {clientsData.length} clients
                </span>
              </div>
              <div className="h-64 w-full">
                {clientsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {clientsData.map((entry, index) => (
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
                        height={36}
                        formatter={(val) => <span className="text-[11px] text-slate-600">{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No client hours logged in selected period.
                  </div>
                )}
              </div>
            </section>

            {/* 3. Hours by Project (Bar Chart) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Project</h2>
                  <p className="text-[11px] text-slate-500">Top project initiatives by approved volume</p>
                </div>
                <span className="text-xs font-mono font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                  Top {projectsData.length}
                </span>
              </div>
              <div className="h-64 w-full">
                {projectsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectsData}
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
                        width={90}
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
            </section>

            {/* 4. Hours by Employee (Bar Chart) */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Hours by Team Member</h2>
                  <p className="text-[11px] text-slate-500">Approved effort across individual contributors</p>
                </div>
                <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {employeesData.length} members
                </span>
              </div>
              <div className="h-64 w-full">
                {employeesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={employeesData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                      <Tooltip content={<CustomTooltip unit="h" />} />
                      <Bar dataKey="hours" fill="#334155" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No employee hours recorded in this range.
                  </div>
                )}
              </div>
            </section>
          </div>

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
