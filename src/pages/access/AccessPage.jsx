import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, RefreshCw, ShieldAlert, CheckCircle, History,
  Search, ChevronDown, Check, X,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';

import {
  CAP_META,
  UserAccessPanel,
  BulkGrantTeamForm,
  BulkRevokeTeamForm,
} from './index.js';

export { CAP_META, ALL_CAP_CODES } from './constants.js';

// ─── Searchable User Select (matches Reports employee selector) ────────────────
function SearchableUserSelect({
  users = [],
  selectedId = null,
  onSelect,
  currentUserId = null,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedId) || null;
  }, [users, selectedId]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.accountType && u.accountType.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (user) => {
    onSelect(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full sm:w-80" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-2xs hover:bg-slate-50 focus:border-slate-900 focus:outline-none transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
              selectedUser?.accountType === 'ADMIN'
                ? 'bg-violet-100 text-violet-700 border border-violet-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            {selectedUser ? (
              <span className="font-medium text-slate-900">
                {selectedUser.name}{' '}
                <span className="text-slate-400 font-normal text-xs">({selectedUser.email})</span>
              </span>
            ) : (
              <span className="text-slate-400">Select user...</span>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-slate-400">
              <span>{filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} found</span>
              {searchTerm && <span>Filtering by &ldquo;{searchTerm}&rdquo;</span>}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50 [scrollbar-width:thin]">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = u.id === selectedId;
                const isAdmin = u.accountType === 'ADMIN';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left rounded-lg text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-950 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isAdmin
                              ? 'bg-violet-100 text-violet-700 border border-violet-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium text-slate-900">{u.name}</span>
                          {u.id === currentUserId && (
                            <span className="text-[10px] text-slate-400 italic">(you)</span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isAdmin
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isAdmin ? 'Admin' : 'Employee'}
                      </span>
                      {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No users matching &ldquo;{searchTerm}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

      {/* ── User Selector Bar ── */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
            Select User:
          </label>
          <SearchableUserSelect
            users={users}
            selectedId={selectedUserId}
            onSelect={setSelectedUserId}
            currentUserId={currentUser?.id}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0 flex-wrap">
          <span>Total: <strong className="text-slate-800 font-semibold">{users.length}</strong> users</span>
          <span className="text-slate-300">•</span>
          <span><strong className="text-slate-800 font-semibold">{users.filter((u) => u.accountType === 'ADMIN').length}</strong> Admins</span>
          <span className="text-slate-300">•</span>
          <span><strong className="text-slate-800 font-semibold">{users.filter((u) => u.accountType !== 'ADMIN').length}</strong> Employees</span>
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
