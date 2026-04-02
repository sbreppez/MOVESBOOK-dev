// Battle Prep Helpers — Phase distribution, task generation, date math

// ── Preset configurations ──────────────────────────────────────────────────
export const PRESET_CONFIGS = {
  smoke: {
    phases: [
      { name: "BUILD",    pct: 0.40, color: "#1565c0" },
      { name: "SHARPEN",  pct: 0.25, color: "#f57f17" },
      { name: "PEAK",     pct: 0.20, color: "#e53935" },
      { name: "TAPER",    pct: 0.15, color: "#2e7d32" },
    ],
  },
  prove: {
    phases: [
      { name: "LOCK IN",  pct: 0.40, color: "#1565c0" },
      { name: "POLISH",   pct: 0.35, color: "#f57f17" },
      { name: "PERFORM",  pct: 0.25, color: "#e53935" },
    ],
  },
  mark: {
    phases: [
      { name: "FOUNDATION",   pct: 0.30, color: "#1565c0" },
      { name: "BUILD ROUND",  pct: 0.30, color: "#f57f17" },
      { name: "BATTLE READY", pct: 0.25, color: "#e53935" },
      { name: "TRUST IT",     pct: 0.15, color: "#2e7d32" },
    ],
  },
};

export const PRESET_META = {
  smoke:  { icon: "\u{1F525}", color: "#e53935",  label: "SMOKE THEM ALL" },
  prove:  { icon: "\u26A1",    color: "#ffa726",  label: "PROVE YOURSELF" },
  mark:   { icon: "\u{1F4AA}", color: "#1db954",  label: "MAKE YOUR MARK" },
  custom: { icon: "\u270F\uFE0F",  color: "#7a7a7a",  label: "CUSTOM" },
};

export const ADJUST_COLOR = "#9e9e9e";
export const MAINTAIN_COLOR = "#42a5f5";
export const STAY_READY_COLOR = "#66bb6a";

// ── Date utilities ─────────────────────────────────────────────────────────
export const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try { return new Date(d).toISOString().split("T")[0]; } catch { return null; }
};

export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toYMD(d);
};

export const daysBetween = (a, b) => {
  return Math.ceil((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
};

export const getDayOfWeek = (dateStr) => {
  return new Date(dateStr + "T00:00:00").getDay();
};

// Enumerate all dates from start to end (inclusive)
export const enumDates = (start, end) => {
  const result = [];
  let cur = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  while (cur <= endD) {
    result.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
};

// ── Phase distribution helper (reusable for pre-battle and large-gap independent programs) ──
function distributeTrainingPhases(trainingDayDates, phaseConfig, startSessionNum) {
  const total = trainingDayDates.length;
  const alloc = phaseConfig.map(p => ({ ...p, days: Math.round(total * p.pct) }));

  // Fix rounding
  let sum = alloc.reduce((s, p) => s + p.days, 0);
  if (sum < total) alloc[0].days += (total - sum);
  else if (sum > total) {
    let excess = sum - total;
    for (let i = alloc.length - 1; i >= 0 && excess > 0; i--) {
      const rm = Math.min(alloc[i].days, excess);
      alloc[i].days -= rm;
      excess -= rm;
    }
  }

  // Ensure each phase gets at least 1 day if total allows
  if (total >= alloc.length) {
    for (let i = 0; i < alloc.length; i++) {
      if (alloc[i].days === 0) {
        const largest = alloc.reduce((max, p, idx) => p.days > alloc[max].days ? idx : max, 0);
        if (alloc[largest].days > 1) { alloc[largest].days--; alloc[i].days = 1; }
      }
    }
  }

  // Build assignments and summary entries
  const assignments = [];
  const summaryEntries = [];
  let tdIdx = 0;
  let session = startSessionNum;
  for (const phase of alloc) {
    const dates = trainingDayDates.slice(tdIdx, tdIdx + phase.days);
    summaryEntries.push({
      name: phase.name, color: phase.color,
      trainingDayCount: dates.length,
      startDate: dates[0] || null, endDate: dates[dates.length - 1] || null,
    });
    for (const ds of dates) {
      session++;
      assignments.push({ date: ds, phase: phase.name, color: phase.color, session });
    }
    tdIdx += phase.days;
  }
  return { assignments, summaryEntries, nextSession: session };
}

// ── Phase distribution algorithm ───────────────────────────────────────────
export function computeDayMap(plan, startFrom) {
  const today = toYMD(new Date());
  const battles = [...(plan.battles || [])].sort((a, b) => a.date.localeCompare(b.date));
  if (!battles.length) return { dayMap: {}, phaseSummary: [], battleDates: [] };

  const firstBattle = battles[0].date;
  const lastBattle = battles[battles.length - 1].date;
  const battleDateSet = new Set(battles.map(b => b.date));
  const overrides = plan.customDayOverrides || {};
  const trainingDaysOfWeek = (plan.trainingDays || []).map(Number);

  // Get phase config
  let phaseConfig;
  if (plan.preset === "custom" && plan.customPhases) {
    const customColors = ["#1565c0", "#f57f17", "#e53935", "#2e7d32", "#ab47bc", "#ff7043"];
    phaseConfig = plan.customPhases.map((p, i) => ({
      name: p.name, pct: p.percentage / 100, color: customColors[i % customColors.length],
    }));
  } else {
    phaseConfig = PRESET_CONFIGS[plan.preset]?.phases || PRESET_CONFIGS.smoke.phases;
  }

  const isTrainingDay = (dateStr) => {
    if (overrides[dateStr] === "rest") return false;
    if (overrides[dateStr] === "training") return true;
    return trainingDaysOfWeek.includes(getDayOfWeek(dateStr));
  };

  const dayMap = {};
  const phaseSummary = [];
  let sessionNum = 0;

  // ── Phase 1: Distribute phases across training days before first battle ──
  const startDate = startFrom || (today < firstBattle ? today : firstBattle);
  const dayBeforeBattle = addDays(firstBattle, -1);

  const preBattleTrainingDays = [];
  if (startDate <= dayBeforeBattle) {
    for (const ds of enumDates(startDate, dayBeforeBattle)) {
      if (battleDateSet.has(ds) || ds === dayBeforeBattle) continue;
      if (isTrainingDay(ds)) preBattleTrainingDays.push(ds);
    }
  }

  const { assignments, summaryEntries, nextSession } = distributeTrainingPhases(preBattleTrainingDays, phaseConfig, sessionNum);
  sessionNum = nextSession;
  for (const a of assignments) dayMap[a.date] = { phase: a.phase, phaseColor: a.color, type: "training", session: a.session };
  phaseSummary.push(...summaryEntries);

  // Fill rest days before first battle
  if (startDate <= dayBeforeBattle) {
    for (const ds of enumDates(startDate, dayBeforeBattle)) {
      if (dayMap[ds] || battleDateSet.has(ds)) continue;
      let restPhase = phaseSummary[0]?.name || "";
      let restColor = phaseSummary[0]?.color || "#999";
      for (const ps of phaseSummary) {
        if (ps.startDate && ds >= ps.startDate) { restPhase = ps.name; restColor = ps.color; }
      }
      dayMap[ds] = { phase: restPhase, phaseColor: restColor, type: ds === dayBeforeBattle ? "mandatory_rest" : "rest", session: null };
    }
  }

  // ── Phase 2: Battle days ──
  for (const battle of battles) {
    dayMap[battle.date] = {
      phase: "BATTLE", phaseColor: PRESET_META[plan.preset]?.color || "#e53935",
      type: "battle", session: null, battleId: battle.id, eventName: battle.eventName,
    };
  }

  // ── Phase 3: Gap-based phases between battles ──
  // POLISH phase config (always used for compressed pre-battle phases)
  const polishPhase = { name: "POLISH", color: "#f57f17" };

  for (let i = 0; i < battles.length - 1; i++) {
    const afterBattle = addDays(battles[i].date, 1);
    const beforeNext = addDays(battles[i + 1].date, -1);
    if (!afterBattle || !beforeNext || afterBattle > beforeNext) continue;

    const gap = daysBetween(battles[i].date, battles[i + 1].date);
    const gapDates = enumDates(afterBattle, beforeNext);

    if (gap <= 2) {
      // ── SCENARIO 4: Same event — all rest, unified visual ──
      const lastColor = phaseSummary[phaseSummary.length - 1]?.color || "#999";
      const lastPhase = phaseSummary[phaseSummary.length - 1]?.name || "REST";
      for (const ds of gapDates) {
        if (!dayMap[ds]) dayMap[ds] = { phase: lastPhase, phaseColor: lastColor, type: "rest", session: null };
      }

    } else if (gap <= 7) {
      // ── SCENARIO 3: Short gap — STAY READY ──
      let srTraining = 0;
      let srStart = null, srEnd = null;
      for (const ds of gapDates) {
        if (dayMap[ds]) continue;
        const isMandatory = ds === afterBattle || ds === beforeNext;
        if (isMandatory) {
          dayMap[ds] = { phase: "STAY READY", phaseColor: STAY_READY_COLOR, type: "mandatory_rest", session: null };
        } else if (isTrainingDay(ds)) {
          sessionNum++;
          srTraining++;
          dayMap[ds] = { phase: "STAY READY", phaseColor: STAY_READY_COLOR, type: "training", session: sessionNum };
        } else {
          dayMap[ds] = { phase: "STAY READY", phaseColor: STAY_READY_COLOR, type: "rest", session: null };
        }
        if (!srStart) srStart = ds;
        srEnd = ds;
      }
      if (srStart) phaseSummary.push({ name: "STAY READY", color: STAY_READY_COLOR, trainingDayCount: srTraining, startDate: srStart, endDate: srEnd });

    } else if (gap <= 21) {
      // ── SCENARIO 2: Medium gap — MAINTAIN + compressed POLISH ──
      const polishStart = addDays(battles[i + 1].date, -5);
      let mTraining = 0, mStart = null, mEnd = null;
      let pTraining = 0, pStart = null, pEnd = null;

      for (const ds of gapDates) {
        if (dayMap[ds]) continue;
        const inPolish = ds >= polishStart;
        const phaseName = inPolish ? polishPhase.name : "MAINTAIN";
        const phaseColor = inPolish ? polishPhase.color : MAINTAIN_COLOR;
        const isMandatory = ds === afterBattle || ds === beforeNext;

        if (isMandatory) {
          dayMap[ds] = { phase: phaseName, phaseColor: phaseColor, type: "mandatory_rest", session: null };
        } else if (isTrainingDay(ds)) {
          sessionNum++;
          dayMap[ds] = { phase: phaseName, phaseColor: phaseColor, type: "training", session: sessionNum };
          if (inPolish) { pTraining++; if (!pStart) pStart = ds; pEnd = ds; }
          else { mTraining++; if (!mStart) mStart = ds; mEnd = ds; }
        } else {
          dayMap[ds] = { phase: phaseName, phaseColor: phaseColor, type: "rest", session: null };
        }
        // Track date ranges for rest days too
        if (!inPolish) { if (!mStart) mStart = ds; mEnd = ds; }
        else { if (!pStart) pStart = ds; pEnd = ds; }
      }
      if (mStart) phaseSummary.push({ name: "MAINTAIN", color: MAINTAIN_COLOR, trainingDayCount: mTraining, startDate: mStart, endDate: mEnd });
      if (pStart) phaseSummary.push({ name: polishPhase.name, color: polishPhase.color, trainingDayCount: pTraining, startDate: pStart, endDate: pEnd });

    } else {
      // ── SCENARIO 1: Large gap (22+) — full independent program ──
      // Day after battle = mandatory rest
      if (!dayMap[afterBattle]) dayMap[afterBattle] = { phase: "ADJUST", phaseColor: ADJUST_COLOR, type: "mandatory_rest", session: null };
      // Day before next battle = mandatory rest
      if (!dayMap[beforeNext]) dayMap[beforeNext] = { phase: phaseConfig[phaseConfig.length - 1]?.name || "REST", phaseColor: phaseConfig[phaseConfig.length - 1]?.color || "#999", type: "mandatory_rest", session: null };

      // Collect training days in the gap (excluding mandatory rest days)
      const gapTrainingDays = [];
      for (const ds of gapDates) {
        if (dayMap[ds]) continue;
        if (isTrainingDay(ds)) gapTrainingDays.push(ds);
      }

      const indep = distributeTrainingPhases(gapTrainingDays, phaseConfig, sessionNum);
      sessionNum = indep.nextSession;
      for (const a of indep.assignments) dayMap[a.date] = { phase: a.phase, phaseColor: a.color, type: "training", session: a.session };
      phaseSummary.push(...indep.summaryEntries);

      // Fill rest days in gap
      for (const ds of gapDates) {
        if (dayMap[ds]) continue;
        let restPhase = indep.summaryEntries[0]?.name || "REST";
        let restColor = indep.summaryEntries[0]?.color || "#999";
        for (const ps of indep.summaryEntries) {
          if (ps.startDate && ds >= ps.startDate) { restPhase = ps.name; restColor = ps.color; }
        }
        dayMap[ds] = { phase: restPhase, phaseColor: restColor, type: "rest", session: null };
      }
    }
  }

  // ── Phase 4: Day after last battle ──
  const dayAfterLast = addDays(lastBattle, 1);
  if (dayAfterLast && !dayMap[dayAfterLast]) {
    dayMap[dayAfterLast] = { phase: "ADJUST", phaseColor: ADJUST_COLOR, type: "mandatory_rest", session: null };
  }

  // ── Phase 5: Apply per-day phase overrides ──
  const phaseOverrides = plan.phaseOverrides || {};
  const PHASE_MAP = { lockin: { phase: "LOCK IN", color: "#1565c0", type: "training" }, polish: { phase: "POLISH", color: "#f57f17", type: "training" }, rest: { phase: "REST", color: "#7a7a7a", type: "rest" } };
  for (const [dateStr, phaseKey] of Object.entries(phaseOverrides)) {
    if (battleDateSet.has(dateStr)) continue; // battle days cannot be overridden
    const mapped = PHASE_MAP[phaseKey];
    if (!mapped || !dayMap[dateStr]) continue;
    const existing = dayMap[dateStr];
    dayMap[dateStr] = { ...existing, phase: mapped.phase, phaseColor: mapped.color, type: mapped.type, session: mapped.type === "training" ? existing.session : null };
  }

  return { dayMap, phaseSummary, battleDates: battles.map(b => b.date) };
}

// ── Plan statistics ────────────────────────────────────────────────────────
export function getPlanStats(plan, dayMap) {
  const today = toYMD(new Date());
  const battles = [...(plan.battles || [])].sort((a, b) => a.date.localeCompare(b.date));
  const futureBattles = battles.filter(b => b.date >= today);
  const nextBattle = futureBattles[0] || null;

  let daysLeft = 0;
  let sessionsLeft = 0;

  if (nextBattle) {
    daysLeft = daysBetween(today, nextBattle.date);
    // Count remaining training sessions
    Object.entries(dayMap).forEach(([ds, info]) => {
      if (ds >= today && ds < nextBattle.date && info.type === "training") sessionsLeft++;
    });
  }

  // Current phase: what phase is today in?
  const todayInfo = dayMap[today];
  const currentPhase = todayInfo?.phase || null;

  // Completion stats
  const completedTasks = plan.completedTasks || {};
  let totalTasks = 0;
  let doneTasks = 0;
  Object.keys(dayMap).forEach(ds => {
    if (ds < today) return;
    const info = dayMap[ds];
    let count = 0;
    if (info.type === "training") {
      if (info.phase === "STAY READY") count = 2;
      else if (info.phase === "MAINTAIN" || info.phase === "ADJUST") count = 3;
      else count = 4;
    } else if (info.type === "rest" || info.type === "mandatory_rest") { count = 2; }
    totalTasks += count;
    for (let i = 0; i < count; i++) {
      if (completedTasks[`${ds}-${i}`]) doneTasks++;
    }
  });

  return { daysLeft, sessionsLeft, nextBattle, currentPhase, futureBattles, totalTasks, doneTasks };
}

// ── Task generation (deterministic, not stored) ────────────────────────────
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Task pools — each task: { emoji, key (translation key) }
export const TASK_POOLS = {
  // SMOKE THEM ALL phases
  BUILD: [
    { emoji: "\u{1F3C3}", key: "prepTaskRunRounds" },
    { emoji: "\u{1F57A}", key: "prepTaskDrill5Moves" },
    { emoji: "\u{1F504}", key: "prepTaskWorkTransitions" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmReview" },
    { emoji: "\u{1F4AA}", key: "prepTaskEndurance" },
    { emoji: "\u{1F3B5}", key: "prepTaskUnfamiliarMusic" },
  ],
  SHARPEN: [
    { emoji: "\u{1F3AF}", key: "prepTaskWeakestTransition" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmFindFix" },
    { emoji: "\u{1F527}", key: "prepTaskPolishOpening" },
    { emoji: "\u2702\uFE0F", key: "prepTaskCutMove" },
    { emoji: "\u{1FA9E}", key: "prepTaskRunInFront" },
    { emoji: "\u{1F525}", key: "prepTaskDrillBlowup" },
  ],
  PEAK: [
    { emoji: "\u{1F94A}", key: "prepTaskFullSparring" },
    { emoji: "\u2694\uFE0F", key: "prepTaskBackToBack" },
    { emoji: "\u{1F3AD}", key: "prepTaskCrowdPressure" },
    { emoji: "\u{1F4A3}", key: "prepTaskSimulateBattle" },
    { emoji: "\u{1F9E0}", key: "prepTaskMentalRunThrough" },
    { emoji: "\u{1F4CA}", key: "prepTaskReviewFootage" },
  ],
  TAPER: [
    { emoji: "\u{1F9D8}", key: "prepTaskLightRunThrough" },
    { emoji: "\u{1F9E0}", key: "prepTaskMentalVis" },
    { emoji: "\u{1F4CB}", key: "prepTaskReviewGamePlan" },
    { emoji: "\u{1F634}", key: "prepTaskRestTrust" },
    { emoji: "\u{1F3B5}", key: "prepTaskListenMusic" },
  ],
  // PROVE YOURSELF phases
  "LOCK IN": [
    { emoji: "\u{1F512}", key: "prepTaskBest3Combos" },
    { emoji: "\u{1F57A}", key: "prepTaskCoreMovesFull" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmBestMaterial" },
    { emoji: "\u{1F3AF}", key: "prepTaskOneMove10Reps" },
    { emoji: "\u{1F6AB}", key: "prepTaskNoNewMoves" },
  ],
  POLISH: [
    { emoji: "\u2728", key: "prepTaskCleanExecution" },
    { emoji: "\u{1F517}", key: "prepTaskSmoothTransitions" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmCompare" },
    { emoji: "\u{1F3B5}", key: "prepTaskRun3Tracks" },
    { emoji: "\u{1FA9E}", key: "prepTaskPerformFeedback" },
  ],
  PERFORM: [
    { emoji: "\u{1F3AD}", key: "prepTaskFullPerformance" },
    { emoji: "\u{1F9E0}", key: "prepTaskMentalBefore" },
    { emoji: "\u{1F4AA}", key: "prepTaskTrustDrill" },
    { emoji: "\u{1F624}", key: "prepTaskBattleFace" },
  ],
  // MAKE YOUR MARK phases
  FOUNDATION: [
    { emoji: "\u{1F9F1}", key: "prepTaskDrillArsenal3x" },
    { emoji: "\u{1F504}", key: "prepTaskPracticeGodowns" },
    { emoji: "\u{1F3C3}", key: "prepTaskToprock30s" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmBasics" },
  ],
  "BUILD ROUND": [
    { emoji: "\u{1F528}", key: "prepTaskBuildSequence" },
    { emoji: "\u{1F517}", key: "prepTaskFindTransitions" },
    { emoji: "\u23F1\uFE0F", key: "prepTaskTimeRound" },
    { emoji: "\u{1F504}", key: "prepTaskTry3Orders" },
  ],
  "BATTLE READY": [
    { emoji: "\u{1F501}", key: "prepTaskRun5xBackToBack" },
    { emoji: "\u{1F3B5}", key: "prepTaskDifferentMusic" },
    { emoji: "\u{1F4AA}", key: "prepTaskRunTired" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmJudge" },
  ],
  "TRUST IT": [
    { emoji: "\u{1F9D8}", key: "prepTaskOneLightRun" },
    { emoji: "\u{1F9E0}", key: "prepTaskCloseEyesMental" },
    { emoji: "\u{1F4AC}", key: "prepTaskRemindWhy" },
    { emoji: "\u{1F634}", key: "prepTaskRestDoneWork" },
  ],
  // ADJUST (between battles)
  ADJUST: [
    { emoji: "\u{1F4DD}", key: "prepTaskReviewLastBattle" },
    { emoji: "\u{1F527}", key: "prepTaskFixOneThingAdj" },
    { emoji: "\u{1F57A}", key: "prepTaskLightRunAdj" },
    { emoji: "\u{1F3AF}", key: "prepTaskSharpenOpener" },
    { emoji: "\u{1F634}", key: "prepTaskRecoveryDay" },
  ],
  // MAINTAIN (between battles, medium gap)
  MAINTAIN: [
    { emoji: "\u{1F57A}", key: "prepTaskLightDrilling" },
    { emoji: "\u{1F4F9}", key: "prepTaskFilmReviewMaintain" },
    { emoji: "\u{1F9D8}", key: "prepTaskActiveRecovery" },
    { emoji: "\u{1F9E0}", key: "prepTaskMentalPrepMaintain" },
    { emoji: "\u{1F4AA}", key: "prepTask70PercentSets" },
  ],
  // STAY READY (between battles, short gap)
  "STAY READY": [
    { emoji: "\u{1F9D8}", key: "prepTaskActiveRest" },
    { emoji: "\u{1F9E0}", key: "prepTaskMentalReset" },
    { emoji: "\u{1F57A}", key: "prepTaskLightShadowRounds" },
    { emoji: "\u{1F4CB}", key: "prepTaskReviewPlanReady" },
  ],
  // REST days
  REST: [
    { emoji: "\u{1F9D8}", key: "prepTaskStretchMobility" },
    { emoji: "\u{1F4A7}", key: "prepTaskHydrate" },
    { emoji: "\u{1F4F9}", key: "prepTaskWatchFootage" },
    { emoji: "\u{1F4DD}", key: "prepTaskReviewPlan" },
    { emoji: "\u{1F634}", key: "prepTaskSleepRecovery" },
  ],
};

export function getTasksForDay(planId, dateStr, dayInfo, prevDayTaskKeys = []) {
  if (!dayInfo) return [];

  let pool;
  let count;

  if (dayInfo.type === "battle") {
    // Battle day: no tasks
    return [];
  } else if (dayInfo.type === "rest" || dayInfo.type === "mandatory_rest") {
    pool = TASK_POOLS.REST;
    count = 2;
  } else if (dayInfo.type === "training") {
    pool = TASK_POOLS[dayInfo.phase] || TASK_POOLS.BUILD;
    if (dayInfo.phase === "STAY READY") count = 2;
    else if (dayInfo.phase === "MAINTAIN" || dayInfo.phase === "ADJUST") count = 3;
    else count = 4;
    // If pool has fewer items than count, use what's available
    count = Math.min(count, pool.length);
  } else {
    return [];
  }

  const seed = planId + dateStr;
  // Filter out previous day's tasks for anti-repetition
  const available = pool.filter(t => !prevDayTaskKeys.includes(t.key));
  // If filtering removed too many, fall back to full pool
  const usePool = available.length >= count ? available : pool;

  // Deterministic shuffle using hash
  const sorted = [...usePool].sort((a, b) => hashSeed(seed + a.key) - hashSeed(seed + b.key));
  return sorted.slice(0, count);
}

// Get previous day's task keys (for anti-repetition)
export function getPrevDayTasks(planId, dateStr, dayMap) {
  const prev = addDays(dateStr, -1);
  if (!prev || !dayMap[prev]) return [];
  return getTasksForDay(planId, prev, dayMap[prev], []).map(t => t.key);
}

// ── Multi-plan helpers ──────────────────────────────────────────────────────

// Compute dayMaps for all active plans — sequential, non-overlapping
export function computeAllDayMaps(plans) {
  if (!plans || !plans.length) return [];

  // Sort plans by earliest battle date
  const sorted = [...plans].sort((a, b) => {
    const aFirst = (a.battles || []).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "9999";
    const bFirst = (b.battles || []).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "9999";
    return aFirst.localeCompare(bFirst);
  });

  let nextStart = null; // First plan starts from today (default)
  const results = [];

  for (const plan of sorted) {
    const { dayMap, phaseSummary, battleDates } = computeDayMap(plan, nextStart);
    results.push({ planId: plan.id, planName: plan.eventName || plan.planName, preset: plan.preset, eventName: plan.eventName, dayMap, phaseSummary, battleDates });

    // Next plan starts the day after this plan's last battle
    const lastBattle = (plan.battles || []).sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
    if (lastBattle) {
      nextStart = addDays(lastBattle, 1);
    }
  }

  return results;
}

// Get all plan entries active on a specific date
export function getMergedCalendarData(allDayMaps, dateStr) {
  const entries = [];
  for (const dm of allDayMaps) {
    const info = dm.dayMap[dateStr];
    if (info) {
      entries.push({ planId: dm.planId, planName: dm.planName, preset: dm.preset, phase: info.phase, phaseColor: info.phaseColor, type: info.type, session: info.session, eventName: info.eventName });
    }
  }
  return entries;
}

// Get current phase info for a single plan (today's dayMap entry)
export function getCurrentPhaseForPlan(plan) {
  const { dayMap } = computeDayMap(plan);
  const today = toYMD(new Date());
  return dayMap[today] || null;
}
