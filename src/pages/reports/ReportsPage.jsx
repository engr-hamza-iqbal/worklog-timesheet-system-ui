import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../api/client.js';
import { chaseSchema } from '../../validation/formSchemas.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import SummaryReportsTab from './components/SummaryReportsTab.jsx';
import MissingTimesheetsTab from './components/MissingTimesheetsTab.jsx';
import WhoIsAwayTab from './components/WhoIsAwayTab.jsx';
import ReviewQueueTab from './components/ReviewQueueTab.jsx';
import EmployeeTrendsTab from './components/EmployeeTrendsTab.jsx';

export default function ReportsPage() {
  const { isAdmin, capabilities, loading: authLoading } = useAuth();
  const canView = isAdmin || !!capabilities?.VIEW_REPORTS;
  const canViewBilling = isAdmin || !!capabilities?.VIEW_BILLING;
  const { notify } = useNotification();

  // Active Tab: 'summary' | 'missing' | 'away' | 'reviewQueue' | 'employee'
  const [activeTab, setActiveTab] = useState('summary');

  // Summary Tab State
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Missing Timesheets State
  const [missingDate, setMissingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [missingData, setMissingData] = useState(null);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chasing, setChasing] = useState(false);
  const [missingPage, setMissingPage] = useState(1);
  const missingPageSize = 10;

  // Who is Away State
  const [awayDate, setAwayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [awayData, setAwayData] = useState(null);
  const [loadingAway, setLoadingAway] = useState(false);
  const [awayPage, setAwayPage] = useState(1);
  const awayPageSize = 10;

  // Review Queue by Reviewer State
  const [reviewQueueData, setReviewQueueData] = useState(null);
  const [loadingReviewQueue, setLoadingReviewQueue] = useState(false);
  const [expandedReviewerId, setExpandedReviewerId] = useState(null);
  const [reviewerPage, setReviewerPage] = useState(1);
  const reviewerPageSize = 5;

  // Employee Breakdown & Trend State
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [empFilters, setEmpFilters] = useState({ startDate: '', endDate: '', period: 'week' });
  const [empBreakdown, setEmpBreakdown] = useState(null);
  const [empTrend, setEmpTrend] = useState(null);
  const [loadingEmp, setLoadingEmp] = useState(false);

  // Loaders
  async function loadSummary(filterValues = filters) {
    try {
      setLoading(true);
      if (filterValues.startDate && filterValues.endDate && filterValues.endDate < filterValues.startDate) {
        throw new Error('End date cannot be earlier than start date.');
      }
      const params = Object.fromEntries(
        Object.entries(filterValues).filter(([, value]) => Boolean(value))
      );
      const response = await api.get('/api/reports', { params });
      setReport(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load reports.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMissing(dateVal = missingDate) {
    try {
      setLoadingMissing(true);
      const response = await api.get('/api/reports/missing-timesheets', {
        params: { date: dateVal },
      });
      const data = response.data || response;
      setMissingData(data);
      setSelectedUsers([]);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load missing timesheets.');
      }
    } finally {
      setLoadingMissing(false);
    }
  }

  async function loadWhoIsAway(dateVal = awayDate) {
    try {
      setLoadingAway(true);
      const response = await api.get('/api/reports/who-is-away', {
        params: { date: dateVal },
      });
      setAwayData(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load away employees.');
      }
    } finally {
      setLoadingAway(false);
    }
  }

  async function loadReviewQueueByReviewer() {
    try {
      setLoadingReviewQueue(true);
      const response = await api.get('/api/reports/review-queue-by-reviewer');
      setReviewQueueData(response.data || response);
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load review queue summary.');
      }
    } finally {
      setLoadingReviewQueue(false);
    }
  }

  async function loadEmployees() {
    try {
      const response = await api.get('/api/users');
      const users = (response.data || response || []).filter((u) => u.isActive);
      setEmployeeUsers(users);
      if (users.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(users[0].id);
      }
    } catch (err) {
      // Ignore user list fetch errors if permissions are restricted
    }
  }

  async function loadEmployeeDetails(userId = selectedEmployeeId, f = empFilters) {
    if (!userId) return;
    try {
      setLoadingEmp(true);
      const [breakdownRes, trendRes] = await Promise.allSettled([
        api.get('/api/reports/employee-project-breakdown', {
          params: { userId, startDate: f.startDate || undefined, endDate: f.endDate || undefined },
        }),
        api.get('/api/reports/employee-time-trend', {
          params: { userId, period: f.period, startDate: f.startDate || undefined, endDate: f.endDate || undefined },
        }),
      ]);

      if (breakdownRes.status === 'fulfilled') {
        setEmpBreakdown(breakdownRes.value.data || breakdownRes.value);
      }
      if (trendRes.status === 'fulfilled') {
        setEmpTrend(trendRes.value.data || trendRes.value);
      }
    } catch (err) {
      notify.error(err.message || 'Failed to load employee breakdown.');
    } finally {
      setLoadingEmp(false);
    }
  }

  useEffect(() => {
    if (!authLoading && canView) {
      if (activeTab === 'summary' && !report) {
        loadSummary();
      } else if (activeTab === 'missing' && !missingData) {
        loadMissing();
      } else if (activeTab === 'away' && !awayData) {
        loadWhoIsAway();
      } else if (activeTab === 'reviewQueue' && !reviewQueueData) {
        loadReviewQueueByReviewer();
      } else if (activeTab === 'employee' && employeeUsers.length === 0) {
        loadEmployees();
      }
    }
  }, [authLoading, canView, activeTab, report, missingData, awayData, reviewQueueData, employeeUsers.length]);

  useEffect(() => {
    if (activeTab === 'employee' && selectedEmployeeId) {
      loadEmployeeDetails(selectedEmployeeId, empFilters);
    }
  }, [activeTab, selectedEmployeeId, empFilters]);

  function clearFilters() {
    const nextFilters = { startDate: '', endDate: '' };
    setFilters(nextFilters);
    loadSummary(nextFilters);
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    loadSummary(filters);
  }

  async function handleChaseSubmit(e) {
    e.preventDefault();
    const parsed = chaseSchema.safeParse({ date: missingDate, userIds: selectedUsers });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Select at least one employee.');
      return;
    }
    try {
      setChasing(true);
      const res = await api.post('/api/reports/missing-timesheets/chase', parsed.data);
      const data = res.data || res;
      notify.success(
        `Sent ${data.sentCount} reminder(s). ${data.skippedCount ? `${data.skippedCount} skipped (already reminded today).` : ''}`
      );
      await loadMissing(missingDate);
    } catch (err) {
      notify.error(err.message || 'Failed to dispatch reminders.');
    } finally {
      setChasing(false);
    }
  }

  function toggleSelectUser(userId) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function toggleSelectAll() {
    if (!missingData?.employees) return;
    const eligible = missingData.employees.filter((e) => !e.chasedToday).map((e) => e.userId);
    if (selectedUsers.length === eligible.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(eligible);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[400px] w-full max-w-[1680px] items-center justify-center gap-3 px-4 py-12 text-sm text-slate-500">
        <RefreshCw className="animate-spin text-slate-700" size={24} />
        Verifying permissions...
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="mx-auto w-full max-w-[1680px] px-4 py-16 text-center text-sm text-slate-600">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-1 text-slate-500">You are not authorised to view reports.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Database-aggregated hours, financial values, absences, and review backlog auditing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'summary') loadSummary();
              else if (activeTab === 'missing') loadMissing();
              else if (activeTab === 'away') loadWhoIsAway();
              else if (activeTab === 'reviewQueue') loadReviewQueueByReviewer();
              else if (activeTab === 'employee') loadEmployeeDetails();
            }}
            disabled={loading || loadingMissing || loadingAway || loadingReviewQueue || loadingEmp}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw
              size={14}
              className={
                loading || loadingMissing || loadingAway || loadingReviewQueue || loadingEmp
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-200 overflow-x-auto [scrollbar-width:none] touch-pan-x whitespace-nowrap gap-1 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'summary'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Approved Hours & Billing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'missing'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Missing Timesheets & Reminders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('away')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'away'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Who is Away
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviewQueue')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'reviewQueue'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Review Queue by Reviewer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('employee')}
          className={`border-b-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition shrink-0 cursor-pointer ${
            activeTab === 'employee'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Employee Breakdown & Trends
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'summary' && (
        <SummaryReportsTab
          filters={filters}
          setFilters={setFilters}
          handleFilterSubmit={handleFilterSubmit}
          clearFilters={clearFilters}
          loading={loading}
          report={report}
          canViewBilling={canViewBilling}
        />
      )}

      {activeTab === 'missing' && (
        <MissingTimesheetsTab
          missingDate={missingDate}
          setMissingDate={setMissingDate}
          loadMissing={loadMissing}
          loadingMissing={loadingMissing}
          missingData={missingData}
          selectedUsers={selectedUsers}
          toggleSelectUser={toggleSelectUser}
          toggleSelectAll={toggleSelectAll}
          handleChaseSubmit={handleChaseSubmit}
          chasing={chasing}
          isAdmin={isAdmin}
          missingPage={missingPage}
          setMissingPage={setMissingPage}
          missingPageSize={missingPageSize}
        />
      )}

      {activeTab === 'away' && (
        <WhoIsAwayTab
          awayDate={awayDate}
          setAwayDate={setAwayDate}
          loadWhoIsAway={loadWhoIsAway}
          loadingAway={loadingAway}
          awayData={awayData}
          awayPage={awayPage}
          setAwayPage={setAwayPage}
          awayPageSize={awayPageSize}
        />
      )}

      {activeTab === 'reviewQueue' && (
        <ReviewQueueTab
          reviewQueueData={reviewQueueData}
          loadingReviewQueue={loadingReviewQueue}
          expandedReviewerId={expandedReviewerId}
          setExpandedReviewerId={setExpandedReviewerId}
          reviewerPage={reviewerPage}
          setReviewerPage={setReviewerPage}
          reviewerPageSize={reviewerPageSize}
        />
      )}

      {activeTab === 'employee' && (
        <EmployeeTrendsTab
          employeeUsers={employeeUsers}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          empFilters={empFilters}
          setEmpFilters={setEmpFilters}
          loadEmployeeDetails={loadEmployeeDetails}
          loadingEmp={loadingEmp}
          empBreakdown={empBreakdown}
          empTrend={empTrend}
          canViewBilling={canViewBilling}
        />
      )}
    </main>
  );
}
