import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import { PieChart as PieIcon, BarChart2, Search, X, List } from 'lucide-react';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export function CustomTooltip({ active, payload, label, unit = 'h' }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const value = item.value !== undefined ? Number(item.value).toFixed(2) : '0.00';
    const name = item.name || label || '';
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur-md relative z-50 pointer-events-none">
        {name && <div className="font-semibold text-slate-200 mb-0.5">{name}</div>}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.fill || '#6366f1' }} />
          <span className="text-slate-400">Total:</span>
          <span className="font-bold text-white">{value} {unit}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function AnalyticsCharts({
  weeklyData,
  avgWeeklyHours,
  activePreset,
  allClientsData,
  donutClientsData,
  clientChartMode,
  setClientChartMode,
  totalDonutHours,
  displayedProjectsData,
  allProjectsData,
  projectLimitMode,
  setProjectLimitMode,
  displayedEmployeesData,
  allEmployeesData,
  employeeLimitMode,
  setEmployeeLimitMode,
}) {
  // Set of client names that are toggled OFF
  const [hiddenClients, setHiddenClients] = useState(() => new Set());

  // Toggle client on/off
  const toggleClient = (clientName) => {
    setHiddenClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });
  };

  const showAllClients = () => {
    setHiddenClients(new Set());
  };

  // Fixed client color mapping so client colors remain stable when other clients are toggled
  const clientColorMap = useMemo(() => {
    const map = {};
    (donutClientsData || []).forEach((entry, index) => {
      map[entry.name] = CHART_COLORS[index % CHART_COLORS.length];
    });
    return map;
  }, [donutClientsData]);

  // Clients that are ON (visible in the Donut and Bar chart)
  const visibleDonutClients = useMemo(() => {
    return (donutClientsData || []).filter((entry) => !hiddenClients.has(entry.name));
  }, [donutClientsData, hiddenClients]);

  // Total hours among currently active / ON clients
  const activeDonutHours = useMemo(() => {
    return visibleDonutClients.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [visibleDonutClients]);

  // Visible data for Bar chart mode
  const visibleAllClientsData = useMemo(() => {
    return (allClientsData || []).filter((entry) => !hiddenClients.has(entry.name));
  }, [allClientsData, hiddenClients]);

  // Local search & view states for projects and employees
  const [projectSearch, setProjectSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeViewMode, setEmployeeViewMode] = useState('column'); // 'column' | 'bar'

  // Filtered projects considering active search query
  const projectsToRender = useMemo(() => {
    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase().trim();
      return (allProjectsData || []).filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    return displayedProjectsData || [];
  }, [projectSearch, allProjectsData, displayedProjectsData]);

  // Filtered employees considering active search query
  const employeesToRender = useMemo(() => {
    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase().trim();
      return (allEmployeesData || []).filter((e) => (e.name || '').toLowerCase().includes(q));
    }
    return displayedEmployeesData || [];
  }, [employeeSearch, allEmployeesData, displayedEmployeesData]);

  // Clean single-line project tick with ellipsis truncation that never wraps or collides with bars
  const renderProjectTick = ({ x, y, payload }) => {
    const fullName = String(payload?.value || '');
    const maxChars = 20;
    const label = fullName.length > maxChars ? `${fullName.slice(0, maxChars - 1)}…` : fullName;
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{fullName}</title>
        <text
          x={-10}
          y={4}
          textAnchor="end"
          fill="#475569"
          fontSize={10.5}
          fontWeight={500}
          className="cursor-default select-none"
        >
          {label}
        </text>
      </g>
    );
  };

  // Clean single-line employee tick for column view with tilt and truncation
  const renderEmployeeXTick = ({ x, y, payload }) => {
    const name = String(payload?.value || '');
    const maxChars = 13;
    const label = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{name}</title>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          fill="#64748b"
          fontSize={10}
          fontWeight={500}
          transform="rotate(-35)"
          className="cursor-default select-none"
        >
          {label}
        </text>
      </g>
    );
  };

  // Clean single-line employee tick for horizontal bar view
  const renderEmployeeYTick = ({ x, y, payload }) => {
    const fullName = String(payload?.value || '');
    const maxChars = 20;
    const label = fullName.length > maxChars ? `${fullName.slice(0, maxChars - 1)}…` : fullName;
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{fullName}</title>
        <text
          x={-10}
          y={4}
          textAnchor="end"
          fill="#475569"
          fontSize={10.5}
          fontWeight={500}
          className="cursor-default select-none"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 1. Weekly Hours Trend (Area Chart) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative z-10 hover:z-50 focus-within:z-50 transition-all overflow-visible">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Weekly Hours Trend</h2>
            <p className="text-[11px] text-slate-500">Aggregated approved hours by week start</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="self-start sm:self-auto text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {weeklyData.length} weeks
            </span>
            {avgWeeklyHours > 0 && (
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Avg: <strong className="text-slate-900">{avgWeeklyHours.toFixed(1)}h</strong>/wk
              </span>
            )}
          </div>
        </div>
        <div className="w-full overflow-visible">
          <div className="w-full h-[260px] overflow-visible">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={240} debounce={50} className="overflow-visible">
                <AreaChart data={weeklyData} margin={{ top: 20, right: 25, left: 0, bottom: 6 }}>
                  <defs>
                    <linearGradient id="stunningAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.38} />
                      <stop offset="45%" stopColor="#818cf8" stopOpacity={0.14} />
                      <stop offset="85%" stopColor="#c7d2fe" stopOpacity={0.02} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>

                    <linearGradient id="stunningLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4338ca" />
                      <stop offset="35%" stopColor="#6366f1" />
                      <stop offset="70%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.7} vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} dy={4} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" width={32} />
                  <Tooltip
                    content={<CustomTooltip unit="h" />}
                    wrapperStyle={{ zIndex: 999999, pointerEvents: 'none' }}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />

                  {avgWeeklyHours > 0 && (
                    <ReferenceLine
                      y={Number(avgWeeklyHours.toFixed(1))}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Avg ${avgWeeklyHours.toFixed(1)}h`,
                        position: 'insideTopRight',
                        fill: '#64748b',
                        fontSize: 10,
                        fontWeight: 600,
                        offset: 8,
                      }}
                    />
                  )}

                  <Area
                    key={`area-${activePreset}-${weeklyData.length}`}
                    type="monotone"
                    dataKey="hours"
                    stroke="url(#stunningLineGrad)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#stunningAreaGrad)"
                    dot={{ stroke: '#6366f1', strokeWidth: 2, r: 3.5, fill: '#ffffff' }}
                    activeDot={{
                      stroke: '#4f46e5',
                      strokeWidth: 3,
                      r: 6,
                      fill: '#ffffff',
                    }}
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No approved weekly records in this time frame.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Hours by Client (Donut Pie Chart or 2-Layer Bar View) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative z-0 hover:z-50 focus-within:z-50 transition-all">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hours by Client</h2>
            <p className="text-[11px] text-slate-500">Distribution across active client portfolios</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {visibleDonutClients.length}/{allClientsData.length} ON
            </span>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setClientChartMode('donut')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${clientChartMode === 'donut'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <PieIcon size={12} />
                <span className="inline">Donut</span>
              </button>
              <button
                type="button"
                onClick={() => setClientChartMode('bar')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${clientChartMode === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <BarChart2 size={12} />
                <span className="inline">Bars</span>
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-64 w-full flex flex-col justify-center">
          {allClientsData.length > 0 ? (
            clientChartMode === 'donut' ? (
              donutClientsData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-56 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                      <PieChart>
                        {visibleDonutClients.length > 0 && (
                          <Pie
                            key={`pie-${activePreset}-${visibleDonutClients.length}-${hiddenClients.size}`}
                            data={visibleDonutClients}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={54}
                            outerRadius={80}
                            paddingAngle={visibleDonutClients.length > 1 ? 3 : 0}
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive={true}
                            animationBegin={0}
                            animationDuration={600}
                            animationEasing="ease-out"
                            stroke="#ffffff"
                            strokeWidth={2}
                          >
                            {visibleDonutClients.map((entry) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={clientColorMap[entry.name] || '#6366f1'}
                                className="transition-all duration-150 hover:opacity-80 cursor-pointer"
                                onClick={() => toggleClient(entry.name)}
                              />
                            ))}
                          </Pie>
                        )}
                        <text
                          x="50%"
                          y="47%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="font-extrabold font-mono text-xl fill-slate-900 select-none"
                        >
                          {activeDonutHours.toFixed(1)}h
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[10px] font-semibold uppercase tracking-wider fill-slate-400 select-none"
                        >
                          {hiddenClients.size > 0
                            ? (visibleDonutClients.length === 0 ? 'All OFF' : `${visibleDonutClients.length} ON`)
                            : 'Total Effort'}
                        </text>
                        <Tooltip
                          formatter={(value, name) => [
                            `${Number(value).toFixed(2)} h (${activeDonutHours > 0 ? ((Number(value) / activeDonutHours) * 100).toFixed(1) : '0.0'}%)`,
                            name,
                          ]}
                          wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                          allowEscapeViewBox={{ x: true, y: true }}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '11px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                            zIndex: 99999,
                          }}
                          itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Interactive Legends with ON/OFF Toggle */}
                  <div className="mt-2.5 w-full flex flex-col items-center">

                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 px-1 max-h-24 overflow-y-auto [scrollbar-width:thin] w-full">
                      {donutClientsData.map((entry) => {
                        const isOff = hiddenClients.has(entry.name);
                        const color = clientColorMap[entry.name] || '#6366f1';
                        return (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() => toggleClient(entry.name)}
                            title={isOff ? `Click to turn ${entry.name} ON` : `Click to turn ${entry.name} OFF`}
                            className={`group inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer select-none ${isOff
                              ? 'bg-slate-100/70 text-slate-400 border-dashed border-slate-300 opacity-60 hover:opacity-100 hover:border-slate-400'
                              : 'bg-white text-slate-700 border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300'
                              }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 transition-transform ${isOff ? 'border border-slate-400 bg-transparent scale-90' : 'shadow-2xs group-hover:scale-110'
                                }`}
                              style={{ backgroundColor: isOff ? 'transparent' : color }}
                            />
                            <span className={`font-medium truncate max-w-[100px] sm:max-w-[120px] ${isOff ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {entry.name}
                            </span>
                            <span className={`font-mono text-[10px] ${isOff ? 'text-slate-400 font-semibold' : 'text-slate-500'}`}>
                              {isOff ? 'OFF' : `${entry.percentage}%`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-56 items-center justify-center text-xs text-slate-400 gap-2">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <PieIcon size={20} />
                  </div>
                  <span>No approved client hours logged in selected period.</span>
                </div>
              )
            ) : (
              <div className="overflow-y-auto max-h-64 [scrollbar-width:thin] pr-1">
                <div style={{ height: `${Math.max(220, visibleAllClientsData.length * 32)}px` }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                    <BarChart
                      data={visibleAllClientsData}
                      layout="vertical"
                      margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="clientBarGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        width={85}
                      />
                      <Tooltip
                        content={<CustomTooltip unit="h" />}
                        wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                        allowEscapeViewBox={{ x: true, y: true }}
                      />
                      <Bar
                        key={`bar-client-${activePreset}-${visibleAllClientsData.length}`}
                        dataKey="hours"
                        fill="url(#clientBarGrad)"
                        radius={[0, 8, 8, 0]}
                        barSize={16}
                        background={{ fill: '#f1f5f9', radius: [0, 8, 8, 0] }}
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={650}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          ) : (
            <div className="flex h-56 items-center justify-center text-xs text-slate-400">
              No client hours logged in selected period.
            </div>
          )}
        </div>
      </section>

      {/* 3. Hours by Project (Bar Chart with dynamic scaling, non-colliding labels, and search) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative z-0 hover:z-50 focus-within:z-50 transition-all">
        <div className="mb-3.5 sm:mb-4 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Hours by Project</h2>
              <p className="text-[11px] text-slate-500">Top project initiatives by approved volume</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                {projectsToRender.length} of {allProjectsData.length} shown
              </span>
              {allProjectsData.length > 8 && (
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setProjectLimitMode('top8'); setProjectSearch(''); }}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      projectLimitMode === 'top8' && !projectSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 8
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProjectLimitMode('top20'); setProjectSearch(''); }}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      projectLimitMode === 'top20' && !projectSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 20
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectLimitMode('all')}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      projectLimitMode === 'all' && !projectSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({allProjectsData.length})
                  </button>
                </div>
              )}
            </div>
          </div>
          {allProjectsData.length > 8 && (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects by name..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
              {projectSearch && (
                <button
                  type="button"
                  onClick={() => setProjectSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="overflow-y-auto max-h-72 [scrollbar-width:thin] pr-1">
          <div style={{ height: `${Math.max(260, projectsToRender.length * 38)}px` }}>
            {projectsToRender.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectsToRender}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="projectBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#cbd5e1"
                    fontSize={10.5}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    width={145}
                    interval={0}
                    tick={renderProjectTick}
                  />
                  <Tooltip
                    content={<CustomTooltip unit="h" />}
                    wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />
                  <Bar
                    key={`bar-project-${activePreset}-${projectLimitMode}-${projectsToRender.length}-${projectSearch}`}
                    dataKey="hours"
                    fill="url(#projectBarGrad)"
                    radius={[0, 8, 8, 0]}
                    barSize={16}
                    background={{ fill: '#f1f5f9', radius: [0, 8, 8, 0] }}
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={650}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                {projectSearch ? 'No projects match your search.' : 'No project hours recorded in this range.'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Hours by Employee (Bar Chart with view modes and handling for many users) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative z-0 hover:z-50 focus-within:z-50 transition-all">
        <div className="mb-3.5 sm:mb-4 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Hours by Team Member</h2>
              <p className="text-[11px] text-slate-500">Approved effort across individual contributors</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
              <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {employeesToRender.length} of {allEmployeesData.length} members
              </span>
              {/* View Mode Toggle: Columns vs Rows */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEmployeeViewMode('column')}
                  title="Column chart view"
                  className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                    employeeViewMode === 'column'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart2 size={12} />
                  <span>Columns</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeViewMode('bar')}
                  title="Horizontal rows list view (ideal for many members)"
                  className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                    employeeViewMode === 'bar'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={12} />
                  <span>Rows</span>
                </button>
              </div>
              {/* Limit Presets */}
              {allEmployeesData.length > 8 && (
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setEmployeeLimitMode('top8'); setEmployeeSearch(''); }}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      employeeLimitMode === 'top8' && !employeeSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 8
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmployeeLimitMode('top20'); setEmployeeSearch(''); }}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      employeeLimitMode === 'top20' && !employeeSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 20
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeLimitMode('all')}
                    className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      employeeLimitMode === 'all' && !employeeSearch
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({allEmployeesData.length})
                  </button>
                </div>
              )}
            </div>
          </div>
          {allEmployeesData.length > 8 && (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search team members by name..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
              />
              {employeeSearch && (
                <button
                  type="button"
                  onClick={() => setEmployeeSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {employeeViewMode === 'column' ? (
          <div className="overflow-x-auto pb-2 [scrollbar-width:thin] touch-pan-x">
            <div
              style={{
                width: employeesToRender.length <= 8 ? '100%' : `${Math.max(280, employeesToRender.length * 48)}px`,
                minWidth: employeesToRender.length <= 8 ? '100%' : `${Math.max(280, employeesToRender.length * 48)}px`,
                height: '280px',
              }}
            >
              {employeesToRender.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeesToRender}
                    margin={{ top: 10, right: 15, left: -20, bottom: 45 }}
                  >
                    <defs>
                      <linearGradient id="employeeBarGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      interval={0}
                      height={55}
                      tick={renderEmployeeXTick}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                    <Tooltip
                      content={<CustomTooltip unit="h" />}
                      wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Bar
                      key={`bar-emp-${activePreset}-${employeeLimitMode}-${employeesToRender.length}-${employeeSearch}`}
                      dataKey="hours"
                      fill="url(#employeeBarGrad)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={32}
                      background={{ fill: '#f1f5f9', radius: [8, 8, 0, 0] }}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={650}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  {employeeSearch ? 'No team members match your search.' : 'No employee hours recorded in this range.'}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-72 [scrollbar-width:thin] pr-1">
            <div style={{ height: `${Math.max(260, employeesToRender.length * 38)}px` }}>
              {employeesToRender.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employeesToRender}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="employeeRowBarGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#cbd5e1"
                      fontSize={10.5}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      width={145}
                      interval={0}
                      tick={renderEmployeeYTick}
                    />
                    <Tooltip
                      content={<CustomTooltip unit="h" />}
                      wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Bar
                      key={`bar-emp-row-${activePreset}-${employeeLimitMode}-${employeesToRender.length}-${employeeSearch}`}
                      dataKey="hours"
                      fill="url(#employeeRowBarGrad)"
                      radius={[0, 8, 8, 0]}
                      barSize={16}
                      background={{ fill: '#f1f5f9', radius: [0, 8, 8, 0] }}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={650}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  {employeeSearch ? 'No team members match your search.' : 'No employee hours recorded in this range.'}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
