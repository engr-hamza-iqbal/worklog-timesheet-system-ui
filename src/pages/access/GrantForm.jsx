import React, { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../../api/client.js';
import { CAP_META, ALL_CAP_CODES } from './constants.js';
import { broadcastAuthSync, ErrorAlert, toLocalEndOfDayIso } from './helpers.jsx';

// ─── Grant Capabilities Form (Multiple Capabilities to User) ──────────────────

export default function GrantForm({ targetUser, grantedCodes, users, projects, onSuccess, onCancel }) {
  const availableCodes = ALL_CAP_CODES.filter((c) => !grantedCodes.has(c));

  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [capSearch, setCapSearch] = useState('');
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [projectList, setProjectList] = useState(Array.isArray(projects) ? projects : []);
  const [userList, setUserList] = useState(Array.isArray(users) ? users : []);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  React.useEffect(() => {
    if (Array.isArray(projects) && projects.length > 0) {
      setProjectList(projects);
    }
  }, [projects]);

  React.useEffect(() => {
    if (Array.isArray(users) && users.length > 0) {
      setUserList(users);
    }
  }, [users]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await api.get('/api/projects');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setProjectList(list);
    } catch (e) {
      // Keep existing list on failure
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/api/users');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setUserList(list);
    } catch (e) {
      // Keep existing list on failure
    } finally {
      setLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (scopeType === 'PROJECT' && projectList.length === 0) {
      fetchProjects();
    } else if (scopeType === 'USER' && userList.length === 0) {
      fetchUsers();
    }
  }, [scopeType, projectList.length, userList.length]);

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
        expiresAt: expiresAt ? toLocalEndOfDayIso(expiresAt) : undefined,
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-700">
              Target users ({targetUserIds.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetUserIds((userList || []).filter((u) => u.id !== targetUser.id && u.isActive).map((u) => u.id))}
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
              {userList.length === 0 && !loadingUsers && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Load Users
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading users...</span>
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 bg-white">
              {(userList || []).filter((u) => u.id !== targetUser.id && u.isActive).map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetUserIds.includes(u.id)}
                    onChange={() => toggleTargetId('targetUserIds', u.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{u.name}</span>
                    {u.accountType === 'ADMIN' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-auto truncate font-mono">{u.email}</span>
                </label>
              ))}
              {(userList || []).filter((u) => u.id !== targetUser.id && u.isActive).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-3">No matching users available.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Project scope picker */}
      {scopeType === 'PROJECT' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-700">
              Target projects ({targetProjectIds.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetProjectIds((projectList || []).filter((p) => p.status === 'ACTIVE' || !p.status).map((p) => p.id))}
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
              {projectList.length === 0 && !loadingProjects && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={fetchProjects}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Load Projects
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingProjects ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading projects...</span>
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 bg-white">
              {(projectList || []).filter((p) => p.status === 'ACTIVE' || !p.status).map((p) => (
                <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetProjectIds.includes(p.id)}
                    onChange={() => toggleTargetId('targetProjectIds', p.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 truncate">{p.name}</span>
                  <span className="text-[11px] text-slate-400 ml-auto truncate">{p.clientName}</span>
                </label>
              ))}
              {(projectList || []).filter((p) => p.status === 'ACTIVE' || !p.status).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-3">No active projects available.</p>
              )}
            </div>
          )}
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
