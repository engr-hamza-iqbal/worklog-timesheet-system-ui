import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Clock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AppLogo from '../components/AppLogo.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 relative">
      {/* Ambient background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Icon & Header */}
        <div className="text-center mb-6">
          <AppLogo className="w-14 h-14 rounded-2xl shadow-md mb-3 mx-auto p-1 bg-white border border-slate-200/80" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your active timesheets, approval queues, and project hours.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-lg">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shadow-sm hover:shadow inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed group mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Workspace</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials (only in non-prod) */}
          {!import.meta.env.PROD && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Quick Demo Accounts (Dev Only)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@worklog.local')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  <ShieldCheck size={13} className="text-violet-600" />
                  <span>Alice (Admin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('bob@worklog.local')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  <UserCheck size={13} className="text-indigo-600" />
                  <span>Bob (Employee)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
