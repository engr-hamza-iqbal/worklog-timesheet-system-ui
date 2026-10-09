import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  Check,
  RefreshCw,
  RotateCcw,
  Send,
  X,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Clock,
  CheckCircle2,
  Layers,
  ChevronDown,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import Table, { TableHead, TableBody, TableRow, TableTd } from "../components/Table.jsx";
import ResizableTh from "../components/ResizableTh.jsx";
import { timeOffDecisionSchema, timeOffRequestSchema } from "../validation/formSchemas.js";

const statusVariant = {
  PENDING: "pending",
  APPROVED: "active",
  DECLINED: "revoked",
  CANCELLED: "inactive",
  EXPIRED: "expired",
};

export default function TimeOffPage() {
  const { user, isAdmin, capabilities } = useAuth();
  const { notify } = useNotification();
  const canDecide = isAdmin || !!capabilities.DECIDE_TIME_OFF;
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [form, setForm] = useState({
    timeOffTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [declineRequest, setDeclineRequest] = useState(null);
  const [declineComment, setDeclineComment] = useState("");

  async function load(filterValues = filters) {
    try {
      setLoading(true);
      const query = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => value),
      );
      const [typesResponse, requestsResponse] = await Promise.all([
        api.get("/api/time-off/types"),
        api.get("/api/time-off/requests", { params: query }),
      ]);
      const nextTypes = Array.isArray(typesResponse.data)
        ? typesResponse.data
        : [];
      setTypes(nextTypes);
      setRequests(
        Array.isArray(requestsResponse.data) ? requestsResponse.data : [],
      );
      setForm((current) => ({
        ...current,
        timeOffTypeId: current.timeOffTypeId || nextTypes[0]?.id || "",
      }));
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const [requestSortField, setRequestSortField] = useState('startDate');
  const [requestSortOrder, setRequestSortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleRequestSort = (field) => {
    if (requestSortField === field) {
      setRequestSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setRequestSortField(field);
      setRequestSortOrder(field === 'startDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.startDate, filters.endDate]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (filters.status && req.status !== filters.status) return false;
      if (filters.startDate && req.startDate < filters.startDate) return false;
      if (filters.endDate && req.endDate > filters.endDate) return false;
      return true;
    });
  }, [requests, filters.status, filters.startDate, filters.endDate]);

  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let cmp = 0;
      if (requestSortField === 'employee') {
        cmp = (a.user?.name || user?.name || '').localeCompare(b.user?.name || user?.name || '');
      } else if (requestSortField === 'startDate') {
        cmp = (a.startDate || '').localeCompare(b.startDate || '');
      } else if (requestSortField === 'type') {
        cmp = (a.timeOffType?.name || '').localeCompare(b.timeOffType?.name || '');
      } else if (requestSortField === 'reason') {
        cmp = (a.reason || '').localeCompare(b.reason || '');
      } else if (requestSortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return requestSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredRequests, requestSortField, requestSortOrder, user]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRequests, page]);

  // Statistics calculation for KPI cards
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const declined = requests.filter((r) => r.status === 'DECLINED').length;
    return { total, pending, approved, declined };
  }, [requests]);

  async function createRequest(event) {
    event.preventDefault();
    const parsed = timeOffRequestSchema.safeParse(form);
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Correct the time-off request details.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/time-off/requests", parsed.data);
      const msg = "Time-off request submitted.";
      notify.success(msg);
      setForm((current) => ({
        ...current,
        startDate: "",
        endDate: "",
        reason: "",
      }));
      setShowForm(false);
      setPage(1);
      await load();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelRequest(id) {
    setConfirmation({
      title: "Cancel time off request",
      message: "Are you sure you want to cancel this pending time-off request?",
      confirmLabel: "Cancel request",
      tone: "danger",
      onConfirm: async () => {
        try {
          setIsCancelling("Cancelling request...");
          await api.post(`/api/time-off/requests/${id}/cancel`);
          const msg = "Time-off request cancelled.";
          notify.success(msg);
          setConfirmation(null);
          await load();
        } catch (err) {
          notify.error(err.message);
          setConfirmation(null);
        } finally {
          setIsCancelling(false);
        }
      },
    });
  }

  async function decideRequest(id, decision) {
    if (decision === "DECLINED") {
      setDeclineRequest(id);
      setDeclineComment("");
      return;
    }
    confirmDecision(id, decision, "");
  }

  function confirmDecision(id, decision, comment) {
    const parsed = timeOffDecisionSchema.safeParse({ decision, comment });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || "Correct the decision details.");
      return;
    }
    setConfirmation({
      title: decision === "APPROVED" ? "Approve time off" : "Decline time off",
      message:
        decision === "APPROVED"
          ? "Approve this time-off request?"
          : "Decline this time-off request with the provided comment?",
      confirmLabel: decision === "APPROVED" ? "Approve" : "Decline",
      tone: decision === "APPROVED" ? "primary" : "danger",
      onConfirm: async () => {
        try {
          setIsDeciding(decision === "APPROVED" ? "Approving request..." : "Declining request...");
          await api.post(`/api/time-off/requests/${id}/decide`, {
            decision: parsed.data.decision,
            comment: parsed.data.comment || "",
          });
          const msg = `Time-off request ${decision.toLowerCase()}.`;
          notify.success(msg);
          setConfirmation(null);
          await load();
        } catch (err) {
          notify.error(err.message);
          setConfirmation(null);
        } finally {
          setIsDeciding(false);
        }
      },
    });
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-4 sm:px-6">
      {/* ── Page Header / Description & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Request time away and see decisions that affect your work week.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-slate-900" : "text-slate-500"} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <Plus size={14} className={showForm ? "rotate-45 transition-transform" : "transition-transform"} />
            <span>{showForm ? "Close Form" : "Request Leave"}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilters({ ...filters, status: "" })}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
            filters.status === "" ? "border-indigo-300 ring-2 ring-indigo-50" : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Total Requests</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
              <div className="text-[11px] text-slate-400">All submitted records</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilters({ ...filters, status: "PENDING" })}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
            filters.status === "PENDING" ? "border-amber-300 ring-2 ring-amber-50" : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Pending Review</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.pending}</div>
              <div className="text-[11px] text-slate-400">Awaiting approval</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setFilters({ ...filters, status: "APPROVED" })}
          className={`bg-white rounded-2xl border p-4 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition ${
            filters.status === "APPROVED" ? "border-emerald-300 ring-2 ring-emerald-50" : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Approved Leave</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.approved}</div>
              <div className="text-[11px] text-slate-400">Authorized requests</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">Leave Policies</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{types.length}</div>
              <div className="text-[11px] text-slate-400">Configured absence types</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Leave Request Form (Collapsible Card) ── */}
      {showForm && (
        <form
          onSubmit={createRequest}
          className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <CalendarDays size={15} />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Submit Leave Request
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 items-end">
            <label className="text-xs font-semibold text-slate-700 sm:col-span-1 md:col-span-1 lg:col-span-3">
              Leave Type
              <select
                required
                value={form.timeOffTypeId}
                onChange={(e) =>
                  setForm({ ...form, timeOffTypeId: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              >
                <option value="">Select leave type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700 sm:col-span-1 md:col-span-1 lg:col-span-2">
              Start Date
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700 sm:col-span-1 md:col-span-1 lg:col-span-2">
              End Date
              <input
                required
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700 sm:col-span-1 md:col-span-2 lg:col-span-3">
              Reason
              <input
                required
                minLength={5}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Annual family leave"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none transition shadow-2xs"
              />
            </label>

            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
              <button
                type="submit"
                disabled={saving || !types.length}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{saving ? "Submitting..." : "Submit Request"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Requests Table with Integrated Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Table Toolbar & Filters */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Time-Off Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {filteredRequests.length} record{filteredRequests.length === 1 ? '' : 's'} matching filter criteria
              </p>
            </div>
          </div>

          {/* Filters Form */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none transition shadow-2xs"
            >
              <option value="">All statuses</option>
              {["PENDING", "APPROVED", "DECLINED", "CANCELLED", "EXPIRED"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <input
              type="date"
              placeholder="From"
              max={filters.endDate || undefined}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none transition shadow-2xs"
            />

            <input
              type="date"
              placeholder="To"
              min={filters.startDate || undefined}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:outline-none transition shadow-2xs"
            />

            {(filters.status || filters.startDate || filters.endDate) && (
              <button
                type="button"
                onClick={() => {
                  const cleared = { status: "", startDate: "", endDate: "" };
                  setFilters(cleared);
                  load(cleared);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Clear filters"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Requests Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-xs text-slate-500 py-12">
              <RefreshCw className="animate-spin text-slate-400" size={18} />
              <span>Loading time-off requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No time-off requests match these filters.
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <ResizableTh
                    onClick={() => toggleRequestSort('employee')}
                    className="px-5 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Employee</span>
                      {requestSortField === 'employee' ? (
                        requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleRequestSort('startDate')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dates</span>
                      {requestSortField === 'startDate' ? (
                        requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleRequestSort('type')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {requestSortField === 'type' ? (
                        requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleRequestSort('reason')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Reason</span>
                      {requestSortField === 'reason' ? (
                        requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleRequestSort('status')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {requestSortField === 'status' ? (
                        requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Action</span>
                  </ResizableTh>
                </tr>
              </TableHead>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="align-middle"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-900">
                      <span title={request.user?.name || user?.name}>
                        {request.user?.name || user?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700">
                      <span className="font-medium text-slate-800">{request.startDate}</span>
                      <span className="text-slate-400 mx-1">to</span>
                      <span className="font-medium text-slate-800">{request.endDate}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800">
                        {request.timeOffType?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 min-w-[160px] max-w-xs">
                      <div className="line-clamp-2" title={request.reason}>{request.reason}</div>
                      {request.decisionComment && (
                        <p className="mt-0.5 text-[11px] text-red-600 line-clamp-1" title={request.decisionComment}>
                          Note: {request.decisionComment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={statusVariant[request.status]}
                        label={request.status}
                      />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {request.status === "PENDING" &&
                          request.userId === user?.id && (
                            <button
                              title="Cancel request"
                              onClick={() =>
                                setConfirmation({
                                  title: "Cancel time-off request",
                                  message:
                                    "Cancel this pending time-off request?",
                                  confirmLabel: "Cancel request",
                                  tone: "danger",
                                  onConfirm: () => cancelRequest(request.id),
                                })
                              }
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          )}
                        {canDecide &&
                          request.status === "PENDING" &&
                          request.userId !== user?.id && (
                            <>
                              <button
                                title="Approve request"
                                onClick={() =>
                                  decideRequest(request.id, "APPROVED")
                                }
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                title="Decline request"
                                onClick={() =>
                                  decideRequest(request.id, "DECLINED")
                                }
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              >
                                <RotateCcw size={15} />
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredRequests.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => (isDeciding || isCancelling ? null : setConfirmation(null))}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
        loading={isDeciding || isCancelling}
      />

      <Modal
        isOpen={Boolean(declineRequest)}
        onClose={() => (isDeciding ? null : setDeclineRequest(null))}
        title="Decline time-off request"
        size="sm"
      >
        <p className="text-xs sm:text-sm text-slate-600">
          Explain why this request is being declined. A comment of at least five characters is required.
        </p>
        <textarea
          autoFocus
          value={declineComment}
          onChange={(event) => setDeclineComment(event.target.value)}
          className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm focus:border-slate-900 focus:outline-none shadow-2xs"
          placeholder="Reason for declining..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={Boolean(isDeciding)}
            onClick={() => setDeclineRequest(null)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={declineComment.trim().length < 5 || Boolean(isDeciding)}
            onClick={() => {
              const id = declineRequest;
              const comment = declineComment.trim();
              setDeclineRequest(null);
              confirmDecision(id, "DECLINED", comment);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            {isDeciding && <Loader2 size={13} className="animate-spin" />}
            Decline request
          </button>
        </div>
      </Modal>
    </main>
  );
}
