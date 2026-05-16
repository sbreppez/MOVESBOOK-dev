import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { BottomSheet } from '../shared/BottomSheet';
import { createHomeNoteFromLog } from '../../utils/logTodayHomeNote';

export const LogTodayTraining = forwardRef(function LogTodayTraining({
  date,
  moves,
  sets,
  catColors,
  pendingMoveIds = [],
  pendingSetIds = [],
  onTogglePendingMove,
  onTogglePendingSet,
  onOpenMovePicker,
  onOpenSetPicker,
  addCalendarEvent,
  updateCalendarEvent,
  recordEventTraining,
  addToast,
  existingEvent,
  setIdeas,
  setHomeStack,
  onClose,
}, ref) {
  const t = useT();

  const [workDescription, setWorkDescription] = useState(existingEvent?.workDescription || "");
  const [howItFelt, setHowItFelt] = useState(existingEvent?.howItFelt || "");
  const [addToHome, setAddToHome] = useState(false);
  const [durationH, setDurationH] = useState(
    existingEvent?.duration ? String(Math.floor(existingEvent.duration / 60)) : ""
  );
  const [durationM, setDurationM] = useState(
    existingEvent?.duration ? String(existingEvent.duration % 60) : ""
  );
  const [location, setLocation] = useState(existingEvent?.location || "");
  const [videoLink, setVideoLink] = useState(existingEvent?.videoLink || "");
  const [videoLinkOpen, setVideoLinkOpen] = useState(!!existingEvent?.videoLink);
  const [notes, setNotes] = useState(existingEvent?.notes || "");
  const [chooserOpen, setChooserOpen] = useState(false);

  // Per-move rep counts. Restored on edit from each move's trainingLog entry
  // matching this event's id, so re-saving doesn't zero out previously entered reps.
  const [pendingMoveReps, setPendingMoveReps] = useState(() => {
    if (!existingEvent?.id) return {};
    const out = {};
    for (const moveId of (existingEvent.moveIds || [])) {
      const move = moves?.find(m => m.id === moveId);
      if (!move) continue;
      const entry = (move.trainingLog || []).find(e => e.sourceId === existingEvent.id);
      if (entry && typeof entry.count === 'number' && entry.count > 0) out[moveId] = entry.count;
    }
    return out;
  });
  const incReps = (moveId) => setPendingMoveReps(p => ({ ...p, [moveId]: (p[moveId] || 0) + 1 }));
  const decReps = (moveId) => setPendingMoveReps(p => ({ ...p, [moveId]: Math.max(0, (p[moveId] || 0) - 1) }));

  const formSectionHeader = (isFirst) => ({
    fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 800,
    color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5,
    marginTop: isFirst ? 0 : 21, marginBottom: 8,
  });

  const formInputStyle = {
    width: "100%", background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14,
    fontFamily: FONT_BODY, outline: "none", boxSizing: "border-box",
  };

  const numberInputStyle = {
    width: 64, background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "10px 8px", color: C.text, fontSize: 14,
    fontFamily: FONT_BODY, outline: "none", textAlign: "center", boxSizing: "border-box",
  };

  const dashedButtonStyle = {
    width: "100%", background: "transparent",
    border: `1.5px dashed ${C.border}`, borderRadius: 8,
    padding: "10px 12px", color: C.accent,
    fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 800,
    letterSpacing: 1.2, textTransform: "uppercase",
    cursor: "pointer", textAlign: "left",
  };

  const handleSave = () => {
    const h = parseInt(durationH, 10) || 0;
    const m = parseInt(durationM, 10) || 0;
    const totalDuration = h * 60 + m;

    const movesFromSets = pendingSetIds.flatMap(sid => {
      const s = sets?.find(x => x.id === sid);
      return s?.moveIds || [];
    });
    const allMoveIdsToMark = [...new Set([...pendingMoveIds, ...movesFromSets])];

    const isUpdate = !!existingEvent?.id;

    const record = {
      ...(isUpdate
        ? { id: existingEvent.id, createdAt: existingEvent.createdAt }
        : {}),
      date,
      type: "training",
      source: "log_today",
      title: existingEvent?.title?.trim() || t("trainingSession"),
      moveIds: pendingMoveIds,
      setIds: pendingSetIds,
      workDescription: workDescription.trim(),
      howItFelt: howItFelt.trim(),
      duration: totalDuration > 0 ? totalDuration : null,
      location: location.trim(),
      videoLink: videoLink.trim() || null,
      notes: notes.trim(),
    };

    if (isUpdate) {
      updateCalendarEvent?.(record);
    } else {
      addCalendarEvent?.(record, { silent: true });
    }

    if (recordEventTraining) {
      recordEventTraining(record.id, allMoveIdsToMark, record.date, pendingMoveReps);
    }

    if (addToHome) {
      const lines = [];
      if (workDescription.trim()) lines.push(`${t("whatIWorkedOn")}\n${workDescription.trim()}`);
      if (howItFelt.trim()) lines.push(`${t("howItFelt")}\n${howItFelt.trim()}`);
      if (totalDuration > 0) lines.push(`${t("howLong")}\n${h}h ${m}m`);
      if (location.trim()) lines.push(`${t("location")}\n${location.trim()}`);
      if (videoLink.trim()) lines.push(`${t("videoLink")}\n${videoLink.trim()}`);
      if (notes.trim()) lines.push(`${t("todaysNote")}\n${notes.trim()}`);
      createHomeNoteFromLog({
        section: t("training"), date, summary: lines.join("\n\n"),
        setIdeas, setHomeStack,
      });
    }

    addToast?.({
      icon: "check",
      title: isUpdate ? t("sessionUpdated") : t("sessionLogged"),
    });

    onClose?.();
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSave(),
  }));

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* WHAT I WORKED ON */}
      <div style={{
        ...formSectionHeader(true),
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>{t("whatIWorkedOn")}</span>
        <button
          onClick={() => setChooserOpen(true)}
          aria-label={t("addMovesOrASet")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center",
          }}
        >
          <Ic n="plus" s={14} c={C.accent} />
        </button>
      </div>

      {/* Picked moves rows */}
      {pendingMoveIds.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {pendingMoveIds.map(moveId => {
            const move = moves?.find(m => m.id === moveId);
            if (!move) return null;
            return (
              <div key={moveId} style={{
                background: C.surface, borderRadius: 8, padding: "10px 12px",
                borderLeft: `4px solid ${catColors?.[move.category] || C.accent}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  flex: 1, fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800,
                  letterSpacing: 1.2, textTransform: "uppercase", color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {move.name}
                </span>
                {/* Reps stepper — mirrors the MoveModal +/- pattern, sized down for the row */}
                {(() => {
                  const reps = pendingMoveReps[moveId] || 0;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button
                        onClick={() => decReps(moveId)}
                        disabled={reps === 0}
                        aria-label={t("remove")}
                        style={{
                          width: 22, height: 22, borderRadius: 4,
                          background: C.surfaceAlt, border: "none", padding: 0,
                          cursor: reps === 0 ? "default" : "pointer",
                          opacity: reps === 0 ? 0.4 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <Ic n="minus" s={12} c={C.text}/>
                      </button>
                      <span style={{
                        minWidth: 24, textAlign: "center",
                        fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY,
                      }}>{reps}</span>
                      <button
                        onClick={() => incReps(moveId)}
                        style={{
                          width: 22, height: 22, borderRadius: 4,
                          background: C.surfaceAlt, border: "none", padding: 0,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <Ic n="plus" s={12} c={C.text}/>
                      </button>
                    </div>
                  );
                })()}
                <button
                  onClick={() => onTogglePendingMove?.(moveId)}
                  aria-label={t("remove")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                >
                  <Ic n="x" s={14} c={C.textMuted} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Picked sets rows */}
      {pendingSetIds.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {pendingSetIds.map(setId => {
            const set = sets?.find(s => s.id === setId);
            if (!set) return null;
            const moveCount = (set.moveIds || []).length;
            return (
              <div key={setId} style={{
                background: C.surface, borderRadius: 8, padding: "10px 12px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800,
                    letterSpacing: 1.2, textTransform: "uppercase", color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {set.name}
                  </div>
                  <div style={{
                    fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, marginTop: 2,
                  }}>
                    {moveCount} {(moveCount === 1 ? t("move") : t("moves")).toLowerCase()}
                  </div>
                </div>
                <button
                  onClick={() => onTogglePendingSet?.(setId)}
                  aria-label={t("remove")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                >
                  <Ic n="x" s={14} c={C.textMuted} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Txtarea
        value={workDescription}
        onChange={setWorkDescription}
        placeholder={t("anythingElse")}
        rows={2}
        autoExpand
        minHeight={80}
      />

      {/* HOW IT FELT */}
      <div style={formSectionHeader(false)}>{t("howItFelt")}</div>
      <Txtarea
        value={howItFelt}
        onChange={setHowItFelt}
        placeholder={t("howItFeltPlaceholder")}
        rows={3}
        autoExpand
        minHeight={80}
      />

      {/* DURATION */}
      <div style={formSectionHeader(false)}>{t("howLong")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <input
          type="number" inputMode="numeric" min={0}
          value={durationH}
          onChange={e => setDurationH(e.target.value)}
          placeholder="HH"
          style={numberInputStyle}
        />
        <span style={{ color: C.textMuted, fontSize: 18, fontWeight: 700 }}>:</span>
        <input
          type="number" inputMode="numeric" min={0} max={59}
          value={durationM}
          onChange={e => setDurationM(e.target.value)}
          placeholder="MM"
          style={numberInputStyle}
        />
      </div>

      {/* LOCATION */}
      <div style={formSectionHeader(false)}>{t("location")}</div>
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder={t("locationPlaceholder")}
          style={formInputStyle}
        />
      </div>

      {/* VIDEO LINK */}
      <div style={formSectionHeader(false)}>{t("videoLink")}</div>
      {videoLinkOpen ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input
            type="url"
            value={videoLink}
            onChange={e => setVideoLink(e.target.value)}
            placeholder="https://..."
            style={{ ...formInputStyle, flex: 1 }}
          />
          <button
            onClick={() => { setVideoLink(""); setVideoLinkOpen(false); }}
            aria-label={t("removeVideoLink")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, display: "flex", alignItems: "center",
            }}
          >
            <Ic n="x" s={16} c={C.textMuted} />
          </button>
        </div>
      ) : (
        <button onClick={() => setVideoLinkOpen(true)} style={{ ...dashedButtonStyle, marginBottom: 14 }}>
          + {t("addVideoLink")}
        </button>
      )}

      {/* TODAY'S NOTE */}
      <div style={formSectionHeader(false)}>{t("todaysNote")}</div>
      <Txtarea
        value={notes}
        onChange={setNotes}
        placeholder={t("todaysNotePlaceholder")}
        rows={3}
        autoExpand
        minHeight={80}
      />

      {/* Add to HOME checkbox */}
      <label style={{
        display: "flex", alignItems: "center", gap: 8,
        marginTop: 10, cursor: "pointer", userSelect: "none",
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: 4,
          border: `2px solid ${addToHome ? C.green : C.border}`,
          background: addToHome ? C.green : "transparent",
        }}>
          {addToHome && <Ic n="check" s={12} c="#fff" />}
        </span>
        <input
          type="checkbox"
          checked={addToHome}
          onChange={e => setAddToHome(e.target.checked)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        />
        <span style={{
          fontSize: 13, fontFamily: FONT_BODY, color: C.textSec,
        }}>
          {t("logTodayAddToHome")}
        </span>
      </label>

      {/* Chooser BottomSheet */}
      <BottomSheet
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        title={t("addToToday")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => { setChooserOpen(false); onOpenMovePicker?.(); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt || C.surface, border: "none", textAlign: "left",
            }}
          >
            <Ic n="plus" s={18} c={C.textSec} />
            <span style={{ fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
              {t("addMoves")}
            </span>
          </button>
          <button
            onClick={() => { setChooserOpen(false); onOpenSetPicker?.(); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt || C.surface, border: "none", textAlign: "left",
            }}
          >
            <Ic n="plus" s={18} c={C.textSec} />
            <span style={{ fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
              {t("addASet")}
            </span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
});

export default LogTodayTraining;
