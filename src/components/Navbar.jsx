import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
            W
          </span>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">
            Work Log System
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            API Docs
          </a>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <span className="text-xs font-medium text-slate-900 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAdmin ? 'Admin' : 'Employee'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded border border-slate-200 transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
