import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Txtarea } from '../shared/Txtarea';
import { BottomSheet } from '../shared/BottomSheet';

export const LogTodayTraining = forwardRef(function LogTodayTraining({
  date,
  moves,
  sets,
  pendingMoveIds = [],
  pendingSetIds = [],
  onOpenMovePicker,
  onOpenSetPicker,
  addCalendarEvent,
  markMoveTrainedToday,
  addToast,
  event,
  onClose,
}, ref) {
  const t = useT();

  const [title, setTitle] = useState(event?.title || "");
  const [workDescription, setWorkDescription] = useState(event?.workDescription || "");
  const [howItFelt, setHowItFelt] = useState(event?.howItFelt || "");
  const [durationH, setDurationH] = useState(
    event?.duration ? String(Math.floor(event.duration / 60)) : ""
  );
  const [durationM, setDurationM] = useState(
    event?.duration ? String(event.duration % 60) : ""
  );
  const [location, setLocation] = useState(event?.location || "");
  const [videoLink, setVideoLink] = useState(event?.videoLink || "");
  const [videoLinkOpen, setVideoLinkOpen] = useState(!!event?.videoLink);
  const [notes, setNotes] = useState(event?.notes || "");
  const [chooserOpen, setChooserOpen] = useState(false);

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

  // Summary line — visible feedback for what was selected
  const moveSummaryNames = pendingMoveIds
    .map(id => moves?.find(m => m.id === id)?.name)
    .filter(Boolean);
  const setSummaryNames = pendingSetIds
    .map(id => sets?.find(s => s.id === id)?.name)
    .filter(Boolean);
  const summaryParts = [];
  if (moveSummaryNames.length > 0) summaryParts.push(`${t("moves")}: ${moveSummaryNames.join(", ")}.`);
  if (setSummaryNames.length > 0) summaryParts.push(`${t("sets")}: ${setSummaryNames.join(", ")}.`);
  const summaryLine = summaryParts.length > 0
    ? `${t("trainedToday")}: ${summaryParts.join(" ")}`
    : null;

  const handleSave = () => {
    const h = parseInt(durationH, 10) || 0;
    const m = parseInt(durationM, 10) || 0;
    const totalDuration = h * 60 + m;

    const movesFromSets = pendingSetIds.flatMap(sid => {
      const s = sets?.find(x => x.id === sid);
      return s?.moveIds || [];
    });
    const allMoveIdsToMark = [...new Set([...pendingMoveIds, ...movesFromSets])];

    const record = {
      ...(event || {}),
      id: event?.id ?? Date.now(),
      date,
      type: "training",
      source: "log_today",
      title: title.trim() || t("trainingSession"),
      moveIds: allMoveIdsToMark,
      setIds: pendingSetIds,
      workDescription: workDescription.trim(),
      howItFelt: howItFelt.trim(),
      duration: totalDuration > 0 ? totalDuration : null,
      location: location.trim(),
      videoLink: videoLink.trim() || null,
      notes: notes.trim(),
    };

    addCalendarEvent?.(record, { silent: true, skipDedup: true });

    if (markMoveTrainedToday) {
      allMoveIdsToMark.forEach(id => markMoveTrainedToday(id));
    }

    addToast?.({ icon: "check", title: t("sessionLogged") });

    onClose?.();
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSave(),
  }));

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t("sessionTitleOptional")}
        style={{ ...formInputStyle, fontWeight: 700, fontSize: 16, marginBottom: 8 }}
      />

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
      {summaryLine && (
        <div style={{
          fontSize: 13, fontFamily: FONT_BODY, color: C.textSec,
          lineHeight: 1.5, marginBottom: 13,
        }}>
          {summaryLine}
        </div>
      )}
      <Txtarea
        value={workDescription}
        onChange={setWorkDescription}
        placeholder={t("anythingElse")}
        rows={2}
        autoExpand
      />

      {/* HOW IT FELT */}
      <div style={formSectionHeader(false)}>{t("howItFelt")}</div>
      <Txtarea
        value={howItFelt}
        onChange={setHowItFelt}
        placeholder={t("howItFeltPlaceholder")}
        rows={3}
        autoExpand
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
      />

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
