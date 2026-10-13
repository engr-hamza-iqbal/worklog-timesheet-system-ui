import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, FolderOpen, Plus, Pencil, CheckCircle, XCircle,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { clientStatusSchema, projectStatusSchema } from '../../validation/formSchemas.js';
import ClientForm from './components/ClientForm.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import AddRateForm from './components/AddRateForm.jsx';
import ProjectsTable from './components/ProjectsTable.jsx';

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

  const [clients, setClients] = useState([]);
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
  const [expandedTeamProjects, setExpandedTeamProjects] = useState(new Set());

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

  const toggleTeamExpanded = (projectId) => {
    setExpandedTeamProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get('/api/clients');
      const list = Array.isArray(res.data) ? res.data : [];
      setClients(list);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      setProjectPage(1);
      fetchProjects(selectedClientId);
    }
  }, [selectedClientId, fetchProjects]);

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
    const parsed = clientStatusSchema.safeParse({ isActive: !client.isActive });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Invalid client status.'); return; }
    try {
      const res = await api.put(`/api/clients/${client.id}`, parsed.data);
      setClients((prev) => prev.map((c) => c.id === res.data.id ? res.data : c));
    } catch (err) {
      setError(err.message || 'Failed to update client.');
    }
  };

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
    const parsed = projectStatusSchema.safeParse({ status: newStatus });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Invalid project status.'); return; }
    try {
      await api.patch(`/api/projects/${project.id}/status`, parsed.data);
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
      {/* ── Top Controls Bar: Select Client + Actions ── */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 w-full sm:w-80">
          <label htmlFor="client-select-btn" className="text-xs font-semibold text-slate-700">
            Select Client
          </label>
          <SearchableSelect
            id="client-select-btn"
            items={clients}
            selectedId={selectedClientId}
            onSelect={(id) => setSelectedClientId(id)}
            placeholder="Select client..."
            searchPlaceholder="Search clients by name..."
            renderIcon={() => (
              <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            )}
            getItemLabel={(c) => c.name}
            getItemBadge={(c) => (!c.isActive ? { label: 'Archived', variant: 'amber' } : null)}
          />
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={refreshPage}
              disabled={refreshing}
              title="Refresh clients and projects"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {canCreateClient && (
              <button
                type="button"
                onClick={() => setModal('newClient')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Client
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

      {/* ── Full-Width Projects View ── */}
      <div className="mt-6">
        {!selectedClient ? (
          <div className="bg-white rounded-xl border border-slate-200 h-60 flex flex-col items-center justify-center text-center p-6 shadow-2xs">
            <Building2 className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">No client selected</p>
            <p className="text-xs text-slate-400 mt-1">Please select a client from the dropdown above to view and manage projects.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Panel header */}
            <div className="px-3.5 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2">
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
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { setEditingClient(selectedClient); setModal('editClient'); }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />Edit
                  </button>
                  <button
                    onClick={() => handleClientArchive(selectedClient)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                  >
                    {selectedClient.isActive ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {selectedClient.isActive ? 'Archive' : 'Restore'}
                  </button>
                  <button
                    onClick={() => setModal('newProject')}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
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
              <ProjectsTable
                projects={projects}
                paginatedProjects={paginatedProjects}
                projectSortField={projectSortField}
                projectSortOrder={projectSortOrder}
                toggleProjectSort={toggleProjectSort}
                canViewBilling={canViewBilling}
                canManage={canManage}
                canManageProject={canManageProject}
                expandedTeamProjects={expandedTeamProjects}
                toggleTeamExpanded={toggleTeamExpanded}
                setRateProjectId={setRateProjectId}
                setModal={setModal}
                handleProjectStatusToggle={handleProjectStatusToggle}
                projectPage={projectPage}
                setProjectPage={setProjectPage}
                projectsPerPage={PROJECTS_PER_PAGE}
              />
            )}
          </div>
        )}
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
          onSuccess={() => {
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
