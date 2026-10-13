import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ShieldCheck,
  Clock,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';
import { SYSTEM_CAPABILITIES } from '../constants/dashboardConstants.js';

export default function DashboardKpis({
  setStatusFilter,
  scrollToCapabilities,
  grantedCount,
  isAdmin,
  capabilities,
  pendingCount,
  projectsCount,
  activeProjectsRoute,
  activeProjectsSubtitle,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Capabilities */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter('ALL');
          scrollToCapabilities();
        }}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer text-left w-full"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Total Capabilities</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {SYSTEM_CAPABILITIES.length}
            </div>
            <div className="text-[11px] text-slate-400 truncate">System capabilities available</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 shrink-0" />
      </button>

      {/* Card 2: Granted Permissions */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter('GRANTED');
          scrollToCapabilities();
        }}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer text-left w-full"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Granted Permissions</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {grantedCount}
            </div>
            <div className="text-[11px] text-slate-400 truncate">Capabilities currently authorized</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 shrink-0" />
      </button>

      {/* Card 3: Pending Requests */}
      <Link
        to={isAdmin || capabilities?.REVIEW_TIME ? '/review' : (capabilities?.DECIDE_TIME_OFF ? '/time-off' : '/timesheet')}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Pending Requests</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {pendingCount}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {isAdmin || capabilities?.REVIEW_TIME ? 'Awaiting your approval' : 'Awaiting review'}
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 shrink-0" />
      </Link>

      {/* Card 4: Active Projects */}
      <Link
        to={activeProjectsRoute}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <FolderOpen size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Active Projects</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {projectsCount}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{activeProjectsSubtitle}</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 shrink-0" />
      </Link>
    </div>
  );
}
