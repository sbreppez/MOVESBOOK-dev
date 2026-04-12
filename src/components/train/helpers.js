import { todayLocal } from '../../utils/dateUtils';

export const targetProgress = (current, target) => {
  if (!target || target <= 0) return { pct:0, color:"#e53935", label:"0%" };
  const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const color = pct >= 100 ? "#3D9E72" : pct >= 60 ? "#D4943A" : "#e53935";
  const label = pct >= 100 ? "Goal reached!" : `${pct}% there`;
  return { pct, color, label };
};

export const ensureHttps = (url) => {
  if (!url || !url.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "https://" + u;
};

export const goalTimeProgress = (createdDate, byWhen) => {
  if (!byWhen) return null;
  const now   = Date.now();
  const start = createdDate ? new Date(createdDate).getTime() : now;
  const end   = new Date(byWhen).getTime();
  if (end <= now) return { pct: 100, color: "#e53935", label: "Past deadline" };
  if (end <= start) return { pct: 100, color: "#e53935", label: "Past deadline" };
  const total = end - start;
  const remaining = end - now;
  const pctRemaining = Math.min(100, Math.max(0, Math.round(remaining / total * 100)));
  const daysLeft = Math.ceil(remaining / 86400000);
  const color = pctRemaining > 30 ? "#3D9E72" : pctRemaining > 10 ? "#D4943A" : "#e53935";
  const label = daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
  return { pct: 100 - pctRemaining, color, label };
};

export const freqDaysPerWeek = (freq) => {
  if (!freq || freq==="daily") return 7;
  if (freq==="weekdays")       return 5;
  const m = freq.match(/^(\d+)x$/);
  return m ? parseInt(m[1]) : 7;
};

export const habitDoneToday = (checkIns) => {
  const today = todayLocal();
  return (checkIns||[]).includes(today);
};
