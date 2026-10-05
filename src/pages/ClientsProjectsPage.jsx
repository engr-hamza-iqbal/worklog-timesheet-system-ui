import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, FolderOpen, Plus, Pencil, CheckCircle, XCircle,
  ChevronRight, DollarSign, RefreshCw, AlertCircle, Users, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';
import useTableResize from '../hooks/useTableResize.js';
import ResizableTh from '../components/ResizableTh.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InputField({ ...props }) {
  return (
    <input
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
      {...props}
    />
  );
}

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  );
}

// ─── Client Form ──────────────────────────────────────────────────────────────

function ClientForm({ client, onSuccess, onCancel }) {
  const [name, setName] = useState(client?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Client name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      if (client) {
        // PUT /api/clients/:id  → { success, data: { id, name, isActive, ... }, message }
        const res = await api.put(`/api/clients/${client.id}`, { name: name.trim() });
        onSuccess(res.data);
      } else {
        // POST /api/clients → { success, data: { id, name, isActive, ... }, message }
        const res = await api.post('/api/clients', { name: name.trim() });
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <FormField label="Client name">
        <InputField
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          autoFocus
        />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Saving...' : client ? 'Save changes' : 'Create client'}
        </button>
      </div>
    </form>
  );
}

// ─── Project Form ─────────────────────────────────────────────────────────────

function ProjectForm({ clients, canViewBilling = true, onSuccess, onCancel }) {
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!clientId) { setError('Please select a client.'); return; }
    const rateNum = canViewBilling ? parseFloat(rate) : 0;
    if (canViewBilling && (!rate || isNaN(rateNum) || rateNum < 0)) {
      setError('Enter a valid billing rate (e.g. 75.00).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // POST /api/projects → { success, data: { id, name, clientId, status, ... }, message }
      const res = await api.post('/api/projects', {
        clientId,
        name: name.trim(),
        initialRatePerHour: rateNum,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <FormField label="Client">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white transition"
          required
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Project name">
        <InputField type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Redesign" required />
      </FormField>
      {canViewBilling && (
        <FormField label="Initial billing rate (per hour)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number" min="0" step="0.01" value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="75.00"
              className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              required
            />
          </div>
        </FormField>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </form>
  );
}

// ─── Add Rate Form ────────────────────────────────────────────────────────────

function AddRateForm({ projectId, onSuccess, onCancel }) {
  const [rate, setRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rateNum = parseFloat(rate);
    if (!rate || isNaN(rateNum) || rateNum <= 0) { setError('Enter a valid rate greater than 0.'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /api/projects/:id/rates → { success, data: { id, projectId, ratePerHour, effectiveFrom, ... }, message }
      await api.post(`/api/projects/${projectId}/rates`, {
        ratePerHour: rateNum,
        effectiveFrom,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to add rate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <FormField label="New rate per hour">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number" min="0.01" step="0.01" value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="90.00"
            className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
            required autoFocus
          />
        </div>
      </FormField>
      <FormField label="Effective from">
        <InputField type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Saving...' : 'Add rate'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsProjectsPage() {
  const { isAdmin, capabilities } = useAuth();
  const canManage = isAdmin || !!capabilities['MANAGE_CLIENTS_PROJECTS'];
  const canViewBilling = isAdmin || !!capabilities['VIEW_BILLING'];

  const manageCap = capabilities?.['MANAGE_CLIENTS_PROJECTS'];
  const isManageGlobal = isAdmin || manageCap?.isGlobal;
  const allowedProjectIds = useMemo(() => {
    if (isManageGlobal) return null;
    return manageCap?.allowedProjectIds || [];
  }, [isManageGlobal, manageCap]);

  const canCreateClient = isAdmin || isManageGlobal;
  const canManageClient = (client) => {
    if (!canManage || !client) return false;
    if (isManageGlobal) return true;
    if (allowedProjectIds) {
      return projects.some((p) => p.clientId === client.id && allowedProjectIds.includes(p.id)) ||
             client._count?.projects > 0;
    }
    return false;
  };
  const canManageProject = (project) => {
    if (!canManage || !project) return false;
    if (isManageGlobal) return true;
    if (allowedProjectIds) {
      return allowedProjectIds.includes(project.id);
    }
    return false;
  };

  const [clients, setClients] = useState([]);
  // projects shape from service: { id, name, clientId, clientName, status, currentRate, assignedEmployees: [], totalTimeEntries }
  const [projects, setProjects] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // null | 'newClient' | 'editClient' | 'newProject' | 'addRate'
  const [editingClient, setEditingClient] = useState(null);
  const [rateProjectId, setRateProjectId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [projectPage, setProjectPage] = useState(1);
  const PROJECTS_PER_PAGE = 10;

  // Resizable columns for projects table
  const { columnWidths, startResize } = useTableResize({
    name: 200,
    status: 120,
    currentRate: 120,
    team: 100,
    actions: 140,
  });

  // GET /api/clients → { success, data: [ { id, name, isActive, _count: { projects } } ], message }
  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/api/clients');
      // res = { success, data: [...], message } because interceptor returns response.data
      const list = Array.isArray(res.data) ? res.data : [];
      setClients(list);
      // Auto-select first client if none selected or previous selection no longer exists
      if (list.length > 0) {
        if (!selectedClientId || !list.some((c) => c.id === selectedClientId)) {
          setSelectedClientId(list[0].id);
        }
      } else {
        setSelectedClientId(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load clients.');
    }
  }, [selectedClientId]);

  // GET /api/projects?clientId=xxx → { success, data: [{ id, name, clientId, clientName, status, currentRate, assignedEmployees, totalTimeEntries }], message }
  const fetchProjects = useCallback(async (clientId) => {
    if (!clientId) return;
    setProjectsLoading(true);
    try {
      const res = await api.get(`/api/projects?clientId=${clientId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchClients().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      setProjectPage(1);
      fetchProjects(selectedClientId);
    }
  }, [selectedClientId]);

  const [projectSortField, setProjectSortField] = useState('name');
  const [projectSortOrder, setProjectSortOrder] = useState('asc'); // 'asc' | 'desc'

  const toggleProjectSort = (field) => {
    if (projectSortField === field) {
      setProjectSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setProjectSortField(field);
      setProjectSortOrder(field === 'currentRate' || field === 'team' ? 'desc' : 'asc');
    }
    setProjectPage(1);
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let cmp = 0;
      if (projectSortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (projectSortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      } else if (projectSortField === 'currentRate') {
        cmp = (Number(a.currentRate) || 0) - (Number(b.currentRate) || 0);
      } else if (projectSortField === 'team') {
        cmp = (a.assignedEmployees?.length || 0) - (b.assignedEmployees?.length || 0);
      }
      return projectSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [projects, projectSortField, projectSortOrder]);

  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * PROJECTS_PER_PAGE;
    return sortedProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [sortedProjects, projectPage]);

  const refreshPage = async () => {
    setRefreshing(true);
    try {
      await fetchClients();
      if (selectedClientId) await fetchProjects(selectedClientId);
    } finally {
      setRefreshing(false);
    }
  };

  // Archive / restore a client
  const handleClientArchive = (client) => {
    setConfirmation({
      title: client.isActive ? 'Archive client' : 'Restore client',
      message: client.isActive
        ? `Archive ${client.name}? Its projects will remain available for history but should not receive new work.`
        : `Restore ${client.name}? This will make the client active again.`,
      confirmLabel: client.isActive ? 'Archive client' : 'Restore client',
      tone: client.isActive ? 'danger' : 'primary',
      onConfirm: () => updateClientStatus(client),
    });
  };

  const updateClientStatus = async (client) => {
    setConfirmation(null);
    try {
      const res = await api.put(`/api/clients/${client.id}`, { isActive: !client.isActive });
      // res.data = updated client object
      setClients((prev) => prev.map((c) => c.id === res.data.id ? res.data : c));
    } catch (err) {
      setError(err.message || 'Failed to update client.');
    }
  };

  // Toggle project ACTIVE ↔ CLOSED
  // PATCH /api/projects/:id/status → { success, data: { id, status, ... }, message }
  const handleProjectStatusToggle = (project) => {
    const newStatus = project.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    setConfirmation({
      title: newStatus === 'CLOSED' ? 'Close project' : 'Reopen project',
      message: newStatus === 'CLOSED'
        ? `Close ${project.name}? Employees will no longer be able to log new time against it.`
        : `Reopen ${project.name}? New time entries will be allowed again.`,
      confirmLabel: newStatus === 'CLOSED' ? 'Close project' : 'Reopen project',
      tone: newStatus === 'CLOSED' ? 'danger' : 'primary',
      onConfirm: () => updateProjectStatus(project, newStatus),
    });
  };

  const updateProjectStatus = async (project, newStatus) => {
    setConfirmation(null);
    try {
      await api.patch(`/api/projects/${project.id}/status`, { status: newStatus });
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, status: newStatus } : p));
    } catch (err) {
      setError(err.message || 'Failed to update project status.');
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (loading) {
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
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Clients &amp; Projects</h1>
          <p className="text-xs text-slate-500 mt-1">Manage clients, projects, and billing rates.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button type="button" onClick={refreshPage} disabled={refreshing} title="Refresh clients and projects" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </button>
            {canCreateClient && (
              <button
                onClick={() => setModal('newClient')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />New Client
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="mt-6 flex flex-col md:flex-row gap-6">
        {/* ── Left: Client list ── */}
        <div className="w-full md:w-60 lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</span>
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{clients.length}</span>
            </div>

            {clients.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-8 h-8" />}
                title="No clients yet"
                message="Create your first client to get started."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <li key={client.id}>
                    <button
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition ${
                        selectedClientId === client.id
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className={`w-3.5 h-3.5 shrink-0 ${selectedClientId === client.id ? 'text-slate-300' : 'text-slate-400'}`} />
                        <span className="text-xs font-medium truncate">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {!client.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Archived</span>
                        )}
                        <ChevronRight className={`w-3 h-3 ${selectedClientId === client.id ? 'text-slate-300' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right: Projects panel ── */}
        <div className="flex-1 min-w-0">
          {!selectedClient ? (
            <div className="bg-white rounded-lg border border-slate-200 h-48 flex items-center justify-center">
              <p className="text-sm text-slate-400">Select a client to view its projects.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Panel header */}
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-slate-900">{selectedClient.name}</h2>
                    <Badge variant={selectedClient.isActive ? 'active' : 'inactive'} dot />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {canManageClient(selectedClient) && (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingClient(selectedClient); setModal('editClient'); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    <button
                      onClick={() => handleClientArchive(selectedClient)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                    >
                      {selectedClient.isActive ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {selectedClient.isActive ? 'Archive' : 'Restore'}
                    </button>
                    <button
                      onClick={() => setModal('newProject')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />New Project
                    </button>
                  </div>
                )}
              </div>

              {/* Projects table */}
              {projectsLoading ? (
                <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <EmptyState
                  icon={<FolderOpen className="w-8 h-8" />}
                  title="No projects"
                  message="This client has no projects yet."
                  action={
                    canManage && (
                      <button
                        onClick={() => setModal('newProject')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />New Project
                      </button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px] table-fixed">
                      <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
                        <tr>
                          <ResizableTh
                            width={columnWidths.name}
                            onResizeStart={(e) => startResize('name', e)}
                            onClick={() => toggleProjectSort('name')}
                            className="py-2.5 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">Project</span>
                              {projectSortField === 'name' ? (
                                projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                              )}
                            </div>
                          </ResizableTh>
                          <ResizableTh
                            width={columnWidths.status}
                            onResizeStart={(e) => startResize('status', e)}
                            onClick={() => toggleProjectSort('status')}
                            className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">Status</span>
                              {projectSortField === 'status' ? (
                                projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                              )}
                            </div>
                          </ResizableTh>
                          {canViewBilling && (
                            <ResizableTh
                              width={columnWidths.currentRate}
                              onResizeStart={(e) => startResize('currentRate', e)}
                              onClick={() => toggleProjectSort('currentRate')}
                              className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">Rate / hr</span>
                                {projectSortField === 'currentRate' ? (
                                  projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                                ) : (
                                  <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                                )}
                              </div>
                            </ResizableTh>
                          )}
                          <ResizableTh
                            width={columnWidths.team}
                            onResizeStart={(e) => startResize('team', e)}
                            onClick={() => toggleProjectSort('team')}
                            className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">Team</span>
                              {projectSortField === 'team' ? (
                                projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                              ) : (
                                <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                              )}
                            </div>
                          </ResizableTh>
                          {canManage && (
                            <ResizableTh
                              width={columnWidths.actions}
                              resizable={false}
                              className="py-2.5 px-4 text-right"
                            >
                              <span className="truncate">Actions</span>
                            </ResizableTh>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedProjects.map((project) => (
                          <tr key={project.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-5 truncate whitespace-nowrap overflow-hidden">
                              <div className="font-medium text-slate-900 truncate" title={project.name}>{project.name}</div>
                            </td>
                            <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden">
                              <Badge
                                variant={project.status === 'ACTIVE' ? 'active' : 'closed'}
                                label={project.status === 'ACTIVE' ? 'Active' : 'Closed'}
                                dot
                              />
                            </td>
                            {canViewBilling && (
                              <td className="py-3 px-4 text-slate-700 truncate whitespace-nowrap overflow-hidden">
                                {project.currentRate != null
                                  ? <span className="font-medium">${Number(project.currentRate).toFixed(2)}</span>
                                  : <span className="text-slate-400">—</span>}
                              </td>
                            )}
                            <td className="py-3 px-4 truncate whitespace-nowrap overflow-hidden">
                              {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-slate-600">
                                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{project.assignedEmployees.length}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            {canManage && (
                              <td className="py-3 px-4 text-right truncate whitespace-nowrap overflow-hidden">
                                {canManageProject(project) ? (
                                  <div className="flex items-center gap-1.5 justify-end truncate">
                                    {canViewBilling && (
                                      <button
                                        onClick={() => { setRateProjectId(project.id); setModal('addRate'); }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                      >
                                        <DollarSign className="w-3 h-3" />Rate
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleProjectStatusToggle(project)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                    >
                                      {project.status === 'ACTIVE'
                                        ? <><XCircle className="w-3 h-3" />Close</>
                                        : <><CheckCircle className="w-3 h-3" />Reopen</>}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">View only</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={projectPage}
                    totalItems={projects.length}
                    itemsPerPage={PROJECTS_PER_PAGE}
                    onPageChange={setProjectPage}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal isOpen={modal === 'newClient'} onClose={() => setModal(null)} title="New Client" size="sm">
        <ClientForm
          onSuccess={(client) => {
            setClients((prev) => [...prev, client]);
            setSelectedClientId(client.id);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal isOpen={modal === 'editClient'} onClose={() => setModal(null)} title="Edit Client" size="sm">
        <ClientForm
          client={editingClient}
          onSuccess={(updated) => {
            setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal isOpen={modal === 'newProject'} onClose={() => setModal(null)} title="New Project">
        <ProjectForm
          clients={clients.filter((c) => c.isActive)}
          canViewBilling={canViewBilling}
          onSuccess={(_project) => {
            // Re-fetch projects so we get the full enriched shape from the service
            fetchProjects(selectedClientId);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal isOpen={modal === 'addRate'} onClose={() => setModal(null)} title="Add Billing Rate" size="sm">
        <AddRateForm
          projectId={rateProjectId}
          onSuccess={() => {
            // Re-fetch to get updated currentRate
            fetchProjects(selectedClientId);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
      />
    </main>
  );
}
