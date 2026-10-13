import React from 'react';
import {
  Users, Plus, UserCheck, UserX, FolderOpen,
  ChevronDown, ChevronUp, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Pagination from '../../../components/Pagination.jsx';
import Table, { TableHead, TableBody, TableRow } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';
import UserAssignments from './UserAssignments.jsx';

export default function UsersTable({
  paginatedUsers,
  totalFiltered,
  search,
  canCreateUser,
  canManageUsers,
  canAssign,
  sortField,
  sortOrder,
  toggleSort,
  expandedId,
  setExpandedId,
  canManageSpecificUser,
  handleToggleStatus,
  currentUser,
  togglingUserId,
  canAssignUser,
  canRemoveProject,
  allowedAssignProjectIds,
  userHasProjectInCapabilities,
  setAssigningUser,
  onAssignmentsUpdated,
  page,
  setPage,
  usersPerPage,
  onCreateUserClick,
}) {
  if (totalFiltered === 0) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8" />}
        title={search ? 'No users match your search.' : 'No users found.'}
        message={!search && canCreateUser ? 'Create your first team member.' : undefined}
        action={
          !search && canCreateUser ? (
            <button
              onClick={onCreateUserClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />New User
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh
                onClick={() => toggleSort('name')}
                className="py-2.5 px-5 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name / Email</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('accountType')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Type</span>
                  {sortField === 'accountType' ? (
                    sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('isActive')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === 'isActive' ? (
                    sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('projects')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Projects</span>
                  {sortField === 'projects' ? (
                    sortOrder === 'asc' ? <ArrowUp size={11} className="text-indigo-600 shrink-0" /> : <ArrowDown size={11} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={11} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              {(canManageUsers || canAssign) && (
                <ResizableTh className="py-2.5 px-4 text-right">
                  <span>Actions</span>
                </ResizableTh>
              )}
            </tr>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <React.Fragment key={user.id}>
                <TableRow
                  onClick={() => setExpandedId((prev) => (prev === user.id ? null : user.id))}
                  className="cursor-pointer"
                >
                  {/* Name + email */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900" title={user.name}>
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-400" title={user.email}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={user.accountType === 'ADMIN' ? 'admin' : 'employee'}
                      label={user.accountType === 'ADMIN' ? 'Admin' : 'Employee'}
                    />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant={user.isActive ? 'active' : 'inactive'}
                      label={user.isActive ? 'Active' : 'Inactive'}
                      dot
                    />
                  </td>

                  {/* Active project count */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {user.accountType === 'ADMIN' ? (
                      <span className="text-[11px] text-slate-400 italic">Global access</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId((prev) => (prev === user.id ? null : user.id));
                        }}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition cursor-pointer group ${
                          expandedId === user.id
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200'
                        }`}
                        title={
                          (user.activeAssignments || []).length > 0
                            ? `Assigned: ${(user.activeAssignments || []).map((p) => p.name).join(', ')} (click to expand)`
                            : 'No projects assigned — click to manage'
                        }
                      >
                        <FolderOpen
                          className={`w-3.5 h-3.5 ${
                            expandedId === user.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                          }`}
                        />
                        <span>{(user.activeAssignments || []).length}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${
                            expandedId === user.id ? 'rotate-180 text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                          }`}
                        />
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  {(canManageUsers || canAssign) && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageSpecificUser(user) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(user);
                            }}
                            disabled={user.id === currentUser?.id || togglingUserId === user.id}
                            title={user.id === currentUser?.id ? "Can't deactivate yourself" : ''}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {togglingUserId === user.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-slate-700" />
                                <span className="hidden sm:inline">Processing...</span>
                              </>
                            ) : user.isActive ? (
                              <>
                                <UserX className="w-3 h-3 text-red-500" />
                                <span className="hidden sm:inline">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span className="hidden sm:inline">Activate</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId((prev) => (prev === user.id ? null : user.id));
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 transition"
                          title={expandedId === user.id ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedId === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  )}
                </TableRow>

                {/* Expanded assignments */}
                {expandedId === user.id && (
                  <TableRow hover={false} className="bg-slate-50/70 border-b border-slate-100">
                    <td colSpan={(canManageUsers || canAssign) ? 5 : 4} className="p-0">
                      <UserAssignments
                        user={user}
                        canAssign={canAssignUser(user)}
                        canRemoveProject={canRemoveProject}
                        allowedAssignProjectIds={allowedAssignProjectIds}
                        userHasProjectInCapabilities={userHasProjectInCapabilities}
                        currentUserId={currentUser?.id}
                        onOpenAssignModal={setAssigningUser}
                        onAssigned={onAssignmentsUpdated}
                      />
                    </td>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        currentPage={page}
        totalItems={totalFiltered}
        itemsPerPage={usersPerPage}
        onPageChange={setPage}
      />
    </>
  );
}
