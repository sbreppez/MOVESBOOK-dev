import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { PRESET_META, PRESET_CONFIGS, toYMD, enumDates, getDayOfWeek, daysBetween, computeDayMap } from './battlePrepHelpers';

const DAY_LABELS = ["S","M","T","W","T","F","S"];

export const BattlePrepSetup = ({ initialPreset, battleprep, setBattleprep, moves, sets, onGenerated, onCancel, calendar, seedData, addCalendarEvent }) => {
  const t = useT();
  const [step, setStep] = useState(initialPreset ? 2 : 1);
  const [preset, setPreset] = useState(initialPreset || null);

  // Step 2: Battle details — seed from Calendar if available
  const [eventName, setEventName] = useState(seedData?.eventName || "");
  const [planName, setPlanName] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [location, setLocation] = useState("");
  const [battles, setBattles] = useState(() => {
    if (seedData?.date) return [{ id: Date.now(), date: seedData.date, eventName: seedData.eventName || "" }];
    return [{ id: Date.now(), date: "", eventName: "" }];
  });
  const [trainingDays, setTrainingDays] = useState([1, 2, 3, 4, 5]);

  // Custom phases
  const [customPhases, setCustomPhases] = useState([
    { name: "", percentage: 50 },
    { name: "", percentage: 50 },
  ]);

  // Step 3: Arsenal
  const [selectedMoveIds, setSelectedMoveIds] = useState([]);
  const [selectedSetIds, setSelectedSetIds] = useState([]);
  const [arsenalSearch, setArsenalSearch] = useState("");

  // Summary step
  const [showSummary, setShowSummary] = useState(false);

  const baseSteps = preset === "custom" ? 4 : 3;
  const totalSteps = baseSteps;

  // ── Future calendar battle events (for import) ──
  const calendarBattles = useMemo(() => {
    const todayStr = toYMD(new Date());
    const addedDates = new Set(battles.filter(b => b.date).map(b => b.date));
    return ((calendar?.events) || [])
      .filter(e => e.type === "battle" && e.date > todayStr && !addedDates.has(e.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [calendar, battles]);

  const importCalendarBattle = (calEvent) => {
    setBattles(prev => {
      const emptyIdx = prev.findIndex(b => !b.date);
      if (emptyIdx >= 0) {
        return prev.map((b, i) => i === emptyIdx ? { ...b, date: calEvent.date, eventName: calEvent.title || "" } : b);
      }
      return [...prev, { id: Date.now(), date: calEvent.date, eventName: calEvent.title || "" }];
    });
  };

  // ── Battle dates helpers ──
  const addBattle = () => setBattles(p => [...p, { id: Date.now(), date: "", eventName: "" }]);
  const removeBattle = (id) => setBattles(p => p.filter(b => b.id !== id));
  const updateBattle = (id, field, val) => setBattles(p => p.map(b => b.id === id ? { ...b, [field]: val } : b));
  const toggleTrainingDay = (dow) => setTrainingDays(p => p.includes(dow) ? p.filter(d => d !== dow) : [...p, dow].sort());

  // ── Preview stats ──
  const previewStats = useMemo(() => {
    const validBattles = battles.filter(b => b.date).sort((a, b) => a.date.localeCompare(b.date));
    if (!validBattles.length) return null;
    const today = toYMD(new Date());
    const lastDate = validBattles[validBattles.length - 1].date;
    if (lastDate < today) return null;
    const start = today < validBattles[0].date ? today : validBattles[0].date;
    const allDates = enumDates(start, lastDate);
    const battleDateSet = new Set(validBattles.map(b => b.date));
    let sessions = 0, restDays = 0;
    for (const ds of allDates) {
      if (battleDateSet.has(ds)) continue;
      if (trainingDays.includes(getDayOfWeek(ds))) sessions++;
      else restDays++;
    }
    return { days: allDates.length, sessions, restDays, battleCount: validBattles.length };
  }, [battles, trainingDays]);

  // ── Custom phases helpers ──
  const addPhase = () => { if (customPhases.length < 6) setCustomPhases(p => [...p, { name: "", percentage: 0 }]); };
  const removePhase = (idx) => { if (customPhases.length > 1) setCustomPhases(p => p.filter((_, i) => i !== idx)); };
  const updatePhase = (idx, field, val) => setCustomPhases(p => p.map((ph, i) => i === idx ? { ...ph, [field]: val } : ph));
  const customPhasesSum = customPhases.reduce((s, p) => s + (Number(p.percentage) || 0), 0);
  const customPhasesValid = customPhases.every(p => p.name.trim()) && customPhasesSum === 100;

  // ── Move grouping ──
  const allMoves = moves || [];
  const allMoveIds = useMemo(() => allMoves.map(m => m.id), [allMoves]);
  const groupedMoves = useMemo(() => {
    const groups = {};
    allMoves.forEach(m => { const cat = m.category || "Other"; if (!groups[cat]) groups[cat] = []; groups[cat].push(m); });
    return groups;
  }, [allMoves]);
  const filteredGroupedMoves = useMemo(() => {
    if (!arsenalSearch.trim()) return groupedMoves;
    const q = arsenalSearch.toLowerCase();
    const result = {};
    Object.entries(groupedMoves).forEach(([cat, mvs]) => {
      const filtered = mvs.filter(m => m.name.toLowerCase().includes(q));
      if (filtered.length) result[cat] = filtered;
    });
    return result;
  }, [groupedMoves, arsenalSearch]);

  const allMovesSelected = allMoveIds.length > 0 && allMoveIds.every(id => selectedMoveIds.includes(id));
  const allSetsSelected = (sets || []).length > 0 && (sets || []).every(s => selectedSetIds.includes(s.id));

  const toggleAllMoves = () => {
    if (allMovesSelected) setSelectedMoveIds([]);
    else setSelectedMoveIds([...allMoveIds]);
  };
  const toggleAllSets = () => {
    if (allSetsSelected) setSelectedSetIds([]);
    else setSelectedSetIds((sets || []).map(s => s.id));
  };

  // ── Navigation ──
  const isArsenalStep = step === totalSteps;
  const isDetailStep = preset === "custom" ? step === 3 : step === 2;
  const isCustomPhaseStep = preset === "custom" && step === 2;

  const canNext = () => {
    if (step === 1) return !!preset;
    if (isCustomPhaseStep) return customPhasesValid;
    if (isDetailStep) return battles.some(b => b.date) && trainingDays.length > 0 && eventName.trim().length > 0;
    if (isArsenalStep) return selectedMoveIds.length > 0 || selectedSetIds.length > 0;
    return true;
  };

  const handleNext = () => { if (step < totalSteps) setStep(step + 1); };
  const handleBack = () => {
    if (showSummary) { setShowSummary(false); return; }
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  // ── Build plan object for summary preview ──
  const buildPlanObject = () => {
    const validBattles = battles.filter(b => b.date).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({
      id: "bat_" + b.id, date: b.date, eventName: b.eventName.trim() || eventName.trim() || null,
      completed: false, reflectionLogged: false,
    }));
    return {
      id: "bp_" + Date.now(), preset,
      eventName: eventName.trim(),
      planName: planName.trim() || eventName.trim(),
      eventUrl: eventUrl.trim() || null,
      location: location.trim() || null,
      battles: validBattles, trainingDays,
      arsenal: { moveIds: selectedMoveIds, setIds: selectedSetIds },
      customDayOverrides: {}, completedTasks: {},
      customPhases: preset === "custom" ? customPhases.map(p => ({ name: p.name.trim(), percentage: Number(p.percentage) })) : null,
      createdDate: toYMD(new Date()), status: "active",
    };
  };

  // ── Summary data ──
  const summaryPlan = showSummary ? buildPlanObject() : null;
  const summaryDayMap = useMemo(() => summaryPlan ? computeDayMap(summaryPlan) : null, [summaryPlan]);

  // ── Activate plan ──
  const handleActivate = () => {
    const plan = buildPlanObject();
    setBattleprep(prev => ({
      ...prev,
      plans: [...(prev.plans || []), plan],
    }));
    // Create calendar events for each battle date
    if (addCalendarEvent) {
      for (const battle of plan.battles) {
        addCalendarEvent({ date: battle.date, type: "battle", title: plan.eventName || plan.planName, source: "battleprep", planId: plan.id }, { silent: true });
      }
    }
    onGenerated(plan);
  };

  // Step title
  const stepTitle = step === 1 ? t("chooseYourApproach")
    : isCustomPhaseStep ? t("prepDefinePhases")
    : isDetailStep ? t("battleDetails")
    : t("selectYourArsenal");

  // Checkbox component
  const Chk = ({ on, sz = 18 }) => (
    <div style={{ width: sz, height: sz, borderRadius: 4, border: `2px solid ${on ? C.accent : C.border}`,
      background: on ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {on && <Ic n="check" s={sz - 6} c={C.bg} />}
    </div>
  );

  // ── SUMMARY SCREEN ──
  if (showSummary && summaryPlan && summaryDayMap) {
    const { phaseSummary } = summaryDayMap;
    const totalTraining = phaseSummary.reduce((s, p) => s + p.trainingDayCount, 0);
    const validBattles = battles.filter(b => b.date).sort((a, b) => a.date.localeCompare(b.date));
    const totalDays = previewStats?.days || 0;
    const restDays = totalDays - totalTraining - validBattles.length;
    const meta = PRESET_META[preset] || PRESET_META.smoke;

    return (
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 8 }}>
          <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: C.textSec }}><Ic n="chevL" s={18} /></button>
          <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1.5, color: C.text }}>{t("planSummary")}</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 20px" }}>
          {/* Event + Plan name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 18, color: C.text, letterSpacing: 1 }}>{summaryPlan.eventName}</div>
            {summaryPlan.planName !== summaryPlan.eventName && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{summaryPlan.planName}</div>}
            {summaryPlan.location && (
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
                <Ic n="mapPin" s={13} c={C.textSec}/>
                <span style={{ fontSize:11, color:C.textSec }}>{summaryPlan.location}</span>
              </div>
            )}
            {summaryPlan.eventUrl && (
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                <Ic n="extLink" s={13} c={C.accent}/>
                <span style={{ fontSize:11, color:C.accent }}>{summaryPlan.eventUrl}</span>
              </div>
            )}
          </div>
          {/* Preset badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${meta.color}20`, borderRadius: 6, padding: "4px 10px", marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>{meta.icon}</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: meta.color, letterSpacing: 0.5 }}>{meta.label}</span>
          </div>
          {/* Battle dates */}
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, marginBottom: 6 }}>{t("prepBattleDates")}</div>
          {validBattles.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{"\u2694\uFE0F"}</span>
              <span style={{ fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
                {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
              {b.eventName && <span style={{ fontSize: 11, color: C.textSec }}>{b.eventName}</span>}
            </div>
          ))}
          {/* Training days */}
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, marginTop: 14, marginBottom: 6 }}>{t("trainingDays")}</div>
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {DAY_LABELS.map((l, i) => {
              const on = trainingDays.includes(i);
              return <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: on ? `${C.accent}20` : C.surfaceAlt, border: `2px solid ${on ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, color: on ? C.accent : C.textMuted }}>{l}</div>;
            })}
          </div>
          {/* Arsenal */}
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, marginBottom: 6 }}>{t("arsenalSelection")}</div>
          <div style={{ fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text, marginBottom: 14 }}>
            {selectedMoveIds.length} {t("moves").toLowerCase()} {"\u00B7"} {selectedSetIds.length} {t("sets").toLowerCase()}
          </div>
          {/* Phase breakdown bar */}
          {phaseSummary.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, marginBottom: 6 }}>PHASES</div>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: C.surfaceAlt, marginBottom: 8 }}>
                {phaseSummary.map((p, i) => <div key={i} style={{ width: `${totalTraining > 0 ? (p.trainingDayCount / totalTraining) * 100 : 0}%`, background: p.color }} />)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {phaseSummary.map((p, i) => (
                  <span key={i} style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: p.color }}>
                    {p.name}: {p.trainingDayCount}d
                    {i < phaseSummary.length - 1 && <span style={{ color: C.textMuted }}> {"\u2192"} </span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Totals */}
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, color: C.text }}>{totalTraining} <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{t("daysTraining")}</span></span>
            <span style={{ color: C.border }}>{"\u00B7"}</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, color: C.text }}>{restDays > 0 ? restDays : 0} <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{t("previewRestDays")}</span></span>
            <span style={{ color: C.border }}>{"\u00B7"}</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, color: C.text }}>{totalDays} <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{t("previewDays")}</span></span>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={handleActivate}
            style={{ width: "100%", padding: "14px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer",
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#fff" }}>
            {"\u2705"} {t("startPlan")}
          </button>
          <button onClick={handleBack}
            style={{ width: "100%", padding: "8px", background: "none", border: "none", cursor: "pointer",
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted, letterSpacing: 0.5 }}>
            {"\u2190"} {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN SETUP FLOW ──
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, gap: 8 }}>
        <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: C.textSec }}><Ic n="chevL" s={18} /></button>
        <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1.5, color: C.text }}>{stepTitle}</span>
        <button onClick={onCancel} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, cursor: "pointer", padding: 5, borderRadius: 7, display: "flex", color: C.textSec }}><Ic n="x" s={14} /></button>
      </div>
      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 0" }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i + 1 === step ? C.accent : i + 1 < step ? C.textMuted : C.border }} />
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 14px 20px" }}>
        {/* ── STEP 1: Choose preset ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "smoke", emoji: "\u{1F525}", phases: ["BUILD","SHARPEN","PEAK","TAPER"] },
              { id: "prove", emoji: "\u26A1", phases: ["LOCK IN","POLISH","PERFORM"] },
              { id: "mark", emoji: "\u{1F4AA}", phases: ["FOUNDATION","BUILD ROUND","BATTLE READY","TRUST IT"] },
              { id: "custom", emoji: "\u270F\uFE0F", phases: [] },
            ].map(p => {
              const meta = PRESET_META[p.id]; const sel = preset === p.id;
              return (
                <button key={p.id} onClick={() => setPreset(p.id)} style={{ background: C.surface, border: `2px solid ${sel ? C.accent : C.border}`, borderRadius: 14, padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden", display: "block", width: "100%" }}>
                  <div style={{ height: 4, background: meta.color }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{p.emoji}</span>
                      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text }}>{meta.label}</span>
                      {sel && <Ic n="check" s={16} c={C.accent} />}
                    </div>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSec, margin: "0 0 6px", lineHeight: 1.4 }}>{t(`prepDesc_${p.id}`)}</p>
                    {p.phases.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{p.phases.map(ph => <span key={ph} style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.5, color: C.textMuted, background: C.surfaceAlt, borderRadius: 5, padding: "2px 6px" }}>{ph}</span>)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 2 (custom only): Define phases ── */}
        {isCustomPhaseStep && (
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, marginBottom: 12 }}>{t("prepCustomPhasesDesc")}</p>
            {customPhases.map((ph, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input value={ph.name} onChange={e => updatePhase(i, "name", e.target.value)} placeholder={`Phase ${i + 1}`}
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none" }} />
                <input type="number" value={ph.percentage} onChange={e => updatePhase(i, "percentage", e.target.value)} min={1} max={100}
                  style={{ width: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 6px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, textAlign: "center", outline: "none" }} />
                <span style={{ fontSize: 11, color: C.textMuted }}>%</span>
                {customPhases.length > 1 && <button onClick={() => removePhase(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.textMuted }}><Ic n="x" s={14} /></button>}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.5, color: customPhasesSum === 100 ? C.green : C.red }}>{t("total")}: {customPhasesSum}%</span>
              {customPhases.length < 6 && <button onClick={addPhase} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.accent }}>+ {t("prepAddPhase")}</button>}
            </div>
            <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 12, background: C.surfaceAlt }}>
              {customPhases.map((ph, i) => { const colors = ["#1565c0", "#f57f17", "#e53935", "#2e7d32", "#ab47bc", "#ff7043"]; return <div key={i} style={{ width: `${ph.percentage}%`, background: colors[i % colors.length] }} />; })}
            </div>
          </div>
        )}

        {/* ── STEP: Battle Details (event name primary, plan name secondary) ── */}
        {isDetailStep && (
          <div>
            {/* Event name (primary, required) */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 4 }}>{t("eventNameLabel")}</label>
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder={t("prepPlanNamePlaceholder")}
              style={{ width: "100%", background: C.bg, border: `1px solid ${eventName.trim() ? C.accent : C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none", marginBottom: 12 }} />

            {/* Detail (secondary, optional) */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 4 }}>{t("detailLabel")}</label>
            <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder={t("detailPlaceholder")}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none", marginBottom: 12 }} />

            {/* Event link (optional) */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 4 }}>{t("eventLink")}</label>
            <input value={eventUrl} onChange={e => setEventUrl(e.target.value)} placeholder={t("addEventLinkHint")}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none", marginBottom: 12 }} />

            {/* Location (optional) */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 4 }}>{t("locationLabel")}</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t("battleLocationPlaceholder")}
              style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none", marginBottom: 16 }} />

            {/* Battle dates */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 6 }}>{t("prepBattleDates")}</label>
            {battles.map(b => (
              <div key={b.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <input type="date" value={b.date} onChange={e => updateBattle(b.id, "date", e.target.value)}
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: "none", colorScheme: "light dark" }} />
                {battles.length > 1 && <button onClick={() => removeBattle(b.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.textMuted, flexShrink: 0 }}><Ic n="x" s={14} /></button>}
              </div>
            ))}
            {calendarBattles.length > 0 && (
              <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.8, color: C.textMuted, marginBottom: 6 }}>{t("upcomingBattlesFromCalendar")}</div>
                {calendarBattles.map(ce => (
                  <div key={ce.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                    <span style={{ fontSize: 13 }}>{"\u2694\uFE0F"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>{new Date(ce.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      {ce.title && <div style={{ fontSize: 11, color: C.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ce.title}</div>}
                    </div>
                    <button onClick={() => importCalendarBattle(ce)} style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}40`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 10, letterSpacing: 0.5, color: C.accent, flexShrink: 0 }}>+ ADD</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={addBattle} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.accent, marginBottom: 4, width: "100%" }}>+ {t("addAnotherBattleDate")}</button>
            <p style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_BODY, fontStyle: "italic", margin: "2px 0 16px" }}>{t("backToBackHint")}</p>

            {/* Training days */}
            <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 6 }}>{t("trainingDays")}</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {DAY_LABELS.map((label, i) => {
                const on = trainingDays.includes(i);
                return <button key={i} onClick={() => toggleTrainingDay(i)} style={{ width: 38, height: 38, borderRadius: "50%", background: on ? `${C.accent}20` : C.surfaceAlt, border: `2px solid ${on ? C.accent : C.border}`, color: on ? C.accent : C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>;
              })}
            </div>
            {previewStats && (
              <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                {[{ n: previewStats.days, l: t("previewDays") }, { n: previewStats.sessions, l: t("previewSessions") }, { n: previewStats.restDays, l: t("previewRestDays") }, { n: previewStats.battleCount, l: t("previewBattles") }].map((s, i) => (
                  <span key={i} style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 0.5, color: C.text }}>{s.n} <span style={{ color: C.textMuted, fontWeight: 700, fontSize: 10 }}>{s.l}</span>{i < 3 && <span style={{ color: C.border, margin: "0 2px" }}>{" \u00B7 "}</span>}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Arsenal Selection ── */}
        {isArsenalStep && (
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, margin: "0 0 10px" }}>{t("arsenalHint")}</p>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", background: C.bg, borderRadius: 8, padding: "6px 10px", gap: 6, border: `1px solid ${arsenalSearch ? C.accent : C.border}`, marginBottom: 10 }}>
              <Ic n="search" s={14} c={C.textMuted} />
              <input value={arsenalSearch} onChange={e => setArsenalSearch(e.target.value)} placeholder={t("search")} style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: FONT_BODY }} />
              {arsenalSearch && <button onClick={() => setArsenalSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0 }}><Ic n="x" s={13} /></button>}
            </div>

            {/* Live count */}
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.accent, letterSpacing: 0.5, marginBottom: 10 }}>
              {selectedMoveIds.length} {t("moves").toLowerCase()} {"\u00B7"} {selectedSetIds.length} {t("sets").toLowerCase()} {t("movesSelected")}
            </div>

            {/* Select All Moves */}
            <button onClick={toggleAllMoves} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 4px", background: allMovesSelected ? `${C.accent}08` : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
              <Chk on={allMovesSelected} />
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1, color: C.text }}>{t("selectAllMoves")}</span>
            </button>

            {/* Moves by category */}
            {Object.entries(filteredGroupedMoves).map(([cat, mvs]) => {
              const catIds = mvs.map(m => m.id);
              const catAllSel = catIds.every(id => selectedMoveIds.includes(id));
              const toggleCat = () => { if (catAllSel) setSelectedMoveIds(p => p.filter(id => !catIds.includes(id))); else setSelectedMoveIds(p => [...new Set([...p, ...catIds])]); };
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <button onClick={toggleCat} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "5px 4px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <Chk on={catAllSel} sz={16} />
                    <div style={{ width: 3, height: 12, borderRadius: 2, background: cat === "Custom" ? "#6B7BA0" : undefined }} />
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: 0.8, color: C.textSec }}>{cat}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto" }}>({mvs.length})</span>
                  </button>
                  {mvs.map(m => {
                    const chk = selectedMoveIds.includes(m.id);
                    return (
                      <button key={m.id} onClick={() => setSelectedMoveIds(p => chk ? p.filter(id => id !== m.id) : [...p, m.id])}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "5px 8px 5px 24px", background: chk ? `${C.accent}10` : "transparent", border: "none", borderRadius: 5, cursor: "pointer", textAlign: "left" }}>
                        <Chk on={chk} />
                        <span style={{ flex: 1, fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>{m.name}</span>
                        <span style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textMuted }}>{m.mastery || 0}%</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Sets */}
            {(sets || []).length > 0 && (
              <>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
                  <button onClick={toggleAllSets} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 4px", background: allSetsSelected ? `${C.accent}08` : "transparent", border: "none", cursor: "pointer", textAlign: "left", marginBottom: 6 }}>
                    <Chk on={allSetsSelected} />
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1, color: C.text }}>{t("selectAllSets")}</span>
                  </button>
                </div>
                {(sets || []).map(s => {
                  const chk = selectedSetIds.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => setSelectedSetIds(p => chk ? p.filter(id => id !== s.id) : [...p, s.id])}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", background: chk ? `${C.accent}10` : "transparent", border: "none", borderRadius: 5, cursor: "pointer", textAlign: "left" }}>
                      <Chk on={chk} />
                      <span style={{ flex: 1, fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>{s.name}</span>
                      <span style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textMuted }}>{(s.moveIds || []).length} {t("moves").toLowerCase()}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        {isArsenalStep ? (
          <button onClick={() => setShowSummary(true)} disabled={!canNext()}
            style={{ width: "100%", padding: "14px", background: canNext() ? C.accent : C.surfaceAlt, border: "none", borderRadius: 10, cursor: canNext() ? "pointer" : "default", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 2, color: canNext() ? "#fff" : C.textMuted }}>
            {t("generatePlan")}
          </button>
        ) : (
          <button onClick={handleNext} disabled={!canNext()}
            style={{ width: "100%", padding: "12px", background: canNext() ? C.accent : C.surfaceAlt, border: "none", borderRadius: 10, cursor: canNext() ? "pointer" : "default", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 2, color: canNext() ? "#fff" : C.textMuted }}>
            {t("next") || "NEXT"}
          </button>
        )}
      </div>
    </div>
  );
};
