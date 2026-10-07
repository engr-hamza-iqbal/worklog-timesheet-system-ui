import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, UserCheck, UserX, AlertCircle, RefreshCw,
  Search, FolderOpen, ChevronDown, ChevronUp, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, Briefcase, Check, Mail, Copy, Key, Ban, Clock,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../components/Table.jsx';
import ResizableTh from '../components/ResizableTh.jsx';
import { assignmentSchema, userAssignmentSchema, userSchema, userStatusSchema } from '../validation/formSchemas.js';

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

// ─── Invite User Form ─────────────────────────────────────────────────────────

function InviteUserForm({ onCancel, existingEmails = [] }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [email, setEmail] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('72');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Manage tab state
  const [invitations, setInvitations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [customRevokeToken, setCustomRevokeToken] = useState('');
  const [revokingCustom, setRevokingCustom] = useState(false);

  const handleRevokeCustom = async () => {
    const raw = customRevokeToken.trim();
    if (!raw) return;
    setRevokingCustom(true);
    setActionFeedback('');
    setListError('');
    try {
      await api.post(`/api/auth/invitations/${encodeURIComponent(raw)}/revoke`);
      setActionFeedback('Invitation has been successfully revoked and expired.');
      setCustomRevokeToken('');
      fetchInvitations();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to revoke token.';
      setListError(msg);
    } finally {
      setRevokingCustom(false);
    }
  };

  const fetchInvitations = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const res = await api.get('/api/auth/invitations');
      const list = Array.isArray(res?.data?.invitations)
        ? res.data.invitations
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.invitations)
        ? res.invitations
        : Array.isArray(res)
        ? res
        : [];
      setInvitations(list);
    } catch (err) {
      setListError(err.message || 'Failed to load invitations.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const isAlreadyRegistered = useMemo(() => {
    if (!email.trim()) return false;
    return existingEmails.includes(email.trim().toLowerCase());
  }, [email, existingEmails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) { setError('Email is required.'); return; }
    if (isAlreadyRegistered) {
      setError('This email is already registered to an active or existing user. You cannot send an invitation.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/invite', {
        email: cleanEmail,
        expiresInHours: Number(expiresInHours),
      });
      const token = res?.data?.invitationToken || res?.invitationToken;
      const inviteUrl = `${window.location.origin}/register?invite=${token}`;
      setInviteResult({ ...(res?.data || res), inviteUrl });
      fetchInvitations();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to generate invitation.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyExistingLink = (token, id) => {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 3000);
  };

  const handleRevoke = async (inv) => {
    if (!window.confirm(`Are you sure you want to revoke and immediately expire the invite link for ${inv.email}? The invitee will not be able to register.`)) {
      return;
    }
    setRevokingId(inv.id);
    setActionFeedback('');
    try {
      await api.post(`/api/auth/invitations/${inv.id}/revoke`);
      setActionFeedback(`Invite link for ${inv.email} was successfully revoked.`);
      setInvitations((prev) =>
        prev.map((item) => (item.id === inv.id ? { ...item, status: 'REVOKED', revokedAt: new Date().toISOString() } : item))
      );
    } catch (err) {
      setActionFeedback(`Failed to revoke invitation: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 -mx-5 px-5">
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'generate'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail size={13} />
          Generate Invite Link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'manage'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Key size={13} />
          Active & Revoked Invites
          {invitations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'generate' && (
        <div>
          {inviteResult ? (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Invitation Generated Successfully
                </div>
                <p>
                  An invitation link has been created for <strong>{inviteResult.email}</strong>. It will expire in {inviteResult.expiresInHours} hours.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registration Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inviteResult.inviteUrl)}
                    className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Share this link with the employee. When they open it, their email is pre-verified, OTP is waived, and the token expires immediately once used or if revoked by an admin.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setInviteResult(null);
                    setEmail('');
                    setError('');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                >
                  + Generate another invite
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition cursor-pointer"
                  >
                    View All Invites
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <ErrorAlert message={error} onDismiss={() => setError('')} />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Invitee Email Address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="colleague@company.com"
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none transition ${
                    isAlreadyRegistered
                      ? 'border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {isAlreadyRegistered ? (
                  <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1 font-medium bg-amber-50 border border-amber-200 p-2 rounded">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    This email is already registered to an existing team member. Invitations can only be generated for new members.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    This invitation will be linked to this email address.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Link Expiration</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
                >
                  <option value="24">24 hours (1 day)</option>
                  <option value="48">48 hours (2 days)</option>
                  <option value="72">72 hours (3 days)</option>
                  <option value="168">168 hours (7 days)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim() || isAlreadyRegistered}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="animate-spin" size={13} />}
                  <span>{loading ? 'Generating...' : 'Generate Invite Link'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Manage existing invitation links. Revoking an invite immediately renders the link invalid.
            </p>
            <button
              type="button"
              onClick={fetchInvitations}
              disabled={loadingList}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} className={loadingList ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <ErrorAlert message={listError} onDismiss={() => setListError('')} />

          {actionFeedback && (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span>{actionFeedback}</span>
              <button onClick={() => setActionFeedback('')} className="text-emerald-600 hover:text-emerald-800">✕</button>
            </div>
          )}

          {/* Quick Revoke by Link or Token */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <input
              type="text"
              value={customRevokeToken}
              onChange={(e) => setCustomRevokeToken(e.target.value)}
              placeholder="Paste any invitation URL or token to revoke immediately..."
              className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
            />
            <button
              type="button"
              disabled={revokingCustom || !customRevokeToken.trim()}
              onClick={handleRevokeCustom}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded transition cursor-pointer shrink-0 inline-flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {revokingCustom ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
              <span>Revoke Link</span>
            </button>
          </div>

          {loadingList && invitations.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs">Loading invitation links...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded border border-slate-200">
              No invitations have been generated yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Invitee Email</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Expires / Created</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {invitations.map((inv) => {
                    const isPending = inv.status === 'PENDING';
                    const isAccepted = inv.status === 'ACCEPTED';
                    const isRevoked = inv.status === 'REVOKED';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {inv.email}
                        </td>
                        <td className="py-2.5 px-3">
                          {isPending && <Badge variant="active" label="Active" dot />}
                          {isAccepted && <Badge variant="pending" label="Registered" dot />}
                          {isRevoked && <Badge variant="revoked" label="Revoked" dot />}
                          {inv.status === 'EXPIRED' && <Badge variant="expired" label="Expired" dot />}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            <span>
                              {new Date(inv.expiresAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isPending ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleCopyExistingLink(inv.token, inv.id)}
                                className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition inline-flex items-center gap-1 cursor-pointer"
                                title="Copy invitation link"
                              >
                                {copiedTokenId === inv.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                <span>{copiedTokenId === inv.id ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={revokingId === inv.id}
                                onClick={() => handleRevoke(inv)}
                                className="px-2 py-1 text-[11px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium rounded transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Revoke and expire invitation link"
                              >
                                {revokingId === inv.id ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Ban size={11} />
                                )}
                                <span>Revoke</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isAccepted ? 'Registered' : isRevoked ? 'Revoked' : 'Expired'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-slate-500 pt-1">
            Note: Revoked and expired links cannot be used. Once an employee completes registration, their invite is automatically marked as used.
          </p>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
    const parsed = userSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Correct the user details.'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /api/users → { success, data: { id, name, email, accountType, isActive, createdAt }, message }
      const res = await api.post('/api/users', { ...parsed.data, accountType: 'EMPLOYEE' });
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
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Role</label>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <Badge variant="employee" label="Employee" />
          <span className="text-[11px] text-slate-400">Assigned by default</span>
        </div>
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
    const parsed = assignmentSchema.safeParse({ projectIds: Array.from(selectedProjectIds) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Select at least one project to assign.');
      return;
      const pIds = parsed.data.projectIds;
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
    const parsed = userAssignmentSchema.safeParse({ userIds: Array.from(selectedUserIds) });
    if (!selectedProjectId || !parsed.success) {
      setError(!selectedProjectId ? 'Please select a project.' : (parsed.error.issues[0]?.message || 'Select at least one employee.'));
      return;
      const uIds = parsed.data.userIds;
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

// ─── User Row (expanded assignments) ─────────────────────────────────────────

function UserAssignments({
  user,
  canAssign,
  canRemoveProject,
  allowedAssignProjectIds,
  userHasProjectInCapabilities,
  currentUserId,
  onAssigned,
  onOpenAssignModal,
}) {
  const [assignments, setAssignments] = useState(user.activeAssignments || []);
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
            type="button"
            onClick={() => onOpenAssignModal && onOpenAssignModal(user)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded transition cursor-pointer"
          >
            <Plus className="w-3 h-3 text-indigo-600" />
            Assign projects
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
  const [assigningUser, setAssigningUser] = useState(null);
  const { notify } = useNotification();
  const [statusConfirmation, setStatusConfirmation] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);



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
            <Table>
              <TableHead>
                <tr>
                  <ResizableTh
                    onClick={() => toggleSort('name')}
                    className="py-2.5 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name / Email</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('accountType')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {sortField === 'accountType' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('isActive')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {sortField === 'isActive' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  <ResizableTh
                    onClick={() => toggleSort('projects')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Projects</span>
                      {sortField === 'projects' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                      )}
                    </div>
                  </ResizableTh>
                  {(canManageUsers || canAssign) && (
                    <ResizableTh
                      className="py-2.5 px-4 text-right"
                    >
                      <span>Actions</span>
                    </ResizableTh>
                  )}
                </tr>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow
                      onClick={() => setExpandedId((prev) => (prev === user.id ? null : user.id))}
                      className="cursor-pointer"
                    >
                      {/* Name + email */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-900" title={user.name}>
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400" title={user.email}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                          label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={user.isActive ? 'active' : 'inactive'}
                          label={user.isActive ? 'Active' : 'Inactive'}
                          dot
                        />
                      </td>

                      {/* Active project count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
                    </TableRow>

                    {/* Expanded assignments */}
                    {expandedId === user.id && (
                      <TableRow hover={false} className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan={(canManageUsers || canAssign) ? 5 : 4} className="p-0">
                          <UserAssignments
                            user={user}
                            canAssign={canAssignUser(user)}
                            canRemoveProject={canRemoveProject}
                            allowedAssignProjectIds={allowedAssignProjectIds}
                            userHasProjectInCapabilities={userHasProjectInCapabilities}
                            currentUserId={currentUser?.id}
                            onOpenAssignModal={setAssigningUser}
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
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
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
