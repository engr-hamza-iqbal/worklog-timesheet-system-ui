import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import { PieChart as PieIcon, BarChart2 } from 'lucide-react';

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
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-xs">
        {name && <div className="font-semibold text-slate-200 mb-0.5">{name}</div>}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }} />
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
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 1. Weekly Hours Trend (Area Chart) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
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
        <div className="overflow-x-auto pb-1 [scrollbar-width:thin] touch-pan-x">
          <div style={{ minWidth: `${Math.max(260, weeklyData.length * 32)}px`, height: '260px' }}>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240} debounce={50}>
                <AreaChart data={weeklyData} margin={{ top: 12, right: 12, left: -22, bottom: 4 }}>
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
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip content={<CustomTooltip unit="h" />} />

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
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hours by Client</h2>
            <p className="text-[11px] text-slate-500">Distribution across active client portfolios</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {allClientsData.length} clients
            </span>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setClientChartMode('donut')}
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  clientChartMode === 'donut'
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
                className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  clientChartMode === 'bar'
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
                        <Pie
                          key={`pie-${activePreset}-${donutClientsData.length}`}
                          data={donutClientsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={80}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {donutClientsData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              className="transition-all duration-150 hover:opacity-80 cursor-pointer"
                            />
                          ))}
                        </Pie>
                        <text
                          x="50%"
                          y="47%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="font-extrabold font-mono text-xl fill-slate-900 select-none"
                        >
                          {totalDonutHours.toFixed(1)}h
                        </text>
                        <text
                          x="50%"
                          y="57%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[10px] font-semibold uppercase tracking-wider fill-slate-400 select-none"
                        >
                          Total Effort
                        </text>
                        <Tooltip
                          formatter={(value, name, item) => [
                            `${Number(value).toFixed(2)} h (${item.payload.percentage}%)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '11px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          }}
                          itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-2 max-h-20 overflow-y-auto [scrollbar-width:thin]">
                    {donutClientsData.map((entry, index) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium text-slate-700 truncate max-w-[110px] sm:max-w-[130px]">
                          {entry.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">({entry.percentage}%)</span>
                      </div>
                    ))}
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
                <div style={{ height: `${Math.max(220, allClientsData.length * 32)}px` }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                    <BarChart
                      data={allClientsData}
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
                      <Tooltip content={<CustomTooltip unit="h" />} />
                      <Bar
                        key={`bar-client-${activePreset}-${allClientsData.length}`}
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

      {/* 3. Hours by Project (Bar Chart with dynamic scaling and scroll) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hours by Project</h2>
            <p className="text-[11px] text-slate-500">Top project initiatives by approved volume</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
              {displayedProjectsData.length} shown
            </span>
            {allProjectsData.length > 8 && (
              <button
                type="button"
                onClick={() => setProjectLimitMode((m) => (m === 'top8' ? 'all' : 'top8'))}
                className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {projectLimitMode === 'top8' ? `Show All (${allProjectsData.length})` : 'Show Top 8'}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-72 [scrollbar-width:thin] pr-1">
          <div style={{ height: `${Math.max(240, displayedProjectsData.length * 32)}px` }}>
            {displayedProjectsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedProjectsData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
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
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip unit="h" />} />
                  <Bar
                    key={`bar-project-${activePreset}-${projectLimitMode}-${displayedProjectsData.length}`}
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
                No project hours recorded in this range.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Hours by Employee (Bar Chart with horizontal scroll when many team members) */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="mb-3.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hours by Team Member</h2>
            <p className="text-[11px] text-slate-500">Approved effort across individual contributors</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {displayedEmployeesData.length} members
            </span>
            {allEmployeesData.length > 8 && (
              <button
                type="button"
                onClick={() => setEmployeeLimitMode((m) => (m === 'top8' ? 'all' : 'top8'))}
                className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {employeeLimitMode === 'top8' ? `Show All (${allEmployeesData.length})` : 'Show Top 8'}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto pb-2 [scrollbar-width:thin] touch-pan-x">
          <div
            style={{
              minWidth: `${Math.max(280, displayedEmployeesData.length * 52)}px`,
              height: '280px',
            }}
          >
            {displayedEmployeesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedEmployeesData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 45 }}
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
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip content={<CustomTooltip unit="h" />} />
                  <Bar
                    key={`bar-emp-${activePreset}-${employeeLimitMode}-${displayedEmployeesData.length}`}
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
                No employee hours recorded in this range.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
