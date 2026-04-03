import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const RepCounter = ({ moves, catColors, reps, onSaveSession, onClose }) => {
  const t = useT();
  const [screen, setScreen] = useState("select");
  const [selectedMove, setSelectedMove] = useState(null);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const resetTimeout = useRef(null);

  // Timer
  useEffect(() => {
    if (screen !== "counting" || !timerStart) return;
    const iv = setInterval(() => setElapsed(Date.now() - timerStart), 1000);
    return () => clearInterval(iv);
  }, [screen, timerStart]);

  // Clear reset confirm timeout on unmount
  useEffect(() => () => { if (resetTimeout.current) clearTimeout(resetTimeout.current); }, []);

  const startCounting = (m) => {
    setSelectedMove(m);
    setCount(0);
    setElapsed(0);
    setTimerStart(Date.now());
    setScreen("counting");
    setResetConfirm(false);
  };

  const handleTap = () => {
    setCount(c => c + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (navigator.vibrate) navigator.vibrate(10);
    setResetConfirm(false);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    setCount(c => Math.max(0, c - 1));
  };

  const handleReset = (e) => {
    e.stopPropagation();
    if (resetConfirm) {
      setCount(0);
      setTimerStart(Date.now());
      setElapsed(0);
      setResetConfirm(false);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
    } else {
      setResetConfirm(true);
      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => setResetConfirm(false), 2000);
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    if (count === 0) return;
    const session = {
      id: Date.now(),
      moveId: selectedMove.id,
      moveName: selectedMove.name,
      moveCategory: selectedMove.category,
      reps: count,
      duration: Math.floor(elapsed / 1000),
      date: new Date().toISOString(),
    };
    onSaveSession(session);
    setSavedSession(session);
    setScreen("complete");
  };

  const catColor = (cat) => catColors[cat] || C.textMuted;

  // ── Screen 1: Move Selector ──
  if (screen === "select") {
    const filtered = moves.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.brown }}>{t("repCounter")}</span>
          <button onClick={onClose} style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>
        {/* Search */}
        <div style={{ padding:"12px 18px", flexShrink:0 }}>
          <input
            type="text" placeholder={t("searchMoves")} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY }}
          />
        </div>
        {/* Move list */}
        <div style={{ flex:1, overflow:"auto", padding:"0 18px 18px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, padding:"40px 0" }}>{t("emptySearch")}</div>
          )}
          {filtered.map(m => (
            <button key={m.id} onClick={() => startCounting(m)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 14px", marginBottom:6,
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer",
                borderLeft:`4px solid ${catColor(m.category)}`, textAlign:"left" }}>
              <div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:15, color:C.text }}>{m.name}</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:catColor(m.category), letterSpacing:0.5, marginTop:2 }}>{m.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 2: Counting ──
  if (screen === "counting") {
    const cc = catColor(selectedMove.category);
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        <style>{`@keyframes mb-breathe { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
        {/* Flash overlay */}
        <div style={{ position:"absolute", inset:0, background:`${cc}26`, pointerEvents:"none", transition:"opacity 0.15s", opacity:flash?1:0, zIndex:1 }}/>
        {/* Top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0, zIndex:2 }}>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:15, color:cc, letterSpacing:0.5 }}>{selectedMove.name}</span>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text }}>{fmtTime(elapsed)}</span>
            <button onClick={(e) => { e.stopPropagation(); setScreen("select"); }}
              style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
              <Ic n="x" s={14}/>
            </button>
          </div>
        </div>
        {/* Giant tap zone */}
        <div onClick={handleTap}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", WebkitTapHighlightColor:"transparent", zIndex:2, position:"relative" }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:120, color:C.text, lineHeight:1 }}>{count}</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, color:C.textMuted, marginTop:8, letterSpacing:2 }}>{t("reps")}</div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:16, animation:"mb-breathe 3s ease-in-out infinite", letterSpacing:0.5 }}>{t("tapToCount")}</div>
        </div>
        {/* Bottom controls */}
        <div onClick={e => e.stopPropagation()}
          style={{ display:"flex", flexDirection:"column", gap:10, padding:"14px 18px 24px", borderTop:`1px solid ${C.border}`, flexShrink:0, zIndex:2 }}>
          <div style={{ display:"flex", gap:10 }}>
            {/* Minus */}
            <button onClick={handleMinus} disabled={count===0}
              style={{ width:52, height:52, borderRadius:14, border:`2px solid ${C.yellow}`, background:"transparent", cursor:count===0?"not-allowed":"pointer", opacity:count===0?0.35:1, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"opacity 0.15s" }}>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, color:C.yellow, lineHeight:1 }}>−</span>
            </button>
            {/* Reset */}
            <button onClick={handleReset} disabled={count===0}
              style={{ height:52, padding:"0 20px", borderRadius:14, border:`2px solid ${C.textMuted}`, background:"transparent", cursor:count===0?"not-allowed":"pointer", opacity:count===0?0.35:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, flexShrink:0, transition:"opacity 0.15s" }}>
              {resetConfirm
                ? <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.yellow, letterSpacing:0.5 }}>{t("tapAgainToReset")}</span>
                : <Ic n="refresh" s={18} c={C.textMuted}/>
              }
            </button>
          </div>
          {/* Done */}
          <button onClick={handleDone} disabled={count===0}
            style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:count>0?C.green:C.surfaceHigh, color:count>0?"#fff":C.textMuted, cursor:count>0?"pointer":"not-allowed", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, letterSpacing:1, transition:"background 0.15s" }}>
            {t("done")} — SAVE {count} {t("reps")}
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 3: Session Complete ──
  if (screen === "complete" && savedSession) {
    const cc = catColor(savedSession.moveCategory);
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        {/* Checkmark */}
        <div style={{ width:64, height:64, borderRadius:"50%", background:C.green, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <Ic n="check" s={32} c="#fff"/>
        </div>
        <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.green, marginBottom:24 }}>{t("sessionSaved")}</div>
        {/* Summary card */}
        <div style={{ width:"100%", maxWidth:340, background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:16, marginBottom:32, borderLeft:`4px solid ${cc}` }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:15, color:C.text }}>{savedSession.moveName}</div>
          <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:cc, letterSpacing:0.5, marginTop:2 }}>{savedSession.moveCategory}</div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:14 }}>
            <div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text }}>{savedSession.reps}</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1 }}>{t("reps")}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:28, color:C.text }}>{fmtTime(savedSession.duration * 1000)}</div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:11, color:C.textMuted, letterSpacing:1 }}>TIME</div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={() => startCounting(selectedMove)}
            style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:C.accent, color:"#fff", cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13, letterSpacing:1 }}>
            {t("goAgain").toUpperCase()} — {savedSession.moveName.toUpperCase()}
          </button>
          <button onClick={() => { setSearch(""); setScreen("select"); }}
            style={{ width:"100%", padding:14, borderRadius:12, border:`1px solid ${C.border}`, background:C.surfaceAlt, color:C.text, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1 }}>
            {t("pickDifferentMove").toUpperCase()}
          </button>
          <button onClick={() => setScreen("history")}
            style={{ width:"100%", padding:14, borderRadius:12, border:"none", background:"transparent", color:C.textSec, cursor:"pointer", fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:13, letterSpacing:1 }}>
            {t("sessionHistory")}
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 4: Session History ──
  if (screen === "history") {
    return (
      <div style={{ position:"absolute", inset:0, zIndex:500, background:C.bg, display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={() => setScreen(savedSession ? "complete" : "select")}
            style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex", transform:"rotate(180deg)" }}>
            <Ic n="chevR" s={14}/>
          </button>
          <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:16, letterSpacing:2, color:C.brown, flex:1 }}>{t("sessionHistory")}</span>
          <button onClick={onClose}
            style={{ background:C.surfaceAlt, border:`1px solid ${C.border}`, cursor:"pointer", color:C.textSec, padding:5, borderRadius:7, display:"flex" }}>
            <Ic n="x" s={14}/>
          </button>
        </div>
        {/* List */}
        <div style={{ flex:1, overflow:"auto", padding:"12px 18px" }}>
          {reps.length === 0 && (
            <div style={{ textAlign:"center", color:C.textMuted, fontSize:13, padding:"40px 0" }}>{t("emptyEntries")}</div>
          )}
          {reps.map(s => {
            const d = new Date(s.date);
            return (
              <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", marginBottom:6, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, borderLeft:`4px solid ${catColor(s.moveCategory)}` }}>
                <div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:14, color:C.text }}>{s.moveName}</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:10, color:catColor(s.moveCategory), letterSpacing:0.5, marginTop:2 }}>{s.moveCategory}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
                    {fmtTime(s.duration * 1000)} · {d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:22, color:C.text, marginLeft:12 }}>{s.reps}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
