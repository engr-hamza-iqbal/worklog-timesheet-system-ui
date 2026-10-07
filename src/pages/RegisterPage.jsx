import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Check, Key, ShieldCheck, Mail, Clock, AlertCircle, X, UserCheck, CheckCircle2, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AppLogo from '../components/AppLogo.jsx';
import api from '../api/client.js';
import { registerSchema } from '../validation/formSchemas.js';

/**
 * Extracts and sanitizes an invitation token from either:
 * - A full URL: http://localhost:5173/register?invite=eyJhbGciOi...
 * - A query string: ?invite=eyJ... or ?token=eyJ...
 * - A raw JWT token: eyJhbGciOi...
 */
export function extractInvitationToken(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (
    trimmed.includes('invite=') ||
    trimmed.includes('token=') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('?')
  ) {
    try {
      const parsedUrl = new URL(trimmed, 'http://localhost');
      const param = parsedUrl.searchParams.get('invite') || parsedUrl.searchParams.get('token');
      if (param) return param.trim();
      if (parsedUrl.hash) {
        const hashMatch = parsedUrl.hash.match(/[#?&](?:invite|token)=([^&#\s]+)/);
        if (hashMatch) return decodeURIComponent(hashMatch[1]).trim();
      }
    } catch {
      // fallback regex
    }
    const match = trimmed.match(/[?&#](?:invite|token)=([^&#\s]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
  }
  return trimmed;
}

/**
 * Safely decodes a JWT payload in the browser without verifying secret
 */
export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial invitation detection
  const initialRaw = searchParams.get('token') || searchParams.get('invite') || '';
  const initialToken = extractInvitationToken(initialRaw);

  const [invitationToken, setInvitationToken] = useState(initialToken);
  const [invitationPayload, setInvitationPayload] = useState(null);
  const [invitationVerified, setInvitationVerified] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenValidationMsg, setTokenValidationMsg] = useState('');
  const [showInvitationField, setShowInvitationField] = useState(Boolean(initialToken));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ── OTP State (Only for non-invited public registrations) ─────────────────
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // 10 minutes = 600s
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown between sends
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Synchronize when URL search parameters change
  useEffect(() => {
    const raw = searchParams.get('token') || searchParams.get('invite');
    if (raw) {
      const clean = extractInvitationToken(raw);
      setInvitationToken(clean);
      setShowInvitationField(true);
    }
  }, [searchParams]);

  // Actively watch token field: if user alters even a single character, verify and immediately clear invitation status if invalid
  useEffect(() => {
    const raw = invitationToken;
    const cleaned = extractInvitationToken(raw);

    if (!cleaned) {
      setInvitationPayload(null);
      setInvitationVerified(false);
      setTokenValidationMsg('');
      setIsVerifyingToken(false);
      return;
    }

    // Fast preliminary syntax check
    const parts = cleaned.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      setInvitationPayload(null);
      setInvitationVerified(false);
      setTokenValidationMsg('Invalid invitation code or link.');
      setIsVerifyingToken(false);
      return;
    }

    setIsVerifyingToken(true);
    setTokenValidationMsg('');

    let isSubscribed = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/api/auth/verify-invitation', { token: cleaned });
        if (!isSubscribed) return;
        const data = res?.data || res;
        if (data && (data.valid || data.email)) {
          const verifiedEmail = data.email;
          setInvitationPayload({ email: verifiedEmail });
          setEmail(verifiedEmail);
          setInvitationVerified(true);
          setTokenValidationMsg('');
          setErrorMessage('');
          setOtpSent(false);
          setOtp('');
        } else {
          setInvitationPayload(null);
          setInvitationVerified(false);
          setTokenValidationMsg('Invalid or modified invitation link.');
        }
      } catch (err) {
        if (!isSubscribed) return;
        setInvitationPayload(null);
        setInvitationVerified(false);
        const msg = err.response?.data?.error?.message || err.message || 'Invalid or expired invitation link.';
        setTokenValidationMsg(msg);
      } finally {
        if (isSubscribed) setIsVerifyingToken(false);
      }
    }, 200);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [invitationToken]);

  const handleInvitationChange = (inputVal) => {
    // When user types or pastes, extract the trimmed token only into the field
    const cleaned = extractInvitationToken(inputVal);
    setInvitationToken(cleaned);
  };

  const handleTokenPaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    if (text) {
      const cleaned = extractInvitationToken(text);
      if (cleaned) {
        e.preventDefault();
        setInvitationToken(cleaned);
      }
    }
  };

  const handleClearInvitation = () => {
    setInvitationToken('');
    setInvitationPayload(null);
    setInvitationVerified(false);
    setShowInvitationField(false);
    setEmail('');
    setOtpSent(false);
    setOtp('');
    setDevOtp('');
    setTokenValidationMsg('');
  };

  // Only consider invited if cryptographic verification confirmed the token is valid and unrevoked
  const isInvited = Boolean(invitationVerified && invitationPayload && invitationPayload.email);

  // 10-Minute Expiration Countdown Timer
  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Resend Cooldown Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ── Password Strength Evaluation ──────────────────────────────────────────
  const passwordCriteria = useMemo(() => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const checks = [
      { label: 'At least 8 characters', met: minLength },
      { label: 'Uppercase & lowercase letters', met: hasUpper && hasLower },
      { label: 'At least one number (0-9)', met: hasNumber },
      { label: 'At least one special character (!@#$%...)', met: hasSpecial },
    ];

    const passedCount = checks.filter((c) => c.met).length;

    let strength = { label: 'Empty', color: 'bg-slate-200', textColor: 'text-slate-400', percent: 0 };
    if (password.length > 0) {
      if (passedCount <= 1) {
        strength = { label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-600', percent: 25 };
      } else if (passedCount === 2) {
        strength = { label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600', percent: 50 };
      } else if (passedCount === 3) {
        strength = { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600', percent: 75 };
      } else {
        strength = { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', percent: 100 };
      }
    }

    return { checks, passedCount, strength };
  }, [password]);

  // ── Send Verification OTP (Public Registration Only) ──────────────────────
  const handleSendOtp = async () => {
    setErrorMessage('');
    setOtpSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address before requesting an OTP code.');
      return;
    }

    setOtpSending(true);
    try {
      const res = await api.post('/api/auth/send-otp', { email: email.trim() });
      setOtpSent(true);
      setOtpTimer(600); // 10 minutes = 600s
      setResendCooldown(45); // 45s cooldown
      setOtpSuccessMessage('Verification code sent! Please check your email.');
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ── Form Submission ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // If registering publicly without an invitation, email OTP is strictly required
    if (!isInvited) {
      if (!otpSent) {
        setErrorMessage('Please verify your email address by requesting an OTP code.');
        return;
      }

      if (otpTimer === 0) {
        setErrorMessage('Your verification code has expired. Please request a new code.');
        return;
      }

      if (!otp || otp.trim().length !== 6) {
        setErrorMessage('Please enter the complete 6-digit verification code.');
        return;
      }
    }

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      invitationToken: invitationToken.trim() || undefined,
      otp: !isInvited ? otp.trim() : undefined,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message || 'Please correct the registration details.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        otp: parsed.data.otp,
        invitationToken: parsed.data.invitationToken,
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
        {/* Left Column: Welcome Information */}
        <div className="lg:col-span-5 hidden md:block pr-0 lg:pr-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Welcome to <span className="text-blue-600">WorkLog System</span>
          </h1>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            A simple, intuitive platform to log your daily work, submit weekly timesheets, and manage your project hours with ease.
          </p>

          <div className="mt-7 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck size={17} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Verified &amp; Secure Access</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct admin invitation links or 10-minute email OTP verification ensure only valid users register.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Clock size={17} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Daily Work Logging</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Easily record your hours and tasks across your assigned projects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CalendarCheck size={17} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Weekly Timesheets &amp; Leave</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and submit timesheets with one click and track time-off balances.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Register Card */}
        <div className="lg:col-span-7 w-full max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xl p-5 sm:p-7 relative">
            {/* Header with AppLogo in Center */}
            <div className="text-center mb-5">
              <AppLogo className="w-13 h-13 mx-auto mb-2 shadow-sm rounded-2xl" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {isInvited ? 'Accept Team Invitation' : 'Create an account'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {isInvited
                  ? 'Complete your profile and set up a secure password to join'
                  : 'Verify your email and set up a secure password to register'}
              </p>
            </div>

            {/* Invitation Recognition Banner */}
            {isInvited && (
              <div className="mb-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <UserCheck size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
                          Team Invitation Active
                        </h3>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          Pre-Authorized
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearInvitation}
                        className="text-[11px] font-medium text-slate-400 hover:text-rose-600 inline-flex items-center gap-0.5 cursor-pointer transition"
                        title="Remove invitation"
                      >
                        <X size={12} />
                        <span>Clear</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Registering as <strong className="text-slate-900 font-medium">{invitationPayload.email}</strong>. Email verification code is waived.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Success message */}
            {otpSuccessMessage && !isInvited && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1">{otpSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
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

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                {isInvited ? (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          value={email}
                          disabled
                          className="w-full h-9 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-100 text-slate-800 font-medium cursor-not-allowed"
                        />
                      </div>
                      <div className="h-9 px-3 text-xs font-medium rounded-md border border-slate-200 bg-slate-100 text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Pre-verified</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                      <span>Email locked to invitation recipient. Verification code is waived.</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          value={email}
                          disabled={otpSent && otpTimer > 0}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-9 px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending || (otpSent && resendCooldown > 0)}
                        className="h-9 px-3.5 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {otpSending ? (
                          <Loader2 className="animate-spin" size={13} />
                        ) : (
                          <Mail size={13} />
                        )}
                        <span>
                          {otpSending
                            ? 'Sending...'
                            : !otpSent
                              ? 'Send Code'
                              : resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Resend Code'}
                        </span>
                      </button>
                    </div>
                    {otpSent && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>
                          Code sent to <strong className="text-slate-700">{email}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpTimer(0);
                            setOtp('');
                          }}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Change email
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* OTP Input & Live 10-Minute Expiration Countdown (Only when NOT invited) */}
              {!isInvited && otpSent && (
                <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-blue-600" />
                      Email Verification Code
                    </span>
                    {otpTimer > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        <Clock size={11} />
                        Expires in {formatTimer(otpTimer)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                        <AlertCircle size={11} />
                        Expired (10 min)
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    disabled={otpTimer === 0}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full h-10 px-3 text-center tracking-widest font-mono text-base font-bold rounded-md border border-slate-300 bg-white text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  {devOtp && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-500">
                        Dev code: <span className="font-bold text-slate-700">{devOtp}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtp)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Auto-fill code
                      </button>
                    </div>
                  )}

                  {otpTimer === 0 && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      Code has expired after 10 minutes. Click &quot;Resend Code&quot; above to receive a fresh verification code.
                    </p>
                  )}
                </div>
              )}

              {/* Password with Strength Indicator */}
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
                    placeholder="Minimum 8 characters with Upper, Number, Symbol"
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

                {/* Real-time Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Password Strength:</span>
                      <span className={`font-semibold ${passwordCriteria.strength.textColor}`}>
                        {passwordCriteria.strength.label}
                      </span>
                    </div>

                    {/* Progress Bar (4 Segments) */}
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-colors ${passwordCriteria.passedCount >= step
                              ? passwordCriteria.strength.color
                              : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>

                    {/* Criteria Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                      {passwordCriteria.checks.map((criterion, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 text-[11px] ${criterion.met ? 'text-emerald-700 font-medium' : 'text-slate-400'
                            }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${criterion.met ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}
                          >
                            <Check size={10} strokeWidth={3} />
                          </span>
                          <span>{criterion.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
                )}
              </div>

              {/* Invitation Token or Link Section */}
              <div>
                {!showInvitationField ? (
                  <button
                    type="button"
                    onClick={() => setShowInvitationField(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <Key size={12} />
                    <span>Have an invitation link or code?</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700">
                        Invitation Code or Link {isInvited ? '(Verified)' : '(Optional)'}
                      </label>
                      {isVerifyingToken && (
                        <span className="text-[10px] text-blue-600 inline-flex items-center gap-1 font-medium">
                          <Loader2 size={10} className="animate-spin" /> Checking invitation...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={invitationToken}
                        onChange={(e) => handleInvitationChange(e.target.value)}
                        onPaste={handleTokenPaste}
                        placeholder="Paste invitation link or code"
                        className={`w-full h-9 px-3 py-1.5 text-xs font-mono rounded-md border text-slate-900 placeholder:text-slate-400 focus:outline-none transition ${
                          tokenValidationMsg
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                            : isInvited
                            ? 'border-emerald-400 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                            : 'border-slate-200 bg-slate-50/60 focus:ring-2 focus:ring-slate-900 focus:bg-white'
                        }`}
                      />
                    </div>
                    {tokenValidationMsg && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} className="shrink-0 text-rose-500" />
                        <span>{tokenValidationMsg}</span>
                      </p>
                    )}
                    {isInvited && (
                      <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                        <Check size={12} className="shrink-0 text-emerald-600" />
                        <span>Verified invitation for {invitationPayload.email}. Verification code is waived.</span>
                      </p>
                    )}
                    {!tokenValidationMsg && !isInvited && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        You can paste the entire invitation link or just the code.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="animate-spin" size={15} />}
                <span>
                  {loading
                    ? 'Creating account...'
                    : isInvited
                      ? 'Accept Invitation & Complete Registration'
                      : 'Create Account'}
                </span>
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
