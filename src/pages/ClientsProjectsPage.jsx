import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, FolderOpen, Plus, Pencil, CheckCircle, XCircle,
  ChevronRight, DollarSign, RefreshCw, AlertCircle,
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import EmptyState from '../components/EmptyState.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormField({ label, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 transition ${
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900'
      }`}
      {...props}
    />
  );
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ─── Client Form (inside modal) ───────────────────────────────────────────────

function ClientForm({ client, onSuccess, onCancel }) {
  const [name, setName] = useState(client?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      if (client) {
        const res = await api.put(`/api/clients/${client.id}`, { name: name.trim() });
        onSuccess(res.data);
      } else {
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
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <FormField label="Client name">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          autoFocus
        />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <SubmitButton
          loading={loading}
          label={client ? 'Save changes' : 'Create client'}
          loadingLabel="Saving..."
        />
      </div>
    </form>
  );
}

// ─── Project Form (inside modal) ──────────────────────────────────────────────

function ProjectForm({ clients, project, onSuccess, onCancel }) {
  const [clientId, setClientId] = useState(project?.clientId || clients[0]?.id || '');
  const [name, setName] = useState(project?.name || '');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    if (!clientId) { setError('Please select a client.'); return; }
    if (!rate || isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
      setError('Enter a valid billing rate (e.g. 75.00).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/projects', {
        clientId,
        name: name.trim(),
        initialRatePerHour: parseFloat(rate),
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
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <FormField label="Client">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition bg-white"
          required
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Project name">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Website Redesign"
          required
        />
      </FormField>
      <FormField label="Initial billing rate (per hour)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="75.00"
            className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
            required
          />
        </div>
      </FormField>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <SubmitButton loading={loading} label="Create project" loadingLabel="Creating..." />
      </div>
    </form>
  );
}

// ─── Add Rate Form ────────────────────────────────────────────────────────────

function AddRateForm({ projectId, onSuccess, onCancel }) {
  const [rate, setRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rate || parseFloat(rate) <= 0) { setError('Enter a valid rate.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${projectId}/rates`, {
        ratePerHour: parseFloat(rate),
        effectiveFrom,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to add rate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}
      <FormField label="New rate per hour">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="90.00"
            className="w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
            required
            autoFocus
          />
        </div>
      </FormField>
      <FormField label="Effective from">
        <Input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          required
        />
      </FormField>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <SubmitButton loading={loading} label="Add rate" loadingLabel="Saving..." />
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsProjectsPage() {
  const { isAdmin, capabilities } = useAuth();
  const canManage = isAdmin || !!capabilities['MANAGE_CLIENTS_PROJECTS'];

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // null | 'newClient' | 'editClient' | 'newProject' | 'addRate'
  const [editingClient, setEditingClient] = useState(null);
  const [rateProjectId, setRateProjectId] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/api/clients');
      const list = Array.isArray(res.data) ? res.data : res.data?.clients || [];
      setClients(list);
      if (list.length > 0 && !selectedClientId) {
        setSelectedClientId(list[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load clients.');
    }
  }, [selectedClientId]);

  const fetchProjects = useCallback(async () => {
    if (!selectedClientId) return;
    try {
      const res = await api.get(`/api/projects?clientId=${selectedClientId}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.projects || [];
      setProjects(list);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    }
  }, [selectedClientId]);

  useEffect(() => {
    setLoading(true);
    fetchClients().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [selectedClientId]);

  const handleClientArchive = async (client) => {
    try {
      await api.put(`/api/clients/${client.id}`, { isActive: !client.isActive });
      setClients((prev) =>
        prev.map((c) => c.id === client.id ? { ...c, isActive: !c.isActive } : c)
      );
    } catch (err) {
      setError(err.message || 'Failed to update client.');
    }
  };

  const handleProjectStatusToggle = async (project) => {
    const newStatus = project.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await api.patch(`/api/projects/${project.id}/status`, { status: newStatus });
      setProjects((prev) =>
        prev.map((p) => p.id === project.id ? { ...p, status: newStatus } : p)
      );
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
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Clients &amp; Projects</h1>
          <p className="text-xs text-slate-500 mt-1">Manage clients, projects, and billing rates.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setModal('newClient')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            New Client
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col md:flex-row gap-6">
        {/* ── Left: Client list ── */}
        <div className="w-full md:w-64 lg:w-72 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</span>
              <span className="text-[11px] text-slate-400">{clients.length} total</span>
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
                        <Building2 className={`w-4 h-4 shrink-0 ${selectedClientId === client.id ? 'text-slate-300' : 'text-slate-400'}`} />
                        <span className="text-xs font-medium truncate">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {!client.isActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Archived
                          </span>
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">{selectedClient.name}</h2>
                    <Badge variant={selectedClient.isActive ? 'active' : 'inactive'} dot />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManage && (
                    <>
                      <button
                        onClick={() => { setEditingClient(selectedClient); setModal('editClient'); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
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
                        <Plus className="w-3 h-3" />
                        New Project
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Projects table */}
              {projects.length === 0 ? (
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
                        <Plus className="w-3.5 h-3.5" />
                        New Project
                      </button>
                    )
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-5 font-medium">Project</th>
                        <th className="py-2.5 px-4 font-medium">Status</th>
                        <th className="py-2.5 px-4 font-medium">Current Rate</th>
                        {canManage && <th className="py-2.5 px-4 font-medium text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projects.map((project) => {
                        const currentRate = project.rates?.slice(-1)[0];
                        return (
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
                            <td className="py-3 px-4 text-slate-600">
                              {currentRate ? (
                                <span className="font-medium">${Number(currentRate.ratePerHour).toFixed(2)}/hr</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            {canManage && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => {
                                      setRateProjectId(project.id);
                                      setModal('addRate');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    Rate
                                  </button>
                                  <button
                                    onClick={() => handleProjectStatusToggle(project)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                                  >
                                    {project.status === 'ACTIVE' ? (
                                      <><XCircle className="w-3 h-3" />Close</>
                                    ) : (
                                      <><CheckCircle className="w-3 h-3" />Reopen</>
                                    )}
                                  </button>
                                </div>
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
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal
        isOpen={modal === 'newClient'}
        onClose={() => setModal(null)}
        title="New Client"
        size="sm"
      >
        <ClientForm
          onSuccess={(client) => {
            setClients((prev) => [client, ...prev]);
            setSelectedClientId(client.id);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal
        isOpen={modal === 'editClient'}
        onClose={() => setModal(null)}
        title="Edit Client"
        size="sm"
      >
        <ClientForm
          client={editingClient}
          onSuccess={(updated) => {
            setClients((prev) =>
              prev.map((c) => c.id === updated.id ? updated : c)
            );
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal
        isOpen={modal === 'newProject'}
        onClose={() => setModal(null)}
        title="New Project"
      >
        <ProjectForm
          clients={clients.filter((c) => c.isActive)}
          onSuccess={(project) => {
            setProjects((prev) => [project, ...prev]);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      <Modal
        isOpen={modal === 'addRate'}
        onClose={() => setModal(null)}
        title="Add Billing Rate"
        size="sm"
      >
        <AddRateForm
          projectId={rateProjectId}
          onSuccess={() => {
            fetchProjects();
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </main>
  );
}
