import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Shield,
  Eye,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderOpen,
  Users,
  Globe,
  Tag,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';

const CAP_META = {
  VIEW_OTHER_RECORDS: { label: 'View Other Records', desc: 'Read work logs and timesheets of other staff members.' },
  REVIEW_TIME: { label: 'Review Time', desc: 'Approve or return submitted time entries within assigned scope.' },
  DECIDE_TIME_OFF: { label: 'Decide Time Off', desc: 'Approve or decline employee time-off requests within assigned scope.' },
  MANAGE_CLIENTS_PROJECTS: { label: 'Manage Clients & Projects', desc: 'Create and configure clients, projects, and billing rates.' },
  ASSIGN_PROJECTS: { label: 'Assign Projects', desc: 'Assign and remove employees on client projects.' },
  MANAGE_USERS: { label: 'Manage Users', desc: 'Create and manage user accounts.' },
  VIEW_REPORTS: { label: 'View Reports', desc: 'Access cross-project summary reports and CSV exports.' },
  VIEW_ANALYTICS: { label: 'View Analytics', desc: 'View utilization rates and billable hours distribution.' },
  VIEW_BILLING: { label: 'View Billing', desc: 'Access sensitive billing rate figures and monetary totals.' },
};

const ACTION_CONFIG = {
  GRANT: {
    label: 'Granted',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  REVOKE: {
    label: 'Revoked',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  CHANGE_SCOPE: {
    label: 'Scope Changed',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  CHANGE_EXPIRY: {
    label: 'Expiry Changed',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
};

export default function AuditLogsPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Filter and sort state
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Details Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(false);


  const fetchLogs = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const offset = (page - 1) * LIMIT;
      const res = await api.get(`/api/access/audit-logs?limit=${LIMIT}&offset=${offset}`);
      const data = res.data;
      if (data && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setTotal(data.total || data.logs.length);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      }
    } catch {
      // Retain existing logs on network hiccup
    } finally {
      if (isInitial) setLoading(false);
      else setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (capabilityFilter && log.capabilityCode !== capabilityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const actorName = (log.actor?.name || '').toLowerCase();
        const actorEmail = (log.actor?.email || '').toLowerCase();
        const targetName = (log.targetUser?.name || '').toLowerCase();
        const targetEmail = (log.targetUser?.email || '').toLowerCase();
        const capCode = (log.capabilityCode || '').toLowerCase();
        const capLabel = (CAP_META[log.capabilityCode]?.label || '').toLowerCase();
        const matches =
          actorName.includes(q) ||
          actorEmail.includes(q) ||
          targetName.includes(q) ||
          targetEmail.includes(q) ||
          capCode.includes(q) ||
          capLabel.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, actionFilter, capabilityFilter, search]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'action') {
        cmp = (a.action || '').localeCompare(b.action || '');
      } else if (sortField === 'capabilityCode') {
        cmp = (a.capabilityCode || '').localeCompare(b.capabilityCode || '');
      } else if (sortField === 'actor') {
        cmp = (a.actor?.name || '').localeCompare(b.actor?.name || '');
      } else if (sortField === 'targetUser') {
        cmp = (a.targetUser?.name || '').localeCompare(b.targetUser?.name || '');
      } else if (sortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredLogs, sortField, sortOrder]);

  // Compute summary stats from available logs
  const stats = useMemo(() => {
    const grants = logs.filter((l) => l.action === 'GRANT').length;
    const revokes = logs.filter((l) => l.action === 'REVOKE').length;
    const modifications = logs.filter((l) => l.action === 'CHANGE_SCOPE' || l.action === 'CHANGE_EXPIRY').length;
    return { total, grants, revokes, modifications };
  }, [logs, total]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getScopeBadge = (details) => {
    if (!details) return <span className="text-slate-400 italic">None</span>;
    const scopeType = details.scopeType || (details.targetProjectIds?.length ? 'PROJECT' : details.targetUserIds?.length ? 'USER' : 'GLOBAL');
    if (scopeType === 'PROJECT') {
      const count = details.targetProjectIds?.length || 0;
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <FolderOpen size={11} />
          {count} {count === 1 ? 'Project' : 'Projects'}
        </span>
      );
    }
    if (scopeType === 'USER') {
      const count = details.targetUserIds?.length || details.targetScopeUserIds?.length || 0;
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Users size={11} />
          {count} {count === 1 ? 'User' : 'Users'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Globe size={11} />
        Global
      </span>
    );
  };

  return (
    <main className="relative flex-1 max-w-auto w-full mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable, tamper-evident security audit trail tracking all capability grants, scope updates, and revocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchLogs(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Events</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">System-wide access changes</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Capability Grants
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.grants}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active or historical grants</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Revocations
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.revokes}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Access permissions revoked</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Scope &amp; Expiry Updates
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.modifications}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Boundary or timeline adjustments</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor, target user, or capability name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-900 font-medium text-slate-700"
              >
                <option value="">All Actions</option>
                <option value="GRANT">Granted</option>
                <option value="REVOKE">Revoked</option>
                <option value="CHANGE_SCOPE">Scope Changed</option>
                <option value="CHANGE_EXPIRY">Expiry Changed</option>
              </select>
            </div>

            <select
              value={capabilityFilter}
              onChange={(e) => setCapabilityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-slate-900 font-medium text-slate-700 max-w-[200px] truncate"
            >
              <option value="">All Capabilities</option>
              {Object.keys(CAP_META).map((code) => (
                <option key={code} value={code}>
                  {CAP_META[code].label}
                </option>
              ))}
            </select>

            {(search || actionFilter || capabilityFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActionFilter('');
                  setCapabilityFilter('');
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Logs Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Audit Event Log
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {sortedLogs.length} of {total} events
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-3" />
            <span className="text-xs text-slate-500">Loading access audit logs...</span>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No audit log records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No audit records matched your current query or filter selections.
            </p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHead>
                <tr>
                  <ResizableTh
                    onClick={() => toggleSort('action')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action</span>
                      {sortField === 'action' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('capabilityCode')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capability</span>
                      {sortField === 'capabilityCode' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('actor')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Performed By (Actor)</span>
                      {sortField === 'actor' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('targetUser')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Target Employee</span>
                      {sortField === 'targetUser' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    className="py-3 px-4"
                  >
                    <span>Scope</span>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('createdAt')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Timestamp</span>
                      {sortField === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    className="py-3 px-4 text-right"
                  >
                    <span>Action</span>
                  </ResizableTh>
                </tr>
              </TableHead>
              <TableBody>
                {sortedLogs.map((log) => {
                  const actionInfo = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                  };
                  const capMeta = CAP_META[log.capabilityCode] || { label: log.capabilityCode, desc: '' };

                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer group"
                    >
                      <TableTd className="px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${actionInfo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${actionInfo.dot}`} />
                          <span>{actionInfo.label}</span>
                        </span>
                      </TableTd>

                      <TableTd className="px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {capMeta.label}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {log.capabilityCode}
                        </div>
                      </TableTd>

                      <TableTd className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {log.actor?.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{log.actor?.name || 'System Admin'}</div>
                            <div className="text-[10px] text-slate-400">{log.actor?.email || '—'}</div>
                          </div>
                        </div>
                      </TableTd>

                      <TableTd className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {log.targetUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{log.targetUser?.name || '—'}</div>
                            <div className="text-[10px] text-slate-400">{log.targetUser?.email || '—'}</div>
                          </div>
                        </div>
                      </TableTd>

                      <TableTd className="px-4">
                        {getScopeBadge(log.details)}
                      </TableTd>

                      <TableTd className="px-4 text-slate-500">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar size={11} className="text-slate-400 shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock size={10} className="text-slate-300 shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableTd>

                      <TableTd className="px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Details</span>
                        </button>
                      </TableTd>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={LIMIT}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          </div>
        )}
      </div>

      {/* ── Details View Modal ── */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Details"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Top Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ACTION_CONFIG[selectedLog.action]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${ACTION_CONFIG[selectedLog.action]?.dot || 'bg-slate-400'}`} />
                  {ACTION_CONFIG[selectedLog.action]?.label || selectedLog.action}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {CAP_META[selectedLog.capabilityCode]?.label || selectedLog.capabilityCode}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-500">{selectedLog.capabilityCode}</p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div className="font-semibold text-slate-800">
                  {new Date(selectedLog.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(selectedLog.createdAt).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Event Actors & Target Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Actor Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Performed By (Actor)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedLog.actor?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {selectedLog.actor?.name || 'Administrator'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{selectedLog.actor?.email || '—'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      ID: {selectedLog.actorId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target User Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 mb-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Employee</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedLog.targetUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {selectedLog.targetUser?.name || '—'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{selectedLog.targetUser?.email || '—'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      ID: {selectedLog.targetUserId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope & Details Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Audit Configuration &amp; Scope Details
                </span>
                {getScopeBadge(selectedLog.details)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Log Record ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 mt-0.5">
                    <span className="truncate">{selectedLog.id}</span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.id)}
                      className="text-slate-400 hover:text-slate-700 transition"
                      title="Copy ID"
                    >
                      {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Capability Grant ID:</span>
                  <div className="font-mono text-[11px] text-slate-800 mt-0.5 truncate">
                    {selectedLog.grantId || '—'}
                  </div>
                </div>

                {selectedLog.details?.expiresAt !== undefined && (
                  <div>
                    <span className="text-slate-400 font-medium">Grant Expiry:</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {selectedLog.details.expiresAt
                        ? new Date(selectedLog.details.expiresAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                        : 'Permanent (No expiry date)'}
                    </div>
                  </div>
                )}

                {selectedLog.details?.previousExpiresAt !== undefined && (
                  <div>
                    <span className="text-slate-400 font-medium">Previous Expiry:</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {selectedLog.details.previousExpiresAt
                        ? new Date(selectedLog.details.previousExpiresAt).toLocaleDateString('en-GB')
                        : 'Permanent'}
                    </div>
                  </div>
                )}

                {selectedLog.details?.newExpiresAt !== undefined && (
                  <div>
                    <span className="text-slate-400 font-medium">Updated Expiry:</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {selectedLog.details.newExpiresAt
                        ? new Date(selectedLog.details.newExpiresAt).toLocaleDateString('en-GB')
                        : 'Permanent'}
                    </div>
                  </div>
                )}
              </div>

              {/* Scoped Targets Display */}
              {Array.isArray(selectedLog.details?.targetProjectIds) && selectedLog.details.targetProjectIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Target Projects ({selectedLog.details.targetProjectIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLog.details.targetProjectIds.map((pid) => (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono"
                      >
                        <FolderOpen size={11} className="text-blue-500" />
                        {pid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedLog.details?.targetUserIds) && selectedLog.details.targetUserIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Target Users ({selectedLog.details.targetUserIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLog.details.targetUserIds.map((uid) => (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200 text-xs font-mono"
                      >
                        <Users size={11} className="text-purple-500" />
                        {uid}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Raw JSON Payload Inspector */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Raw Audit Event Payload (JSON)
              </span>
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
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
