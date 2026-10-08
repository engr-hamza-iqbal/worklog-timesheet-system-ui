import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Clock,
  ShieldCheck,
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Briefcase,
  TrendingUp,
  FileCheck,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = useState('timesheet'); // 'timesheet' | 'review' | 'analytics'

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden min-w-0">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-100/40 via-sky-50/40 to-emerald-50/30 blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 mb-4 sm:mb-6 shadow-xs hover:border-slate-300 transition max-w-full">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-800 truncate sm:overflow-visible">Time Tracking &amp; Timesheets Built for Modern Teams</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.18] sm:leading-[1.14]">
              Track project hours.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-800">
                Simplify team timesheets.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal px-1">
              Log daily work in intuitive 15-minute steps, submit weekly timesheets for manager approval, coordinate team time off, and get clean project reports without spreadsheet clutter.
            </p>

            {/* Call To Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto w-full">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/timesheet"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Open My Timesheet</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  >
                    <span>Create an Account</span>
                  </Link>
                </>
              )}
            </div>

            {/* Active User Badge if logged in */}
            {isAuthenticated && user && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-slate-600 bg-slate-100/80 border border-slate-200 max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate max-w-[260px] sm:max-w-none">
                  Signed in as <strong>{user.name}</strong> ({user.email})
                </span>
              </div>
            )}
          </div>

          {/* ── Interactive Application Preview Window ── */}
          <div className="mt-8 sm:mt-12 lg:mt-16 max-w-4xl mx-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg sm:shadow-xl overflow-hidden">
            {/* Window Topbar */}
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-800">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400">app.worklog.io</span>
              </div>
              {/* Preview Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('timesheet')}
                  className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 py-1 sm:px-3 rounded-md transition cursor-pointer font-medium text-[11px] sm:text-xs ${
                    activePreviewTab === 'timesheet'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Timesheet Grid
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('review')}
                  className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 py-1 sm:px-3 rounded-md transition cursor-pointer font-medium text-[11px] sm:text-xs ${
                    activePreviewTab === 'review'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Review Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('analytics')}
                  className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-2.5 py-1 sm:px-3 rounded-md transition cursor-pointer font-medium text-[11px] sm:text-xs ${
                    activePreviewTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Team Activity
                </button>
              </div>
            </div>

            {/* Preview Window Content */}
            <div className="p-3.5 sm:p-5 md:p-6 bg-slate-50/60 min-h-[280px]">
              {activePreviewTab === 'timesheet' && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Overview</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">Monday – Friday · 38.5 hours logged</div>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      4 Days Approved · 1 Day Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <div
                        key={day}
                        className={`bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs ${
                          i === 4 ? 'col-span-2 sm:col-span-1' : ''
                        }`}
                      >
                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">{day}</div>
                        <div className="mt-1 text-sm sm:text-base font-bold text-slate-900">{i === 4 ? '6.5 h' : '8.0 h'}</div>
                        <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                          <span
                            className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              i < 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {i < 4 ? 'APPROVED' : 'DRAFT'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        15m
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Fast 15-Minute Increments</div>
                        <div className="text-[11px] text-slate-500">Quick-picks: 15m, 30m, 45m, 1h, 2h, 4h, 8h or custom</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-semibold text-slate-700">Project:</span>
                      <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 border border-slate-200 truncate max-w-[220px]">
                        Acme Client · Web Platform
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'review' && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Approvals</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">3 Submissions waiting for review</div>
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs">
                        Approve All (110.5 hrs)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { emp: 'Bob Martinez', proj: 'Cloud Migration', hours: '40.0 h', period: 'Current Week' },
                      { emp: 'Sarah Connor', proj: 'Mobile App Refresh', hours: '32.5 h', period: 'Current Week' },
                      { emp: 'David Miller', proj: 'API Integration', hours: '38.0 h', period: 'Current Week' },
                    ].map((row, idx) => (
                      <div key={idx} className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {row.emp[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">{row.emp}</div>
                            <div className="text-[11px] text-slate-500 truncate">{row.proj} · {row.period}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {row.hours}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-1 rounded-md">
                              Approve
                            </span>
                            <span className="text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-100 px-2 sm:px-2.5 py-1 rounded-md">
                              Return with note
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePreviewTab === 'analytics' && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between sm:block">
                      <div className="text-[11px] font-semibold text-slate-500">Approved This Month</div>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 sm:mt-1">1,428.5 <span className="text-xs text-slate-400 font-normal">hrs</span></div>
                    </div>
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between sm:block">
                      <div className="text-[11px] font-semibold text-slate-500">Active Team</div>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 sm:mt-1">24 <span className="text-xs text-slate-400 font-normal">members</span></div>
                    </div>
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between sm:block">
                      <div className="text-[11px] font-semibold text-slate-500">On-Time Submissions</div>
                      <div className="text-lg sm:text-xl font-extrabold text-emerald-600 sm:mt-1">98.2%</div>
                    </div>
                  </div>

                  {/* 2nd Card: Weekly Team Hours Live Activity */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span>Weekly Team Hours</span>
                        <span className="text-[11px] font-normal text-slate-400">· Aug 24 – Aug 28</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          184.5h Logged
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">36.9h/day avg</span>
                      </div>
                    </div>

                    {/* Chart Container with Target Line & Axis */}
                    <div className="relative pt-4 pb-1">
                      {/* 40h Target Reference Line */}
                      <div className="absolute top-7 left-0 right-0 border-b border-dashed border-slate-200 flex items-center justify-end z-0">
                        <span className="text-[10px] font-semibold text-slate-400 bg-white px-1 -translate-y-1/2">
                          40h Target
                        </span>
                      </div>

                      {/* 5 Workday Bars */}
                      <div className="h-28 flex items-end gap-2 sm:gap-4 md:gap-6 relative z-10">
                        {[
                          { day: 'Mon', date: 'Aug 24', clientHours: 30.0, internalHours: 6.5, total: 36.5, heightPct: 75 },
                          { day: 'Tue', date: 'Aug 25', clientHours: 32.0, internalHours: 6.0, total: 38.0, heightPct: 80 },
                          { day: 'Wed', date: 'Aug 26', clientHours: 35.5, internalHours: 7.0, total: 42.5, heightPct: 92 },
                          { day: 'Thu', date: 'Aug 27', clientHours: 31.0, internalHours: 8.0, total: 39.0, heightPct: 82 },
                          { day: 'Fri', date: 'Aug 28', clientHours: 22.5, internalHours: 6.0, total: 28.5, heightPct: 58 },
                        ].map((col) => (
                          <div key={col.day} className="flex-1 flex flex-col items-center h-full justify-end group cursor-default">
                            {/* Value label above bar */}
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1 group-hover:text-indigo-600 transition">
                              {col.total}h
                            </span>
                            {/* 2-Layer Bar: Inactive Full-Height Grey Pillar with Colored Progress Inside */}
                            <div className="w-full max-w-[32px] sm:max-w-[42px] h-full bg-slate-100 rounded-t-lg p-0.5 flex flex-col justify-end transition-all group-hover:bg-slate-200/70 border border-slate-200/50 shadow-inner">
                              <div
                                className="w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-500 shadow-xs"
                                style={{ height: `${col.heightPct}%` }}
                              >
                                <div
                                  className="w-full bg-sky-400"
                                  style={{ height: `${(col.internalHours / col.total) * 100}%` }}
                                  title={`Internal & Approvals: ${col.internalHours}h`}
                                />
                                <div
                                  className="w-full bg-indigo-600"
                                  style={{ height: `${(col.clientHours / col.total) * 100}%` }}
                                  title={`Client Billable: ${col.clientHours}h`}
                                />
                              </div>
                            </div>
                            {/* X-axis Day & Date Labels */}
                            <div className="mt-1.5 sm:mt-2 text-center select-none">
                              <div className="text-[10px] sm:text-[11px] font-bold text-slate-800">{col.day}</div>
                              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{col.date.split(' ')[1]}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chart Legend / Metadata Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                          <span>Client Billable (151.0h)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
                          <span>Internal Review (33.5h)</span>
                        </span>
                      </div>
                      <span className="text-slate-400">100% Timesheets Submitted</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Highlights Strip ── */}
      <section className="border-b border-slate-200 bg-white py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">15-Min</div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Quick-Pick Increments</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">1-Click</div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Manager Approvals</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Synced</div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Time Off &amp; Absences</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Export</div>
              <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Ready CSV Reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-3">
            <BarChart3 size={13} className="text-indigo-600" />
            <span>Built for Productive Teams</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything your team needs to stay on schedule
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-600">
            Clear time tracking that respects employees' time and gives managers complete clarity into project progress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-indigo-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 sm:mb-5 shadow-2xs">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Fast Daily Time Logging</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Log work in seconds using convenient 15-minute quick-picks. Select from assigned projects, write clear descriptions, and edit draft entries anytime before submitting.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 sm:mb-5 shadow-2xs">
              <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Weekly Timesheet Submissions</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              View your whole week on a calendar grid. Check daily and weekly hour totals, verify every project entry, and submit your full timesheet for review in one click.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-sky-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4 sm:mb-5 shadow-2xs">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Straightforward Approvals</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Managers easily review time logged on their assigned projects. Approve clean submissions with a single click, or return entries with clear feedback so employees can adjust.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-amber-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 sm:mb-5 shadow-2xs">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Integrated Time Off &amp; Leave</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Request vacations, sick days, and personal leave within the app. Approved leave appears automatically on weekly timesheets so nobody is marked missing when on holiday.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-violet-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4 sm:mb-5 shadow-2xs">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Project &amp; Client Reports</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Track hours by client, review employee workload splits, and check review queues. Export clean CSV reports anytime for client invoices, budgets, and payroll.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-rose-300 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 sm:mb-5 shadow-2xs">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Automated Reminders</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Never chase unlogged hours manually. Check missing timesheets for any working day and dispatch friendly email reminders with a single button click.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3-Step Process ── */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[at_center_bottom] from-indigo-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              From daily work log to accurate billing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              A smooth workflow that keeps your whole team aligned and records audit-ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 sm:p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
                  STEP 01
                </span>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Log Your Hours</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Staff record daily time against active projects with 15-minute quick-picks and concise task descriptions.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 sm:p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                  STEP 02
                </span>
                <FileCheck className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Submit the Week</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Review weekly totals, verify completed days, and submit timesheets directly to project reviewers.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 sm:p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  STEP 03
                </span>
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Review &amp; Approve</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Managers approve hours in seconds, locking entries for accurate payroll, client invoices, and financial reports.
              </p>
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="mt-10 sm:mt-12 text-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg cursor-pointer w-full sm:w-auto"
            >
              <span>{isAuthenticated ? 'Return to Workspace' : 'Sign in to Work Log'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-700 font-semibold justify-center sm:justify-start">
            <span>Work Log &amp; Timesheet Portal</span>
          </div>
          <p className="text-slate-500">&copy; {new Date().getFullYear()} Work Log. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-slate-500 text-xs font-medium">
            <Link to="/timesheet" className="hover:text-slate-900 transition">Timesheets</Link>
            <span>·</span>
            <Link to="/time-off" className="hover:text-slate-900 transition">Time Off</Link>
            <span>·</span>
            <Link to="/reports" className="hover:text-slate-900 transition">Reports</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
