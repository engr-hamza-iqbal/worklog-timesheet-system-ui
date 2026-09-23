import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function Bars({ title, rows }) {
  const maximum = Math.max(...rows.map((row) => Number(row.hours) || 0), 1);
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>{rows.length ? <div className="space-y-3">{rows.map((row) => <div key={row.label || row.week}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-700">{row.label || row.week}</span><span className="font-medium text-slate-900">{row.hours} h</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800" style={{ width: `${(Number(row.hours) / maximum) * 100}%` }} /></div></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No approved hours in this period.</p>}</section>;
}

export default function AnalyticsPage() {
  const { isAdmin, capabilities } = useAuth();
  const canView = isAdmin || !!capabilities.VIEW_ANALYTICS;
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try { setLoading(true); setError(''); if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) throw new Error('End date cannot be earlier than start date.'); const response = await api.get('/api/analytics', { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }); setAnalytics(response.data); } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { if (canView) load(); }, [canView]);
  if (!canView) return <main className="mx-auto w-full max-w-[1680px] px-4 py-12 text-center text-sm text-slate-600">You are not authorised to view analytics.</main>;
  return <main className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trends</p><h1 className="text-2xl font-semibold text-slate-900">Analytics</h1><p className="mt-1 text-sm text-slate-500">Database-aggregated approved hours over time and by dimension.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button></div><form onSubmit={(event) => { event.preventDefault(); load(); }} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><label className="text-xs font-medium text-slate-600">Start date<input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="mt-1 rounded-md border px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-slate-600">End date<input type="date" min={filters.startDate || undefined} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="mt-1 rounded-md border px-3 py-2 text-sm" /></label><button className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white"><Activity size={15} />Update analytics</button></form>{error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{loading && !analytics ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="animate-spin" size={22} />Loading analytics...</div> : analytics && <div className="grid gap-5 xl:grid-cols-2"><Bars title="Hours over time (weekly)" rows={analytics.weekly} /><Bars title="Hours by project" rows={analytics.projects} /><Bars title="Hours by client" rows={analytics.clients} /><Bars title="Hours by employee" rows={analytics.employees} /></div>}</main>;
}
