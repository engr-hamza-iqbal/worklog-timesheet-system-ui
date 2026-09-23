import React, { useEffect, useState } from "react";
import {
  Check,
  Filter,
  RotateCcw,
  Send,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function ReviewPage() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  async function load(filterValues = filters) {
    const query = Object.fromEntries(
      Object.entries(filterValues).filter(([, value]) => value),
    );
    const cacheKey = `review-queue:${JSON.stringify(query)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setEntries(cachedData.entries || []);
        setScope(cachedData.scope || null);
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
    try {
      setError("");
      setLoading(true);
      const response = await api.get("/api/reviews", { params: query });
      setEntries(response.data?.entries || []);
      setScope(response.data?.scope);
      setSelected([]);
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function clearFilters() {
    const clearedFilters = {
      userQuery: "",
      projectQuery: "",
      startDate: "",
      endDate: "",
    };
    setFilters(clearedFilters);
    load(clearedFilters);
  }

  function applyFilters(event) {
    event.preventDefault();
    if (filters.startDate && filters.endDate && filters.endDate < filters.startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    load();
  }

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
      setNotice(
        `${entryIds.length} entr${entryIds.length === 1 ? "y" : "ies"} approved.`,
      );
      await load();
    } catch (err) {
      setError(err.message);
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
    setSelected(checked ? entries.map((entry) => entry.id) : []);
  }

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
      setNotice("Entry returned for correction.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workflow
          </p>
          <h1 className="text-2xl font-semibold">Review queue</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Refresh review queue"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      <form
        onSubmit={applyFilters}
        className="bg-white border border-slate-200 rounded-lg p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(150px,.85fr)_minmax(150px,.85fr)_auto_auto] mb-5 items-end"
      >
        <input
          placeholder="Employee name or email"
          value={filters.userQuery}
          onChange={(e) => setFilters({ ...filters, userQuery: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Project name"
          value={filters.projectQuery}
          onChange={(e) =>
            setFilters({ ...filters, projectQuery: e.target.value })
          }
          className="border rounded-md px-3 py-2 text-sm"
        />
        <label className="text-xs font-medium text-slate-600">
          Start date
          <input
            aria-label="Start date"
            type="date"
            max={filters.endDate || undefined}
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          End date
          <input
            aria-label="End date"
            type="date"
            min={filters.startDate || undefined}
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <button
          className="rounded-md bg-slate-900 text-white px-3 py-2 text-sm inline-flex justify-center items-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          <Filter size={15} />
          {loading ? "Loading" : "Filter"}
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 inline-flex justify-center items-center gap-2 hover:bg-slate-50"
        >
          <X size={15} />
          Clear
        </button>
      </form>
      <div className="flex items-center gap-3 mb-3">
        <button
          disabled={!selected.length || loading}
          onClick={approve}
          className="rounded-md bg-emerald-700 disabled:opacity-40 text-white px-3 py-2 text-sm inline-flex items-center gap-2"
        >
          <Check size={15} />
          Approve selected
        </button>
        <span className="text-sm text-slate-500">
          {entries.length} submitted entr{entries.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <div className="relative overflow-x-auto bg-white border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  aria-label="Select all submitted entries"
                  disabled={loading || !entries.length}
                  checked={
                    entries.length > 0 && selected.length === entries.length
                  }
                  onChange={(e) => toggleAllEntries(e.target.checked)}
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
            {loading && !entries.length ? (
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
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-slate-100 align-top"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(entry.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, entry.id]
                            : selected.filter((id) => id !== entry.id),
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{entry.user?.name}</div>
                    <div className="text-xs text-slate-500">
                      {entry.user?.email}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{entry.workDate}</td>
                  <td className="p-3">{entry.project?.name}</td>
                  <td className="p-3">{entry.durationHours}</td>
                  <td className="p-3 min-w-52">{entry.description}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        title="Approve"
                        onClick={() => approveOne(entry.id)}
                        className="text-emerald-700 hover:text-emerald-900"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        title="Return with comment"
                        onClick={() => setReturningId(entry.id)}
                        className="text-red-700 hover:text-red-900"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading && entries.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
              <Loader2 size={18} className="animate-spin text-slate-500" />
              Refreshing review queue
            </div>
          </div>
        )}
        {!loading && !entries.length && (
          <div className="p-10 text-center text-sm text-slate-500">
            No submitted entries match this scope.
          </div>
        )}
      </div>
      {returningId && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h2 className="font-semibold mb-2">Return entry</h2>
            <p className="text-sm text-slate-500 mb-3">
              Explain what needs correcting. A comment of at least five
              characters is required.
            </p>
            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-md p-3 text-sm min-h-28"
              placeholder="Correction needed..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-2 text-sm border rounded-md"
                onClick={() => {
                  setReturningId(null);
                  setComment("");
                }}
              >
                Cancel
              </button>
              <button
                disabled={comment.trim().length < 5}
                className="px-3 py-2 text-sm rounded-md bg-red-700 text-white disabled:opacity-40 inline-flex items-center gap-2"
                onClick={returnEntry}
              >
                <Send size={14} />
                Return entry
              </button>
            </div>
          </div>
        </div>
      )}
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
