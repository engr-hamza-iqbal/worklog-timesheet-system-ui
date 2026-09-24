import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function Bars({ title, rows = [] }) {
  const maximum = Math.max(...(rows || []).map((row) => Number(row.hours) || 0), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {rows && rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label || row.week}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{row.label || row.week}</span>
                <span className="font-medium text-slate-900">{row.hours} h</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800 transition-all duration-500"
                  style={{ width: `${(Number(row.hours) / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">No approved hours in this period.</p>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_ANALYTICS;

  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  function clearFilters() {
    const nextFilters = { startDate: '', endDate: '' };
    setFilters(nextFilters);
    load(nextFilters);
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    load(filters);
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
        <p className="mt-1 text-slate-500">You are not authorised to view analytics.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trends</p>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Database-aggregated approved hours over time and by dimension.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(filters)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

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
          <Activity size={15} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'Updating analytics...' : 'Update analytics'}
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

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => load(filters)}
            className="font-medium underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !analytics ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
          <RefreshCw className="animate-spin" size={22} />
          Loading analytics...
        </div>
      ) : analytics ? (
        <div className="relative">
          <div className="grid gap-5 xl:grid-cols-2">
            <Bars title="Hours over time (weekly)" rows={analytics.weekly} />
            <Bars title="Hours by project" rows={analytics.projects} />
            <Bars title="Hours by client" rows={analytics.clients} />
            <Bars title="Hours by employee" rows={analytics.employees} />
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px]">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
                <RefreshCw className="animate-spin" size={18} />
                Refreshing analytics...
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
