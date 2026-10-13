import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail, Key, Check, Copy, Ban, Clock, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import api from '../../../api/client.js';
import Badge from '../../../components/Badge.jsx';

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

export default function InviteUserForm({ onCancel, existingEmails = [] }) {
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

  // Filters & sorting for invitations list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const handleRevokeCustom = async () => {
    let raw = customRevokeToken.trim();
    if (raw.includes('invite=')) {
      raw = raw.split('invite=')[1].split('&')[0];
    } else if (raw.includes('token=')) {
      raw = raw.split('token=')[1].split('&')[0];
    }
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

  // Live status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = { ALL: invitations.length, PENDING: 0, ACCEPTED: 0, REVOKED: 0, EXPIRED: 0 };
    invitations.forEach((inv) => {
      if (counts[inv.status] !== undefined) {
        counts[inv.status]++;
      }
    });
    return counts;
  }, [invitations]);

  // Filtered and sorted invitations list
  const filteredInvitations = useMemo(() => {
    return invitations
      .filter((inv) => {
        if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const emailMatch = inv.email?.toLowerCase().includes(q);
          const inviterMatch =
            inv.invitedBy?.name?.toLowerCase().includes(q) ||
            inv.invitedBy?.email?.toLowerCase().includes(q);
          if (!emailMatch && !inviterMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let aVal = '';
        let bVal = '';
        if (sortField === 'email') {
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
        } else if (sortField === 'status') {
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
        } else if (sortField === 'createdAt') {
          const aTime = new Date(a.createdAt || a.expiresAt || 0).getTime();
          const bTime = new Date(b.createdAt || b.expiresAt || 0).getTime();
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [invitations, statusFilter, searchQuery, sortField, sortOrder]);

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

          {/* Table Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by email or inviter..."
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex overflow-x-auto rounded border border-slate-200 text-xs shrink-0 whitespace-nowrap bg-slate-50">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'PENDING', label: 'Active' },
                { key: 'ACCEPTED', label: 'Registered' },
                { key: 'REVOKED', label: 'Revoked' },
                { key: 'EXPIRED', label: 'Expired' },
              ].map((tab) => {
                const count = statusCounts[tab.key] || 0;
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-2.5 py-1 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Status & Reset */}
          {(searchQuery || statusFilter !== 'ALL') && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
              <span>
                Showing {filteredInvitations.length} of {invitations.length} invitation{invitations.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {loadingList && invitations.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs">Loading invitation links...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded border border-slate-200">
              No invitations have been generated yet.
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded border border-slate-200 space-y-2">
              <p>No invitations match your selected filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded font-medium hover:bg-slate-50 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 select-none">
                  <tr>
                    <th
                      onClick={() => toggleSort('email')}
                      className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Invitee Email</span>
                        {sortField === 'email' ? (
                          sortOrder === 'asc' ? <ArrowUp size={11} className="text-slate-900" /> : <ArrowDown size={11} className="text-slate-900" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('status')}
                      className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {sortField === 'status' ? (
                          sortOrder === 'asc' ? <ArrowUp size={11} className="text-slate-900" /> : <ArrowDown size={11} className="text-slate-900" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('createdAt')}
                      className="py-2 px-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Expires / Created</span>
                        {sortField === 'createdAt' ? (
                          sortOrder === 'asc' ? <ArrowUp size={11} className="text-slate-900" /> : <ArrowDown size={11} className="text-slate-900" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredInvitations.map((inv) => {
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
