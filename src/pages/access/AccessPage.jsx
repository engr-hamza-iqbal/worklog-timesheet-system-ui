import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, RefreshCw, ShieldAlert, CheckCircle, History,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';

import {
  CAP_META,
  UserAccessPanel,
  BulkGrantTeamForm,
  BulkRevokeTeamForm,
} from './index.js';

export { CAP_META, ALL_CAP_CODES } from './constants.js';

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
          <Link
            to="/audit-logs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            Access Audit Logs
          </Link>
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

      {refreshing && (
        <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
            <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
            Refreshing access data
          </div>
        </div>
      )}

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
          currentUserId={currentUser?.id}
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
