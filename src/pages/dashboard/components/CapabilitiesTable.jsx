import React from 'react';
import {
  Sliders,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  FolderOpen,
  User,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ExternalLink,
  Shield,
} from 'lucide-react';
import Table, { TableHead, TableBody, TableRow, TableTd } from '../../../components/Table.jsx';
import ResizableTh from '../../../components/ResizableTh.jsx';

export default function CapabilitiesTable({
  filteredCapabilities,
  filterQuery,
  setFilterQuery,
  statusFilter,
  setStatusFilter,
  showFilterMenu,
  setShowFilterMenu,
  filterMenuRef,
  actionMenuRef,
  handleRefresh,
  refreshing,
  sortField,
  sortOrder,
  toggleSort,
  isAdmin,
  capabilities,
  expandedScopeCaps,
  toggleScopeExpanded,
  activeMenuCap,
  setActiveMenuCap,
  userName,
  navigate,
}) {
  return (
    <div id="capabilities-section" className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              System Capabilities &amp; Access Scopes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time authorization matrix determining route access, project approvals, and administrative actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search filter input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search capabilities..."
              className="w-full sm:w-60 pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* Filter Toggle */}
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${statusFilter !== 'ALL'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
            >
              <Filter size={13} />
              <span>{statusFilter === 'ALL' ? 'Filter' : statusFilter === 'GRANTED' ? 'Granted' : 'Restricted'}</span>
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ALL'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${statusFilter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('GRANTED'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${statusFilter === 'GRANTED' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  Granted only
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('RESTRICTED'); setShowFilterMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition ${statusFilter === 'RESTRICTED' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  Restricted only
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-60 shadow-2xs"
            aria-label="Refresh permissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-slate-900' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <ResizableTh
                onClick={() => toggleSort('name')}
                className="py-3 px-5 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Capability</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('desc')}
                className="py-3 px-4 hidden sm:table-cell cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Description</span>
                  {sortField === 'desc' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('scope')}
                className="py-3 px-4 hidden md:table-cell cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Scope Authorization</span>
                  {sortField === 'scope' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh
                onClick={() => toggleSort('status')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === 'status' ? (
                    sortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-600 shrink-0" /> : <ArrowDown size={12} className="text-indigo-600 shrink-0" />
                  ) : (
                    <ArrowUpDown size={12} className="text-slate-400 opacity-60 shrink-0" />
                  )}
                </div>
              </ResizableTh>
              <ResizableTh className="py-3 px-4 hidden lg:table-cell text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Last Updated</span>
              </ResizableTh>
              <ResizableTh className="py-3 px-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Actions</span>
              </ResizableTh>
            </tr>
          </TableHead>
          <TableBody>
            {filteredCapabilities.map((cap) => {
              const Icon = cap.icon;
              const grant = capabilities[cap.code];
              const isHeld = isAdmin || !!grant;
              const isGlobal = isAdmin || grant?.isGlobal;
              const projectCount = grant?.allowedProjectIds?.length || 0;
              const userCount = grant?.allowedUserIds?.length || 0;

              return (
                <TableRow key={cap.code}>
                  {/* Capability column */}
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cap.iconBg}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm" title={cap.name}>{cap.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{cap.code}</div>
                      </div>
                    </div>
                  </td>

                  {/* Description column */}
                  <td className="py-3.5 px-4 text-slate-600 hidden sm:table-cell text-xs" title={cap.desc}>
                    {cap.desc}
                  </td>

                  {/* Scope Authorization column */}
                  <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell">
                    {isHeld ? (
                      isGlobal ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                          <Globe size={13} />
                          <span>Global Access</span>
                        </span>
                      ) : (
                        <div>
                          {(() => {
                            const isExpanded = expandedScopeCaps.has(cap.code);
                            const hasProjects = (grant?.allowedProjects?.length || 0) > 0 || projectCount > 0;
                            const hasUsers = (grant?.allowedUsers?.length || 0) > 0 || userCount > 0;

                            if (!hasProjects && !hasUsers) {
                              return <span className="text-xs text-slate-400 italic">No specific scope</span>;
                            }

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleScopeExpanded(cap.code)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${isExpanded
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                    }`}
                                >
                                  <FolderOpen size={13} className="text-blue-600" />
                                  <span>
                                    {[
                                      projectCount > 0 ? `${projectCount} project${projectCount === 1 ? '' : 's'}` : null,
                                      userCount > 0 ? `${userCount} user${userCount === 1 ? '' : 's'}` : null,
                                    ].filter(Boolean).join(', ')}
                                  </span>
                                  <ChevronDown
                                    size={12}
                                    className={`text-blue-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </button>

                                {isExpanded && (
                                  <div className="mt-1.5 flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl max-w-xs animate-in fade-in duration-100">
                                    {grant?.allowedProjects?.map((p) => (
                                      <span
                                        key={p.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                      >
                                        <FolderOpen size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[120px]">{p.name}</span>
                                      </span>
                                    ))}
                                    {grant?.allowedUsers?.map((u) => (
                                      <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                      >
                                        <User size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[120px]">{u.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>

                  {/* Status column */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isHeld ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle size={13} className="text-slate-400" />
                        <span>Restricted</span>
                      </span>
                    )}
                  </td>

                  {/* Last Updated column */}
                  <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap">
                    <div className="text-xs text-slate-700 font-medium">{cap.lastUpdated}</div>
                    <div className="text-[10px] text-slate-400">by {isAdmin ? userName : 'Admin'}</div>
                  </td>

                  {/* Actions column */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="relative inline-block text-left" ref={actionMenuRef}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuCap(activeMenuCap === cap.code ? null : cap.code)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Actions"
                        aria-label={`Actions for ${cap.name}`}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuCap === cap.code && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuCap(null);
                              navigate(cap.route);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-between cursor-pointer"
                          >
                            <span>Open Feature</span>
                            <ExternalLink size={13} className="text-slate-400" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuCap(null);
                                navigate('/access');
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-between border-t border-slate-100 mt-0.5 pt-1.5 cursor-pointer"
                            >
                              <span>Manage Access</span>
                              <Shield size={13} className="text-slate-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </TableRow>
              );
            })}
            {filteredCapabilities.length === 0 && (
              <TableRow hover={false}>
                <TableTd colSpan={6} align="center" className="py-10 text-xs text-slate-400">
                  No capabilities matched your search "{filterQuery}".
                </TableTd>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
