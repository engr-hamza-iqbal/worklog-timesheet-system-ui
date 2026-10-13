import React from 'react';
import { Smartphone, Monitor, Layers, Code2, Folder } from 'lucide-react';

export function dateOnly(date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

export function iso(date) {
  return date.toISOString().slice(0, 10);
}

export function mondayOf(date) {
  const result = dateOnly(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function addDays(date, amount) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

export const statusVariant = {
  DRAFT: "inactive",
  SUBMITTED: "pending",
  APPROVED: "active",
  RETURNED: "revoked",
};

export const DURATION_PRESETS = [
  { label: "15m", value: "0.25" },
  { label: "30m", value: "0.5" },
  { label: "45m", value: "0.75" },
  { label: "1h", value: "1.0" },
  { label: "1.5h", value: "1.5" },
  { label: "2h", value: "2.0" },
  { label: "4h", value: "4.0" },
];

export function formatDuration(hours) {
  const num = Number(hours) || 0;
  const totalMins = Math.round(num * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getEntryIcon(entry, idx = 0) {
  const name = (entry.project?.name || "").toLowerCase();
  if (name.includes("mobile") || name.includes("app") || name.includes("ios") || name.includes("android")) {
    return {
      icon: <Smartphone size={18} />,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      badgeBg: "bg-indigo-50 text-indigo-700",
    };
  }
  if (name.includes("web") || name.includes("site") || name.includes("ui") || name.includes("design") || name.includes("front")) {
    return {
      icon: <Monitor size={18} />,
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      badgeBg: "bg-sky-50 text-sky-700",
    };
  }
  if (name.includes("internal") || name.includes("core") || name.includes("team") || name.includes("meet")) {
    return {
      icon: <Layers size={18} />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      badgeBg: "bg-emerald-50 text-emerald-700",
    };
  }
  const fallbackList = [
    { icon: <Smartphone size={18} />, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", badgeBg: "bg-indigo-50 text-indigo-700" },
    { icon: <Monitor size={18} />, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", badgeBg: "bg-sky-50 text-sky-700" },
    { icon: <Layers size={18} />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", badgeBg: "bg-emerald-50 text-emerald-700" },
    { icon: <Code2 size={18} />, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", badgeBg: "bg-violet-50 text-violet-700" },
    { icon: <Folder size={18} />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", badgeBg: "bg-amber-50 text-amber-700" },
  ];
  return fallbackList[idx % fallbackList.length];
}
