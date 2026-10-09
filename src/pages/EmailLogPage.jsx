import React, { useEffect, useState, useMemo } from 'react';
import { Mail, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Search, Send, Plus, Loader2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../api/client.js';
import { emailTestSchema } from '../validation/formSchemas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';

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
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 10;
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });


  const [filters, setFilters] = useState({
    status: '',
    emailType: '',
    search: '',
  });

  // Sorting state
  const [sortField, setSortField] = useState('attemptedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sortField === 'recipient') {
        aVal = (a.recipientUser?.name || a.recipientEmail || '').toLowerCase();
        bVal = (b.recipientUser?.name || b.recipientEmail || '').toLowerCase();
      } else if (sortField === 'emailType') {
        aVal = (a.emailType || '').toLowerCase();
        bVal = (b.emailType || '').toLowerCase();
      } else if (sortField === 'subject') {
        aVal = (a.subject || '').toLowerCase();
        bVal = (b.subject || '').toLowerCase();
      } else if (sortField === 'status') {
        aVal = (a.status || '').toLowerCase();
        bVal = (b.status || '').toLowerCase();
      } else if (sortField === 'attemptedAt') {
        aVal = new Date(a.attemptedAt || a.createdAt || 0).getTime();
        bVal = new Date(b.attemptedAt || b.createdAt || 0).getTime();
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, sortField, sortOrder]);

  // Test Email Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    emailType: 'MISSING_TIMESHEET',
    recipientEmail: 'engr.hamzaiqbal.pk@gmail.com',
  });
  const [sendingTest, setSendingTest] = useState(false);

  // Selected Log Details Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  async function load(pageNumber = page, currentFilters = filters) {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pageNumber,
        limit: PAGE_LIMIT,
        ...(currentFilters.status ? { status: currentFilters.status } : {}),
        ...(currentFilters.emailType ? { emailType: currentFilters.emailType } : {}),
        ...(currentFilters.search ? { search: currentFilters.search } : {}),
      };
      const res = await api.get('/api/emails', { params });
      const data = res.data || res;
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: pageNumber, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
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

  async function handleSendTest(e) {
    e.preventDefault();
      const parsed = emailTestSchema.safeParse(testForm);
      if (!parsed.success) {
        notify.error(parsed.error.issues[0]?.message || 'Enter a valid test email.');
        return;
      }
    try {
      setSendingTest(true);
        const res = await api.post('/api/emails/test', parsed.data);
      const msg = res.message || 'Test email dispatched successfully.';
      notify.success(msg);
      setShowTestModal(false);
      await load(1, filters);
    } catch (err) {
      const errTxt = err.message || 'Failed to dispatch test email.';
      notify.error(errTxt);
    } finally {
      setSendingTest(false);
    }
  }

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
    <main className="mx-auto w-full max-w-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Audit log of all notification attempts, delivery status, and failure messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
            >
              <Send size={14} />
              Send Test Email (Dev)
            </button>
          )}
          <button
            type="button"
            onClick={() => load(page, filters)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-6 flex flex-col sm:flex-row flex-wrap sm:items-end gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs"
      >
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <label className="text-xs font-medium text-slate-600">
            Search
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search recipient or subject..."
                className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </label>
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-600">
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-xs font-medium text-slate-600">
            Type
            <select
              value={filters.emailType}
              onChange={(e) => setFilters({ ...filters, emailType: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="MISSING_TIMESHEET">Missing Timesheet</option>
              <option value="ENTRY_RETURNED">Entry Returned</option>
              <option value="TIME_OFF_DECIDED">Time Off Decided</option>
              <option value="TIME_OFF_REVIEW_REQUIRED">Time Off Review Required</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            Clear
          </button>
        </div>
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
          <Table>
            <TableHead>
              <tr>
                <ResizableTh
                  onClick={() => toggleSort('recipient')}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Recipient</span>
                    {sortField === 'recipient' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('emailType')}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {sortField === 'emailType' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('subject')}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Subject</span>
                    {sortField === 'subject' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('status')}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('attemptedAt')}
                  className="px-5 py-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Attempted At</span>
                    {sortField === 'attemptedAt' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  className="px-5 py-3 text-right"
                >
                  <span>Action</span>
                </ResizableTh>
              </tr>
            </TableHead>
            <TableBody>
              {sortedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableTd>
                    <div className="font-medium text-slate-900">
                      {log.recipientUser?.name || 'External'}
                    </div>
                    <div className="text-xs text-slate-500">{log.recipientEmail}</div>
                  </TableTd>
                  <TableTd className="font-medium text-slate-700">
                    {formatEmailType(log.emailType)}
                  </TableTd>
                  <TableTd className="min-w-[180px] max-w-sm whitespace-normal">
                    <div className="text-slate-800 line-clamp-2" title={log.subject}>
                      {log.subject}
                    </div>
                    {log.errorMessage && (
                      <div className="mt-0.5 text-xs text-red-600 line-clamp-1" title={log.errorMessage}>
                        {log.errorMessage}
                      </div>
                    )}
                  </TableTd>
                  <TableTd>
                    <StatusBadge status={log.status} />
                  </TableTd>
                  <TableTd className="text-xs text-slate-500">
                    {new Date(log.attemptedAt).toLocaleString()}
                  </TableTd>
                  <TableTd className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Details</span>
                    </button>
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-16 text-center text-sm text-slate-500">
            <Mail className="mx-auto mb-2 text-slate-300" size={32} />
            No email notifications recorded yet.
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            load(nextPage, filters);
          }}
        />
      </div>

      {/* Send Test Email Modal (Dev Only) */}
      {import.meta.env.DEV && (
        <Modal
          isOpen={showTestModal}
          onClose={() => (sendingTest ? null : setShowTestModal(false))}
          title="Send Test Notification Email (Dev Only)"
          size="md"
        >
          <form onSubmit={handleSendTest} className="space-y-4">
            <p className="text-xs text-slate-500">
              Trigger a real notification to test email templates, delivery status, and tracking.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Template
              </label>
              <select
                value={testForm.emailType}
                onChange={(e) => setTestForm({ ...testForm, emailType: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-slate-900 focus:outline-none"
              >
                <option value="MISSING_TIMESHEET">Missing Timesheet Reminder (Timesheet chase)</option>
                <option value="ENTRY_RETURNED">Time Entry Returned (Review feedback)</option>
                <option value="TIME_OFF_DECIDED">Time Off Decided (Approved/Declined notification)</option>
                <option value="TIME_OFF_REVIEW_REQUIRED">Time Off Review Required (Decision pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                required
                value={testForm.recipientEmail}
                onChange={(e) => setTestForm({ ...testForm, recipientEmail: e.target.value })}
                placeholder="e.g. engr.hamzaiqbal.pk@gmail.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                In development, emails route to your verified sandbox address (<code>engr.hamzaiqbal.pk@gmail.com</code>).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={sendingTest}
                onClick={() => setShowTestModal(false)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingTest}
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
              >
                {sendingTest && <Loader2 size={14} className="animate-spin" />}
                {sendingTest ? 'Sending test email...' : 'Send Test Email'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Email Details Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Email Audit Details"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedLog.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase">Type</span>
                <div className="mt-1 font-medium text-slate-900">
                  {formatEmailType(selectedLog.emailType)}
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Subject</span>
              <div className="mt-0.5 text-slate-900 font-medium">{selectedLog.subject}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Recipient</span>
                <div className="mt-0.5 text-slate-900">{selectedLog.recipientUser?.name || 'External'}</div>
                <div className="text-xs text-slate-500">{selectedLog.recipientEmail}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Attempted At</span>
                <div className="mt-0.5 text-slate-900">{new Date(selectedLog.attemptedAt).toLocaleString()}</div>
                {selectedLog.sentAt && (
                  <div className="text-xs text-emerald-600">Sent: {new Date(selectedLog.sentAt).toLocaleTimeString()}</div>
                )}
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-slate-400 uppercase">Delivery Info / Error</span>
                <div className="mt-1 rounded bg-slate-50 p-2.5 font-mono text-xs text-slate-700 break-words border border-slate-200">
                  {selectedLog.errorMessage}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
