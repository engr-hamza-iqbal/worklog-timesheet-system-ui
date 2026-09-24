import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function StatusBadge({ status }) {
  if (status === 'SENT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} />
        Sent
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
        <XCircle size={12} />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
      <Clock size={12} />
      Pending
    </span>
  );
}

function formatEmailType(type) {
  switch (type) {
    case 'MISSING_TIMESHEET':
      return 'Missing Timesheet';
    case 'ENTRY_RETURNED':
      return 'Entry Returned';
    case 'TIME_OFF_DECIDED':
      return 'Time Off Decided';
    case 'TIME_OFF_REVIEW_REQUIRED':
      return 'Review Required';
    default:
      return type;
  }
}

export default function EmailLogPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    status: '',
    emailType: '',
    search: '',
  });

  async function load(pageNumber = page, currentFilters = filters) {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pageNumber,
        limit: 25,
        ...(currentFilters.status ? { status: currentFilters.status } : {}),
        ...(currentFilters.emailType ? { emailType: currentFilters.emailType } : {}),
        ...(currentFilters.search ? { search: currentFilters.search } : {}),
      };
      const res = await api.get('/api/emails', { params });
      const data = res.data || res;
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load email logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAdmin) {
      load(1, filters);
    }
  }, [authLoading, isAdmin]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load(1, filters);
  }

  function handleClear() {
    const nextFilters = { status: '', emailType: '', search: '' };
    setFilters(nextFilters);
    setPage(1);
    load(1, nextFilters);
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[400px] w-full max-w-[1680px] items-center justify-center gap-3 px-4 py-12 text-sm text-slate-500">
        <RefreshCw className="animate-spin text-slate-700" size={24} />
        Verifying permissions...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-[1680px] px-4 py-16 text-center text-sm text-slate-600">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Administrator Access Required</h2>
        <p className="mt-1 text-slate-500">Only administrators may view the email dispatch log.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Audit & Notifications
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Email Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit log of all notification attempts, delivery status, and failure messages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(page, filters)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-medium text-slate-600">
            Search
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search recipient or subject..."
                className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">
            Type
            <select
              value={filters.emailType}
              onChange={(e) => setFilters({ ...filters, emailType: e.target.value })}
              className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="MISSING_TIMESHEET">Missing Timesheet</option>
              <option value="ENTRY_RETURNED">Entry Returned</option>
              <option value="TIME_OFF_DECIDED">Time Off Decided</option>
              <option value="TIME_OFF_REVIEW_REQUIRED">Time Off Review Required</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Clear
        </button>
      </form>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading && !logs.length ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={20} />
            Loading email logs...
          </div>
        ) : logs.length ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Attempted At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">
                      {log.recipientUser?.name || 'External'}
                    </div>
                    <div className="text-xs text-slate-500">{log.recipientEmail}</div>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {formatEmailType(log.emailType)}
                  </td>
                  <td className="px-5 py-3 max-w-md">
                    <div className="text-slate-800 truncate" title={log.subject}>
                      {log.subject}
                    </div>
                    {log.errorMessage && (
                      <div className="mt-1 text-xs text-red-600 truncate" title={log.errorMessage}>
                        {log.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.attemptedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            <Mail className="mx-auto mb-2 text-slate-300" size={32} />
            No email notifications recorded yet.
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => {
                  const prevPage = pagination.page - 1;
                  setPage(prevPage);
                  load(prevPage, filters);
                }}
                className="rounded border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => {
                  const nextPage = pagination.page + 1;
                  setPage(nextPage);
                  load(nextPage, filters);
                }}
                className="rounded border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
