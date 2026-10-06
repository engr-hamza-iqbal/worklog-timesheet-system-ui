import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Check, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AppLogo from '../components/AppLogo.jsx';
import { registerSchema } from '../validation/formSchemas.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationToken, setInvitationToken] = useState(() => searchParams.get('token') || searchParams.get('invite') || '');
  const [showInvitationField, setShowInvitationField] = useState(() => Boolean(searchParams.get('token') || searchParams.get('invite')));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsed = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || 'Correct the registration details.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        invitationToken: invitationToken.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-4 sm:py-6 bg-slate-50 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Column: General Employee & Team Welcome */}
        <div className="lg:col-span-6 hidden md:block pr-0 lg:pr-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Welcome to <span className="text-blue-600">WorkLog System</span>
          </h1>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            A simple, intuitive platform to log your daily work, submit weekly timesheets, and manage your project hours with ease.
          </p>

          <div className="mt-7 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Daily Work Logging</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Easily record your hours and tasks across your assigned projects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Weekly Timesheets</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and submit your week's work with one click for quick approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Time-Off &amp; Leave</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule time off, view available leave allowances, and track request updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Register Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xl p-5 sm:p-7 relative">
            {/* Header with AppLogo in Center */}
            <div className="text-center mb-5">
              <AppLogo className="w-14 h-14 mx-auto mb-3 shadow-sm rounded-2xl" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Create an <span className="text-blue-600">account</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Enter your details below to register your account
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-9 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-9 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full h-9 px-3 py-1.5 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full h-9 px-3 py-1.5 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                {!showInvitationField ? (
                  <button
                    type="button"
                    onClick={() => setShowInvitationField(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <Key size={12} />
                    <span>Have an invitation code?</span>
                  </button>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Invitation Token (Optional)
                    </label>
                    <input
                      type="text"
                      value={invitationToken}
                      onChange={(e) => setInvitationToken(e.target.value)}
                      placeholder="Paste invitation token if required"
                      className="w-full h-9 px-3 py-1.5 text-xs font-mono rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="animate-spin" size={15} />}
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500 mt-4 pt-3 border-t border-slate-100">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
