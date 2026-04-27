import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { BATTLE_MOODS, BATTLE_RESULTS } from './battlePrepHelpers';

/**
 * Renders a single battle result row with optional inline-expand reflection.
 *
 * Two modes, controlled by props:
 *  - Interactive collapse/expand: pass `onToggle` callback. Row is a button,
 *    chevron rotates between collapsed/expanded. Used by BattleHistoryView.
 *  - Always-expanded (or always-collapsed) display: omit `onToggle`. Row is a
 *    plain div, no chevron. Used by BattleResultDetail (always expanded) and
 *    CalendarOverlay day-detail when paired with a tap-to-open handler.
 *
 * The card render lives here (extracted from BattleHistoryView lines 81-138)
 * so the History view, the Calendar day-detail section, and the
 * BattleResultDetail BottomSheet stay visually identical and stay in sync as
 * Battle UX evolves.
 */
export const BattleResultCard = ({ battle, t, expanded, onToggle, onOpen }) => {
  if (!battle?.reflection) return null;

  const ref = battle.reflection;
  const moodObj = BATTLE_MOODS.find(m => m.key === ref.mood) || {};
  const resultObj = BATTLE_RESULTS.find(r => r.key === ref.result) || {};
  const battleDateLabel = new Date(battle.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const isInteractive = typeof onToggle === "function" || typeof onOpen === "function";
  const handleClick = onToggle || onOpen;
  const showChevron = typeof onToggle === "function";

  const HeaderTag = isInteractive ? "button" : "div";
  const headerProps = isInteractive ? { onClick: handleClick } : {};

  return (
    <>
      <HeaderTag {...headerProps}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "10px 14px", background: "none", border: "none",
          cursor: isInteractive ? "pointer" : "default", textAlign: "left",
        }}>
        <span style={{ fontSize: 18 }}>{moodObj.emoji || ""}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.text }}>
              {battleDateLabel}
            </span>
            {battle.eventName && (
              <span style={{
                fontSize: 11, fontFamily: FONT_BODY, color: C.textSec,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {battle.eventName}
              </span>
            )}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
          background: `${resultObj.color || C.textMuted}20`,
          color: resultObj.color || C.textMuted,
          borderRadius: 4, padding: "2px 8px", flexShrink: 0,
        }}>
          {t(resultObj.labelKey) || ref.result}
        </span>
        {showChevron && (
          <Ic n={expanded ? "chevD" : "chevR"} s={11} c={C.textMuted} />
        )}
        {!showChevron && typeof onOpen === "function" && (
          <Ic n="chevR" s={11} c={C.textMuted} />
        )}
      </HeaderTag>

      {expanded && (
        <div style={{ padding: "4px 14px 14px", background: C.bg, borderTop: `1px solid ${C.borderLight}` }}>
          {ref.takeaway && <ReflectionRow label={t("reflectionTakeaway")} text={ref.takeaway} />}
          {ref.whatWorked && <ReflectionRow label={t("reflectionWhatWorked")} text={ref.whatWorked} />}
          {ref.needsWork && <ReflectionRow label={t("reflectionNeedsWork")} text={ref.needsWork} />}
          {ref.changeTraining && <ReflectionRow label={t("reflectionChangeTraining")} text={ref.changeTraining} />}
        </div>
      )}
    </>
  );
};

const ReflectionRow = ({ label, text }) => (
  <div style={{ marginTop: 8 }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10, letterSpacing: 0.8, color: C.textMuted, marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>
      {text}
    </div>
  </div>
);
