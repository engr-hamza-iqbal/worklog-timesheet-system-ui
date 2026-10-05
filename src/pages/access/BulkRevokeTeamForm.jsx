import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Search, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { CAP_META, ALL_CAP_CODES } from './constants.js';
import { broadcastAuthSync, ErrorAlert } from './helpers.jsx';

// ─── Bulk Revoke Capability from Team Form ────────────────────────────────────

export default function BulkRevokeTeamForm({ users, currentUserId, onSuccess, onCancel }) {
  const [selectedCapability, setSelectedCapability] = useState('VIEW_OTHER_RECORDS');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active non-admin employees who currently hold this capability (excluding self)
  const eligibleUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.isActive &&
        u.accountType !== 'ADMIN' &&
        (!currentUserId || u.id !== currentUserId) &&
        Array.isArray(u.activeCapabilityCodes) &&
        u.activeCapabilityCodes.includes(selectedCapability)
    );
  }, [users, selectedCapability, currentUserId]);

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
