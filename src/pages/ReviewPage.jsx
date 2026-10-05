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
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import useTableResize from "../hooks/useTableResize.js";
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

  // Resizable columns for entries queue
  const { columnWidths: entriesWidths, startResize: startEntriesResize, tableStyle: entriesTableStyle } = useTableResize({
    select: 48,
    employee: 180,
    workDate: 120,
    project: 180,
    durationMinutes: 90,
    description: 280,
    action: 110,
  });

  // Resizable columns for time off queue
  const { columnWidths: timeOffWidths, startResize: startTimeOffResize, tableStyle: timeOffTableStyle } = useTableResize({
    employee: 200,
    type: 140,
    startDate: 190,
    days: 100,
    reason: 260,
    actions: 140,
  });
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

  // Automatic client-side filtering over loaded in-memory data (no DB fetch per keystroke)
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      // Filter by Employee Name or Email
      if (filters.userQuery.trim()) {
        const q = filters.userQuery.trim().toLowerCase();
        const name = (entry.user?.name || "").toLowerCase();
        const email = (entry.user?.email || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      // Filter by Project Name
      if (filters.projectQuery.trim()) {
        const q = filters.projectQuery.trim().toLowerCase();
        const projName = (entry.project?.name || "").toLowerCase();
        if (!projName.includes(q)) return false;
      }

      // Filter by Start Date
      if (filters.startDate) {
        if (entry.workDate < filters.startDate) return false;
      }

      // Filter by End Date
      if (filters.endDate) {
        if (entry.workDate > filters.endDate) return false;
      }

      return true;
    });
  }, [allEntries, filters]);

  const [entrySortField, setEntrySortField] = useState('workDate');
  const [entrySortOrder, setEntrySortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleEntrySort = (field) => {
    if (entrySortField === field) {
      setEntrySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setEntrySortField(field);
      setEntrySortOrder(field === 'workDate' || field === 'durationMinutes' ? 'desc' : 'asc');
    }
    setPage(1);
  };

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
        cmp = (Number(a.durationMinutes) || 0) - (Number(b.durationMinutes) || 0);
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

  const sortedTimeOffRequests = useMemo(() => {
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
    return sortedTimeOffRequests.slice(start, start + TIME_OFF_PER_PAGE);
  }, [sortedTimeOffRequests, timeOffPage]);

  const hasActiveFilters = Boolean(
    filters.userQuery || filters.projectQuery || filters.startDate || filters.endDate
  );

  function clearFilters() {
    setPage(1);
    setFilters({
      userQuery: "",
      projectQuery: "",
      startDate: "",
      endDate: "",
    });
  }

  function handleFilterChange(key, value) {
    if (key === "endDate" && filters.startDate && value && value < filters.startDate) {
      notify.warn("End date cannot be earlier than start date.");
      return;
    }
    if (key === "startDate" && filters.endDate && value && value > filters.endDate) {
      notify.warn("Start date cannot be later than end date.");
      return;
    }
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // Batch Approval
  async function approve() {
    if (!selected.length) return;
    setConfirmation({
      title: "Approve submitted entries",
      message: `Approve ${selected.length} submitted entr${selected.length === 1 ? "y" : "ies"}? This will lock the approved records from employee editing.`,
      confirmLabel: "Approve",
      onConfirm: () => approveConfirmed(selected),
    });
  }

  async function approveConfirmed(entryIds) {
    const parsed = entryIdsSchema.safeParse({ entryIds });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Select at least one entry.");
      return;
    }
    try {
      setIsProcessing(`Approving ${parsed.data.entryIds.length} entr${parsed.data.entryIds.length === 1 ? "y" : "ies"}...`);
      await api.post("/api/reviews/approve", parsed.data);
      notify.success(
        `${entryIds.length} entr${entryIds.length === 1 ? "y" : "ies"} approved successfully.`
      );
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to approve entries.");
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
    }
  }

  async function approveOne(entryId) {
    setConfirmation({
      title: "Approve submitted entry",
      message: "Approve this submitted entry? The employee will no longer be able to edit it.",
      confirmLabel: "Approve",
      onConfirm: () => approveConfirmed([entryId]),
    });
  }

  function toggleAllEntries(checked) {
    setSelected(checked ? paginatedEntries.map((entry) => entry.id) : []);
  }

  // Return Entry for Correction
  async function returnEntry() {
    if (!returningId || comment.trim().length < 5) return;
    const entryId = returningId;
    const returnComment = comment.trim();
    setConfirmation({
      title: "Return entry for correction",
      message: "Return this entry to the employee with the provided correction comment?",
      confirmLabel: "Return entry",
      tone: "danger",
      onConfirm: () => returnConfirmed(entryId, returnComment),
    });
  }

  async function returnConfirmed(entryId, returnComment) {
    const parsed = reviewReturnSchema.safeParse({ entryId, comment: returnComment });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Return comment is required.");
      return;
    }
    try {
      setIsProcessing("Returning entry for correction...");
      await api.post("/api/reviews/return", parsed.data);
      setReturningId(null);
      setComment("");
      notify.success("Entry returned for correction.");
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to return entry.");
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
    }
  }

  // ─── Time Off Review Actions ────────────────────────────────────────────────
  function handleApproveTimeOff(item) {
    setConfirmation({
      title: "Approve time off request",
      message: `Approve time off for ${item.user?.name || "employee"} from ${item.startDate} to ${item.endDate}?`,
      confirmLabel: "Approve request",
      onConfirm: () => confirmApproveTimeOff(item.id),
    });
  }

  async function confirmApproveTimeOff(id) {
    const parsed = timeOffDecisionSchema.safeParse({ decision: "APPROVED", comment: "" });
    if (!parsed.success) return;
    try {
      setIsProcessing("Approving time off request...");
      await api.post(`/api/time-off/requests/${id}/decide`, parsed.data);
      notify.success("Time off request approved.");
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to approve time off request.");
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleOpenDeclineTimeOff(item) {
    setDeclineTarget(item);
    setDeclineReason("");
  }

  async function confirmDeclineTimeOff() {
    if (!declineTarget) return;
    const parsed = timeOffDecisionSchema.safeParse({ decision: "DECLINED", comment: declineReason });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Decline comment is required.");
      return;
    }
    try {
      setIsProcessing("Declining time off request...");
      await api.post(`/api/time-off/requests/${declineTarget.id}/decide`, {
        ...parsed.data,
      });
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
    <main className="mx-auto w-full max-w-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Review Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted timesheets and decide time off requests within your authorized scope.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-xs"
            title="Refresh review queue"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex border-b border-slate-200 mb-5 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'timesheets'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={16} />
          <span>Timesheet Submissions</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {allEntries.length}
          </span>
        </button>

        {canDecideTimeOff && (
          <button
            onClick={() => setActiveTab('timeoff')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'timeoff'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays size={16} />
            <span>Time Off Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              timeOffRequests.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {timeOffRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'timesheets' ? (
        <>
          {/* Auto-filtering Toolbar (No Filter submit button; auto-filters in-memory without DB roundtrips) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Employee
                </label>
                <div className="relative">
                  <input
                    placeholder="Search name or email..."
                    value={filters.userQuery}
                    onChange={(e) => handleFilterChange("userQuery", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                  />
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Project
                </label>
                <input
                  placeholder="Search project..."
                  value={filters.projectQuery}
                  onChange={(e) => handleFilterChange("projectQuery", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Start date
                </label>
                <input
                  aria-label="Start date"
                  type="date"
                  max={filters.endDate || undefined}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    End date
                  </label>
                  <input
                    aria-label="End date"
                    type="date"
                    min={filters.startDate || undefined}
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 inline-flex items-center justify-center gap-1 hover:bg-slate-50 transition cursor-pointer shrink-0"
                    title="Clear all active filters"
                  >
                    <X size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter stats & helper text */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {hasActiveFilters ? (
              <>
                Filtered <strong className="text-slate-800">{filteredEntries.length}</strong> of{" "}
                <strong className="text-slate-800">{allEntries.length}</strong> entries
              </>
            ) : (
              `Showing all ${allEntries.length} submitted entries`
            )}
          </span>
        </div>
      </div>

      {/* Batch Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <button
          disabled={!selected.length || loading || Boolean(isProcessing)}
          onClick={approve}
          className="w-full sm:w-auto rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white px-3 py-2 text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Check size={15} />}
          {isProcessing ? "Processing..." : `Approve selected ${selected.length > 0 ? `(${selected.length})` : ""}`}
        </button>
        <span className="text-xs sm:text-sm text-slate-500">
          {filteredEntries.length} submitted entr{filteredEntries.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Entries Table */}
      <div className="relative overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-xs">
        <table className="text-left text-sm min-w-[680px] table-fixed" style={entriesTableStyle}>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 select-none">
            <tr>
              <ResizableTh
                width={entriesWidths.select}
                resizable={false}
                className="p-3"
              >
                <input
                  type="checkbox"
                  aria-label="Select all submitted entries on this page"
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
                width={entriesWidths.employee}
                onResizeStart={(e) => startEntriesResize('employee', e)}
                onClick={() => toggleEntrySort('employee')}
                className="p-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Employee</span>
                  {entrySortField === 'employee' ? (
                    entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                width={entriesWidths.workDate}
                onResizeStart={(e) => startEntriesResize('workDate', e)}
                onClick={() => toggleEntrySort('workDate')}
                className="p-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Date</span>
                  {entrySortField === 'workDate' ? (
                    entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                width={entriesWidths.project}
                onResizeStart={(e) => startEntriesResize('project', e)}
                onClick={() => toggleEntrySort('project')}
                className="p-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Project</span>
                  {entrySortField === 'project' ? (
                    entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                width={entriesWidths.durationMinutes}
                onResizeStart={(e) => startEntriesResize('durationMinutes', e)}
                onClick={() => toggleEntrySort('durationMinutes')}
                className="p-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Hours</span>
                  {entrySortField === 'durationMinutes' ? (
                    entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                width={entriesWidths.description}
                onResizeStart={(e) => startEntriesResize('description', e)}
                onClick={() => toggleEntrySort('description')}
                className="p-3 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">Description</span>
                  {entrySortField === 'description' ? (
                    entrySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                width={entriesWidths.action}
                resizable={false}
                className="p-3"
              >
                <span className="truncate">Action</span>
              </ResizableTh>
            </tr>
          </thead>
          <tbody>
            {loading && !allEntries.length ? (
              <tr>
                <td colSpan="7" className="p-12 text-center">
                  <Loader2
                    className="mx-auto mb-2 animate-spin text-slate-400"
                    size={22}
                  />
                  <span className="text-sm text-slate-500">
                    Loading submitted entries...
                  </span>
                </td>
              </tr>
            ) : paginatedEntries.length > 0 ? (
              paginatedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 align-top transition-colors"
                >
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden">
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
                  </td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden">
                    <div className="font-medium text-slate-900 truncate">{entry.user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{entry.user?.email}</div>
                  </td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden text-slate-700">{entry.workDate}</td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden text-slate-700 font-medium">
                    <div className="truncate" title={entry.project?.name}>{entry.project?.name}</div>
                  </td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden text-slate-700">{entry.durationHours}</td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden text-slate-600">
                    <div className="truncate" title={entry.description}>{entry.description}</div>
                  </td>
                  <td className="p-3 truncate whitespace-nowrap overflow-hidden">
                    <div className="flex gap-2">
                      <button
                        title="Approve entry"
                        onClick={() => approveOne(entry.id)}
                        className="p-1 rounded-md text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        title="Return with comment"
                        onClick={() => setReturningId(entry.id)}
                        className="p-1 rounded-md text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-sm text-slate-500">
                  {hasActiveFilters
                    ? "No submitted entries match the active filters."
                    : "No submitted entries pending review."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={page}
          totalItems={filteredEntries.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />

        {loading && allEntries.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
              <Loader2 size={18} className="animate-spin text-slate-500" />
              Refreshing review queue...
            </div>
          </div>
        )}
      </div>
      </>
      ) : (
        /* Time Off Requests Queue */
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-xs">
          <table className="text-left border-collapse text-xs min-w-[640px] table-fixed" style={timeOffTableStyle}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] select-none">
                <ResizableTh
                  width={timeOffWidths.employee}
                  onResizeStart={(e) => startTimeOffResize('employee', e)}
                  onClick={() => toggleTimeOffSort('employee')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">Employee</span>
                    {timeOffSortField === 'employee' ? (
                      timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  width={timeOffWidths.type}
                  onResizeStart={(e) => startTimeOffResize('type', e)}
                  onClick={() => toggleTimeOffSort('type')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">Leave Type</span>
                    {timeOffSortField === 'type' ? (
                      timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  width={timeOffWidths.startDate}
                  onResizeStart={(e) => startTimeOffResize('startDate', e)}
                  onClick={() => toggleTimeOffSort('startDate')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">Dates</span>
                    {timeOffSortField === 'startDate' ? (
                      timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  width={timeOffWidths.days}
                  onResizeStart={(e) => startTimeOffResize('days', e)}
                  onClick={() => toggleTimeOffSort('days')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">Days</span>
                    {timeOffSortField === 'days' ? (
                      timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  width={timeOffWidths.reason}
                  onResizeStart={(e) => startTimeOffResize('reason', e)}
                  onClick={() => toggleTimeOffSort('reason')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">Reason</span>
                    {timeOffSortField === 'reason' ? (
                      timeOffSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
                <ResizableTh
                  width={timeOffWidths.actions}
                  onResizeStart={(e) => startTimeOffResize('actions', e)}
                  className="py-3 px-4 text-right"
                  resizable={false}
                >
                  <span className="truncate">Actions</span>
                </ResizableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTimeOff.length ? (
                paginatedTimeOff.map((reqItem) => (
                  <tr key={reqItem.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden">
                      <div className="font-semibold text-slate-900 truncate">{reqItem.user?.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{reqItem.user?.email}</div>
                    </td>
                    <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden">
                      <span className="inline-block px-2 py-0.5 rounded font-medium text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 truncate">
                        {reqItem.type?.name || 'Leave'}
                      </span>
                    </td>
                    <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden text-slate-700 font-medium">
                      {reqItem.startDate} &rarr; {reqItem.endDate}
                    </td>
                    <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden text-slate-600">
                      {reqItem.days?.length || 1} day{(reqItem.days?.length || 1) > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden text-slate-600">
                      <div className="truncate" title={reqItem.reason}>{reqItem.reason || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-right truncate whitespace-nowrap overflow-hidden">
                      {reqItem.status === 'EXPIRED' || reqItem.startDate < new Date().toISOString().split('T')[0] ? (
                        <div className="flex items-center justify-end truncate">
                          <Badge variant="expired" label="Expired" dot />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 truncate">
                          <button
                            type="button"
                            onClick={() => handleApproveTimeOff(reqItem)}
                            disabled={Boolean(isProcessing)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeclineTimeOff(reqItem)}
                            disabled={Boolean(isProcessing)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-sm text-slate-500">
                    No pending time off requests awaiting decision.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={timeOffPage}
            totalItems={timeOffRequests.length}
            itemsPerPage={TIME_OFF_PER_PAGE}
            onPageChange={setTimeOffPage}
          />
        </div>
      )}

      {/* Return Entry Comment Modal */}
      {returningId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Return entry</h2>
            <p className="text-xs text-slate-500 mb-3">
              Explain what needs correcting. A comment of at least 5 characters is required.
            </p>
            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-3 text-sm min-h-28 focus:border-slate-900 focus:outline-none"
              placeholder="Correction required..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-3.5 py-2 text-sm font-medium border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => {
                  setReturningId(null);
                  setComment("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={comment.trim().length < 5 || Boolean(isProcessing)}
                className="px-3.5 py-2 text-sm font-medium rounded-md bg-rose-700 hover:bg-rose-800 text-white disabled:opacity-40 inline-flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
                onClick={returnEntry}
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Send size={14} />}
                {isProcessing ? "Returning..." : "Return entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Time Off Request Modal */}
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
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              When declining a time off request, an explanatory reason is mandatory.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
              <span className="font-semibold">Request:</span> {declineTarget.type?.name || 'Leave'} ({declineTarget.startDate} to {declineTarget.endDate})
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for declining (mandatory)
              </label>
              <textarea
                autoFocus
                required
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain why this request cannot be approved..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeclineTarget(null);
                  setDeclineReason("");
                }}
                disabled={Boolean(isProcessing)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeclineTimeOff}
                disabled={declineReason.trim().length < 3 || Boolean(isProcessing)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded transition cursor-pointer"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isProcessing ? "Declining..." : "Decline Request"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Dialog */}
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
