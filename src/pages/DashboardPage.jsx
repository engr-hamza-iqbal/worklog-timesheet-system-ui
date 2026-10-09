import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';
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
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  User,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Globe,
  Layers,
  Sliders,
  Filter,
  MoreVertical,
  Shield,
} from 'lucide-react';

const SYSTEM_CAPABILITIES = [
  {
    code: 'ASSIGN_PROJECTS',
    name: 'Assign Projects',
    desc: 'Assign and remove employees on client projects',
    icon: Users,
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    lastUpdated: 'Oct 8, 2026',
    route: '/clients-projects',
  },
  {
    code: 'DECIDE_TIME_OFF',
    name: 'Decide Time Off',
    desc: 'Approve or decline employee time-off requests',
    icon: Calendar,
    iconBg: 'bg-violet-50 text-violet-600 border-violet-100',
    lastUpdated: 'Oct 7, 2026',
    route: '/review',
  },
  {
    code: 'MANAGE_CLIENTS_PROJECTS',
    name: 'Manage Clients & Projects',
    desc: 'Create and configure clients, projects, and billing rates',
    icon: FolderOpen,
    iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    lastUpdated: 'Oct 5, 2026',
    route: '/clients-projects',
  },
  {
    code: 'MANAGE_USERS',
    name: 'Manage Users',
    desc: 'Create and manage user accounts',
    icon: Users,
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    lastUpdated: 'Oct 5, 2026',
    route: '/users',
  },
  {
    code: 'REVIEW_TIME',
    name: 'Review Time',
    desc: 'Approve, return, or re-open submitted time entries',
    icon: Clock,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    lastUpdated: 'Oct 4, 2026',
    route: '/review',
  },
  {
    code: 'VIEW_ANALYTICS',
    name: 'View Analytics',
    desc: 'View utilization rates and billable hours distribution',
    icon: BarChart3,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    lastUpdated: 'Oct 3, 2026',
    route: '/analytics',
  },
  {
    code: 'VIEW_REPORTS',
    name: 'View Reports',
    desc: 'Access cross-project summary reports and CSV exports',
    icon: FileSpreadsheet,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    lastUpdated: 'Oct 2, 2026',
    route: '/reports',
  },
  {
    code: 'VIEW_BILLING',
    name: 'View Billing',
    desc: 'Access sensitive billing rate figures and monetary totals',
    icon: DollarSign,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    lastUpdated: 'Oct 1, 2026',
    route: '/clients-projects',
  },
  {
    code: 'VIEW_OTHER_RECORDS',
    name: 'View Other Records',
    desc: 'View work logs and timesheets of other staff members',
    icon: Users,
    iconBg: 'bg-slate-50 text-slate-600 border-slate-200',
    lastUpdated: 'Oct 1, 2026',
    route: '/timesheet',
  },
];

export default function DashboardPage() {
  const { user, capabilities, isAdmin, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'GRANTED' | 'RESTRICTED'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [expandedScopeCaps, setExpandedScopeCaps] = useState(new Set());
  const [projectsCount, setProjectsCount] = useState(4);
  const [pendingCount, setPendingCount] = useState(3);

  // Fetch real counts for metric cards with fallbacks
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const [projectsRes, reviewsRes, timeOffRes] = await Promise.allSettled([
          api.get('/api/projects', { params: { activeOnly: true } }),
          isAdmin || capabilities?.REVIEW_TIME
            ? api.get('/api/reviews')
            : Promise.resolve({ data: { entries: [] } }),
          isAdmin || capabilities?.DECIDE_TIME_OFF
            ? api.get('/api/time-off/requests', { params: { status: 'PENDING' } })
            : Promise.resolve({ data: [] }),
        ]);

        if (projectsRes.status === 'fulfilled') {
          const list = Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data
            : projectsRes.value.data?.projects || [];
          setProjectsCount(list.length);
        }

        let pending = 0;
        if (reviewsRes.status === 'fulfilled') {
          const revEntries = reviewsRes.value.data?.entries || [];
          pending += revEntries.length;
        }
        if (timeOffRes.status === 'fulfilled') {
          const toRequests = Array.isArray(timeOffRes.value.data)
            ? timeOffRes.value.data
            : [];
          pending += toRequests.length;
        }
        setPendingCount(pending);
      } catch {
        // Fallback gracefully
      }
    }

    fetchDashboardStats();
  }, [isAdmin, capabilities]);

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

  const percentageGranted = Math.round(
    (grantedCount / SYSTEM_CAPABILITIES.length) * 100
  );

  // Filtered and sorted capabilities list
  const filteredCapabilities = useMemo(() => {
    let list = SYSTEM_CAPABILITIES;

    if (statusFilter !== 'ALL') {
      list = list.filter((c) => {
        const isHeld = isAdmin || !!capabilities[c.code];
        return statusFilter === 'GRANTED' ? isHeld : !isHeld;
      });
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q)
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
        const aGlobal =
          isAdmin || capabilities[a.code]?.isGlobal
            ? 2
            : capabilities[a.code]
            ? 1
            : 0;
        const bGlobal =
          isAdmin || capabilities[b.code]?.isGlobal
            ? 2
            : capabilities[b.code]
            ? 1
            : 0;
        comparison = aGlobal - bGlobal;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filterQuery, statusFilter, sortField, sortOrder, isAdmin, capabilities]);

  const greetingTime = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <main className="flex-1 max-w-auto w-full mx-auto px-4 py-6 sm:px-6">
      {/* ── Welcome Greeting Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="absolute right-1/4 top-0 -mt-10 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Greeting & Summary */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2">
              WELCOME BACK
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5">
              {greetingTime}, {userName}! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mb-6">
              Here&apos;s what&apos;s happening with your workspace. Track authorization coverage,
              review access scopes, and manage your organization&apos;s resources.
            </p>

            <div>
              <a
                href="#capabilities-section"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-md w-fit cursor-pointer"
              >
                <span>Go to Capabilities</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* Middle Decorative Glass Shield Illustration (Desktop) */}
          <div className="hidden xl:flex items-center justify-center lg:col-span-1">
            <div className="relative w-28 h-32 rounded-2xl bg-gradient-to-tr from-white/10 to-indigo-500/20 border border-white/20 backdrop-blur-md shadow-2xl rotate-6 flex items-center justify-center">
              <ShieldCheck className="w-14 h-14 text-indigo-300 drop-shadow-md" />
            </div>
          </div>

          {/* Right Column: Glass Status Widgets */}
          <div className="lg:col-span-6 xl:col-span-4 flex flex-col gap-3">
            {/* Widget 1: Authorization Coverage */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Mini Donut Progress Ring */}
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800/80"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-400 transition-all duration-700"
                      strokeDasharray={`${percentageGranted}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Authorization Coverage
                  </div>
                  <div className="text-lg font-bold text-white flex items-baseline gap-2 mt-0.5">
                    <span>{grantedCount} / {SYSTEM_CAPABILITIES.length}</span>
                    <span className="text-xs font-semibold text-cyan-300">{percentageGranted}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {percentageGranted === 100
                      ? 'All capabilities authorized'
                      : `${grantedCount} capabilities authorized`}
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-indigo-200" />
              </div>
            </div>

            {/* Widget 2: Assigned Role */}
            <Link
              to="/profile"
              className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-sm flex items-center justify-between gap-3 hover:bg-white/15 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-300">Assigned Role</div>
                  <div className="text-sm font-bold text-white truncate">
                    {isAdmin ? 'Administrator' : 'Employee'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isAdmin ? 'Full system access' : 'Standard workspace access'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </Link>

            {/* Widget 3: Active Projects */}
            <Link
              to="/clients-projects"
              className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-sm flex items-center justify-between gap-3 hover:bg-white/15 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
                  <FolderOpen size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-300">Active Projects</div>
                  <div className="text-sm font-bold text-white flex items-baseline gap-1.5 truncate">
                    <span>{projectsCount}</span>
                    <span className="text-xs font-normal text-slate-400">Projects under management</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick KPI Metric Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Capabilities */}
        <a
          href="#capabilities-section"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Total Capabilities</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {SYSTEM_CAPABILITIES.length}
              </div>
              <div className="text-[11px] text-slate-400 truncate">System capabilities available</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </a>

        {/* Card 2: Granted Permissions */}
        <a
          href="#capabilities-section"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Granted Permissions</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {grantedCount}
              </div>
              <div className="text-[11px] text-slate-400 truncate">Capabilities currently authorized</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </a>

        {/* Card 3: Pending Requests */}
        <Link
          to={isAdmin || capabilities?.REVIEW_TIME ? '/review' : '/time-off'}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Pending Requests</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {pendingCount}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isAdmin || capabilities?.REVIEW_TIME ? 'Awaiting your approval' : 'Awaiting review'}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </Link>

        {/* Card 4: Active Projects */}
        <Link
          to="/clients-projects"
          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <FolderOpen size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Active Projects</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {projectsCount}
              </div>
              <div className="text-[11px] text-slate-400 truncate">Projects under management</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </Link>
      </div>

      {/* ── System Capabilities Table Card ── */}
      <div id="capabilities-section" className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                System Capabilities &amp; Access Scopes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time authorization matrix determining route access, project approvals, and administrative actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search filter input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search capabilities..."
                className="w-full sm:w-60 pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            {/* Filter Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  statusFilter !== 'ALL'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <Filter size={13} />
                <span>{statusFilter === 'ALL' ? 'Filter' : statusFilter === 'GRANTED' ? 'Granted' : 'Restricted'}</span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('ALL'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${
                      statusFilter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('GRANTED'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${
                      statusFilter === 'GRANTED' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Granted only
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('RESTRICTED'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${
                      statusFilter === 'RESTRICTED' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Restricted only
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-60 shadow-2xs"
              aria-label="Refresh permissions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-slate-900' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <ResizableTh
                  onClick={() => toggleSort('name')}
                  className="py-3 px-5 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Capability</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('desc')}
                  className="py-3 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Description</span>
                    {sortField === 'desc' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('scope')}
                  className="py-3 px-4 hidden md:table-cell cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Scope Authorization</span>
                    {sortField === 'scope' ? (
                      sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
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
                <ResizableTh className="py-3 px-4 hidden lg:table-cell text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Last Updated</span>
                </ResizableTh>
                <ResizableTh className="py-3 px-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Actions</span>
                </ResizableTh>
              </tr>
            </TableHead>
            <TableBody>
              {filteredCapabilities.map((cap) => {
                const Icon = cap.icon;
                const grant = capabilities[cap.code];
                const isHeld = isAdmin || !!grant;
                const isGlobal = isAdmin || grant?.isGlobal;
                const projectCount = grant?.allowedProjectIds?.length || 0;
                const userCount = grant?.allowedUserIds?.length || 0;

                return (
                  <TableRow key={cap.code}>
                    {/* Capability column */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cap.iconBg}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm" title={cap.name}>{cap.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{cap.code}</div>
                        </div>
                      </div>
                    </td>

                    {/* Description column */}
                    <td className="py-3.5 px-4 text-slate-600 hidden sm:table-cell text-xs" title={cap.desc}>
                      {cap.desc}
                    </td>

                    {/* Scope Authorization column */}
                    <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell">
                      {isHeld ? (
                        isGlobal ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                            <Globe size={13} />
                            <span>Global Access</span>
                          </span>
                        ) : (
                          <div>
                            {(() => {
                              const isExpanded = expandedScopeCaps.has(cap.code);
                              const hasProjects = (grant?.allowedProjects?.length || 0) > 0 || projectCount > 0;
                              const hasUsers = (grant?.allowedUsers?.length || 0) > 0 || userCount > 0;

                              if (!hasProjects && !hasUsers) {
                                return <span className="text-xs text-slate-400 italic">No specific scope</span>;
                              }

                              const projectSummary = grant?.allowedProjects?.map((p) => p.name).join(', ');
                              const userSummary = grant?.allowedUsers?.map((u) => u.name).join(', ');

                              return (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleScopeExpanded(cap.code)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                                      isExpanded
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    <FolderOpen size={13} className="text-blue-600" />
                                    <span>
                                      {[
                                        projectCount > 0 ? `${projectCount} project${projectCount === 1 ? '' : 's'}` : null,
                                        userCount > 0 ? `${userCount} user${userCount === 1 ? '' : 's'}` : null,
                                      ].filter(Boolean).join(', ')}
                                    </span>
                                    <ChevronDown
                                      size={12}
                                      className={`text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-1.5 flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl max-w-xs animate-in fade-in duration-100">
                                      {grant?.allowedProjects?.map((p) => (
                                        <span
                                          key={p.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                        >
                                          <FolderOpen size={10} className="text-slate-400 shrink-0" />
                                          <span className="truncate max-w-[120px]">{p.name}</span>
                                        </span>
                                      ))}
                                      {grant?.allowedUsers?.map((u) => (
                                        <span
                                          key={u.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                        >
                                          <User size={10} className="text-slate-400 shrink-0" />
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
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Status column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isHeld ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Granted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle size={13} className="text-slate-400" />
                          <span>Restricted</span>
                        </span>
                      )}
                    </td>

                    {/* Last Updated column */}
                    <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap">
                      <div className="text-xs text-slate-700 font-medium">{cap.lastUpdated}</div>
                      <div className="text-[10px] text-slate-400">by {isAdmin ? userName : 'Admin'}</div>
                    </td>

                    {/* Actions column */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <Link
                        to={cap.route}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title={`Open ${cap.name}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </TableRow>
                );
              })}
              {filteredCapabilities.length === 0 && (
                <TableRow hover={false}>
                  <TableTd colSpan={6} align="center" className="py-10 text-xs text-slate-400">
                    No capabilities matched your search "{filterQuery}".
                  </TableTd>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
