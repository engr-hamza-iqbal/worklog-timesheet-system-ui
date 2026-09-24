import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  Calendar,
} from 'lucide-react';
import { Tooltip } from './Navbar.jsx';

const ROUTE_TITLES = {
  '/dashboard': { title: 'Overview', category: 'Work' },
  '/timesheet': { title: 'My Timesheet', category: 'Work' },
  '/time-off': { title: 'Time Off Requests', category: 'Work' },
  '/review': { title: 'Review Queue', category: 'Approvals' },
  '/reports': { title: 'Summary Reports', category: 'Insights' },
  '/analytics': { title: 'Analytics Dashboard', category: 'Insights' },
  '/clients': { title: 'Clients & Projects', category: 'Administration' },
  '/users': { title: 'Users & Assignments', category: 'Administration' },
  '/access': { title: 'Access Control', category: 'Administration' },
  '/emails': { title: 'Email Audit Log', category: 'Administration' },
};

function HeaderProfileDropdown({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-lg sm:px-2.5 sm:py-1.5 hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="text-left leading-tight hidden lg:block">
          <div className="text-xs font-semibold text-slate-900 max-w-[120px] truncate">{user.name}</div>
          <div className="text-[10px] text-slate-500 font-medium">{isAdmin ? 'Administrator' : 'Employee'}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</div>
            <div className="mt-2">
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isAdmin ? 'ADMINISTRATOR' : 'EMPLOYEE'}
              </span>
            </div>
          </div>

          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobile,
  onRequestLogout,
}) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showAuthenticatedUI = isAuthenticated && !isAuthPage;

  const currentRouteInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Work Log',
    category: '',
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* ── Left section: Toggles & Brand ── */}
      <div className="flex items-center gap-3 min-w-0">
        {showAuthenticatedUI ? (
          <>
            {/* Mobile menu trigger */}
            <button
              onClick={onOpenMobile}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop single collapse / expand toggle */}
            <Tooltip
              text={sidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              side="bottom"
            >
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="w-4.5 h-4.5" />
                ) : (
                  <PanelLeftOpen className="w-4.5 h-4.5" />
                )}
              </button>
            </Tooltip>

            {/* When sidebar is closed, show brand and breadcrumbs */}
            {!sidebarOpen && (
              <>
                <Link
                  to="/dashboard"
                  className="hidden md:flex items-center gap-2 mr-1 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-slate-800 transition">
                    W
                  </div>
                  <span className="text-sm font-bold text-slate-900 tracking-tight">Work Log</span>
                </Link>

                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span>/</span>
                  <span className="text-slate-900 font-semibold truncate max-w-[200px] lg:max-w-none">
                    {currentRouteInfo.title}
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          /* Guest / Auth Brand */
          <Link to="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
              W
            </span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Work Log</span>
          </Link>
        )}
      </div>

      {/* ── Right section: Date chip, Profile dropdown or guest auth ── */}
      <div className="flex items-center gap-3 shrink-0">
        {showAuthenticatedUI && user ? (
          <>
            {/* Live date chip */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>

            {/* Profile Dropdown (Overview link removed to eliminate repetition) */}
            <HeaderProfileDropdown
              user={user}
              isAdmin={isAdmin}
              onLogout={onRequestLogout}
            />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md transition cursor-pointer"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md transition cursor-pointer shadow-xs"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
