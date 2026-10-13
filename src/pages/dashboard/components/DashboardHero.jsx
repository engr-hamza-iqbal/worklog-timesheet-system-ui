import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Shield,
  User,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';
import { SYSTEM_CAPABILITIES } from '../constants/dashboardConstants.js';

export default function DashboardHero({
  greetingTime,
  userName,
  scrollToCapabilities,
  grantedCount,
  percentageGranted,
  isAdmin,
  projectsCount,
  activeProjectsRoute,
  activeProjectsSubtitle,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-2xl bg-gradient-to-r from-[#0C1236] via-[#161F55] to-[#12193E] p-6 sm:p-7 lg:p-8 text-white shadow-xl mb-6 border border-[#232F6B]/40">
      {/* Soft background ambient glows */}
      <div className="absolute right-1/3 top-0 -mt-10 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 bottom-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Greeting & Summary */}
        <div className="md:col-span-7 lg:col-span-5 flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/90 mb-2">
            WELCOME BACK
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2.5">
            {greetingTime}, {userName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mb-6 font-normal">
            Here&apos;s what&apos;s happening with your workspace. Track authorization coverage,
            review access scopes, and manage your organization&apos;s resources.
          </p>

          <div>
            <button
              type="button"
              onClick={scrollToCapabilities}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-md w-fit cursor-pointer"
            >
              <span>Go to Capabilities</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Middle 3D Floating Glass Shield Illustration */}
        <div className="hidden lg:flex lg:col-span-3 items-center justify-center relative min-h-[170px]">
          <div className="relative w-full h-full flex items-center justify-center py-2">
            {/* Subtle orbital dashed circle */}
            <svg className="absolute w-52 h-52 pointer-events-none opacity-25" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="#818CF8"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
            </svg>

            {/* Background Glass Tablet */}
            <div className="relative w-36 h-44 rounded-2xl bg-gradient-to-br from-indigo-500/25 via-blue-500/15 to-slate-900/40 border border-white/20 backdrop-blur-md shadow-xl rotate-[14deg] translate-x-4 -translate-y-2 p-3.5 flex flex-col justify-between pointer-events-none">
              <div className="space-y-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-400/40 border border-white/20" />
                <div className="h-2 w-16 bg-white/30 rounded-full" />
                <div className="h-1.5 w-20 bg-white/20 rounded-full" />
                <div className="h-1.5 w-14 bg-white/15 rounded-full" />
              </div>
              <div className="h-2 w-10 bg-indigo-300/30 rounded-full self-end" />
            </div>

            {/* Foreground Floating Glass Shield */}
            <div className="absolute w-32 h-40 rounded-2xl bg-gradient-to-br from-white/20 via-indigo-500/25 to-slate-900/40 border border-white/30 backdrop-blur-xl shadow-2xl -rotate-[10deg] -translate-x-4 translate-y-2 flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-18 rounded-2xl bg-gradient-to-b from-[#38BDF8] via-[#4F46E5] to-[#312E81] border border-cyan-200/50 shadow-xl flex items-center justify-center shadow-indigo-500/40">
                  <ShieldCheck className="w-9 h-9 text-white drop-shadow-md" />
                </div>
              </div>
            </div>

            {/* Glowing Particle Accents */}
            <div className="absolute top-3 right-6 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute bottom-5 left-5 w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_6px_#818cf8]" />
          </div>
        </div>

        {/* Right Column: 3 Glass Metric Cards */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-3 justify-center">
          {/* Widget 1: Authorization Coverage */}
          <div
            onClick={scrollToCapabilities}
            className="bg-[#0E1738]/80 hover:bg-[#131F4A]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-sm flex items-center justify-between gap-4 transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Mini Donut Progress Ring */}
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#1E2958]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400 transition-all duration-700"
                    strokeDasharray={`${percentageGranted}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300">
                  Authorization Coverage
                </div>
                <div className="text-lg font-bold text-white flex items-baseline gap-2 mt-0.5">
                  <span>{grantedCount} / {SYSTEM_CAPABILITIES.length}</span>
                  <span className="text-xs font-semibold text-cyan-400">{percentageGranted}%</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {percentageGranted === 100
                    ? 'All capabilities authorized'
                    : `${grantedCount} capabilities authorized`}
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-slate-300" />
            </div>
          </div>

          {/* Widget 2: Assigned Role */}
          <Link
            to="/profile"
            className="bg-[#0E1738]/80 hover:bg-[#131F4A]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-sm flex items-center justify-between gap-3 transition cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300">Assigned Role</div>
                <div className="text-sm font-bold text-white truncate">
                  {isAdmin ? 'Administrator' : 'Employee'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {isAdmin ? 'Full system access' : 'Standard workspace access'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </Link>

          {/* Widget 3: Active Projects */}
          <Link
            to={activeProjectsRoute}
            className="bg-[#0E1738]/80 hover:bg-[#131F4A]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-sm flex items-center justify-between gap-3 transition cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FolderOpen size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-slate-300">Active Projects</div>
                <div className="text-sm font-bold text-white flex items-baseline gap-1.5 truncate">
                  <span>{projectsCount}</span>
                  <span className="text-xs font-normal text-slate-300">{activeProjectsSubtitle}</span>
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
