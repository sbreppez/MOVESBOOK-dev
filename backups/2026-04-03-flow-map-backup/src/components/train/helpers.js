import { C } from '../../constants/colors';

export const menuBtnStyle = (color, border) => ({
  width:"100%", padding:"10px 13px", background:"none", border:"none", cursor:"pointer",
  display:"flex", alignItems:"center", gap:8,
  color: color || C.text, fontSize:12, fontFamily:"inherit",
  borderTop: border ? `1px solid ${C.borderLight}` : "none",
});

export const targetProgress = (current, target) => {
  if (!target || target <= 0) return { pct:0, color:"#e53935", label:"0%" };
  const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const color = pct >= 100 ? "#2d6a4f" : pct >= 60 ? "#b5850a" : "#e53935";
  const label = pct >= 100 ? "Goal reached! 🎉" : `${pct}% there`;
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
  const color = pctRemaining > 30 ? "#2d6a4f" : pctRemaining > 10 ? "#b5850a" : "#e53935";
  const label = daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
  return { pct: 100 - pctRemaining, color, label };
};

export const freqDaysPerWeek = (freq) => {
  if (!freq || freq==="daily") return 7;
  if (freq==="weekdays")       return 5;
  const m = freq.match(/^(\d+)x$/);
  return m ? parseInt(m[1]) : 7;
};

export const habitStreak = (checkIns, frequency="daily") => {
  if (!checkIns || checkIns.length === 0) return 0;
  const dpw = freqDaysPerWeek(frequency);
  if (dpw >= 7) {
    // daily streak — must check in every day
    const today = new Date(); today.setHours(0,0,0,0);
    let streak = 0, check = new Date(today);
    while (true) {
      const ds = check.toISOString().split("T")[0];
      if (checkIns.includes(ds)) { streak++; check.setDate(check.getDate()-1); } else break;
    }
    return streak;
  } else {
    // weekly streak — count consecutive weeks meeting the target
    const today = new Date(); today.setHours(0,0,0,0);
    let streak = 0;
    let weekStart = new Date(today);
    // go to start of current week (Monday)
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
    for (let w=0; w<52; w++) {
      const days = [];
      for (let d=0; d<7; d++) {
        const dd = new Date(weekStart); dd.setDate(dd.getDate()+d);
        if (dd <= today) days.push(dd.toISOString().split("T")[0]);
      }
      const done = days.filter(ds=>checkIns.includes(ds)).length;
      if (done >= dpw) { streak++; weekStart.setDate(weekStart.getDate()-7); }
      else { break; }
    }
    return streak;
  }
};

export const habitDoneToday = (checkIns) => {
  const today = new Date().toISOString().split("T")[0];
  return (checkIns||[]).includes(today);
};
