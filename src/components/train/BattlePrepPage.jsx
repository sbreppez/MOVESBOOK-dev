import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { useT } from '../../hooks/useTranslation';
import { PRESET_META, computeDayMap, computeAllDayMaps, getPlanStats, getTasksForDay, getPrevDayTasks, daysBetween, toYMD, getPreparationStats, BATTLE_RESULTS } from './battlePrepHelpers';
import { BattlePrepSetup } from './BattlePrepSetup';
import { BattleDayView, BattleShareCard } from './BattleDayView';
import { BattleHistoryView } from './BattleHistoryView';
import { BattleResultDetail } from '../reflect/BattleResultDetail';

const DAY_LABELS = ["S","M","T","W","T","F","S"];

// Phase cycle order for per-day editing (Option A: cycle on tap)
const PHASE_CYCLE = [
  { key: "lockin", label: "LOCK IN", color: "#1565c0" },
  { key: "polish", label: "POLISH", color: "#f57f17" },
  { key: "rest", label: "REST", color: null },
];

const PRESET_IDS = ["smoke", "prove", "mark", "custom"];

export const BattlePrepPage = ({ battleprep, setBattleprep, moves, sets, addToast, calendar, battlePrepSeed, onBattlePrepSeedUsed, addCalendarEvent, removeCalendarEvent, onAddTrigger, onOpenSharedCalendar }) => {
  const t = useT();
  const plans = useMemo(() => battleprep?.plans || [], [battleprep?.plans]);
  const today = toYMD(new Date());

  const [showSetup, setShowSetup] = useState(false);
  const [setupPreset, setSetupPreset] = useState(null);
  const [seedData, setSeedData] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [selectedDayByPlan, setSelectedDayByPlan] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteUnplanned, setConfirmDeleteUnplanned] = useState(null); // calendar event to delete
  const [showHistory, setShowHistory] = useState(false);
  // Deep-link target for BattleDayView's initial phase. Set when a seed
  // arrives with `phase` (e.g., from CalendarOverlay's "LOG REFLECTION"
  // CTA), then cleared by BattleCard once consumed so subsequent remounts
  // don't re-apply.
  const [pendingPhase, setPendingPhase] = useState(null); // { planId, battleId, phase } | null
  // Selected past battle for BattleResultDetail BottomSheet. Rendered at
  // BattlePrepPage root so a single sheet serves all entry points
  // (past-plan BATTLE RESULTS button + multi-battle plan past-battle rows).
  const [detailBattle, setDetailBattle] = useState(null); // { battle, plan, dayMap } | null

  // Handle incoming seed from Calendar → Prep
  useEffect(() => {
    if (!battlePrepSeed) return;
    if (battlePrepSeed.focus === "plan" && battlePrepSeed.planId) {
      setExpandedPlanId(battlePrepSeed.planId);
      if (battlePrepSeed.date) {
        setSelectedDayByPlan(prev => ({ ...prev, [battlePrepSeed.planId]: battlePrepSeed.date }));
      }
      if (battlePrepSeed.phase) {
        const seedPlan = plans.find(p => p.id === battlePrepSeed.planId);
        const seedBattle = seedPlan?.battles?.find(b => b.date === battlePrepSeed.date);
        if (seedBattle) {
          setPendingPhase({ planId: seedPlan.id, battleId: seedBattle.id, phase: battlePrepSeed.phase });
        }
      }
    } else {
      setSeedData(battlePrepSeed);
      setShowSetup(true);
    }
    if (onBattlePrepSeedUsed) onBattlePrepSeedUsed();
  }, [battlePrepSeed, onBattlePrepSeedUsed, plans]);

  // Handle + menu "Add Battle" trigger
  const prevAddTrigger = useRef(onAddTrigger);
  useEffect(() => {
    if (onAddTrigger !== prevAddTrigger.current && onAddTrigger > 0) {
      setSetupPreset(null);
      setShowSetup(true);
    }
    prevAddTrigger.current = onAddTrigger;
  }, [onAddTrigger]);

  const handlePlanGenerated = (plan) => {
    setShowSetup(false);
    setSetupPreset(null);
    setSeedData(null);
    setExpandedPlanId(plan.id);
    if (plan && plan.battles?.length >= 2) {
      const sorted = [...plan.battles].sort((a, b) => a.date.localeCompare(b.date));
      let minGap = Infinity;
      for (let i = 0; i < sorted.length - 1; i++) minGap = Math.min(minGap, daysBetween(sorted[i].date, sorted[i + 1].date));
      if (minGap <= 2) addToast({ icon: "swords", title: t("gapToastSameEvent") });
      else if (minGap <= 7) addToast({ icon: "swords", title: t("gapToastStayReady") });
      else if (minGap <= 21) addToast({ icon: "swords", title: t("gapToastMaintain") });
    }
  };

  const handleDeletePlan = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setBattleprep(prev => ({
      ...prev,
      plans: (prev.plans || []).filter(p => p.id !== planId),
      history: [...(prev.history || []), { ...plan, status: "cancelled", endDate: today }],
    }));
    setExpandedPlanId(null);
    setEditingPlanId(null);
    setConfirmDeleteId(null);
    addToast({ icon: "list", title: t("planCancelled") || "Plan cancelled" });
  };

  // Update a plan field directly (for immediate saves like phase overrides)
  const updatePlan = useCallback((planId, updates) => {
    setBattleprep(prev => ({
      ...prev,
      plans: (prev.plans || []).map(p => p.id !== planId ? p : { ...p, ...updates }),
    }));
  }, [setBattleprep]);

  const toggleTask = useCallback((planId, dateStr, taskIdx) => {
    setBattleprep(prev => {
      const newPlans = (prev.plans || []).map(p => {
        if (p.id !== planId) return p;
        const key = `${dateStr}-${taskIdx}`;
        const newCompleted = { ...(p.completedTasks || {}), [key]: !(p.completedTasks || {})[key] };
        const newPlan = { ...p, completedTasks: newCompleted };
        const { dayMap } = computeDayMap(newPlan);
        const info = dayMap[dateStr];
        if (info && addCalendarEvent) {
          const prevKeys = getPrevDayTasks(newPlan.id, dateStr, dayMap);
          const tasks = getTasksForDay(newPlan.id, dateStr, info, prevKeys);
          const allDone = tasks.length > 0 && tasks.every((_, i) => newCompleted[`${dateStr}-${i}`]);
          if (allDone && info.type === "training") {
            addCalendarEvent({ date: dateStr, type: "training", title: `${newPlan.eventName || newPlan.planName} \u2014 ${info.phase}`, source: "battleprep", planId: newPlan.id }, { silent: true });
          }
        }
        return newPlan;
      });
      return { ...prev, plans: newPlans };
    });
  }, [setBattleprep, addCalendarEvent]);

  // Compute sequential dayMaps for all plans (non-overlapping)
  const allDayMaps = useMemo(() => computeAllDayMaps(plans), [plans]);

  // Auto-expand battle day card
  useEffect(() => {
    for (const plan of plans) {
      const dmData = allDayMaps.find(d => d.planId === plan.id);
      const todayInfo = dmData?.dayMap?.[today];
      if (todayInfo?.type === "battle" && (plan.battles || []).some(b => b.date === today && !b.completed)) {
        setExpandedPlanId(plan.id);
        break;
      }
    }
  }, [plans, allDayMaps, today]);

  // Find calendar battle events that don't have a corresponding prep plan
  const unplannedBattles = useMemo(() => {
    const calEvents = (calendar?.events || []).filter(e => e.type === "battle" && e.date >= today);
    const plannedDates = new Set();
    for (const p of plans) {
      for (const b of (p.battles || [])) plannedDates.add(b.date);
    }
    return calEvents.filter(e => !plannedDates.has(e.date)).sort((a, b) => a.date.localeCompare(b.date));
  }, [calendar, plans, today]);

  // Sort plans by earliest future battle date
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aNext = (a.battles || []).filter(x => x.date >= today).sort((x, y) => x.date.localeCompare(y.date))[0];
      const bNext = (b.battles || []).filter(x => x.date >= today).sort((x, y) => x.date.localeCompare(y.date))[0];
      if (!aNext && !bNext) return 0;
      if (!aNext) return 1;
      if (!bNext) return -1;
      return aNext.date.localeCompare(bNext.date);
    });
  }, [plans, today]);

  // Group plans by state: active (any battle still upcoming) above the PAST
  // BATTLES divider, past (all battles past) below. Past plans sorted by
  // most-recent battle date desc so the latest milestone reads first. (#141)
  const { activePlans, pastPlans } = useMemo(() => {
    const active = [];
    const past = [];
    sortedPlans.forEach(plan => {
      const battles = plan.battles || [];
      // Empty plan (no battles yet) stays in active group.
      if (!battles.length) { active.push(plan); return; }
      // Manual completion (Battle Complete button) overrides date-based
      // detection: a battle marked completed today already counts as past
      // for grouping purposes. (#146)
      const allPast = battles.every(b => b.date < today || b.completed);
      if (allPast) past.push(plan);
      else active.push(plan);
    });
    past.sort((a, b) => {
      const aLast = (a.battles || []).reduce((m, x) => x.date > m ? x.date : m, "");
      const bLast = (b.battles || []).reduce((m, x) => x.date > m ? x.date : m, "");
      return bLast.localeCompare(aLast);
    });
    return { activePlans: active, pastPlans: past };
  }, [sortedPlans, today]);

  // ── HISTORY view ──
  if (showHistory) {
    return <BattleHistoryView
      history={battleprep?.history || []}
      onClose={() => setShowHistory(false)}
      t={t} />;
  }

  // ── SETUP overlay ──
  if (showSetup) {
    return <BattlePrepSetup
      initialPreset={setupPreset}
      battleprep={battleprep} setBattleprep={setBattleprep}
      moves={moves} sets={sets}
      onGenerated={handlePlanGenerated}
      onCancel={() => { setShowSetup(false); setSetupPreset(null); setSeedData(null); }}
      calendar={calendar}
      seedData={seedData}
      addCalendarEvent={addCalendarEvent}
    />;
  }

  // ── EMPTY STATE ──
  if (!plans.length && !unplannedBattles.length) {
    const history = battleprep?.history || [];
    return (
      <div style={{ flex: 1, overflow: "auto", padding: "12px 12px 80px" }}>
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <Ic n="sword" s={32} c={C.textMuted}/>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMuted, margin: "12px 0 4px", lineHeight: 1.5 }}>
            {t("noUpcomingBattles")}
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, margin: 0 }}>
            {t("tapToAddBattle")}
          </p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowHistory(true)}
            style={{ display: "block", margin: "8px auto 0", background: "none", border: "none",
              cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
              letterSpacing: 1, color: C.textMuted, padding: "8px 16px" }}>
            {t("planHistory")} ({history.length})
          </button>
        )}
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "12px 12px 80px" }}>
      {/* View Full Calendar button */}
      <button onClick={() => onOpenSharedCalendar && onOpenSharedCalendar()}
        style={{ width: "100%", padding: "10px 12px", background: "transparent",
          border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer",
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 2,
          color: C.textSec, textAlign: "center", marginBottom: 12, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 6 }}>
        {"\u{1F4C5}"} {t("viewFullCalendar")}
      </button>

      {/* Battle cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {activePlans.map(plan => {
          const dmData = allDayMaps.find(d => d.planId === plan.id);
          return (
          <BattleCard
            key={plan.id}
            plan={plan}
            precomputedDayMap={dmData?.dayMap}
            precomputedPhaseSummary={dmData?.phaseSummary}
            isExpanded={expandedPlanId === plan.id}
            isEditing={editingPlanId === plan.id}
            selectedDay={selectedDayByPlan[plan.id] || null}
            pendingPhase={pendingPhase?.planId === plan.id ? pendingPhase : null}
            onPendingPhaseConsumed={() => setPendingPhase(null)}
            isPastPlan={false}
            onOpenBattleResult={({ battle, dayMap }) => setDetailBattle({ battle, plan, dayMap })}
            onToggleExpand={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
            onToggleEdit={() => setEditingPlanId(editingPlanId === plan.id ? null : plan.id)}
            onSelectDay={(day) => setSelectedDayByPlan(prev => ({ ...prev, [plan.id]: prev[plan.id] === day ? null : day }))}
            onToggleTask={(dateStr, idx) => toggleTask(plan.id, dateStr, idx)}
            onDelete={() => setConfirmDeleteId(plan.id)}
            onOpenCalendar={() => {
              const firstBattle = (plan.battles || []).sort((a, b) => a.date.localeCompare(b.date))[0];
              if (firstBattle && onOpenSharedCalendar) {
                const d = new Date(firstBattle.date + "T00:00:00");
                onOpenSharedCalendar({ year: d.getFullYear(), month: d.getMonth() });
              } else if (onOpenSharedCalendar) {
                onOpenSharedCalendar();
              }
            }}
            updatePlan={updatePlan}
            setBattleprep={setBattleprep}
            addToast={addToast}
            t={t}
            today={today}
            moves={moves}
            sets={sets}
          />
          );
        })}
        {/* Unplanned calendar battles */}
        {unplannedBattles.map(evt => {
          const dateLabel = new Date(evt.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const dLeft = daysBetween(today, evt.date);
          return (
            <div key={`cal-${evt.id}`} style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "14px 14px",
              display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box" }}>
              <button onClick={() => { setSeedData({ date: evt.date, eventName: evt.title || "" }); setShowSetup(true); }}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 0.5, color: C.text }}>{evt.title || "Battle"}</span>
                    <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${C.accent}15`, color: C.accent, borderRadius: 4, padding: "2px 6px" }}>{t("noplan") || "NO PLAN"}</span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textSec, marginBottom: 2 }}>{dateLabel}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted }}>{dLeft >= 0 ? `${dLeft} ${t("daysLeft")}` : ""} {"\u2014"} {t("tapToAddBattle")}</div>
                </div>
                <Ic n="chevR" s={14} c={C.textMuted} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteUnplanned(evt); }}
                style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic n="trash" s={12} c={C.red} />
              </button>
            </div>
          );
        })}

        {/* PAST BATTLES divider — separates active plans (above) from past
            plans (below). Past plans stay in battleprep.plans forever; the
            divider is purely a UI grouping. (#141) */}
        {pastPlans.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 4px" }}>
            <div style={{ flex: 1, height: 1, background: C.borderLight }} />
            <span style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11,
              letterSpacing: 2, color: C.textMuted,
            }}>
              {t("pastBattles")}
            </span>
            <div style={{ flex: 1, height: 1, background: C.borderLight }} />
          </div>
        )}

        {pastPlans.map(plan => {
          const dmData = allDayMaps.find(d => d.planId === plan.id);
          return (
          <BattleCard
            key={plan.id}
            plan={plan}
            precomputedDayMap={dmData?.dayMap}
            precomputedPhaseSummary={dmData?.phaseSummary}
            isExpanded={expandedPlanId === plan.id}
            isEditing={editingPlanId === plan.id}
            selectedDay={selectedDayByPlan[plan.id] || null}
            pendingPhase={pendingPhase?.planId === plan.id ? pendingPhase : null}
            onPendingPhaseConsumed={() => setPendingPhase(null)}
            isPastPlan={true}
            onOpenBattleResult={({ battle, dayMap }) => setDetailBattle({ battle, plan, dayMap })}
            onToggleExpand={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
            onToggleEdit={() => setEditingPlanId(editingPlanId === plan.id ? null : plan.id)}
            onSelectDay={(day) => setSelectedDayByPlan(prev => ({ ...prev, [plan.id]: prev[plan.id] === day ? null : day }))}
            onToggleTask={(dateStr, idx) => toggleTask(plan.id, dateStr, idx)}
            onDelete={() => setConfirmDeleteId(plan.id)}
            onOpenCalendar={() => {
              const firstBattle = (plan.battles || []).sort((a, b) => a.date.localeCompare(b.date))[0];
              if (firstBattle && onOpenSharedCalendar) {
                const d = new Date(firstBattle.date + "T00:00:00");
                onOpenSharedCalendar({ year: d.getFullYear(), month: d.getMonth() });
              } else if (onOpenSharedCalendar) {
                onOpenSharedCalendar();
              }
            }}
            updatePlan={updatePlan}
            setBattleprep={setBattleprep}
            addToast={addToast}
            t={t}
            today={today}
            moves={moves}
            sets={sets}
          />
          );
        })}
      </div>

      {/* History link */}
      {(battleprep?.history || []).length > 0 && (
        <button onClick={() => setShowHistory(true)}
          style={{ display: "block", margin: "16px auto 0", background: "none", border: "none",
            cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
            letterSpacing: 1, color: C.textMuted, padding: "8px 16px" }}>
          {t("planHistory")} ({(battleprep?.history || []).length})
        </button>
      )}

      {/* Delete confirmation modal — plan */}
      {confirmDeleteId && (
        <Modal onClose={() => setConfirmDeleteId(null)}>
          <div style={{ padding: 20, textAlign: "center" }}>
            <span style={{ fontSize: 32 }}>{"\u26A0\uFE0F"}</span>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text, margin: "8px 0" }}>{t("endPlan")}</h3>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>{t("endPlanConfirm")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>{t("keepGoing")}</button>
              <button onClick={() => handleDeletePlan(confirmDeleteId)} style={{ flex: 1, padding: "10px", background: `${C.red}18`, border: `1px solid ${C.red}40`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.red }}>{t("endPlan")}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Battle result detail — shared sheet for past-plan BATTLE RESULTS button
          and any per-battle row tap (multi-battle plans). onLogReflection
          deep-links locally via pendingPhase since we're already on this page. */}
      <BattleResultDetail
        open={!!detailBattle}
        battle={detailBattle?.battle}
        plan={detailBattle?.plan}
        dayMap={detailBattle?.dayMap}
        onClose={() => setDetailBattle(null)}
        onLogReflection={({ planId, battleId }) => {
          const date = detailBattle?.battle?.date;
          setDetailBattle(null);
          if (planId && date) {
            setExpandedPlanId(planId);
            setSelectedDayByPlan(prev => ({ ...prev, [planId]: date }));
            setPendingPhase({ planId, battleId, phase: "reflection" });
          }
        }}
        onOpenPrep={({ planId }) => {
          // Land in BattleDayView at "pre" phase (no setPendingPhase) so
          // the user can press Battle Complete first. (#147)
          const date = detailBattle?.battle?.date;
          setDetailBattle(null);
          if (planId && date) {
            setExpandedPlanId(planId);
            setSelectedDayByPlan(prev => ({ ...prev, [planId]: date }));
          }
        }}
        t={t}
      />

      {/* Delete confirmation modal — unplanned calendar battle */}
      {confirmDeleteUnplanned && (
        <Modal onClose={() => setConfirmDeleteUnplanned(null)}>
          <div style={{ padding: 20, textAlign: "center" }}>
            <span style={{ fontSize: 32 }}>{"\u26A0\uFE0F"}</span>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text, margin: "8px 0" }}>{t("delete")}</h3>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>{(t("deleteBattle") || "Delete {name}?").replace("{name}", confirmDeleteUnplanned.title || "Battle")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDeleteUnplanned(null)} style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>{t("cancel")}</button>
              <button onClick={() => { if (removeCalendarEvent) removeCalendarEvent(confirmDeleteUnplanned.id); setConfirmDeleteUnplanned(null); addToast({ icon: "trash", title: t("delete") || "Deleted" }); }} style={{ flex: 1, padding: "10px", background: C.red, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>{t("delete")}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Battle Card Component ──
const BattleCard = ({ plan, precomputedDayMap, precomputedPhaseSummary, isExpanded, isEditing, selectedDay, pendingPhase, onPendingPhaseConsumed, isPastPlan, onOpenBattleResult, onToggleExpand, onToggleEdit, onSelectDay, onToggleTask, onDelete, onOpenCalendar, updatePlan, setBattleprep, addToast, t, today, moves, sets }) => {
  const meta = PRESET_META[plan.preset] || PRESET_META.smoke;
  const dayMap = precomputedDayMap || computeDayMap(plan).dayMap;
  const phaseSummary = precomputedPhaseSummary || computeDayMap(plan).phaseSummary;
  const currentPhase = dayMap[today] || null;
  const stats = useMemo(() => getPlanStats(plan, dayMap), [plan, dayMap]);
  const displayName = plan.eventName || plan.planName;

  // Battle day detection
  const todayBattle = useMemo(() => (plan.battles || []).find(b => b.date === today && !b.completed), [plan.battles, today]);
  const isBattleDay = currentPhase?.type === "battle" && !!todayBattle;
  // A battle whose date matches `selectedDay` (past or future). Lets
  // BattleDayView open for any tapped battle, not just today's — needed for
  // the CalendarOverlay deep-link that lands on a past unlogged battle so
  // the user can log reflection (initialPhase="reflection").
  const selectedBattle = useMemo(() => {
    if (!selectedDay) return null;
    return (plan.battles || []).find(b => b.date === selectedDay) || null;
  }, [plan.battles, selectedDay]);
  // Prefer today's battle when relevant, otherwise the explicitly selected
  // one. todayBattle's filter (`!b.completed`) keeps today's pre-battle UX
  // intact; selectedBattle has no such filter so already-logged past
  // battles can still be inspected.
  const battleToShow = todayBattle || selectedBattle;
  const showBattleDayView = (isBattleDay && !!todayBattle) || !!selectedBattle;
  // Deep-link from CalendarOverlay's "LOG REFLECTION" CTA — match seed's
  // pendingPhase against the battle we're about to render.
  const matchingPhase = pendingPhase && battleToShow && pendingPhase.battleId === battleToShow.id
    ? pendingPhase.phase
    : undefined;
  // Clear the pending phase once BattleDayView has mounted with it so a
  // later remount (e.g., user collapses then re-expands) doesn't re-apply.
  // BattleDayView's useState initializer has already captured initialPhase
  // by the time this effect fires.
  useEffect(() => {
    if (matchingPhase && typeof onPendingPhaseConsumed === "function") {
      onPendingPhaseConsumed();
    }
  }, [matchingPhase, onPendingPhaseConsumed]);

  // Edit state
  const [editEventName, setEditEventName] = useState(plan.eventName || "");
  const [editPlanName, setEditPlanName] = useState(plan.planName || "");
  const [editEventUrl, setEditEventUrl] = useState(plan.eventUrl || "");
  const [editLocation, setEditLocation] = useState(plan.location || "");
  const [editTrainingDays, setEditTrainingDays] = useState([...(plan.trainingDays || [])]);
  const [confirmPreset, setConfirmPreset] = useState(null); // preset id pending confirmation
  const [confirmReset, setConfirmReset] = useState(false);
  const [shareCardBattle, setShareCardBattle] = useState(null);

  useEffect(() => {
    setEditEventName(plan.eventName || "");
    setEditPlanName(plan.planName || "");
    setEditEventUrl(plan.eventUrl || "");
    setEditLocation(plan.location || "");
    setEditTrainingDays([...(plan.trainingDays || [])]);
  }, [plan.id, plan.eventName, plan.planName, plan.eventUrl, plan.location, plan.trainingDays]);

  const handleSaveEdit = () => {
    setBattleprep(prev => ({
      ...prev,
      plans: (prev.plans || []).map(p => p.id !== plan.id ? p : {
        ...p,
        eventName: editEventName.trim() || p.eventName,
        planName: editPlanName.trim() || editEventName.trim() || p.planName,
        eventUrl: editEventUrl.trim() || null,
        location: editLocation.trim() || null,
        trainingDays: editTrainingDays,
      }),
    }));
    onToggleEdit();
  };

  // Switch preset: rebuild schedule, clear overrides
  const handleSwitchPreset = (newPreset) => {
    updatePlan(plan.id, {
      preset: newPreset,
      phaseOverrides: {}, // clear per-day edits
      customDayOverrides: {}, // clear day type overrides
      completedTasks: {}, // reset task completion since schedule changed
      customPhases: newPreset === "custom" ? [{ name: "LOCK IN", percentage: 100 }] : null,
    });
    setConfirmPreset(null);
    addToast({ icon: "swords", title: `Switched to ${(PRESET_META[newPreset] || {}).label || newPreset}` });
  };

  // Per-day phase cycling: LOCK IN → POLISH → REST → LOCK IN
  const handleCyclePhase = (dateStr) => {
    const info = dayMap[dateStr];
    if (!info || info.type === "battle") return; // battle day locked
    const overrides = { ...(plan.phaseOverrides || {}) };
    // Determine current effective phase
    const currentLabel = info.phase;
    const idx = PHASE_CYCLE.findIndex(p => p.label === currentLabel);
    const nextIdx = (idx + 1) % PHASE_CYCLE.length;
    const next = PHASE_CYCLE[nextIdx];
    overrides[dateStr] = next.key; // "lockin", "polish", "rest"
    // Also update customDayOverrides for rest/training type
    const dayOverrides = { ...(plan.customDayOverrides || {}) };
    if (next.key === "rest") {
      dayOverrides[dateStr] = "rest";
    } else {
      dayOverrides[dateStr] = "training";
    }
    updatePlan(plan.id, { phaseOverrides: overrides, customDayOverrides: dayOverrides });
  };

  // Reset to default: clear all overrides
  const handleResetToDefault = () => {
    updatePlan(plan.id, { phaseOverrides: {}, customDayOverrides: {} });
    setConfirmReset(false);
    addToast({ icon: "refresh", title: t("resetToDefault") || "Reset to default schedule" });
  };

  // Check if any per-day overrides exist
  const hasOverrides = Object.keys(plan.phaseOverrides || {}).length > 0;

  // Format next battle date
  const nextBattle = stats.nextBattle;
  const battleDateStr = nextBattle ? new Date(nextBattle.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;

  // Get future dates for list view
  const allDates = useMemo(() => Object.keys(dayMap).sort(), [dayMap]);
  const futureDates = allDates.filter(d => d >= today);

  // Past battles in this plan — broadened from "completed + reflection
  // logged" to "any past battle by date" so unlogged past battles are also
  // surfaced (#141). Each row is tappable into BattleResultDetail; SHARE
  // button is gated on a logged reflection (canvas needs the data).
  const pastBattles = useMemo(() =>
    (plan.battles || [])
      // Date-past OR manually completed (#146 -- Battle Complete button
      // moves a today battle into the past treatment immediately).
      .filter(b => b.date < today || b.completed)
      .sort((a, b) => b.date.localeCompare(a.date)),
  [plan.battles, today]);

  // Latest past battle — used by past-plan card's BATTLE RESULTS button
  // (opens its detail) and ranking chip in the header.
  const latestPastBattle = pastBattles[0] || null;
  const rankingResult = useMemo(() => {
    if (!latestPastBattle?.reflection?.result) return null;
    return BATTLE_RESULTS.find(r => r.key === latestPastBattle.reflection.result) || null;
  }, [latestPastBattle]);

  const pastBattlesSection = pastBattles.length > 0 ? (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, marginBottom: 6 }}>
        {t("pastBattles")}
      </div>
      {pastBattles.map(b => {
        const dateLabel = new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const isLogged = b.reflectionLogged === true && b.reflection != null;
        return (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 6px", marginBottom: 4 }}>
            <button
              onClick={() => onOpenBattleResult && onOpenBattleResult({ battle: b, dayMap })}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", minWidth: 0 }}>
              <Ic n="sword" s={12} c={C.textMuted} />
              <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.text }}>{dateLabel}</span>
              <Ic n="eye" s={12} c={C.textMuted} />
            </button>
            {isLogged && (
              <button onClick={() => setShareCardBattle(b)}
                style={{ padding: "5px 10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: C.textSec, display: "flex", alignItems: "center", gap: 4 }}>
                <Ic n="share" s={11} c={C.textSec} /> {t("shareCard")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  const getDay = (dateStr) => {
    const info = dayMap[dateStr];
    if (!info) return { info: null, tasks: [] };
    const prevKeys = getPrevDayTasks(plan.id, dateStr, dayMap);
    const tasks = getTasksForDay(plan.id, dateStr, info, prevKeys);
    return { info, tasks };
  };

  const isDayComplete = (dateStr) => {
    const { tasks } = getDay(dateStr);
    if (!tasks.length) return false;
    return tasks.every((_, i) => (plan.completedTasks || {})[`${dateStr}-${i}`]);
  };

  return (
    <div style={{ background: C.surface, borderRadius: 8, overflow: "hidden", borderLeft: `4px solid ${meta.color}` }}>
      {/* Collapsed header — always visible */}
      <button onClick={onToggleExpand}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "14px 16px 13px 16px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <Ic n={isExpanded ? "chevD" : "chevR"} s={14} c={C.textMuted} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, letterSpacing: 0.5, color: C.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
            <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${meta.color}20`, color: meta.color, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>{meta.icon} {meta.label}</span>
            {isBattleDay && <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 900, background: `${meta.color}30`, color: meta.color, borderRadius: 4, padding: "2px 6px", flexShrink: 0, letterSpacing: 0.5 }}>{t("todayIsTheDay")}</span>}
          </div>
          {plan.location && (
            <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:2 }}>
              <Ic n="mapPin" s={11} c={C.textMuted}/>
              <span style={{ fontSize:11, fontFamily:FONT_BODY, color:C.textMuted }}>{plan.location}</span>
            </div>
          )}
          {battleDateStr && !isBattleDay && (
            <div style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textSec, marginBottom: 2 }}>{battleDateStr}</div>
          )}
          {isPastPlan ? (
            // Past plan header: show ranking chip from latest reflection,
            // or "Not logged" placeholder if reflection wasn't filled. (#141)
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 0.3, display: "flex", alignItems: "center", gap: 6 }}>
              {rankingResult ? (
                <span style={{
                  fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  background: `${rankingResult.color || C.textMuted}20`,
                  color: rankingResult.color || C.textMuted,
                  borderRadius: 4, padding: "2px 8px",
                }}>
                  {t(rankingResult.labelKey) || latestPastBattle.reflection.result}
                </span>
              ) : (
                <span style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textMuted, fontStyle: "italic" }}>
                  {t("notLogged")}
                </span>
              )}
            </div>
          ) : isBattleDay ? (
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: meta.color, letterSpacing: 0.3 }}>
              {"\u2694\uFE0F"} {t("battleDay")}
            </div>
          ) : nextBattle ? (
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }}>
              <span style={{ color: C.text, fontWeight: 900 }}>{stats.daysLeft}</span>
              <span style={{ color: C.textSec }}> {t("daysLeft")} </span>
              <span style={{ color: C.textSec }}>(</span>
              <span style={{ color: C.red, fontWeight: 900 }}>{stats.sessionsLeft} {t("daysTraining")}</span>
              <span style={{ color: C.textSec }}>)</span>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textSec }}>{t("planCompleted") || "Plan complete"}</div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && showBattleDayView && battleToShow && (
        <div style={{ padding: "10px 12px 14px" }}>
          <BattleDayView
            plan={plan} battle={battleToShow} dayMap={dayMap}
            moves={moves || []} sets={sets || []}
            updatePlan={updatePlan} setBattleprep={setBattleprep}
            addToast={addToast} t={t} today={today}
            initialPhase={matchingPhase} />
          {pastBattlesSection}
        </div>
      )}
      {isExpanded && !showBattleDayView && (
        <div style={{ padding: "0 12px 14px" }}>
          {/* Phase progress bar */}
          {phaseSummary.length > 0 && (
            <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: C.surfaceAlt, margin: "10px 0 8px" }}>
              {phaseSummary.map((p, i) => {
                const total = phaseSummary.reduce((s, x) => s + x.trainingDayCount, 0);
                return <div key={i} style={{ width: `${(p.trainingDayCount / (total || 1)) * 100}%`, background: p.color, opacity: today >= (p.startDate || "") && today <= (p.endDate || "9999") ? 1 : 0.4 }} />;
              })}
            </div>
          )}

          {/* Event URL + Google Maps links */}
          {(plan.eventUrl || plan.location) && (
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {plan.eventUrl && (
                <button onClick={() => { const url = plan.eventUrl.match(/^https?:\/\//) ? plan.eventUrl : `https://${plan.eventUrl}`; window.open(url, "_blank", "noopener"); }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%" }}>
                  <Ic n="extLink" s={14} c={C.accent}/>
                  <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.accent, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{plan.eventUrl}</span>
                </button>
              )}
              {plan.location && (
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location)}`, "_blank", "noopener")}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:C.surfaceAlt, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", textAlign:"left", width:"100%" }}>
                  <Ic n="mapPin" s={14} c={C.accent}/>
                  <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.accent }}>{t("openInMaps")}</span>
                  <span style={{ fontFamily:FONT_BODY, fontSize:11, color:C.textMuted, marginLeft:4 }}>{plan.location}</span>
                </button>
              )}
            </div>
          )}

          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button onClick={onOpenCalendar}
              style={{ flex: 1, padding: "7px 8px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {"\u{1F4C5}"} {t("calendarView") || "CALENDAR"}
            </button>
            {isPastPlan ? (
              // Past plan: EDIT PLAN is irrelevant -> swap to BATTLE RESULTS
              // which opens the detail BottomSheet for the latest battle. (#141)
              <button
                onClick={() => {
                  if (latestPastBattle && onOpenBattleResult) {
                    onOpenBattleResult({ battle: latestPastBattle, dayMap });
                  }
                }}
                style={{ flex: 1, padding: "7px 8px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Ic n="eye" s={12} c={C.textMuted} /> {t("battleResults")}
              </button>
            ) : (
              <button onClick={onToggleEdit}
                style={{ flex: 1, padding: "7px 8px", background: isEditing ? `${C.accent}15` : C.surfaceAlt, border: `1px solid ${isEditing ? C.accent : C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: isEditing ? C.accent : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Ic n="edit" s={12} c={isEditing ? C.accent : C.textMuted} /> {t("editPlan") || "EDIT"}
              </button>
            )}
            <button onClick={onDelete}
              style={{ padding: "7px 10px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n="trash" s={12} c={C.red} />
            </button>
          </div>

          {/* ── COMPLETED BATTLES — Share Card re-entry ── */}
          {pastBattlesSection}

          {/* ── EDIT PLAN PANEL ── */}
          {isEditing && (
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
              {/* Plan Type — preset chips */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 6 }}>{t("planType") || "PLAN TYPE"}</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                {PRESET_IDS.map(pid => {
                  const pm = PRESET_META[pid] || {};
                  const isActive = plan.preset === pid;
                  return (
                    <button key={pid} onClick={() => { if (!isActive) setConfirmPreset(pid); }}
                      style={{ padding: "5px 10px", borderRadius: 20, cursor: isActive ? "default" : "pointer",
                        background: isActive ? `${pm.color || C.accent}20` : "transparent",
                        border: `1.5px solid ${isActive ? pm.color || C.accent : C.border}`,
                        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.8,
                        color: isActive ? pm.color || C.accent : C.textMuted }}>
                      {pm.icon} {pm.label}
                    </button>
                  );
                })}
              </div>

              {/* Event name */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 3 }}>{t("eventNameLabel")}</label>
              <input value={editEventName} onChange={e => setEditEventName(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

              {/* Plan name */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 3 }}>{t("detailLabel")}</label>
              <input value={editPlanName} onChange={e => setEditPlanName(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

              {/* Event link */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 3 }}>{t("eventLink")}</label>
              <input value={editEventUrl} onChange={e => setEditEventUrl(e.target.value)} placeholder={t("addEventLinkHint")}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

              {/* Location */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 3 }}>{t("locationLabel")}</label>
              <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder={t("battleLocationPlaceholder")}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

              {/* Training days */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 4 }}>{t("trainingDays")}</label>
              <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                {DAY_LABELS.map((label, i) => {
                  const on = editTrainingDays.includes(i);
                  return <button key={i} onClick={() => setEditTrainingDays(p => p.includes(i) ? p.filter(d => d !== i) : [...p, i].sort())} style={{ width: 34, height: 34, borderRadius: "50%", background: on ? `${C.accent}20` : C.surfaceAlt, border: `2px solid ${on ? C.accent : C.border}`, color: on ? C.accent : C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>;
                })}
              </div>

              {/* Schedule — per-day phase editing */}
              <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 6 }}>SCHEDULE</label>
              <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 10, border: `1px solid ${C.borderLight}`, borderRadius: 8 }}>
                {futureDates.map(ds => {
                  const info = dayMap[ds]; if (!info) return null;
                  const isBattle = info.type === "battle";
                  const isOverridden = !!(plan.phaseOverrides || {})[ds];
                  const phColor = info.phaseColor || C.textMuted;
                  const phLabel = isBattle ? t("battleDay") : (info.type === "rest" || info.type === "mandatory_rest") ? (t("rest") || "REST") : info.phase;
                  const dateLabel = new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

                  return (
                    <button key={ds}
                      onClick={() => !isBattle && handleCyclePhase(ds)}
                      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 8px",
                        background: "none", border: "none", borderBottom: `1px solid ${C.borderLight}`,
                        cursor: isBattle ? "default" : "pointer", textAlign: "left", opacity: isBattle ? 0.6 : 1 }}>
                      {isBattle ? (
                        <Ic n="lock" s={10} c={C.textMuted} />
                      ) : (
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: phColor, flexShrink: 0 }} />
                      )}
                      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, color: C.text, minWidth: 80 }}>{dateLabel}</span>
                      {!isBattle && info.session && (
                        <span style={{ fontSize: 8, fontFamily: FONT_DISPLAY, fontWeight: 700, color: phColor }}>S{info.session}</span>
                      )}
                      <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                        background: `${phColor}20`, color: phColor, borderRadius: 4, padding: "1px 5px",
                        letterSpacing: 0.5, marginLeft: "auto" }}>
                        {isBattle ? "\u2694\uFE0F " : ""}{phLabel}
                      </span>
                      {isOverridden && <span style={{ fontSize: 8, color: C.accent }}>*</span>}
                      {isBattle && <Ic n="lock" s={9} c={C.textMuted} />}
                    </button>
                  );
                })}
              </div>

              {/* Reset to default */}
              {hasOverrides && (
                <button onClick={() => setConfirmReset(true)}
                  style={{ display: "block", margin: "0 auto 10px", background: "none", border: "none",
                    cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted }}>
                  {"\u21BA"} {t("resetToDefault") || "Reset to default schedule"}
                </button>
              )}

              {/* Save changes */}
              <button onClick={handleSaveEdit} style={{ width: "100%", padding: "10px", background: C.accent, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: "#fff" }}>{t("saveChanges")}</button>
            </div>
          )}

          {/* Preset switch confirmation modal */}
          {confirmPreset && (
            <Modal onClose={() => setConfirmPreset(null)}>
              <div style={{ padding: 20, textAlign: "center" }}>
                <span style={{ fontSize: 28 }}>{(PRESET_META[confirmPreset] || {}).icon || "\u2694\uFE0F"}</span>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1, color: C.text, margin: "8px 0" }}>
                  {(PRESET_META[confirmPreset] || {}).label}
                </h3>
                <p style={{ fontSize: 11, color: C.textSec, marginBottom: 16 }}>
                  {t("switchPlanConfirm") || "Switch preset? This will rebuild your training schedule."}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmPreset(null)} style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>{t("cancel") || "CANCEL"}</button>
                  <button onClick={() => handleSwitchPreset(confirmPreset)} style={{ flex: 1, padding: "10px", background: C.accent, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>SWITCH</button>
                </div>
              </div>
            </Modal>
          )}

          {/* Reset confirmation modal */}
          {confirmReset && (
            <Modal onClose={() => setConfirmReset(false)}>
              <div style={{ padding: 20, textAlign: "center" }}>
                <span style={{ fontSize: 28 }}>{"\u21BA"}</span>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1, color: C.text, margin: "8px 0" }}>
                  {t("resetToDefault") || "Reset to default"}
                </h3>
                <p style={{ fontSize: 11, color: C.textSec, marginBottom: 16 }}>
                  {t("resetConfirm") || "Reset all custom changes? This will restore the default schedule."}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>{t("cancel") || "CANCEL"}</button>
                  <button onClick={handleResetToDefault} style={{ flex: 1, padding: "10px", background: C.accent, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>RESET</button>
                </div>
              </div>
            </Modal>
          )}

          {/* Phase legend */}
          {!isEditing && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {phaseSummary.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textMuted }}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* LIST view — future dates (only when NOT editing, since edit panel has its own schedule) */}
          {!isEditing && (
            <div>
              {futureDates.map(ds => {
                const info = dayMap[ds]; if (!info) return null;
                const isSel = selectedDay === ds;
                const isToday = ds === today;
                const complete = isDayComplete(ds);
                const isOverridden = !!(plan.phaseOverrides || {})[ds];
                const dateLabel = new Date(ds + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div key={ds}>
                    <button onClick={() => onSelectDay(ds)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 6px", background: isSel ? C.surfaceAlt : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: info.phaseColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: isToday ? C.accent : C.text, minWidth: 85 }}>{dateLabel}</span>
                      <span style={{ fontSize: 8, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${info.phaseColor}20`, color: info.phaseColor, borderRadius: 4, padding: "1px 5px", letterSpacing: 0.5 }}>
                        {info.type === "battle" ? "\u2694\uFE0F BATTLE" : info.type === "training" ? (info.session ? `S${info.session}` : info.phase) : "REST"}
                      </span>
                      <span style={{ flex: 1, fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textMuted, textAlign: "right" }}>{info.phase}</span>
                      {isOverridden && <span style={{ fontSize: 8, color: C.accent }}>*</span>}
                      {complete && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />}
                      <Ic n={isSel ? "chevD" : "chevR"} s={11} c={C.textMuted} />
                    </button>
                    {isSel && <DayDetail dateStr={ds} dayMap={dayMap} plan={plan} today={today} onToggleTask={onToggleTask} t={t} getDay={getDay} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Share Card overlay — re-render saved reflection */}
      {shareCardBattle && (
        <Modal title={t("shareCard")} onClose={() => setShareCardBattle(null)}>
          <BattleShareCard
            plan={plan}
            battle={shareCardBattle}
            meta={meta}
            prepStats={getPreparationStats(plan, dayMap, shareCardBattle.date)}
            reflection={shareCardBattle.reflection}
            onClose={() => setShareCardBattle(null)}
            t={t}
            today={today}
          />
        </Modal>
      )}
    </div>
  );
};

// ── Day Detail Component ──
const DayDetail = ({ dateStr, dayMap: _dayMap, plan, today, onToggleTask, t, getDay }) => {
  const { info, tasks } = getDay(dateStr);
  if (!info) return null;
  const completed = plan.completedTasks || {};
  const isToday = dateStr === today;
  const isPast = dateStr < today;
  const isBattle = info.type === "battle";

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, margin: "4px 0 6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: C.text }}>
          {new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
        {isToday && <span style={{ fontSize: 8, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${C.accent}20`, color: C.accent, borderRadius: 4, padding: "1px 5px" }}>TODAY</span>}
        <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.5, background: `${info.phaseColor}25`, color: info.phaseColor, borderRadius: 4, padding: "2px 7px", marginLeft: "auto" }}>{info.phase}</span>
      </div>
      {isBattle && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <span style={{ fontSize: 28 }}>{"\u2694\uFE0F"}</span>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1, color: C.red, marginTop: 3 }}>{t("battleDay")}</div>
          {info.eventName && <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{info.eventName}</div>}
        </div>
      )}
      {!isBattle && tasks.map((task, i) => {
        const done = !!completed[`${dateStr}-${i}`];
        return (
          <button key={i} onClick={() => !isPast && onToggleTask(dateStr, i)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 2px", background: "none", border: "none", cursor: isPast ? "default" : "pointer", borderBottom: i < tasks.length - 1 ? `1px solid ${C.borderLight}` : "none", textAlign: "left", opacity: isPast ? 0.5 : 1 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {done && <Ic n="check" s={12} c="#fff" />}
            </div>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{task.emoji}</span>
            <span style={{ flex: 1, fontSize: 11, fontFamily: FONT_BODY, color: done ? C.textMuted : C.text, textDecoration: done ? "line-through" : "none", opacity: done ? 0.45 : 1, lineHeight: 1.4 }}>{t(task.key)}</span>
          </button>
        );
      })}
    </div>
  );
};
