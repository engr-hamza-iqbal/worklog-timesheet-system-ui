import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Send,
  Pencil,
  RefreshCw,
  Loader2,
  Search,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import useTableResize from "../hooks/useTableResize.js";
import ResizableTh from "../components/ResizableTh.jsx";
import { timeEntryFormSchema } from "../validation/timeEntrySchemas.js";
import { entryIdsSchema } from "../validation/formSchemas.js";

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

const QUICK_HOURS = ["0.25", "0.5", "0.75", "1.0", "1.5", "2.0", "4.0", "8.0"];

export default function TimesheetsPage() {
  const { user, isAdmin } = useAuth();
  const { notify } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "record"; // 'record' | 'week' | 'entries'
  const setActiveTab = (tab) => setSearchParams({ tab });

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
  const [loading, setLoading] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Entries history tab state
  const [historySearch, setHistorySearch] = useState("");
  const [historyProject, setHistoryProject] = useState("");
  const [historyStatus, setHistoryStatus] = useState("ALL");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [historySortField, setHistorySortField] = useState('workDate');
  const [historySortOrder, setHistorySortOrder] = useState('desc');
  const [filterProjects, setFilterProjects] = useState([]);
  const ITEMS_PER_PAGE = 10;

  const allKnownEntriesRef = useRef(new Map());
  const silentFetchTimerRef = useRef(null);

  const cacheEntries = (list) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (item && item.id) {
        allKnownEntriesRef.current.set(item.id, item);
      }
    }
  };

  useEffect(() => {
    if (Array.isArray(days)) {
      cacheEntries(days.flatMap((d) => d.entries || []));
    }
  }, [days]);

  useEffect(() => {
    if (Array.isArray(historyEntries)) {
      cacheEntries(historyEntries);
    }
  }, [historyEntries]);

  useEffect(() => {
    return () => {
      if (silentFetchTimerRef.current) clearTimeout(silentFetchTimerRef.current);
    };
  }, []);

  const allDropdownProjects = useMemo(() => {
    const map = new Map();
    (filterProjects || []).forEach((p) => {
      if (p?.id) map.set(p.id, p);
    });
    (projects || []).forEach((p) => {
      if (p?.id) map.set(p.id, p);
    });
    (historyEntries || []).forEach((e) => {
      if (e?.project?.id && !map.has(e.project.id)) {
        map.set(e.project.id, e.project);
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [filterProjects, projects, historyEntries]);

  // Resizable columns for entries table
  const { columnWidths, startResize, tableStyle } = useTableResize({
    workDate: 120,
    project: 180,
    durationHours: 90,
    description: 300,
    status: 120,
    actions: 120,
  });

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
      setLoading(true);
      const [entriesResult, projectsResult] = await Promise.allSettled([
        api.get("/api/timesheets", { params: dateRange }),
        api.get("/api/projects", {
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
          projectId: nextProjects.some((p) => p.id === current.projectId)
            ? current.projectId
            : nextProjects[0]?.id || "",
        }));
      }

      if (entriesResult.status === "rejected" || projectsResult.status === "rejected") {
        const failedRequest =
          entriesResult.status === "rejected"
            ? entriesResult.reason
            : projectsResult.reason;
        throw failedRequest;
      }
    } catch (err) {
      if (err.status !== 401 && err.code !== "ACCOUNT_DEACTIVATED") {
        notify.error(err.message || "Failed to load timesheet data.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [weekStart.toISOString(), isAdmin]);

  const filterKnownEntries = ({
    status = historyStatus,
    project = historyProject,
    search = historySearch,
  } = {}) => {
    const all = Array.from(allKnownEntriesRef.current.values());
    return all.filter((entry) => {
      if (status !== "ALL") {
        if (status === "RETURNED") {
          if (entry.status !== "RETURNED" && !entry.wasReturned && !entry.returnComment) return false;
        } else if (entry.status !== status) {
          return false;
        }
      }
      if (project && entry.projectId !== project && entry.project?.id !== project) return false;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const desc = (entry.description || "").toLowerCase();
        const proj = (entry.project?.name || "").toLowerCase();
        if (!desc.includes(q) && !proj.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (historySortField === 'workDate') {
        cmp = (a.workDate || '').localeCompare(b.workDate || '');
      } else if (historySortField === 'project') {
        cmp = (a.project?.name || '').localeCompare(b.project?.name || '');
      } else if (historySortField === 'durationHours') {
        cmp = (Number(a.durationHours) || 0) - (Number(b.durationHours) || 0);
      } else if (historySortField === 'description') {
        cmp = (a.description || '').localeCompare(b.description || '');
      } else if (historySortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return historySortOrder === 'asc' ? cmp : -cmp;
    });
  };

  async function fetchHistory({
    page = historyPage,
    search = historySearch,
    projectId = historyProject,
    status = historyStatus,
    sortBy = historySortField,
    sortOrder = historySortOrder,
    silent = false,
  } = {}) {
    try {
      if (!silent) setHistoryLoading(true);
      setIsSilentFetching(true);
      const response = await api.get("/api/timesheets/history", {
        params: {
          page,
          pageSize: ITEMS_PER_PAGE,
          search: search.trim() || undefined,
          projectId: projectId || undefined,
          status: status === "ALL" ? undefined : status,
          sortBy,
          sortOrder,
        },
      });
      const entries = response.data?.entries || [];
      const total = response.data?.pagination?.total || 0;
      cacheEntries(entries);
      setHistoryEntries(entries);
      setHistoryTotal(total);
    } catch (err) {
      if (err.status !== 401 && err.code !== "ACCOUNT_DEACTIVATED") {
        notify.error(err.message || "Failed to load entry history.");
      }
    } finally {
      setHistoryLoading(false);
      setIsSilentFetching(false);
      setIsFiltering(false);
    }
  }

  useEffect(() => {
    if (activeTab === "entries") {
      fetchHistory({ silent: historyEntries.length > 0 });
      if (filterProjects.length === 0) {
        api.get("/api/projects", {
          params: { activeOnly: true },
        }).then((res) => {
          const nextProjects = Array.isArray(res.data) ? res.data : res.data?.projects || [];
          if (nextProjects.length) setFilterProjects(nextProjects);
        }).catch(() => {});
      }
    }
  }, [activeTab]);

  const handleFilterStatusChange = (st) => {
    if (historyStatus === st || isFiltering) return;
    setHistoryStatus(st);
    setHistoryPage(1);
    setIsFiltering(true);

    // 1. FAST: Immediately filter from already loaded table data
    const local = filterKnownEntries({ status: st, project: historyProject, search: historySearch });
    setHistoryEntries(local.slice(0, ITEMS_PER_PAGE));
    setHistoryTotal(local.length);

    // 2. SILENT FETCH: In the background after some time, fetch fresh server data
    if (silentFetchTimerRef.current) clearTimeout(silentFetchTimerRef.current);
    silentFetchTimerRef.current = setTimeout(() => {
      fetchHistory({
        status: st,
        projectId: historyProject,
        search: historySearch,
        page: 1,
        silent: true,
      });
    }, 250);
  };

  const handleFilterProjectChange = (projId) => {
    if (historyProject === projId || isFiltering) return;
    setHistoryProject(projId);
    setHistoryPage(1);
    setIsFiltering(true);

    const local = filterKnownEntries({ status: historyStatus, project: projId, search: historySearch });
    setHistoryEntries(local.slice(0, ITEMS_PER_PAGE));
    setHistoryTotal(local.length);

    if (silentFetchTimerRef.current) clearTimeout(silentFetchTimerRef.current);
    silentFetchTimerRef.current = setTimeout(() => {
      fetchHistory({
        status: historyStatus,
        projectId: projId,
        search: historySearch,
        page: 1,
        silent: true,
      });
    }, 250);
  };

  const handleFilterSearchChange = (query) => {
    setHistorySearch(query);
    setHistoryPage(1);
    setIsFiltering(true);

    const local = filterKnownEntries({ status: historyStatus, project: historyProject, search: query });
    setHistoryEntries(local.slice(0, ITEMS_PER_PAGE));
    setHistoryTotal(local.length);

    if (silentFetchTimerRef.current) clearTimeout(silentFetchTimerRef.current);
    silentFetchTimerRef.current = setTimeout(() => {
      fetchHistory({
        status: historyStatus,
        projectId: historyProject,
        search: query,
        page: 1,
        silent: true,
      });
    }, 350);
  };

  const handleHistoryPageChange = (p) => {
    setHistoryPage(p);
    fetchHistory({ page: p, silent: false });
  };

  function resetForm(date = form.workDate) {
    setEditingId(null);
    setForm({
      projectId: projects[0]?.id || "",
      workDate: date,
      durationHours: "0.25",
      description: "",
    });
  }

  function editEntry(entry) {
    if (entry.status !== "DRAFT") return;
    if (user?.id && entry.userId && entry.userId !== user.id) return;
    setEditingId(entry.id);
    setForm({
      projectId: entry.projectId,
      workDate: entry.workDate,
      durationHours: String(entry.durationHours),
      description: entry.description,
    });
    if (activeTab !== "record") {
      setActiveTab("record");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEntry(event) {
    event.preventDefault();
    const parsed = timeEntryFormSchema.safeParse(form);
    if (!parsed.success) {
      notify.error(parsed.error.issues[0]?.message || "Please correct the entry details.");
      return;
    }

    const payload = {
      projectId: parsed.data.projectId,
      workDate: parsed.data.workDate,
      durationMinutes: Math.round(parsed.data.durationHours * 60),
      description: parsed.data.description,
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
    try {
      setIsProcessing(entryId ? "Updating entry..." : "Adding entry...");
      setIsSavingEntry(true);
      if (entryId) await api.put(`/api/timesheets/${entryId}`, payload);
      else await api.post("/api/timesheets", payload);
      const msg = entryId ? "Entry updated." : "Entry saved as draft.";
      notify.success(msg);
      resetForm(form.workDate);
      sessionStorage.removeItem(
        `timesheet:${dateRange.startDate}:${dateRange.endDate}`,
      );
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message);
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
      setIsSavingEntry(false);
    }
  }

  async function removeEntry(id) {
    const entry = allKnownEntriesRef.current.get(id);
    if (entry && entry.status !== "DRAFT") return;
    if (user?.id && entry?.userId && entry.userId !== user.id) return;
    setConfirmation({
      title: "Delete draft entry",
      message: "Delete this draft time entry? This action cannot be undone.",
      confirmLabel: "Delete entry",
      tone: "danger",
      onConfirm: () => removeEntryConfirmed(id),
    });
  }

  async function removeEntryConfirmed(id) {
    try {
      setIsProcessing("Deleting entry...");
      await api.delete(`/api/timesheets/${id}`);
      notify.success("Draft entry deleted.");
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message);
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
    }
  }

  async function submitEntries(entryIds, label = "entries") {
    if (!entryIds.length) {
      notify.warn("No draft entries to submit.");
      return;
    }
    setConfirmation({
      title: "Submit entries for review",
      message: `Submit ${entryIds.length} ${label} for review? You will not be able to edit them until returned.`,
      confirmLabel: "Submit for review",
      onConfirm: () => submitEntriesConfirmed(entryIds),
    });
  }

  async function submitEntriesConfirmed(entryIds) {
    const parsed = entryIdsSchema.safeParse({ entryIds });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Select at least one entry.");
      return;
    }
    try {
      setIsProcessing(`Submitting ${parsed.data.entryIds.length} entries...`);
      await api.post("/api/timesheets/submit", parsed.data);
      notify.success(`${parsed.data.entryIds.length} entries submitted for review.`);
      setConfirmation(null);
      await load();
    } catch (err) {
      notify.error(err.message);
      setConfirmation(null);
    } finally {
      setIsProcessing(false);
    }
  }

  const dayMap = useMemo(() => Object.fromEntries(days.map((day) => [day.date, day])), [days]);

  // Selected day's entries for "Record Time" screen
  const selectedDayData = dayMap[form.workDate] || {
    date: form.workDate,
    totalMinutes: 0,
    entries: [],
  };
  const selectedDayEditable = selectedDayData.entries.filter(
    (e) => e.status === "DRAFT" || e.status === "RETURNED",
  );
  const selectedDayTotalHours = selectedDayData.totalMinutes / 60;

  // Whole week editable entries for "My Week" submit action
  const allWeekEditableEntries = useMemo(() => {
    return days.flatMap((d) =>
      d.entries.filter((e) => e.status === "DRAFT" || e.status === "RETURNED"),
    );
  }, [days]);

  const totalWeekMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);

  const toggleHistorySort = (field) => {
    let nextOrder = 'asc';
    if (historySortField === field) {
      nextOrder = historySortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      nextOrder = field === 'workDate' || field === 'durationHours' ? 'desc' : 'asc';
    }
    setHistorySortField(field);
    setHistorySortOrder(nextOrder);
    setHistoryPage(1);

    const local = filterKnownEntries({ sortBy: field, sortOrder: nextOrder });
    setHistoryEntries(local.slice(0, ITEMS_PER_PAGE));
    fetchHistory({
      sortBy: field,
      sortOrder: nextOrder,
      page: 1,
      silent: true,
    });
  };

  const paginatedHistory = historyEntries;

  // Day navigation helper for Record Time screen
  const stepDate = (amount) => {
    const current = new Date(form.workDate);
    current.setUTCDate(current.getUTCDate() + amount);
    const nextIso = iso(current);
    setForm((prev) => ({ ...prev, workDate: nextIso }));
  };

  return (
    <main className="max-w-auto mx-auto w-full px-4 py-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Timesheets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily work in 15-minute increments, review weekly progress, and track submission states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
            title="Refresh timesheet"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Screen Tabs: Record Time | My Week | My Entries ── */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("record")}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "record"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock size={16} />
          <span>Record Time</span>
        </button>

        <button
          onClick={() => setActiveTab("week")}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "week"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <CalendarDays size={16} />
          <span>My Week</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {totalWeekMinutes / 60}h
          </span>
        </button>

        <button
          onClick={() => setActiveTab("entries")}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "entries"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={16} />
          <span>My Entries</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {historyTotal}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: RECORD TIME (Day Focused Screen) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "record" && (
        <div className="space-y-6">
          {/* Day Navigation & Daily Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => stepDate(-1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, workDate: iso(new Date()) }))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => stepDate(1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
              <div className="ml-1 sm:ml-2 font-semibold text-slate-900 text-sm sm:text-base">
                {new Date(form.workDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Daily Running Gauge */}
            <div className="flex items-center justify-between sm:justify-start gap-4 w-full md:w-auto">
              <div className="text-left sm:text-right">
                <div className="text-xs text-slate-500 font-medium">Logged Today</div>
                <div className="text-lg font-bold text-slate-900">
                  <span className={selectedDayTotalHours > 24 ? "text-rose-600" : ""}>
                    {selectedDayTotalHours}h
                  </span>{" "}
                  <span className="text-xs font-normal text-slate-400">/ 24h limit</span>
                </div>
                <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden sm:ml-auto">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedDayTotalHours > 24 ? 'bg-rose-500' : selectedDayTotalHours >= 8 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min((selectedDayTotalHours / 8) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {selectedDayEditable.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(isProcessing)}
                  onClick={() => submitEntries(selectedDayEditable.map((e) => e.id), "day entries")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Submit Day</span>
                </button>
              )}
            </div>
          </div>

          {/* Time Entry Form */}
          <form
            onSubmit={saveEntry}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingId ? "Edit Work Entry" : "Record Work Entry"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start">
              {/* Project selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:border-slate-900 focus:outline-none transition cursor-pointer"
                >
                  <option value="">
                    {loading ? "Loading assigned projects..." : projects.length ? "Select project" : "No assigned projects"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.clientName || project.client?.name || "Client"} / {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                />
              </div>

              {/* Hours with quick pick buttons */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Hours (15m step) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  min="0.25"
                  max="16"
                  step="0.25"
                  type="number"
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {QUICK_HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, durationHours: h }))}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                        form.durationHours === h
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  minLength={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Meaningful description of work completed..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingEntry || loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
              >
                {isSavingEntry ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                <span>{editingId ? "Update Entry" : "Save Entry"}</span>
              </button>
            </div>
          </form>

          {/* Today's Logged Entries List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Entries for {form.workDate} ({selectedDayData.entries.length})
              </h3>
              <span className="text-xs font-semibold text-slate-700">
                Total: {selectedDayTotalHours}h
              </span>
            </div>

            {selectedDayData.timeOff && (
              <div className={`p-3 mx-4 mt-4 rounded-lg text-xs flex items-center gap-2 ${
                selectedDayData.timeOff.status === 'PENDING'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-sky-50 border border-sky-200 text-sky-800'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${
                  selectedDayData.timeOff.status === 'PENDING' ? 'text-amber-600' : 'text-sky-600'
                }`} />
                <span>
                  {selectedDayData.timeOff.status === 'PENDING' ? 'Pending Leave Request' : 'Approved Absence'} on this day:{' '}
                  <strong>{selectedDayData.timeOff.type?.name}</strong>
                  {selectedDayData.timeOff.status === 'PENDING' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                      Awaiting review
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {selectedDayData.entries.length ? (
                selectedDayData.entries.map((entry) => (
                  <div key={entry.id} className="p-4 sm:px-5 hover:bg-slate-50/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {entry.project?.name}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-bold text-slate-700">
                            {entry.durationHours}h
                          </span>
                          <Badge variant={statusVariant[entry.status]} label={entry.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600 break-words leading-relaxed">
                          {entry.description}
                        </p>

                        {/* Returned feedback callout */}
                        {entry.returnComment && (
                          <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                            <span className="font-semibold">Reviewer comment:</span> {entry.returnComment}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {(() => {
                        const isOwnEntry = Boolean(user?.id && entry.userId === user.id);
                        const canEdit = isOwnEntry && entry.status === "DRAFT";
                        const canDelete = isOwnEntry && entry.status === "DRAFT";

                        if (!canEdit && !canDelete) return null;

                        return (
                          <div className="flex items-center gap-2 shrink-0">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => editEntry(entry)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => removeEntry(entry.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No work entries recorded for this date. Use the form above to add an entry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: MY WEEK (7-Day Overview & Whole Week Submit) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "week" && (
        <div className="space-y-6">
          {/* Week Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(mondayOf(new Date()))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Next week"
              >
                <ChevronRight size={16} />
              </button>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-semibold text-slate-900">
                {iso(weekStart)} &rarr; {iso(weekEnd)}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-600">
                Week Total: <span className="text-slate-900 font-bold">{totalWeekMinutes / 60}h</span>
              </span>

              {allWeekEditableEntries.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(isProcessing)}
                  onClick={() =>
                    submitEntries(
                      allWeekEditableEntries.map((e) => e.id),
                      "whole week entries",
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Submit Whole Week ({allWeekEditableEntries.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* 7-Day Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 7 }, (_, index) => {
              const date = iso(addDays(weekStart, index));
              const day = dayMap[date] || { date, totalMinutes: 0, entries: [] };
              const editable = day.entries.filter(
                (entry) => entry.status === "DRAFT" || entry.status === "RETURNED",
              );
              return (
                <section
                  key={date}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs min-w-0 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {addDays(weekStart, index).toLocaleDateString(undefined, {
                            weekday: "short",
                          })}
                        </h3>
                        <p className="text-[11px] text-slate-400">{date}</p>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          day.totalMinutes >= 1440 ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        {day.totalMinutes / 60} / 24h
                      </span>
                    </div>

                    {day.timeOff && (
                      <div className={`mb-3 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium flex items-center justify-between ${
                        day.timeOff.status === 'PENDING'
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-sky-200 bg-sky-50 text-sky-800'
                      }`}>
                        <span>
                          {day.timeOff.status === 'PENDING' ? 'Pending Leave: ' : 'Absence: '}
                          {day.timeOff.type?.name}
                        </span>
                        {day.timeOff.status === 'PENDING' && (
                          <span className="text-[10px] text-amber-600 font-normal">Pending</span>
                        )}
                      </div>
                    )}

                    <div className="space-y-2.5 min-h-16 max-h-64 overflow-y-auto pr-1">
                      {day.entries.length ? (
                        day.entries.map((entry) => (
                          <div key={entry.id} className="border-t border-slate-100 pt-2 text-xs">
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-medium text-slate-900 truncate">
                                {entry.project?.name}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant={statusVariant[entry.status]} label={entry.status} />
                                {entry.status !== 'RETURNED' && (entry.wasReturned || entry.returnComment) && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="This entry was previously returned and re-submitted">
                                    Re-submitted
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {entry.durationHours}h · {entry.description}
                            </p>
                            {entry.returnComment && (
                              <p className="mt-1 text-[11px] text-rose-600 bg-rose-50 rounded p-1.5">
                                <span className="font-semibold">{entry.status === 'RETURNED' ? 'Returned reason:' : 'Previous return reason:'}</span> {entry.returnComment}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 py-3 text-center">No entries logged</p>
                      )}
                    </div>
                  </div>

                  {editable.length > 0 && (
                    <button
                      type="button"
                      disabled={Boolean(isProcessing)}
                      onClick={() => submitEntries(editable.map((e) => e.id), "day entries")}
                      className="mt-3 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium inline-flex justify-center items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Submit Day</span>
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: MY ENTRIES (Filterable History & Search) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "entries" && (
        <div className="space-y-4">
          {/* History Filters Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3 w-full md:flex-1">
              {/* Search */}
              <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search description or project..."
                  value={historySearch}
                  disabled={isFiltering}
                  onChange={(e) => handleFilterSearchChange(e.target.value)}
                  className={`w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none transition ${
                    isFiltering ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
                  }`}
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Project filter */}
              <select
                value={historyProject}
                disabled={isFiltering}
                onChange={(e) => handleFilterProjectChange(e.target.value)}
                className={`w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:border-slate-900 focus:outline-none transition ${
                  isFiltering ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer"
                }`}
              >
                <option value="">All Projects</option>
                {allDropdownProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status filter buttons */}
              <div className="flex overflow-x-auto no-scrollbar rounded-lg border border-slate-200 text-xs w-full sm:w-auto shrink-0 whitespace-nowrap">
                {["ALL", "DRAFT", "SUBMITTED", "APPROVED", "RETURNED"].map((st) => {
                  const isActive = historyStatus === st;
                  const isOtherDisabled = isFiltering && !isActive;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isOtherDisabled}
                      onClick={() => handleFilterStatusChange(st)}
                      className={`px-2.5 py-1 transition font-medium ${
                        isActive
                          ? "bg-slate-900 text-white cursor-default"
                          : isOtherDisabled
                          ? "bg-white text-slate-300 opacity-40 cursor-not-allowed border-slate-100"
                          : "bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Historical Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs relative">
            {isSilentFetching && (
              <div className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-xs px-4 py-1.5 flex items-center gap-2 font-medium">
                <Loader2 size={12} className="animate-spin text-slate-500" />
                <span>Updating entries...</span>
              </div>
            )}
            <table className="text-left border-collapse text-xs min-w-[620px] table-fixed" style={tableStyle}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] select-none">
                  <ResizableTh
                    width={columnWidths.workDate}
                    onResizeStart={(e) => startResize('workDate', e)}
                    onClick={() => toggleHistorySort('workDate')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Date</span>
                      {historySortField === 'workDate' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.project}
                    onResizeStart={(e) => startResize('project', e)}
                    onClick={() => toggleHistorySort('project')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Project</span>
                      {historySortField === 'project' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.durationHours}
                    onResizeStart={(e) => startResize('durationHours', e)}
                    onClick={() => toggleHistorySort('durationHours')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Hours</span>
                      {historySortField === 'durationHours' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.description}
                    onResizeStart={(e) => startResize('description', e)}
                    onClick={() => toggleHistorySort('description')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Description</span>
                      {historySortField === 'description' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.status}
                    onResizeStart={(e) => startResize('status', e)}
                    onClick={() => toggleHistorySort('status')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Status</span>
                      {historySortField === 'status' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.actions}
                    onResizeStart={(e) => startResize('actions', e)}
                    className="py-3 px-4 text-right"
                    resizable={false}
                  >
                    <span className="truncate">Actions</span>
                  </ResizableTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading && !isSilentFetching ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-xs text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                        <span>Loading entries...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedHistory.length ? (
                  paginatedHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 truncate whitespace-nowrap overflow-hidden">
                        {entry.workDate}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 truncate whitespace-nowrap overflow-hidden">
                        <span className="truncate" title={entry.project?.name}>{entry.project?.name}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 truncate whitespace-nowrap overflow-hidden">
                        {entry.durationHours}h
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate whitespace-nowrap overflow-hidden">
                        <div className="truncate" title={entry.description}>{entry.description}</div>
                        {entry.returnComment && (
                          <div className="mt-0.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 truncate" title={`Reason returned: ${entry.returnComment}`}>
                            <strong>Reason:</strong> {entry.returnComment}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={statusVariant[entry.status]} label={entry.status} />
                          {entry.status !== 'RETURNED' && (entry.wasReturned || entry.returnComment) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="This entry was previously returned and re-submitted">
                              Re-submitted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right truncate whitespace-nowrap overflow-hidden">
                        {(() => {
                          const isOwnEntry = Boolean(user?.id && entry.userId === user.id);
                          const canEdit = isOwnEntry && entry.status === "DRAFT";
                          const canDelete = isOwnEntry && entry.status === "DRAFT";

                          if (!canEdit && !canDelete) return null;

                          return (
                            <div className="inline-flex items-center gap-1.5">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => editEntry(entry)}
                                  className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => removeEntry(entry.id)}
                                  className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-xs text-slate-400">
                      No time entries match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={historyPage}
              totalItems={historyTotal}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handleHistoryPageChange}
            />
          </div>
        </div>
      )}

      {/* ── Global Confirm Dialog ── */}
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
