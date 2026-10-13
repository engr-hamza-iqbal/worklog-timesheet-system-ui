import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { SYSTEM_CAPABILITIES } from './constants/dashboardConstants.js';
import DashboardHero from './components/DashboardHero.jsx';
import DashboardKpis from './components/DashboardKpis.jsx';
import CapabilitiesTable from './components/CapabilitiesTable.jsx';

export default function DashboardPage() {
  const { user, capabilities, isAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'GRANTED' | 'RESTRICTED'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [expandedScopeCaps, setExpandedScopeCaps] = useState(new Set());
  const [activeMenuCap, setActiveMenuCap] = useState(null);
  const [projectsCount, setProjectsCount] = useState(4);
  const [pendingCount, setPendingCount] = useState(3);
  const filterMenuRef = useRef(null);
  const actionMenuRef = useRef(null);

  const canManageProjects = Boolean(isAdmin || capabilities?.MANAGE_CLIENTS_PROJECTS);
  const activeProjectsRoute = canManageProjects ? '/clients' : '/timesheet';
  const activeProjectsSubtitle = canManageProjects ? 'Projects under management' : 'Active assigned projects';

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveMenuCap(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real counts for metric cards with fallbacks
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const [projectsRes, reviewsRes, timeOffRes] = await Promise.allSettled([
          api.get('/api/projects', { params: { activeOnly: true } }),
          isAdmin || capabilities?.REVIEW_TIME
            ? api.get('/api/reviews')
            : Promise.resolve({ data: { entries: [] } }),
          isAdmin || capabilities?.DECIDE_TIME_OFF
            ? api.get('/api/time-off/requests', { params: { status: 'PENDING' } })
            : Promise.resolve({ data: [] }),
        ]);

        if (projectsRes.status === 'fulfilled') {
          const list = Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data
            : projectsRes.value.data?.projects || [];
          setProjectsCount(list.length);
        }

        let pending = 0;
        if (reviewsRes.status === 'fulfilled') {
          const revEntries = reviewsRes.value.data?.entries || [];
          pending += revEntries.length;
        }
        if (timeOffRes.status === 'fulfilled') {
          const toRequests = Array.isArray(timeOffRes.value.data)
            ? timeOffRes.value.data
            : [];
          pending += toRequests.length;
        }
        setPendingCount(pending);
      } catch {
        // Fallback gracefully to default previews
      }
    }

    fetchDashboardStats();
  }, [isAdmin, capabilities]);

  const toggleScopeExpanded = (code) => {
    setExpandedScopeCaps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const scrollToCapabilities = () => {
    const el = document.getElementById('capabilities-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch {
      // Refresh error handled silently
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Count granted capabilities
  const grantedCount = isAdmin
    ? SYSTEM_CAPABILITIES.length
    : SYSTEM_CAPABILITIES.filter((c) => !!capabilities[c.code]).length;

  const percentageGranted = Math.round(
    (grantedCount / SYSTEM_CAPABILITIES.length) * 100
  );

  // Filtered and sorted capabilities list
  const filteredCapabilities = useMemo(() => {
    let list = SYSTEM_CAPABILITIES;

    if (statusFilter !== 'ALL') {
      list = list.filter((c) => {
        const isHeld = isAdmin || !!capabilities[c.code];
        return statusFilter === 'GRANTED' ? isHeld : !isHeld;
      });
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'desc') {
        comparison = a.desc.localeCompare(b.desc);
      } else if (sortField === 'status') {
        const aHeld = isAdmin || !!capabilities[a.code] ? 1 : 0;
        const bHeld = isAdmin || !!capabilities[b.code] ? 1 : 0;
        comparison = aHeld - bHeld;
      } else if (sortField === 'scope') {
        const aGlobal =
          isAdmin || capabilities[a.code]?.isGlobal
            ? 2
            : capabilities[a.code]
              ? 1
              : 0;
        const bGlobal =
          isAdmin || capabilities[b.code]?.isGlobal
            ? 2
            : capabilities[b.code]
              ? 1
              : 0;
        comparison = aGlobal - bGlobal;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filterQuery, statusFilter, sortField, sortOrder, isAdmin, capabilities]);

  const greetingTime = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <main className="flex-1 max-w-auto w-full mx-auto px-4 py-6 sm:px-6">
      {/* ── Welcome Greeting Hero Card ── */}
      <DashboardHero
        greetingTime={greetingTime}
        userName={userName}
        scrollToCapabilities={scrollToCapabilities}
        grantedCount={grantedCount}
        percentageGranted={percentageGranted}
        isAdmin={isAdmin}
        projectsCount={projectsCount}
        activeProjectsRoute={activeProjectsRoute}
        activeProjectsSubtitle={activeProjectsSubtitle}
      />

      {/* ── Quick KPI Metric Cards Row ── */}
      <DashboardKpis
        setStatusFilter={setStatusFilter}
        scrollToCapabilities={scrollToCapabilities}
        grantedCount={grantedCount}
        isAdmin={isAdmin}
        capabilities={capabilities}
        pendingCount={pendingCount}
        projectsCount={projectsCount}
        activeProjectsRoute={activeProjectsRoute}
        activeProjectsSubtitle={activeProjectsSubtitle}
      />

      {/* ── System Capabilities Table Card ── */}
      <CapabilitiesTable
        filteredCapabilities={filteredCapabilities}
        filterQuery={filterQuery}
        setFilterQuery={setFilterQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showFilterMenu={showFilterMenu}
        setShowFilterMenu={setShowFilterMenu}
        filterMenuRef={filterMenuRef}
        actionMenuRef={actionMenuRef}
        handleRefresh={handleRefresh}
        refreshing={refreshing}
        sortField={sortField}
        sortOrder={sortOrder}
        toggleSort={toggleSort}
        isAdmin={isAdmin}
        capabilities={capabilities}
        expandedScopeCaps={expandedScopeCaps}
        toggleScopeExpanded={toggleScopeExpanded}
        activeMenuCap={activeMenuCap}
        setActiveMenuCap={setActiveMenuCap}
        userName={userName}
        navigate={navigate}
      />
    </main>
  );
}
