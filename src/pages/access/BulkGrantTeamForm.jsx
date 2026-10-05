import React, { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import Badge from '../../components/Badge.jsx';
import { CAP_META, ALL_CAP_CODES } from './constants.js';
import { broadcastAuthSync, ErrorAlert } from './helpers.jsx';

// ─── Bulk Grant Team Form (Assign 1 Capability to Selected / All Users) ────────

export default function BulkGrantTeamForm({ users, projects, currentUserId, onSuccess, onCancel }) {
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
