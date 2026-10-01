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
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

const statusVariant = {
  PENDING: "pending",
  APPROVED: "active",
  DECLINED: "revoked",
  CANCELLED: "inactive",
};

export default function TimeOffPage() {
  const { user, isAdmin, capabilities } = useAuth();
  const { notify } = useNotification();
  const canDecide = isAdmin || !!capabilities.DECIDE_TIME_OFF;
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
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

  function applyFilters(event) {
    event.preventDefault();
    if (
      filters.startDate &&
      filters.endDate &&
      filters.endDate < filters.startDate
    ) {
      notify.warn("End date cannot be earlier than start date.");
      return;
    }
    setPage(1);
    load(filters);
  }

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

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
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
  }, [requests, requestSortField, requestSortOrder, user]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRequests, page]);

  async function createRequest(event) {
    event.preventDefault();
    if (form.endDate < form.startDate) {
      notify.warn("End date cannot be earlier than start date.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/time-off/requests", form);
      const msg = "Time-off request submitted.";
      notify.success(msg);
      setForm((current) => ({
        ...current,
        startDate: "",
        endDate: "",
        reason: "",
      }));
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
            decision,
            comment,
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
    <main className="mx-auto w-full max-w-auto px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Absence tracking
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Time off</h1>
          <p className="mt-1 text-sm text-slate-500">
            Request time away and see decisions that affect your work week.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <form
        onSubmit={createRequest}
        className="mb-6 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs"
      >
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Submit Leave Request
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 items-end">
          <label className="text-xs font-medium text-slate-600 sm:col-span-1 md:col-span-1 lg:col-span-3">
            Leave Type
            <select
              required
              value={form.timeOffTypeId}
              onChange={(e) =>
                setForm({ ...form, timeOffTypeId: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">Select type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-1 md:col-span-1 lg:col-span-2">
            Start date
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-1 md:col-span-1 lg:col-span-2">
            End date
            <input
              required
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-1 md:col-span-2 lg:col-span-3">
            Reason
            <input
              required
              minLength="5"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Annual family leave"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </label>
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
            <button
              type="submit"
              disabled={saving || !types.length}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>{saving ? "Submitting..." : "Submit"}</span>
            </button>
          </div>
        </div>
      </form>
      <form
        onSubmit={applyFilters}
        className="mb-6 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-end gap-3">
          <label className="text-xs font-medium text-slate-600 w-full sm:w-44">
            Filter Status
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">All statuses</option>
              {["PENDING", "APPROVED", "DECLINED", "CANCELLED"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 w-full sm:w-36">
            From
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 w-full sm:w-36">
            To
            <input
              type="date"
              min={filters.startDate || undefined}
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs">
              <CalendarDays size={13} />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const cleared = { status: "", startDate: "", endDate: "" };
                setFilters(cleared);
                load(cleared);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </form>
      <section className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={20} />
            Loading time-off requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No time-off requests match these filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm min-w-[580px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => toggleRequestSort('employee')}
                  className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    {requestSortField === 'employee' ? (
                      requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleRequestSort('startDate')}
                  className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dates</span>
                    {requestSortField === 'startDate' ? (
                      requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleRequestSort('type')}
                  className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {requestSortField === 'type' ? (
                      requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleRequestSort('reason')}
                  className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Reason</span>
                    {requestSortField === 'reason' ? (
                      requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => toggleRequestSort('status')}
                  className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {requestSortField === 'status' ? (
                      requestSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600" /> : <ArrowDown size={12} className="text-indigo-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-slate-100 align-top"
                >
                  <td className="p-4">{request.user?.name || user?.name}</td>
                  <td className="p-4 whitespace-nowrap">
                    {request.startDate} to {request.endDate}
                  </td>
                  <td className="p-4">{request.timeOffType?.name}</td>
                  <td className="p-4 max-w-md">
                    {request.reason}
                    {request.decisionComment && (
                      <p className="mt-1 text-xs text-red-600">
                        {request.decisionComment}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={statusVariant[request.status]}
                      label={request.status}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
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
                            className="text-red-700"
                          >
                            <X size={16} />
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
                              className="text-emerald-700"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              title="Decline request"
                              onClick={() =>
                                decideRequest(request.id, "DECLINED")
                              }
                              className="text-red-700"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={page}
          totalItems={requests.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />
      </section>
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
        <p className="text-sm text-slate-600">Explain why this request is being declined. A comment of at least five characters is required.</p>
        <textarea
          autoFocus
          value={declineComment}
          onChange={(event) => setDeclineComment(event.target.value)}
          className="mt-4 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="Reason for declining..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={Boolean(isDeciding)}
            onClick={() => setDeclineRequest(null)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isDeciding && <Loader2 size={14} className="animate-spin" />}
            Decline request
          </button>
        </div>
      </Modal>
    </main>
  );
}
