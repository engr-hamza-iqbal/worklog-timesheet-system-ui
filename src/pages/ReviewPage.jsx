import React, { useEffect, useState, useMemo } from "react";
import {
  Check,
  RotateCcw,
  Send,
  RefreshCw,
  X,
  Loader2,
  Search,
  CalendarDays,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Globe,
  Layers,
  FolderOpen,
} from "lucide-react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import Table, { TableHead, TableBody, TableRow, TableTd } from "../components/Table.jsx";
import ResizableTh from "../components/ResizableTh.jsx";
import { entryIdsSchema, reviewReturnSchema, timeOffDecisionSchema } from "../validation/formSchemas.js";

export default function ReviewPage() {
  const { notify } = useNotification();
  const { isAdmin, capabilities } = useAuth();
  const canReviewTime = isAdmin || !!capabilities['REVIEW_TIME'];
  const canDecideTimeOff = isAdmin || !!capabilities['DECIDE_TIME_OFF'];

  const [activeTab, setActiveTab] = useState(() => (canReviewTime ? 'timesheets' : (canDecideTimeOff ? 'timeoff' : 'timesheets')));

  useEffect(() => {
    if (!canDecideTimeOff && activeTab === 'timeoff') {
      setActiveTab('timesheets');
    }
  }, [canDecideTimeOff, activeTab]);

  const [allEntries, setAllEntries] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [timeOffPage, setTimeOffPage] = useState(1);
  const TIME_OFF_PER_PAGE = 10;

  const [scope, setScope] = useState(null);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    userQuery: "",
    projectQuery: "",
    startDate: "",
    endDate: "",
  });
  const [comment, setComment] = useState("");
  const [returningId, setReturningId] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Sorting state for submitted entries
  const [entrySortField, setEntrySortField] = useState('workDate');
  const [entrySortOrder, setEntrySortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleEntrySort = (field) => {
    if (entrySortField === field) {
      setEntrySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setEntrySortField(field);
      setEntrySortOrder(field === 'workDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  // Sorting state for time off requests
  const [timeOffSortField, setTimeOffSortField] = useState('startDate');
  const [timeOffSortOrder, setTimeOffSortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleTimeOffSort = (field) => {
    if (timeOffSortField === field) {
      setTimeOffSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTimeOffSortField(field);
      setTimeOffSortOrder(field === 'startDate' ? 'desc' : 'asc');
    }
    setTimeOffPage(1);
  };

  // Load latest entries and pending time off requests from DB
  async function load(isManualRefresh = false) {
    const cacheKey = "review-queue:all";
    if (!isManualRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          setAllEntries(cachedData.entries || []);
          setScope(cachedData.scope || null);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    try {
      setLoading(true);
      const [entriesRes, timeOffRes] = await Promise.allSettled([
        api.get("/api/reviews"),
        canDecideTimeOff
          ? api.get("/api/time-off/requests", { params: { status: "PENDING" } })
          : Promise.resolve({ data: [] }),
      ]);

      if (entriesRes.status === "fulfilled") {
        const fetchedEntries = entriesRes.value.data?.entries || [];
        setAllEntries(fetchedEntries);
        setScope(entriesRes.value.data?.scope || null);
        setSelected([]);
        sessionStorage.setItem(cacheKey, JSON.stringify(entriesRes.value.data));
      }

      if (timeOffRes.status === "fulfilled") {
        const toData = Array.isArray(timeOffRes.value.data) ? timeOffRes.value.data : [];
        setTimeOffRequests(toData);
      }

      if (isManualRefresh) {
        notify.info("Review queue refreshed with latest submissions.");
      }
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || "Failed to load review queue.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Automatic client-side filtering over loaded in-memory data
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (filters.userQuery.trim()) {
        const q = filters.userQuery.trim().toLowerCase();
        const name = (entry.user?.name || "").toLowerCase();
        const email = (entry.user?.email || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      if (filters.projectQuery.trim()) {
        const q = filters.projectQuery.trim().toLowerCase();
        const projName = (entry.project?.name || "").toLowerCase();
        if (!projName.includes(q)) return false;
      }

      if (filters.startDate) {
        if (entry.workDate < filters.startDate) return false;
      }

      if (filters.endDate) {
        if (entry.workDate > filters.endDate) return false;
      }

      return true;
    });
  }, [allEntries, filters]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let cmp = 0;
      if (entrySortField === 'employee') {
        cmp = (a.user?.name || '').localeCompare(b.user?.name || '');
      } else if (entrySortField === 'workDate') {
        cmp = (a.workDate || '').localeCompare(b.workDate || '');
      } else if (entrySortField === 'project') {
        cmp = (a.project?.name || '').localeCompare(b.project?.name || '');
      } else if (entrySortField === 'durationMinutes') {
        cmp = (a.durationMinutes || 0) - (b.durationMinutes || 0);
      } else if (entrySortField === 'description') {
        cmp = (a.description || '').localeCompare(b.description || '');
      }
      return entrySortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredEntries, entrySortField, entrySortOrder]);

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEntries, page]);

  const sortedTimeOff = useMemo(() => {
    return [...timeOffRequests].sort((a, b) => {
      let cmp = 0;
      if (timeOffSortField === 'employee') {
        cmp = (a.user?.name || '').localeCompare(b.user?.name || '');
      } else if (timeOffSortField === 'type') {
        cmp = (a.type?.name || '').localeCompare(b.type?.name || '');
      } else if (timeOffSortField === 'startDate') {
        cmp = (a.startDate || '').localeCompare(b.startDate || '');
      } else if (timeOffSortField === 'days') {
        cmp = (a.days?.length || 1) - (b.days?.length || 1);
      } else if (timeOffSortField === 'reason') {
        cmp = (a.reason || '').localeCompare(b.reason || '');
      }
      return timeOffSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [timeOffRequests, timeOffSortField, timeOffSortOrder]);

  const paginatedTimeOff = useMemo(() => {
    const start = (timeOffPage - 1) * TIME_OFF_PER_PAGE;
    return sortedTimeOff.slice(start, start + TIME_OFF_PER_PAGE);
  }, [sortedTimeOff, timeOffPage]);

  // Total hours across submitted entries
  const totalSubmittedHours = useMemo(() => {
    const totalMins = allEntries.reduce((sum, e) => sum + (e.durationMinutes || Math.round((Number(e.durationHours) || 0) * 60)), 0);
    return (totalMins / 60).toFixed(1);
  }, [allEntries]);

  // Selected entries total hours
  const selectedHours = useMemo(() => {
    const selEntries = allEntries.filter((e) => selected.includes(e.id));
    const mins = selEntries.reduce((sum, e) => sum + (e.durationMinutes || Math.round((Number(e.durationHours) || 0) * 60)), 0);
    return (mins / 60).toFixed(1);
  }, [allEntries, selected]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userQuery: "",
      projectQuery: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.userQuery.trim() ||
    filters.projectQuery.trim() ||
    filters.startDate ||
    filters.endDate
  );

  const toggleAllEntries = (checked) => {
    if (checked) {
      const pageIds = paginatedEntries.map((e) => e.id);
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedEntries.map((e) => e.id));
      setSelected((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  async function approve() {
    if (!selected.length) return;
    const parsed = entryIdsSchema.safeParse({ entryIds: selected });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Select at least one entry.");
      return;
    }
    setConfirmation({
      title: "Approve submitted entries",
      message: `Are you sure you want to approve ${selected.length} submitted time entries?`,
      confirmLabel: "Approve entries",
      onConfirm: async () => {
        try {
          setIsProcessing(`Approving ${selected.length} entries...`);
          await api.post("/api/reviews/approve", parsed.data);
          notify.success(`Approved ${selected.length} entries.`);
          setSelected([]);
          setConfirmation(null);
          await load();
        } catch (err) {
          notify.error(err.message || "Failed to approve entries.");
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  async function approveOne(id) {
    const parsed = entryIdsSchema.safeParse({ entryIds: [id] });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Invalid entry.");
      return;
    }
    setConfirmation({
      title: "Approve time entry",
      message: "Are you sure you want to approve this submitted time entry?",
      confirmLabel: "Approve",
      onConfirm: async () => {
        try {
          setIsProcessing("Approving entry...");
          await api.post("/api/reviews/approve", parsed.data);
          notify.success("Entry approved.");
          setSelected((prev) => prev.filter((item) => item !== id));
          setConfirmation(null);
          await load();
        } catch (err) {
          notify.error(err.message || "Failed to approve entry.");
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  async function returnEntry() {
    if (!returningId) return;
    const parsed = reviewReturnSchema.safeParse({ entryId: returningId, comment });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Provide a reason (at least 5 characters).");
      return;
    }
    try {
      setIsProcessing("Returning entry...");
      await api.post("/api/reviews/return", parsed.data);
      notify.success("Entry returned to employee with comment.");
      setReturningId(null);
      setComment("");
      setSelected((prev) => prev.filter((id) => id !== returningId));
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to return entry.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleApproveTimeOff(reqItem) {
    const parsed = timeOffDecisionSchema.safeParse({ decision: "APPROVED", comment: "" });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Decision error.");
      return;
    }
    setConfirmation({
      title: "Approve Time Off Request",
      message: `Approve time off request for ${reqItem.user?.name || "Employee"} (${reqItem.startDate} to ${reqItem.endDate})?`,
      confirmLabel: "Approve Time Off",
      tone: "primary",
      onConfirm: async () => {
        try {
          setIsProcessing("Approving time off...");
          await api.post(`/api/time-off/requests/${reqItem.id}/decide`, parsed.data);
          notify.success("Time off request approved.");
          setConfirmation(null);
          await load();
        } catch (err) {
          notify.error(err.message || "Failed to approve time off request.");
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  function handleOpenDeclineTimeOff(reqItem) {
    setDeclineTarget(reqItem);
    setDeclineReason("");
  }

  async function confirmDeclineTimeOff() {
    if (!declineTarget) return;
    const parsed = timeOffDecisionSchema.safeParse({ decision: "DECLINED", comment: declineReason });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Provide an explanation (at least 3 characters).");
      return;
    }
    try {
      setIsProcessing("Declining time off...");
      await api.post(`/api/time-off/requests/${declineTarget.id}/decide`, parsed.data);
      notify.success("Time off request declined.");
      setDeclineTarget(null);
      setDeclineReason("");
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to decline time off request.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-4 sm:px-6">
      {/* ── Page Header & Quick Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Review submitted timesheets and decide time off requests within your authorized scope.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {scope && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <Globe size={13} className="text-slate-500" />
              <span>{scope.isGlobal ? "Global Scope" : `${scope.allowedProjectIds?.length || 0} Projects Scoped`}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            title="Refresh review queue"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-slate-900" : "text-slate-500"} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setActiveTab('timesheets')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
            activeTab === 'timesheets' ? "border-indigo-300 ring-2 ring-indigo-50" : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Timesheets Pending</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{allEntries.length}</div>
              <div className="text-[11px] text-slate-400">Entries awaiting review</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Volume to Review</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalSubmittedHours} <span className="text-xs font-semibold text-slate-500">hrs</span></div>
              <div className="text-[11px] text-slate-400">Submitted work hours</div>
            </div>
          </div>
        </div>

        {canDecideTimeOff && (
          <div
            onClick={() => setActiveTab('timeoff')}
            className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
              activeTab === 'timeoff' ? "border-amber-300 ring-2 ring-amber-50" : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarDays size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">Time Off Requests</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{timeOffRequests.length}</div>
                <div className="text-[11px] text-slate-400">Awaiting approval</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Selected for Approval</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {selected.length} <span className="text-xs font-normal text-slate-400">({selectedHours}h)</span>
              </div>
              <div className="text-[11px] text-slate-400">Ready for batch action</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modern Pill Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timesheets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'timesheets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={14} />
          <span>Timesheet Submissions</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'timesheets' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {allEntries.length}
          </span>
        </button>

        {canDecideTimeOff && (
          <button
            type="button"
            onClick={() => setActiveTab('timeoff')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'timeoff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays size={14} />
            <span>Time Off Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'timeoff' ? 'bg-white/20 text-white' : (timeOffRequests.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700')
            }`}>
              {timeOffRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* ── Active Tab Content ── */}
      {activeTab === 'timesheets' ? (
        <div className="space-y-4">
          {/* ── Integrated Table & Filter Card ── */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            {/* Toolbar & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee
                  </label>
                  <div className="relative">
                    <input
                      placeholder="Search name or email..."
                      value={filters.userQuery}
                      onChange={(e) => handleFilterChange("userQuery", e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl pl-8 pr-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                    />
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <input
                    placeholder="Search project..."
                    value={filters.projectQuery}
                    onChange={(e) => handleFilterChange("projectQuery", e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    aria-label="Start date"
                    type="date"
                    max={filters.endDate || undefined}
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      aria-label="End date"
                      type="date"
                      min={filters.startDate || undefined}
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange("endDate", e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 inline-flex items-center justify-center gap-1 hover:bg-slate-50 transition cursor-pointer shrink-0 shadow-2xs"
                      title="Clear active filters"
                    >
                      <X size={13} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Batch Actions & Selection Header */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    disabled={!selected.length || loading || Boolean(isProcessing)}
                    onClick={approve}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Check size={13} />}
                    <span>{isProcessing ? "Processing..." : `Approve Selected ${selected.length > 0 ? `(${selected.length})` : ""}`}</span>
                  </button>
                  {selected.length > 0 && (
                    <span className="text-xs text-slate-500 font-medium">
                      Selected volume: <strong className="text-slate-800">{selectedHours} hrs</strong>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  {hasActiveFilters ? (
                    <>
                      Filtered <strong className="text-slate-800">{filteredEntries.length}</strong> of{" "}
                      <strong className="text-slate-800">{allEntries.length}</strong> submitted entries
                    </>
                  ) : (
                    <>Showing all <strong className="text-slate-800">{allEntries.length}</strong> submitted entries</>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <tr>
                    <ResizableTh className="p-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        aria-label="Select all entries on this page"
                        disabled={loading || !paginatedEntries.length}
                        checked={
                          paginatedEntries.length > 0 &&
                          paginatedEntries.every((entry) => selected.includes(entry.id))
                        }
                        onChange={(e) => toggleAllEntries(e.target.checked)}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </ResizableTh>
                    <ResizableTh
                      onClick={() => toggleEntrySort('employee')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Employee</span>
                        {entrySortField === 'employee' ? (
                          entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                    <ResizableTh
                      onClick={() => toggleEntrySort('workDate')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {entrySortField === 'workDate' ? (
                          entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                    <ResizableTh
                      onClick={() => toggleEntrySort('project')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Project</span>
                        {entrySortField === 'project' ? (
                          entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                    <ResizableTh
                      onClick={() => toggleEntrySort('durationMinutes')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Hours</span>
                        {entrySortField === 'durationMinutes' ? (
                          entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                    <ResizableTh
                      onClick={() => toggleEntrySort('description')}
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Description</span>
                        {entrySortField === 'description' ? (
                          entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                        )}
                      </div>
                    </ResizableTh>
                    <ResizableTh className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Actions</span>
                    </ResizableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {loading && !allEntries.length ? (
                    <TableRow hover={false}>
                      <TableTd colSpan={7} align="center" className="p-12 text-center text-xs text-slate-500">
                        <Loader2 className="mx-auto mb-2 animate-spin text-slate-400" size={20} />
                        <span>Loading submitted entries...</span>
                      </TableTd>
                    </TableRow>
                  ) : paginatedEntries.length > 0 ? (
                    paginatedEntries.map((entry) => (
                      <TableRow key={entry.id} className="align-middle">
                        <TableTd className="p-3.5 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selected.includes(entry.id)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, entry.id]
                                  : selected.filter((id) => id !== entry.id)
                              )
                            }
                            className="rounded border-slate-300 cursor-pointer"
                          />
                        </TableTd>
                        <TableTd className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 text-xs">{entry.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{entry.user?.email}</div>
                        </TableTd>
                        <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-700 text-xs font-medium">
                          {entry.workDate}
                        </TableTd>
                        <TableTd className="px-4 py-3.5 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium">
                            <FolderOpen size={12} className="text-slate-500" />
                            <span title={entry.project?.name}>{entry.project?.name}</span>
                          </span>
                        </TableTd>
                        <TableTd className="px-4 py-3.5 whitespace-nowrap text-xs">
                          <span className="font-bold text-slate-900">{entry.durationHours}</span>
                          <span className="text-slate-400 ml-1">hrs</span>
                        </TableTd>
                        <TableTd className="px-4 py-3.5 text-slate-600 text-xs min-w-[180px] max-w-sm whitespace-normal">
                          <div className="line-clamp-2" title={entry.description}>{entry.description}</div>
                        </TableTd>
                        <TableTd className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="Approve entry"
                              onClick={() => approveOne(entry.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              title="Return with comment"
                              onClick={() => setReturningId(entry.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </TableTd>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow hover={false}>
                      <TableTd colSpan={7} align="center" className="p-10 text-center text-xs text-slate-500">
                        {hasActiveFilters
                          ? "No submitted entries match the active filters."
                          : "No submitted entries pending review."}
                      </TableTd>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={page}
              totalItems={filteredEntries.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        </div>
      ) : (
        /* ── Time Off Requests Queue Tab ── */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarDays size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Time Off Requests
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {timeOffRequests.length} pending request{timeOffRequests.length === 1 ? '' : 's'} awaiting approval
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <ResizableTh
                    onClick={() => toggleTimeOffSort('employee')}
                    className="px-5 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Employee</span>
                      {timeOffSortField === 'employee' ? (
                        timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleTimeOffSort('type')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Leave Type</span>
                      {timeOffSortField === 'type' ? (
                        timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleTimeOffSort('startDate')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dates</span>
                      {timeOffSortField === 'startDate' ? (
                        timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleTimeOffSort('days')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Days</span>
                      {timeOffSortField === 'days' ? (
                        timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleTimeOffSort('reason')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Reason</span>
                      {timeOffSortField === 'reason' ? (
                        timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Actions</span>
                  </ResizableTh>
                </tr>
              </TableHead>
              <TableBody>
                {paginatedTimeOff.length ? (
                  paginatedTimeOff.map((reqItem) => (
                    <TableRow key={reqItem.id} className="align-middle">
                      <TableTd className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs">{reqItem.user?.name}</div>
                        <div className="text-[11px] text-slate-400">{reqItem.user?.email}</div>
                      </TableTd>
                      <TableTd className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-medium text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {reqItem.type?.name || 'Leave'}
                        </span>
                      </TableTd>
                      <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium text-xs">
                        {reqItem.startDate} &rarr; {reqItem.endDate}
                      </TableTd>
                      <TableTd className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        {reqItem.days?.length || 1} day{(reqItem.days?.length || 1) > 1 ? 's' : ''}
                      </TableTd>
                      <TableTd className="px-4 py-3.5 text-slate-600 min-w-[150px] max-w-xs whitespace-normal text-xs">
                        <div className="line-clamp-2" title={reqItem.reason}>{reqItem.reason || '—'}</div>
                      </TableTd>
                      <TableTd className="px-5 py-3.5 text-right whitespace-nowrap">
                        {reqItem.status === 'EXPIRED' || reqItem.startDate < new Date().toISOString().split('T')[0] ? (
                          <div className="flex items-center justify-end">
                            <Badge variant="expired" label="Expired" dot />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveTimeOff(reqItem)}
                              disabled={Boolean(isProcessing)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeclineTimeOff(reqItem)}
                              disabled={Boolean(isProcessing)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </TableTd>
                    </TableRow>
                  ))
                ) : (
                  <TableRow hover={false}>
                    <TableTd colSpan={6} align="center" className="p-10 text-center text-xs text-slate-500">
                      No pending time off requests awaiting decision.
                    </TableTd>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={timeOffPage}
            totalItems={timeOffRequests.length}
            itemsPerPage={TIME_OFF_PER_PAGE}
            onPageChange={setTimeOffPage}
          />
        </div>
      )}

      {/* ── Return Entry Comment Modal (Standard Modal) ── */}
      <Modal
        isOpen={Boolean(returningId)}
        onClose={() => {
          if (!isProcessing) {
            setReturningId(null);
            setComment("");
          }
        }}
        title="Return Time Entry to Employee"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Explain what needs correcting on this timesheet entry. A descriptive comment of at least 5 characters is required.
          </p>
          <textarea
            autoFocus
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-3 text-xs sm:text-sm focus:border-slate-900 focus:outline-none transition shadow-2xs resize-none"
            placeholder="Correction required: e.g. Please verify duration hours or add more details on task deliverables..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              onClick={() => {
                setReturningId(null);
                setComment("");
              }}
              disabled={Boolean(isProcessing)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={comment.trim().length < 5 || Boolean(isProcessing)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-700 hover:bg-rose-800 text-white disabled:opacity-40 inline-flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
              onClick={returnEntry}
            >
              {isProcessing ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Send size={13} />}
              <span>{isProcessing ? "Returning..." : "Return Entry"}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Decline Time Off Request Modal (Standard Modal) ── */}
      {declineTarget && (
        <Modal
          isOpen={Boolean(declineTarget)}
          onClose={() => {
            if (!isProcessing) {
              setDeclineTarget(null);
              setDeclineReason("");
            }
          }}
          title={`Decline Time Off — ${declineTarget.user?.name || "Employee"}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              When declining a time off request, an explanatory reason is mandatory.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Request:</span> {declineTarget.type?.name || 'Leave'} ({declineTarget.startDate} to {declineTarget.endDate})
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for declining (mandatory)
              </label>
              <textarea
                autoFocus
                required
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain why this request cannot be approved..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-none transition shadow-2xs resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeclineTarget(null);
                  setDeclineReason("");
                }}
                disabled={Boolean(isProcessing)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeclineTimeOff}
                disabled={declineReason.trim().length < 3 || Boolean(isProcessing)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isProcessing ? "Declining..." : "Decline Request"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => (isProcessing ? null : setConfirmation(null))}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
        loading={isProcessing}
      />
    </main>
  );
}
