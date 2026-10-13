import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Clock, CalendarDays, FileText } from "lucide-react";
import api from "../../api/client.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import { timeEntryFormSchema } from "../../validation/timeEntrySchemas.js";
import { entryIdsSchema } from "../../validation/formSchemas.js";

import {
  mondayOf,
  addDays,
  iso,
  formatDuration,
  DURATION_PRESETS,
} from "./utils/timesheetUtils.jsx";
import RecordTimeTab from "./components/RecordTimeTab.jsx";
import WeekOverviewTab from "./components/WeekOverviewTab.jsx";
import EntriesHistoryTab from "./components/EntriesHistoryTab.jsx";

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
  const historyAbortRef = useRef(null);

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
      if (historyAbortRef.current) historyAbortRef.current.abort();
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
    const cacheKey = `timesheet:${user?.id || 'anon'}:${dateRange.startDate}:${dateRange.endDate}`;
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
    if (historyAbortRef.current) {
      historyAbortRef.current.abort();
    }
    const controller = new AbortController();
    historyAbortRef.current = controller;

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
        signal: controller.signal,
      });
      const entries = response.data?.entries || [];
      const total = response.data?.pagination?.total || 0;
      cacheEntries(entries);
      setHistoryEntries(entries);
      setHistoryTotal(total);
    } catch (err) {
      if (err.isCanceled || err.code === "ERR_CANCELED") return;
      if (err.status !== 401 && err.code !== "ACCOUNT_DEACTIVATED") {
        notify.error(err.message || "Failed to load entry history.");
      }
    } finally {
      if (historyAbortRef.current === controller) {
        setHistoryLoading(false);
        setIsSilentFetching(false);
        setIsFiltering(false);
      }
    }
  }

  // Sequentially load data for week and entries as well when timesheet page opens
  const weekStartIso = weekStart.toISOString();
  useEffect(() => {
    let isCancelled = false;

    async function loadInitialTimesheet() {
      await load();
    }

    loadInitialTimesheet();

    return () => {
      isCancelled = true;
    };
  }, [weekStartIso]);

  useEffect(() => {
    if (activeTab === "entries") {
      if (historyEntries.length === 0 && !historyLoading) {
        fetchHistory({ silent: false });
      }
    }
  }, [activeTab]);

  const handleFilterStatusChange = (st) => {
    if (historyStatus === st || isFiltering) return;
    setHistoryStatus(st);
    setHistoryPage(1);
    setIsFiltering(true);

    const local = filterKnownEntries({ status: st, project: historyProject, search: historySearch });
    setHistoryEntries(local.slice(0, ITEMS_PER_PAGE));
    setHistoryTotal(local.length);

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
        `timesheet:${user?.id || 'anon'}:${dateRange.startDate}:${dateRange.endDate}`,
      );
      setConfirmation(null);
      await load();
      fetchHistory({ silent: true }).catch(() => {});
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
      fetchHistory({ silent: true }).catch(() => {});
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
      fetchHistory({ silent: true }).catch(() => {});
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
    <main className="max-w-auto mx-auto w-full px-4 py-4">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === "record"
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
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === "week"
            ? "bg-indigo-600 text-white shadow-xs"
            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
            }`}
        >
          <CalendarDays size={15} />
          <span>My Week</span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeTab === "week" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
            }`}>
            {formatDuration(weekTotalHours)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("entries")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === "entries"
            ? "bg-indigo-600 text-white shadow-xs"
            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
            }`}
        >
          <FileText size={15} />
          <span>My Entries</span>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${activeTab === "entries" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
            }`}>
            {historyTotal}
          </span>
        </button>
      </div>

      {/* ── TAB 1: RECORD TIME (Day Focused Screen) ── */}
      {activeTab === "record" && (
        <RecordTimeTab
          form={form}
          setForm={setForm}
          stepDate={stepDate}
          formattedWorkDate={formattedWorkDate}
          selectedDayTotalHours={selectedDayTotalHours}
          todayPercentage={todayPercentage}
          weekTotalHours={weekTotalHours}
          weekPercentage={weekPercentage}
          editingId={editingId}
          resetForm={resetForm}
          saveEntry={saveEntry}
          projects={projects}
          loading={loading}
          customDuration={customDuration}
          setCustomDuration={setCustomDuration}
          isSavingEntry={isSavingEntry}
          selectedDayData={selectedDayData}
          selectedDayEditable={selectedDayEditable}
          isProcessing={isProcessing}
          submitEntries={submitEntries}
          user={user}
          editEntry={editEntry}
          removeEntry={removeEntry}
        />
      )}

      {/* ── TAB 2: MY WEEK (7-Day Overview & Whole Week Submit) ── */}
      {activeTab === "week" && (
        <WeekOverviewTab
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          weekEnd={weekEnd}
          totalWeekMinutes={totalWeekMinutes}
          allWeekEditableEntries={allWeekEditableEntries}
          isProcessing={isProcessing}
          submitEntries={submitEntries}
          dayMap={dayMap}
        />
      )}

      {/* ── TAB 3: MY ENTRIES (Filterable History & Search) ── */}
      {activeTab === "entries" && (
        <EntriesHistoryTab
          historySearch={historySearch}
          isFiltering={isFiltering}
          handleFilterSearchChange={handleFilterSearchChange}
          historyProject={historyProject}
          handleFilterProjectChange={handleFilterProjectChange}
          allDropdownProjects={allDropdownProjects}
          historyStatus={historyStatus}
          handleFilterStatusChange={handleFilterStatusChange}
          isSilentFetching={isSilentFetching}
          toggleHistorySort={toggleHistorySort}
          historySortField={historySortField}
          historySortOrder={historySortOrder}
          historyLoading={historyLoading}
          paginatedHistory={paginatedHistory}
          user={user}
          editEntry={editEntry}
          removeEntry={removeEntry}
          historyPage={historyPage}
          historyTotal={historyTotal}
          itemsPerPage={ITEMS_PER_PAGE}
          handleHistoryPageChange={handleHistoryPageChange}
        />
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
