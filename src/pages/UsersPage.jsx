import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, UserCheck, UserX, AlertCircle, RefreshCw,
  Search, FolderOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';

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
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

// ─── Assign Project Form ──────────────────────────────────────────────────────

// assignedProjectIds: Set of project IDs already assigned to this user (from live state)
function AssignProjectForm({ user, assignedProjectIds, onSuccess, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // GET /api/projects?activeOnly=true → { success, data: [{ id, name, clientName, status, ... }], message }
    api.get('/api/projects?activeOnly=true')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        // Filter out projects already assigned to this user
        const available = list.filter((p) => !assignedProjectIds.has(p.id));
        setProjects(available);
        if (available.length > 0) setSelectedProjectId(available[0].id);
      })
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setFetching(false));
  }, [assignedProjectIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) { setError('Please select a project.'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /api/projects/:id/assignments → { success, data: { id, projectId, userId, ... }, message }
      await api.post(`/api/projects/${selectedProjectId}/assignments`, { userId: user.id });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to assign user to project.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center py-6"><RefreshCw className="w-4 h-4 text-slate-400 animate-spin" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">
        Assigning <span className="font-medium text-slate-900">{user.name}</span> to a project.
      </p>
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {projects.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          {error ? null : 'All active projects are already assigned to this user.'}
        </p>
      ) : (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white transition"
          >
            {projects.map((p) => (
              // clientName comes from service getProjects mapping
              <option key={p.id} value={p.id}>
                {p.clientName ? `${p.clientName} — ` : ''}{p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading || projects.length === 0}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>
    </form>
  );
}

// ─── User Row (expanded assignments) ─────────────────────────────────────────

function UserAssignments({ user, canAssign, onAssigned }) {
  // activeAssignments comes directly from getUsers() service mapping:
  // activeAssignments: u.assignments.map((a) => a.project)
  // each = { id, name, status }
  const [assignments, setAssignments] = useState(user.activeAssignments || []);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');

  const handleRemove = async (projectId) => {
    setRemovingId(projectId);
    setError('');
    try {
      // DELETE /api/projects/:projectId/assignments/:userId
      await api.delete(`/api/projects/${projectId}/assignments/${user.id}`);
      setAssignments((prev) => prev.filter((p) => p.id !== projectId));
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
          Project Assignments
        </span>
        {canAssign && (
          <button
            onClick={() => setShowAssignForm((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />Assign to project
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
              {canAssign && (
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
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic mt-1">Not assigned to any projects.</p>
      )}

      {showAssignForm && (
        <div className="mt-3 p-3 bg-white border border-slate-200 rounded">
          <AssignProjectForm
            user={user}
            // Pass a Set of currently-assigned project IDs so the form can filter them out.
            // We use the live `assignments` state (not the stale prop) so removals are reflected immediately.
            assignedProjectIds={new Set(assignments.map((p) => p.id))}
            onSuccess={() => {
              setShowAssignForm(false);
              onAssigned(); // parent re-fetches users so activeAssignments is refreshed
            }}
            onCancel={() => setShowAssignForm(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { isAdmin, capabilities, user: currentUser } = useAuth();
  const canManageUsers = isAdmin || !!capabilities['MANAGE_USERS'];
  const canAssign = isAdmin || !!capabilities['ASSIGN_PROJECTS'];

  // User shape from getUsers() service:
  // { id, name, email, accountType, isActive, createdAt, updatedAt, activeAssignments: [{id, name, status}], activeCapabilitiesCount }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);

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
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      setError("You can't deactivate your own account.");
      return;
    }
    setError('');
    try {
      const res = await api.patch(`/api/users/${user.id}/status`, { isActive: !user.isActive });
      const updated = res.data;
      setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, isActive: updated.isActive } : u));
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Users &amp; Assignments</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team members and their project assignments.</p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setModal('createUser')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />New User
          </button>
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
        />
      </div>

      {/* Users list */}
      <div className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search ? 'No users match your search.' : 'No users found.'}
            message={!search && canManageUsers ? 'Create your first team member.' : undefined}
            action={
              !search && canManageUsers ? (
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
          <div>
            {/* Table header - desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Name / Email</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Projects</div>
              {(canManageUsers || canAssign) && <div className="col-span-2 text-right">Actions</div>}
            </div>

            {filtered.map((user) => (
              <div key={user.id} className="border-b border-slate-100 last:border-0">
                {/* Row */}
                <div
                  onClick={() => setExpandedId((prev) => prev === user.id ? null : user.id)}
                  className="grid grid-cols-12 gap-2 sm:gap-4 px-5 py-3.5 items-center hover:bg-slate-50/60 transition cursor-pointer"
                >
                  {/* Name + email */}
                  <div className="col-span-7 sm:col-span-4 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="hidden sm:block col-span-2">
                    <Badge
                      variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                      label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                    />
                  </div>

                  {/* Status */}
                  <div className="hidden sm:block col-span-2">
                    <Badge variant={user.isActive ? 'active' : 'inactive'} label={user.isActive ? 'Active' : 'Inactive'} dot />
                  </div>

                  {/* Active project count */}
                  <div className="hidden sm:flex col-span-2 items-center gap-1 text-xs text-slate-500">
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                    {/* activeAssignments is the array of project objects */}
                    {(user.activeAssignments || []).length}
                  </div>

                  {/* Actions */}
                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1.5">
                    {canManageUsers && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? "Can't deactivate yourself" : ''}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {user.isActive
                          ? <><UserX className="w-3 h-3" /><span className="hidden sm:inline">Deactivate</span></>
                          : <><UserCheck className="w-3 h-3" /><span className="hidden sm:inline">Activate</span></>}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedId((prev) => prev === user.id ? null : user.id); }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      {expandedId === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded assignments */}
                {expandedId === user.id && (
                  <UserAssignments
                    user={user}
                    canAssign={canAssign}
                    onAssigned={() => {
                      // Re-fetch so activeAssignments is fresh
                      fetchUsers();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <p className="mt-3 text-[11px] text-slate-400">
        {users.filter((u) => u.isActive).length} active · {users.filter((u) => !u.isActive).length} inactive · {users.length} total
      </p>

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
    </main>
  );
}
