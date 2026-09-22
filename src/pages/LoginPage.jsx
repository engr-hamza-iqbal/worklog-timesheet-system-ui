import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
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
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Sign in</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your work credentials to access your timesheet.</p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-medium text-slate-400 mb-2">Quick Demo Accounts</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@worklog.local')}
                className="flex-1 py-1 px-2 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition cursor-pointer"
              >
                Admin (Alice)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bob@worklog.local')}
                className="flex-1 py-1 px-2 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition cursor-pointer"
              >
                Employee (Bob)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-slate-900 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
