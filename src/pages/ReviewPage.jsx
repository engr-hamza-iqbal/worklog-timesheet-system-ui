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
} from "lucide-react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

export default function ReviewPage() {
  const { notify } = useNotification();
  const { isAdmin, capabilities } = useAuth();
  const canDecideTimeOff = isAdmin || !!capabilities['DECIDE_TIME_OFF'];

  const [activeTab, setActiveTab] = useState('timesheets');
  const [allEntries, setAllEntries] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
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

  const hasActiveFilters = Boolean(
    filters.userQuery || filters.projectQuery || filters.startDate || filters.endDate
  );

  function clearFilters() {
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
    try {
      setIsProcessing(`Approving ${entryIds.length} entr${entryIds.length === 1 ? "y" : "ies"}...`);
      await api.post("/api/reviews/approve", { entryIds });
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
    setSelected(checked ? filteredEntries.map((entry) => entry.id) : []);
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
    try {
      setIsProcessing("Returning entry for correction...");
      await api.post("/api/reviews/return", { entryId, comment: returnComment });
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
    try {
      setIsProcessing("Approving time off request...");
      await api.post(`/api/time-off/requests/${id}/decide`, { decision: "APPROVED" });
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
    if (!declineTarget || declineReason.trim().length < 3) return;
    try {
      setIsProcessing("Declining time off request...");
      await api.post(`/api/time-off/requests/${declineTarget.id}/decide`, {
        decision: "DECLINED",
        comment: declineReason.trim(),
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
        <table className="w-full text-left text-sm min-w-[680px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all submitted entries"
                  disabled={loading || !filteredEntries.length}
                  checked={
                    filteredEntries.length > 0 &&
                    filteredEntries.every((entry) => selected.includes(entry.id))
                  }
                  onChange={(e) => toggleAllEntries(e.target.checked)}
                  className="rounded border-slate-300 cursor-pointer"
                />
              </th>
              <th className="p-3">Employee</th>
              <th className="p-3">Date</th>
              <th className="p-3">Project</th>
              <th className="p-3">Hours</th>
              <th className="p-3">Description</th>
              <th className="p-3">Action</th>
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
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60 align-top transition-colors"
                >
                  <td className="p-3">
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
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{entry.user?.name}</div>
                    <div className="text-xs text-slate-500">{entry.user?.email}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap text-slate-700">{entry.workDate}</td>
                  <td className="p-3 text-slate-700 font-medium">{entry.project?.name}</td>
                  <td className="p-3 text-slate-700">{entry.durationHours}</td>
                  <td className="p-3 max-w-sm text-slate-600 break-words">{entry.description}</td>
                  <td className="p-3 whitespace-nowrap">
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
                    : scope
                      ? `No submitted entries found for ${scope}.`
                      : "No submitted entries pending review."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
          <table className="w-full text-left border-collapse text-xs min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeOffRequests.length ? (
                timeOffRequests.map((reqItem) => (
                  <tr key={reqItem.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{reqItem.user?.name}</div>
                      <div className="text-[11px] text-slate-500">{reqItem.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded font-medium text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {reqItem.type?.name || 'Leave'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {reqItem.startDate} &rarr; {reqItem.endDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {reqItem.days?.length || 1} day{(reqItem.days?.length || 1) > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={reqItem.reason}>
                      {reqItem.reason || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
