import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Tooltip } from '../components/Navbar.jsx';
import api from '../api/client.js';
import { CheckCircle, XCircle, FlaskConical } from 'lucide-react';

const SYSTEM_CAPABILITIES = [
  { code: 'VIEW_OTHER_RECORDS',      name: 'View Other Records',         desc: 'View work logs and timesheets of other staff members' },
  { code: 'REVIEW_TIME',             name: 'Review Time',                desc: 'Approve, return, or re-open submitted time entries' },
  { code: 'DECIDE_TIME_OFF',         name: 'Decide Time Off',            desc: 'Approve or decline employee time-off requests' },
  { code: 'MANAGE_CLIENTS_PROJECTS', name: 'Manage Clients & Projects',  desc: 'Create and configure clients, projects, and billing rates' },
  { code: 'ASSIGN_PROJECTS',         name: 'Assign Projects',            desc: 'Assign and remove employees on client projects' },
  { code: 'MANAGE_USERS',            name: 'Manage Users',               desc: 'Manage user accounts and issue capability grants' },
  { code: 'VIEW_REPORTS',            name: 'View Reports',               desc: 'Access cross-project summary reports and CSV exports' },
  { code: 'VIEW_ANALYTICS',          name: 'View Analytics',             desc: 'View utilization rates and billable hours distribution' },
  { code: 'VIEW_BILLING',            name: 'View Billing',               desc: 'Access sensitive billing rate figures and monetary totals' },
];

export default function DashboardPage() {
  const { user, capabilities, isAdmin } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const testEndpoint = async (url, label) => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      const res = await api.get(url);
      setTestResult({ success: true,  label, message: res.message || 'Access granted.' });
    } catch (err) {
      setTestResult({ success: false, label, message: err.message || 'Access denied.' });
    } finally {
      setTestingEndpoint(false);
    }
  };

  // Count granted capabilities
  const grantedCount = isAdmin
    ? SYSTEM_CAPABILITIES.length
    : SYSTEM_CAPABILITIES.filter((c) => !!capabilities[c.code]).length;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Good{new Date().getHours() < 12 ? ' morning' : new Date().getHours() < 17 ? ' afternoon' : ' evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isAdmin ? 'Administrator' : 'Employee'} · {grantedCount} of {SYSTEM_CAPABILITIES.length} capabilities granted
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Middleware test panel ── */}
        <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-slate-200 h-fit space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capability Test</span>
          </div>
          <p className="text-[11px] text-slate-500">Test live capability middleware against real API endpoints.</p>

          <div className="space-y-2">
            <Tooltip text="Checks if you have VIEW_REPORTS capability" side="right">
              <button
                onClick={() => testEndpoint('/api/test/reports-access', 'VIEW_REPORTS Check')}
                disabled={testingEndpoint}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test <span className="font-mono text-[11px]">VIEW_REPORTS</span> route
              </button>
            </Tooltip>

            <Tooltip text="Checks if you have Administrator access" side="right">
              <button
                onClick={() => testEndpoint('/api/test/admin-only', 'ADMIN_ONLY Check')}
                disabled={testingEndpoint}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test <span className="font-mono text-[11px]">ADMIN_ONLY</span> route
              </button>
            </Tooltip>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded text-xs border ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {testResult.success
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <XCircle className="w-3.5 h-3.5" />}
                {testResult.label}
              </div>
              <div className="text-[11px] mt-0.5 ml-5">{testResult.message}</div>
            </div>
          )}
        </div>

        {/* ── Capabilities matrix ── */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">System Capabilities</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time authorization matrix for your account.</p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {grantedCount}/{SYSTEM_CAPABILITIES.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-5">Capability</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Description</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Scope</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SYSTEM_CAPABILITIES.map((cap) => {
                  const grant = capabilities[cap.code];
                  const isHeld = isAdmin || !!grant;
                  const isGlobal = isAdmin || grant?.isGlobal;
                  const projectCount = grant?.allowedProjectIds?.length || 0;
                  const userCount = grant?.allowedUserIds?.length || 0;

                  return (
                    <tr key={cap.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-5">
                        <div className="font-medium text-slate-900">{cap.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{cap.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 hidden sm:table-cell max-w-xs">
                        {cap.desc}
                      </td>
                      <td className="py-3 px-4 text-slate-600 hidden md:table-cell">
                        {isHeld ? (
                          isGlobal ? (
                            <span className="text-slate-700">Global</span>
                          ) : (
                            <span className="text-slate-700">
                              {[
                                projectCount > 0 ? `${projectCount} project(s)` : null,
                                userCount > 0 ? `${userCount} user(s)` : null,
                              ].filter(Boolean).join(', ')}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isHeld ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Granted
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Denied
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
