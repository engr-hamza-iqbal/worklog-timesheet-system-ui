import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, RefreshCw, ShieldAlert, CheckCircle, History,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';

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
  const [refreshing, setRefreshing] = useState(false);
  const [bulkGrantModal, setBulkGrantModal] = useState(false);
  const [bulkRevokeModal, setBulkRevokeModal] = useState(false);

  const fetchAccessData = async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/projects'),
      ]);
      const userList = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
      const projList = Array.isArray(projectsRes?.data) ? projectsRes.data : (Array.isArray(projectsRes) ? projectsRes : []);
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
      {refreshing && (
        <div className="absolute inset-x-0 top-6 z-20 flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-md">
            <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
            Refreshing access data
          </div>
        </div>
      )}

      {/* ── Top Controls Bar: Select User (over dropdown) + Actions (same row) ── */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 w-full sm:w-80">
          <label htmlFor="user-select-btn" className="text-xs font-semibold text-slate-700">
            Select User
          </label>
          <SearchableSelect
            id="user-select-btn"
            items={users}
            selectedId={selectedUserId}
            onSelect={(id) => setSelectedUserId(id)}
            placeholder="Select user..."
            searchPlaceholder="Search by name, email, or role..."
            filterItem={(u, term) =>
              (u.name && u.name.toLowerCase().includes(term)) ||
              (u.email && u.email.toLowerCase().includes(term)) ||
              (u.accountType && u.accountType.toLowerCase().includes(term))
            }
            getItemLabel={(u) => u.name}
            getItemSubtext={(u) => u.email}
            getItemBadge={(u) => ({
              label: u.accountType === 'ADMIN' ? 'Admin' : 'Employee',
              variant: u.accountType === 'ADMIN' ? 'violet' : 'slate',
            })}
            getItemNote={(u) => (u.id === currentUser?.id ? '(you)' : null)}
            renderIcon={(u, isSelected) => {
              const isAdmin = u.accountType === 'ADMIN';
              return (
                <div
                  className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : isAdmin
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                </div>
              );
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/audit-logs"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            Access Audit Logs
          </Link>
          <button
            type="button"
            onClick={() => fetchAccessData(false)}
            disabled={refreshing}
            title="Refresh access data"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setBulkGrantModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            Grant Capability to Team
          </button>
          <button
            type="button"
            onClick={() => setBulkRevokeModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            Revoke Capability from Team
          </button>
        </div>
      </div>

      {/* ── Full-Width Capability matrix area ── */}
      <div className="mt-6">
        {!selectedUser ? (
          <div className="bg-white rounded-xl border border-slate-200 h-60 flex flex-col items-center justify-center text-center p-6 shadow-2xs">
            <Shield className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No user selected</p>
            <p className="text-xs text-slate-400 mt-1">Please select an employee or administrator from the dropdown above to manage access.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User banner */}
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    selectedUser.accountType === 'ADMIN'
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-slate-900 truncate">{selectedUser.name}</span>
                    <Badge
                      variant={selectedUser.accountType === 'ADMIN' ? 'admin' : 'employee'}
                      label={selectedUser.accountType === 'ADMIN' ? 'Administrator' : 'Employee'}
                    />
                    {!selectedUser.isActive && <Badge variant="inactive" label="Inactive" dot />}
                    {selectedUser.id === currentUser?.id && (
                      <span className="text-[11px] text-slate-400 italic">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedUser.email}</p>
                </div>
              </div>
              {selectedUser.accountType === 'ADMIN' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-xs font-medium text-violet-700 shrink-0">
                  <CheckCircle className="w-4 h-4 text-violet-600" />
                  Holds all capabilities by default (Administrator).
                </div>
              )}
            </div>

            {/* Capability matrix */}
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
