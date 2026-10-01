import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Clock3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  TrendingUp,
  FolderKanban,
  Users,
  Shield,
  Mail,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import AppLogo from './AppLogo.jsx';

export default function Sidebar({
  isOpen,
  isMobileOpen,
  onMobileClose,
  onRequestLogout,
}) {
  const { user, isAdmin, capabilities } = useAuth();

  const hasClientProjectAccess = isAdmin || !!capabilities['MANAGE_CLIENTS_PROJECTS'];
  const hasUserAccess = isAdmin || !!capabilities['MANAGE_USERS'] || !!capabilities['ASSIGN_PROJECTS'];
  const hasAccessManagement = isAdmin;
  const hasReviewAccess = isAdmin || !!capabilities['REVIEW_TIME'];
  const hasReportsAccess = isAdmin || !!capabilities['VIEW_REPORTS'];
  const hasAnalyticsAccess = isAdmin || !!capabilities['VIEW_ANALYTICS'];

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
      isActive
        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
    }`;

  const iconClass = (isActive) =>
    `w-4 h-4 shrink-0 transition-colors ${
      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
    }`;

  const renderNavContent = (isMobile = false) => {
    const handleItemClick = () => {
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    };

    return (
      <div className="flex flex-col h-full justify-between select-none bg-slate-900 text-slate-300">
        {/* Top Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-800/80">
          <Link
            to="/dashboard"
            onClick={handleItemClick}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <AppLogo className="w-8 h-8 rounded-xl shadow-md shadow-indigo-950/50 group-hover:scale-105 transition" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
                Work Log
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Timesheet Portal</span>
            </div>
          </Link>
          {/* Close button ONLY on mobile drawer */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main / Work Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
              Work &amp; Time
            </div>
            <nav className="space-y-1" aria-label="Work navigation">
              <NavLink to="/dashboard" onClick={handleItemClick} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard className={iconClass(isActive)} />
                    <span className="truncate">Overview</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/timesheet" onClick={handleItemClick} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <Clock3 className={iconClass(isActive)} />
                    <span className="truncate">My Timesheet</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/time-off" onClick={handleItemClick} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <CalendarDays className={iconClass(isActive)} />
                    <span className="truncate">Time Off</span>
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          {/* Approvals & Insights Section */}
          {(hasReviewAccess || hasReportsAccess || hasAnalyticsAccess) && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
                Reviews &amp; Reports
              </div>
              <nav className="space-y-1" aria-label="Reports navigation">
                {hasReviewAccess && (
                  <NavLink to="/review" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <ClipboardCheck className={iconClass(isActive)} />
                        <span className="truncate">Review Queue</span>
                      </>
                    )}
                  </NavLink>
                )}

                {hasReportsAccess && (
                  <NavLink to="/reports" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <FileText className={iconClass(isActive)} />
                        <span className="truncate">Reports</span>
                      </>
                    )}
                  </NavLink>
                )}

                {hasAnalyticsAccess && (
                  <NavLink to="/analytics" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <TrendingUp className={iconClass(isActive)} />
                        <span className="truncate">Analytics</span>
                      </>
                    )}
                  </NavLink>
                )}
              </nav>
            </div>
          )}

          {/* Administration Section */}
          {(hasClientProjectAccess || hasUserAccess || hasAccessManagement || isAdmin) && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
                Administration
              </div>
              <nav className="space-y-1" aria-label="Admin navigation">
                {hasClientProjectAccess && (
                  <NavLink to="/clients" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <FolderKanban className={iconClass(isActive)} />
                        <span className="truncate">Clients &amp; Projects</span>
                      </>
                    )}
                  </NavLink>
                )}

                {hasUserAccess && (
                  <NavLink to="/users" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <Users className={iconClass(isActive)} />
                        <span className="truncate">Users &amp; Assignments</span>
                      </>
                    )}
                  </NavLink>
                )}

                {hasAccessManagement && (
                  <NavLink to="/access" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <Shield className={iconClass(isActive)} />
                        <span className="truncate">Access Management</span>
                      </>
                    )}
                  </NavLink>
                )}

                {isAdmin && (
                  <NavLink to="/emails" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <Mail className={iconClass(isActive)} />
                        <span className="truncate">Email Log</span>
                      </>
                    )}
                  </NavLink>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Section: Profile & Sign Out Card */}
        {user && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                  <span>{isAdmin ? 'Administrator' : 'Employee'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onRequestLogout}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-800/70 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-900/60 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:block border-r border-slate-800/90 bg-slate-900 h-screen sticky top-0 shrink-0 z-30 transition-[width] duration-200 ease-in-out overflow-hidden shadow-sm ${
          isOpen ? 'w-60' : 'w-0 border-r-0'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="w-60 h-full flex flex-col">{renderNavContent(false)}</div>
      </aside>

      {/* ── Mobile Drawer ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile sidebar navigation"
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
}
