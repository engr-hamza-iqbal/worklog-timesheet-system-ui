import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import AppLogo from '../components/AppLogo.jsx';
import {
  loginSchema,
  resetPasswordOtpSchema,
  resetPasswordOldSchema,
} from '../validation/formSchemas.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Reset view state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMethod, setResetMethod] = useState('otp'); // 'otp' | 'oldPassword'
  const [resetEmail, setResetEmail] = useState('');
  const [resetOldPassword, setResetOldPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetOldPassword, setShowResetOldPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // OTP sending state
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devResetOtp, setDevResetOtp] = useState(null);
  const [otpSentMessage, setOtpSentMessage] = useState('');

  // Reset submit state
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Countdown timer for OTP cooldown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleLoginSubmit = async (e) => {
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
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Invalid credentials. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    setResetErrorMessage('');
    setOtpSentMessage('');

    const trimmedEmail = resetEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setResetErrorMessage('Please enter a valid email address to receive a verification code.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post('/api/auth/send-reset-otp', { email: trimmedEmail });
      if (res.success) {
        setOtpSentMessage(res.message || 'Verification code sent to your email.');
        setOtpCooldown(45);
        if (res.data?.devOtp) {
          setDevResetOtp(res.data.devOtp);
          setResetOtp(res.data.devOtp); // Auto-fill in development for testing convenience
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to send verification code.';
      setResetErrorMessage(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetErrorMessage('');
    setResetSuccessMessage('');

    if (resetMethod === 'otp') {
      const parsed = resetPasswordOtpSchema.safeParse({
        email: resetEmail,
        otp: resetOtp,
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      });

      if (!parsed.success) {
        setResetErrorMessage(parsed.error.issues[0]?.message || 'Please check your inputs.');
        return;
      }

      setResetLoading(true);
      try {
        const res = await api.post('/api/auth/reset-password', {
          email: parsed.data.email,
          mode: 'otp',
          otp: parsed.data.otp,
          newPassword: parsed.data.newPassword,
        });

        if (res.success) {
          setResetSuccessMessage(res.message || 'Password has been reset successfully!');
          setEmail(resetEmail);
          setPassword('');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to reset password.';
        setResetErrorMessage(msg);
      } finally {
        setResetLoading(false);
      }
    } else {
      // oldPassword method
      const parsed = resetPasswordOldSchema.safeParse({
        email: resetEmail,
        oldPassword: resetOldPassword,
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      });

      if (!parsed.success) {
        setResetErrorMessage(parsed.error.issues[0]?.message || 'Please check your inputs.');
        return;
      }

      setResetLoading(true);
      try {
        const res = await api.post('/api/auth/reset-password', {
          email: parsed.data.email,
          mode: 'oldPassword',
          oldPassword: parsed.data.oldPassword,
          newPassword: parsed.data.newPassword,
        });

        if (res.success) {
          setResetSuccessMessage(res.message || 'Password has been reset successfully!');
          setEmail(resetEmail);
          setPassword('');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to reset password.';
        setResetErrorMessage(msg);
      } finally {
        setResetLoading(false);
      }
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage('');
  };

  // Live password validation criteria for reset form
  const passHasMinLength = resetNewPassword.length >= 8;
  const passHasUpper = /[A-Z]/.test(resetNewPassword);
  const passHasLower = /[a-z]/.test(resetNewPassword);
  const passHasDigit = /[0-9]/.test(resetNewPassword);
  const passHasSpecial = /[^A-Za-z0-9]/.test(resetNewPassword);

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
            {isResetMode ? (
              <>
                Reset <span className="text-blue-600">Password</span>
              </>
            ) : (
              <>
                Welcome <span className="text-blue-600">Back</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {isResetMode
              ? 'Reset your account password using email verification or your current password'
              : 'Sign in to your account to continue'}
          </p>
        </div>

        {!isResetMode ? (
          /* Normal Sign In Form */
          <>
            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                <div className="flex mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetMode(true);
                      setResetErrorMessage('');
                      setResetSuccessMessage('');
                    }}
                    className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition cursor-pointer"
                  >
                    Forgot password?
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
          </>
        ) : (
          /* Password Reset Mode Form */
          <div className="space-y-4">
            {/* Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setResetMethod('otp');
                  setResetErrorMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${resetMethod === 'otp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Via Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetMethod('oldPassword');
                  setResetErrorMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${resetMethod === 'oldPassword'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Via Old Password</span>
              </button>
            </div>

            {/* Feedback Messages */}
            {resetSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Password Reset Complete</h4>
                  <p className="text-xs text-emerald-700 mt-1">{resetSuccessMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setResetSuccessMessage('');
                    setResetErrorMessage('');
                  }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Sign In with New Password
                </button>
              </div>
            ) : (
              <>
                {resetErrorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                {otpSentMessage && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{otpSentMessage}</span>
                  </div>
                )}

                {devResetOtp && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>Dev OTP Code: <strong>{devResetOtp}</strong></span>
                    <span className="text-[10px] text-amber-600">(Auto-filled)</span>
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Registered Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="flex-1 h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                      />
                      {resetMethod === 'otp' && (
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          disabled={sendingOtp || otpCooldown > 0 || !resetEmail.trim()}
                          className="px-3 h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-md transition shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {sendingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {!sendingOtp && <Send className="w-3.5 h-3.5" />}
                          <span>{otpCooldown > 0 ? `${otpCooldown}s` : 'Send Code'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* OTP Mode: 6-digit Code */}
                  {resetMethod === 'otp' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full h-10 px-3 py-2 text-center text-lg font-mono font-bold tracking-widest rounded-md border border-slate-200 bg-slate-50/60 text-blue-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  ) : (
                    /* Old Password Mode: Current Password */
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Current (Old) Password
                      </label>
                      <div className="relative">
                        <input
                          type={showResetOldPassword ? 'text' : 'password'}
                          required
                          value={resetOldPassword}
                          onChange={(e) => setResetOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10 px-3 py-2 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetOldPassword(!showResetOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                        >
                          {showResetOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 py-2 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      >
                        {showResetNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  {resetNewPassword && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] space-y-1">
                      <div className={`flex items-center gap-1.5 ${passHasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passHasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passHasUpper && passHasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passHasUpper && passHasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Upper & lowercase letters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passHasDigit && passHasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passHasDigit && passHasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Number & special character</span>
                      </div>
                    </div>
                  )}

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 py-2 pr-10 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                      >
                        {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {resetConfirmPassword && resetNewPassword !== resetConfirmPassword && (
                      <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || (resetMethod === 'otp' && resetOtp.length !== 6)}
                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed pt-0.5"
                  >
                    {resetLoading && <Loader2 className="animate-spin" size={15} />}
                    <span>{resetLoading ? 'Resetting Password...' : 'Reset Password'}</span>
                  </button>
                </form>
              </>
            )}

            {/* Back to sign in */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setResetErrorMessage('');
                  setResetSuccessMessage('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
