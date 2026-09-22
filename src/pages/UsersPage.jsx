import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, UserCheck, UserX, AlertCircle, RefreshCw,
  Search, FolderOpen,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
      {...props}
    />
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
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <FormField label="Full name">
        <Input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required autoFocus />
      </FormField>
      <FormField label="Work email">
        <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required />
      </FormField>
      <FormField label="Password">
        <Input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required />
      </FormField>
      <FormField label="Account type">
        <select
          value={form.accountType}
          onChange={set('accountType')}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

// ─── Assign Project Form ──────────────────────────────────────────────────────

function AssignProjectForm({ user, onSuccess, onCancel }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/projects?activeOnly=true').then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.projects || [];
      setProjects(list);
      if (list.length > 0) setSelectedProjectId(list[0].id);
    }).catch(() => {
      setError('Failed to load projects.');
    }).finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) { setError('Please select a project.'); return; }
    setLoading(true);
    setError('');
    try {
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
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}
      {projects.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No active projects available.</p>
      ) : (
        <FormField label="Project">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.client?.name ? `${p.client.name} — ` : ''}{p.name}</option>
            ))}
          </select>
        </FormField>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading || projects.length === 0} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>
    </form>
  );
}

// ─── User Row Detail (assignments) ────────────────────────────────────────────

function UserDetail({ user, canManageUsers, canAssign, onRefresh }) {
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    api.get('/api/projects').then((res) => {
      const projects = Array.isArray(res.data) ? res.data : res.data?.projects || [];
      // Filter to projects where this user is currently assigned (removedAt is null)
      const userProjects = projects.filter((p) =>
        p.assignments?.some((a) => a.userId === user.id && !a.removedAt)
      );
      setAssignments(userProjects);
    }).catch(() => setAssignments([])).finally(() => setLoading(false));
  }, [user.id]);

  const handleRemove = async (projectId) => {
    setRemovingId(projectId);
    try {
      await api.delete(`/api/projects/${projectId}/assignments/${user.id}`);
      setAssignments((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      // silently ignore — user sees no change
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Assignments</span>
        {canAssign && (
          <button
            onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Assign
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading...
        </div>
      ) : assignments && assignments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {assignments.map((p) => (
            <div key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700">
              <FolderOpen className="w-3 h-3 text-slate-400" />
              <span>{p.name}</span>
              {canAssign && (
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={removingId === p.id}
                  className="text-slate-300 hover:text-red-500 transition cursor-pointer disabled:opacity-50 ml-0.5"
                  aria-label={`Remove assignment from ${p.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">Not assigned to any projects.</p>
      )}

      {showAssign && (
        <div className="mt-3 p-3 bg-white border border-slate-200 rounded">
          <AssignProjectForm
            user={user}
            onSuccess={() => {
              setShowAssign(false);
              // Re-fetch assignments
              setLoading(true);
              api.get('/api/projects').then((res) => {
                const projects = Array.isArray(res.data) ? res.data : res.data?.projects || [];
                const userProjects = projects.filter((p) =>
                  p.assignments?.some((a) => a.userId === user.id && !a.removedAt)
                );
                setAssignments(userProjects);
              }).finally(() => setLoading(false));
            }}
            onCancel={() => setShowAssign(false)}
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

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/users');
      const list = Array.isArray(res.data) ? res.data : res.data?.users || [];
      setUsers(list);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) { setError("You can't deactivate your own account."); return; }
    try {
      await api.patch(`/api/users/${user.id}/status`, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u)
      );
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
            <Plus className="w-3.5 h-3.5" />
            New User
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Search bar */}
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

      {/* Users table */}
      <div className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search ? 'No users match your search.' : 'No users found.'}
            message={!search && canManageUsers ? 'Create your first team member.' : undefined}
            action={
              !search && canManageUsers && (
                <button
                  onClick={() => setModal('createUser')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New User
                </button>
              )
            }
          />
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Name / Email</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Status</div>
              {canManageUsers && <div className="col-span-2 text-right">Actions</div>}
            </div>

            {filtered.map((user) => (
              <div key={user.id} className="border-b border-slate-100 last:border-0">
                <div
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-slate-50/60 transition cursor-pointer"
                  onClick={() =>
                    setExpandedId((prev) => (prev === user.id ? null : user.id))
                  }
                >
                  {/* Name + email */}
                  <div className="col-span-8 sm:col-span-5 min-w-0">
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
                  <div className="hidden sm:block col-span-3">
                    <Badge
                      variant={user.isActive ? 'active' : 'inactive'}
                      label={user.isActive ? 'Active' : 'Inactive'}
                      dot
                    />
                  </div>

                  {/* Actions */}
                  {canManageUsers && (
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(user);
                        }}
                        disabled={user.id === currentUser?.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title={user.id === currentUser?.id ? "Can't deactivate yourself" : ''}
                      >
                        {user.isActive ? (
                          <><UserX className="w-3 h-3" /><span className="hidden sm:inline">Deactivate</span></>
                        ) : (
                          <><UserCheck className="w-3 h-3" /><span className="hidden sm:inline">Activate</span></>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail row */}
                {expandedId === user.id && (
                  <UserDetail
                    user={user}
                    canManageUsers={canManageUsers}
                    canAssign={canAssign}
                    onRefresh={fetchUsers}
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
      <Modal
        isOpen={modal === 'createUser'}
        onClose={() => setModal(null)}
        title="Create User"
      >
        <CreateUserForm
          onSuccess={(user) => {
            setUsers((prev) => [user, ...prev]);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </main>
  );
}
