import React from 'react';
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
  Database,
  Building2,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 bg-white">
        <div className="absolute inset-0 bg-radial-[at_top_right] from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-6 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Enterprise Time Tracking &amp; Access Control</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Replace the spreadsheet with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800">
                precision timesheets.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Empower employees to record daily work against assigned projects, streamline capability-scoped approvals,
              and aggregate audit-trailed billing hours and analytics in real time.
            </p>

            {/* Call To Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/timesheet"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>My Timesheet</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <span>Sign in to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span>Register New Account</span>
                  </Link>
                </>
              )}
            </div>

            {/* Active User Badge if logged in */}
            {isAuthenticated && user && (
              <div className="mt-4 text-xs text-slate-500 font-medium">
                Signed in as <span className="font-semibold text-slate-800">{user.name}</span> ({user.email})
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Core Capabilities Grid ── */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            System Capabilities
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-slate-900">
            Engineered for real-world enterprise requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">15-Minute Precision Recording</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Enforce strict quarter-hour steps (0.25h, 0.5h, 0.75h) with project assignment verification, 24-hour daily limits, and draft/submitted status management.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Capability-Based Access Control</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Avoid brittle fixed roles. Administrators grant granular capabilities (review time, decide time off, view rates) with project scopes and auto-expiring dates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-4">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Audited Review Queue</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Reviewers inspect time entries strictly within their scope. Approve days or entire weeks at once, or return entries with required explanatory comments.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-4">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Absence &amp; Time Off Tracking</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Differentiate genuine leave from forgotten timesheets. Approved absences display directly on weekly timesheet grids and are excluded from missing audits.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">SQL Aggregated Analytics</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Perform high-performance groupings in the database: hours by week, client billable values, employee comparisons, and missing timesheet identification.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Automated Email Notifications</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Async email alerts via Nodemailer for returned timesheets, time-off decisions, and administrative missing timesheet chases, logged in full for audit.
            </p>
          </div>
        </div>
      </section>

      {/* ── Workflow Lifecycle Banner ── */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Timesheet Lifecycle
            </h2>
            <p className="mt-2 text-2xl font-semibold text-white">
              From daily entry to locked financial record
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-5">
              <span className="text-xs font-bold text-slate-400">Step 1</span>
              <h3 className="text-base font-semibold text-white mt-1">Record &amp; Edit</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Log daily hours in 15-minute increments against active assigned projects. Freely edit or delete draft entries.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-5">
              <span className="text-xs font-bold text-slate-400">Step 2</span>
              <h3 className="text-base font-semibold text-white mt-1">Submit for Review</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Submit days or full weeks. Entries lock against employee modification and route to reviewers holding authorized project scope.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-5">
              <span className="text-xs font-bold text-slate-400">Step 3</span>
              <h3 className="text-base font-semibold text-white mt-1">Approve &amp; Lock</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Approved entries become immutable billing data. Returned entries notify the employee immediately with feedback to correct and resubmit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Work Log &amp; Timesheet System. All rights reserved.</p>
      </footer>
    </div>
  );
}
