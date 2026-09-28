import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotAuthorisedPage({ requiredCapability = null, message = null }) {
  const { user, isAdmin } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Not Authorised
        </h1>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {message ||
            (requiredCapability
              ? `You do not have the required "${requiredCapability}" capability to access this screen.`
              : 'You do not have permission to access this resource.')}
        </p>

        {user && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left">
            <div className="font-semibold text-slate-800">Current Session:</div>
            <div className="mt-1 flex justify-between">
              <span>Account:</span>
              <span className="font-medium text-slate-800">{user.email}</span>
            </div>
            <div className="mt-0.5 flex justify-between">
              <span>Role:</span>
              <span className="font-medium text-slate-800">{isAdmin ? 'Administrator' : 'Employee'}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/timesheet"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>My Timesheet</span>
          </Link>
        </div>

        <p className="mt-5 text-[11px] text-slate-400">
          Need access? Contact an administrator to grant you the required capability.
        </p>
      </div>
    </div>
  );
}
