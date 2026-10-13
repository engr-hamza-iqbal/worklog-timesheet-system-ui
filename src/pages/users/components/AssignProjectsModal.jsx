import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../api/client.js';
import Badge from '../../../components/Badge.jsx';
import { assignmentSchema } from '../../../validation/formSchemas.js';

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

export default function AssignProjectsForm({ user, assignedProjectIds, allowedProjectIds, onSuccess, onCancel }) {
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
