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
} from 'lucide-react';

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
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const iconClass = (isActive) =>
    `w-4.5 h-4.5 shrink-0 transition-colors ${
      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
    }`;

  const renderNavContent = (isMobile = false) => {
    const handleItemClick = () => {
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    };

    return (
      <div className="flex flex-col h-full justify-between select-none">
        {/* Top Header - No duplicate close button on desktop */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-100">
          <Link
            to="/dashboard"
            onClick={handleItemClick}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-slate-800 transition">
              W
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                Work Log
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  App
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Timesheet System</span>
            </div>
          </Link>

          {/* Close button ONLY on mobile drawer */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1.5">
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1.5">
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1.5">
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
                        <span className="truncate">Users &amp; Team</span>
                      </>
                    )}
                  </NavLink>
                )}

                {hasAccessManagement && (
                  <NavLink to="/access" onClick={handleItemClick} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        <Shield className={iconClass(isActive)} />
                        <span className="truncate">Access Control</span>
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

        {/* Bottom Section: ONLY Sign Out Button with Icon and Text */}
        {user && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <button
              onClick={onRequestLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg shadow-2xs transition cursor-pointer"
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
        className={`hidden md:block border-r border-slate-200 bg-white h-screen sticky top-0 shrink-0 z-30 transition-[width] duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'w-60' : 'w-0 border-r-0'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="w-60 h-full flex flex-col">{renderNavContent(false)}</div>
      </aside>

      {/* ── Mobile Drawer ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile sidebar navigation"
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
}
