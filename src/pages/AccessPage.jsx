import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, XCircle, Plus, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Clock, CheckCircle, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, Users, Search, Check,
  FolderOpen, User, Trash2, ShieldAlert, Pencil, Calendar,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';

// ─── Capability metadata ───────────────────────────────────────────────────────

const CAP_META = {
  VIEW_OTHER_RECORDS:      { label: 'View Other Records',         desc: "Read work logs and timesheets of other staff members." },
  REVIEW_TIME:             { label: 'Review Time',                desc: "Approve or return submitted time entries (within scope)." },
  DECIDE_TIME_OFF:         { label: 'Decide Time Off',            desc: "Approve or decline employee time-off requests (within scope)." },
  MANAGE_CLIENTS_PROJECTS: { label: 'Manage Clients & Projects',  desc: "Create and configure clients, projects, and billing rates." },
  ASSIGN_PROJECTS:         { label: 'Assign Projects',            desc: "Assign and remove employees on client projects." },
  MANAGE_USERS:            { label: 'Manage Users',               desc: "Create and manage user accounts." },
  VIEW_REPORTS:            { label: 'View Reports',               desc: "Access cross-project summary reports and CSV exports." },
  VIEW_ANALYTICS:          { label: 'View Analytics',             desc: "View utilization rates and billable hours distribution." },
  VIEW_BILLING:            { label: 'View Billing',               desc: "Access sensitive billing rate figures and monetary totals." },
};

const ALL_CAP_CODES = Object.keys(CAP_META);

function broadcastAuthSync() {
  try {
    const channel = new BroadcastChannel('worklog_auth_sync');
    channel.postMessage({ type: 'REFRESH_CAPABILITIES' });
    channel.close();
  } catch {
    // BroadcastChannel unsupported
  }
  // Also signal local window context so current tab syncs immediately
  try {
    window.dispatchEvent(new Event('auth:permission-denied'));
  } catch {
    // ignore
  }
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">✕</button>}
    </div>
  );
}

// ─── Grant Capability Form ────────────────────────────────────────────────────

// ─── Grant Capabilities Form (Multiple Capabilities to User) ──────────────────

function GrantForm({ targetUser, grantedCodes, users, projects, onSuccess, onCancel }) {
  const availableCodes = ALL_CAP_CODES.filter((c) => !grantedCodes.has(c));

  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [capSearch, setCapSearch] = useState('');
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredAvailableCodes = useMemo(() => {
    const q = capSearch.toLowerCase().trim();
    if (!q) return availableCodes;
    return availableCodes.filter((code) => {
      const meta = CAP_META[code] || {};
      return (
        code.toLowerCase().includes(q) ||
        (meta.label && meta.label.toLowerCase().includes(q)) ||
        (meta.desc && meta.desc.toLowerCase().includes(q))
      );
    });
  }, [availableCodes, capSearch]);

  const toggleCode = (code) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedCodes(new Set(filteredAvailableCodes));
  };

  const clearSelection = () => {
    setSelectedCodes(new Set());
  };

  const toggleTargetId = (field, id) => {
    if (field === 'targetUserIds') {
      setTargetUserIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setTargetProjectIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCodes.size === 0) {
      setError('Please select at least one capability to grant.');
      return;
    }
    if (scopeType === 'USER' && targetUserIds.length === 0) {
      setError('Select at least one target user for a user-scoped grant.');
      return;
    }
    if (scopeType === 'PROJECT' && targetProjectIds.length === 0) {
      setError('Select at least one project for a project-scoped grant.');
      return;
    }
    setLoading(true);
    setError('');
    const codes = Array.from(selectedCodes);
    try {
      // POST /api/access/grants with capabilityCodes
      await api.post('/api/access/grants', {
        userId: targetUser.id,
        capabilityCodes: codes,
        expiresAt: expiresAt || undefined,
        scopeType: scopeType === 'GLOBAL' ? undefined : scopeType,
        targetUserIds: scopeType === 'USER' ? targetUserIds : undefined,
        targetProjectIds: scopeType === 'PROJECT' ? targetProjectIds : undefined,
      });
      broadcastAuthSync();
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to grant capabilities.');
    } finally {
      setLoading(false);
    }
  };

  if (availableCodes.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        All system capabilities are already granted to this user.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Granting capabilities to <span className="font-semibold text-slate-900">{targetUser.name}</span>
        </p>
        <span className="text-[11px] font-medium text-slate-500">
          {availableCodes.length} available
        </span>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Capability Multi-select */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Select Capabilities
          </label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Select all
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={capSearch}
            onChange={(e) => setCapSearch(e.target.value)}
            placeholder="Search capabilities by name or description..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          />
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
          {filteredAvailableCodes.map((code) => {
            const isSelected = selectedCodes.has(code);
            const meta = CAP_META[code] || {};
            return (
              <div
                key={code}
                onClick={() => toggleCode(code)}
                className={`p-2.5 rounded-lg border text-xs transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-medium'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{meta.label || code}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{code}</span>
                    </div>
                    {meta.desc && (
                      <p className="mt-0.5 text-[11px] text-slate-500 font-normal leading-normal">{meta.desc}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredAvailableCodes.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">No matching capabilities.</p>
          )}
        </div>
      </div>

      {/* Scope */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scope</label>
        <div className="flex gap-2">
          {['GLOBAL', 'USER', 'PROJECT'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScopeType(s);
                setTargetUserIds([]);
                setTargetProjectIds([]);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                scopeType === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s === 'GLOBAL' ? 'Global' : s === 'USER' ? 'User' : 'Project'}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {scopeType === 'GLOBAL'
            ? 'Applies across all authorized users and projects in the system.'
            : scopeType === 'USER'
            ? 'Restricted strictly to the selected user targets below.'
            : 'Restricted strictly to the selected project targets below.'}
        </p>
      </div>

      {/* User scope picker */}
      {scopeType === 'USER' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target users</label>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {users.filter((u) => u.id !== targetUser.id && u.isActive && u.accountType !== 'ADMIN').map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetUserIds.includes(u.id)}
                  onChange={() => toggleTargetId('targetUserIds', u.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">{u.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto truncate">{u.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Project scope picker */}
      {scopeType === 'PROJECT' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target projects</label>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {projects.filter((p) => p.status === 'ACTIVE').map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetProjectIds.includes(p.id)}
                  onChange={() => toggleTargetId('targetProjectIds', p.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">{p.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto truncate">{p.clientName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Expiry */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Expiry date <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{selectedCodes.size}</span> capabilit
          {selectedCodes.size === 1 ? 'y' : 'ies'} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedCodes.size === 0}
            className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            {loading ? 'Granting...' : `Grant ${selectedCodes.size > 0 ? selectedCodes.size : ''} Capabilit${selectedCodes.size === 1 ? 'y' : 'ies'}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Edit Capability Grant Form ──────────────────────────────────────────────

function EditGrantForm({ grant, targetUser, users, projects, onSuccess, onCancel }) {
  const initialScopeType = grant.scopes && grant.scopes.length > 0 ? grant.scopes[0].scopeType : 'GLOBAL';
  const initialProjectIds = grant.scopes ? grant.scopes.filter((s) => s.scopeType === 'PROJECT').map((s) => s.targetProjectId) : [];
  const initialUserIds = grant.scopes ? grant.scopes.filter((s) => s.scopeType === 'USER').map((s) => s.targetUserId) : [];
  const initialExpiresAt = grant.expiresAt ? new Date(grant.expiresAt).toISOString().split('T')[0] : '';

  const [scopeType, setScopeType] = useState(initialScopeType);
  const [targetProjectIds, setTargetProjectIds] = useState(initialProjectIds);
  const [targetUserIds, setTargetUserIds] = useState(initialUserIds);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [isPermanent, setIsPermanent] = useState(!grant.expiresAt);
  const [projectSearch, setProjectSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capMeta = CAP_META[grant.capability?.code] || { label: grant.capability?.code, desc: '' };

  const addDaysToExpiry = (days) => {
    const base = expiresAt ? new Date(expiresAt) : new Date();
    base.setDate(base.getDate() + days);
    setExpiresAt(base.toISOString().split('T')[0]);
    setIsPermanent(false);
  };

  const toggleTargetId = (field, id) => {
    if (field === 'targetUserIds') {
      setTargetUserIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setTargetProjectIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    const active = projects.filter((p) => p.status === 'ACTIVE');
    if (!q) return active;
    return active.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    const active = users.filter((u) => u.isActive && u.id !== targetUser.id);
    if (!q) return active;
    return active.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, userSearch, targetUser.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (scopeType === 'USER' && targetUserIds.length === 0) {
      setError('Select at least one user for a user-scoped capability.');
      return;
    }
    if (scopeType === 'PROJECT' && targetProjectIds.length === 0) {
      setError('Select at least one project for a project-scoped capability.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        expiresAt: isPermanent ? null : (expiresAt ? new Date(expiresAt + 'T23:59:59.999Z').toISOString() : null),
        scopeType,
        targetProjectIds: scopeType === 'PROJECT' ? targetProjectIds : [],
        targetUserIds: scopeType === 'USER' ? targetUserIds : [],
      };
      await api.patch(`/api/access/grants/${grant.id}`, payload);
      broadcastAuthSync();
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update capability grant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Capability summary card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
          <Shield size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900">{capMeta.label}</div>
          <div className="text-[10px] font-mono text-slate-400">{grant.capability?.code}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{capMeta.desc}</p>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Expiry Date Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-600" />
            Capability Expiration & Extension
          </label>
          {grant.expiresAt ? (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
              Current: {fmtDate(grant.expiresAt)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Current: Never (Permanent)
            </span>
          )}
        </div>

        {/* Quick Extend Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1">Quick extend:</span>
          <button
            type="button"
            onClick={() => addDaysToExpiry(7)}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer"
          >
            +7 Days
          </button>
          <button
            type="button"
            onClick={() => addDaysToExpiry(30)}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer"
          >
            +30 Days
          </button>
          <button
            type="button"
            onClick={() => addDaysToExpiry(90)}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer"
          >
            +90 Days
          </button>
          <button
            type="button"
            onClick={() => addDaysToExpiry(365)}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer"
          >
            +1 Year
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPermanent(true);
              setExpiresAt('');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer border ${
              isPermanent
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
          >
            Permanent
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => {
                setIsPermanent(e.target.checked);
                if (e.target.checked) setExpiresAt('');
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Permanent grant (no expiration)</span>
          </label>
        </div>

        {!isPermanent && (
          <div className="pt-1">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => {
                setExpiresAt(e.target.value);
                setIsPermanent(false);
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
            />
          </div>
        )}
      </div>

      {/* Scope Configuration Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <FolderOpen size={13} className="text-blue-600" />
          Access Scope
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { value: 'GLOBAL', label: 'Global Access', desc: 'All projects & team members' },
            { value: 'PROJECT', label: 'Restricted by Project', desc: 'Select specific projects' },
            { value: 'USER', label: 'Restricted by User', desc: 'Select specific users' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition select-none ${
                scopeType === opt.value
                  ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="editScopeType"
                  value={opt.value}
                  checked={scopeType === opt.value}
                  onChange={() => setScopeType(opt.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 pl-5">{opt.desc}</span>
            </label>
          ))}
        </div>

        {/* Project Picker */}
        {scopeType === 'PROJECT' && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                Selected Projects ({targetProjectIds.length})
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetProjectIds(projects.filter((p) => p.status === 'ACTIVE').map((p) => p.id))}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Select all active
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setTargetProjectIds([])}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-1 bg-slate-50/50">
              {filteredProjects.map((p) => {
                const isChecked = targetProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition cursor-pointer select-none ${
                      isChecked ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium' : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetId('targetProjectIds', p.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <FolderOpen size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {p.clientName && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {p.clientName}
                      </span>
                    )}
                  </label>
                );
              })}
              {filteredProjects.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">No matching projects.</p>
              )}
            </div>
          </div>
        )}

        {/* User Picker */}
        {scopeType === 'USER' && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                Selected Users ({targetUserIds.length})
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetUserIds(users.filter((u) => u.isActive && u.id !== targetUser.id).map((u) => u.id))}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setTargetUserIds([])}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-1 bg-slate-50/50">
              {filteredUsers.map((u) => {
                const isChecked = targetUserIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition cursor-pointer select-none ${
                      isChecked ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium' : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTargetId('targetUserIds', u.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {u.email}
                    </span>
                  </label>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">No matching users.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── Bulk Edit Capabilities Form ─────────────────────────────────────────────

function BulkEditGrantsForm({ selectedGrants, targetUser, users, projects, onSuccess, onCancel }) {
  const [updateExpiry, setUpdateExpiry] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);

  const [updateScope, setUpdateScope] = useState(false);
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDaysToExpiry = (days) => {
    const base = expiresAt ? new Date(expiresAt) : new Date();
    base.setDate(base.getDate() + days);
    setExpiresAt(base.toISOString().split('T')[0]);
    setIsPermanent(false);
  };

  const toggleTargetId = (field, id) => {
    if (field === 'targetUserIds') {
      setTargetUserIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setTargetProjectIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    const active = projects.filter((p) => p.status === 'ACTIVE');
    if (!q) return active;
    return active.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    const active = users.filter((u) => u.isActive && u.id !== targetUser.id);
    if (!q) return active;
    return active.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, userSearch, targetUser.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updateExpiry && !updateScope) {
      setError('Please choose to update expiration date, scope, or both.');
      return;
    }
    if (updateExpiry && !isPermanent && !expiresAt) {
      setError('Please select an expiry date or check permanent.');
      return;
    }
    if (updateScope && scopeType === 'USER' && targetUserIds.length === 0) {
      setError('Select at least one user for user-scoped capability.');
      return;
    }
    if (updateScope && scopeType === 'PROJECT' && targetProjectIds.length === 0) {
      setError('Select at least one project for project-scoped capability.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        grantIds: selectedGrants.map((g) => g.id),
      };
      if (updateExpiry) {
        payload.expiresAt = isPermanent ? null : (expiresAt ? new Date(expiresAt + 'T23:59:59.999Z').toISOString() : null);
      }
      if (updateScope) {
        payload.scopeType = scopeType;
        payload.targetProjectIds = scopeType === 'PROJECT' ? targetProjectIds : [];
        payload.targetUserIds = scopeType === 'USER' ? targetUserIds : [];
      }
      await api.post('/api/access/grants/bulk-update', payload);
      broadcastAuthSync();
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update capabilities.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-600">
          Updating <span className="font-bold text-slate-900">{selectedGrants.length}</span> selected capabilities for{' '}
          <span className="font-semibold text-slate-900">{targetUser.name}</span>:
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedGrants.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
            >
              <Shield size={10} className="text-indigo-500" />
              {CAP_META[g.capability?.code]?.label || g.capability?.code}
            </span>
          ))}
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Expiry Update Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={updateExpiry}
            onChange={(e) => setUpdateExpiry(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-600" />
            Update Expiration / Extend All Selected
          </span>
        </label>

        {updateExpiry && (
          <div className="space-y-2 pl-6 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Quick extend:</span>
              <button
                type="button"
                onClick={() => addDaysToExpiry(7)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => addDaysToExpiry(30)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => addDaysToExpiry(90)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
              >
                +90 Days
              </button>
              <button
                type="button"
                onClick={() => addDaysToExpiry(365)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPermanent(true);
                  setExpiresAt('');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer border ${
                  isPermanent
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                Set Permanent
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(e) => {
                    setIsPermanent(e.target.checked);
                    if (e.target.checked) setExpiresAt('');
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Set to Permanent (no expiry)</span>
              </label>
            </div>

            {!isPermanent && (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => {
                  setExpiresAt(e.target.value);
                  setIsPermanent(false);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            )}
          </div>
        )}
      </div>

      {/* Scope Update Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={updateScope}
            onChange={(e) => setUpdateScope(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <FolderOpen size={13} className="text-blue-600" />
            Update Scope Across All Selected
          </span>
        </label>

        {updateScope && (
          <div className="space-y-3 pl-6 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { value: 'GLOBAL', label: 'Global Access', desc: 'All projects & users' },
                { value: 'PROJECT', label: 'By Project', desc: 'Specific projects' },
                { value: 'USER', label: 'By User', desc: 'Specific users' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-2.5 rounded-lg border text-left cursor-pointer transition select-none ${
                    scopeType === opt.value
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bulkScopeType"
                      value={opt.value}
                      checked={scopeType === opt.value}
                      onChange={() => setScopeType(opt.value)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-slate-900">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 pl-5">{opt.desc}</span>
                </label>
              ))}
            </div>

            {scopeType === 'PROJECT' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Selected Projects ({targetProjectIds.length})
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setTargetProjectIds(projects.filter((p) => p.status === 'ACTIVE').map((p) => p.id))}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Select all active
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setTargetProjectIds([])}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-1 bg-slate-50/50">
                  {filteredProjects.map((p) => {
                    const isChecked = targetProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition cursor-pointer select-none ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium' : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTargetId('targetProjectIds', p.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <FolderOpen size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {p.clientName && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {p.clientName}
                          </span>
                        )}
                      </label>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No matching projects.</p>
                  )}
                </div>
              </div>
            )}

            {scopeType === 'USER' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Selected Users ({targetUserIds.length})
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setTargetUserIds(users.filter((u) => u.isActive && u.id !== targetUser.id).map((u) => u.id))}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setTargetUserIds([])}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-1 bg-slate-50/50">
                  {filteredUsers.map((u) => {
                    const isChecked = targetUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition cursor-pointer select-none ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium' : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTargetId('targetUserIds', u.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {u.email}
                        </span>
                      </label>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No matching users.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Updating...' : `Update ${selectedGrants.length} Capabilities`}
        </button>
      </div>
    </form>
  );
}

// ─── Bulk Grant Team Form (Assign 1 Capability to Selected / All Users) ────────

function BulkGrantTeamForm({ users, projects, currentUserId, onSuccess, onCancel }) {
  const [selectedCapability, setSelectedCapability] = useState(ALL_CAP_CODES[0]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [targetScopeUserIds, setTargetScopeUserIds] = useState([]);
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Targetable active employees (excluding self and admins who already hold all capabilities)
  const eligibleUsers = useMemo(() => {
    return users.filter((u) => u.isActive && u.id !== currentUserId && u.accountType !== 'ADMIN');
  }, [users, currentUserId]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return eligibleUsers;
    return eligibleUsers.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [eligibleUsers, userSearch]);

  const toggleUser = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const toggleTargetId = (field, id) => {
    if (field === 'targetScopeUserIds') {
      setTargetScopeUserIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setTargetProjectIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCapability) {
      setError('Please select a capability to grant.');
      return;
    }
    if (selectedUserIds.size === 0) {
      setError('Please select at least one user.');
      return;
    }
    if (scopeType === 'USER' && targetScopeUserIds.length === 0) {
      setError('Select at least one target user for a user-scoped grant.');
      return;
    }
    if (scopeType === 'PROJECT' && targetProjectIds.length === 0) {
      setError('Select at least one project for a project-scoped grant.');
      return;
    }
    setLoading(true);
    setError('');
    const uIds = Array.from(selectedUserIds);
    try {
      // POST /api/access/grants with userIds
      await api.post('/api/access/grants', {
        userIds: uIds,
        capabilityCode: selectedCapability,
        expiresAt: expiresAt || undefined,
        scopeType: scopeType === 'GLOBAL' ? undefined : scopeType,
        targetUserIds: scopeType === 'USER' ? targetScopeUserIds : undefined,
        targetProjectIds: scopeType === 'PROJECT' ? targetProjectIds : undefined,
      });
      broadcastAuthSync();
      onSuccess(selectedCapability, uIds);
    } catch (err) {
      setError(err.message || 'Failed to grant capability.');
    } finally {
      setLoading(false);
    }
  };

  const capMeta = CAP_META[selectedCapability] || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Capability Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Select Capability to Grant
        </label>
        <select
          value={selectedCapability}
          onChange={(e) => setSelectedCapability(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
        >
          {ALL_CAP_CODES.map((code) => (
            <option key={code} value={code}>
              {CAP_META[code]?.label || code} ({code})
            </option>
          ))}
        </select>
        {capMeta.desc && (
          <p className="mt-1 text-[11px] text-slate-500">{capMeta.desc}</p>
        )}
      </div>

      {/* Scope Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scope</label>
        <div className="flex gap-2">
          {['GLOBAL', 'USER', 'PROJECT'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setScopeType(s);
                setTargetScopeUserIds([]);
                setTargetProjectIds([]);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                scopeType === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s === 'GLOBAL' ? 'Global' : s === 'USER' ? 'User' : 'Project'}
            </button>
          ))}
        </div>
      </div>

      {/* User scope picker */}
      {scopeType === 'USER' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target users</label>
          <div className="max-h-32 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {users.filter((u) => u.isActive).map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetScopeUserIds.includes(u.id)}
                  onChange={() => toggleTargetId('targetScopeUserIds', u.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">{u.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto truncate">{u.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Project scope picker */}
      {scopeType === 'PROJECT' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target projects</label>
          <div className="max-h-32 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {projects.filter((p) => p.status === 'ACTIVE').map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetProjectIds.includes(p.id)}
                  onChange={() => toggleTargetId('targetProjectIds', p.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">{p.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto truncate">{p.clientName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Expiry */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Expiry date <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
        />
      </div>

      {/* Target Users Multi-select */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Select Users ({eligibleUsers.length} active employees)
          </label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Select all ({filteredUsers.length})
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          />
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-200 rounded p-1.5 bg-slate-50/50">
          {filteredUsers.map((user) => {
            const isSelected = selectedUserIds.has(user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium'
                    : 'bg-white border border-slate-200/70 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                  />
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>

                <Badge
                  variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                  label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                />
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">No employees match search.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">{selectedUserIds.size}</span> user
          {selectedUserIds.size === 1 ? '' : 's'} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedUserIds.size === 0}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            {loading ? 'Granting...' : `Grant to ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} User${selectedUserIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Bulk Revoke Capability from Team Form ────────────────────────────────────

function BulkRevokeTeamForm({ users, onSuccess, onCancel }) {
  const [selectedCapability, setSelectedCapability] = useState('VIEW_OTHER_RECORDS');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active non-admin employees who currently hold this capability
  const eligibleUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.isActive &&
        u.accountType !== 'ADMIN' &&
        Array.isArray(u.activeCapabilityCodes) &&
        u.activeCapabilityCodes.includes(selectedCapability)
    );
  }, [users, selectedCapability]);

  // When capability changes, clear selection
  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [selectedCapability]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return eligibleUsers;
    return eligibleUsers.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [eligibleUsers, userSearch]);

  const toggleUser = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.size === 0) {
      setError('Please select at least one employee.');
      return;
    }

    setLoading(true);
    setError('');

    const uIds = Array.from(selectedUserIds);
    try {
      await api.post('/api/access/grants/revoke', {
        capabilityCode: selectedCapability,
        userIds: uIds,
      });
      broadcastAuthSync();
      onSuccess(selectedCapability, uIds);
    } catch (err) {
      setError(err.message || 'Failed to revoke capability.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Capability Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Select Capability to Revoke
        </label>
        <select
          value={selectedCapability}
          onChange={(e) => setSelectedCapability(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
        >
          {ALL_CAP_CODES.map((code) => {
            const count = users.filter(
              (u) =>
                u.isActive &&
                u.accountType !== 'ADMIN' &&
                Array.isArray(u.activeCapabilityCodes) &&
                u.activeCapabilityCodes.includes(code)
            ).length;
            return (
              <option key={code} value={code}>
                {CAP_META[code]?.label || code} ({count} employee{count === 1 ? '' : 's'})
              </option>
            );
          })}
        </select>
        {CAP_META[selectedCapability]?.desc && (
          <p className="mt-1 text-[11px] text-slate-500">{CAP_META[selectedCapability].desc}</p>
        )}
      </div>

      {/* Target Users Multi-select */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Select Employees with this Capability ({eligibleUsers.length} total)
          </label>
          {eligibleUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-medium text-red-600 hover:text-red-800 transition cursor-pointer"
              >
                Select all ({filteredUsers.length})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {eligibleUsers.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-700">No employees currently hold this capability.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Nobody has an active grant for this capability.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search employees by name or email..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-200 rounded p-1.5 bg-slate-50/50">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.has(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded text-xs transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-red-50/90 border border-red-200 text-red-950 font-medium'
                        : 'bg-white border border-slate-200/70 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 pointer-events-none"
                      />
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No employees match search.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">{selectedUserIds.size}</span> employee
          {selectedUserIds.size === 1 ? '' : 's'} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedUserIds.size === 0}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            {loading ? 'Revoking...' : `Revoke from ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} User${selectedUserIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── User Access Panel ────────────────────────────────────────────────────────

function UserAccessPanel({ targetUser, users, projects, currentUserId }) {
  // GET /api/access/users/:userId/grants → { success, data: [grants], message }
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState(null);
  const [grantModal, setGrantModal] = useState(false);
  const [revokeConfirmation, setRevokeConfirmation] = useState(null);
  const [selectedGrantIds, setSelectedGrantIds] = useState(new Set());
  const [bulkRevokeConfirm, setBulkRevokeConfirm] = useState(false);
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const [expandedScopeGrantIds, setExpandedScopeGrantIds] = useState(new Set());
  const [editingGrant, setEditingGrant] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(false);
  const { notify } = useNotification();

  const toggleScopeExpanded = (grantId) => {
    setExpandedScopeGrantIds((prev) => {
      const next = new Set(prev);
      if (next.has(grantId)) next.delete(grantId);
      else next.add(grantId);
      return next;
    });
  };

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/access/users/${targetUser.id}/grants`);
      const list = Array.isArray(res.data) ? res.data : [];
      setGrants(list);
    } catch (err) {
      setError(err.message || 'Failed to load grants.');
    } finally {
      setLoading(false);
    }
  }, [targetUser.id]);

  useEffect(() => {
    fetchGrants();
    setSelectedGrantIds(new Set());
    setExpandedScopeGrantIds(new Set());
  }, [fetchGrants]);

  // Active grants (not revoked, not expired)
  const now = new Date();
  const activeGrants = grants.filter(
    (g) => !g.revokedAt && (!g.expiresAt || new Date(g.expiresAt) > now)
  );

  // Map capability code → active grant object
  const activeByCode = {};
  for (const g of activeGrants) {
    if (g.capability?.code) {
      activeByCode[g.capability.code] = g;
    }
  }

  // Track grants that have expired (not revoked, but expiresAt <= now)
  const expiredByCode = {};
  for (const g of grants) {
    if (!g.revokedAt && g.expiresAt && new Date(g.expiresAt) <= now) {
      const code = g.capability?.code;
      if (code && !activeByCode[code]) {
        if (!expiredByCode[code] || new Date(g.expiresAt) > new Date(expiredByCode[code].expiresAt)) {
          expiredByCode[code] = g;
        }
      }
    }
  }

  const grantedCodes = new Set(Object.keys(activeByCode));
  const isSelf = targetUser.id === currentUserId;

  // Single grant revoke
  const handleRevoke = (grantId) => {
    setRevokeConfirmation(grantId);
  };

  const confirmRevoke = async () => {
    const grantId = revokeConfirmation;
    setRevoking(grantId);
    setError('');
    try {
      await api.post(`/api/access/grants/${grantId}/revoke`);
      broadcastAuthSync();
      setGrants((prev) =>
        prev.map((g) => (g.id === grantId ? { ...g, revokedAt: new Date().toISOString() } : g))
      );
      setSelectedGrantIds((prev) => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
      setRevokeConfirmation(null);
      notify.success('Capability grant revoked.');
    } catch (err) {
      setError(err.message || 'Failed to revoke grant.');
      setRevokeConfirmation(null);
    } finally {
      setRevoking(null);
    }
  };

  // Multiple grant revoke on this user
  const confirmBulkRevoke = async () => {
    const gIds = Array.from(selectedGrantIds);
    setBulkRevoking(true);
    setError('');
    try {
      await api.post('/api/access/grants/revoke', { grantIds: gIds });
      broadcastAuthSync();
      const nowIso = new Date().toISOString();
      setGrants((prev) =>
        prev.map((g) => (gIds.includes(g.id) ? { ...g, revokedAt: nowIso } : g))
      );
      setSelectedGrantIds(new Set());
      setBulkRevokeConfirm(false);
      notify.success(`Revoked ${gIds.length} capability grant(s).`);
    } catch (err) {
      setError(err.message || 'Failed to revoke selected capabilities.');
      setBulkRevokeConfirm(false);
    } finally {
      setBulkRevoking(false);
    }
  };

  const renderScope = (grant) => {
    if (!grant) return <span className="text-slate-300">—</span>;
    const scopes = grant.scopes || [];
    if (scopes.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Global Access
        </span>
      );
    }

    const type = scopes[0].scopeType;
    const isExpanded = expandedScopeGrantIds.has(grant.id);

    if (type === 'PROJECT') {
      const projectSummary = scopes
        .map((s) => s.targetProject?.name || s.targetProjectId)
        .join(', ');

      return (
        <div className="py-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleScopeExpanded(grant.id);
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer group ${
              isExpanded
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
            title={isExpanded ? 'Collapse project list' : `Click to view project names (${projectSummary})`}
          >
            <FolderOpen size={11} className="text-blue-600" />
            <span>{scopes.length} {scopes.length === 1 ? 'Project' : 'Projects'}</span>
            <ChevronDown
              size={11}
              className={`text-blue-500 group-hover:text-blue-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="mt-1.5 flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded max-w-sm animate-fadeIn">
              {scopes.map((s) => {
                const pName = s.targetProject?.name || s.targetProjectId;
                const cName = s.targetProject?.client?.name;
                return (
                  <span
                    key={s.id || s.targetProjectId}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    title={cName ? `${pName} (${cName})` : pName}
                  >
                    <FolderOpen size={9} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{pName}</span>
                    {cName && <span className="text-[9px] text-slate-400 truncate max-w-[80px]">({cName})</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const userSummary = scopes
      .map((s) => s.targetUser?.name || s.targetUserId)
      .join(', ');

    return (
      <div className="py-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleScopeExpanded(grant.id);
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer group ${
            isExpanded
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}
          title={isExpanded ? 'Collapse user list' : `Click to view user names (${userSummary})`}
        >
          <Users size={11} className="text-emerald-600" />
          <span>{scopes.length} {scopes.length === 1 ? 'User' : 'Users'}</span>
          <ChevronDown
            size={11}
            className={`text-emerald-500 group-hover:text-emerald-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="mt-1.5 flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded max-w-sm animate-fadeIn">
            {scopes.map((s) => {
              const uName = s.targetUser?.name || s.targetUserId;
              return (
                <span
                  key={s.id || s.targetUserId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  title={s.targetUser?.email ? `${uName} (${s.targetUser.email})` : uName}
                >
                  <User size={9} className="text-slate-400 shrink-0" />
                  <span className="truncate max-w-[150px]">{uName}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getScopeSortKey = (grant) => {
    if (!grant) return '';
    const scopes = grant.scopes || [];
    if (scopes.length === 0) return 'Global';
    const type = scopes[0].scopeType;
    return `${type} ${scopes.length}`;
  };

  const [capSortField, setCapSortField] = useState('name');
  const [capSortOrder, setCapSortOrder] = useState('asc'); // 'asc' | 'desc'

  const toggleCapSort = (field) => {
    if (capSortField === field) {
      setCapSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCapSortField(field);
      setCapSortOrder('asc');
    }
  };

  const sortedCapCodes = useMemo(() => {
    return [...ALL_CAP_CODES].sort((codeA, codeB) => {
      let cmp = 0;
      const grantA = activeByCode[codeA] || expiredByCode[codeA];
      const grantB = activeByCode[codeB] || expiredByCode[codeB];
      if (capSortField === 'name') {
        cmp = (CAP_META[codeA]?.label || '').localeCompare(CAP_META[codeB]?.label || '');
      } else if (capSortField === 'scope') {
        const scopeA = getScopeSortKey(grantA);
        const scopeB = getScopeSortKey(grantB);
        cmp = scopeA.localeCompare(scopeB);
      } else if (capSortField === 'grantedBy') {
        const gA = grantA?.grantedBy?.name || '';
        const gB = grantB?.grantedBy?.name || '';
        cmp = gA.localeCompare(gB);
      } else if (capSortField === 'status') {
        const isA = activeByCode[codeA] ? 2 : (expiredByCode[codeA] ? 1 : 0);
        const isB = activeByCode[codeB] ? 2 : (expiredByCode[codeB] ? 1 : 0);
        cmp = isA - isB;
      }
      return capSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [activeByCode, expiredByCode, capSortField, capSortOrder]);

  return (
    <div>
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Multiple capabilities revoke action bar */}
      {selectedGrantIds.size > 0 && !isSelf && (
        <div className="bg-red-50/90 border border-red-200 px-4 py-2.5 rounded-lg flex items-center justify-between gap-3 mt-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-red-900 font-medium">
            <ShieldAlert size={15} className="text-red-600 shrink-0" />
            <span>
              <strong>{selectedGrantIds.size}</strong> capability grant{selectedGrantIds.size === 1 ? '' : 's'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedGrantIds(new Set())}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Extend / Edit ({selectedGrantIds.size})
            </button>
            <button
              type="button"
              onClick={() => setBulkRevokeConfirm(true)}
              disabled={bulkRevoking}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition cursor-pointer disabled:opacity-50"
            >
              {bulkRevoking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 size={12} />}
              Revoke Selected ({selectedGrantIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-2">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capabilities</span>
          {!isSelf && grantedCodes.size < ALL_CAP_CODES.length && (
            <button
              onClick={() => setGrantModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />Grant
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[520px]">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  {!isSelf && (
                    <th className="py-2.5 px-3 w-8">
                      {(Object.keys(activeByCode).length > 0 || Object.keys(expiredByCode).length > 0) && (
                        <input
                          type="checkbox"
                          checked={selectedGrantIds.size > 0 && selectedGrantIds.size === (Object.keys(activeByCode).length + Object.keys(expiredByCode).length)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = [
                                ...Object.values(activeByCode).map((g) => g.id),
                                ...Object.values(expiredByCode).map((g) => g.id),
                              ];
                              setSelectedGrantIds(new Set(allIds));
                            } else {
                              setSelectedGrantIds(new Set());
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select all active and expired grants"
                        />
                      )}
                    </th>
                  )}
                  <th
                    onClick={() => toggleCapSort('name')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capability</span>
                      {capSortField === 'name' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleCapSort('scope')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Scope</span>
                      {capSortField === 'scope' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleCapSort('grantedBy')}
                    className="py-2.5 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Granted by</span>
                      {capSortField === 'grantedBy' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Expires</th>
                  <th
                    onClick={() => toggleCapSort('status')}
                    className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Status</span>
                      {capSortField === 'status' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCapCodes.map((code) => {
                  const activeGrant = activeByCode[code];
                  const expiredGrant = expiredByCode[code];
                  const grant = activeGrant || expiredGrant;
                  const isGranted = !!activeGrant;
                  const isExpired = !activeGrant && !!expiredGrant;

                  return (
                    <tr key={code} className="hover:bg-slate-50/50 transition">
                      {!isSelf && (
                        <td className="py-3 px-3 w-8">
                          {grant ? (
                            <input
                              type="checkbox"
                              checked={selectedGrantIds.has(grant.id)}
                              onChange={() => {
                                setSelectedGrantIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(grant.id)) next.delete(grant.id);
                                  else next.add(grant.id);
                                  return next;
                                });
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          ) : null}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{CAP_META[code].label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{code}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {renderScope(grant)}
                      </td>

                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                        {grant && grant.grantedBy
                          ? <span className="truncate max-w-[100px] block">{grant.grantedBy.name}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-medium" title={grant.expiresAt}>
                            <Clock className="w-3 h-3 text-amber-600" />Expired ({fmtDate(grant.expiresAt)})
                          </span>
                        ) : isGranted && grant.expiresAt ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px]">
                            <Clock className="w-3 h-3" />{fmtDate(grant.expiresAt)}
                          </span>
                        ) : isGranted ? (
                          <span className="text-slate-400 text-[11px]">Never</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isGranted ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="granted" label="Granted" dot />
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingGrant(grant)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                  title="Edit capability scope or extend expiry date"
                                >
                                  <Pencil className="w-3 h-3 text-slate-500" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleRevoke(grant.id)}
                                  disabled={!!revoking}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded transition cursor-pointer disabled:opacity-50"
                                >
                                  {revoking === grant.id
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <XCircle className="w-3 h-3" />}
                                  Revoke
                                </button>
                              </>
                            )}
                          </div>
                        ) : isExpired ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="expired" label="Expired" dot />
                            {!isSelf && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingGrant(grant)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition cursor-pointer"
                                  title="Renew or extend expired capability"
                                >
                                  <RefreshCw className="w-3 h-3 text-amber-700" />
                                  Extend
                                </button>
                                <button
                                  onClick={() => handleRevoke(grant.id)}
                                  disabled={!!revoking}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50"
                                  title="Revoke / remove expired grant"
                                >
                                  {revoking === grant.id
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <XCircle className="w-3 h-3" />}
                                  Clear
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            Not granted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grant modal */}
      <Modal
        isOpen={grantModal}
        onClose={() => setGrantModal(false)}
        title={`Grant Capability — ${targetUser.name}`}
        size="lg"
      >
        <GrantForm
          targetUser={targetUser}
          grantedCodes={grantedCodes}
          users={users}
          projects={projects}
          onSuccess={() => { setGrantModal(false); fetchGrants(); }}
          onCancel={() => setGrantModal(false)}
        />
      </Modal>

      {/* Single revoke confirmation */}
      <ConfirmDialog
        isOpen={Boolean(revokeConfirmation)}
        onClose={() => (revoking ? null : setRevokeConfirmation(null))}
        onConfirm={confirmRevoke}
        title="Revoke capability"
        message="Revoke this capability immediately? The user will lose this access right away."
        confirmLabel="Revoke"
        tone="danger"
        loading={Boolean(revoking)}
      />

      {/* Bulk revoke confirmation */}
      <ConfirmDialog
        isOpen={bulkRevokeConfirm}
        onClose={() => (bulkRevoking ? null : setBulkRevokeConfirm(false))}
        onConfirm={confirmBulkRevoke}
        title={`Revoke ${selectedGrantIds.size} Capabilities`}
        message={`Are you sure you want to revoke the ${selectedGrantIds.size} selected capabilities from ${targetUser.name}? They will lose these permissions immediately.`}
        confirmLabel={`Revoke ${selectedGrantIds.size} Capabilities`}
        tone="danger"
        loading={bulkRevoking}
      />

      {/* Edit capability modal */}
      <Modal
        isOpen={Boolean(editingGrant)}
        onClose={() => setEditingGrant(null)}
        title={editingGrant ? `Edit Capability — ${CAP_META[editingGrant.capability?.code]?.label || editingGrant.capability?.code}` : 'Edit Capability'}
        size="lg"
      >
        {editingGrant && (
          <EditGrantForm
            grant={editingGrant}
            targetUser={targetUser}
            users={users}
            projects={projects}
            onSuccess={() => {
              setEditingGrant(null);
              fetchGrants();
              notify.success('Capability grant updated successfully.');
            }}
            onCancel={() => setEditingGrant(null)}
          />
        )}
      </Modal>

      {/* Bulk edit capabilities modal */}
      <Modal
        isOpen={bulkEditModal}
        onClose={() => setBulkEditModal(false)}
        title={`Edit ${selectedGrantIds.size} Capabilities — ${targetUser.name}`}
        size="lg"
      >
        <BulkEditGrantsForm
          selectedGrants={activeGrants.filter((g) => selectedGrantIds.has(g.id))}
          targetUser={targetUser}
          users={users}
          projects={projects}
          onSuccess={() => {
            setBulkEditModal(false);
            setSelectedGrantIds(new Set());
            fetchGrants();
            notify.success('Selected capabilities updated successfully.');
          }}
          onCancel={() => setBulkEditModal(false)}
        />
      </Modal>
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const fetchLogs = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const offset = (pageNumber - 1) * LIMIT;
      const res = await api.get(`/api/access/audit-logs?limit=${LIMIT}&offset=${offset}`);
      const data = res.data;
      if (data && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setTotal(data.total || data.logs.length);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      }
    } catch {
      // Keep previous logs on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const [logSortField, setLogSortField] = useState('createdAt');
  const [logSortOrder, setLogSortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleLogSort = (field) => {
    if (logSortField === field) {
      setLogSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setLogSortField(field);
      setLogSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let cmp = 0;
      if (logSortField === 'action') {
        cmp = (a.action || '').localeCompare(b.action || '');
      } else if (logSortField === 'capability') {
        cmp = (a.capabilityCode || '').localeCompare(b.capabilityCode || '');
      } else if (logSortField === 'actor') {
        cmp = (a.actor?.name || '').localeCompare(b.actor?.name || '');
      } else if (logSortField === 'target') {
        cmp = (a.targetUser?.name || '').localeCompare(b.targetUser?.name || '');
      } else if (logSortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return logSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [logs, logSortField, logSortOrder]);

  const ACTION_COLORS = {
    GRANT:         'text-emerald-700 bg-emerald-50',
    REVOKE:        'text-red-700 bg-red-50',
    CHANGE_SCOPE:  'text-blue-700 bg-blue-50',
    CHANGE_EXPIRY: 'text-amber-700 bg-amber-50',
  };

  return (
    <div className="mt-8 bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Audit Log</span>
        <span className="text-[11px] text-slate-400">{total} events</span>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<Shield className="w-7 h-7" />} title="No audit events yet." />
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[440px]">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => toggleLogSort('action')}
                    className="py-2 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action</span>
                      {logSortField === 'action' ? (
                        logSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleLogSort('capability')}
                    className="py-2 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capability</span>
                      {logSortField === 'capability' ? (
                        logSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleLogSort('actor')}
                    className="py-2 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Actor</span>
                      {logSortField === 'actor' ? (
                        logSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleLogSort('target')}
                    className="py-2 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Target</span>
                      {logSortField === 'target' ? (
                        logSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleLogSort('createdAt')}
                    className="py-2 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>When</span>
                      {logSortField === 'createdAt' ? (
                        logSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[log.action] || 'text-slate-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                      {log.capabilityCode}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 hidden sm:table-cell">
                      {log.actor?.name || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 hidden sm:table-cell">
                      {log.targetUser?.name || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={LIMIT}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccessPage() {
  const { user: currentUser } = useAuth();
  const { notify } = useNotification();

  // GET /api/users → { success, data: [...users], message }
  // GET /api/projects → { success, data: [...projects], message }  projects have clientName
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [bulkGrantModal, setBulkGrantModal] = useState(false);
  const [bulkRevokeModal, setBulkRevokeModal] = useState(false);

  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 10;

  const fetchAccessData = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/projects'),
      ]);
      const userList = Array.isArray(usersRes.data) ? usersRes.data : [];
      const projList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      setUsers(userList);
      setProjects(projList);
      setSelectedUserId((current) => current && userList.some((user) => user.id === current)
        ? current
        : userList[0]?.id || null);
    } catch (err) {
      // Keep the current data visible when a refresh fails.
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccessData(true);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative flex-1 max-w-auto w-full mx-auto px-4 py-6">
      {/* Page header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Access Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Grant, scope, and revoke individual capabilities per employee. Effects are immediate.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => fetchAccessData(false)}
            disabled={refreshing}
            title="Refresh access data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setBulkGrantModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            Grant Capability to Team
          </button>
          <button
            type="button"
            onClick={() => setBulkRevokeModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            Revoke Capability from Team
          </button>
        </div>
      </div>

      {refreshing && <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none"><div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-md"><RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />Refreshing access data</div></div>}

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* ── Left: User list ── */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden lg:sticky lg:top-20">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Filter users..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              />
            </div>
            {paginatedUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No users found.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto">
                {paginatedUsers.map((user) => (
                  <li key={user.id}>
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition ${
                        selectedUserId === user.id
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        selectedUserId === user.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{user.name}</div>
                        <div className={`text-[10px] truncate ${selectedUserId === user.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {user.accountType === 'ADMIN' ? 'Administrator' : 'Employee'}
                        </div>
                      </div>
                      {user.accountType === 'ADMIN' && (
                        <Shield className={`w-3.5 h-3.5 ml-auto shrink-0 ${selectedUserId === user.id ? 'text-slate-300' : 'text-slate-400'}`} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              currentPage={userPage}
              totalItems={filteredUsers.length}
              itemsPerPage={USERS_PER_PAGE}
              onPageChange={setUserPage}
            />
          </div>
        </div>

        {/* ── Right: Capability matrix ── */}
        <div className="flex-1 min-w-0">
          {!selectedUser ? (
            <div className="bg-white rounded-lg border border-slate-200 h-48 flex items-center justify-center">
              <p className="text-sm text-slate-400">Select a user to manage their access.</p>
            </div>
          ) : (
            <div>
              {/* User banner */}
              <div className="bg-white rounded-lg border border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{selectedUser.name}</span>
                    <Badge
                      variant={selectedUser.accountType === 'ADMIN' ? 'admin' : 'employee'}
                      label={selectedUser.accountType === 'ADMIN' ? 'Administrator' : 'Employee'}
                    />
                    {!selectedUser.isActive && <Badge variant="inactive" label="Inactive" dot />}
                    {selectedUser.id === currentUser?.id && (
                      <span className="text-[11px] text-slate-400 italic">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
                </div>
                {selectedUser.accountType === 'ADMIN' && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded bg-violet-50 border border-violet-200 text-xs text-violet-700 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Holds all capabilities by default.
                  </div>
                )}
              </div>

              {/* Capability matrix — only meaningful for employees */}
              <UserAccessPanel
                key={selectedUser.id}
                targetUser={selectedUser}
                users={users}
                projects={projects}
                currentUserId={currentUser?.id}
              />
            </div>
          )}

          <AuditLog />
        </div>
      </div>

      {/* Bulk Grant Capability to Team Modal */}
      <Modal
        isOpen={bulkGrantModal}
        onClose={() => setBulkGrantModal(false)}
        title="Grant Capability to Team Members"
        size="lg"
      >
        <BulkGrantTeamForm
          users={users}
          projects={projects}
          currentUserId={currentUser?.id}
          onSuccess={(capabilityCode, userIds) => {
            setBulkGrantModal(false);
            fetchAccessData(false);
            notify.success(
              `Granted "${CAP_META[capabilityCode]?.label || capabilityCode}" to ${userIds.length} employee(s).`
            );
          }}
          onCancel={() => setBulkGrantModal(false)}
        />
      </Modal>

      {/* Bulk Revoke Capability from Team Modal */}
      <Modal
        isOpen={bulkRevokeModal}
        onClose={() => setBulkRevokeModal(false)}
        title="Revoke Capability from Team Members"
        size="lg"
      >
        <BulkRevokeTeamForm
          users={users}
          onSuccess={(capabilityCode, userIds) => {
            setBulkRevokeModal(false);
            fetchAccessData(false);
            notify.success(
              `Revoked "${CAP_META[capabilityCode]?.label || capabilityCode}" from ${userIds.length} employee(s).`
            );
          }}
          onCancel={() => setBulkRevokeModal(false)}
        />
      </Modal>
    </main>
  );
}
