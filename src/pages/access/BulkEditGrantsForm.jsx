import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Clock, FolderOpen, User, Search, Loader2, Calendar, Layers, X, AlertTriangle } from 'lucide-react';
import api from '../../api/client.js';
import { CAP_META } from './constants.js';
import { broadcastAuthSync, fmtDate, ErrorAlert, toLocalEndOfDayIso, toLocalDateString } from './helpers.jsx';

// ─── Bulk Edit Capabilities Form ─────────────────────────────────────────────

export default function BulkEditGrantsForm({
  selectedGrants = [],
  targetUser,
  users,
  projects,
  onDeselect,
  onSuccess,
  onCancel,
}) {
  // Local list of capabilities to update (allows removing items directly in modal)
  const [grantsList, setGrantsList] = useState(selectedGrants);

  useEffect(() => {
    setGrantsList(selectedGrants);
  }, [selectedGrants]);

  // Mode: 'same' = all capabilities share one expiration, 'individual' = each capability has its own date
  const [expiryMode, setExpiryMode] = useState('same');
  const [updateExpiry, setUpdateExpiry] = useState(true);

  // Pre-fill uniform date from existing grants if available
  const initialUniformDate = useMemo(() => {
    const dates = selectedGrants
      .filter((g) => g.expiresAt)
      .map((g) => toLocalDateString(g.expiresAt));
    if (dates.length > 0) return dates[0];
    return '';
  }, [selectedGrants]);

  const allInitiallyPermanent = useMemo(() => {
    return selectedGrants.length > 0 && selectedGrants.every((g) => !g.expiresAt);
  }, [selectedGrants]);

  // Uniform expiration state
  const [expiresAt, setExpiresAt] = useState(initialUniformDate);
  const [isPermanent, setIsPermanent] = useState(allInitiallyPermanent);

  // Individual map: grantId -> { expiresAt: string, isPermanent: boolean }
  const [individualExpMap, setIndividualExpMap] = useState(() => {
    const map = {};
    for (const g of selectedGrants) {
      map[g.id] = {
        expiresAt: g.expiresAt ? toLocalDateString(g.expiresAt) : '',
        isPermanent: !g.expiresAt,
      };
    }
    return map;
  });

  // Ensure any newly added or remaining grants exist in the individual map
  useEffect(() => {
    setIndividualExpMap((prev) => {
      const next = { ...prev };
      for (const g of grantsList) {
        if (!next[g.id]) {
          next[g.id] = {
            expiresAt: g.expiresAt ? toLocalDateString(g.expiresAt) : '',
            isPermanent: !g.expiresAt,
          };
        }
      }
      return next;
    });
  }, [grantsList]);

  // Scope state
  const [updateScope, setUpdateScope] = useState(false);
  const [scopeType, setScopeType] = useState('GLOBAL');
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  const [targetUserIds, setTargetUserIds] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Remove capability from this modal
  const handleRemoveGrant = (grantId) => {
    setGrantsList((prev) => prev.filter((g) => g.id !== grantId));
    if (onDeselect) {
      onDeselect(grantId);
    }
  };

  // Quick extend for uniform mode
  const addDaysToUniform = (days) => {
    const today = new Date();
    const base = expiresAt && new Date(expiresAt) > today ? new Date(expiresAt) : today;
    base.setDate(base.getDate() + days);
    setExpiresAt(toLocalDateString(base));
    setIsPermanent(false);
  };

  // Quick extend for individual item
  const addDaysToIndividual = (grantId, days) => {
    const curr = individualExpMap[grantId] || { expiresAt: '', isPermanent: false };
    const today = new Date();
    const base = curr.expiresAt && new Date(curr.expiresAt) > today ? new Date(curr.expiresAt) : today;
    base.setDate(base.getDate() + days);
    const dateStr = toLocalDateString(base);
    setIndividualExpMap((prev) => ({
      ...prev,
      [grantId]: {
        expiresAt: dateStr,
        isPermanent: false,
      },
    }));
  };

  const updateIndividualField = (grantId, field, val) => {
    setIndividualExpMap((prev) => ({
      ...prev,
      [grantId]: {
        ...(prev[grantId] || { expiresAt: '', isPermanent: false }),
        [field]: val,
      },
    }));
  };

  const toggleTargetId = (field, id) => {
    if (field === 'targetUserIds') {
      setTargetUserIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setTargetProjectIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    const active = projects.filter((p) => p.status === 'ACTIVE');
    if (!q) return active;
    return active.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    const active = users.filter((u) => u.isActive && u.id !== targetUser.id);
    if (!q) return active;
    return active.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, userSearch, targetUser.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (grantsList.length === 0) {
      setError('Please select at least one capability to update.');
      return;
    }
    if (!updateExpiry && !updateScope) {
      setError('Please choose to update expiration date, scope, or both.');
      return;
    }

    if (updateExpiry) {
      if (expiryMode === 'same') {
        if (!isPermanent && !expiresAt) {
          setError('Please select an expiry date or check permanent for all selected capabilities.');
          return;
        }
      } else {
        // Individual mode: verify each capability has a date or is permanent
        for (const g of grantsList) {
          const conf = individualExpMap[g.id];
          if (!conf?.isPermanent && !conf?.expiresAt) {
            const capLabel = CAP_META[g.capability?.code]?.label || g.capability?.code;
            setError(`Please set an expiry date or check permanent for "${capLabel}".`);
            return;
          }
        }
      }
    }

    if (updateScope && scopeType === 'USER' && targetUserIds.length === 0) {
      setError('Select at least one user for user-scoped capability.');
      return;
    }
    if (updateScope && scopeType === 'PROJECT' && targetProjectIds.length === 0) {
      setError('Select at least one project for project-scoped capability.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        grantIds: grantsList.map((g) => g.id),
      };

      if (updateExpiry) {
        if (expiryMode === 'same') {
          payload.expiresAt = isPermanent ? null : (expiresAt ? toLocalEndOfDayIso(expiresAt) : null);
        } else {
          payload.grantUpdates = grantsList.map((g) => {
            const conf = individualExpMap[g.id] || {};
            return {
              grantId: g.id,
              expiresAt: conf.isPermanent ? null : (conf.expiresAt ? toLocalEndOfDayIso(conf.expiresAt) : null),
            };
          });
        }
      }

      if (updateScope) {
        payload.scopeType = scopeType;
        payload.targetProjectIds = scopeType === 'PROJECT' ? targetProjectIds : [];
        payload.targetUserIds = scopeType === 'USER' ? targetUserIds : [];
      }

      await api.post('/api/access/grants/bulk-update', payload);
      broadcastAuthSync();
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update capabilities.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selected capabilities chip listing with removal button */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Updating <span className="font-bold text-slate-900">{grantsList.length}</span> selected capabilities for{' '}
            <span className="font-semibold text-slate-900">{targetUser.name}</span>:
          </p>
          {grantsList.length > 1 && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">Click ✕ to exclude a capability</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {grantsList.map((g) => (
            <span
              key={g.id}
              className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs group hover:border-slate-300 transition"
            >
              <Shield size={11} className="text-indigo-500 shrink-0" />
              <span className="truncate max-w-[170px]">{CAP_META[g.capability?.code]?.label || g.capability?.code}</span>
              <button
                type="button"
                onClick={() => handleRemoveGrant(g.id)}
                title={`Remove ${CAP_META[g.capability?.code]?.label || g.capability?.code} from update`}
                className="w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                ✕
              </button>
            </span>
          ))}

          {grantsList.length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 py-1">
              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
              <span>All capabilities have been excluded. Please close the modal to select capabilities.</span>
            </div>
          )}
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Expiry Update Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={updateExpiry}
              onChange={(e) => setUpdateExpiry(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" />
              Update Expiration / Extend
            </span>
          </label>

          {/* Mode Switcher: Same for All vs. Set Individually */}
          {updateExpiry && grantsList.length > 0 && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs select-none">
              <button
                type="button"
                onClick={() => setExpiryMode('same')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  expiryMode === 'same'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={12} />
                Same for All
              </button>
              <button
                type="button"
                onClick={() => setExpiryMode('individual')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  expiryMode === 'individual'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar size={12} />
                Set Individually ({grantsList.length})
              </button>
            </div>
          )}
        </div>

        {updateExpiry && grantsList.length > 0 && (
          <div className="pt-1">
            {/* ── Mode 1: Same Expiration for All ── */}
            {expiryMode === 'same' && (
              <div className="space-y-2.5 pl-2 sm:pl-6 border-l-2 border-indigo-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Quick extend:</span>
                  <button
                    type="button"
                    onClick={() => addDaysToUniform(7)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => addDaysToUniform(30)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => addDaysToUniform(90)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                  >
                    +90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => addDaysToUniform(365)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPermanent(true);
                      setExpiresAt('');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer border ${
                      isPermanent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    Set Permanent
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => {
                        setIsPermanent(e.target.checked);
                        if (e.target.checked) setExpiresAt('');
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Set to Permanent (no expiry)</span>
                  </label>
                </div>

                {!isPermanent && (
                  <div>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => {
                        setExpiresAt(e.target.value);
                        setIsPermanent(false);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This date will be applied across all {grantsList.length} selected capabilities.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Mode 2: Set Individually ── */}
            {expiryMode === 'individual' && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 mb-2">
                  Each capability's existing expiration date has been pre-fetched below. Modify dates individually or click ✕ to exclude any capability.
                </p>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50/50">
                  {grantsList.map((g) => {
                    const conf = individualExpMap[g.id] || { expiresAt: '', isPermanent: false };
                    const isExp = g.expiresAt && new Date(g.expiresAt) <= new Date();

                    return (
                      <div
                        key={g.id}
                        className="p-3 bg-white hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Capability info & current status */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900">
                              {CAP_META[g.capability?.code]?.label || g.capability?.code}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              {g.capability?.code}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="text-slate-400">Current:</span>
                            {g.expiresAt ? (
                              <span className={isExp ? 'text-amber-700 font-medium' : 'text-slate-700'}>
                                {fmtDate(g.expiresAt)} {isExp ? '(Expired)' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-medium">Permanent</span>
                            )}
                          </div>
                        </div>

                        {/* Controls for this capability */}
                        <div className="flex items-center flex-wrap gap-2 shrink-0">
                          {/* Quick buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => addDaysToIndividual(g.id, 7)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                              title="Extend 7 days from today"
                            >
                              +7d
                            </button>
                            <button
                              type="button"
                              onClick={() => addDaysToIndividual(g.id, 30)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                              title="Extend 30 days from today"
                            >
                              +30d
                            </button>
                          </div>

                          {/* Permanent toggle */}
                          <label className="inline-flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(conf.isPermanent)}
                              onChange={(e) => {
                                updateIndividualField(g.id, 'isPermanent', e.target.checked);
                                if (e.target.checked) {
                                  updateIndividualField(g.id, 'expiresAt', '');
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                            <span>Perm</span>
                          </label>

                          {/* Date input */}
                          {!conf.isPermanent && (
                            <input
                              type="date"
                              value={conf.expiresAt || ''}
                              onChange={(e) => {
                                updateIndividualField(g.id, 'expiresAt', e.target.value);
                                updateIndividualField(g.id, 'isPermanent', false);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 bg-white w-32"
                            />
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveGrant(g.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer ml-1"
                            title={`Exclude ${CAP_META[g.capability?.code]?.label || g.capability?.code}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scope Update Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={updateScope}
            onChange={(e) => setUpdateScope(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <FolderOpen size={13} className="text-blue-600" />
            Update Scope Across All Selected
          </span>
        </label>

        {updateScope && (
          <div className="space-y-3 pl-2 sm:pl-6 pt-1">
            <p className="text-[11px] text-slate-500">
              This will overwrite the scope on all {grantsList.length} selected capabilities.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScopeType('GLOBAL')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border transition cursor-pointer ${
                  scopeType === 'GLOBAL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Global (Unrestricted)
              </button>
              <button
                type="button"
                onClick={() => setScopeType('PROJECT')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1 ${
                  scopeType === 'PROJECT'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <FolderOpen size={12} />
                Project Scoped ({targetProjectIds.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeType('USER')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1 ${
                  scopeType === 'USER'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <User size={12} />
                User Scoped ({targetUserIds.length})
              </button>
            </div>

            {/* Project scope selector */}
            {scopeType === 'PROJECT' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 bg-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-2 bg-white">
                  {filteredProjects.map((p) => {
                    const isChecked = targetProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer select-none transition ${
                          isChecked ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTargetId('targetProjectIds', p.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">
                          {p.name}
                          {p.clientName && (
                            <span className="text-[10px] text-slate-400 ml-1">({p.clientName})</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No matching projects.</p>
                  )}
                </div>
              </div>
            )}

            {/* User scope selector */}
            {scopeType === 'USER' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-900 bg-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded p-2 bg-white">
                  {filteredUsers.map((u) => {
                    const isChecked = targetUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer select-none transition ${
                          isChecked ? 'bg-indigo-50/70 text-indigo-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTargetId('targetUserIds', u.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">
                          {u.name}
                          <span className="text-[10px] text-slate-400 ml-1 font-mono">{u.email}</span>
                        </span>
                      </label>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No matching users.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || grantsList.length === 0}
          className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Updating...' : `Update ${grantsList.length} Capabilities`}
        </button>
      </div>
    </form>
  );
}
