import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../api/client.js';
import {
  Menu, X, Shield, Users, FolderKanban,
  LayoutDashboard, ExternalLink, LogOut,
} from 'lucide-react';

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

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">

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
          <nav className="hidden md:flex items-center gap-1 flex-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
              Overview
            </NavLink>

            {hasClientProjectAccess && (
              <NavLink to="/clients" className={navLinkClass}>
                <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                Clients &amp; Projects
              </NavLink>
            )}

            {hasUserAccess && (
              <NavLink to="/users" className={navLinkClass}>
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Users
              </NavLink>
            )}

            {hasAccessManagement && (
              <NavLink to="/access" className={navLinkClass}>
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Access
              </NavLink>
            )}
          </nav>
        )}

        {/* ── Right side controls ── */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a
            href={`${API_BASE_URL}/api-docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
          >
            API
            <ExternalLink className="w-3 h-3" />
          </a>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              {/* Avatar + name */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-right leading-tight">
                  <div className="text-xs font-medium text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{isAdmin ? 'Admin' : 'Employee'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md transition"
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
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {/* User info */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {isAdmin ? 'ADMIN' : 'EMPLOYEE'}
                </span>
              </div>
            )}

            {/* Nav links */}
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Overview
                </NavLink>

                {hasClientProjectAccess && (
                  <NavLink to="/clients" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                    Clients &amp; Projects
                  </NavLink>
                )}

                {hasUserAccess && (
                  <NavLink to="/users" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <Users className="w-4 h-4 text-slate-400" />
                    Users &amp; Assignments
                  </NavLink>
                )}

                {hasAccessManagement && (
                  <NavLink to="/access" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
                    <Shield className="w-4 h-4 text-slate-400" />
                    Access Management
                  </NavLink>
                )}

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between px-1">
                  <a
                    href={`${API_BASE_URL}/api-docs`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    Swagger API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              /* Unauthenticated mobile */
              <div className="flex flex-col gap-2 py-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-md transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-md transition"
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
