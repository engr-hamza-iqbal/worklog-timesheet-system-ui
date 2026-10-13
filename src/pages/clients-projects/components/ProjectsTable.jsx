import React from 'react';
import {
  Users,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import Badge from '../../../components/Badge.jsx';
import Pagination from '../../../components/Pagination.jsx';

export default function ProjectsTable({
  projects,
  paginatedProjects,
  projectSortField,
  projectSortOrder,
  toggleProjectSort,
  canViewBilling,
  canManage,
  canManageProject,
  expandedTeamProjects,
  toggleTeamExpanded,
  setRateProjectId,
  setModal,
  handleProjectStatusToggle,
  projectPage,
  setProjectPage,
  projectsPerPage,
}) {
  return (
    <>
      <div className="overflow-x-auto flex-1 min-w-0 [scrollbar-width:thin] touch-pan-x">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh
                onClick={() => toggleProjectSort('name')}
                className="py-2.5 px-3.5 sm:px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Project</span>
                  {projectSortField === 'name' ? (
                    projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleProjectSort('status')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {projectSortField === 'status' ? (
                    projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              {canViewBilling && (
                <ResizableTh
                  onClick={() => toggleProjectSort('currentRate')}
                  className="py-2.5 px-3 sm:px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Rate / hr</span>
                    {projectSortField === 'currentRate' ? (
                      projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                    )}
                  </div>
                </ResizableTh>
              )}
              <ResizableTh
                onClick={() => toggleProjectSort('team')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition text-xs whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Team</span>
                  {projectSortField === 'team' ? (
                    projectSortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              {canManage && (
                <ResizableTh
                  className="py-2.5 px-3 sm:px-4 text-right text-xs whitespace-nowrap"
                >
                  <span>Actions</span>
                </ResizableTh>
              )}
            </tr>
          </TableHead>
          <TableBody>
            {paginatedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableTd className="px-3.5 sm:px-5 py-2.5 sm:py-3 whitespace-nowrap">
                  <div className="font-medium text-slate-900 text-xs sm:text-sm" title={project.name}>{project.name}</div>
                </TableTd>
                <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap">
                  <Badge
                    variant={project.status === 'ACTIVE' ? 'active' : 'closed'}
                    label={project.status === 'ACTIVE' ? 'Active' : 'Closed'}
                    dot
                  />
                </TableTd>
                {canViewBilling && (
                  <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-700 whitespace-nowrap text-xs">
                    {project.currentRate != null
                      ? <span className="font-medium font-mono">${Number(project.currentRate).toFixed(2)}</span>
                      : <span className="text-slate-400">—</span>}
                  </TableTd>
                )}
                <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 min-w-[140px] whitespace-normal">
                  {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTeamExpanded(project.id);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 transition cursor-pointer select-none group w-fit"
                        title={expandedTeamProjects.has(project.id) ? "Collapse team members" : "Expand to view team members"}
                      >
                        <span className="p-1 rounded bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 transition">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-slate-800">
                          {project.assignedEmployees.length} member{project.assignedEmployees.length !== 1 ? 's' : ''}
                        </span>
                        {expandedTeamProjects.has(project.id) ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                        )}
                      </button>

                      {expandedTeamProjects.has(project.id) && (
                        <div className="flex flex-wrap gap-1.5 mt-1 max-w-full">
                          {project.assignedEmployees.map((emp) => (
                            <span
                              key={emp.id}
                              title={`${emp.name}${emp.email ? ` (${emp.email})` : ''}`}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-200/80 transition"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate max-w-[150px]">{emp.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">—</span>
                  )}
                </TableTd>
                {canManage && (
                  <TableTd className="px-3 sm:px-4 py-2.5 sm:py-3 text-right whitespace-nowrap">
                    {canManageProject(project) ? (
                      <div className="flex items-center gap-1.5 justify-end">
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
                  </TableTd>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={projectPage}
        totalItems={projects.length}
        itemsPerPage={projectsPerPage}
        onPageChange={setProjectPage}
      />
    </>
  );
}
