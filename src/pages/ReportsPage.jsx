import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function MetricTable({ title, rows, columns }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">{title}</h2></div>
      {rows.length ? <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{columns.map((column) => <th key={column.key} className="px-5 py-3">{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.projectId || row.clientId || row.userId || row.status || index} className="border-t border-slate-100"><td className="px-5 py-3 font-medium text-slate-800">{columns[0].value(row)}</td>{columns.slice(1).map((column) => <td key={column.key} className="px-5 py-3 text-slate-600">{column.value(row)}</td>)}</tr>)}</tbody></table> : <p className="px-5 py-10 text-center text-sm text-slate-500">No approved work in this date range.</p>}
    </section>
  );
}

export default function ReportsPage() {
  const { isAdmin, capabilities } = useAuth();
  const canView = isAdmin || !!capabilities.VIEW_REPORTS;
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) throw new Error('End date cannot be earlier than start date.');
      const response = await api.get('/api/reports', { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
      setReport(response.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (!canView) return <main className="mx-auto w-full max-w-[1680px] px-4 py-12 text-center text-sm text-slate-600">You are not authorised to view reports.</main>;

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial summaries</p><h1 className="text-2xl font-semibold text-slate-900">Reports</h1><p className="mt-1 text-sm text-slate-500">Approved hours and billable values aggregated by the database.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button></div>
      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><label className="text-xs font-medium text-slate-600">Start date<input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="mt-1 rounded-md border px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-slate-600">End date<input type="date" min={filters.startDate || undefined} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="mt-1 rounded-md border px-3 py-2 text-sm" /></label><button className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white"><BarChart3 size={15} />Run report</button></form>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && !report ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="animate-spin" size={22} />Loading reports...</div> : report && <div className="grid gap-5 xl:grid-cols-2"><MetricTable title="Hours by project" rows={report.byProject} columns={[{ key: 'project', label: 'Project', value: (row) => `${row.projectName} · ${row.clientName}` }, { key: 'hours', label: 'Hours', value: (row) => row.hours }, { key: 'value', label: 'Billable value', value: (row) => `$${row.billableValue}` }]} /><MetricTable title="Billable value by client" rows={report.byClient} columns={[{ key: 'client', label: 'Client', value: (row) => row.clientName }, { key: 'hours', label: 'Hours', value: (row) => row.hours }, { key: 'value', label: 'Billable value', value: (row) => `$${row.billableValue}` }]} /><MetricTable title="Hours by employee" rows={report.byEmployee} columns={[{ key: 'employee', label: 'Employee', value: (row) => row.userName }, { key: 'email', label: 'Email', value: (row) => row.email }, { key: 'hours', label: 'Hours', value: (row) => row.hours }]} /><MetricTable title="Entry status breakdown" rows={report.byStatus} columns={[{ key: 'status', label: 'Status', value: (row) => row.status }, { key: 'entries', label: 'Entries', value: (row) => row.entries }, { key: 'hours', label: 'Hours', value: (row) => row.hours }]} /></div>}
    </main>
  );
}
