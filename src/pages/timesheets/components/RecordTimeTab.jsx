import React from 'react';
import {
  Clock, CalendarDays, ChevronLeft, ChevronRight, Plus, Loader2,
  Pencil, Trash2, Send, AlertCircle
} from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import { DURATION_PRESETS, formatDuration, getEntryIcon, statusVariant, iso } from '../utils/timesheetUtils.jsx';

export default function RecordTimeTab({
  form,
  setForm,
  stepDate,
  formattedWorkDate,
  selectedDayTotalHours,
  todayPercentage,
  weekTotalHours,
  weekPercentage,
  editingId,
  resetForm,
  saveEntry,
  projects,
  loading,
  customDuration,
  setCustomDuration,
  isSavingEntry,
  selectedDayData,
  selectedDayEditable,
  isProcessing,
  submitEntries,
  user,
  editEntry,
  removeEntry,
}) {
  return (
    <div className="space-y-6">
      {/* Day Navigation & Dual Metric Cards Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => stepDate(-1)}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, workDate: iso(new Date()) }))}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => stepDate(1)}
              className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {formattedWorkDate}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Log your work for this date
            </p>
          </div>
        </div>

        {/* Right: Metric Cards (Today & This Week) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Today Card */}
          <div className="flex-1 sm:w-56 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today</div>
              <div className="text-base font-extrabold text-slate-900">
                {formatDuration(selectedDayTotalHours)} <span className="text-xs font-normal text-slate-400">/ 8h</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${todayPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 font-mono">{todayPercentage}%</span>
              </div>
            </div>
          </div>

          {/* This Week Card */}
          <div className="flex-1 sm:w-56 bg-sky-50/50 border border-sky-100 rounded-2xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Week</div>
              <div className="text-base font-extrabold text-slate-900">
                {formatDuration(weekTotalHours)} <span className="text-xs font-normal text-slate-400">/ 40h</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-sky-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${weekPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-blue-700 font-mono">{weekPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entry Form Card */}
      <form
        onSubmit={saveEntry}
        className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {editingId ? "Edit Time Entry" : "Add Time Entry"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingId ? "Modify your work details below." : "Fill in the details below to log your work hours."}
              </p>
            </div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-12 items-start">
          {/* Project selector */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition cursor-pointer"
            >
              <option value="">
                {loading ? "Loading assigned projects..." : projects.length ? "Select project..." : "No assigned projects"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.clientName || project.client?.name || "Client"} / {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="date"
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
            />
          </div>

          {/* Duration with quick presets */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Duration <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Select time in 15-min increments
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setCustomDuration(false);
                    setForm((p) => ({ ...p, durationHours: preset.value }));
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${!customDuration && form.durationHours === preset.value
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDuration(true)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${customDuration
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
              >
                <Clock size={12} />
                <span>Custom</span>
              </button>
            </div>

            {customDuration && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  required
                  min="0.25"
                  max="16"
                  step="0.25"
                  type="number"
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                  placeholder="e.g. 3.5"
                  className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
                <span className="text-xs text-slate-500">hours ({formatDuration(form.durationHours)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            minLength={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What did you work on?"
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition resize-y"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <span className="text-[11px] text-slate-400">
              e.g. Fixed checkout validation and updated payment UI
            </span>
            <button
              type="submit"
              disabled={isSavingEntry || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 self-end sm:self-auto"
            >
              {isSavingEntry ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              <span>{editingId ? "Update Time Entry" : "Log Time Entry"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Today's Logged Entries List Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Today&apos;s Entries</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                {selectedDayData.entries.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Your work entries for {formattedWorkDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
              Total: <span className="font-bold">{formatDuration(selectedDayTotalHours)}</span>
            </div>
            {selectedDayEditable.length > 0 && (
              <button
                type="button"
                disabled={Boolean(isProcessing)}
                onClick={() => submitEntries(selectedDayEditable.map((e) => e.id), "day entries")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-2xs"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Submit Day</span>
              </button>
            )}
          </div>
        </div>

        {selectedDayData.timeOff && (
          <div className={`p-3 mx-4 mt-4 rounded-xl text-xs flex items-center gap-2 ${selectedDayData.timeOff.status === 'PENDING'
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-sky-50 border border-sky-200 text-sky-800'
            }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${selectedDayData.timeOff.status === 'PENDING' ? 'text-amber-600' : 'text-sky-600'
              }`} />
            <span>
              {selectedDayData.timeOff.status === 'PENDING' ? 'Pending Leave Request' : 'Approved Absence'} on this day:{' '}
              <strong>{selectedDayData.timeOff.type?.name}</strong>
              {selectedDayData.timeOff.status === 'PENDING' && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  Awaiting review
                </span>
              )}
            </span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {selectedDayData.entries.length ? (
            selectedDayData.entries.map((entry, idx) => {
              const isOwnEntry = Boolean(user?.id && entry.userId === user.id);
              const canEdit = isOwnEntry && entry.status === "DRAFT";
              const canDelete = isOwnEntry && entry.status === "DRAFT";
              const iconConfig = getEntryIcon(entry, idx);

              return (
                <div key={entry.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconConfig.bg} ${iconConfig.text} ${iconConfig.border}`}>
                      {iconConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {entry.project?.name || "Project"}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${iconConfig.badgeBg}`}>
                          {formatDuration(entry.durationHours)}
                        </span>
                        <Badge variant={statusVariant[entry.status]} label={entry.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
                        {entry.description}
                      </p>
                      {entry.returnComment && (
                        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                          <span className="font-semibold">Reviewer comment:</span> {entry.returnComment}
                        </div>
                      )}
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => editEntry(entry)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white transition cursor-pointer shadow-2xs"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-100 border border-rose-200 bg-rose-50/70 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs text-slate-400">
              No work entries recorded for this date. Fill in the details above to log your work.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
