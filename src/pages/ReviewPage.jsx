import React, { useEffect, useState, useMemo } from "react";
import {
  Check,
  RotateCcw,
  Send,
  RefreshCw,
  X,
  Loader2,
  Search,
} from "lucide-react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

export default function ReviewPage() {
  const { notify } = useNotification();

  const [allEntries, setAllEntries] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Load latest entries from DB
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
      const response = await api.get("/api/reviews");
      const fetchedEntries = response.data?.entries || [];
      setAllEntries(fetchedEntries);
      setScope(response.data?.scope || null);
      setSelected([]);
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));

      if (isManualRefresh) {
        notify.info("Review queue refreshed with latest entries.");
      }
    } catch (err) {
      notify.error(err.message || "Failed to load review queue.");
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
    setConfirmation(null);
    try {
      await api.post("/api/reviews/approve", { entryIds });
      notify.success(
        `${entryIds.length} entr${entryIds.length === 1 ? "y" : "ies"} approved successfully.`
      );
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to approve entries.");
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
    setConfirmation(null);
    try {
      await api.post("/api/reviews/return", { entryId, comment: returnComment });
      setReturningId(null);
      setComment("");
      notify.success("Entry returned for correction.");
      await load();
    } catch (err) {
      notify.error(err.message || "Failed to return entry.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Submitted Entries</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and approve employee timesheet entries awaiting verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-xs"
            title="Refresh latest submitted entries from database"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Auto-filtering Toolbar (No Filter submit button; auto-filters in-memory without DB roundtrips) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Employee
            </label>
            <div className="relative">
              <input
                placeholder="Search name or email..."
                value={filters.userQuery}
                onChange={(e) => handleFilterChange("userQuery", e.target.value)}
                className="w-full border border-slate-300 rounded-md pl-8 pr-3 py-2 text-sm focus:border-slate-900 focus:outline-none transition"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Project
            </label>
            <input
              placeholder="Search project..."
              value={filters.projectQuery}
              onChange={(e) => handleFilterChange("projectQuery", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-slate-900 focus:outline-none transition"
            />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start date
            </label>
            <input
              aria-label="Start date"
              type="date"
              max={filters.endDate || undefined}
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-slate-900 focus:outline-none transition"
            />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End date
            </label>
            <input
              aria-label="End date"
              type="date"
              min={filters.startDate || undefined}
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-slate-900 focus:outline-none transition"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 inline-flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                title="Clear all active filters"
              >
                <X size={15} />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Filter stats & helper text */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
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
      <div className="flex items-center gap-3 mb-3">
        <button
          disabled={!selected.length || loading}
          onClick={approve}
          className="rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white px-3 py-2 text-sm inline-flex items-center gap-2 transition cursor-pointer"
        >
          <Check size={15} />
          Approve selected {selected.length > 0 && `(${selected.length})`}
        </button>
        <span className="text-sm text-slate-500">
          {filteredEntries.length} submitted entr{filteredEntries.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Entries Table */}
      <div className="relative overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-xs">
        <table className="w-full text-left text-sm">
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
                disabled={comment.trim().length < 5}
                className="px-3.5 py-2 text-sm font-medium rounded-md bg-rose-700 hover:bg-rose-800 text-white disabled:opacity-40 inline-flex items-center gap-2 transition cursor-pointer"
                onClick={returnEntry}
              >
                <Send size={14} />
                Return entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
      />
    </main>
  );
}
