import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Send,
  Pencil,
  RefreshCw,
  Loader2,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

function dateOnly(date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date) {
  const result = dateOnly(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

const statusVariant = {
  DRAFT: "inactive",
  SUBMITTED: "pending",
  APPROVED: "active",
  RETURNED: "revoked",
};

export default function TimesheetsPage() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [days, setDays] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    projectId: "",
    workDate: iso(new Date()),
    durationHours: "0.25",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const dateRange = { startDate: iso(weekStart), endDate: iso(weekEnd) };

  async function load() {
    const cacheKey = `timesheet:${dateRange.startDate}:${dateRange.endDate}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setDays(cachedData.days || []);
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
    try {
      setError("");
      setLoading(true);
      const [entriesResult, projectsResult] = await Promise.allSettled([
        api.get("/api/timesheets", { params: dateRange }),
        projects.length
          ? Promise.resolve({ data: projects })
          : api.get("/api/projects", {
              params: { activeOnly: true, assignedToMe: true },
            }),
      ]);
      if (entriesResult.status === "fulfilled") {
        setDays(entriesResult.value.data?.days || []);
        sessionStorage.setItem(cacheKey, JSON.stringify(entriesResult.value.data));
      }

      if (projectsResult.status === "fulfilled") {
        const projectsResponse = projectsResult.value;
        const nextProjects = Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : projectsResponse.data?.projects || [];
        setProjects(nextProjects);
        setForm((current) => ({
          ...current,
          projectId: current.projectId || nextProjects[0]?.id || "",
        }));
      }

      if (entriesResult.status === "rejected" || projectsResult.status === "rejected") {
        const failedRequest = entriesResult.status === "rejected"
          ? entriesResult.reason
          : projectsResult.reason;
        throw failedRequest;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [weekStart.toISOString()]);

  function resetForm(date = iso(weekStart)) {
    setEditingId(null);
    setForm({
      projectId: projects[0]?.id || "",
      workDate: date,
      durationHours: "0.25",
      description: "",
    });
  }

  function editEntry(entry) {
    setEditingId(entry.id);
    setForm({
      projectId: entry.projectId,
      workDate: entry.workDate,
      durationHours: String(entry.durationHours),
      description: entry.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEntry(event) {
    event.preventDefault();
    const payload = {
      projectId: form.projectId,
      workDate: form.workDate,
      durationMinutes: Math.round(Number(form.durationHours) * 60),
      description: form.description,
    };
    setConfirmation({
      title: editingId ? "Update time entry" : "Add time entry",
      message: editingId
        ? "Save these changes to the time entry?"
        : "Add this work log as a draft?",
      confirmLabel: editingId ? "Update entry" : "Add entry",
      onConfirm: () => saveEntryConfirmed(payload, editingId),
    });
  }

  async function saveEntryConfirmed(payload, entryId) {
    setConfirmation(null);
    try {
      setError("");
      setNotice("");
      if (entryId) await api.put(`/api/timesheets/${entryId}`, payload);
      else await api.post("/api/timesheets", payload);
      setNotice(entryId ? "Entry updated." : "Entry saved as draft.");
      resetForm(form.workDate);
      sessionStorage.removeItem(
        `timesheet:${dateRange.startDate}:${dateRange.endDate}`,
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeEntry(id) {
    setConfirmation({
      title: "Delete draft entry",
      message: "Delete this draft time entry? This action cannot be undone.",
      confirmLabel: "Delete entry",
      tone: "danger",
      onConfirm: () => removeEntryConfirmed(id),
    });
  }

  async function removeEntryConfirmed(id) {
    setConfirmation(null);
    try {
      await api.delete(`/api/timesheets/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitEntries(entryIds) {
    setConfirmation({
      title: "Submit entries for review",
      message: `Submit ${entryIds.length} entr${entryIds.length === 1 ? "y" : "ies"} for review? You will not be able to edit them until they are returned or reopened.`,
      confirmLabel: "Submit entries",
      onConfirm: () => submitEntriesConfirmed(entryIds),
    });
  }

  async function submitEntriesConfirmed(entryIds) {
    setConfirmation(null);
    try {
      await api.post("/api/timesheets/submit", { entryIds });
      setNotice("Entries submitted for review.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const dayMap = Object.fromEntries(days.map((day) => [day.date, day]));

  return (
    <main className="max-w-auto mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Work logging
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            My timesheet
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 border rounded-md hover:bg-slate-50"
            title="Previous week"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="px-3 py-2 border rounded-md text-sm hover:bg-slate-50"
            onClick={() => setWeekStart(mondayOf(new Date()))}
          >
            Today
          </button>
          <button
            className="p-2 border rounded-md hover:bg-slate-50"
            title="Next week"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            title="Refresh timesheet"
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
        onSubmit={saveEntry}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid gap-3 md:grid-cols-[1fr_1fr_120px_2fr_auto] items-end shadow-sm"
      >
        <label className="text-xs font-medium text-slate-600">
          Project
          <select
            required
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">
              {loading ? "Loading projects..." : projects.length ? "Select project" : "No assigned projects"}
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.clientName || project.client?.name || "Unassigned client"} / {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Date
          <input
            required
            type="date"
            value={form.workDate}
            onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Hours
          <input
            required
            min="0.25"
            max="16"
            step="0.25"
            type="number"
            value={form.durationHours}
            onChange={(e) =>
              setForm({ ...form, durationHours: e.target.value })
            }
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Description
          <input
            required
            minLength="5"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What did you work on?"
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-3 py-2 text-sm border rounded-md hover:bg-slate-50"
              onClick={() => resetForm()}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
        <CalendarDays size={16} />
        {iso(weekStart)} to {iso(weekEnd)}
        <span className="ml-auto">
          {days.reduce((total, day) => total + day.totalMinutes, 0) / 60} hours
          this week
        </span>
      </div>
      <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && days.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
              <Loader2 size={18} className="animate-spin text-slate-500" />
              Refreshing week
            </div>
          </div>
        )}
        {loading && !days.length ? (
          <div className="md:col-span-2 xl:col-span-4 min-h-64 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
            <div className="text-center">
              <Loader2
                className="mx-auto mb-2 animate-spin text-slate-400"
                size={26}
              />
              <p className="text-sm text-slate-500">Loading your week...</p>
            </div>
          </div>
        ) : (
          Array.from({ length: 7 }, (_, index) => {
            const date = iso(addDays(weekStart, index));
            const day = dayMap[date] || { date, totalMinutes: 0, entries: [] };
            const editable = day.entries.filter(
              (entry) =>
                entry.status === "DRAFT" || entry.status === "RETURNED",
            );
            return (
              <section
                key={date}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm min-w-0"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {addDays(weekStart, index).toLocaleDateString(undefined, {
                        weekday: "short",
                      })}
                    </h2>
                    <p className="text-xs text-slate-500">{date}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${day.totalMinutes >= 1440 ? "text-red-600" : "text-slate-700"}`}
                  >
                    {day.totalMinutes / 60} / 24h
                  </span>
                </div>
                <div className="space-y-3 min-h-20 max-h-[28rem] overflow-y-auto pr-1">
                  {day.entries.length ? (
                    day.entries.map((entry) => (
                      <article
                        key={entry.id}
                        className="border-t border-slate-100 pt-3"
                      >
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.project?.name}
                            </p>
                            <p className="text-xs text-slate-500 break-words">
                              {entry.durationHours}h · {entry.description}
                            </p>
                          </div>
                          <Badge
                            variant={statusVariant[entry.status]}
                            label={entry.status}
                          />
                        </div>
                        {entry.returnComment && (
                          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                            {entry.returnComment}
                          </p>
                        )}
                        {editable.length > 0 &&
                          (entry.status === "DRAFT" ||
                            entry.status === "RETURNED") && (
                            <div className="mt-2 flex gap-2">
                              <button
                                title="Edit entry"
                                onClick={() => editEntry(entry)}
                                className="text-xs text-slate-600 inline-flex items-center gap-1 hover:text-slate-900"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                              <button
                                title="Delete entry"
                                onClick={() => removeEntry(entry.id)}
                                className="text-xs text-red-600 inline-flex items-center gap-1 hover:text-red-800"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          )}
                      </article>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4">
                      No entries logged
                    </p>
                  )}
                </div>
                {editable.length > 0 && (
                  <button
                    onClick={() =>
                      submitEntries(editable.map((entry) => entry.id))
                    }
                    className="mt-4 w-full border rounded-md px-3 py-2 text-xs font-medium inline-flex justify-center items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Send size={13} />
                    Submit day
                  </button>
                )}
              </section>
            );
          })
        )}
      </div>
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
