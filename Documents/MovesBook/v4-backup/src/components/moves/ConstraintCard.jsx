import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';
import {
  CONSTRAINT_THEMES, CONSTRAINT_POOL,
  todayString, buildActivePool, pickRandomConstraint, getTheme,
} from '../../constants/constraints';

// ── Helpers ──

const getConstraintDisplayText = (constraint, t) => {
  if (!constraint.constraintId) return "";
  // Custom constraint — stored text, not a translation key
  if (constraint.constraintId.startsWith("custom_")) {
    const custom = (constraint.customConstraints || []).find(c => c.id === constraint.constraintId);
    return custom ? custom.text : (constraint.constraintText || "");
  }
  // Built-in — look up via textKey
  const pool = CONSTRAINT_POOL.find(c => c.id === constraint.constraintId);
  return pool ? t(pool.textKey) : (constraint.constraintText || "");
};

const getModeLabel = (mode, t) => {
  if (mode === "restore") return t("constraintRestore");
  if (mode === "remix") return t("constraintRemix");
  if (mode === "rebuild") return t("constraintRebuild");
  return "";
};

// ── ConstraintCard ──

export const ConstraintCard = ({ constraint, onConstraintChange, addToast, onOpenManage }) => {
  const t = useT();

  // ── Daily auto-pick ──
  useEffect(() => {
    const today = todayString();
    if (constraint.date !== today || !constraint.constraintId) {
      const pool = buildActivePool(constraint);
      if (pool.length === 0) return;
      const pick = pickRandomConstraint(pool, constraint.constraintId);
      if (!pick) return;
      onConstraintChange({
        ...constraint,
        date: today,
        constraintId: pick.id,
        constraintText: pick.textKey || pick.text,
        theme: pick.theme,
        mode: pick.mode,
        dismissed: false,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──

  const handleShuffle = () => {
    const pool = buildActivePool(constraint);
    if (pool.length <= 1) return;
    const pick = pickRandomConstraint(pool, constraint.constraintId);
    if (!pick) return;
    onConstraintChange({
      ...constraint,
      constraintId: pick.id,
      constraintText: pick.textKey || pick.text,
      theme: pick.theme,
      mode: pick.mode,
    });
  };

  const handleDismiss = () => {
    onConstraintChange({ ...constraint, dismissed: true });
  };

  const handleRestore = () => {
    onConstraintChange({ ...constraint, dismissed: false });
  };

  // ── No constraint picked yet ──
  if (!constraint.constraintId) return null;

  const theme = getTheme(constraint.theme);
  const themeColor = theme.color;
  const displayText = getConstraintDisplayText(constraint, t);
  const modeLabel = getModeLabel(constraint.mode, t);

  // ── Dismissed state: show restore link ──
  if (constraint.dismissed && constraint.date === todayString()) {
    return (
      <div style={{ padding:"4px 14px 0", textAlign:"center" }}>
        <button onClick={handleRestore}
          style={{ background:"none", border:"none", color:C.textMuted, fontSize:10,
            cursor:"pointer", fontFamily:FONT_DISPLAY, letterSpacing:0.5, fontWeight:700 }}>
          {t("constraintShowChallenge")} ↓
        </button>
      </div>
    );
  }

  // ── Banner ──
  return (
    <>
      <div style={{ margin:"10px 12px 0" }}>
        <div style={{
          background: C.surfaceAlt,
          borderLeft: `4px solid ${themeColor}`,
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          {/* Left: label + theme pill + text */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize:9, color:C.textMuted,
              letterSpacing:2, fontWeight:700, textTransform:"uppercase", marginBottom:3,
            }}>
              {t("constraintLabel")}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:3,
                borderRadius:20, padding:"1px 8px",
                background: themeColor + "22", color: themeColor,
                fontSize:10, fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.3,
                whiteSpace:"nowrap",
              }}>
                <span style={{ fontSize:7 }}>●</span>
                {t(theme.nameKey)}
              </span>
              <span style={{
                fontSize:9, color:C.textMuted, fontFamily:FONT_DISPLAY,
                letterSpacing:1, fontWeight:700, textTransform:"uppercase",
              }}>
                {modeLabel}
              </span>
            </div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight:700, fontSize:15,
              color:C.text, lineHeight:1.3,
            }}>
              {displayText}
            </div>
          </div>

          {/* Right: gear + shuffle + dismiss */}
          <div style={{ display:"flex", gap:6, flexShrink:0, paddingTop:2 }}>
            <button onClick={onOpenManage} title={t("constraintManage")}
              style={{
                width:32, height:32, borderRadius:8,
                background:C.surface, border:`1px solid ${C.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}>
              <Ic n="cog" s={14} c={C.textMuted}/>
            </button>
            <button onClick={handleShuffle} title={t("constraintShuffle")}
              style={{
                width:32, height:32, borderRadius:8,
                background:C.surface, border:`1px solid ${C.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:15,
              }}>
              🔀
            </button>
            <button onClick={handleDismiss}
              style={{
                width:32, height:32, borderRadius:8,
                background:C.surface, border:`1px solid ${C.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}>
              <Ic n="x" s={14} c={C.textMuted}/>
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MANAGE CONSTRAINTS OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

export const ManageOverlay = ({ constraint, onConstraintChange, onClose, addToast }) => {
  const t = useT();
  const modeFilter = constraint.modeFilter || null;
  const setModeFilter = (val) => onConstraintChange({ ...constraint, modeFilter: val });
  const [addingCustom, setAddingCustom] = useState(false);
  const [newText, setNewText] = useState("");
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (addingCustom && inputRef.current) inputRef.current.focus();
  }, [addingCustom]);

  // ── Build display list ──
  const removed = new Set(constraint.removedConstraints || []);

  // Group built-in by theme
  const grouped = {};
  CONSTRAINT_THEMES.forEach(th => { if (th.id !== "custom") grouped[th.id] = []; });
  CONSTRAINT_POOL.forEach(c => {
    if (removed.has(c.id)) return;
    if (modeFilter && c.mode !== modeFilter) return;
    if (grouped[c.theme]) grouped[c.theme].push(c);
  });

  // Custom constraints
  const customList = (constraint.customConstraints || []).filter(c =>
    !modeFilter || c.mode === modeFilter
  );

  const handleRemove = (id) => {
    const next = {
      ...constraint,
      removedConstraints: [...(constraint.removedConstraints || []), id],
    };
    // If we removed the active constraint, shuffle to a new one
    if (id === constraint.constraintId) {
      const pool = buildActivePool(next);
      const pick = pickRandomConstraint(pool, id);
      if (pick) {
        next.constraintId = pick.id;
        next.constraintText = pick.textKey || pick.text;
        next.theme = pick.theme;
        next.mode = pick.mode;
      }
    }
    onConstraintChange(next);
  };

  const handleRemoveCustom = (id) => {
    const next = {
      ...constraint,
      customConstraints: (constraint.customConstraints || []).filter(c => c.id !== id),
    };
    // If we removed the active constraint, shuffle to a new one
    if (id === constraint.constraintId) {
      const pool = buildActivePool(next);
      const pick = pickRandomConstraint(pool, id);
      if (pick) {
        next.constraintId = pick.id;
        next.constraintText = pick.textKey || pick.text;
        next.theme = pick.theme;
        next.mode = pick.mode;
      }
    }
    onConstraintChange(next);
  };

  const handleAddCustom = () => {
    const text = newText.trim();
    if (!text) return;
    const custom = {
      id: "custom_" + Date.now(),
      text,
      theme: "custom",
      mode: "rebuild",
    };
    onConstraintChange({
      ...constraint,
      customConstraints: [...(constraint.customConstraints || []), custom],
    });
    setNewText("");
    setAddingCustom(false);
    if (addToast) addToast({ text: t("constraintAdded") });
  };

  const toggleMode = (mode) => {
    const newFilter = modeFilter === mode ? null : mode;
    const next = { ...constraint, modeFilter: newFilter };
    // If current active constraint doesn't match new filter, auto-shuffle
    if (newFilter && constraint.mode !== newFilter) {
      const pool = buildActivePool(next);
      const pick = pickRandomConstraint(pool, constraint.constraintId);
      if (pick) {
        next.constraintId = pick.id;
        next.constraintText = pick.textKey || pick.text;
        next.theme = pick.theme;
        next.mode = pick.mode;
      }
    }
    onConstraintChange(next);
  };

  const handleRestoreDefaults = () => {
    onConstraintChange({ ...constraint, removedConstraints: [] });
    setShowConfirmRestore(false);
    if (addToast) addToast({ text: t("constraintRestored") });
  };

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:500, background:C.bg,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 16px", borderBottom:`1px solid ${C.border}`, flexShrink:0,
      }}>
        <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:14, letterSpacing:1.5, color:C.text }}>
          {t("constraintManage")}
        </span>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
          <Ic n="x" s={18} c={C.text}/>
        </button>
      </div>

      {/* Add custom + filter row */}
      <div style={{ padding:"10px 16px 0", flexShrink:0 }}>
        {!addingCustom ? (
          <button onClick={() => setAddingCustom(true)}
            style={{
              width:"100%", padding:"10px 14px", borderRadius:10,
              border:`1.5px dashed ${C.border}`, background:"none",
              color:C.accent, fontSize:13, fontWeight:700,
              fontFamily:FONT_DISPLAY, letterSpacing:0.5, cursor:"pointer",
              marginBottom:10, textAlign:"center",
            }}>
            {t("constraintAddCustom")}
          </button>
        ) : (
          <div style={{
            display:"flex", gap:8, marginBottom:10,
            padding:"8px 12px", background:C.surfaceAlt, borderRadius:10,
            border:`1px solid ${C.border}`,
          }}>
            <input ref={inputRef} value={newText} onChange={e => setNewText(e.target.value)}
              placeholder={t("constraintCustomPlaceholder")}
              onKeyDown={e => { if (e.key === "Enter") handleAddCustom(); if (e.key === "Escape") { setAddingCustom(false); setNewText(""); } }}
              style={{
                flex:1, background:"none", border:"none", outline:"none",
                color:C.text, fontSize:13, fontFamily:FONT_BODY,
              }}/>
            <button onClick={handleAddCustom}
              style={{
                background:C.accent, color:"#fff", border:"none",
                borderRadius:8, padding:"5px 14px", fontSize:12,
                fontWeight:700, fontFamily:FONT_DISPLAY, cursor:"pointer",
              }}>
              {t("add")}
            </button>
            <button onClick={() => { setAddingCustom(false); setNewText(""); }}
              style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
              <Ic n="x" s={14} c={C.textMuted}/>
            </button>
          </div>
        )}

        {/* Filter chips with descriptions */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:6 }}>
          {[
            { mode:"restore", label:t("constraintRestore"), desc:t("restoreDesc") },
            { mode:"remix",   label:t("constraintRemix"),   desc:t("remixDesc") },
            { mode:"rebuild", label:t("constraintRebuild"), desc:t("rebuildDesc") },
          ].map(({ mode, label, desc }) => {
            const active = modeFilter === mode;
            return (
              <div key={mode} style={{ textAlign:"center" }}>
                <button onClick={() => toggleMode(mode)} style={{
                  borderRadius:20, padding:"5px 12px",
                  border:`1.5px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accent+"20" : C.surface,
                  color: active ? C.accent : C.textSec,
                  fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                  letterSpacing:0.5, cursor:"pointer", width:"100%",
                }}>
                  {label}
                </button>
                <div style={{
                  fontSize:11, fontStyle:"italic", fontFamily:FONT_BODY,
                  color: active ? C.text : C.textMuted,
                  marginTop:4, lineHeight:1.3,
                }}>
                  {desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable constraint list */}
      <div style={{ flex:1, overflow:"auto", padding:"8px 16px 80px" }}>
        {CONSTRAINT_THEMES.filter(th => th.id !== "custom").map(th => {
          const items = grouped[th.id] || [];
          if (items.length === 0) return null;
          return (
            <div key={th.id} style={{ marginBottom:16 }}>
              {/* Theme header */}
              <div style={{
                display:"flex", alignItems:"center", gap:6, marginBottom:6,
              }}>
                <span style={{
                  width:8, height:8, borderRadius:"50%", background:th.color, flexShrink:0,
                }}/>
                <span style={{
                  fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12,
                  color:C.text, letterSpacing:0.5,
                }}>
                  {t(th.nameKey)}
                </span>
                <span style={{ fontSize:10, color:C.textMuted }}>({items.length})</span>
              </div>
              {/* Constraints */}
              {items.map(c => (
                <div key={c.id} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"7px 0", borderBottom:`1px solid ${C.borderLight}`,
                }}>
                  <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY, lineHeight:1.3 }}>
                    {t(c.textKey)}
                  </span>
                  <span style={{
                    fontSize:9, color:C.textMuted, fontFamily:FONT_DISPLAY,
                    letterSpacing:1, fontWeight:700, textTransform:"uppercase",
                    whiteSpace:"nowrap",
                  }}>
                    {getModeLabel(c.mode, t)}
                  </span>
                  <button onClick={() => handleRemove(c.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
                    <Ic n="x" s={12} c={C.textMuted}/>
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        {/* Custom constraints */}
        {customList.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#4a4a6a", flexShrink:0 }}/>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:12, color:C.text, letterSpacing:0.5 }}>
                {t("constraintThemeCustom")}
              </span>
              <span style={{ fontSize:10, color:C.textMuted }}>({customList.length})</span>
            </div>
            {customList.map(c => (
              <div key={c.id} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"7px 0", borderBottom:`1px solid ${C.borderLight}`,
              }}>
                <span style={{ flex:1, fontSize:13, color:C.text, fontFamily:FONT_BODY, lineHeight:1.3 }}>
                  {c.text}
                </span>
                <span style={{
                  fontSize:9, color:C.textMuted, fontFamily:FONT_DISPLAY,
                  letterSpacing:1, fontWeight:700, textTransform:"uppercase",
                  whiteSpace:"nowrap",
                }}>
                  {getModeLabel(c.mode, t)}
                </span>
                <button onClick={() => handleRemoveCustom(c.id)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
                  <Ic n="x" s={12} c={C.textMuted}/>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {Object.values(grouped).every(g => g.length === 0) && customList.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color:C.textMuted }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
            <p style={{ fontSize:13 }}>{t("constraintNoPool")}</p>
          </div>
        )}

        {/* Restore defaults */}
        <div style={{ marginTop:24 }}>
          <button onClick={() => setShowConfirmRestore(true)}
            style={{
              width:"100%", padding:12, borderRadius:10,
              background:C.surfaceAlt, border:"none",
              color:C.textSec, fontSize:13, fontWeight:700,
              fontFamily:FONT_DISPLAY, cursor:"pointer",
            }}>
            {t("restoreDefaults")}
          </button>
          <p style={{
            fontSize:11, fontStyle:"italic", fontFamily:FONT_BODY,
            color:C.textMuted, textAlign:"center", marginTop:6,
          }}>
            {t("restoreDefaultsHint")}
          </p>
        </div>
      </div>

      {/* Confirm restore dialog */}
      {showConfirmRestore && (
        <div style={{
          position:"absolute", inset:0, background:"rgba(0,0,0,0.6)",
          zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }} onClick={() => setShowConfirmRestore(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:C.surface, borderRadius:14, padding:20, maxWidth:340, width:"100%",
            border:`1px solid ${C.border}`,
          }}>
            <p style={{ fontSize:14, color:C.text, fontFamily:FONT_BODY, lineHeight:1.5, marginBottom:16 }}>
              {t("restoreDefaultsConfirm")}
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowConfirmRestore(false)}
                style={{
                  flex:1, padding:10, borderRadius:8,
                  background:C.surfaceAlt, border:`1px solid ${C.border}`,
                  color:C.textSec, fontSize:13, fontWeight:700,
                  fontFamily:FONT_DISPLAY, cursor:"pointer",
                }}>
                {t("cancel")}
              </button>
              <button onClick={handleRestoreDefaults}
                style={{
                  flex:1, padding:10, borderRadius:8,
                  background:C.accent, border:"none",
                  color:"#fff", fontSize:13, fontWeight:700,
                  fontFamily:FONT_DISPLAY, cursor:"pointer",
                }}>
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
