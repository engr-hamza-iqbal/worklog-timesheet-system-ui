import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AppLogo from '../components/AppLogo.jsx';
import { loginSchema } from '../validation/formSchemas.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || 'Enter your email and password.');
      return;
    }
    setLoading(true);

    try {
      await login(parsed.data.email, parsed.data.password);
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
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100/90 shadow-xl p-6 sm:p-8 relative">
        {/* App Logo in Center */}
        <div className="text-center mb-6">
          <AppLogo className="w-14 h-14 mx-auto mb-3.5 shadow-sm rounded-2xl" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome <span className="text-blue-600">Back</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 py-2 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin" size={15} />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Access (for dev environment) */}
        {!import.meta.env.PROD && (
          <div className="mt-5">
            <div className="relative flex items-center justify-center mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                OR QUICK DEMO
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@worklog.local')}
                className="h-9 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition cursor-pointer text-center"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bob@worklog.local')}
                className="h-9 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition cursor-pointer text-center"
              >
                Employee Demo
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
