import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

const SYSTEM_CAPABILITIES = [
  { code: 'VIEW_OTHER_RECORDS', name: 'View Other Records', desc: 'View work logs and timesheets of other staff members' },
  { code: 'REVIEW_TIME', name: 'Review Time', desc: 'Approve, return, or re-open submitted time entries' },
  { code: 'DECIDE_TIME_OFF', name: 'Decide Time Off', desc: 'Approve or decline employee time-off requests' },
  { code: 'MANAGE_CLIENTS_PROJECTS', name: 'Manage Clients & Projects', desc: 'Create and configure clients, projects, and billing rates' },
  { code: 'ASSIGN_PROJECTS', name: 'Assign Projects', desc: 'Assign and remove employees on client projects' },
  { code: 'MANAGE_USERS', name: 'Manage Users', desc: 'Manage user accounts and issue capability grants' },
  { code: 'VIEW_REPORTS', name: 'View Reports', desc: 'Access cross-project summary reports and CSV exports' },
  { code: 'VIEW_ANALYTICS', name: 'View Analytics', desc: 'View utilization rates and billable hours distribution' },
  { code: 'VIEW_BILLING', name: 'View Billing', desc: 'Access sensitive billing rate figures and monetary totals' },
];

export default function DashboardPage() {
  const { user, capabilities, isAdmin, refreshUser } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const testEndpoint = async (url, label) => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      const res = await api.get(url);
      setTestResult({
        success: true,
        label,
        message: res.message || 'Access granted.',
      });
    } catch (err) {
      setTestResult({
        success: false,
        label,
        message: err.message || 'Access denied (403 Forbidden).',
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Authenticated user session and capability evaluation.</p>
        </div>
        <button
          onClick={refreshUser}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Refresh Permissions
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-slate-200 shadow-xs h-fit space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            User Profile
          </div>

          <div>
            <div className="text-base font-semibold text-slate-900">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Account Type</span>
              <span className="font-medium text-slate-900">
                {isAdmin ? 'Administrator' : 'Employee'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Status</span>
              <span className="font-medium text-emerald-700">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">User ID</span>
              <span className="font-mono text-[11px] text-slate-600">
                {user?.id?.slice(0, 12)}...
              </span>
            </div>
          </div>

          {/* Middleware Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-xs font-medium text-slate-700">Test Capability Middleware</div>
            <div className="space-y-1.5">
              <button
                onClick={() => testEndpoint('/api/test/reports-access', 'VIEW_REPORTS Check')}
                disabled={testingEndpoint}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50"
              >
                Test <span className="font-mono text-[11px]">VIEW_REPORTS</span> route
              </button>
              <button
                onClick={() => testEndpoint('/api/test/admin-only', 'ADMIN_ONLY Check')}
                disabled={testingEndpoint}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer disabled:opacity-50"
              >
                Test <span className="font-mono text-[11px]">ADMIN_ONLY</span> route
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded text-xs mt-2 border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-semibold">{testResult.label}</div>
                <div className="text-[11px] mt-0.5">{testResult.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">System Capabilities</h2>
              <p className="text-xs text-slate-500">
                Real-time authorization matrix evaluated per authenticated request.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Capability</th>
                  <th className="py-2.5 px-4 font-medium">Description</th>
                  <th className="py-2.5 px-4 font-medium">Scope</th>
                  <th className="py-2.5 px-4 font-medium text-right">Status</th>
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
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{cap.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{cap.code}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">{cap.desc}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {isHeld ? (
                          isGlobal ? (
                            <span className="text-slate-700">Global</span>
                          ) : (
                            <span className="text-slate-700">
                              {[
                                projectCount > 0 ? `${projectCount} project(s)` : null,
                                userCount > 0 ? `${userCount} user(s)` : null,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isHeld ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Granted
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
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
