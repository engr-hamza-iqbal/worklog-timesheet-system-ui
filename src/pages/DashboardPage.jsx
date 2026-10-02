import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Tooltip } from '../components/Navbar.jsx';
import {
  RefreshCw,
  Clock,
  ShieldCheck,
  Calendar,
  Briefcase,
  Users,
  FileSpreadsheet,
  BarChart3,
  DollarSign,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  User,
  ChevronDown,
} from 'lucide-react';

const SYSTEM_CAPABILITIES = [
  { code: 'VIEW_OTHER_RECORDS', name: 'View Other Records', desc: 'View work logs and timesheets of other staff members', icon: Users },
  { code: 'REVIEW_TIME', name: 'Review Time', desc: 'Approve, return, or re-open submitted time entries', icon: Clock },
  { code: 'DECIDE_TIME_OFF', name: 'Decide Time Off', desc: 'Approve or decline employee time-off requests', icon: Calendar },
  { code: 'MANAGE_CLIENTS_PROJECTS', name: 'Manage Clients & Projects', desc: 'Create and configure clients, projects, and billing rates', icon: Briefcase },
  { code: 'ASSIGN_PROJECTS', name: 'Assign Projects', desc: 'Assign and remove employees on client projects', icon: Briefcase },
  { code: 'MANAGE_USERS', name: 'Manage Users', desc: 'Manage user accounts and issue capability grants', icon: Users },
  { code: 'VIEW_REPORTS', name: 'View Reports', desc: 'Access cross-project summary reports and CSV exports', icon: FileSpreadsheet },
  { code: 'VIEW_ANALYTICS', name: 'View Analytics', desc: 'View utilization rates and billable hours distribution', icon: BarChart3 },
  { code: 'VIEW_BILLING', name: 'View Billing', desc: 'Access sensitive billing rate figures and monetary totals', icon: DollarSign },
];

export default function DashboardPage() {
  const { user, capabilities, isAdmin, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [expandedScopeCaps, setExpandedScopeCaps] = useState(new Set());

  const toggleScopeExpanded = (code) => {
    setExpandedScopeCaps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch {
      // Refresh error handled silently
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Count granted capabilities
  const grantedCount = isAdmin
    ? SYSTEM_CAPABILITIES.length
    : SYSTEM_CAPABILITIES.filter((c) => !!capabilities[c.code]).length;

  const percentageGranted = Math.round((grantedCount / SYSTEM_CAPABILITIES.length) * 100);

  // Filtered and sorted capabilities list
  const filteredCapabilities = useMemo(() => {
    let list = SYSTEM_CAPABILITIES;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'desc') {
        comparison = a.desc.localeCompare(b.desc);
      } else if (sortField === 'status') {
        const aHeld = isAdmin || !!capabilities[a.code] ? 1 : 0;
        const bHeld = isAdmin || !!capabilities[b.code] ? 1 : 0;
        comparison = aHeld - bHeld;
      } else if (sortField === 'scope') {
        const aGlobal = isAdmin || capabilities[a.code]?.isGlobal ? 2 : capabilities[a.code] ? 1 : 0;
        const bGlobal = isAdmin || capabilities[b.code]?.isGlobal ? 2 : capabilities[b.code] ? 1 : 0;
        comparison = aGlobal - bGlobal;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filterQuery, sortField, sortOrder, isAdmin, capabilities]);

  const greetingTime = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <main className="flex-1 max-w-auto w-full mx-auto px-4 py-6 sm:px-6">
      {/* ── Welcome Greeting Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greetingTime}, {user?.name?.split(' ')[0]}!
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Welcome back to your central hub. Track daily precision work, inspect project scopes, and navigate your authorized workspace tools.
            </p>

            {/* Quick Action Navigation Buttons (Only shown on small screens) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 items-stretch gap-2.5 w-full md:hidden">
              <Link
                to="/timesheet"
                className="inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 transition shadow-sm cursor-pointer w-full lg:w-auto text-center"
              >
                <Clock size={15} className="shrink-0" />
                <span>Log Today's Work</span>
              </Link>
              <Link
                to="/time-off"
                className="inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 active:bg-white/30 border border-white/15 transition cursor-pointer w-full lg:w-auto text-center"
              >
                <Calendar size={15} className="shrink-0" />
                <span>Request Time Off</span>
              </Link>
              {(isAdmin || capabilities?.REVIEW_TIME) && (
                <Link
                  to="/review"
                  className="inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 active:bg-white/30 border border-white/15 transition cursor-pointer w-full lg:w-auto text-center"
                >
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>Review Queue</span>
                </Link>
              )}
              {(isAdmin || capabilities?.VIEW_ANALYTICS) && (
                <Link
                  to="/analytics"
                  className="inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 active:bg-white/30 border border-white/15 transition cursor-pointer w-full lg:w-auto text-center"
                >
                  <BarChart3 size={15} className="shrink-0" />
                  <span>Analytics</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Metrics Widget */}
          <div className="flex md:flex-col gap-3 min-w-[200px]">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15">
              <div className="text-[11px] font-medium text-slate-300">Authorization Coverage</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{grantedCount} / {SYSTEM_CAPABILITIES.length}</span>
                <span className="text-xs text-indigo-300 font-semibold">{percentageGranted}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentageGranted}%` }}
                />
              </div>
            </div>

            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15">
              <div className="text-[11px] font-medium text-slate-300">Assigned Role</div>
              <div className="mt-1 text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAdmin ? 'Administrator' : 'Employee'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Capabilities Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">System Capabilities &amp; Access Scopes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time authorization matrix determining route access, project approvals, and administrative actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter capabilities..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 w-44 sm:w-56"
              />
            </div>

            <Tooltip text="Refresh permissions" side="left">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer disabled:opacity-60"
                aria-label="Refresh permissions"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-slate-900' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Capability</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('desc')}
                  className="py-3 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Description</span>
                    {sortField === 'desc' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('scope')}
                  className="py-3 px-4 hidden md:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Scope Authorization</span>
                    {sortField === 'scope' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-5 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCapabilities.map((cap) => {
                const Icon = cap.icon;
                const grant = capabilities[cap.code];
                const isHeld = isAdmin || !!grant;
                const isGlobal = isAdmin || grant?.isGlobal;
                const projectCount = grant?.allowedProjectIds?.length || 0;
                const userCount = grant?.allowedUserIds?.length || 0;

                return (
                  <tr key={cap.code} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isHeld ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{cap.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{cap.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 hidden sm:table-cell max-w-md">
                      {cap.desc}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell">
                      {isHeld ? (
                        isGlobal ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                            Global Access
                          </span>
                        ) : (
                          <div className="py-0.5">
                            {(() => {
                              const isExpanded = expandedScopeCaps.has(cap.code);
                              const hasProjects = (grant?.allowedProjects?.length || 0) > 0 || projectCount > 0;
                              const hasUsers = (grant?.allowedUsers?.length || 0) > 0 || userCount > 0;

                              if (!hasProjects && !hasUsers) {
                                return <span className="text-[11px] text-slate-400 italic">No specific scope</span>;
                              }

                              const projectSummary = grant?.allowedProjects?.map((p) => p.name).join(', ');
                              const userSummary = grant?.allowedUsers?.map((u) => u.name).join(', ');

                              return (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleScopeExpanded(cap.code)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer group ${isExpanded
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                      }`}
                                    title={
                                      isExpanded
                                        ? 'Collapse scope list'
                                        : `Click to view assigned ${[projectSummary ? `projects (${projectSummary})` : null, userSummary ? `users (${userSummary})` : null].filter(Boolean).join(' and ')}`
                                    }
                                  >
                                    <FolderOpen size={11} className="text-blue-600" />
                                    <span>
                                      {[
                                        projectCount > 0 ? `${projectCount} project${projectCount === 1 ? '' : 's'}` : null,
                                        userCount > 0 ? `${userCount} user${userCount === 1 ? '' : 's'}` : null,
                                      ].filter(Boolean).join(', ')}
                                    </span>
                                    <ChevronDown
                                      size={11}
                                      className={`text-blue-500 group-hover:text-blue-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-1.5 flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded max-w-xs animate-fadeIn">
                                      {grant?.allowedProjects?.map((p) => (
                                        <span
                                          key={p.id}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                          title={p.name}
                                        >
                                          <FolderOpen size={9} className="text-slate-400 shrink-0" />
                                          <span className="truncate max-w-[120px]">{p.name}</span>
                                        </span>
                                      ))}
                                      {grant?.allowedUsers?.map((u) => (
                                        <span
                                          key={u.id}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                          title={u.name}
                                        >
                                          <User size={9} className="text-slate-400 shrink-0" />
                                          <span className="truncate max-w-[120px]">{u.name}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isHeld ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>GRANTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle size={11} />
                          <span>DENIED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredCapabilities.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-500">
                    No capabilities matched your filter query "{filterQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
