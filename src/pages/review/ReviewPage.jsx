import React, { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Clock, CalendarDays, Globe } from 'lucide-react';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { entryIdsSchema, reviewReturnSchema, timeOffDecisionSchema } from '../../validation/formSchemas.js';
import ReviewKpiCards from './components/ReviewKpiCards.jsx';
import TimesheetsReviewTab from './components/TimesheetsReviewTab.jsx';
import TimeOffReviewTab from './components/TimeOffReviewTab.jsx';
import ReturnEntryModal from './components/ReturnEntryModal.jsx';
import DeclineTimeOffModal from './components/DeclineTimeOffModal.jsx';

export default function ReviewPage() {
  const { notify } = useNotification();
  const { user, isAdmin, capabilities } = useAuth();
  const canReviewTime = isAdmin || !!capabilities['REVIEW_TIME'];
  const canDecideTimeOff = isAdmin || !!capabilities['DECIDE_TIME_OFF'];

  const [activeTab, setActiveTab] = useState(() => (canReviewTime ? 'timesheets' : (canDecideTimeOff ? 'timeoff' : 'timesheets')));

  useEffect(() => {
    if (!canDecideTimeOff && activeTab === 'timeoff') {
      setActiveTab('timesheets');
    }
  }, [canDecideTimeOff, activeTab]);

  const [allEntries, setAllEntries] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [timeOffPage, setTimeOffPage] = useState(1);
  const TIME_OFF_PER_PAGE = 10;

  const [scope, setScope] = useState(null);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    userQuery: '',
    projectQuery: '',
    startDate: '',
    endDate: '',
  });
  const [comment, setComment] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Sorting state for submitted entries
  const [entrySortField, setEntrySortField] = useState('workDate');
  const [entrySortOrder, setEntrySortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleEntrySort = (field) => {
    if (entrySortField === field) {
      setEntrySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setEntrySortField(field);
      setEntrySortOrder(field === 'workDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  // Sorting state for time off requests
  const [timeOffSortField, setTimeOffSortField] = useState('startDate');
  const [timeOffSortOrder, setTimeOffSortOrder] = useState('desc'); // 'asc' | 'desc'

  const toggleTimeOffSort = (field) => {
    if (timeOffSortField === field) {
      setTimeOffSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTimeOffSortField(field);
      setTimeOffSortOrder(field === 'startDate' ? 'desc' : 'asc');
    }
    setTimeOffPage(1);
  };

  // Load latest entries and pending time off requests from DB
  async function load(isManualRefresh = false) {
    const cacheKey = `review-queue:${user?.id || 'anon'}`;
    if (!isManualRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          setAllEntries(cachedData.entries || []);
          setScope(cachedData.scope || null);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    try {
      setLoading(true);
      const [entriesRes, timeOffRes] = await Promise.allSettled([
        api.get('/api/reviews'),
        canDecideTimeOff
          ? api.get('/api/time-off/requests', { params: { status: 'PENDING' } })
          : Promise.resolve({ data: [] }),
      ]);

      if (entriesRes.status === 'fulfilled') {
        const fetchedEntries = entriesRes.value.data?.entries || [];
        setAllEntries(fetchedEntries);
        setScope(entriesRes.value.data?.scope || null);
        setSelected([]);
        sessionStorage.setItem(cacheKey, JSON.stringify(entriesRes.value.data));
      }

      if (timeOffRes.status === 'fulfilled') {
        const toData = Array.isArray(timeOffRes.value.data) ? timeOffRes.value.data : [];
        setTimeOffRequests(toData);
      }

      if (isManualRefresh) {
        notify.info('Review queue refreshed with latest submissions.');
      }
    } catch (err) {
      if (err.status !== 401 && err.code !== 'ACCOUNT_DEACTIVATED') {
        notify.error(err.message || 'Failed to load review queue.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatic client-side filtering over loaded in-memory data
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (filters.userQuery.trim()) {
        const q = filters.userQuery.trim().toLowerCase();
        const name = (entry.user?.name || '').toLowerCase();
        const email = (entry.user?.email || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }

      if (filters.projectQuery.trim()) {
        const q = filters.projectQuery.trim().toLowerCase();
        const projName = (entry.project?.name || '').toLowerCase();
        if (!projName.includes(q)) return false;
      }

      if (filters.startDate) {
        if (entry.workDate < filters.startDate) return false;
      }

      if (filters.endDate) {
        if (entry.workDate > filters.endDate) return false;
      }

      return true;
    });
  }, [allEntries, filters]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let cmp = 0;
      if (entrySortField === 'employee') {
        cmp = (a.user?.name || '').localeCompare(b.user?.name || '');
      } else if (entrySortField === 'workDate') {
        cmp = (a.workDate || '').localeCompare(b.workDate || '');
      } else if (entrySortField === 'project') {
        cmp = (a.project?.name || '').localeCompare(b.project?.name || '');
      } else if (entrySortField === 'durationMinutes') {
        cmp = (a.durationMinutes || 0) - (b.durationMinutes || 0);
      } else if (entrySortField === 'description') {
        cmp = (a.description || '').localeCompare(b.description || '');
      }
      return entrySortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredEntries, entrySortField, entrySortOrder]);

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedEntries, page]);

  const sortedTimeOff = useMemo(() => {
    return [...timeOffRequests].sort((a, b) => {
      let cmp = 0;
      if (timeOffSortField === 'employee') {
        cmp = (a.user?.name || '').localeCompare(b.user?.name || '');
      } else if (timeOffSortField === 'type') {
        cmp = (a.type?.name || '').localeCompare(b.type?.name || '');
      } else if (timeOffSortField === 'startDate') {
        cmp = (a.startDate || '').localeCompare(b.startDate || '');
      } else if (timeOffSortField === 'days') {
        cmp = (a.days?.length || 1) - (b.days?.length || 1);
      } else if (timeOffSortField === 'reason') {
        cmp = (a.reason || '').localeCompare(b.reason || '');
      }
      return timeOffSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [timeOffRequests, timeOffSortField, timeOffSortOrder]);

  const paginatedTimeOff = useMemo(() => {
    const start = (timeOffPage - 1) * TIME_OFF_PER_PAGE;
    return sortedTimeOff.slice(start, start + TIME_OFF_PER_PAGE);
  }, [sortedTimeOff, timeOffPage]);

  // Total hours across submitted entries
  const totalSubmittedHours = useMemo(() => {
    const totalMins = allEntries.reduce((sum, e) => sum + (e.durationMinutes || Math.round((Number(e.durationHours) || 0) * 60)), 0);
    return (totalMins / 60).toFixed(1);
  }, [allEntries]);

  // Selected entries total hours
  const selectedHours = useMemo(() => {
    const selEntries = allEntries.filter((e) => selected.includes(e.id));
    const mins = selEntries.reduce((sum, e) => sum + (e.durationMinutes || Math.round((Number(e.durationHours) || 0) * 60)), 0);
    return (mins / 60).toFixed(1);
  }, [allEntries, selected]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userQuery: '',
      projectQuery: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.userQuery.trim() ||
    filters.projectQuery.trim() ||
    filters.startDate ||
    filters.endDate
  );

  const toggleAllEntries = (checked) => {
    if (checked) {
      const pageIds = paginatedEntries.map((e) => e.id);
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedEntries.map((e) => e.id));
      setSelected((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  async function approve() {
    if (!selected.length) return;
    const parsed = entryIdsSchema.safeParse({ entryIds: selected });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Select at least one entry.');
      return;
    }
    setConfirmation({
      title: 'Approve submitted entries',
      message: `Are you sure you want to approve ${selected.length} submitted time entries?`,
      confirmLabel: 'Approve entries',
      onConfirm: async () => {
        try {
          setIsProcessing(`Approving ${selected.length} entries...`);
          await api.post('/api/reviews/approve', parsed.data);
          notify.success(`Approved ${selected.length} entries.`);
          setSelected([]);
          setConfirmation(null);
          await load(true);
        } catch (err) {
          notify.error(err.message || 'Failed to approve entries.');
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  async function approveOne(id) {
    const parsed = entryIdsSchema.safeParse({ entryIds: [id] });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Invalid entry.');
      return;
    }
    setConfirmation({
      title: 'Approve time entry',
      message: 'Are you sure you want to approve this submitted time entry?',
      confirmLabel: 'Approve',
      onConfirm: async () => {
        try {
          setIsProcessing('Approving entry...');
          await api.post('/api/reviews/approve', parsed.data);
          notify.success('Entry approved.');
          setSelected((prev) => prev.filter((item) => item !== id));
          setConfirmation(null);
          await load(true);
        } catch (err) {
          notify.error(err.message || 'Failed to approve entry.');
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  async function returnEntry() {
    if (!returningId) return;
    const parsed = reviewReturnSchema.safeParse({ entryId: returningId, comment });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Provide a reason (at least 5 characters).');
      return;
    }
    try {
      setIsProcessing('Returning entry...');
      await api.post('/api/reviews/return', parsed.data);
      notify.success('Entry returned to employee with comment.');
      setReturningId(null);
      setComment('');
      setSelected((prev) => prev.filter((id) => id !== returningId));
      await load(true);
    } catch (err) {
      notify.error(err.message || 'Failed to return entry.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleApproveTimeOff(reqItem) {
    const parsed = timeOffDecisionSchema.safeParse({ decision: 'APPROVED', comment: '' });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Decision error.');
      return;
    }
    setConfirmation({
      title: 'Approve Time Off Request',
      message: `Approve time off request for ${reqItem.user?.name || 'Employee'} (${reqItem.startDate} to ${reqItem.endDate})?`,
      confirmLabel: 'Approve Time Off',
      tone: 'primary',
      onConfirm: async () => {
        try {
          setIsProcessing('Approving time off...');
          await api.post(`/api/time-off/requests/${reqItem.id}/decide`, parsed.data);
          notify.success('Time off request approved.');
          setConfirmation(null);
          await load(true);
        } catch (err) {
          notify.error(err.message || 'Failed to approve time off request.');
          setConfirmation(null);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  }

  function handleOpenDeclineTimeOff(reqItem) {
    setDeclineTarget(reqItem);
    setDeclineReason('');
  }

  async function confirmDeclineTimeOff() {
    if (!declineTarget) return;
    const parsed = timeOffDecisionSchema.safeParse({ decision: 'DECLINED', comment: declineReason });
    if (!parsed.success) {
      notify.warn(parsed.error.issues[0]?.message || 'Provide an explanation (at least 3 characters).');
      return;
    }
    try {
      setIsProcessing('Declining time off...');
      await api.post(`/api/time-off/requests/${declineTarget.id}/decide`, parsed.data);
      notify.success('Time off request declined.');
      setDeclineTarget(null);
      setDeclineReason('');
      await load(true);
    } catch (err) {
      notify.error(err.message || 'Failed to decline time off request.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-auto px-4 py-4 sm:px-6">
      {/* ── Page Header & Quick Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs sm:text-sm text-slate-500">
            Review submitted timesheets and decide time off requests within your authorized scope.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {scope && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <Globe size={13} className="text-slate-500" />
              <span>{scope.isGlobal ? 'Global Scope' : `${scope.allowedProjectIds?.length || 0} Projects Scoped`}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            title="Refresh review queue"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-slate-900' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards Row ── */}
      <ReviewKpiCards
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allEntriesCount={allEntries.length}
        totalSubmittedHours={totalSubmittedHours}
        canDecideTimeOff={canDecideTimeOff}
        timeOffRequestsCount={timeOffRequests.length}
        selectedCount={selected.length}
        selectedHours={selectedHours}
      />

      {/* ── Modern Pill Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timesheets')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'timesheets'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={14} />
          <span>Timesheet Submissions</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'timesheets' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {allEntries.length}
          </span>
        </button>

        {canDecideTimeOff && (
          <button
            type="button"
            onClick={() => setActiveTab('timeoff')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'timeoff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays size={14} />
            <span>Time Off Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'timeoff' ? 'bg-white/20 text-white' : (timeOffRequests.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700')
            }`}>
              {timeOffRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* ── Active Tab Content ── */}
      {activeTab === 'timesheets' ? (
        <TimesheetsReviewTab
          filters={filters}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          selected={selected}
          setSelected={setSelected}
          approve={approve}
          approveOne={approveOne}
          setReturningId={setReturningId}
          loading={loading}
          isProcessing={isProcessing}
          selectedHours={selectedHours}
          filteredEntries={filteredEntries}
          allEntries={allEntries}
          paginatedEntries={paginatedEntries}
          toggleAllEntries={toggleAllEntries}
          entrySortField={entrySortField}
          entrySortOrder={entrySortOrder}
          toggleEntrySort={toggleEntrySort}
          page={page}
          setPage={setPage}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      ) : (
        <TimeOffReviewTab
          timeOffRequests={timeOffRequests}
          paginatedTimeOff={paginatedTimeOff}
          timeOffSortField={timeOffSortField}
          timeOffSortOrder={timeOffSortOrder}
          toggleTimeOffSort={toggleTimeOffSort}
          timeOffPage={timeOffPage}
          setTimeOffPage={setTimeOffPage}
          timeOffPerPage={TIME_OFF_PER_PAGE}
          handleApproveTimeOff={handleApproveTimeOff}
          handleOpenDeclineTimeOff={handleOpenDeclineTimeOff}
          isProcessing={isProcessing}
        />
      )}

      {/* ── Return Entry Comment Modal ── */}
      <ReturnEntryModal
        returningId={returningId}
        setReturningId={setReturningId}
        comment={comment}
        setComment={setComment}
        returnEntry={returnEntry}
        isProcessing={isProcessing}
      />

      {/* ── Decline Time Off Request Modal ── */}
      <DeclineTimeOffModal
        declineTarget={declineTarget}
        setDeclineTarget={setDeclineTarget}
        declineReason={declineReason}
        setDeclineReason={setDeclineReason}
        confirmDeclineTimeOff={confirmDeclineTimeOff}
        isProcessing={isProcessing}
      />

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        onClose={() => (isProcessing ? null : setConfirmation(null))}
        onConfirm={confirmation?.onConfirm}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
        loading={isProcessing}
      />
    </main>
  );
}
