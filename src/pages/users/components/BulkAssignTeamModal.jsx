import React, { useState, useEffect, useMemo } from 'react';
import { Search, FolderOpen, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../api/client.js';
import Badge from '../../../components/Badge.jsx';
import { userAssignmentSchema } from '../../../validation/formSchemas.js';

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-auto">✕</button>}
    </div>
  );
}

export default function BulkAssignTeamForm({ users, allowedAssignUserIds, allowedProjectIds, currentUserId, onSuccess, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/projects?activeOnly=true')
      .then((res) => {
        let list = Array.isArray(res.data) ? res.data : [];
        if (allowedProjectIds && allowedProjectIds.length > 0) {
          list = list.filter((p) => allowedProjectIds.includes(p.id));
        }
        setProjects(list);
        if (list.length > 0) setSelectedProjectId(list[0].id);
      })
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setFetching(false));
  }, [allowedProjectIds]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Set of user IDs who already have this project assigned
  const alreadyAssignedUserIds = useMemo(() => {
    if (!selectedProjectId) return new Set();
    const set = new Set();
    for (const u of users) {
      if (u.activeAssignments?.some((p) => p.id === selectedProjectId)) {
        set.add(u.id);
      }
    }
    return set;
  }, [users, selectedProjectId]);

  // When project changes, clear selectedUserIds
  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [selectedProjectId]);

  const activeUsers = useMemo(() => {
    let list = users.filter((u) => u.isActive && u.accountType !== 'ADMIN');
    if (allowedAssignUserIds && allowedAssignUserIds.length > 0) {
      list = list.filter((u) => allowedAssignUserIds.includes(u.id));
    }
    return list;
  }, [users, allowedAssignUserIds]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return activeUsers;
    return activeUsers.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [activeUsers, userSearch]);

  const unassignedFilteredUsers = useMemo(() => {
    return filteredUsers.filter((u) => !alreadyAssignedUserIds.has(u.id));
  }, [filteredUsers, alreadyAssignedUserIds]);

  const toggleUser = (id) => {
    if (alreadyAssignedUserIds.has(id) || (currentUserId && id === currentUserId)) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnassigned = () => {
    setSelectedUserIds(new Set(unassignedFilteredUsers.filter((u) => !currentUserId || u.id !== currentUserId).map((u) => u.id)));
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = userAssignmentSchema.safeParse({ userIds: Array.from(selectedUserIds) });
    if (!selectedProjectId || !parsed.success) {
      setError(!selectedProjectId ? 'Please select a project.' : (parsed.error.issues[0]?.message || 'Select at least one employee.'));
      return;
    }
    setLoading(true);
    setError('');
    const uIds = Array.from(selectedUserIds);
    try {
      // POST /api/projects/:id/assignments → batch assign users
      await api.post(`/api/projects/${selectedProjectId}/assignments`, { userIds: uIds });
      onSuccess(selectedProject, uIds);
    } catch (err) {
      // Fallback: try individual user assignments if server router didn't catch the batch
      try {
        await Promise.all(
          uIds.map((uid) => api.post(`/api/projects/${selectedProjectId}/assignments`, { userId: uid }))
        );
        onSuccess(selectedProject, uIds);
      } catch (fallbackErr) {
        setError(fallbackErr.message || err.message || 'Failed to assign team members.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Project Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Select Project to Assign {selectedProject ? `(${selectedProject.name})` : ''}
        </label>
        {projects.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active projects available.</p>
        ) : (
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-1 space-y-1 bg-slate-50/50">
            {projects.map((p) => {
              const isSelected = selectedProjectId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium'
                      : 'bg-white border border-slate-200/70 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={12} className={isSelected ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0'} />
                    <span className="truncate font-medium">{p.name}</span>
                    {p.clientName && (
                      <span className="text-[10px] text-slate-400 truncate">({p.clientName})</span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-indigo-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Member Multi-select */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Select Team Members ({unassignedFilteredUsers.length} unassigned)
          </label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllUnassigned}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Select all unassigned
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
            placeholder="Search by name or email..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 border border-slate-200 rounded p-1.5 bg-slate-50/50">
          {filteredUsers.map((user) => {
            const isAlready = alreadyAssignedUserIds.has(user.id);
            const isSelf = Boolean(currentUserId && user.id === currentUserId);
            const isDisabled = isAlready || isSelf;
            const isSelected = selectedUserIds.has(user.id);

            return (
              <div
                key={user.id}
                onClick={() => !isDisabled && toggleUser(user.id)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs transition select-none ${
                  isDisabled
                    ? 'bg-slate-100/70 border border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-medium cursor-pointer'
                    : 'bg-white border border-slate-200/70 hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isAlready || isSelected}
                    disabled={isDisabled}
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

                <div>
                  {isSelf ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="You cannot assign yourself to projects">
                      Self (Prohibited)
                    </span>
                  ) : isAlready ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                      Already Assigned
                    </span>
                  ) : (
                    <Badge
                      variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                      label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-4">No team members match search.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">{selectedUserIds.size}</span> team member
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
            disabled={loading || selectedUserIds.size === 0 || !selectedProjectId}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            {loading ? 'Assigning...' : `Assign ${selectedUserIds.size > 0 ? selectedUserIds.size : ''} Team Member${selectedUserIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </form>
  );
}
