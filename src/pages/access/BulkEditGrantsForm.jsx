import React, { useState, useMemo } from 'react';
import { Shield, Clock, FolderOpen, User, Search, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { CAP_META } from './constants.js';
import { broadcastAuthSync, ErrorAlert, toLocalEndOfDayIso, toLocalDateString } from './helpers.jsx';

// ─── Bulk Edit Capabilities Form ─────────────────────────────────────────────

export default function BulkEditGrantsForm({ selectedGrants = [], targetUser, users, projects, onSuccess, onCancel }) {
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
    const today = new Date();
    const base = expiresAt && new Date(expiresAt) > today ? new Date(expiresAt) : today;
    base.setDate(base.getDate() + days);
    setExpiresAt(toLocalDateString(base));
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
    if (!selectedGrants || selectedGrants.length === 0) {
      setError('Please select at least one capability to update.');
      return;
    }
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
        payload.expiresAt = isPermanent ? null : (expiresAt ? toLocalEndOfDayIso(expiresAt) : null);
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
