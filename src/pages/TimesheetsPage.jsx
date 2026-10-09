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
  Monitor,
  Smartphone,
  Layers,
  Code2,
  Folder,
  Globe,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import Table, { TableHead, TableBody, TableRow, TableTd } from "../components/Table.jsx";
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

const DURATION_PRESETS = [
  { label: "15m", value: "0.25" },
  { label: "30m", value: "0.5" },
  { label: "45m", value: "0.75" },
  { label: "1h", value: "1.0" },
  { label: "1.5h", value: "1.5" },
  { label: "2h", value: "2.0" },
  { label: "4h", value: "4.0" },
];

function formatDuration(hours) {
  const num = Number(hours) || 0;
  const totalMins = Math.round(num * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getEntryIcon(entry, idx = 0) {
  const name = (entry.project?.name || "").toLowerCase();
  if (name.includes("mobile") || name.includes("app") || name.includes("ios") || name.includes("android")) {
    return {
      icon: <Smartphone size={18} />,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      badgeBg: "bg-indigo-50 text-indigo-700",
    };
  }
  if (name.includes("web") || name.includes("site") || name.includes("ui") || name.includes("design") || name.includes("front")) {
    return {
      icon: <Monitor size={18} />,
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      badgeBg: "bg-sky-50 text-sky-700",
    };
  }
  if (name.includes("internal") || name.includes("core") || name.includes("team") || name.includes("meet")) {
    return {
      icon: <Layers size={18} />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      badgeBg: "bg-emerald-50 text-emerald-700",
    };
  }
  const fallbackList = [
    { icon: <Smartphone size={18} />, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", badgeBg: "bg-indigo-50 text-indigo-700" },
    { icon: <Monitor size={18} />, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", badgeBg: "bg-sky-50 text-sky-700" },
    { icon: <Layers size={18} />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", badgeBg: "bg-emerald-50 text-emerald-700" },
    { icon: <Code2 size={18} />, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", badgeBg: "bg-violet-50 text-violet-700" },
    { icon: <Folder size={18} />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", badgeBg: "bg-amber-50 text-amber-700" },
  ];
  return fallbackList[idx % fallbackList.length];
}

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
  const [customDuration, setCustomDuration] = useState(false);
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
    if (!isAdmin) {
      // Employees should only see the projects they are assigned in the filters for All projects
      const map = new Map();
      (projects || []).forEach((p) => {
        if (p?.id) map.set(p.id, p);
      });
      return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    // Only admin can have all projects in that dropdown
    const map = new Map();
    (filterProjects || []).forEach((p) => {
      if (p?.id) map.set(p.id, p);
    });
    (projects || []).forEach((p) => {
      if (p?.id) map.set(p.id, p);
    });
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [isAdmin, filterProjects, projects]);

  useEffect(() => {
    if (!isAdmin && historyProject && projects.length > 0) {
      const isAssigned = projects.some((p) => p.id === historyProject);
      if (!isAssigned) {
        setHistoryProject("");
      }
    }
  }, [isAdmin, historyProject, projects]);



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
      if (isAdmin && filterProjects.length === 0) {
        api.get("/api/projects", {
          params: { activeOnly: true },
        }).then((res) => {
          const nextProjects = Array.isArray(res.data) ? res.data : res.data?.projects || [];
          if (nextProjects.length) setFilterProjects(nextProjects);
        }).catch(() => {});
      } else if (!isAdmin && projects.length === 0) {
        api.get("/api/projects", {
          params: { activeOnly: true, assignedToMe: true },
        }).then((res) => {
          const nextProjects = Array.isArray(res.data) ? res.data : res.data?.projects || [];
          if (nextProjects.length) setProjects(nextProjects);
        }).catch(() => {});
      }
    }
  }, [activeTab, isAdmin]);

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
    setCustomDuration(false);
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
    const isPreset = DURATION_PRESETS.some((p) => p.value === String(entry.durationHours));
    setCustomDuration(!isPreset);
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

  const formattedWorkDate = useMemo(() => {
    if (!form.workDate) return "";
    const [y, m, d] = form.workDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }, [form.workDate]);

  const todayPercentage = Math.min(Math.round((selectedDayTotalHours / 8) * 100), 100);
  const weekTotalHours = totalWeekMinutes / 60;
  const weekPercentage = Math.min(Math.round((weekTotalHours / 40) * 100), 100);

  return (
    <main className="max-w-auto mx-auto w-full px-4 py-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Timesheet</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your work hours, stay productive, and review your progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
            title="Refresh timesheet"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Screen Tabs: Pill Buttons ── */}
      <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab("record")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === "record"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <Clock size={15} />
          <span>Log Time</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("week")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === "week"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <CalendarDays size={15} />
          <span>My Week</span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
            activeTab === "week" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
          }`}>
            {formatDuration(weekTotalHours)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("entries")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === "entries"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <FileText size={15} />
          <span>My Entries</span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
            activeTab === "entries" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
          }`}>
            {historyTotal}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: RECORD TIME (Day Focused Screen) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "record" && (
        <div className="space-y-6">
          {/* Day Navigation & Dual Metric Cards Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Date Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => stepDate(-1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, workDate: iso(new Date()) }))}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => stepDate(1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {formattedWorkDate}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log your work for this date
                </p>
              </div>
            </div>

            {/* Right: Metric Cards (Today & This Week) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Today Card */}
              <div className="flex-1 sm:w-56 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {formatDuration(selectedDayTotalHours)} <span className="text-xs font-normal text-slate-400">/ 8h</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${todayPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 font-mono">{todayPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* This Week Card */}
              <div className="flex-1 sm:w-56 bg-sky-50/50 border border-sky-100 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Week</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {formatDuration(weekTotalHours)} <span className="text-xs font-normal text-slate-400">/ 40h</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-sky-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${weekPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 font-mono">{weekPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Entry Form Card */}
          <form
            onSubmit={saveEntry}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {editingId ? "Edit Time Entry" : "Add Time Entry"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingId ? "Modify your work details below." : "Fill in the details below to log your work hours."}
                  </p>
                </div>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-12 items-start">
              {/* Project selector */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition cursor-pointer"
                >
                  <option value="">
                    {loading ? "Loading assigned projects..." : projects.length ? "Select project..." : "No assigned projects"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.clientName || project.client?.name || "Client"} / {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>

              {/* Duration with quick presets */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Select time in 15-min increments
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setCustomDuration(false);
                        setForm((p) => ({ ...p, durationHours: preset.value }));
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        !customDuration && form.durationHours === preset.value
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomDuration(true)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      customDuration
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Clock size={12} />
                    <span>Custom</span>
                  </button>
                </div>

                {customDuration && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      required
                      min="0.25"
                      max="16"
                      step="0.25"
                      type="number"
                      value={form.durationHours}
                      onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                      placeholder="e.g. 3.5"
                      className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">hours ({formatDuration(form.durationHours)})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                minLength={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What did you work on?"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition resize-y"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                <span className="text-[11px] text-slate-400">
                  e.g. Fixed checkout validation and updated payment UI
                </span>
                <button
                  type="submit"
                  disabled={isSavingEntry || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 self-end sm:self-auto"
                >
                  {isSavingEntry ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  <span>{editingId ? "Update Time Entry" : "Log Time Entry"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Today's Logged Entries List Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Today&apos;s Entries</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {selectedDayData.entries.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your work entries for {formattedWorkDate}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
                  Total: <span className="font-bold">{formatDuration(selectedDayTotalHours)}</span>
                </div>
                {selectedDayEditable.length > 0 && (
                  <button
                    type="button"
                    disabled={Boolean(isProcessing)}
                    onClick={() => submitEntries(selectedDayEditable.map((e) => e.id), "day entries")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-2xs"
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Submit Day</span>
                  </button>
                )}
              </div>
            </div>

            {selectedDayData.timeOff && (
              <div className={`p-3 mx-4 mt-4 rounded-xl text-xs flex items-center gap-2 ${
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
                selectedDayData.entries.map((entry, idx) => {
                  const isOwnEntry = Boolean(user?.id && entry.userId === user.id);
                  const canEdit = isOwnEntry && entry.status === "DRAFT";
                  const canDelete = isOwnEntry && entry.status === "DRAFT";
                  const iconConfig = getEntryIcon(entry, idx);

                  return (
                    <div key={entry.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconConfig.bg} ${iconConfig.text} ${iconConfig.border}`}>
                          {iconConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {entry.project?.name || "Project"}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${iconConfig.badgeBg}`}>
                              {formatDuration(entry.durationHours)}
                            </span>
                            <Badge variant={statusVariant[entry.status]} label={entry.status} />
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
                            {entry.description}
                          </p>
                          {entry.returnComment && (
                            <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                              <span className="font-semibold">Reviewer comment:</span> {entry.returnComment}
                            </div>
                          )}
                        </div>
                      </div>

                      {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => editEntry(entry)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white transition cursor-pointer shadow-2xs"
                            >
                              <Pencil size={12} />
                              <span>Edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-100 border border-rose-200 bg-rose-50/70 transition cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-xs text-slate-400">
                  No work entries recorded for this date. Fill in the details above to log your work.
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
            <Table>
              <TableHead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] select-none">
                  <ResizableTh
                    onClick={() => toggleHistorySort('workDate')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {historySortField === 'workDate' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleHistorySort('project')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Project</span>
                      {historySortField === 'project' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleHistorySort('durationHours')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Hours</span>
                      {historySortField === 'durationHours' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleHistorySort('description')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Description</span>
                      {historySortField === 'description' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleHistorySort('status')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {historySortField === 'status' ? (
                        historySortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    className="py-3 px-4 text-right"
                    resizable={false}
                  >
                    <span>Actions</span>
                  </ResizableTh>
                </tr>
              </TableHead>
              <TableBody>
                {historyLoading && !isSilentFetching ? (
                  <TableRow hover={false}>
                    <TableTd colSpan={6} align="center" className="p-8 text-xs text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                        <span>Loading entries...</span>
                      </div>
                    </TableTd>
                  </TableRow>
                ) : paginatedHistory.length ? (
                  paginatedHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {entry.workDate}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <span>{entry.project?.name}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {entry.durationHours}h
                      </td>
                      <td className="py-3 px-4 text-slate-600 min-w-[200px] max-w-md">
                        <div className="line-clamp-2" title={entry.description}>{entry.description}</div>
                        {entry.returnComment && (
                          <div className="mt-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 leading-normal" title={`Reason returned: ${entry.returnComment}`}>
                            <strong>Reason:</strong> {entry.returnComment}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={statusVariant[entry.status]} label={entry.status} />
                          {entry.status !== 'RETURNED' && (entry.wasReturned || entry.returnComment) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="This entry was previously returned and re-submitted">
                              Re-submitted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow hover={false}>
                    <TableTd colSpan={6} align="center" className="p-8 text-xs text-slate-400">
                      No time entries match the selected filters.
                    </TableTd>
                  </TableRow>
                )}
              </TableBody>
            </Table>

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
