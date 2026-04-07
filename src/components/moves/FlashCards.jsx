import React, { useState, useMemo, useCallback } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const FlashCards = ({ sets, moves, flashcards, onFlashcardsChange, addCalendarEvent, addToast, onClose }) => {
  const t = useT();

  // Screens: selection | playing | summary
  const [screen, setScreen] = useState("selection");

  // Selection state
  const eligibleSets = useMemo(() => sets.filter(s => (s.moveIds?.length || 0) > 0), [sets]);
  const [selectedIds, setSelectedIds] = useState(() => eligibleSets.map(s => s.id));

  // Playing state
  const [deck, setDeck] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);

  // Summary state
  const [isNewBest, setIsNewBest] = useState(false);

  const allSelected = selectedIds.length === eligibleSets.length;

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : eligibleSets.map(s => s.id));
  }, [allSelected, eligibleSets]);

  const startGame = useCallback(() => {
    const selected = eligibleSets.filter(s => selectedIds.includes(s.id));
    setDeck(shuffle(selected));
    setCardIndex(0);
    setFlipped(false);
    setResults([]);
    setIsNewBest(false);
    setScreen("playing");
  }, [eligibleSets, selectedIds]);

  const handleAnswer = useCallback((gotIt) => {
    const newResults = [...results, { setId: deck[cardIndex].id, gotIt }];
    setResults(newResults);
    setFlipped(false);

    if (cardIndex + 1 < deck.length) {
      // Small delay so flip resets before next card appears
      setTimeout(() => setCardIndex(cardIndex + 1), 50);
    } else {
      // End of deck — go to summary
      const correct = newResults.filter(r => r.gotIt).length;
      const total = newResults.length;
      const percentage = Math.round((correct / total) * 100);

      const best = flashcards?.bestScore;
      const newBest = !best || percentage > best.percentage;
      if (newBest) {
        onFlashcardsChange({ ...flashcards, bestScore: { percentage, total, correct, date: new Date().toISOString().split("T")[0] } });
        setIsNewBest(true);
      }

      addCalendarEvent({
        source: "flashcards",
        date: new Date().toISOString().split("T")[0],
        title: "Flash Cards",
        type: "flashcards",
        score: { percentage, total, correct },
      });

      setScreen("summary");
    }
  }, [results, deck, cardIndex, flashcards, onFlashcardsChange, addCalendarEvent]);

  const retryMissed = useCallback(() => {
    const missedSetIds = results.filter(r => !r.gotIt).map(r => r.setId);
    const missedSets = eligibleSets.filter(s => missedSetIds.includes(s.id));
    setDeck(shuffle(missedSets));
    setCardIndex(0);
    setFlipped(false);
    setResults([]);
    setIsNewBest(false);
    setScreen("playing");
  }, [results, eligibleSets]);

  const currentSet = deck[cardIndex];
  const currentMoves = useMemo(() => {
    if (!currentSet) return [];
    return (currentSet.moveIds || []).map(id => moves.find(m => m.id === id)).filter(Boolean);
  }, [currentSet, moves]);

  const correct = results.filter(r => r.gotIt).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const missedResults = results.filter(r => !r.gotIt);
  const missedSets = missedResults.map(r => eligibleSets.find(s => s.id === r.setId)).filter(Boolean);

  // ─── OVERLAY CONTAINER ───
  const overlay = {
    position: "fixed", inset: 0, zIndex: 1000, background: C.bg,
    display: "flex", flexDirection: "column", overflow: "hidden",
  };

  const header = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0,
  };

  const headerTitle = {
    fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, letterSpacing: 1.5,
    textTransform: "uppercase", color: C.text,
  };

  const scrollBody = { flex: 1, overflowY: "auto", padding: "16px" };

  // ─── SELECTION SCREEN ───
  if (screen === "selection") {
    return (
      <div style={overlay}>
        <div style={header}>
          <span style={headerTitle}>{t("flashCards")}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <Ic n="x" s={20} c={C.textMuted} />
          </button>
        </div>
        <div style={scrollBody}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
            {t("flashCardsInstruction")}
          </p>

          {/* Select All / Deselect All */}
          <button onClick={toggleAll}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 0", marginBottom: 12,
              fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              color: C.accent }}>
            {allSelected ? t("deselectAll") : t("selectAll")}
          </button>

          {/* Set list */}
          {eligibleSets.map(s => {
            const checked = selectedIds.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleSelect(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "12px 10px", background: checked ? `${C.accent}12` : "none",
                  border: `1px solid ${checked ? C.accent : C.border}`, borderRadius: 10,
                  cursor: "pointer", marginBottom: 8, minHeight: 44 }}>
                {/* Checkbox */}
                <div style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${checked ? C.accent : C.textMuted}`,
                  background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {checked && <Ic n="check" s={14} c="#fff" />}
                </div>
                {/* Color dot */}
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.color || C.accent, flexShrink: 0 }} />
                {/* Name + count */}
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted }}>{s.moveIds?.length || 0} moves</div>
                </div>
              </button>
            );
          })}

          {/* Min sets hint */}
          {selectedIds.length < 2 && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.yellow, textAlign: "center", margin: "12px 0" }}>
              {t("minSetsRequired")}
            </p>
          )}

          {/* Start button */}
          <button onClick={startGame} disabled={selectedIds.length < 2}
            style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: selectedIds.length < 2 ? "default" : "pointer",
              background: selectedIds.length < 2 ? C.surfaceAlt : C.accent, color: selectedIds.length < 2 ? C.textMuted : "#fff",
              fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
              marginTop: 8, opacity: selectedIds.length < 2 ? 0.5 : 1, minHeight: 48 }}>
            {t("flashCards")}
          </button>
        </div>
      </div>
    );
  }

  // ─── PLAYING SCREEN ───
  if (screen === "playing" && currentSet) {
    return (
      <div style={overlay}>
        <div style={header}>
          <span style={headerTitle}>{t("flashCards")}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec }}>
            {cardIndex + 1} {t("ofProgress")} {deck.length}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 24 }}>

          {/* Progress bar */}
          <div style={{ width: "100%", maxWidth: 360, height: 4, borderRadius: 2, background: C.surfaceAlt }}>
            <div style={{ width: `${((cardIndex) / deck.length) * 100}%`, height: "100%", borderRadius: 2, background: C.accent, transition: "width 0.3s" }} />
          </div>

          {/* Card */}
          <div onClick={() => setFlipped(!flipped)}
            style={{ width: "100%", maxWidth: 360, height: 280, perspective: "1000px", cursor: "pointer" }}>
            <div style={{
              width: "100%", height: "100%", position: "relative",
              transformStyle: "preserve-3d", transition: "transform 0.4s",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}>
              {/* Front */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: 24,
              }}>
                {/* Color dot */}
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: currentSet.color || C.accent, marginBottom: 16 }} />
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: C.text, textAlign: "center",
                  textTransform: "uppercase", letterSpacing: 1 }}>
                  {currentSet.name}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted, marginTop: 12 }}>
                  {currentMoves.length} moves
                </div>
              </div>

              {/* Back */}
              <div style={{
                position: "absolute", inset: 0, backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                padding: 24, overflowY: "auto",
              }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: C.textMuted,
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  {currentSet.name}
                </div>
                {currentMoves.map(m => (
                  <div key={m.id} style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.text, padding: "4px 0",
                    borderBottom: `1px solid ${C.borderLight}`, width: "100%", textAlign: "center" }}>
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tap hint */}
          {!flipped && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>
              ↻ tap to flip
            </div>
          )}

          {/* Got It / Missed It */}
          {flipped && (
            <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 360 }}>
              <button onClick={() => handleAnswer(false)}
                style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  background: `${C.red}22`, color: C.red,
                  fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", minHeight: 48 }}>
                {t("missedIt")}
              </button>
              <button onClick={() => handleAnswer(true)}
                style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  background: C.green, color: "#fff",
                  fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", minHeight: 48 }}>
                {t("gotIt")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SUMMARY SCREEN ───
  if (screen === "summary") {
    return (
      <div style={overlay}>
        <div style={header}>
          <span style={headerTitle}>{t("flashCards")}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <Ic n="x" s={20} c={C.textMuted} />
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>

          {/* Score */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 56, fontWeight: 900, color: C.text, lineHeight: 1 }}>
              {percentage}%
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSec, marginTop: 6 }}>
              {correct} / {total}
            </div>
          </div>

          {/* New Best badge */}
          {isNewBest && (
            <div style={{ padding: "8px 20px", borderRadius: 20, background: `${C.accent}22`, border: `1.5px solid ${C.accent}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: "uppercase" }}>
                ⭐ {t("newBest")}
              </span>
            </div>
          )}

          {/* Missed sets list */}
          {missedSets.length > 0 && (
            <div style={{ width: "100%", maxWidth: 360, marginTop: 8 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                color: C.textMuted, marginBottom: 8 }}>
                {t("setsMissed")}
              </div>
              {missedSets.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color || C.accent }} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text }}>{s.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {missedSets.length > 0 && (
              <button onClick={retryMissed}
                style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: `1.5px solid ${C.accent}`,
                  background: "transparent", color: C.accent, cursor: "pointer",
                  fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", minHeight: 48 }}>
                {t("retryMissed")}
              </button>
            )}
            <button onClick={onClose}
              style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: C.accent, color: "#fff", cursor: "pointer",
                fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", minHeight: 48 }}>
              {t("flashCardsDone")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
