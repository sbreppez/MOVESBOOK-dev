/**
 * Report Engine — pure utility module for computing daily/weekly/monthly
 * report data, building the Reports timeline, and detecting milestones.
 * No React dependencies.
 */

import { todayLocal, toLocalYMD } from './dateUtils';

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return toLocalYMD(d); } catch { return null; }
};

const getMonday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return toLocalYMD(d);
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toLocalYMD(d);
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Daily Entry ─────────────────────────────────────────────────────────────

export const computeDailyEntry = (date, { moves, reps, sparring, musicflow, calendar }) => {
  const d = date;
  const movesAdded = (moves || []).filter(m => {
    const md = toYMD(m.createdAt || m.date);
    return md === d;
  }).length;

  // Moves trained: reps that day + calendar training events that day
  const repCount = (reps || []).filter(r => toYMD(r.date) === d).length;
  const calTraining = (calendar?.events || []).filter(e => e.date === d && e.type === "training").length;
  const movesTrained = repCount + calTraining;

  // Sessions: reps + sparring + musicflow
  const sparCount = (sparring?.sessions || []).filter(s => toYMD(s.date) === d).length;
  const flowCount = (musicflow?.sessions || []).filter(s => toYMD(s.date) === d).length;
  const sessionsLogged = repCount + sparCount + flowCount;

  // Routine completions
  const routineEvents = (calendar?.events || []).filter(e => e.date === d && e.type === "routine");
  const routineCount = routineEvents.length;
  const routineSteps = routineEvents.reduce((s, e) => s + (e.stepsCompleted || 0), 0);
  const routineStepsTotal = routineEvents.reduce((s, e) => s + (e.stepsTotal || 0), 0);
  const routines = routineEvents.map(e => ({ name: e.title || "", completed: e.stepsCompleted || 0, total: e.stepsTotal || 0 }));

  const isRest = movesAdded === 0 && movesTrained === 0 && sessionsLogged === 0 && routineCount === 0;

  return { date: d, movesAdded, movesTrained, sessionsLogged, isRest, routineCount, routineSteps, routineStepsTotal, routines };
};

// ── Weekly Report ───────────────────────────────────────────────────────────

export const computeWeeklyReport = (weekStart, data) => {
  const { moves, reps, sparring, musicflow, calendar, cats } = data;
  const weekEnd = addDays(weekStart, 6);
  let sessionCount = 0, movesAdded = 0, routineCount = 0, routineSteps = 0, routineStepsTotal = 0;
  const catCounts = {};

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const daily = computeDailyEntry(d, { moves, reps, sparring, musicflow, calendar });
    sessionCount += daily.sessionsLogged;
    movesAdded += daily.movesAdded;
    routineCount += daily.routineCount;
    routineSteps += daily.routineSteps;
    routineStepsTotal += daily.routineStepsTotal;

    // Count category activity from reps
    (reps || []).filter(r => toYMD(r.date) === d).forEach(r => {
      const cat = r.category || r.moveCat || "";
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    // Count from calendar training events
    (calendar?.events || []).filter(e => e.date === d && e.type === "training").forEach(e => {
      const cat = e.category || "";
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    // Count from moves added that week
    (moves || []).filter(m => toYMD(m.createdAt || m.date) === d).forEach(m => {
      const cat = m.category || "";
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
  }

  const sharpestCategory = Object.keys(catCounts).length
    ? Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return { weekStart, weekEnd, sessionCount, movesAdded, sharpestCategory, routineCount, routineSteps, routineStepsTotal };
};

// ── Monthly Report ──────────────────────────────────────────────────────────

export const computeMonthlyReport = (year, month, data) => {
  const { moves, reps, sparring, musicflow, calendar, cats, battleprep, rivals } = data;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  let totalSessions = 0, movesAdded = 0, routineCount = 0, routineSteps = 0, routineStepsTotal = 0;
  const catCounts = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthStr}-${String(d).padStart(2, "0")}`;
    const daily = computeDailyEntry(dateStr, { moves, reps, sparring, musicflow, calendar });
    totalSessions += daily.sessionsLogged;
    movesAdded += daily.movesAdded;
    routineCount += daily.routineCount;
    routineSteps += daily.routineSteps;
    routineStepsTotal += daily.routineStepsTotal;

    // Category tracking
    (reps || []).filter(r => toYMD(r.date) === dateStr).forEach(r => {
      const cat = r.category || r.moveCat || "";
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    (moves || []).filter(m => toYMD(m.createdAt || m.date) === dateStr).forEach(m => {
      const cat = m.category || "";
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
  }

  // Stale: moves not trained in 30+ days as of month end
  const monthEnd = `${monthStr}-${String(daysInMonth).padStart(2, "0")}`;
  const staleThreshold = addDays(monthEnd, -30);
  const staleCount = (moves || []).filter(m => {
    const md = toYMD(m.date);
    return md && md < staleThreshold;
  }).length;

  // Sparring frequency
  const sparSessions = (sparring?.sessions || []).filter(s => {
    const sd = toYMD(s.date);
    return sd && sd >= `${monthStr}-01` && sd <= monthEnd;
  }).length;
  const weeks = Math.ceil(daysInMonth / 7);
  const sparringFreq = weeks > 0 ? Math.round(sparSessions / weeks * 10) / 10 : 0;

  // Most/least trained category
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const mostTrainedCat = sortedCats.length ? sortedCats[0][0] : null;
  const leastTrainedCat = sortedCats.length > 1 ? sortedCats[sortedCats.length - 1][0] : null;

  // Battle count
  const battleCount = (battleprep?.history || []).filter(h => {
    const hd = toYMD(h.completedDate || h.date);
    return hd && hd >= `${monthStr}-01` && hd <= monthEnd;
  }).length;

  const narrative2 = buildMonthlyNarrative({
    totalSessions, movesAdded, staleCount, sparSessions,
    mostTrainedCat, leastTrainedCat, battleCount, monthName: MONTH_NAMES[month],
    routineCount, routineSteps, routineStepsTotal
  });

  return {
    year, month, totalSessions, movesAdded, staleCount,
    sparringFreq, mostTrainedCat, leastTrainedCat, battleCount,
    routineCount, routineSteps, routineStepsTotal,
    narrative: narrative2
  };
};

const buildMonthlyNarrative = ({ totalSessions, movesAdded, staleCount, sparSessions, mostTrainedCat, leastTrainedCat, battleCount, monthName, routineCount, routineSteps, routineStepsTotal }) => {
  const lines = [];
  if (totalSessions > 0) {
    lines.push(`${totalSessions} session${totalSessions !== 1 ? "s" : ""} logged in ${monthName}.`);
  } else {
    lines.push(`No sessions logged in ${monthName}.`);
    return lines.join(" ");
  }
  if (movesAdded > 0) {
    lines.push(`${movesAdded} move${movesAdded !== 1 ? "s" : ""} added to your vocabulary.`);
  }
  if (staleCount > 0) {
    lines.push(`${staleCount} move${staleCount !== 1 ? "s" : ""} went stale.`);
  }
  if (sparSessions > 0) {
    lines.push(`Sparred ${sparSessions} time${sparSessions !== 1 ? "s" : ""}.`);
  }
  if (mostTrainedCat) {
    lines.push(`Most trained: ${mostTrainedCat}.`);
  }
  if (leastTrainedCat && leastTrainedCat !== mostTrainedCat) {
    lines.push(`Least trained: ${leastTrainedCat}.`);
  }
  if (battleCount > 0) {
    lines.push(`${battleCount} battle${battleCount !== 1 ? "s" : ""} completed.`);
  }
  if (routineCount > 0) {
    lines.push(`${routineSteps}/${routineStepsTotal} routine steps completed.`);
  }
  return lines.join(" ");
};

// ── Milestones ──────────────────────────────────────────────────────────────

const MILESTONE_DEFS = [
  { id: "moves-10",  check: s => s.moveCount >= 10,  label: "moveMilestone", val: 10 },
  { id: "moves-25",  check: s => s.moveCount >= 25,  label: "moveMilestone", val: 25 },
  { id: "moves-50",  check: s => s.moveCount >= 50,  label: "moveMilestone", val: 50 },
  { id: "moves-100", check: s => s.moveCount >= 100, label: "moveMilestone", val: 100 },
  { id: "moves-200", check: s => s.moveCount >= 200, label: "moveMilestone", val: 200 },
  { id: "first-creation",  check: s => s.hasCreation,     label: "firstCreation" },
  { id: "first-sparring",  check: s => s.sparringCount >= 1, label: "firstSparring" },
  { id: "first-battle",    check: s => s.battleCount >= 1,   label: "firstBattle" },
  { id: "sessions-10mo",   check: s => s.sessionsThisMonth >= 10, label: "sessions10mo" },
  { id: "all-cats",        check: s => s.allCatsHaveMove,  label: "allCatsHaveMove" },
  { id: "first-variation", check: s => s.hasVariation,     label: "firstVariation" },
  { id: "foundation-30",   check: s => s.foundationAbove30, label: "foundationStrong" },
];

export const detectMilestones = ({ moves, sparring, battleprep, reps, musicflow, cats, calendar: _calendar }, existingMilestones) => {
  const existingIds = new Set((existingMilestones || []).map(m => m.id));
  const today = todayLocal();
  const monthStr = today.slice(0, 7);

  const moveCount = (moves || []).length;
  const hasCreation = (moves || []).some(m => m.origin === "creation");
  const sparringCount = (sparring?.sessions || []).length;
  const battleCount = (battleprep?.history || []).length;
  const hasVariation = (moves || []).some(m => m.parentId);

  // Sessions this month
  const monthStart = monthStr + "-01";
  let sessionsThisMonth = 0;
  sessionsThisMonth += (reps || []).filter(r => { const d = toYMD(r.date); return d && d >= monthStart; }).length;
  sessionsThisMonth += (sparring?.sessions || []).filter(s => { const d = toYMD(s.date); return d && d >= monthStart; }).length;
  sessionsThisMonth += (musicflow?.sessions || []).filter(s => { const d = toYMD(s.date); return d && d >= monthStart; }).length;

  // All categories have a move
  const usedCats = new Set((moves || []).map(m => m.category).filter(Boolean));
  const allCatsHaveMove = (cats || []).length > 0 && (cats || []).every(c => usedCats.has(c));

  // Foundation categories above 30% freshness
  const foundationCats = ["Toprocks", "Godowns", "Footworks", "Power Moves", "Freezes"];
  const foundationAbove30 = foundationCats.every(cat => {
    const catMoves = (moves || []).filter(m => m.category === cat);
    if (catMoves.length === 0) return false;
    const thirtyAgo = addDays(today, -30);
    const fresh = catMoves.filter(m => { const d = toYMD(m.date); return d && d >= thirtyAgo; }).length;
    return (fresh / catMoves.length) >= 0.3;
  });

  const state = {
    moveCount, hasCreation, sparringCount, battleCount,
    sessionsThisMonth, allCatsHaveMove, hasVariation, foundationAbove30
  };

  const newMilestones = [];
  for (const def of MILESTONE_DEFS) {
    if (existingIds.has(def.id)) continue;
    if (def.check(state)) {
      newMilestones.push({
        id: def.id,
        label: def.label,
        val: def.val || null,
        date: today,
      });
    }
  }
  return newMilestones;
};

// ── Timeline Builder ────────────────────────────────────────────────────────

export const buildTimeline = (monthsBack, data, milestones) => {
  const today = new Date();
  const todayStr = todayLocal();
  const entries = [];

  // Determine date range
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - monthsBack);
  startDate.setDate(1);
  const startStr = toLocalYMD(startDate);

  // Group milestones by date for quick lookup
  const milestonesByDate = {};
  (milestones || []).forEach(m => {
    if (!milestonesByDate[m.date]) milestonesByDate[m.date] = [];
    milestonesByDate[m.date].push(m);
  });

  // Monthly tiles
  const monthSet = new Set();
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const key = `${y}-${m}`;
    if (!monthSet.has(key)) {
      monthSet.add(key);
      const report = computeMonthlyReport(y, m, data);
      // Only add if not current month or if current month has some activity
      if (y !== today.getFullYear() || m !== today.getMonth() || report.totalSessions > 0 || report.movesAdded > 0) {
        entries.push({ type: "month", date: `${y}-${String(m + 1).padStart(2, "0")}-01`, data: report });
      }
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Weekly tiles
  const weekSet = new Set();
  const dayCursor = new Date(startDate);
  while (dayCursor <= today) {
    const ds = toLocalYMD(dayCursor);
    const monday = getMonday(ds);
    if (!weekSet.has(monday) && monday >= startStr) {
      weekSet.add(monday);
      const report = computeWeeklyReport(monday, data);
      // Attach milestones for this week
      const weekMilestones = [];
      for (let i = 0; i < 7; i++) {
        const wd = addDays(monday, i);
        if (milestonesByDate[wd]) weekMilestones.push(...milestonesByDate[wd]);
      }
      report.milestones = weekMilestones;
      entries.push({ type: "week", date: monday, data: report });
    }
    dayCursor.setDate(dayCursor.getDate() + 7);
  }

  // Daily entries (only for the current month to keep timeline manageable)
  const currentMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const dayPtr = new Date(currentMonthStart + "T00:00:00");
  while (dayPtr <= today) {
    const ds = toLocalYMD(dayPtr);
    const daily = computeDailyEntry(ds, data);
    entries.push({ type: "day", date: ds, data: daily });
    dayPtr.setDate(dayPtr.getDate() + 1);
  }

  // Sort newest first
  entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    // month > week > day for same date
    const order = { month: 0, week: 1, day: 2 };
    return order[a.type] - order[b.type];
  });

  return entries;
};
