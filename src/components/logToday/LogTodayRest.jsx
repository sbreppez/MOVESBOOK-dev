import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { SorenessSheet } from '../shared/SorenessSheet';
import { InjuryModal } from '../modals/InjuryModal';

const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

const sectionHeader = (C, isFirst) => ({
  fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 800,
  color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5,
  marginTop: isFirst ? 0 : 21, marginBottom: 8,
});

export const LogTodayRest = forwardRef(function LogTodayRest({
  date,
  restLog,
  setRestLog,
  restTypes,
  setRestTypes: _setRestTypes,  // unused in D1 (custom rest type CRUD deferred)
  injuries,
  setInjuries,
  addToast: _addToast,
  onClose,
}, ref) {
  const { C } = useSettings();
  const t = useT();

  const entry = (restLog && restLog[date]) || {};
  const [restType, setRestType] = useState(entry.restType || "");
  const [todayNote, setTodayNote] = useState(entry.todayNote || "");
  const [sleep, setSleep] = useState(entry.sleep || { hours: null, quality: null });
  const [soreness, setSoreness] = useState(entry.soreness || []);
  const [sorenessExpanded, setSorenessExpanded] = useState((entry.soreness || []).length > 0);
  const [editingInjury, setEditingInjury] = useState(null); // null | injury object | "new"

  const activeInjuries = (injuries || []).filter(i => !i.resolved);
  const sevColors = { 1: C.green, 2: C.yellow, 3: C.accent };

  useImperativeHandle(ref, () => ({
    save: () => {
      const next = { ...(restLog || {}) };
      const nextEntry = {
        restType,
        todayNote: todayNote.trim(),
        sleep: {
          hours: sleep.hours,
          quality: sleep.quality,
        },
        soreness,
      };
      const isEmpty =
        !restType &&
        !todayNote.trim() &&
        sleep.hours == null &&
        sleep.quality == null &&
        (!soreness || soreness.length === 0);
      if (isEmpty) {
        delete next[date];
      } else {
        next[date] = nextEntry;
      }
      setRestLog(next);
      onClose?.();
    },
  }));

  // Chip styling — matches BodyPartChipGrid / SearchOverlay
  const chipStyle = (active, neutral = false) => ({
    borderRadius: 20, padding: "5px 13px",
    border: `1.5px solid ${active ? (neutral ? C.text : C.accent) : C.border}`,
    background: active && !neutral ? C.accent + "18" : "transparent",
    color: active ? (neutral ? C.text : C.accent) : (neutral ? C.textMuted : C.text),
    fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
    letterSpacing: 0.5, textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.15s",
  });

  const restTypeLabel = (typeKey) => {
    const mapped = {
      rest: "restTypeRest",
      activeRecovery: "restTypeActiveRecovery",
      injuryOrSick: "restTypeInjuryOrSick",
      other: "restTypeOther",
    }[typeKey];
    return t(mapped || typeKey);
  };

  const injuryLabel = (inj) => {
    const part = inj.bodyPart ? t(partLabelKey(inj.bodyPart)) : "";
    if (!inj.side) return part;
    return `${t(inj.side === "left" ? "leftSide" : "rightSide")} ${part}`;
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* Active Injuries panel */}
      {activeInjuries.length > 0 && (
        <>
          <div style={sectionHeader(C, true)}>{t("restActiveInjuries")}</div>
          {activeInjuries.map(inj => {
            const stripeColor = inj.severity ? sevColors[inj.severity] : C.border;
            return (
              <div key={inj.id}
                onClick={() => setEditingInjury(inj)}
                style={{
                  background: C.surface, borderRadius: 8,
                  borderLeft: `4px solid ${stripeColor}`,
                  padding: "12px 14px", marginBottom: 6,
                  cursor: "pointer",
                }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT_DISPLAY, letterSpacing: 0.5 }}>
                  {injuryLabel(inj)}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* + Log new injury */}
      <button
        onClick={() => setEditingInjury("new")}
        style={{
          width: "100%", padding: "10px 12px",
          marginTop: activeInjuries.length > 0 ? 6 : 0,
          marginBottom: 0,
          background: "transparent",
          border: `1.5px dashed ${C.border}`, borderRadius: 8,
          color: C.accent,
          fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 800,
          letterSpacing: 1.2, textTransform: "uppercase",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
        <Ic n="plus" s={14} c={C.accent}/>{t("restLogNewInjury")}
      </button>

      {/* Rest type chips */}
      <div style={sectionHeader(C, activeInjuries.length === 0)}>{t("restType")}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(restTypes || []).map(typeKey => {
          const active = restType === typeKey;
          return (
            <button key={typeKey}
              onClick={() => setRestType(active ? "" : typeKey)}
              style={chipStyle(active)}>
              {restTypeLabel(typeKey)}
            </button>
          );
        })}
      </div>

      {/* Sleep */}
      <div style={sectionHeader(C)}>{t("restSleep")}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 auto" }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
            {t("restSleepHours")}
          </div>
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={sleep.hours ?? ""}
            onChange={e => {
              const v = e.target.value;
              setSleep({ ...sleep, hours: v === "" ? null : parseFloat(v) });
            }}
            style={{
              width: 80, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 14,
              fontFamily: FONT_BODY, outline: "none", textAlign: "center", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
            {t("restSleepQuality")}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["poor", "ok", "great"].map(q => {
              const active = sleep.quality === q;
              const labelKey = q === "poor" ? "restSleepPoor" : q === "ok" ? "restSleepOk" : "restSleepGreat";
              return (
                <button key={q}
                  onClick={() => setSleep({ ...sleep, quality: active ? null : q })}
                  style={chipStyle(active, true)}>
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Soreness (collapsed by default) */}
      <button
        onClick={() => setSorenessExpanded(x => !x)}
        style={{
          ...sectionHeader(C),
          background: "none", border: "none", cursor: "pointer",
          padding: 0, width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", gap: 6,
        }}>
        <Ic n={sorenessExpanded ? "chevD" : "chevR"} s={13} c={C.textMuted}/>
        <span>{t("restSoreness")}{soreness.length > 0 ? ` (${soreness.length})` : ""}</span>
      </button>
      {sorenessExpanded && (
        <SorenessSheet value={soreness} onChange={setSoreness} />
      )}

      {/* Today's Note */}
      <div style={{ marginTop: 21 }}>
        <Txtarea
          label={t("todayNote")}
          value={todayNote}
          onChange={setTodayNote}
          rows={3}
          autoExpand
        />
      </div>

      {/* InjuryModal mount */}
      {editingInjury && (
        <InjuryModal
          injury={editingInjury === "new" ? null : editingInjury}
          onClose={() => setEditingInjury(null)}
          onSave={(inj) => {
            const existing = (injuries || []).find(i => i.id === inj.id);
            const next = existing
              ? (injuries || []).map(i => i.id === inj.id ? inj : i)
              : [...(injuries || []), inj];
            setInjuries(next);
          }}
          onDelete={(id) => setInjuries((injuries || []).filter(i => i.id !== id))}
        />
      )}
    </div>
  );
});

export default LogTodayRest;
