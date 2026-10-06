import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  History,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import AppLogo from './AppLogo.jsx';

export default function Sidebar({
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
  onRequestLogout,
}) {
  const { user, isAdmin, capabilities } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const desktopActiveRef = useRef(null);

  const isExpanded = isOpen || isHovered;

  // Scroll active item smoothly into view if on medium/shorter viewport heights
  useEffect(() => {
    if (desktopActiveRef.current) {
      desktopActiveRef.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [location.pathname, isExpanded]);

  const hasClientProjectAccess = isAdmin || !!capabilities['MANAGE_CLIENTS_PROJECTS'];
  const hasUserAccess = isAdmin || !!capabilities['MANAGE_USERS'] || !!capabilities['ASSIGN_PROJECTS'];
  const hasAccessManagement = isAdmin;
  const hasReviewAccess = isAdmin || !!capabilities['REVIEW_TIME'];
  const hasReportsAccess = isAdmin || !!capabilities['VIEW_REPORTS'];
  const hasAnalyticsAccess = isAdmin || !!capabilities['VIEW_ANALYTICS'];

  const workItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/timesheet', label: 'My Timesheet', icon: Clock3 },
    { to: '/time-off', label: 'Time Off', icon: CalendarDays },
  ];

  const reviewItems = [
    hasReviewAccess && { to: '/review', label: 'Review Queue', icon: ClipboardCheck },
    hasReportsAccess && { to: '/reports', label: 'Reports', icon: FileText },
    hasAnalyticsAccess && { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  ].filter(Boolean);

  const adminItems = [
    hasClientProjectAccess && { to: '/clients', label: 'Clients & Projects', icon: FolderKanban },
    hasUserAccess && { to: '/users', label: 'Users & Assignments', icon: Users },
    hasAccessManagement && { to: '/access', label: 'Access Management', icon: Shield },
    isAdmin && { to: '/audit-logs', label: 'Access Audit Logs', icon: History },
    isAdmin && { to: '/emails', label: 'Email Log', icon: Mail },
  ].filter(Boolean);

  const renderNavContent = (isMobile = false) => {
    const handleItemClick = () => {
      if (isMobile && onMobileClose) {
        onMobileClose();
      }
    };

    const expanded = isMobile || isExpanded;

    const renderItem = (item) => {
      const Icon = item.icon;
      const isItemActive =
        location.pathname === item.to ||
        (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

      if (!expanded) {
        return (
          <NavLink
            key={item.to}
            to={item.to}
            ref={isItemActive && !isMobile ? desktopActiveRef : null}
            onClick={handleItemClick}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-150 cursor-pointer group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r shadow-xs" />
                )}
              </>
            )}
          </NavLink>
        );
      }

      return (
        <NavLink
          key={item.to}
          to={item.to}
          ref={isItemActive && !isMobile ? desktopActiveRef : null}
          onClick={handleItemClick}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </>
          )}
        </NavLink>
      );
    };

    return (
      <div className="flex flex-col h-full justify-between select-none bg-slate-900 text-slate-300">
        {/* Top Header */}
        <div
          className={`p-3.5 pb-3 flex items-center border-b border-slate-800/80 shrink-0 ${
            expanded ? 'justify-between' : 'justify-center'
          }`}
        >
          {expanded ? (
            <>
              <Link
                to="/dashboard"
                onClick={handleItemClick}
                className="flex items-center gap-2.5 group cursor-pointer min-w-0"
              >
                <AppLogo className="w-8 h-8 rounded-xl shadow-md shadow-indigo-950/50 group-hover:scale-105 transition shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                    Work Log
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">Timesheet Portal</span>
                </div>
              </Link>

              {/* Close button on mobile drawer, toggle pin button on desktop */}
              {isMobile ? (
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle?.();
                  }}
                  className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                    isOpen
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60'
                  }`}
                  title={isOpen ? 'Collapse sidebar (Ctrl+B)' : 'Keep sidebar open (Pin) (Ctrl+B)'}
                  aria-label={isOpen ? 'Collapse sidebar' : 'Keep sidebar open'}
                >
                  {isOpen ? (
                    <PanelLeftClose className="w-4.5 h-4.5" />
                  ) : (
                    <PanelLeftOpen className="w-4.5 h-4.5" />
                  )}
                </button>
              )}
            </>
          ) : (
            <Link
              to="/dashboard"
              onClick={handleItemClick}
              className="p-0.5 group cursor-pointer flex items-center justify-center"
              title="Work Log — Timesheet Portal"
            >
              <AppLogo className="w-8 h-8 rounded-xl shadow-md shadow-indigo-950/50 group-hover:scale-105 transition" />
            </Link>
          )}
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Main / Work Section */}
          <div>
            {expanded ? (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
                Work &amp; Time
              </div>
            ) : null}
            <nav className="space-y-1" aria-label="Work navigation">
              {workItems.map(renderItem)}
            </nav>
          </div>

          {/* Approvals & Insights Section */}
          {reviewItems.length > 0 && (
            <div>
              {expanded ? (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
                  Reviews &amp; Reports
                </div>
              ) : (
                <div className="w-8 h-px bg-slate-800/80 mx-auto my-2" />
              )}
              <nav className="space-y-1" aria-label="Reports navigation">
                {reviewItems.map(renderItem)}
              </nav>
            </div>
          )}

          {/* Administration Section */}
          {adminItems.length > 0 && (
            <div>
              {expanded ? (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1.5">
                  Administration
                </div>
              ) : (
                <div className="w-8 h-px bg-slate-800/80 mx-auto my-2" />
              )}
              <nav className="space-y-1" aria-label="Admin navigation">
                {adminItems.map(renderItem)}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Section: Profile & Sign Out Card */}
        {user && (
          expanded ? (
            <div className="shrink-0 p-3 border-t border-slate-800/80 bg-slate-950/50">
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
                type="button"
                onClick={onRequestLogout}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-800/70 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-900/60 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="shrink-0 py-3 px-2 border-t border-slate-800/80 bg-slate-950/50 flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 text-indigo-400 font-bold text-xs flex items-center justify-center cursor-default"
                title={`${user.name} (${isAdmin ? 'Administrator' : 'Employee'})`}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                type="button"
                onClick={onRequestLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar Container (with fixed rail + smooth expand on hover) ── */}
      <div
        className={`hidden md:block shrink-0 relative transition-[width] duration-200 ease-in-out ${
          isOpen ? 'w-60' : 'w-[68px]'
        }`}
      >
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800/90 z-30 transition-[width,box-shadow] duration-200 ease-in-out flex flex-col justify-between select-none ${
            isExpanded
              ? 'w-60 shadow-2xl shadow-slate-950/60'
              : 'w-[68px] shadow-sm'
          }`}
          aria-label="Sidebar navigation"
        >
          {renderNavContent(false)}
        </aside>
      </div>

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
