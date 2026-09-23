import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Menu, X, Shield, Users, FolderKanban,
  LayoutDashboard, LogOut, Clock3, ClipboardCheck,
  ChevronDown, User,
} from 'lucide-react';

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
export function Tooltip({ text, children, side = 'bottom' }) {
  const posClass = side === 'top'
    ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
    : side === 'left'
    ? 'right-full mr-1.5 top-1/2 -translate-y-1/2'
    : side === 'right'
    ? 'left-full ml-1.5 top-1/2 -translate-y-1/2'
    : 'top-full mt-1.5 left-1/2 -translate-x-1/2';

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`pointer-events-none absolute ${posClass} z-50 whitespace-nowrap px-2 py-1 rounded text-[11px] font-medium bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
        role="tooltip"
      >
        {text}
      </div>
    </div>
  );
}

// ─── Profile dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 border-l border-slate-200 group cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 group-hover:ring-2 ring-slate-300 transition">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left leading-tight hidden lg:block">
          <div className="text-xs font-medium text-slate-900 max-w-[120px] truncate">{user.name}</div>
          <div className="text-[10px] text-slate-500">{isAdmin ? 'Admin' : 'Employee'}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            <div className={`mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {isAdmin ? 'ADMINISTRATOR' : 'EMPLOYEE'}
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              My Overview
            </Link>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
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

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, capabilities } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const hasClientProjectAccess = isAdmin || !!capabilities['MANAGE_CLIENTS_PROJECTS'];
  const hasUserAccess = isAdmin || !!capabilities['MANAGE_USERS'] || !!capabilities['ASSIGN_PROJECTS'];
  const hasAccessManagement = isAdmin;
  const hasReviewAccess = isAdmin || !!capabilities['REVIEW_TIME'];

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition cursor-pointer ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-auto mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">

        {/* ── Brand ── */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
            W
          </span>
          <span className="text-sm font-semibold text-slate-900 tracking-tight whitespace-nowrap hidden sm:block">
            Work Log
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
            <Tooltip text="Your timesheet overview" side="bottom">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                Overview
              </NavLink>
            </Tooltip>

            <Tooltip text="Record and submit your work" side="bottom">
              <NavLink to="/timesheet" className={navLinkClass}>
                <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                Timesheet
              </NavLink>
            </Tooltip>

            {hasReviewAccess && (
              <Tooltip text="Review submitted work" side="bottom">
                <NavLink to="/review" className={navLinkClass}>
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                  Review Queue
                </NavLink>
              </Tooltip>
            )}

            {hasClientProjectAccess && (
              <Tooltip text="Manage clients, projects & billing rates" side="bottom">
                <NavLink to="/clients" className={navLinkClass}>
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                  Clients &amp; Projects
                </NavLink>
              </Tooltip>
            )}

            {hasUserAccess && (
              <Tooltip text="Team members & project assignments" side="bottom">
                <NavLink to="/users" className={navLinkClass}>
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Users
                </NavLink>
              </Tooltip>
            )}

            {hasAccessManagement && (
              <Tooltip text="Grant & revoke employee capabilities" side="bottom">
                <NavLink to="/access" className={navLinkClass}>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Access
                </NavLink>
              </Tooltip>
            )}
          </nav>
        )}

        {/* ── Right: authenticated profile dropdown or guest links ── */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated && user ? (
            <ProfileDropdown
              user={user}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md transition cursor-pointer"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md transition cursor-pointer"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {isAuthenticated && user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                  <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
                    isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isAdmin ? 'ADMIN' : 'EMPLOYEE'}
                  </span>
                </div>

                {/* Nav links */}
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />Overview
                </NavLink>

                <NavLink to="/timesheet" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  <Clock3 className="w-4 h-4 text-slate-400" />Timesheet
                </NavLink>

                {hasReviewAccess && (
                  <NavLink to="/review" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <ClipboardCheck className="w-4 h-4 text-slate-400" />Review Queue
                  </NavLink>
                )}

                {hasClientProjectAccess && (
                  <NavLink to="/clients" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <FolderKanban className="w-4 h-4 text-slate-400" />Clients &amp; Projects
                  </NavLink>
                )}

                {hasUserAccess && (
                  <NavLink to="/users" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <Users className="w-4 h-4 text-slate-400" />Users &amp; Assignments
                  </NavLink>
                )}

                {hasAccessManagement && (
                  <NavLink to="/access" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <Shield className="w-4 h-4 text-slate-400" />Access Management
                  </NavLink>
                )}

                {/* Footer actions */}
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />Sign out
                  </button>
                </div>
              </>
            ) : (
              /* Unauthenticated mobile */
              <div className="flex flex-col gap-2 py-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-md transition cursor-pointer"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md transition cursor-pointer"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
