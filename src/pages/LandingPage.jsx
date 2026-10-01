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
  Layers,
  Sparkles,
  ChevronRight,
  Building2,
  Check,
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
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-800">Enterprise Time Tracking &amp; Governance</span>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-600 font-medium">v2.0 Active</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Precision work logging,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-800">
                zero spreadsheet drift.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Capture daily billable hours in 15-minute increments against assigned client projects. Route submissions through scoped review queues and unlock aggregated SQL analytics in real time.
            </p>

            {/* Call To Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <span>Launch Workspace</span>
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
                    <span>Sign in to Workspace</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  >
                    <span>Register New Account</span>
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
                <span className="ml-2 text-xs font-mono text-slate-400">worklog.internal.portal</span>
              </div>
              {/* Preview Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('timesheet')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${activePreviewTab === 'timesheet'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Timesheet Grid
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('review')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${activePreviewTab === 'review'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Review Queue
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('analytics')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${activePreviewTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Analytics &amp; KPI
                </button>
              </div>
            </div>

            {/* Preview Window Content */}
            <div className="p-6 bg-slate-50/60 min-h-[300px]">
              {activePreviewTab === 'timesheet' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Period</div>
                      <div className="text-sm font-bold text-slate-900">Mon, Aug 24 - Sun, Aug 30 (38.5 hrs logged)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      3 Days Submitted · 2 Approved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['Mon Aug 24', 'Tue Aug 25', 'Wed Aug 26', 'Thu Aug 27', 'Fri Aug 28'].map((day, i) => (
                      <div key={day} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-500">{day}</div>
                        <div className="mt-1 text-base font-bold text-slate-900">{i === 4 ? '6.5 h' : '8.0 h'}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${i < 2 ? 'bg-emerald-100 text-emerald-800' : i < 4 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {i < 2 ? 'APPROVED' : i < 4 ? 'SUBMITTED' : 'DRAFT'}
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
                        <div className="text-xs font-semibold text-slate-900">Precision Increments Enforced</div>
                        <div className="text-[11px] text-slate-500">Quick-pick durations: 0.25h, 0.5h, 0.75h, 1.0h, 2.0h, 4.0h, 8.0h</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Project:</span>
                      <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 border border-slate-200">
                        Acme SaaS - Migration
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'review' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scoped Approval Queue</div>
                      <div className="text-sm font-bold text-slate-900">4 Submissions awaiting decision</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs">
                        Bulk Approve All
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { emp: 'Bob Martinez', proj: 'Cloud Infrastructure', hours: '40.0 h', period: 'Week of Aug 24' },
                      { emp: 'Sarah Connor', proj: 'Mobile App Redesign', hours: '32.5 h', period: 'Week of Aug 24' },
                      { emp: 'David Miller', proj: 'API Integration Hub', hours: '38.0 h', period: 'Week of Aug 24' },
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
                            Return...
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
                      <div className="text-[11px] font-semibold text-slate-500">Total Approved</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">1,428.5 <span className="text-xs text-slate-400 font-normal">hrs</span></div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">Active Contributors</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">24 <span className="text-xs text-slate-400 font-normal">staff</span></div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">Approval Rate</div>
                      <div className="text-xl font-extrabold text-emerald-600 mt-1">98.2%</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
                      <span>Weekly Hours Momentum</span>
                      <span className="text-indigo-600">SQL Database Aggregated</span>
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

      {/* ── Key Metrics Strip ── */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">0.25 h</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Precision Step</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">100%</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Audit Trail Logging</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dynamic</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Scoped Access Control</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Instant</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Automated Notifications</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Capabilities Grid ── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-3">
            <Zap size={13} />
            <span>Built For Production Scale</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for enterprise rigor
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            From granular capability delegation to immutable financial reporting, every touchpoint is designed for reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-indigo-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">15-Minute Precision Recording</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Enforce strict quarter-hour steps (0.25h, 0.5h, 0.75h) with project assignment verification, 24-hour daily limits, and draft/submitted status management.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-emerald-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Capability-Based Access Control</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Eliminate rigid roles. Administrators grant granular capabilities (review time, decide time off, view rates) with project scopes and auto-expiring dates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-sky-300">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5 shadow-2xs">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Audited Review Queue</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Reviewers inspect time entries strictly within their scope. Approve days or entire weeks at once, or return entries with mandatory explanatory comments.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-amber-300">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5 shadow-2xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Absence &amp; Leave Integration</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Differentiate genuine leave from forgotten timesheets. Approved absences display directly on weekly timesheet grids and are excluded from missing audits.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-violet-300">
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-5 shadow-2xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Interactive Analytics &amp; Charts</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Real-time Recharts visualizations: weekly hour momentum, client distribution donuts, and top project / contributor performance rankings.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glow-card bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-rose-300">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5 shadow-2xs">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Audit &amp; Email Chases</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Async email notifications for returned timesheets, time-off approvals, and administrative missing timesheet chases, logged in full in the email audit database.
            </p>
          </div>
        </div>
      </section>

      {/* ── Workflow Lifecycle Stepper ── */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[at_center_bottom] from-indigo-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Lifecycle Architecture
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              From daily entry to locked financial record
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              A disciplined, three-tier state machine guarantees data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded">
                  STAGE 01
                </span>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Record &amp; Edit</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Log daily hours in 15-minute increments against active assigned projects. Employees freely edit, adjust, and preview their week.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded">
                  STAGE 02
                </span>
                <FileCheck className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Submit for Review</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Submit individual days or entire weeks. Entries immediately lock against employee modification and route to reviewers holding assigned project scopes.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-6 backdrop-blur-md relative hover:border-slate-600 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  STAGE 03
                </span>
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-white">Approve &amp; Lock</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Approved entries become immutable billing data. Returned entries notify the employee immediately with reviewer comments to correct and resubmit.
              </p>
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="mt-12 text-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg cursor-pointer"
            >
              <span>{isAuthenticated ? 'Return to Dashboard' : 'Get Started with Work Log'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Work Log &amp; Timesheet System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>Enterprise Edition</span>
            <span>·</span>
            <span>Security Compliant</span>
            <span>·</span>
            <span>PostgreSQL &amp; Prisma</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
