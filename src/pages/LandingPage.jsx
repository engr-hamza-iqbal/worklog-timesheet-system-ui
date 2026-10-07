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
  Sparkles,
  Zap,
  TrendingUp,
  FileCheck,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = useState('timesheet'); // 'timesheet' | 'review' | 'analytics'

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-100/40 via-sky-50/40 to-emerald-50/30 blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 mb-6 shadow-xs hover:border-slate-300 transition">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-800">Time Tracking &amp; Timesheets Built for Modern Teams</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
              Track project hours.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-800">
                Simplify team timesheets.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Log daily work in intuitive 15-minute steps, submit weekly timesheets for manager approval, coordinate team time off, and get clean project reports without spreadsheet clutter.
            </p>

            {/* Call To Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/timesheet"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Open My Timesheet</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  >
                    <span>Create an Account</span>
                  </Link>
                </>
              )}
            </div>

            {/* Active User Badge if logged in */}
            {isAuthenticated && user && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-slate-600 bg-slate-100/80 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Signed in as <strong>{user.name}</strong> ({user.email})</span>
              </div>
            )}
          </div>

          {/* ── Interactive Application Preview Window ── */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Window Topbar */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">app.worklog.io</span>
              </div>
              {/* Preview Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('timesheet')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
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
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
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
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                    activePreviewTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Team Summary
                </button>
              </div>
            </div>

            {/* Preview Window Content */}
            <div className="p-6 bg-slate-50/60 min-h-[300px]">
              {activePreviewTab === 'timesheet' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Overview</div>
                      <div className="text-sm font-bold text-slate-900">Monday – Friday · 38.5 hours logged</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      4 Days Approved · 1 Day Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <div key={day} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500">{day}</div>
                        <div className="mt-1 text-base font-bold text-slate-900">{i === 4 ? '6.5 h' : '8.0 h'}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              i < 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {i < 4 ? 'APPROVED' : 'DRAFT'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        15m
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Fast 15-Minute Increments</div>
                        <div className="text-[11px] text-slate-500">Quick-picks: 15m, 30m, 45m, 1h, 2h, 4h, 8h or custom</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Project:</span>
                      <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 border border-slate-200">
                        Acme Client · Web Platform
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'review' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manager Approvals</div>
                      <div className="text-sm font-bold text-slate-900">3 Submissions waiting for review</div>
                    </div>
                    <div className="flex gap-2">
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
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                            {row.emp[0]}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{row.emp}</div>
                            <div className="text-[11px] text-slate-500">{row.proj} · {row.period}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {row.hours}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            Approve
                          </span>
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                            Return with note
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePreviewTab === 'analytics' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">Approved This Month</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">1,428.5 <span className="text-xs text-slate-400 font-normal">hrs</span></div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">Active Team</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">24 <span className="text-xs text-slate-400 font-normal">members</span></div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">On-Time Submissions</div>
                      <div className="text-xl font-extrabold text-emerald-600 mt-1">98.2%</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
                      <span>Weekly Team Hours</span>
                      <span className="text-indigo-600 font-medium">Live Activity</span>
                    </div>
                    <div className="h-24 flex items-end gap-2 pt-2 border-b border-slate-100">
                      {[40, 65, 80, 55, 90, 85, 95, 75, 88, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 to-sky-500 rounded-t transition-all group-hover:brightness-110"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Highlights Strip ── */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">15-Min</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Quick-Pick Increments</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">1-Click</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Manager Approvals</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Synced</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Time Off &amp; Absences</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Export</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Ready CSV Reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-3">
            <Zap size={13} />
            <span>Built for Productive Teams</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything your team needs to stay on schedule
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Clear time tracking that respects employees' time and gives managers complete clarity into project progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Fast Daily Time Logging</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Log work in seconds using convenient 15-minute quick-picks. Select from assigned projects, write clear descriptions, and edit draft entries anytime before submitting.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-emerald-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-2xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Weekly Timesheet Submissions</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              View your whole week on a calendar grid. Check daily and weekly hour totals, verify every project entry, and submit your full timesheet for review in one click.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-sky-300 transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5 shadow-2xs">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Straightforward Approvals</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Managers easily review time logged on their assigned projects. Approve clean submissions with a single click, or return entries with clear feedback so employees can adjust.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-amber-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5 shadow-2xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Integrated Time Off &amp; Leave</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Request vacations, sick days, and personal leave within the app. Approved leave appears automatically on weekly timesheets so nobody is marked missing when on holiday.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-violet-300 transition">
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-5 shadow-2xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Project &amp; Client Reports</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Track hours by client, review employee workload splits, and check review queues. Export clean CSV reports anytime for client invoices, budgets, and payroll.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-rose-300 transition">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5 shadow-2xs">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Reminders</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Never chase unlogged hours manually. Check missing timesheets for any working day and dispatch friendly email reminders with a single button click.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3-Step Process ── */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[at_center_bottom] from-indigo-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              From daily work log to accurate billing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              A smooth workflow that keeps your whole team aligned and records audit-ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
                  STEP 01
                </span>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Log Your Hours</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Staff record daily time against active projects with 15-minute quick-picks and concise task descriptions.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                  STEP 02
                </span>
                <FileCheck className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Submit the Week</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Review weekly totals, verify completed days, and submit timesheets directly to project reviewers.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  STEP 03
                </span>
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Review &amp; Approve</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Managers approve hours in seconds, locking entries for accurate payroll, client invoices, and financial reports.
              </p>
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="mt-12 text-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg cursor-pointer"
            >
              <span>{isAuthenticated ? 'Return to Workspace' : 'Sign in to Work Log'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span>Work Log &amp; Timesheet Portal</span>
          </div>
          <p className="text-slate-500">&copy; {new Date().getFullYear()} Work Log. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-medium">
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
