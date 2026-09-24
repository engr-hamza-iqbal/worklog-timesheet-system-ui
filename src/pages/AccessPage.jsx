import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, XCircle, Plus, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, Clock, CheckCircle,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// ─── Capability metadata ───────────────────────────────────────────────────────

const CAP_META = {
  VIEW_OTHER_RECORDS:      { label: 'View Other Records',         desc: "Read work logs and timesheets of other staff members." },
  REVIEW_TIME:             { label: 'Review Time',                desc: "Approve or return submitted time entries (within scope)." },
  DECIDE_TIME_OFF:         { label: 'Decide Time Off',            desc: "Approve or decline employee time-off requests (within scope)." },
  MANAGE_CLIENTS_PROJECTS: { label: 'Manage Clients & Projects',  desc: "Create and configure clients, projects, and billing rates." },
  ASSIGN_PROJECTS:         { label: 'Assign Projects',            desc: "Assign and remove employees on client projects." },
  MANAGE_USERS:            { label: 'Manage Users',               desc: "Create and manage user accounts." },
  VIEW_REPORTS:            { label: 'View Reports',               desc: "Access cross-project summary reports and CSV exports." },
  VIEW_ANALYTICS:          { label: 'View Analytics',             desc: "View utilization rates and billable hours distribution." },
  VIEW_BILLING:            { label: 'View Billing',               desc: "Access sensitive billing rate figures and monetary totals." },
};

const ALL_CAP_CODES = Object.keys(CAP_META);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">✕</button>}
    </div>
  );
}

// ─── Grant Capability Form ────────────────────────────────────────────────────

function GrantForm({ targetUser, grantedCodes, users, projects, onSuccess, onCancel }) {
  const availableCodes = ALL_CAP_CODES.filter((c) => !grantedCodes.has(c));

  const [form, setForm] = useState({
    capabilityCode: availableCodes[0] || '',
    scopeType: 'GLOBAL',
    expiresAt: '',
    targetUserIds: [],
    targetProjectIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleId = (field, id) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((x) => x !== id) : [...prev[field], id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.capabilityCode) { setError('Select a capability.'); return; }
    if (form.scopeType === 'USER' && form.targetUserIds.length === 0) {
      setError('Select at least one target user for a user-scoped grant.'); return;
    }
    if (form.scopeType === 'PROJECT' && form.targetProjectIds.length === 0) {
      setError('Select at least one project for a project-scoped grant.'); return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /api/access/grants
      // Body: { userId, capabilityCode, expiresAt?, scopeType?, targetUserIds?, targetProjectIds? }
      // Response: { success, data: { id, userId, capabilityId, grantedById, expiresAt, ... }, message }
      await api.post('/api/access/grants', {
        userId: targetUser.id,
        capabilityCode: form.capabilityCode,
        expiresAt: form.expiresAt || undefined,
        scopeType: form.scopeType === 'GLOBAL' ? undefined : form.scopeType,
        targetUserIds: form.scopeType === 'USER' ? form.targetUserIds : undefined,
        targetProjectIds: form.scopeType === 'PROJECT' ? form.targetProjectIds : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to grant capability.');
    } finally {
      setLoading(false);
    }
  };

  if (availableCodes.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-slate-500">
        All capabilities are already granted to this user.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500">
        Granting capability to <span className="font-medium text-slate-900">{targetUser.name}</span>.
      </p>
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Capability */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Capability</label>
        <select value={form.capabilityCode} onChange={set('capabilityCode')}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white transition" required>
          {availableCodes.map((code) => (
            <option key={code} value={code}>{CAP_META[code]?.label || code}</option>
          ))}
        </select>
        {form.capabilityCode && CAP_META[form.capabilityCode] && (
          <p className="mt-1 text-[11px] text-slate-400">{CAP_META[form.capabilityCode].desc}</p>
        )}
      </div>

      {/* Scope */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Scope</label>
        <div className="flex gap-2">
          {['GLOBAL', 'USER', 'PROJECT'].map((s) => (
            <button key={s} type="button"
              onClick={() => setForm((prev) => ({ ...prev, scopeType: s, targetUserIds: [], targetProjectIds: [] }))}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                form.scopeType === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s === 'GLOBAL' ? 'Global' : s === 'USER' ? 'User' : 'Project'}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {form.scopeType === 'GLOBAL' ? 'Applies to all users and projects.'
            : form.scopeType === 'USER' ? 'Restricted to specific users only.'
            : 'Restricted to specific projects only.'}
        </p>
      </div>

      {/* User scope picker */}
      {form.scopeType === 'USER' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target users</label>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {users.filter((u) => u.id !== targetUser.id && u.isActive).map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={form.targetUserIds.includes(u.id)}
                  onChange={() => toggleId('targetUserIds', u.id)} className="rounded border-slate-300" />
                <span className="text-xs text-slate-700">{u.name}</span>
                <span className="text-[11px] text-slate-400 ml-auto truncate">{u.email}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Project scope picker */}
      {form.scopeType === 'PROJECT' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Target projects</label>
          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {projects.filter((p) => p.status === 'ACTIVE').map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={form.targetProjectIds.includes(p.id)}
                  onChange={() => toggleId('targetProjectIds', p.id)} className="rounded border-slate-300" />
                <span className="text-xs text-slate-700">{p.name}</span>
                {/* clientName from getProjects service */}
                <span className="text-[11px] text-slate-400 ml-auto truncate">{p.clientName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Expiry */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Expiry date <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input type="date" value={form.expiresAt} onChange={set('expiresAt')}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Granting...' : 'Grant capability'}
        </button>
      </div>
    </form>
  );
}

// ─── User Access Panel ────────────────────────────────────────────────────────

function UserAccessPanel({ targetUser, users, projects, currentUserId }) {
  // GET /api/access/users/:userId/grants → { success, data: [grants], message }
  // Each grant: { id, userId, capabilityId, grantedById, expiresAt, revokedAt, createdAt,
  //               capability: { id, code, description },
  //               grantedBy: { id, name, email },
  //               scopes: [{ id, grantId, scopeType, targetUserId, targetProjectId,
  //                          targetUser: {id, name}, targetProject: {id, name} }] }
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState(null);
  const [grantModal, setGrantModal] = useState(false);
  const [revokeConfirmation, setRevokeConfirmation] = useState(null);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/access/users/${targetUser.id}/grants`);
      const list = Array.isArray(res.data) ? res.data : [];
      setGrants(list);
    } catch (err) {
      setError(err.message || 'Failed to load grants.');
    } finally {
      setLoading(false);
    }
  }, [targetUser.id]);

  useEffect(() => { fetchGrants(); }, [fetchGrants]);

  // Only grants that are currently active (not revoked, not expired)
  const now = new Date();
  const activeGrants = grants.filter(
    (g) => !g.revokedAt && (!g.expiresAt || new Date(g.expiresAt) > now)
  );

  // Map capability code → grant object for easy lookup
  const activeByCode = {};
  for (const g of activeGrants) {
    if (g.capability?.code) {
      activeByCode[g.capability.code] = g;
    }
  }

  const grantedCodes = new Set(Object.keys(activeByCode));
  const isSelf = targetUser.id === currentUserId;

  // POST /api/access/grants/:grantId/revoke → { success, data: {...}, message }
  const handleRevoke = (grantId) => {
    setRevokeConfirmation(grantId);
  };

  const confirmRevoke = async () => {
    const grantId = revokeConfirmation;
    setRevokeConfirmation(null);
    setRevoking(grantId);
    setError('');
    try {
      await api.post(`/api/access/grants/${grantId}/revoke`);
      // Optimistically update — remove from activeGrants by marking revokedAt
      setGrants((prev) =>
        prev.map((g) => g.id === grantId ? { ...g, revokedAt: new Date().toISOString() } : g)
      );
    } catch (err) {
      setError(err.message || 'Failed to revoke grant.');
    } finally {
      setRevoking(null);
    }
  };

  const getScopeLabel = (grant) => {
    const scopes = grant.scopes || [];
    if (scopes.length === 0) return 'Global';
    const type = scopes[0].scopeType;
    return type === 'USER'
      ? `${scopes.length} user${scopes.length > 1 ? 's' : ''}`
      : `${scopes.length} project${scopes.length > 1 ? 's' : ''}`;
  };

  return (
    <div>
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mt-2">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capabilities</span>
          {!isSelf && grantedCodes.size < ALL_CAP_CODES.length && (
            <button
              onClick={() => setGrantModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />Grant
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Capability</th>
                  <th className="py-2.5 px-4">Scope</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Granted by</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Expires</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_CAP_CODES.map((code) => {
                  const grant = activeByCode[code];
                  const isGranted = !!grant;

                  return (
                    <tr key={code} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{CAP_META[code].label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{code}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {isGranted
                          ? getScopeLabel(grant)
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                        {isGranted && grant.grantedBy
                          ? <span className="truncate max-w-[100px] block">{grant.grantedBy.name}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell">
                        {isGranted && grant.expiresAt ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px]">
                            <Clock className="w-3 h-3" />{fmtDate(grant.expiresAt)}
                          </span>
                        ) : isGranted ? (
                          <span className="text-slate-400 text-[11px]">Never</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isGranted ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="granted" label="Granted" dot />
                            {!isSelf && (
                              <button
                                onClick={() => handleRevoke(grant.id)}
                                disabled={!!revoking}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded transition cursor-pointer disabled:opacity-50"
                              >
                                {revoking === grant.id
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <XCircle className="w-3 h-3" />}
                                Revoke
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            Not granted
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
      </div>

      {/* Grant modal */}
      <Modal
        isOpen={grantModal}
        onClose={() => setGrantModal(false)}
        title={`Grant Capability — ${targetUser.name}`}
        size="lg"
      >
        <GrantForm
          targetUser={targetUser}
          grantedCodes={grantedCodes}
          users={users}
          projects={projects}
          onSuccess={() => { setGrantModal(false); fetchGrants(); }}
          onCancel={() => setGrantModal(false)}
        />
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(revokeConfirmation)}
        onClose={() => setRevokeConfirmation(null)}
        onConfirm={confirmRevoke}
        title="Revoke capability"
        message="Revoke this capability immediately? The user will lose this access right away."
        confirmLabel="Revoke"
        tone="danger"
      />
    </div>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function AuditLog() {
  // GET /api/access/audit-logs?limit=20 → { success, data: { logs: [...], total: N }, message }
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get('/api/access/audit-logs?limit=20&offset=0')
      .then((res) => {
        // res.data = { logs: [...], total } because the service returns { logs, total }
        // and the HTTP layer wraps it in { success, data: { logs, total }, message }
        const data = res.data;
        if (data && Array.isArray(data.logs)) {
          setLogs(data.logs);
          setTotal(data.total || data.logs.length);
        } else if (Array.isArray(data)) {
          // Fallback if shape differs
          setLogs(data);
          setTotal(data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ACTION_COLORS = {
    GRANT:         'text-emerald-700 bg-emerald-50',
    REVOKE:        'text-red-700 bg-red-50',
    CHANGE_SCOPE:  'text-blue-700 bg-blue-50',
    CHANGE_EXPIRY: 'text-amber-700 bg-amber-50',
  };

  const visible = expanded ? logs : logs.slice(0, 6);

  return (
    <div className="mt-8 bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Audit Log</span>
        <span className="text-[11px] text-slate-400">{total} events</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<Shield className="w-7 h-7" />} title="No audit events yet." />
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2 px-5">Action</th>
                  <th className="py-2 px-4">Capability</th>
                  <th className="py-2 px-4 hidden sm:table-cell">Actor</th>
                  <th className="py-2 px-4 hidden sm:table-cell">Target</th>
                  <th className="py-2 px-4">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[log.action] || 'text-slate-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                      {log.capabilityCode}
                    </td>
                    {/* actor and targetUser from getAccessAuditLogs include */}
                    <td className="py-2.5 px-4 text-slate-600 hidden sm:table-cell">
                      {log.actor?.name || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 hidden sm:table-cell">
                      {log.targetUser?.name || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length > 6 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-center gap-1 border-t border-slate-100"
            >
              {expanded
                ? <><ChevronUp className="w-3.5 h-3.5" />Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" />Show all {logs.length} entries</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccessPage() {
  const { user: currentUser } = useAuth();

  // GET /api/users → { success, data: [...users], message }
  // GET /api/projects → { success, data: [...projects], message }  projects have clientName
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Access Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Grant, scope, and revoke individual capabilities per employee. Effects are immediate.
          </p>
        </div>
        <button type="button" onClick={() => fetchAccessData(false)} disabled={refreshing} title="Refresh access data" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {refreshing && <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none"><div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-md"><RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />Refreshing access data</div></div>}

      <div className="mt-6 flex flex-col xl:flex-row gap-6">
        {/* ── Left: User list ── */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden lg:sticky lg:top-20">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter users..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              />
            </div>
            <ul className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto">
              {filteredUsers.map((user) => (
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

          <AuditLog />
        </div>
      </div>
    </main>
  );
}
