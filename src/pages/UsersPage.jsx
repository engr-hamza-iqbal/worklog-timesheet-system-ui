import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, UserCheck, UserX, AlertCircle, RefreshCw,
  Search, FolderOpen, ChevronDown, ChevronUp, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, Briefcase, Check,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import useTableResize from '../hooks/useTableResize.js';
import ResizableTh from '../components/ResizableTh.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Create User Form ─────────────────────────────────────────────────────────

function CreateUserForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', accountType: 'EMPLOYEE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /api/users → { success, data: { id, name, email, accountType, isActive, createdAt }, message }
      const res = await api.post('/api/users', form);
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Full name</label>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required autoFocus
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Work email</label>
        <input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
        <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Account type</label>
        <select value={form.accountType} onChange={set('accountType')}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white transition">
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

// ─── Assign Projects Form (Multiple Unique Projects to Employee) ─────────────

function AssignProjectsForm({ user, assignedProjectIds, allowedProjectIds, onSuccess, onCancel }) {
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState(new Set());
  const [projectSearch, setProjectSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // GET /api/projects?activeOnly=true
    api.get('/api/projects?activeOnly=true')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAllProjects(list);
      })
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setFetching(false));
  }, []);

  const availableProjects = useMemo(() => {
    let list = allProjects.filter((p) => !assignedProjectIds.has(p.id));
    if (allowedProjectIds && allowedProjectIds.length > 0) {
      list = list.filter((p) => allowedProjectIds.includes(p.id));
    }
    return list;
  }, [allProjects, assignedProjectIds, allowedProjectIds]);

  const filteredAvailable = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    if (!q) return availableProjects;
    return availableProjects.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  }, [availableProjects, projectSearch]);

  const toggleProject = (id) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedProjectIds(new Set(filteredAvailable.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedProjectIds(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProjectIds.size === 0) {
      setError('Please select at least one project to assign.');
      return;
    }
    setLoading(true);
    setError('');
    const pIds = Array.from(selectedProjectIds);
    try {
      // POST /api/users/:id/assignments → batch assign projects
      await api.post(`/api/users/${user.id}/assignments`, { projectIds: pIds });
      const newlyAssigned = allProjects.filter((p) => selectedProjectIds.has(p.id));
      onSuccess(newlyAssigned);
    } catch (err) {
      // Fallback: assign individually if needed
      try {
        await Promise.all(
          pIds.map((pid) => api.post(`/api/projects/${pid}/assignments`, { userId: user.id }))
        );
        const newlyAssigned = allProjects.filter((p) => selectedProjectIds.has(p.id));
        onSuccess(newlyAssigned);
      } catch (fallbackErr) {
        setError(fallbackErr.message || err.message || 'Failed to assign projects.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-6">
        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">
          Assigning projects to <span className="font-semibold text-slate-900">{user.name}</span>
        </p>
        <span className="text-[11px] font-medium text-slate-500">
          {availableProjects.length} available
        </span>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {availableProjects.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
          All active projects are already assigned to this user.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Search & Bulk actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Filter projects by name or client..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
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

          {/* Project Checkbox List */}
          <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-200 rounded p-1.5 bg-slate-50/50">
            {filteredAvailable.map((project) => {
              const isSelected = selectedProjectIds.has(project.id);
              return (
                <div
                  key={project.id}
                  onClick={() => toggleProject(project.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-medium'
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
                    <div className="min-w-0">
                      <div className="truncate font-medium">{project.name}</div>
                      {project.clientName && (
                        <div className="text-[10px] text-slate-500 truncate">
                          Client: {project.clientName}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={project.status === 'ACTIVE' ? 'active' : 'closed'}
                    label={project.status === 'ACTIVE' ? 'Active' : 'Closed'}
                  />
                </div>
              );
            })}
            {filteredAvailable.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-3">
                No matching unassigned projects.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{selectedProjectIds.size}</span> project
          {selectedProjectIds.size === 1 ? '' : 's'} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedProjectIds.size === 0}
            className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            {loading ? 'Assigning...' : `Assign ${selectedProjectIds.size > 0 ? selectedProjectIds.size : ''} Project${selectedProjectIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Bulk Assign Team Form (Assign Project to Multiple Employees) ─────────────

function BulkAssignTeamForm({ users, allowedAssignUserIds, allowedProjectIds, currentUserId, onSuccess, onCancel }) {
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
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (selectedUserIds.size === 0) {
      setError('Please select at least one employee to assign.');
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
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Select Project to Assign
        </label>
        {projects.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active projects available.</p>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName ? `${p.clientName} — ` : ''}{p.name}
              </option>
            ))}
          </select>
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

// ─── User Row (expanded assignments) ─────────────────────────────────────────

function UserAssignments({ user, canAssign, canRemoveProject, allowedAssignProjectIds, userHasProjectInCapabilities, currentUserId, onAssigned }) {
  const [assignments, setAssignments] = useState(user.activeAssignments || []);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');
  const [removeConfirmation, setRemoveConfirmation] = useState(null);

  // Synchronize local assignments immediately when parent prop updates
  useEffect(() => {
    setAssignments(user.activeAssignments || []);
  }, [user.activeAssignments]);

  if (user.accountType === 'ADMIN') {
    return (
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 italic flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Administrators have system-wide access across all clients and projects and do not receive individual project assignments.</span>
      </div>
    );
  }

  const handleRemove = (projectId) => {
    setRemoveConfirmation(projectId);
  };

  const confirmRemove = async () => {
    const projectId = removeConfirmation;
    setRemoveConfirmation(null);
    setRemovingId(projectId);
    setError('');
    try {
      // DELETE /api/projects/:projectId/assignments/:userId
      await api.delete(`/api/projects/${projectId}/assignments/${user.id}`);
      const updated = assignments.filter((p) => p.id !== projectId);
      setAssignments(updated);
      onAssigned(user.id, updated);
    } catch (err) {
      setError(err.message || 'Failed to remove assignment.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Project Assignments ({assignments.length})
        </span>
        {canAssign && (
          <button
            onClick={() => setShowAssignForm((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            {showAssignForm ? 'Close form' : 'Assign projects'}
          </button>
        )}
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {assignments.length > 0 ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {assignments.map((project) => (
            <div key={project.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700">
              <FolderOpen className="w-3 h-3 text-slate-400" />
              <span>{project.name}</span>
              <Badge
                variant={project.status === 'ACTIVE' ? 'active' : 'closed'}
                label={project.status === 'ACTIVE' ? 'Active' : 'Closed'}
              />
              {canAssign && (!canRemoveProject || canRemoveProject(project, user)) ? (
                <button
                  onClick={() => handleRemove(project.id)}
                  disabled={removingId === project.id}
                  className="ml-1 text-slate-300 hover:text-red-500 transition cursor-pointer disabled:opacity-50"
                  aria-label={`Remove from ${project.name}`}
                >
                  {removingId === project.id
                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                    : '×'}
                </button>
              ) : currentUserId && user.id === currentUserId ? (
                <span
                  className="ml-1 text-slate-400 text-[10px] cursor-help"
                  title="You cannot remove yourself from project assignments"
                >
                  🔒
                </span>
              ) : userHasProjectInCapabilities && userHasProjectInCapabilities(user, project.id) ? (
                <span
                  className="ml-1 text-slate-400 text-[10px] cursor-help"
                  title="Cannot remove: employee holds active capabilities scoped to this project"
                >
                  🔒
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic mt-1">Not assigned to any projects.</p>
      )}

      {showAssignForm && (
        <div className="mt-3 p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <AssignProjectsForm
            user={user}
            assignedProjectIds={new Set(assignments.map((p) => p.id))}
            allowedProjectIds={allowedAssignProjectIds}
            onSuccess={(newlyAddedProjects) => {
              setShowAssignForm(false);
              const updated = [...assignments, ...newlyAddedProjects];
              setAssignments(updated);
              onAssigned(user.id, updated);
            }}
            onCancel={() => setShowAssignForm(false)}
          />
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(removeConfirmation)}
        onClose={() => setRemoveConfirmation(null)}
        onConfirm={confirmRemove}
        title="Remove project assignment"
        message="Remove this employee from the project? They will no longer be able to log time against it."
        confirmLabel="Remove assignment"
        tone="danger"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { isAdmin, capabilities, user: currentUser } = useAuth();
  const canManageUsers = isAdmin || !!capabilities['MANAGE_USERS'];
  const canAssign = isAdmin || !!capabilities['ASSIGN_PROJECTS'];

  const assignCap = capabilities?.['ASSIGN_PROJECTS'];
  const isAssignGlobal = isAdmin || assignCap?.isGlobal;
  const allowedAssignUserIds = useMemo(() => {
    if (isAssignGlobal) return null;
    return assignCap?.allowedUserIds || [];
  }, [isAssignGlobal, assignCap]);

  const canAssignUser = useCallback((targetUser) => {
    if (!canAssign || !targetUser) return false;
    // Business Rule: Nobody may assign projects to themselves
    if (targetUser.id === currentUser?.id) return false;
    if (isAssignGlobal) return true;
    if (allowedAssignUserIds && allowedAssignUserIds.length > 0) {
      return allowedAssignUserIds.includes(targetUser.id);
    }
    return true;
  }, [canAssign, currentUser, isAssignGlobal, allowedAssignUserIds]);

  const manageUsersCap = capabilities?.['MANAGE_USERS'];
  const isManageUsersGlobal = isAdmin || manageUsersCap?.isGlobal;
  const allowedManageUserIds = useMemo(() => {
    if (isManageUsersGlobal) return null;
    return manageUsersCap?.allowedUserIds || [];
  }, [isManageUsersGlobal, manageUsersCap]);
  const allowedManageProjectIds = useMemo(() => {
    if (isManageUsersGlobal) return null;
    return manageUsersCap?.allowedProjectIds || [];
  }, [isManageUsersGlobal, manageUsersCap]);

  const allowedAssignProjectIds = useMemo(() => {
    if (isAssignGlobal) return null;
    if (assignCap?.allowedProjectIds && assignCap.allowedProjectIds.length > 0) {
      return assignCap.allowedProjectIds;
    }
    const fallback = new Set();
    if (allowedManageProjectIds && allowedManageProjectIds.length > 0) {
      allowedManageProjectIds.forEach((id) => fallback.add(id));
    }
    const manageClientsCap = capabilities?.['MANAGE_CLIENTS_PROJECTS'];
    if (manageClientsCap?.allowedProjectIds && manageClientsCap.allowedProjectIds.length > 0) {
      manageClientsCap.allowedProjectIds.forEach((id) => fallback.add(id));
    }
    if (fallback.size > 0) {
      return Array.from(fallback);
    }
    return null;
  }, [isAssignGlobal, assignCap, allowedManageProjectIds, capabilities]);

  const userHasProjectInCapabilities = useCallback((userToCheck, projectId) => {
    if (!userToCheck) return false;
    if (userToCheck.id === currentUser?.id && capabilities) {
      for (const code of Object.keys(capabilities)) {
        const cap = capabilities[code];
        if (cap && Array.isArray(cap.allowedProjectIds) && cap.allowedProjectIds.includes(projectId)) {
          return true;
        }
      }
    }
    return false;
  }, [capabilities, currentUser]);

  const canRemoveProject = useCallback((project, targetUser) => {
    if (!canAssign || !project) return false;
    // Business Rule: Nobody may remove themselves from project assignments
    if (targetUser && targetUser.id === currentUser?.id) {
      return false;
    }
    if (isAdmin) return true;
    if (isAssignGlobal) return true;
    if (allowedAssignProjectIds) {
      return allowedAssignProjectIds.includes(project.id);
    }
    return true;
  }, [canAssign, currentUser, isAdmin, isAssignGlobal, allowedAssignProjectIds]);

  const canManageSpecificUser = useCallback((targetUser) => {
    if (!canManageUsers || !targetUser) return false;
    // Business Rule: Nobody may manage their own user status
    if (targetUser.id === currentUser?.id) return false;
    if (isManageUsersGlobal) return true;
    if (allowedManageUserIds && allowedManageUserIds.length > 0) {
      return allowedManageUserIds.includes(targetUser.id);
    }
    if (allowedManageProjectIds && allowedManageProjectIds.length > 0) {
      return (targetUser.activeAssignments || []).some((p) => allowedManageProjectIds.includes(p.id));
    }
    return false;
  }, [canManageUsers, currentUser, isManageUsersGlobal, allowedManageUserIds, allowedManageProjectIds]);

  const canCreateUser = isAdmin || isManageUsersGlobal;

  // User shape from getUsers() service:
  // { id, name, email, accountType, isActive, createdAt, updatedAt, activeAssignments: [{id, name, status}], activeCapabilitiesCount }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);
  const { notify } = useNotification();
  const [statusConfirmation, setStatusConfirmation] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Resizable columns for users table
  const { columnWidths, startResize, tableStyle } = useTableResize({
    name: 260,
    accountType: 130,
    isActive: 130,
    projects: 140,
    actions: 140,
  });

  // GET /api/users → { success, data: [...users], message }
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      const list = Array.isArray(res.data) ? res.data : [];
      setUsers(list);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  // PATCH /api/users/:id/status → { success, data: { id, name, email, accountType, isActive, updatedAt }, message }
  const handleToggleStatus = (user) => {
    if (user.id === currentUser?.id) {
      setError("You can't deactivate your own account.");
      notify.warn("You can't deactivate your own account.");
      return;
    }
    setStatusConfirmation(user);
  };

  const confirmToggleStatus = async () => {
    const user = statusConfirmation;
    if (!user) return;
    setIsTogglingStatus(true);
    setTogglingUserId(user.id);
    setError('');
    try {
      const res = await api.patch(`/api/users/${user.id}/status`, { isActive: !user.isActive });
      const updated = res.data;
      setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, isActive: updated.isActive } : u));
      notify.success(`User ${updated.isActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusConfirmation(null);
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
      notify.error(err.message || 'Failed to update user status.');
      setStatusConfirmation(null);
    } finally {
      setIsTogglingStatus(false);
      setTogglingUserId(null);
    }
  };

  const [page, setPage] = useState(1);
  const USERS_PER_PAGE = 10;
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const visibleUsers = useMemo(() => {
    if (!isAdmin) {
      return users.filter((u) => u.accountType !== 'ADMIN');
    }
    return users;
  }, [users, isAdmin]);

  const filtered = visibleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sortedFilteredUsers = useMemo(() => {
    const list = [...filtered];
    return list.sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sortField === 'name') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else if (sortField === 'accountType') {
        aVal = (a.accountType || '').toLowerCase();
        bVal = (b.accountType || '').toLowerCase();
      } else if (sortField === 'isActive') {
        aVal = a.isActive ? 1 : 0;
        bVal = b.isActive ? 1 : 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (sortField === 'projects') {
        aVal = (a.activeAssignments || []).length;
        bVal = (b.activeAssignments || []).length;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return sortedFilteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [sortedFilteredUsers, page]);

  if (loading && !users.length) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-auto w-full mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Users &amp; Assignments</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team members and their project assignments.</p>
        </div>
        {(canManageUsers || canAssign) && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button type="button" onClick={fetchUsers} disabled={loading} title="Refresh users" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
            </button>
            {canAssign && (
              <button
                type="button"
                onClick={() => setModal('bulkAssign')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />Assign Team to Project
              </button>
            )}
            {canCreateUser && (
              <button
                onClick={() => setModal('createUser')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />New User
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
        </div>
      )}

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
        />
      </div>

      {/* Users list */}
      <div className="relative mt-4 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && users.length > 0 && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]"><div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md"><RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />Refreshing users</div></div>}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search ? 'No users match your search.' : 'No users found.'}
            message={!search && canCreateUser ? 'Create your first team member.' : undefined}
            action={
              !search && canCreateUser ? (
                <button
                  onClick={() => setModal('createUser')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />New User
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="text-left border-collapse text-xs table-fixed min-w-[700px]" style={tableStyle}>
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-medium text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  <ResizableTh
                    width={columnWidths.name}
                    onResizeStart={(e) => startResize('name', e)}
                    onClick={() => toggleSort('name')}
                    className="py-2.5 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Name / Email</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.accountType}
                    onResizeStart={(e) => startResize('accountType', e)}
                    onClick={() => toggleSort('accountType')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Type</span>
                      {sortField === 'accountType' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.isActive}
                    onResizeStart={(e) => startResize('isActive', e)}
                    onClick={() => toggleSort('isActive')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Status</span>
                      {sortField === 'isActive' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    width={columnWidths.projects}
                    onResizeStart={(e) => startResize('projects', e)}
                    onClick={() => toggleSort('projects')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">Projects</span>
                      {sortField === 'projects' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  {(canManageUsers || canAssign) && (
                    <ResizableTh
                      width={columnWidths.actions}
                      resizable={false}
                      className="py-2.5 px-4 text-right"
                    >
                      <span className="truncate">Actions</span>
                    </ResizableTh>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr
                      onClick={() => setExpandedId((prev) => (prev === user.id ? null : user.id))}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                    >
                      {/* Name + email */}
                      <td className="py-3.5 px-5 truncate whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="text-xs font-medium text-slate-900 truncate" title={user.name}>
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate" title={user.email}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 truncate whitespace-nowrap overflow-hidden">
                        <Badge
                          variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                          label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 truncate whitespace-nowrap overflow-hidden">
                        <Badge
                          variant={user.isActive ? 'active' : 'inactive'}
                          label={user.isActive ? 'Active' : 'Inactive'}
                          dot
                        />
                      </td>

                      {/* Active project count */}
                      <td className="py-3.5 px-4 truncate whitespace-nowrap overflow-hidden">
                        {user.accountType === 'ADMIN' ? (
                          <span className="text-[11px] text-slate-400 italic">Global access</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId((prev) => (prev === user.id ? null : user.id));
                            }}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition cursor-pointer group ${
                              expandedId === user.id
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200'
                            }`}
                            title={
                              (user.activeAssignments || []).length > 0
                                ? `Assigned: ${(user.activeAssignments || []).map((p) => p.name).join(', ')} (click to expand)`
                                : 'No projects assigned — click to manage'
                            }
                          >
                            <FolderOpen
                              className={`w-3.5 h-3.5 ${
                                expandedId === user.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                              }`}
                            />
                            <span>{(user.activeAssignments || []).length}</span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${
                                expandedId === user.id ? 'rotate-180 text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                              }`}
                            />
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      {(canManageUsers || canAssign) && (
                        <td className="py-3.5 px-4 text-right truncate whitespace-nowrap overflow-hidden">
                          <div className="flex items-center justify-end gap-1.5 truncate">
                            {canManageSpecificUser(user) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(user);
                                }}
                                disabled={user.id === currentUser?.id || togglingUserId === user.id}
                                title={user.id === currentUser?.id ? "Can't deactivate yourself" : ''}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {togglingUserId === user.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-slate-700" />
                                    <span className="hidden sm:inline">Processing...</span>
                                  </>
                                ) : user.isActive ? (
                                  <>
                                    <UserX className="w-3 h-3 text-red-500" />
                                    <span className="hidden sm:inline">Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    <span className="hidden sm:inline">Activate</span>
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId((prev) => (prev === user.id ? null : user.id));
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 transition"
                              title={expandedId === user.id ? 'Collapse details' : 'Expand details'}
                            >
                              {expandedId === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded assignments */}
                    {expandedId === user.id && (
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan={(canManageUsers || canAssign) ? 5 : 4} className="p-0">
                          <UserAssignments
                            user={user}
                            canAssign={canAssignUser(user)}
                            canRemoveProject={canRemoveProject}
                            allowedAssignProjectIds={allowedAssignProjectIds}
                            userHasProjectInCapabilities={userHasProjectInCapabilities}
                            currentUserId={currentUser?.id}
                            onAssigned={(userId, updatedList) => {
                              if (userId && updatedList) {
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.id === userId ? { ...u, activeAssignments: updatedList } : u
                                  )
                                );
                              }
                              fetchUsers();
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalItems={filtered.length}
          itemsPerPage={USERS_PER_PAGE}
          onPageChange={setPage}
        />
      </div>

      {/* Stats */}
      <p className="mt-3 text-[11px] text-slate-400">
        {users.filter((u) => u.isActive).length} active · {users.filter((u) => !u.isActive).length} inactive · {users.length} total
      </p>

      {/* Assign Team to Project modal */}
      <Modal
        isOpen={modal === 'bulkAssign'}
        onClose={() => setModal(null)}
        title="Assign Team to Project"
        size="lg"
      >
        <BulkAssignTeamForm
          users={users}
          allowedAssignUserIds={allowedAssignUserIds}
          allowedProjectIds={allowedAssignProjectIds}
          currentUserId={currentUser?.id}
          onSuccess={(project, userIds) => {
            setUsers((prev) =>
              prev.map((u) => {
                if (userIds.includes(u.id)) {
                  const current = u.activeAssignments || [];
                  if (!current.some((p) => p.id === project.id)) {
                    return {
                      ...u,
                      activeAssignments: [
                        ...current,
                        { id: project.id, name: project.name, status: project.status },
                      ],
                    };
                  }
                }
                return u;
              })
            );
            fetchUsers();
            setModal(null);
            notify.success(`Assigned ${userIds.length} team member(s) to ${project.name}.`);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Create user modal */}
      <Modal isOpen={modal === 'createUser'} onClose={() => setModal(null)} title="Create User">
        <CreateUserForm
          onSuccess={(newUser) => {
            // newUser = { id, name, email, accountType, isActive, createdAt } from createUser service
            // Add with empty activeAssignments so it renders correctly before next full fetch
            setUsers((prev) => [{ ...newUser, activeAssignments: [], activeCapabilitiesCount: 0 }, ...prev]);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(statusConfirmation)}
        onClose={() => !isTogglingStatus && setStatusConfirmation(null)}
        onConfirm={confirmToggleStatus}
        loading={isTogglingStatus}
        loadingText={statusConfirmation?.isActive ? 'Deactivating...' : 'Activating...'}
        title={statusConfirmation?.isActive ? 'Deactivate user' : 'Activate user'}
        message={statusConfirmation?.isActive
          ? `Deactivate ${statusConfirmation?.name}? They will no longer be able to sign in.`
          : `Activate ${statusConfirmation?.name}? They will regain access to the application.`}
        confirmLabel={statusConfirmation?.isActive ? 'Deactivate' : 'Activate'}
        tone={statusConfirmation?.isActive ? 'danger' : 'primary'}
      />
    </main>
  );
}
