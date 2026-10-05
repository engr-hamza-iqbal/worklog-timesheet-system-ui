import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert, RefreshCw, Calendar, Trash2, Plus,
  ArrowUp, ArrowDown, ArrowUpDown, FolderOpen, Users,
  User, Clock, ChevronDown, Pencil, XCircle,
} from 'lucide-react';
import api from '../../api/client.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { CAP_META, ALL_CAP_CODES } from './constants.js';
import { broadcastAuthSync, fmtDate, ErrorAlert } from './helpers.jsx';
import GrantForm from './GrantForm.jsx';
import EditGrantForm from './EditGrantForm.jsx';
import BulkEditGrantsForm from './BulkEditGrantsForm.jsx';

// ─── User Access Panel ────────────────────────────────────────────────────────

export default function UserAccessPanel({ targetUser, users, projects, currentUserId }) {
  // GET /api/access/users/:userId/grants → { success, data: [grants], message }
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState(null);
  const [grantModal, setGrantModal] = useState(false);
  const [revokeConfirmation, setRevokeConfirmation] = useState(null);
  const [selectedGrantIds, setSelectedGrantIds] = useState(new Set());
  const [bulkRevokeConfirm, setBulkRevokeConfirm] = useState(false);
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const [expandedScopeGrantIds, setExpandedScopeGrantIds] = useState(new Set());
  const [editingGrant, setEditingGrant] = useState(null);
  const [bulkEditModal, setBulkEditModal] = useState(false);
  const { notify } = useNotification();

  const toggleScopeExpanded = (grantId) => {
    setExpandedScopeGrantIds((prev) => {
      const next = new Set(prev);
      if (next.has(grantId)) next.delete(grantId);
      else next.add(grantId);
      return next;
    });
  };

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

  useEffect(() => {
    fetchGrants();
    setSelectedGrantIds(new Set());
    setExpandedScopeGrantIds(new Set());
  }, [fetchGrants]);

  // Active grants (not revoked, not expired)
  const now = new Date();
  const activeGrants = grants.filter(
    (g) => !g.revokedAt && (!g.expiresAt || new Date(g.expiresAt) > now)
  );

  // Map capability code → active grant object
  const activeByCode = {};
  for (const g of activeGrants) {
    if (g.capability?.code) {
      activeByCode[g.capability.code] = g;
    }
  }

  // Track grants that have expired (not revoked, but expiresAt <= now)
  const expiredByCode = {};
  for (const g of grants) {
    if (!g.revokedAt && g.expiresAt && new Date(g.expiresAt) <= now) {
      const code = g.capability?.code;
      if (code && !activeByCode[code]) {
        if (!expiredByCode[code] || new Date(g.expiresAt) > new Date(expiredByCode[code].expiresAt)) {
          expiredByCode[code] = g;
        }
      }
    }
  }

  const grantedCodes = new Set(Object.keys(activeByCode));
  const isSelf = targetUser.id === currentUserId;

  // Single grant revoke
  const handleRevoke = (grantId) => {
    setRevokeConfirmation(grantId);
  };

  const confirmRevoke = async () => {
    const grantId = revokeConfirmation;
    setRevoking(grantId);
    setError('');
    try {
      await api.post(`/api/access/grants/${grantId}/revoke`);
      broadcastAuthSync();
      setGrants((prev) =>
        prev.map((g) => (g.id === grantId ? { ...g, revokedAt: new Date().toISOString() } : g))
      );
      setSelectedGrantIds((prev) => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
      setRevokeConfirmation(null);
      notify.success('Capability grant revoked.');
    } catch (err) {
      setError(err.message || 'Failed to revoke grant.');
      setRevokeConfirmation(null);
    } finally {
      setRevoking(null);
    }
  };

  // Multiple grant revoke on this user
  const confirmBulkRevoke = async () => {
    const gIds = Array.from(selectedGrantIds);
    setBulkRevoking(true);
    setError('');
    try {
      await api.post('/api/access/grants/revoke', { grantIds: gIds });
      broadcastAuthSync();
      const nowIso = new Date().toISOString();
      setGrants((prev) =>
        prev.map((g) => (gIds.includes(g.id) ? { ...g, revokedAt: nowIso } : g))
      );
      setSelectedGrantIds(new Set());
      setBulkRevokeConfirm(false);
      notify.success(`Revoked ${gIds.length} capability grant(s).`);
    } catch (err) {
      setError(err.message || 'Failed to revoke selected capabilities.');
      setBulkRevokeConfirm(false);
    } finally {
      setBulkRevoking(false);
    }
  };

  const renderScope = (grant) => {
    if (!grant) return <span className="text-slate-300">—</span>;
    const scopes = grant.scopes || [];
    if (scopes.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Global Access
        </span>
      );
    }

    const type = scopes[0].scopeType;
    const isExpanded = expandedScopeGrantIds.has(grant.id);

    if (type === 'PROJECT') {
      const projectSummary = scopes
        .map((s) => s.targetProject?.name || s.targetProjectId)
        .join(', ');

      return (
        <div className="py-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleScopeExpanded(grant.id);
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer group ${
              isExpanded
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
            title={isExpanded ? 'Collapse project list' : `Click to view project names (${projectSummary})`}
          >
            <FolderOpen size={11} className="text-blue-600" />
            <span>{scopes.length} {scopes.length === 1 ? 'Project' : 'Projects'}</span>
            <ChevronDown
              size={11}
              className={`text-blue-500 group-hover:text-blue-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="mt-1.5 flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded max-w-sm animate-fadeIn">
              {scopes.map((s) => {
                const pName = s.targetProject?.name || s.targetProjectId;
                const cName = s.targetProject?.client?.name;
                return (
                  <span
                    key={s.id || s.targetProjectId}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    title={cName ? `${pName} (${cName})` : pName}
                  >
                    <FolderOpen size={9} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{pName}</span>
                    {cName && <span className="text-[9px] text-slate-400 truncate max-w-[80px]">({cName})</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const userSummary = scopes
      .map((s) => s.targetUser?.name || s.targetUserId)
      .join(', ');

    return (
      <div className="py-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleScopeExpanded(grant.id);
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer group ${
            isExpanded
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}
          title={isExpanded ? 'Collapse user list' : `Click to view user names (${userSummary})`}
        >
          <Users size={11} className="text-emerald-600" />
          <span>{scopes.length} {scopes.length === 1 ? 'User' : 'Users'}</span>
          <ChevronDown
            size={11}
            className={`text-emerald-500 group-hover:text-emerald-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="mt-1.5 flex flex-wrap gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded max-w-sm animate-fadeIn">
            {scopes.map((s) => {
              const uName = s.targetUser?.name || s.targetUserId;
              return (
                <span
                  key={s.id || s.targetUserId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  title={s.targetUser?.email ? `${uName} (${s.targetUser.email})` : uName}
                >
                  <User size={9} className="text-slate-400 shrink-0" />
                  <span className="truncate max-w-[150px]">{uName}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getScopeSortKey = (grant) => {
    if (!grant) return '';
    const scopes = grant.scopes || [];
    if (scopes.length === 0) return 'Global';
    const type = scopes[0].scopeType;
    return `${type} ${scopes.length}`;
  };

  const [capSortField, setCapSortField] = useState('name');
  const [capSortOrder, setCapSortOrder] = useState('asc'); // 'asc' | 'desc'

  const toggleCapSort = (field) => {
    if (capSortField === field) {
      setCapSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setCapSortField(field);
      setCapSortOrder('asc');
    }
  };

  const sortedCapCodes = useMemo(() => {
    return [...ALL_CAP_CODES].sort((codeA, codeB) => {
      let cmp = 0;
      const grantA = activeByCode[codeA] || expiredByCode[codeA];
      const grantB = activeByCode[codeB] || expiredByCode[codeB];
      if (capSortField === 'name') {
        cmp = (CAP_META[codeA]?.label || '').localeCompare(CAP_META[codeB]?.label || '');
      } else if (capSortField === 'scope') {
        const scopeA = getScopeSortKey(grantA);
        const scopeB = getScopeSortKey(grantB);
        cmp = scopeA.localeCompare(scopeB);
      } else if (capSortField === 'grantedBy') {
        const gA = grantA?.grantedBy?.name || '';
        const gB = grantB?.grantedBy?.name || '';
        cmp = gA.localeCompare(gB);
      } else if (capSortField === 'status') {
        const isA = activeByCode[codeA] ? 2 : (expiredByCode[codeA] ? 1 : 0);
        const isB = activeByCode[codeB] ? 2 : (expiredByCode[codeB] ? 1 : 0);
        cmp = isA - isB;
      }
      return capSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [activeByCode, expiredByCode, capSortField, capSortOrder]);

  return (
    <div>
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {isSelf && (
        <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Self-Action Prohibited:</strong> You cannot grant, modify, or revoke capability grants on your own account.
          </span>
        </div>
      )}

      {/* Multiple capabilities revoke action bar */}
      {selectedGrantIds.size > 0 && !isSelf && (
        <div className="bg-red-50/90 border border-red-200 px-4 py-2.5 rounded-lg flex items-center justify-between gap-3 mt-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-red-900 font-medium">
            <ShieldAlert size={15} className="text-red-600 shrink-0" />
            <span>
              <strong>{selectedGrantIds.size}</strong> capability grant{selectedGrantIds.size === 1 ? '' : 's'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedGrantIds(new Set())}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Extend / Edit ({selectedGrantIds.size})
            </button>
            <button
              type="button"
              onClick={() => setBulkRevokeConfirm(true)}
              disabled={bulkRevoking}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition cursor-pointer disabled:opacity-50"
            >
              {bulkRevoking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 size={12} />}
              Revoke Selected ({selectedGrantIds.size})
            </button>
          </div>
        </div>
      )}

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
            <table className="w-full text-xs text-left min-w-[620px]">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                <tr>
                  {!isSelf && (
                    <th className="py-2.5 px-3 w-8">
                      {(Object.keys(activeByCode).length > 0 || Object.keys(expiredByCode).length > 0) && (
                        <input
                          type="checkbox"
                          checked={selectedGrantIds.size > 0 && selectedGrantIds.size === (Object.keys(activeByCode).length + Object.keys(expiredByCode).length)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = [
                                ...Object.values(activeByCode).map((g) => g.id),
                                ...Object.values(expiredByCode).map((g) => g.id),
                              ];
                              setSelectedGrantIds(new Set(allIds));
                            } else {
                              setSelectedGrantIds(new Set());
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select all active and expired grants"
                        />
                      )}
                    </th>
                  )}
                  <th
                    onClick={() => toggleCapSort('name')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capability</span>
                      {capSortField === 'name' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleCapSort('scope')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Scope</span>
                      {capSortField === 'scope' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleCapSort('grantedBy')}
                    className="py-2.5 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Granted by</span>
                      {capSortField === 'grantedBy' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Expires</th>
                  <th
                    onClick={() => toggleCapSort('status')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {capSortField === 'status' ? (
                        capSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600" /> : <ArrowDown size={11} className="text-indigo-600" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  {!isSelf && (
                    <th className="py-2.5 px-4 text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCapCodes.map((code) => {
                  const activeGrant = activeByCode[code];
                  const expiredGrant = expiredByCode[code];
                  const grant = activeGrant || expiredGrant;
                  const isGranted = !!activeGrant;
                  const isExpired = !activeGrant && !!expiredGrant;

                  return (
                    <tr key={code} className="hover:bg-slate-50/50 transition">
                      {!isSelf && (
                        <td className="py-3 px-3 w-8">
                          {grant ? (
                            <input
                              type="checkbox"
                              checked={selectedGrantIds.has(grant.id)}
                              onChange={() => {
                                setSelectedGrantIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(grant.id)) next.delete(grant.id);
                                  else next.add(grant.id);
                                  return next;
                                });
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          ) : null}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{CAP_META[code].label}</div>
                        <div className="text-[10px] font-mono text-slate-400">{code}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {renderScope(grant)}
                      </td>

                      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
                        {grant && grant.grantedBy
                          ? <span className="truncate max-w-[100px] block">{grant.grantedBy.name}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-medium" title={grant.expiresAt}>
                            <Clock className="w-3 h-3 text-amber-600" />Expired ({fmtDate(grant.expiresAt)})
                          </span>
                        ) : isGranted && grant.expiresAt ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-[11px]">
                            <Clock className="w-3 h-3" />{fmtDate(grant.expiresAt)}
                          </span>
                        ) : isGranted ? (
                          <span className="text-slate-400 text-[11px]">Never</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isGranted ? (
                          <Badge variant="granted" label="Granted" dot />
                        ) : isExpired ? (
                          <Badge variant="expired" label="Expired" dot />
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            Not granted
                          </span>
                        )}
                      </td>

                      {!isSelf && (
                        <td className="py-3 px-4 text-right">
                          {isGranted ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingGrant(grant)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                title="Edit capability scope or extend expiry date"
                              >
                                <Pencil className="w-3 h-3 text-slate-500" />
                                Edit
                              </button>
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
                            </div>
                          ) : isExpired ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingGrant(grant)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition cursor-pointer"
                                title="Renew or extend expired capability"
                              >
                                <RefreshCw className="w-3 h-3 text-amber-700" />
                                Extend
                              </button>
                              <button
                                onClick={() => handleRevoke(grant.id)}
                                disabled={!!revoking}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50"
                                title="Revoke / remove expired grant"
                              >
                                {revoking === grant.id
                                  ? <RefreshCw className="w-3 h-3 animate-spin" />
                                  : <XCircle className="w-3 h-3" />}
                                Clear
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}
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

      {/* Single revoke confirmation */}
      <ConfirmDialog
        isOpen={Boolean(revokeConfirmation)}
        onClose={() => (revoking ? null : setRevokeConfirmation(null))}
        onConfirm={confirmRevoke}
        title="Revoke capability"
        message="Revoke this capability immediately? The user will lose this access right away."
        confirmLabel="Revoke"
        tone="danger"
        loading={Boolean(revoking)}
      />

      {/* Bulk revoke confirmation */}
      <ConfirmDialog
        isOpen={bulkRevokeConfirm}
        onClose={() => (bulkRevoking ? null : setBulkRevokeConfirm(false))}
        onConfirm={confirmBulkRevoke}
        title={`Revoke ${selectedGrantIds.size} Capabilities`}
        message={`Are you sure you want to revoke the ${selectedGrantIds.size} selected capabilities from ${targetUser.name}? They will lose these permissions immediately.`}
        confirmLabel={`Revoke ${selectedGrantIds.size} Capabilities`}
        tone="danger"
        loading={bulkRevoking}
      />

      {/* Edit capability modal */}
      <Modal
        isOpen={Boolean(editingGrant)}
        onClose={() => setEditingGrant(null)}
        title={editingGrant ? `Edit Capability — ${CAP_META[editingGrant.capability?.code]?.label || editingGrant.capability?.code}` : 'Edit Capability'}
        size="lg"
      >
        {editingGrant && (
          <EditGrantForm
            grant={editingGrant}
            targetUser={targetUser}
            users={users}
            projects={projects}
            onSuccess={() => {
              setEditingGrant(null);
              fetchGrants();
              notify.success('Capability grant updated successfully.');
            }}
            onCancel={() => setEditingGrant(null)}
          />
        )}
      </Modal>

      {/* Bulk edit capabilities modal */}
      <Modal
        isOpen={bulkEditModal}
        onClose={() => setBulkEditModal(false)}
        title={`Edit ${selectedGrantIds.size} Capabilities — ${targetUser.name}`}
        size="lg"
      >
        <BulkEditGrantsForm
          selectedGrants={activeGrants.filter((g) => selectedGrantIds.has(g.id))}
          targetUser={targetUser}
          users={users}
          projects={projects}
          onSuccess={() => {
            setBulkEditModal(false);
            setSelectedGrantIds(new Set());
            fetchGrants();
            notify.success('Selected capabilities updated successfully.');
          }}
          onCancel={() => setBulkEditModal(false)}
        />
      </Modal>
    </div>
  );
}
