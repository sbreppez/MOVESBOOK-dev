import React, { useState, useEffect, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS } from '../../constants/categories';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import { masteryColor } from '../../constants/styles';
import { todayLocal } from '../../utils/dateUtils';

export const MirrorMode = ({ moves, catColors=CAT_COLORS, mirror, onMirrorChange, addToast, preselectedMove, onClose }) => {
  const t = useT();
  const [screen, setScreen] = useState("main"); // "main" | "drill"
  const [viewTab, setViewTab] = useState("needs"); // "needs" | "done" | "all"
  const [drillMove, setDrillMove] = useState(null);
  const [drillNotes, setDrillNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Jump to drill if preselected
  useEffect(() => {
    if (preselectedMove) {
      setDrillMove(preselectedMove);
      setDrillNotes("");
      setScreen("drill");
    }
  }, []);

  // Computed values
  const mirroredIds = useMemo(() => new Set(
    Object.keys(mirror.mirrored || {}).filter(id => moves.some(m => String(m.id) === id))
  ), [mirror.mirrored, moves]);

  const naIds = useMemo(() => new Set(
    Object.keys(mirror.notApplicable || {}).filter(id => moves.some(m => String(m.id) === id))
  ), [mirror.notApplicable, moves]);

  const applicableMoves = useMemo(() => moves.filter(m => !naIds.has(String(m.id))), [moves, naIds]);
  const needsMirrorMoves = useMemo(() => applicableMoves.filter(m => !mirroredIds.has(String(m.id))), [applicableMoves, mirroredIds]);
  const mirroredMoves = useMemo(() => applicableMoves.filter(m => mirroredIds.has(String(m.id))), [applicableMoves, mirroredIds]);
  const naMoves = useMemo(() => moves.filter(m => naIds.has(String(m.id))), [moves, naIds]);

  const progress = applicableMoves.length > 0 ? mirroredIds.size / applicableMoves.length : 0;
  const barColor = progress < 0.25 ? C.red : progress < 0.75 ? C.yellow : C.green;

  // Group moves by category
  const groupByCategory = (list) => {
    const groups = {};
    list.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return Object.entries(groups);
  };

  const today = todayLocal();

  // Actions
  const handleMarkMirrored = () => {
    if (!drillMove) return;
    onMirrorChange(prev => ({
      ...prev,
      mirrored: { ...prev.mirrored, [drillMove.id]: { date: today, notes: drillNotes } },
    }));
    addToast({ text: `${drillMove.name} — ${t("mirroredLabel")} ✓`, color: C.green });
    setShowConfirm(false);
    setDrillNotes("");
    setScreen("main");
  };

  const handleMarkNA = () => {
    if (!drillMove) return;
    onMirrorChange(prev => ({
      ...prev,
      notApplicable: { ...prev.notApplicable, [drillMove.id]: true },
    }));
    addToast({ text: `${drillMove.name} — ${t("notApplicable")}`, color: C.textMuted });
    setDrillNotes("");
    setScreen("main");
  };

  const handleUndoMirrored = (moveId) => {
    onMirrorChange(prev => {
      const next = { ...prev, mirrored: { ...prev.mirrored } };
      delete next.mirrored[moveId];
      return next;
    });
    addToast({ text: t("undo") + " ✓", color: C.yellow });
  };

  const handleUndoNA = (moveId) => {
    onMirrorChange(prev => {
      const next = { ...prev, notApplicable: { ...prev.notApplicable } };
      delete next.notApplicable[moveId];
      return next;
    });
    addToast({ text: t("undo") + " ✓", color: C.yellow });
  };

  const openDrill = (move) => {
    setDrillMove(move);
    setDrillNotes("");
    setShowConfirm(false);
    setScreen("drill");
  };

  // ────── DRILL VIEW ──────
  if (screen === "drill" && drillMove) {
    const catCol = catColors[drillMove.category] || C.accent;
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, background:C.header, flexShrink:0 }}>
          <button onClick={()=>{setScreen("main");setShowConfirm(false);}} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
            <Ic n="chevL" s={20} c={C.textMuted}/>
          </button>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color:C.text, letterSpacing:1 }}>{t("drill")}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
            <Ic n="x" s={20} c={C.textMuted}/>
          </button>
        </div>

        {/* Drill content */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
          {/* Mirror emoji */}
          <div style={{ fontSize:48, marginBottom:12 }}>🪞</div>

          {/* Move name */}
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text, textAlign:"center", marginBottom:8, lineHeight:1.2 }}>
            {drillMove.name}
          </div>

          {/* Category badge */}
          <div style={{ background:`${catCol}22`, color:catCol, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, letterSpacing:1, padding:"3px 12px", borderRadius:12, marginBottom:20 }}>
            {drillMove.category}
          </div>

          {/* Instruction card */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"16px 18px", width:"100%", marginBottom:16 }}>
            <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, color:C.yellow, letterSpacing:1, marginBottom:6 }}>
              {t("yourOtherSide")}
            </div>
            <div style={{ fontSize:13, color:C.textSec, lineHeight:1.5 }}>
              {t("drillInstruction")}
            </div>
          </div>

          {/* Dominant side mastery */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, width:"100%" }}>
            <span style={{ fontSize:11, color:C.textMuted }}>{t("dominantSideMastery")}:</span>
            <span style={{ fontSize:14, fontWeight:700, color:masteryColor(drillMove.mastery) }}>{drillMove.mastery}%</span>
          </div>

          {/* Notes */}
          <textarea
            value={drillNotes}
            onChange={e => setDrillNotes(e.target.value)}
            placeholder={t("whatFeelsDifferent")}
            rows={3}
            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontFamily:FONT_BODY, fontSize:13, resize:"vertical", outline:"none", marginBottom:24 }}
          />

          {/* Confirmation modal */}
          {showConfirm && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 18px", width:"100%", marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:14, color:C.text, marginBottom:16, lineHeight:1.5 }}>
                {t("canYouDoBothSides")}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleMarkMirrored}
                  style={{ flex:1, padding:"12px 0", borderRadius:10, border:"none", background:C.green, color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1, cursor:"pointer" }}>
                  {t("yesMirrored")}
                </button>
                <button onClick={()=>setShowConfirm(false)}
                  style={{ flex:1, padding:"12px 0", borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textSec, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1, cursor:"pointer" }}>
                  {t("notYet")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {!showConfirm && (
          <div style={{ padding:"12px 18px 20px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
            <button onClick={()=>setShowConfirm(true)}
              style={{ width:"100%", padding:"14px 0", borderRadius:10, border:"none", background:C.green, color:"#fff", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1, cursor:"pointer" }}>
              {t("markAsMirrored")}
            </button>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleMarkNA}
                style={{ flex:1, padding:"12px 0", borderRadius:10, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.textMuted, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5, cursor:"pointer" }}>
                {t("notApplicable")}
              </button>
              <button onClick={()=>{setScreen("main");setShowConfirm(false);}}
                style={{ flex:1, padding:"12px 0", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent", color:C.textSec, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.5, cursor:"pointer" }}>
                {t("comeBackLater")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ────── MAIN SCREEN ──────
  const tabCounts = { needs: needsMirrorMoves.length, done: mirroredMoves.length, all: moves.length };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, background:C.header, flexShrink:0 }}>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, color:C.text, letterSpacing:1 }}>
          🪞 {t("mirrorMode")}
        </span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="x" s={20} c={C.textMuted}/>
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ padding:"14px 18px 10px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:6 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text }}>
            {mirroredIds.size}
          </span>
          <span style={{ fontSize:13, color:C.textSec }}>
            of {applicableMoves.length} {t("xOfYMirrored")}
          </span>
        </div>
        <div style={{ height:6, borderRadius:3, background:C.border, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round(progress*100)}%`, borderRadius:3, background:barColor, transition:"width 0.3s" }}/>
        </div>
        {naIds.size > 0 && (
          <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
            {naIds.size} {t("movesMarkedNA")}
          </div>
        )}
      </div>

      {/* View tabs */}
      <div style={{ display:"flex", padding:"0 18px", gap:4, flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
        {[
          { id:"needs", label:t("needsMirror"), color:C.yellow, count:tabCounts.needs },
          { id:"done",  label:t("mirroredLabel"), color:C.green,  count:tabCounts.done },
          { id:"all",   label:t("allLabel"),     color:C.textSec, count:tabCounts.all },
        ].map(tab => (
          <button key={tab.id} onClick={()=>setViewTab(tab.id)}
            style={{ flex:1, padding:"10px 0 8px", background:"none", border:"none", cursor:"pointer",
              borderBottom: viewTab===tab.id ? `3px solid ${tab.color}` : "3px solid transparent",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, letterSpacing:0.8,
              color: viewTab===tab.id ? tab.color : C.textMuted }}>
              {tab.label}
            </span>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10,
              background: viewTab===tab.id ? `${tab.color}25` : `${C.textMuted}20`,
              color: viewTab===tab.id ? tab.color : C.textMuted,
              padding:"1px 6px", borderRadius:8 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 18px 24px" }}>

        {/* ── NEEDS MIRROR ── */}
        {viewTab==="needs" && (
          needsMirrorMoves.length === 0 ? (
            /* Celebration */
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingTop:60 }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🪞</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.green, marginBottom:8, textAlign:"center" }}>
                {t("allMirrored")}
              </div>
              <div style={{ fontSize:13, color:C.textSec, textAlign:"center", lineHeight:1.5, maxWidth:260 }}>
                {t("allMirroredSub")}
              </div>
            </div>
          ) : (
            <>
              {/* Tip banner */}
              <div style={{ fontSize:13, color:C.textMuted, fontStyle:"italic", marginBottom:14, lineHeight:1.5 }}>
                {t("pickOneMovePerSession")}
              </div>
              {/* Grouped by category */}
              {groupByCategory(needsMirrorMoves).map(([cat, catMoves]) => {
                const catCol = catColors[cat] || C.accent;
                return (
                  <div key={cat} style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:catCol, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>
                      {cat}
                    </div>
                    {catMoves.map(m => (
                      <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:C.surface, borderRadius:8, borderLeft:`4px solid ${catCol}`, marginBottom:4 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {m.name}
                          </div>
                        </div>
                        <span style={{ background:`${C.yellow}30`, color:C.yellow, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:8, letterSpacing:1, padding:"1px 6px", borderRadius:8, flexShrink:0 }}>
                          MIRROR
                        </span>
                        <span style={{ fontSize:11, color:masteryColor(m.mastery), fontWeight:700, flexShrink:0 }}>{m.mastery}%</span>
                        <button onClick={()=>openDrill(m)}
                          style={{ background:C.accent, color:"#fff", border:"none", cursor:"pointer", borderRadius:6, padding:"4px 10px", fontSize:10, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1, flexShrink:0 }}>
                          {t("drill")}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )
        )}

        {/* ── MIRRORED ── */}
        {viewTab==="done" && (
          mirroredMoves.length === 0 ? (
            <div style={{ textAlign:"center", paddingTop:40, color:C.textMuted, fontSize:13 }}>
              {t("needsMirror")}...
            </div>
          ) : (
            mirroredMoves.map(m => {
              const catCol = catColors[m.category] || C.accent;
              const data = mirror.mirrored?.[m.id];
              return (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:C.surface, borderRadius:8, borderLeft:`4px solid ${C.green}`, marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text }}>{m.name}</div>
                    <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>
                      <span style={{ color:catCol }}>{m.category}</span>
                      {data?.date && <span> · {data.date}</span>}
                    </div>
                    {data?.notes && (
                      <div style={{ fontSize:11, color:C.textSec, marginTop:3, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {data.notes}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>handleUndoMirrored(m.id)}
                    style={{ background:`${C.yellow}20`, color:C.yellow, border:"none", cursor:"pointer", borderRadius:6, padding:"4px 10px", fontSize:10, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, flexShrink:0 }}>
                    {t("undo")}
                  </button>
                </div>
              );
            })
          )
        )}

        {/* ── ALL ── */}
        {viewTab==="all" && (
          moves.map(m => {
            const catCol = catColors[m.category] || C.accent;
            const isMirrored = mirroredIds.has(String(m.id));
            const isNA = naIds.has(String(m.id));
            return (
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:C.surface, borderRadius:8, borderLeft:`4px solid ${catCol}`, marginBottom:4, opacity: isNA ? 0.5 : 1 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>{m.category}</div>
                </div>
                {isMirrored && (
                  <span style={{ background:`${C.green}25`, color:C.green, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:8, letterSpacing:1, padding:"1px 6px", borderRadius:8, flexShrink:0 }}>
                    {t("mirroredLabel")}
                  </span>
                )}
                {!isMirrored && !isNA && (
                  <span style={{ background:`${C.yellow}30`, color:C.yellow, fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:8, letterSpacing:1, padding:"1px 6px", borderRadius:8, flexShrink:0 }}>
                    MIRROR
                  </span>
                )}
                {isNA && (
                  <>
                    <span style={{ fontSize:10, color:C.textMuted, fontFamily:FONT_DISPLAY, fontWeight:700, letterSpacing:0.5, flexShrink:0 }}>N/A</span>
                    <button onClick={()=>handleUndoNA(m.id)}
                      style={{ background:`${C.yellow}20`, color:C.yellow, border:"none", cursor:"pointer", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, flexShrink:0 }}>
                      {t("undo")}
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
