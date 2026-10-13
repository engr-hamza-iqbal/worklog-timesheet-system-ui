import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Plus, RefreshCw, Search, Mail, AlertCircle } from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { userStatusSchema } from '../../validation/formSchemas.js';

import InviteUserForm from './components/InviteUserModal.jsx';
import CreateUserForm from './components/CreateUserModal.jsx';
import AssignProjectsForm from './components/AssignProjectsModal.jsx';
import BulkAssignTeamForm from './components/BulkAssignTeamModal.jsx';
import UsersTable from './components/UsersTable.jsx';

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

  // User shape from getUsers() service
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [assigningUser, setAssigningUser] = useState(null);
  const { notify } = useNotification();
  const [statusConfirmation, setStatusConfirmation] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // GET /api/users
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // PATCH /api/users/:id/status
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
    const parsed = userStatusSchema.safeParse({ isActive: !user.isActive });
    if (!parsed.success) return;
    try {
      const res = await api.patch(`/api/users/${user.id}/status`, parsed.data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">Manage team members and their project assignments.</p>
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
              <>
                <button
                  type="button"
                  onClick={() => setModal('inviteUser')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />Invite User
                </button>
                <button
                  onClick={() => setModal('createUser')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />New User
                </button>
              </>
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
        {loading && users.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
              <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />Refreshing users
            </div>
          </div>
        )}
        <UsersTable
          paginatedUsers={paginatedUsers}
          totalFiltered={filtered.length}
          search={search}
          canCreateUser={canCreateUser}
          canManageUsers={canManageUsers}
          canAssign={canAssign}
          sortField={sortField}
          sortOrder={sortOrder}
          toggleSort={toggleSort}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          canManageSpecificUser={canManageSpecificUser}
          handleToggleStatus={handleToggleStatus}
          currentUser={currentUser}
          togglingUserId={togglingUserId}
          canAssignUser={canAssignUser}
          canRemoveProject={canRemoveProject}
          allowedAssignProjectIds={allowedAssignProjectIds}
          userHasProjectInCapabilities={userHasProjectInCapabilities}
          setAssigningUser={setAssigningUser}
          onAssignmentsUpdated={(userId, updatedList) => {
            if (userId && updatedList) {
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, activeAssignments: updatedList } : u
                )
              );
            }
            fetchUsers();
          }}
          page={page}
          setPage={setPage}
          usersPerPage={USERS_PER_PAGE}
          onCreateUserClick={() => setModal('createUser')}
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

      {/* Assign Projects to Single User modal */}
      <Modal
        isOpen={Boolean(assigningUser)}
        onClose={() => setAssigningUser(null)}
        title={assigningUser ? `Assign Projects — ${assigningUser.name}` : 'Assign Projects'}
        size="lg"
      >
        {assigningUser && (
          <AssignProjectsForm
            user={assigningUser}
            assignedProjectIds={new Set((assigningUser.activeAssignments || []).map((p) => p.id))}
            allowedProjectIds={allowedAssignProjectIds}
            onSuccess={(newlyAddedProjects) => {
              const updated = [...(assigningUser.activeAssignments || []), ...newlyAddedProjects];
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === assigningUser.id ? { ...u, activeAssignments: updated } : u
                )
              );
              setAssigningUser(null);
              notify.success(`Assigned ${newlyAddedProjects.length} project(s) to ${assigningUser.name}.`);
              fetchUsers();
            }}
            onCancel={() => setAssigningUser(null)}
          />
        )}
      </Modal>

      {/* Invite user modal */}
      <Modal
        isOpen={modal === 'inviteUser'}
        onClose={() => setModal(null)}
        title="Team Member Invitations"
        size="lg"
      >
        <InviteUserForm
          onCancel={() => setModal(null)}
          existingEmails={users.map((u) => (u.email || '').toLowerCase().trim())}
        />
      </Modal>

      {/* Create user modal */}
      <Modal isOpen={modal === 'createUser'} onClose={() => setModal(null)} title="Create User">
        <CreateUserForm
          onSuccess={(newUser) => {
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
