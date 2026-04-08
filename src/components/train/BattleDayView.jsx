import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { CAT_COLORS } from '../../constants/categories';
import { PRESET_META, DEFAULT_CHECKLIST, BATTLE_MOODS, BATTLE_RESULTS, getPreparationStats, toYMD } from './battlePrepHelpers';
import { compressImage } from '../../utils/imageUtils';

// ── Battle Day View ─────────────────────────────────────────────────────────
// Flow: pre-battle → reflection → share card → (plan complete if last battle) → done
export const BattleDayView = ({ plan, battle, dayMap, moves, sets, updatePlan, setBattleprep, addToast, t, today }) => {
  const [phase, setPhase] = useState("pre"); // "pre" | "reflection" | "shareCard" | "planComplete" | "done"
  const meta = PRESET_META[plan.preset] || PRESET_META.smoke;

  // Reflection state
  const [mood, setMood] = useState(null);
  const [result, setResult] = useState(null);
  const [takeaway, setTakeaway] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [needsWork, setNeedsWork] = useState("");
  const [changeTraining, setChangeTraining] = useState("");

  // Stats for share card
  const [savedReflection, setSavedReflection] = useState(null);
  const prepStats = useMemo(() => getPreparationStats(plan, dayMap, battle.date), [plan, dayMap, battle.date]);

  if (phase === "pre") {
    return <PreBattleSection
      plan={plan} battle={battle} dayMap={dayMap} moves={moves} sets={sets}
      updatePlan={updatePlan} meta={meta} prepStats={prepStats}
      onBattleComplete={() => setPhase("reflection")} t={t} today={today} />;
  }

  if (phase === "reflection") {
    return <PostBattleReflection
      plan={plan} battle={battle} meta={meta} prepStats={prepStats}
      mood={mood} setMood={setMood} result={result} setResult={setResult}
      takeaway={takeaway} setTakeaway={setTakeaway}
      whatWorked={whatWorked} setWhatWorked={setWhatWorked}
      needsWork={needsWork} setNeedsWork={setNeedsWork}
      changeTraining={changeTraining} setChangeTraining={setChangeTraining}
      setBattleprep={setBattleprep} addToast={addToast}
      onSaved={(ref) => { setSavedReflection(ref); setPhase("shareCard"); }}
      t={t} today={today} />;
  }

  if (phase === "shareCard") {
    return <BattleShareCard
      plan={plan} battle={battle} meta={meta} prepStats={prepStats}
      reflection={savedReflection}
      onClose={() => {
        // If all battles now have reflections, show plan completion card
        if (savedReflection?._allDone) {
          setPhase("planComplete");
        } else {
          setPhase("done");
        }
      }} t={t} today={today} />;
  }

  if (phase === "planComplete") {
    return <PlanCompletionCard
      plan={plan} meta={meta} dayMap={dayMap}
      setBattleprep={setBattleprep} addToast={addToast}
      onClose={() => setPhase("done")} t={t} today={today} />;
  }

  // phase === "done" — return null to let parent re-render normally
  return null;
};

// ── Pre-Battle Section ──────────────────────────────────────────────────────
const PreBattleSection = ({ plan, battle, dayMap, moves, sets, updatePlan, meta, prepStats, onBattleComplete, t, today }) => {
  // Checklist state — initialize from plan or defaults
  const [checklist, setChecklist] = useState(() => {
    if (plan.battleDay?.checklist?.length) return plan.battleDay.checklist;
    return DEFAULT_CHECKLIST.map(item => ({ ...item }));
  });
  const [customItems, setCustomItems] = useState(() => plan.battleDay?.customItems || []);
  const [newRitual, setNewRitual] = useState("");
  const [showArsenal, setShowArsenal] = useState(false);
  const [showPrep, setShowPrep] = useState(false);

  // Persist checklist changes
  const persistChecklist = useCallback((cl, ci) => {
    updatePlan(plan.id, { battleDay: { checklist: cl, customItems: ci } });
  }, [updatePlan, plan.id]);

  const toggleItem = (idx) => {
    const next = checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setChecklist(next);
    persistChecklist(next, customItems);
  };

  const toggleCustom = (idx) => {
    const next = customItems.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setCustomItems(next);
    persistChecklist(checklist, next);
  };

  const addCustomItem = () => {
    const text = newRitual.trim();
    if (!text) return;
    const next = [...customItems, { text, done: false }];
    setCustomItems(next);
    setNewRitual("");
    persistChecklist(checklist, next);
  };

  const removeCustom = (idx) => {
    const next = customItems.filter((_, i) => i !== idx);
    setCustomItems(next);
    persistChecklist(checklist, next);
  };

  const totalItems = checklist.length + customItems.length;
  const doneItems = checklist.filter(i => i.done).length + customItems.filter(i => i.done).length;
  const progressPct = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  // Resolve arsenal moves
  const arsenalMoves = useMemo(() => {
    const ids = plan.arsenal?.moveIds || [];
    return ids.map(id => moves.find(m => m.id === id)).filter(Boolean);
  }, [plan.arsenal, moves]);

  // Group by category
  const movesByCategory = useMemo(() => {
    const groups = {};
    arsenalMoves.forEach(m => {
      const cat = m.category || "Custom";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [arsenalMoves]);

  return (
    <div style={{ padding: "0 2px" }}>
      {/* Header with glow */}
      <div style={{
        textAlign: "center", padding: "20px 12px 16px",
        background: `linear-gradient(180deg, ${meta.color}15 0%, transparent 100%)`,
        borderRadius: 14, marginBottom: 12,
      }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22, letterSpacing: 3,
          color: meta.color, textShadow: `0 0 20px ${meta.color}60, 0 0 40px ${meta.color}30`,
        }}>
          {t("todayIsTheDay")}
        </div>
        <div style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.textSec, marginTop: 4 }}>
          {plan.eventName || plan.planName}
        </div>
        <div style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700, color: meta.color, marginTop: 4,
          display: "inline-flex", alignItems: "center", gap: 4,
          background: `${meta.color}20`, borderRadius: 4, padding: "2px 8px" }}>
          {meta.icon} {meta.label}
        </div>
      </div>
      <style>{`@keyframes mb-glow{0%,100%{text-shadow:0 0 20px ${meta.color}60,0 0 40px ${meta.color}30}50%{text-shadow:0 0 30px ${meta.color}80,0 0 60px ${meta.color}50}}`}</style>

      {/* Pre-Battle Checklist */}
      <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: C.text }}>
            {t("preBattleChecklist")}
          </span>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: doneItems === totalItems ? C.green : C.textSec }}>
            {doneItems}/{totalItems}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, borderRadius: 3, background: C.surfaceAlt, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: C.green, borderRadius: 3, transition: "width 0.3s" }} />
        </div>

        {/* Default items */}
        {checklist.map((item, i) => (
          <ChecklistRow key={`d-${i}`} done={item.done} icon={item.icon} text={t(item.text)} onToggle={() => toggleItem(i)} />
        ))}

        {/* Custom items */}
        {customItems.map((item, i) => (
          <div key={`c-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <ChecklistRow done={item.done} icon={"\u2728"} text={item.text} onToggle={() => toggleCustom(i)} />
            </div>
            <button onClick={() => removeCustom(i)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <Ic n="x" s={12} c={C.textMuted} />
            </button>
          </div>
        ))}

        {/* Add custom ritual */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input value={newRitual} onChange={e => setNewRitual(e.target.value)}
            placeholder={t("addYourRitual")}
            onKeyDown={e => e.key === "Enter" && addCustomItem()}
            style={{
              flex: 1, background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: 7,
              padding: "7px 10px", color: C.text, fontSize: 12, fontFamily: FONT_BODY, outline: "none",
            }} />
          <button onClick={addCustomItem}
            style={{
              background: newRitual.trim() ? C.accent : C.surfaceAlt,
              border: "none", borderRadius: 7, padding: "7px 12px", cursor: "pointer",
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: newRitual.trim() ? "#fff" : C.textMuted,
            }}>+</button>
        </div>
      </div>

      {/* Your Arsenal — accordion */}
      <Accordion title={t("yourArsenal")} count={arsenalMoves.length} expanded={showArsenal} onToggle={() => setShowArsenal(x => !x)}>
        {Object.entries(movesByCategory).map(([cat, catMoves]) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat] || C.accent }} />
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: C.textMuted }}>{cat}</span>
            </div>
            {catMoves.map(move => (
              <div key={move.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                <span style={{ flex: 1, fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>{move.name}</span>
                <span style={{ fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.textSec }}>{move.mastery || 0}%</span>
                {(move.videoLink || move.link) && (
                  <button onClick={() => window.open(move.videoLink || move.link, "_blank")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Ic n="link" s={12} c={C.accent} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
        {arsenalMoves.length === 0 && (
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT_BODY, padding: "8px 0" }}>
            No moves selected
          </div>
        )}
      </Accordion>

      {/* Your Preparation — accordion */}
      <Accordion title={t("yourPreparation")} expanded={showPrep} onToggle={() => setShowPrep(x => !x)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <StatBox label={t("sessionsCompleted")} value={`${prepStats.completedSessions}/${prepStats.totalSessions}`} />
          <StatBox label={t("prepWeeksLabel")} value={prepStats.prepWeeks} />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontStyle: "italic", color: C.textSec, textAlign: "center", padding: "6px 0" }}>
          {t("trustPreparation")}
        </div>
      </Accordion>

      {/* BATTLE COMPLETE button */}
      <button onClick={onBattleComplete}
        style={{
          width: "100%", padding: 14, background: meta.color, border: "none", borderRadius: 10,
          cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14,
          letterSpacing: 2, color: "#fff", marginTop: 8, marginBottom: 16,
        }}>
        {t("battleComplete")}
      </button>
    </div>
  );
};

// ── Post-Battle Reflection ──────────────────────────────────────────────────
const PostBattleReflection = ({ plan, battle, meta, prepStats, mood, setMood, result, setResult, takeaway, setTakeaway, whatWorked, setWhatWorked, needsWork, setNeedsWork, changeTraining, setChangeTraining, setBattleprep, addToast, onSaved, t, today }) => {

  const handleSave = () => {
    if (!mood || !result) {
      addToast({ icon: "info", title: t("selectMoodAndResult") });
      return;
    }

    const reflection = { mood, result, takeaway, whatWorked, needsWork, changeTraining, date: today };

    let allDone = false;
    setBattleprep(prev => {
      const updatedPlans = (prev.plans || []).map(p => {
        if (p.id !== plan.id) return p;
        const updatedBattles = (p.battles || []).map(b => {
          if (b.id !== battle.id) return b;
          return { ...b, completed: true, reflectionLogged: true, reflection };
        });
        return { ...p, battles: updatedBattles };
      });

      // Check if all battles in plan are now completed
      const updatedPlan = updatedPlans.find(p => p.id === plan.id);
      allDone = updatedPlan && (updatedPlan.battles || []).every(b => b.completed);

      // Don't archive yet — if allDone, the completion card will handle it
      return { ...prev, plans: updatedPlans };
    });

    addToast({ icon: "swords", title: t("reflectionSaved") });
    onSaved({ ...reflection, _allDone: allDone });
  };

  const resultScrollRef = useRef(null);

  return (
    <div style={{ padding: "0 2px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "16px 12px 12px" }}>
        <span style={{ fontSize: 28 }}>{"\u2694\uFE0F"}</span>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 2, color: C.text, marginTop: 4 }}>
          {t("postBattleReflection")}
        </div>
      </div>

      {/* Mood selector */}
      <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 6 }}>
        <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 8 }}>
          {t("howDidItGo")}
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {BATTLE_MOODS.map(m => {
            const active = mood === m.key;
            return (
              <button key={m.key} onClick={() => setMood(active ? null : m.key)}
                style={{
                  padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  background: active ? `${meta.color}20` : C.surfaceAlt,
                  border: `1.5px solid ${active ? meta.color : C.border}`,
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                  color: active ? meta.color : C.textSec,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                <span style={{ fontSize: 16 }}>{m.emoji}</span> {t(m.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Round reached */}
      <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 6 }}>
        <label style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: C.textMuted, display: "block", marginBottom: 8 }}>
          {t("roundReached")}
        </label>
        <div ref={resultScrollRef} style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
          {BATTLE_RESULTS.map(r => {
            const active = result === r.key;
            return (
              <button key={r.key} onClick={() => setResult(active ? null : r.key)}
                style={{
                  padding: "6px 10px", borderRadius: 20, cursor: "pointer", flexShrink: 0,
                  background: active ? `${r.color}20` : C.surfaceAlt,
                  border: `1.5px solid ${active ? r.color : C.border}`,
                  fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
                  color: active ? r.color : C.textSec, whiteSpace: "nowrap",
                }}>
                {t(r.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textareas */}
      <div style={{ background: C.surface, borderRadius: 10, padding: 14, marginBottom: 6 }}>
        <ReflectionField label={t("reflectionTakeaway")} placeholder={t("reflectionTakeawayHint")} value={takeaway} onChange={setTakeaway} />
        <ReflectionField label={t("reflectionWhatWorked")} placeholder={t("reflectionWhatWorkedHint")} value={whatWorked} onChange={setWhatWorked} />
        <ReflectionField label={t("reflectionNeedsWork")} placeholder={t("reflectionNeedsWorkHint")} value={needsWork} onChange={setNeedsWork} />
        <ReflectionField label={t("reflectionChangeTraining")} placeholder={t("reflectionChangeTrainingHint")} value={changeTraining} onChange={setChangeTraining} last />
      </div>

      {/* Save button */}
      <button onClick={handleSave}
        style={{
          width: "100%", padding: 14, background: meta.color, border: "none", borderRadius: 10,
          cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13,
          letterSpacing: 2, color: "#fff", marginBottom: 16,
        }}>
        {t("saveToBattleHistory")}
      </button>
    </div>
  );
};

// ── Battle Share Card ───────────────────────────────────────────────────────
const BattleShareCard = ({ plan, battle, meta, prepStats, reflection, onClose, t, today }) => {
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [generated, setGenerated] = useState(false);

  const resultObj = BATTLE_RESULTS.find(r => r.key === reflection?.result) || {};
  const moodObj = BATTLE_MOODS.find(m => m.key === reflection?.mood) || {};
  const battleDate = new Date(battle.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;

    const draw = () => {
      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Photo overlay if exists
      if (photo) {
        const img = new Image();
        img.onload = () => {
          ctx.globalAlpha = 0.4;
          const scale = Math.max(W / img.width, H / img.height);
          const dw = img.width * scale, dh = img.height * scale;
          ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
          ctx.globalAlpha = 1.0;
          // Gradient overlay
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, "rgba(10,10,10,0.3)");
          grad.addColorStop(0.5, "rgba(10,10,10,0.6)");
          grad.addColorStop(1, "rgba(10,10,10,0.95)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          drawContent(ctx, W, H);
          setGenerated(true);
        };
        img.src = photo;
        return;
      }
      drawContent(ctx, W, H);
      setGenerated(true);
    };

    const drawContent = (ctx, W, H) => {
      // MOVESBOOK branding
      ctx.textAlign = "center";
      ctx.font = `900 32px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#cf0000";
      ctx.fillText("MOVES", W / 2 - 40, 80);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("BOOK", W / 2 + 50, 80);

      // Preset badge
      ctx.font = `700 20px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = meta.color;
      const badgeText = `${meta.icon} ${meta.label}`;
      const bw = ctx.measureText(badgeText).width + 24;
      const bx = (W - bw) / 2;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = meta.color;
      roundRect(ctx, bx, 110, bw, 30, 6);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = meta.color;
      ctx.fillText(badgeText, W / 2, 133);

      // Event name
      ctx.font = `900 64px 'Barlow Condensed', sans-serif`;
      ctx.fillStyle = "#ffffff";
      const eventName = plan.eventName || plan.planName || "Battle";
      ctx.fillText(eventName, W / 2, 260);

      // Date
      ctx.font = `700 28px 'Barlow', sans-serif`;
      ctx.fillStyle = "#b3b3b3";
      ctx.fillText(battleDate, W / 2, 310);

      // Result badge
      const resultLabel = t(resultObj.labelKey) || reflection?.result || "";
      const rColor = resultObj.color || "#7a7a7a";
      ctx.font = `900 36px 'Barlow Condensed', sans-serif`;
      const rw = ctx.measureText(resultLabel).width + 40;
      const rx = (W - rw) / 2;
      ctx.fillStyle = rColor;
      roundRect(ctx, rx, 380, rw, 56, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(resultLabel, W / 2, 418);

      // Mood emoji
      ctx.font = "100px serif";
      ctx.fillText(moodObj.emoji || "", W / 2, 550);

      // Mood label
      ctx.font = `700 24px 'Barlow', sans-serif`;
      ctx.fillStyle = "#b3b3b3";
      ctx.fillText(t(moodObj.labelKey) || "", W / 2, 590);

      // Stats grid
      const statsY = 680;
      const stats = [
        { val: `${prepStats.completedSessions}/${prepStats.totalSessions}`, label: t("sessionsCompleted") },
        { val: `${prepStats.prepWeeks}`, label: t("prepWeeksLabel") },
      ];
      const colW = W / 2;
      stats.forEach((s, i) => {
        const cx = colW * i + colW / 2;
        ctx.font = `900 48px 'Barlow Condensed', sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(s.val, cx, statsY);
        ctx.font = `700 18px 'Barlow', sans-serif`;
        ctx.fillStyle = "#7a7a7a";
        ctx.fillText(s.label, cx, statsY + 30);
      });

      // Takeaway
      if (reflection?.takeaway) {
        ctx.font = `italic 26px 'Barlow', sans-serif`;
        ctx.fillStyle = "#b3b3b3";
        const tw = wrapText(ctx, `"${reflection.takeaway}"`, W / 2, 830, W - 120, 34);
      }

      // Footer
      ctx.font = `700 20px 'Barlow', sans-serif`;
      ctx.fillStyle = "#7a7a7a";
      ctx.fillText(battleDate, W / 2, 1250);
      ctx.fillText("movesbook.vercel.app", W / 2, 1290);
    };

    draw();
  }, [photo, plan, battle, meta, prepStats, reflection, resultObj, moodObj, battleDate, t]);

  useEffect(() => { generateCard(); }, [generateCard]);

  const handlePhotoInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await compressImage(file, 1080));
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "battle-card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${plan.eventName || "Battle"} - MovesBook` });
          return;
        }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "battle-card.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // User cancelled share
    }
  };

  return (
    <div style={{ padding: "0 2px", textAlign: "center" }}>
      {/* Canvas preview */}
      <canvas ref={canvasRef}
        style={{ width: "100%", maxWidth: 360, borderRadius: 14, border: `1px solid ${C.border}`, marginTop: 8 }} />

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
        <input ref={photoInputRef} type="file" accept="image/*" capture="camera"
          style={{ display: "none" }} onChange={handlePhotoInput} />
        <button onClick={() => photoInputRef.current?.click()}
          style={{
            padding: "10px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 11, letterSpacing: 1, color: C.text,
            display: "flex", alignItems: "center", gap: 5,
          }}>
          <Ic n="camera" s={14} c={C.text} /> {t("addPhoto")}
        </button>
        <button onClick={handleShare}
          style={{
            padding: "10px 16px", background: meta.color, border: "none",
            borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900,
            fontSize: 11, letterSpacing: 1, color: "#fff",
            display: "flex", alignItems: "center", gap: 5,
          }}>
          <Ic n="share" s={14} c="#fff" /> {t("shareBattleCard")}
        </button>
      </div>

      {/* Done button */}
      <button onClick={onClose}
        style={{
          marginTop: 12, marginBottom: 16, padding: "10px 24px",
          background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
          cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
          fontSize: 12, letterSpacing: 1, color: C.textSec,
        }}>
        {t("closeCard")}
      </button>
    </div>
  );
};

// ── Plan Completion Card ───────────────────────────────────────────────────
const CLOSING_MESSAGES = {
  smoke: "trainedLikeChampion",
  prove: "showedUpPrepared",
  mark: "madeYourMark",
  custom: "yourPlanYourWay",
};

const PlanCompletionCard = ({ plan, meta, dayMap, setBattleprep, addToast, onClose, t, today }) => {
  const canvasRef = useRef(null);
  const [showShareCard, setShowShareCard] = useState(false);

  const closingMsg = t(CLOSING_MESSAGES[plan.preset] || CLOSING_MESSAGES.custom);
  const dateRange = `${plan.createdDate || plan.battles?.[0]?.date || today} \u2014 ${today}`;

  // Compute stats
  const stats = useMemo(() => {
    const battles = plan.battles || [];
    let completedSessions = 0, trainingDays = 0;
    const completed = plan.completedTasks || {};
    Object.entries(dayMap).forEach(([ds, info]) => {
      if (info.type === "training") {
        trainingDays++;
        const taskCount = info.phase === "STAY READY" ? 2 : (info.phase === "MAINTAIN" || info.phase === "ADJUST") ? 3 : 4;
        let done = 0;
        for (let i = 0; i < taskCount; i++) { if (completed[`${ds}-${i}`]) done++; }
        if (done >= Math.ceil(taskCount / 2)) completedSessions++;
      }
    });

    // Results summary from battle reflections
    const resultCounts = {};
    battles.forEach(b => {
      const rKey = b.reflection?.result;
      if (rKey) resultCounts[rKey] = (resultCounts[rKey] || 0) + 1;
    });
    const resultEmojis = battles.map(b => {
      const rKey = b.reflection?.result;
      if (rKey === "won") return "\u{1F3C6}";
      if (rKey === "final" || rKey === "semi" || rKey === "quarter") return "\u{1F525}";
      if (rKey === "top8" || rKey === "top16") return "\u{1F4AA}";
      return "\u2694\uFE0F";
    }).join(" ");

    return { completedSessions, battleCount: battles.length, trainingDays, resultEmojis };
  }, [plan, dayMap]);

  const handleDone = () => {
    setBattleprep(prev => ({
      ...prev,
      plans: (prev.plans || []).filter(p => p.id !== plan.id),
      history: [...(prev.history || []), { ...plan, status: "completed", endDate: today, completedDate: today }],
    }));
    addToast({ icon: "check", title: t("planComplete") || "Plan complete" });
    onClose();
  };

  // ── Share Card Canvas ──
  const generateShareCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // MOVESBOOK branding
    ctx.textAlign = "center";
    ctx.font = `900 32px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = "#cf0000";
    ctx.fillText("MOVES", W / 2 - 40, 70);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("BOOK", W / 2 + 50, 70);

    // Flag + PLAN COMPLETE
    ctx.font = "48px serif";
    ctx.fillText("\u{1F3C1}", W / 2, 150);
    ctx.font = `900 44px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(t("planComplete") || "PLAN COMPLETE", W / 2, 210);

    // Plan name + preset badge
    ctx.font = `900 36px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(plan.eventName || plan.planName || "Battle Plan", W / 2, 290);

    ctx.font = `700 20px 'Barlow Condensed', sans-serif`;
    ctx.fillStyle = meta.color;
    const badgeText = `${meta.icon} ${meta.label}`;
    const bw = ctx.measureText(badgeText).width + 24;
    ctx.globalAlpha = 0.2;
    roundRect(ctx, (W - bw) / 2, 310, bw, 30, 6);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = meta.color;
    ctx.fillText(badgeText, W / 2, 333);

    // Date range
    ctx.font = `700 22px 'Barlow', sans-serif`;
    ctx.fillStyle = "#b3b3b3";
    ctx.fillText(dateRange, W / 2, 385);

    // Stats grid 2x2
    const gridY = 460;
    const gridData = [
      { val: `${stats.completedSessions}`, label: t("sessionsCompleted") || "Sessions" },
      { val: `${stats.battleCount}`, label: t("battlesFought") || "Battles" },
      { val: `${stats.trainingDays}`, label: t("totalTrainingDays") || "Training days" },
      { val: stats.resultEmojis || "\u2694\uFE0F", label: t("resultsLabel") || "Results" },
    ];
    const colW = W / 2;
    gridData.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = colW * col + colW / 2;
      const cy = gridY + row * 100;
      if (i === 3) {
        // Results row uses emoji, smaller font
        ctx.font = "36px serif";
      } else {
        ctx.font = `900 48px 'Barlow Condensed', sans-serif`;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(s.val, cx, cy);
      ctx.font = `700 18px 'Barlow', sans-serif`;
      ctx.fillStyle = "#7a7a7a";
      ctx.fillText(s.label, cx, cy + 30);
    });

    // Closing message
    ctx.font = `italic 24px 'Barlow', sans-serif`;
    ctx.fillStyle = "#b3b3b3";
    wrapText(ctx, closingMsg, W / 2, 740, W - 120, 32);

    // Footer
    ctx.font = `700 20px 'Barlow', sans-serif`;
    ctx.fillStyle = "#7a7a7a";
    ctx.fillText("movesbook.vercel.app", W / 2, 1020);
  }, [plan, meta, stats, dateRange, closingMsg, t]);

  useEffect(() => {
    if (showShareCard) generateShareCard();
  }, [showShareCard, generateShareCard]);

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "plan-complete.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${plan.eventName || "Plan Complete"} - MovesBook` });
          return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "plan-complete.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { /* User cancelled share */ }
  };

  if (showShareCard) {
    return (
      <div style={{ padding: "0 2px", textAlign: "center" }}>
        <canvas ref={canvasRef}
          style={{ width: "100%", maxWidth: 360, borderRadius: 14, border: `1px solid ${C.border}`, marginTop: 8 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button onClick={handleShare}
            style={{
              padding: "10px 16px", background: meta.color, border: "none",
              borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900,
              fontSize: 11, letterSpacing: 1, color: "#fff",
              display: "flex", alignItems: "center", gap: 5,
            }}>
            <Ic n="share" s={14} c="#fff" /> {t("sharePlanCard") || "SHARE"}
          </button>
        </div>
        <button onClick={() => setShowShareCard(false)}
          style={{
            marginTop: 12, marginBottom: 16, padding: "10px 24px",
            background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
            cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 12, letterSpacing: 1, color: C.textSec,
          }}>
          {t("closeCard")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 2px", textAlign: "center" }}>
      {/* Header */}
      <div style={{ padding: "20px 12px 8px" }}>
        <span style={{ fontSize: 36 }}>{"\u{1F3C1}"}</span>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22, letterSpacing: 2, color: C.text, marginTop: 6 }}>
          {t("planComplete") || "PLAN COMPLETE"}
        </div>
      </div>

      {/* Plan name + preset badge */}
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.text }}>
          {plan.eventName || plan.planName}
        </span>
        <span style={{ fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 700, background: `${meta.color}20`, color: meta.color, borderRadius: 4, padding: "2px 6px", marginLeft: 6 }}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSec, marginBottom: 16 }}>
        {dateRange}
      </div>

      {/* Stats grid 2x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "0 8px 16px" }}>
        {[
          { val: stats.completedSessions, label: t("sessionsCompleted") || "Sessions" },
          { val: stats.battleCount, label: t("battlesFought") || "Battles" },
          { val: stats.trainingDays, label: t("totalTrainingDays") || "Training days" },
          { val: stats.resultEmojis, label: t("resultsLabel") || "Results", isEmoji: true },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 8px" }}>
            <div style={{ fontFamily: s.isEmoji ? undefined : FONT_DISPLAY, fontWeight: 900, fontSize: s.isEmoji ? 20 : 28, color: C.text }}>
              {s.val}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 9, letterSpacing: 0.5, color: C.textMuted, marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Closing message */}
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSec, fontStyle: "italic", textAlign: "center", margin: "16px 12px", lineHeight: 1.5 }}>
        {closingMsg}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, margin: "16px 8px", justifyContent: "center" }}>
        <button onClick={() => setShowShareCard(true)}
          style={{
            flex: 1, padding: "12px 16px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 10, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900,
            fontSize: 12, letterSpacing: 1, color: C.text,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
          <Ic n="share" s={14} c={C.text} /> {t("sharePlanCard") || "SHARE"}
        </button>
        <button onClick={handleDone}
          style={{
            flex: 1, padding: "12px 16px", background: C.accent, border: "none",
            borderRadius: 10, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900,
            fontSize: 12, letterSpacing: 1, color: "#fff",
          }}>
          {t("planCompleteDone") || "DONE"}
        </button>
      </div>
    </div>
  );
};

// ── Shared Components ───────────────────────────────────────────────────────

const ChecklistRow = ({ done, icon, text, onToggle }) => (
  <button onClick={onToggle}
    style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 2px",
      background: "none", border: "none", cursor: "pointer",
      borderBottom: `1px solid ${C.borderLight}`, textAlign: "left",
    }}>
    <div style={{
      width: 20, height: 20, borderRadius: 5,
      border: `2px solid ${done ? C.green : C.border}`,
      background: done ? C.green : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {done && <Ic n="check" s={12} c="#fff" />}
    </div>
    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
    <span style={{
      flex: 1, fontSize: 12, fontFamily: FONT_BODY, color: done ? C.textMuted : C.text,
      textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1, lineHeight: 1.4,
    }}>{text}</span>
  </button>
);

const Accordion = ({ title, count, expanded, onToggle, children }) => (
  <div style={{ background: C.surface, borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
    <button onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 14px",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 11, letterSpacing: 1.5, color: C.text, flex: 1 }}>
        {title}
      </span>
      {count !== undefined && (
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textSec }}>{count}</span>
      )}
      <Ic n={expanded ? "chevD" : "chevR"} s={12} c={C.textMuted} />
    </button>
    {expanded && (
      <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: "10px 14px 12px" }}>
        {children}
      </div>
    )}
  </div>
);

const StatBox = ({ label, value }) => (
  <div style={{
    background: C.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center",
    border: `1px solid ${C.borderLight}`,
  }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 20, color: C.text }}>{value}</div>
    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 9, letterSpacing: 0.5, color: C.textMuted, marginTop: 2 }}>{label}</div>
  </div>
);

const ReflectionField = ({ label, placeholder, value, onChange, last }) => (
  <div style={{ marginBottom: last ? 0 : 12 }}>
    <label style={{
      fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 1,
      color: C.textMuted, display: "block", marginBottom: 4,
    }}>{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      rows={3}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${C.borderLight}`, borderRadius: 7,
        padding: "8px 10px", color: C.text, fontSize: 13, fontFamily: FONT_BODY,
        outline: "none", resize: "vertical", boxSizing: "border-box",
      }} />
  </div>
);

// Canvas helpers
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy;
}
