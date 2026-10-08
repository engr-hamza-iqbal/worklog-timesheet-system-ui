import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Check,
  Edit3,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { passwordStrengthSchema } from '../validation/formSchemas.js';

const CAPABILITY_LABELS = {
  MANAGE_CLIENTS_PROJECTS: { label: 'Clients & Projects Management', desc: 'Create, update, and manage clients, projects, and billing rates.' },
  MANAGE_USERS: { label: 'User & Team Administration', desc: 'Invite, manage, activate/deactivate users and assign capabilities.' },
  ASSIGN_PROJECTS: { label: 'Project Assignment Control', desc: 'Assign and reassign employees to specific client projects.' },
  REVIEW_TIME: { label: 'Timesheet Review & Approvals', desc: 'Review, approve, or return submitted employee work logs.' },
  VIEW_REPORTS: { label: 'Summary Reports & Exports', desc: 'Access comprehensive timesheet logs, exports, and executive reports.' },
  VIEW_ANALYTICS: { label: 'Insights & Performance Analytics', desc: 'View productivity trends, project breakdown charts, and KPIs.' },
};

export default function ProfilePage() {
  const { user, isAdmin, capabilities, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'security'
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');

  // Password change method: 'oldPassword' | 'otp'
  const [passwordMethod, setPasswordMethod] = useState('oldPassword');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP sending state
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const [otpSentMessage, setOtpSentMessage] = useState('');

  // Status and feedback
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [profileErrorMessage, setProfileErrorMessage] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  // OTP verification state (watch for changes and debounce verification)
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCheckError, setOtpCheckError] = useState('');

  // Countdown timer for OTP cooldown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Watch for OTP changes and debounce verification when 6 digits are typed
  useEffect(() => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 6) {
      setOtpVerifying(false);
      setOtpVerified(false);
      setOtpCheckError('');
      return;
    }

    if (!user?.email || cleanOtp.length !== 6) return;

    setOtpVerifying(true);
    setOtpCheckError('');
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/api/auth/verify-reset-otp', {
          email: user.email,
          otp: cleanOtp,
        });
        if (res.success || res.data?.verified) {
          setOtpVerified(true);
          setOtpCheckError('');
        }
      } catch (err) {
        setOtpVerified(false);
        const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Invalid verification code.';
        setOtpCheckError(msg);
      } finally {
        setOtpVerifying(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [otp, user?.email]);

  // Live password validation criteria
  const passHasMinLength = newPassword.length >= 8;
  const passHasUpper = /[A-Z]/.test(newPassword);
  const passHasLower = /[a-z]/.test(newPassword);
  const passHasDigit = /[0-9]/.test(newPassword);
  const passHasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passMatches = newPassword && newPassword === confirmPassword;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setProfileErrorMessage('');
    setProfileSuccessMessage('');

    if (!name || name.trim().length < 2) {
      setProfileErrorMessage('Full Name must be at least 2 characters long.');
      return;
    }

    setLoadingName(true);
    try {
      const res = await api.put('/api/auth/profile', { name: name.trim() });
      if (res.success) {
        setProfileSuccessMessage('Your profile name has been updated successfully.');
        setIsEditingName(false);
        await refreshUser();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to update profile.';
      setProfileErrorMessage(msg);
    } finally {
      setLoadingName(false);
    }
  };

  const handleSendOtp = async () => {
    setPasswordErrorMessage('');
    setOtpSentMessage('');

    if (!user?.email) return;

    setSendingOtp(true);
    try {
      const res = await api.post('/api/auth/send-reset-otp', { email: user.email }, { timeout: 20000 });
      if (res.success) {
        setOtpSentMessage(res.message || 'Verification code sent to your registered email.');
        setOtpCooldown(45);
        if (res.data?.devOtp) {
          setDevOtp(res.data.devOtp);
          setOtp(res.data.devOtp); // Convenience in local development
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to dispatch verification code.';
      setPasswordErrorMessage(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');

    if (passwordMethod === 'oldPassword' && !oldPassword) {
      setPasswordErrorMessage('Please enter your current password.');
      return;
    }

    if (passwordMethod === 'otp' && (!otp || otp.trim().length !== 6)) {
      setPasswordErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    const parsed = passwordStrengthSchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordErrorMessage(parsed.error.issues[0]?.message || 'Please fulfill all password requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMessage('New password and confirm password do not match.');
      return;
    }

    if (passwordMethod === 'oldPassword' && oldPassword === newPassword) {
      setPasswordErrorMessage('New password must be different from your current password.');
      return;
    }

    setLoadingPassword(true);
    try {
      const payload = {
        mode: passwordMethod,
        newPassword,
      };

      if (passwordMethod === 'oldPassword') {
        payload.oldPassword = oldPassword;
      } else {
        payload.otp = otp.trim();
      }

      const res = await api.put('/api/auth/profile', payload);

      if (res.success) {
        setPasswordSuccessMessage('Your password has been changed successfully.');
        setOldPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setDevOtp(null);
        setOtpSentMessage('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to update password.';
      setPasswordErrorMessage(msg);
    } finally {
      setLoadingPassword(false);
    }
  };

  const memberSinceFormatted = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Active Member';

  const userCapabilitiesList = Object.entries(capabilities || {}).filter(([_, hasCap]) => Boolean(hasCap));

  return (
    <main className="flex-1 max-w-auto w-full mx-auto px-4 py-6 space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Manage your personal profile details, account credentials, and system capabilities.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setProfileErrorMessage('');
              setPasswordErrorMessage('');
            }}
            className={`py-2 px-3 sm:px-3.5 text-xs font-semibold rounded-lg transition text-center cursor-pointer ${activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Profile Overview
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setProfileErrorMessage('');
              setPasswordErrorMessage('');
            }}
            className={`py-2 px-3 sm:px-3.5 text-xs font-semibold rounded-lg transition text-center cursor-pointer ${activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Password & Security
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 w-full">
          {/* Main Profile Info Card */}
          <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-700 text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-md shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">{user?.name}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isAdmin
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                    >
                      {isAdmin ? 'ADMINISTRATOR' : 'EMPLOYEE'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{user?.email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active Account</span>
                  </div>
                </div>
              </div>

              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
              )}
            </div>

            {/* Profile Update Notifications */}
            {profileSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMessage}</span>
              </div>
            )}
            {profileErrorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileErrorMessage}</span>
              </div>
            )}

            {/* Name Edit Form */}
            {isEditingName ? (
              <form onSubmit={handleUpdateName} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter full name"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loadingName}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    {loadingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setName(user?.name || '');
                      setProfileErrorMessage('');
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {/* Account Details Breakdown */}
            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Address</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {user?.email}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Primary communication & login identity</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account Type</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  {isAdmin ? 'System Administrator' : 'Standard Employee'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Determines standard operational scope</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Member Since</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  {memberSinceFormatted}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Account registration date</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Security Status</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Account Credentials Active</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Encrypted and securely protected</div>
              </div>
            </div>
          </div>

          {/* Side Card: Capabilities & Permissions */}
          <div className="lg:col-span-1 xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Granted Capabilities</h3>
            </div>

            {isAdmin ? (
              <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-200 text-xs text-violet-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-violet-600" />
                  <span>Full Administrative Access</span>
                </div>
                <p className="text-[11px] text-violet-700 leading-relaxed">
                  As an Administrator, you have complete global authorization across all modules including user management, billing rates, approvals, audits, and security policies.
                </p>
              </div>
            ) : null}

            {userCapabilitiesList.length > 0 ? (
              <div className="space-y-2.5">
                {userCapabilitiesList.map(([code]) => {
                  const meta = CAPABILITY_LABELS[code] || { label: code, desc: 'Granted system capability' };
                  return (
                    <div key={code} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{meta.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 pl-5">{meta.desc}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !isAdmin && (
                <div className="text-center py-6 text-slate-400">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">Standard Employee Access</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                    You have standard permissions for logging work time and requesting time off.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        /* Password & Security Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 w-full">
          {/* Main Password Update Card */}
          <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 md:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h2>Change Account Password</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Update your account password using your current password or an email verification code.
              </p>
            </div>

            {/* Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold max-w-md">
              <button
                type="button"
                onClick={() => {
                  setPasswordMethod('oldPassword');
                  setPasswordErrorMessage('');
                  setPasswordSuccessMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${passwordMethod === 'oldPassword'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Via Current Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordMethod('otp');
                  setPasswordErrorMessage('');
                  setPasswordSuccessMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${passwordMethod === 'otp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Via Email OTP</span>
              </button>
            </div>

            {passwordSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccessMessage}</span>
              </div>
            )}

            {passwordErrorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordErrorMessage}</span>
              </div>
            )}

            {otpSentMessage && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{otpSentMessage}</span>
              </div>
            )}

            {devOtp && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                <span>Development OTP Code: <strong>{devOtp}</strong></span>
                <span className="text-[10px] text-amber-600">(Auto-filled)</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordMethod === 'oldPassword' ? (
                /* Current Password Input */
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                /* OTP Email Verification Code Section */
                <div className="space-y-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Registered Email</span>
                      <span className="text-xs text-slate-500 font-mono">{user?.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpCooldown > 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      {sendingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {!sendingOtp && <Send className="w-3.5 h-3.5" />}
                      <span>{otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send Verification Code'}</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        6-Digit Verification Code
                      </label>
                      {otpVerifying && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Checking code...
                        </span>
                      )}
                      {otpVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Code verified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(val);
                        setOtpVerified(false);
                        setOtpCheckError('');
                      }}
                      placeholder="123456"
                      className={`w-full h-10 px-3 text-center text-lg font-mono font-bold tracking-widest rounded-lg border bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 transition ${
                        otpVerified
                          ? 'border-emerald-500 text-emerald-700 focus:ring-emerald-500 bg-emerald-50/20'
                          : otpCheckError
                          ? 'border-rose-400 text-rose-700 focus:ring-rose-500 bg-rose-50/20'
                          : otpVerifying
                          ? 'border-blue-400 text-blue-600 focus:ring-blue-500'
                          : 'border-slate-200 text-slate-900 focus:ring-blue-600'
                      }`}
                    />
                    {otpCheckError && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{otpCheckError}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* New Password & Confirm Password responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && !passMatches && (
                    <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>
              </div>

              {/* Password Strength Checklist */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1.5">
                <span className="font-semibold text-slate-700 block mb-1">Password Requirements:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${passHasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passHasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>8+ characters minimum</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passHasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passHasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passHasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passHasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passHasDigit ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passHasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passHasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passHasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    loadingPassword ||
                    !passHasMinLength ||
                    !passHasUpper ||
                    !passHasLower ||
                    !passHasDigit ||
                    !passHasSpecial ||
                    !passMatches ||
                    (passwordMethod === 'otp' && otp.trim().length !== 6)
                  }
                  className="w-full sm:w-auto px-6 h-10 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loadingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loadingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Card: Security Tips & Active Session */}
          <div className="lg:col-span-1 xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Security Best Practices</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Strong Password Advice</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Use a unique combination of uppercase, numbers, and special symbols. Never reuse passwords across business platforms.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Verification (OTP)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Forgot your current password? Switch to the OTP method above to receive a 6-digit verification code sent directly to your registered email.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Session Protection</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your active login session is guarded with anti-CSRF token verification and secure HttpOnly session cookies.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Account
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">{user?.email}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Role: <span className="font-semibold text-slate-700">{isAdmin ? 'Administrator' : 'Standard Employee'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
