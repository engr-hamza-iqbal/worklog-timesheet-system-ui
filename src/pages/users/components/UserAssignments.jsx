import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../../api/client.js';
import Badge from '../../../components/Badge.jsx';
import ConfirmDialog from '../../../components/ConfirmDialog.jsx';

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

export default function UserAssignments({
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
