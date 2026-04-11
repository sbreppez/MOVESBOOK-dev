import React, { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { CAT_COLORS } from '../../constants/categories';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { BodyCheckIn } from '../shared/BodyCheckIn';
import { todayLocal } from '../../utils/dateUtils';

const SPECIAL_CHIPS = ["Freestyle", "Sets", "Mobility", "Conditioning"];
const SPECIAL_CHIP_KEYS = { Freestyle: "freestyleChip", Sets: "setsChip", Mobility: "mobilityChip", Conditioning: "conditioningChip" };
const DURATION_PRESETS = [30, 45, 60, 90, 120];

export const SessionJournal = ({
  date, event, moves, cats, catColors,
  settings, onSettingsChange, initialType,
  onSave, onCancel,
}) => {
  const t = useT();
  const isEdit = !!event?.id;

  const [type, setType] = useState(event?.type || initialType || "training");
  const [title, setTitle] = useState(event?.title || "");
  const [notes, setNotes] = useState(event?.notes || "");
  const [categories, setCategories] = useState(event?.categories || []);
  const [moveIds, setMoveIds] = useState(event?.moveIds || []);
  const [workDescription, setWorkDescription] = useState(event?.workDescription || "");
  const [duration, setDuration] = useState(event?.duration || null);
  const [customDuration, setCustomDuration] = useState("");
  const [exertion, setExertion] = useState(event?.exertion || null);
  const [bodyStatus, setBodyStatus] = useState(event?.bodyStatus || null);
  const [eventLink, setEventLink] = useState(event?.eventLink || "");
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");

  // Section collapse states
  const jSections = settings?.journalSections || {};
  const sec = (key, defaultOpen) => jSections[key] !== undefined ? !jSections[key] : defaultOpen;
  const [secWork, setSecWork] = useState(sec("whatIWorkedOn", true));
  const [secFeel, setSecFeel] = useState(sec("howItFelt", false));
  const [secDuration, setSecDuration] = useState(sec("duration", false));
  const [secNotes, setSecNotes] = useState(sec("notes", false));

  const toggleSection = (key, val, setter) => {
    setter(v => !v);
    onSettingsChange(prev => ({
      ...prev,
      journalSections: { ...(prev.journalSections || {}), [key]: val },
    }));
  };

  // Format date display
  const dateDisplay = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    const day = d.getDate();
    const monthKeys = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    return `${day} ${t(monthKeys[d.getMonth()])} ${d.getFullYear()}`;
  }, [date, t]);

  const isToday = date === todayLocal();

  // Toggle category chip
  const toggleCat = (cat) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  // Toggle move selection
  const toggleMove = (id) => {
    setMoveIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      // Auto-add category
      const move = moves.find(m => m.id === id);
      if (move && !categories.includes(move.category)) {
        setCategories(c => [...c, move.category]);
      }
      return [...prev, id];
    });
  };

  // Filtered moves for picker
  const filteredMoves = useMemo(() => {
    if (!showMovePicker) return [];
    const q = moveSearch.toLowerCase();
    return (moves || []).filter(m => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [moves, moveSearch, showMovePicker]);

  // Group by category
  const groupedMoves = useMemo(() => {
    const groups = {};
    filteredMoves.forEach(m => {
      const cat = m.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [filteredMoves]);

  const selectedMoveObjects = useMemo(() => {
    return moveIds.map(id => moves.find(m => m.id === id)).filter(Boolean);
  }, [moveIds, moves]);

  const handleSave = () => {
    const defaultTitles = {
      training: t("trainingSession"),
      battle: t("battleEvent"),
      rest: t("restDay"),
      journal: t("journalEvent"),
      custom: t("journalEvent"),
    };
    const obj = {
      id: event?.id || Date.now(),
      date,
      type,
      title: title.trim() || defaultTitles[type] || "Event",
      notes: notes.trim(),
      categories: type === "training" ? categories : [],
      moveIds: type === "training" ? moveIds : [],
      workDescription: type === "training" ? workDescription.trim() : "",
      duration: type === "training" ? duration : null,
      exertion: type === "training" ? exertion : null,
      bodyStatus: type === "training" ? bodyStatus : null,
      eventLink: type === "battle" ? eventLink.trim() || null : null,
    };
    onSave(obj);
  };

  const sectionHeader = (label, isOpen, onToggle) => (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", background: "none", border: "none", cursor: "pointer",
      padding: "10px 0 6px", marginTop: 6,
    }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10,
        color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </span>
      <Ic n={isOpen ? "chevD" : "chevR"} s={14} c={C.textMuted} />
    </button>
  );

  const chipStyle = (active, color) => ({
    borderRadius: 20, padding: "6px 12px",
    border: `1.5px solid ${active ? (color || C.accent) : C.border}`,
    background: active ? (color || C.accent) + "22" : "transparent",
    color: active ? (color || C.accent) : C.textSec,
    fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
    cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.3,
    transition: "all 0.12s",
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 18px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, color: C.text, letterSpacing: 1 }}>
          {isEdit ? t("edit") : t("addEvent")}
        </span>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <Ic n="x" s={20} c={C.textMuted} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "12px 16px 100px" }}>
        {/* Date display */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>
            {dateDisplay}
          </span>
          {isToday && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.accent,
              background: C.accent + "18", borderRadius: 6, padding: "2px 6px", letterSpacing: 0.5,
              fontFamily: FONT_DISPLAY }}>
              {t("today")}
            </span>
          )}
        </div>

        {/* Type selector (for new events only) */}
        {!isEdit && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { type: "training", icon: "target", label: t("training") },
              { type: "battle", icon: "swords", label: t("battleEvent") },
              { type: "rest", icon: "pause", label: t("restDay") },
              { type: "journal", icon: "mapPin", label: t("journalEvent") },
            ].map(opt => (
              <button key={opt.type} onClick={() => setType(opt.type)}
                style={{
                  ...chipStyle(type === opt.type),
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                <Ic n={opt.icon} s={13} c={C.textSec}/>{opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Journal card */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 14 }}>

          {/* ── TRAINING TYPE ── */}
          {type === "training" && (
            <>
              {/* Section 1: What I Worked On */}
              {sectionHeader(t("whatIWorkedOn"), secWork, () => toggleSection("whatIWorkedOn", secWork, setSecWork))}
              {secWork && (
                <div>
                  {/* Category chips */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                    {(cats || []).map(cat => (
                      <button key={cat} onClick={() => toggleCat(cat)}
                        style={chipStyle(categories.includes(cat), catColors[cat] || CAT_COLORS[cat])}>
                        {cat}
                      </button>
                    ))}
                    {SPECIAL_CHIPS.map(chip => (
                      <button key={chip} onClick={() => toggleCat(chip)}
                        style={chipStyle(categories.includes(chip))}>
                        {t(SPECIAL_CHIP_KEYS[chip])}
                      </button>
                    ))}
                  </div>

                  {/* Move tagger */}
                  {!showMovePicker ? (
                    <button onClick={() => setShowMovePicker(true)}
                      style={{ background: "none", border: `1.5px dashed ${C.border}`, borderRadius: 8,
                        padding: "8px 12px", cursor: "pointer", color: C.textMuted,
                        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
                        letterSpacing: 0.3, width: "100%", textAlign: "left", marginBottom: 8 }}>
                      {t("tagSpecificMoves")}
                    </button>
                  ) : (
                    <div style={{ borderRadius: 8, padding: 8,
                      marginBottom: 8, maxHeight: 220, overflow: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <Ic n="search" s={14} c={C.textMuted} />
                        <input
                          value={moveSearch}
                          onChange={e => setMoveSearch(e.target.value)}
                          placeholder={t("search")}
                          style={{ flex: 1, background: "none", border: "none", outline: "none",
                            color: C.text, fontSize: 13, fontFamily: FONT_BODY }}
                        />
                        <button onClick={() => { setShowMovePicker(false); setMoveSearch(""); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                          <Ic n="x" s={14} c={C.textMuted} />
                        </button>
                      </div>
                      {Object.entries(groupedMoves).map(([cat, mvs]) => (
                        <div key={cat}>
                          <div style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                            color: catColors[cat] || CAT_COLORS[cat] || C.textMuted,
                            letterSpacing: 0.5, marginTop: 6, marginBottom: 3 }}>
                            {cat}
                          </div>
                          {mvs.map(m => {
                            const sel = moveIds.includes(m.id);
                            return (
                              <button key={m.id} onClick={() => toggleMove(m.id)}
                                style={{ display: "flex", alignItems: "center", gap: 6,
                                  width: "100%", padding: "5px 6px", background: sel ? C.accent + "10" : "transparent",
                                  border: "none", cursor: "pointer", borderRadius: 6, textAlign: "left" }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%",
                                  background: catColors[m.category] || CAT_COLORS[m.category] || C.accent,
                                  flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{m.name}</span>
                                {sel && <Ic n="check" s={14} c={C.accent} />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected move pills */}
                  {selectedMoveObjects.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                      {selectedMoveObjects.map(m => (
                        <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                          background: (catColors[m.category] || CAT_COLORS[m.category] || C.accent) + "18",
                          color: catColors[m.category] || CAT_COLORS[m.category] || C.accent,
                          borderRadius: 12, padding: "3px 8px" }}>
                          {m.name}
                          <button onClick={() => toggleMove(m.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                            <Ic n="x" s={10} c={catColors[m.category] || CAT_COLORS[m.category] || C.accent} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Free text */}
                  <input
                    value={workDescription}
                    onChange={e => setWorkDescription(e.target.value)}
                    placeholder={t("anythingElse")}
                    style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                      fontFamily: FONT_BODY, outline: "none" }}
                  />
                </div>
              )}

              {/* Section 2: How It Felt */}
              {sectionHeader(t("howItFelt"), secFeel, () => toggleSection("howItFelt", secFeel, setSecFeel))}
              {secFeel && (
                <BodyCheckIn
                  exertion={exertion}
                  onExertionChange={setExertion}
                  bodyStatus={bodyStatus}
                  onBodyStatusChange={setBodyStatus}
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {/* Section 3: Duration */}
              {sectionHeader(t("howLong"), secDuration, () => toggleSection("duration", secDuration, setSecDuration))}
              {secDuration && (
                <div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                    {DURATION_PRESETS.map(d => (
                      <button key={d} onClick={() => { setDuration(duration === d ? null : d); setCustomDuration(""); }}
                        style={chipStyle(duration === d)}>
                        {d} {t("aboutXMin")}
                      </button>
                    ))}
                    {(() => {
                      const isCustomActive = customDuration && duration === parseInt(customDuration, 10) && !DURATION_PRESETS.includes(duration);
                      return (
                        <input
                          value={customDuration}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, "");
                            setCustomDuration(v);
                            if (v) setDuration(parseInt(v, 10));
                          }}
                          onBlur={() => { if (customDuration) setDuration(parseInt(customDuration, 10)); }}
                          onKeyDown={e => { if (e.key === "Enter" && customDuration) { setDuration(parseInt(customDuration, 10)); e.target.blur(); } }}
                          placeholder={t("aboutXMin")}
                          style={{ width: 60,
                            background: isCustomActive ? C.accent + "22" : C.surfaceAlt,
                            border: `1.5px solid ${isCustomActive ? C.accent : C.border}`,
                            borderRadius: 20, padding: "6px 10px",
                            color: isCustomActive ? C.accent : C.text,
                            fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 700,
                            outline: "none", textAlign: "center" }}
                        />
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic", fontFamily: FONT_BODY }}>
                    {t("roughEstimate")}
                  </div>
                </div>
              )}

              {/* Section 4: Notes */}
              {sectionHeader(t("sessionNotes"), secNotes, () => toggleSection("notes", secNotes, setSecNotes))}
              {secNotes && (
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                  style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                    fontFamily: FONT_BODY, outline: "none", resize: "vertical" }}
                />
              )}
            </>
          )}

          {/* ── BATTLE TYPE ── */}
          {type === "battle" && (
            <>
              <div style={{ marginBottom: 10 }}>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t("battleEvent")}
                  style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                    fontFamily: FONT_BODY, fontWeight: 600, outline: "none", marginBottom: 8 }}
                />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  rows={2}
                  style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                    fontFamily: FONT_BODY, outline: "none", resize: "vertical", marginBottom: 8 }}
                />
              </div>
              {/* Event link */}
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11,
                  color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>
                  {t("eventLink")}
                </div>
                <input
                  value={eventLink}
                  onChange={e => setEventLink(e.target.value)}
                  placeholder={t("addEventLinkHint")}
                  style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                    fontFamily: FONT_BODY, outline: "none" }}
                />
                {!eventLink && (
                  <div style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic",
                    fontFamily: FONT_BODY, marginTop: 4 }}>
                    {t("addEventLinkHint")}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── REST / JOURNAL TYPE ── */}
          {(type === "rest" || type === "journal" || type === "custom") && (
            <>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={type === "rest" ? t("restDay") : t("journalEvent")}
                style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                  fontFamily: FONT_BODY, fontWeight: 600, outline: "none", marginBottom: 8 }}
              />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13,
                  fontFamily: FONT_BODY, outline: "none", resize: "vertical" }}
              />
            </>
          )}
        </div>

        {/* Save button */}
        <button onClick={handleSave}
          style={{ width: "100%", padding: "14px 0", marginTop: 16,
            background: C.green, border: "none", borderRadius: 8, cursor: "pointer",
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14,
            letterSpacing: 1, color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6 }}>
          {t("saveSession")}
        </button>

        {/* Cancel */}
        <button onClick={onCancel}
          style={{ width: "100%", padding: "10px 0", marginTop: 8,
            background: "none", border: "none", cursor: "pointer",
            color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 13, letterSpacing: 0.5 }}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
};
