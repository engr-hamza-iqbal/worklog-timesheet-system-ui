import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import api from "../api/client.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const statusVariant = {
  PENDING: "pending",
  APPROVED: "active",
  DECLINED: "revoked",
  CANCELLED: "inactive",
};

export default function TimeOffPage() {
  const { user, isAdmin, capabilities } = useAuth();
  const canDecide = isAdmin || !!capabilities.DECIDE_TIME_OFF;
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
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
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [declineRequest, setDeclineRequest] = useState(null);
  const [declineComment, setDeclineComment] = useState("");

  async function load(filterValues = filters) {
    try {
      setError("");
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
      setError(err.message);
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
      setError("End date cannot be earlier than start date.");
      return;
    }
    load(filters);
  }

  async function createRequest(event) {
    event.preventDefault();
    if (form.endDate < form.startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/time-off/requests", form);
      setNotice("Time-off request submitted.");
      setForm((current) => ({
        ...current,
        startDate: "",
        endDate: "",
        reason: "",
      }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelRequest(id) {
    setConfirmation(null);
    try {
      await api.post(`/api/time-off/requests/${id}/cancel`);
      setNotice("Time-off request cancelled.");
      await load();
    } catch (err) {
      setError(err.message);
    }
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
        setConfirmation(null);
        try {
          await api.post(`/api/time-off/requests/${id}/decide`, {
            decision,
            comment,
          });
          setNotice(`Time-off request ${decision.toLowerCase()}.`);
          await load();
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
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
        onSubmit={createRequest}
        className="mb-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_2fr_auto] lg:items-end"
      >
        <label className="text-xs font-medium text-slate-600">
          Type
          <select
            required
            value={form.timeOffTypeId}
            onChange={(e) =>
              setForm({ ...form, timeOffTypeId: e.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Start date
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          End date
          <input
            required
            type="date"
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Reason
          <input
            required
            minLength="5"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Annual family leave"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button
          disabled={saving || !types.length}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <Send size={15} />
          {saving ? "Submitting" : "Request leave"}
        </button>
      </form>
      <form
        onSubmit={applyFilters}
        className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto_auto] lg:items-end"
      >
        <label className="text-xs font-medium text-slate-600">
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {["PENDING", "APPROVED", "DECLINED", "CANCELLED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          From
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          To
          <input
            type="date"
            min={filters.startDate || undefined}
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="mt-1 rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <button className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
          <CalendarDays size={15} />
          Filter
        </button>
        <button
          type="button"
          onClick={() => {
            const cleared = { status: "", startDate: "", endDate: "" };
            setFilters(cleared);
            load(cleared);
          }}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-slate-600"
        >
          <X size={15} />
          Clear
        </button>
      </form>
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Type</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
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
      </section>
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
      />
      <Modal
        isOpen={Boolean(declineRequest)}
        onClose={() => setDeclineRequest(null)}
        title="Decline time-off request"
        size="sm"
      >
        <p className="text-sm text-slate-600">Explain why this request is being declined. A comment of at least five characters is required.</p>
        <textarea
          autoFocus
          value={declineComment}
          onChange={(event) => setDeclineComment(event.target.value)}
          className="mt-4 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm"
          placeholder="Reason for declining..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setDeclineRequest(null)} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={declineComment.trim().length < 5} onClick={() => { const id = declineRequest; const comment = declineComment.trim(); setDeclineRequest(null); confirmDecision(id, "DECLINED", comment); }} className="rounded-md bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50">Decline request</button>
        </div>
      </Modal>
    </main>
  );
}
