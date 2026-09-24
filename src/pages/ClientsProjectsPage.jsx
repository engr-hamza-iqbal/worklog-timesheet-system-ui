import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, FolderOpen, Plus, Pencil, CheckCircle, XCircle,
  ChevronRight, DollarSign, RefreshCw, AlertCircle, Users,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

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
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
          {loading ? 'Saving...' : client ? 'Save changes' : 'Create client'}
        </button>
      </div>
    </form>
  );
}

// ─── Project Form ─────────────────────────────────────────────────────────────

function ProjectForm({ clients, onSuccess, onCancel }) {
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!clientId) { setError('Please select a client.'); return; }
    const rateNum = parseFloat(rate);
    if (!rate || isNaN(rateNum) || rateNum < 0) {
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
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
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
        <button type="submit" disabled={loading} className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed">
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

  // GET /api/clients → { success, data: [ { id, name, isActive, _count: { projects } } ], message }
  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/api/clients');
      // res = { success, data: [...], message } because interceptor returns response.data
      const list = Array.isArray(res.data) ? res.data : [];
      setClients(list);
      // Auto-select first client if none selected
      if (list.length > 0 && !selectedClientId) {
        setSelectedClientId(list[0].id);
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
      fetchProjects(selectedClientId);
    }
  }, [selectedClientId]);

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
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <button
              onClick={() => setModal('newClient')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />New Client
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* ── Left: Client list ── */}
        <div className="w-full md:w-60 lg:w-64 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</span>
              <span className="text-[11px] text-slate-400">{clients.length}</span>
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
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-5">Project</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Rate / hr</th>
                        <th className="py-2.5 px-4">Team</th>
                        {canManage && <th className="py-2.5 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-5">
                            <div className="font-medium text-slate-900">{project.name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={project.status === 'ACTIVE' ? 'active' : 'closed'}
                              label={project.status === 'ACTIVE' ? 'Active' : 'Closed'}
                              dot
                            />
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {/* currentRate comes directly from service (not rates[]) */}
                            {project.currentRate != null
                              ? <span className="font-medium">${Number(project.currentRate).toFixed(2)}</span>
                              : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-3 px-4">
                            {/* assignedEmployees array from service */}
                            {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <Users className="w-3 h-3 text-slate-400" />
                                {project.assignedEmployees.length}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          {canManage && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => { setRateProjectId(project.id); setModal('addRate'); }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                >
                                  <DollarSign className="w-3 h-3" />Rate
                                </button>
                                <button
                                  onClick={() => handleProjectStatusToggle(project)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                >
                                  {project.status === 'ACTIVE'
                                    ? <><XCircle className="w-3 h-3" />Close</>
                                    : <><CheckCircle className="w-3 h-3" />Reopen</>}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
