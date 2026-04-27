import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { BottomSheet } from '../shared/BottomSheet';
import { BattleResultCard } from '../train/BattleResultCard';
import { BattlePrepArcSummary } from './BattlePrepArcSummary';
import { PRESET_META } from '../train/battlePrepHelpers';

/**
 * Read-only BottomSheet detail view for a single battle result.
 *
 * Two render states:
 *  - Has reflection: full BattleResultCard in always-expanded mode + plan
 *    preset chip and event/plan name strip.
 *  - No reflection (empty state): "No reflection logged" message + "LOG
 *    REFLECTION" CTA button. Tapping the CTA closes this sheet and calls
 *    `onLogReflection({ planId, battleId })` so the caller can deep-link to
 *    BattleDayView's reflection phase.
 *
 * Per #133: read-only for already-logged reflections (no editing); the empty
 * state's CTA bridges to the existing reflection-logging flow rather than
 * duplicating it inline.
 *
 * Props:
 *  - open: boolean — BottomSheet open state.
 *  - battle: object | null — { date, id, eventName?, reflection? }.
 *  - plan: object | null — { id, eventName, planName, preset } from
 *    battleprep.plans / battleprep.history. Null for manual battle events
 *    that have no battleprep linkage; in that case the empty-state CTA is
 *    hidden because there's no plan/battle id to log against.
 *  - onClose: () => void — closes the BottomSheet.
 *  - onLogReflection: ({ planId, battleId }) => void — opens BattleDayView
 *    at reflection phase. Only called when both plan and battle are present.
 *  - t: translation function.
 */
export const BattleResultDetail = ({ open, battle, plan, dayMap, onClose, onLogReflection, t }) => {
  // Render an empty BottomSheet when no battle is selected so the parent can
  // keep `open` purely tied to a state setter without guarding.
  if (!battle) {
    return <BottomSheet open={open} onClose={onClose} title={t("battleResultDetail")} titleIcon={"⚔️"} />;
  }

  const meta = plan ? (PRESET_META[plan.preset] || PRESET_META.smoke) : null;
  const title = battle.eventName || plan?.eventName || plan?.planName || t("battleResultDetail");
  const hasReflection = !!battle.reflection;
  const canLogReflection = !!(plan && battle.id && typeof onLogReflection === "function");
  // Show prep arc when both plan + dayMap are available. Manual battle
  // events (no battleprep linkage) and direct calls without dayMap fall
  // back to the reflection-only view as before (#133 behavior).
  const showPrepArc = !!(plan && dayMap);

  return (
    <BottomSheet open={open} onClose={onClose} title={title} titleIcon={"⚔️"}>
      {/* Plan meta strip — only when plan info is available */}
      {plan && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 12px", flexWrap: "wrap" }}>
          {meta && (
            <span style={{
              fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
              background: `${meta.color}20`, color: meta.color,
              borderRadius: 4, padding: "2px 6px",
            }}>
              {meta.icon} {meta.label}
            </span>
          )}
          {(plan.eventName || plan.planName) && (
            <span style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textSec,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
              {plan.eventName || plan.planName}
            </span>
          )}
        </div>
      )}

      {/* Prep arc — only shown when plan + dayMap supplied (battle came from
          battleprep flow, not a manual calendar event) */}
      {showPrepArc && (
        <BattlePrepArcSummary plan={plan} battle={battle} dayMap={dayMap} t={t} />
      )}

      {hasReflection ? (
        // Always-expanded card — read-only full reflection
        <div style={{ background: C.surface, borderRadius: 8, overflow: "hidden" }}>
          <BattleResultCard battle={battle} plan={plan} t={t} expanded={true} />
        </div>
      ) : (
        // Empty state — message + CTA to log reflection
        <div style={{ padding: "16px 4px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{"⚔️"}</div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, lineHeight: 1.5, margin: "0 0 16px" }}>
            {t("noReflectionLogged")}
          </p>
          {canLogReflection && (
            <button
              onClick={() => onLogReflection({ planId: plan.id, battleId: battle.id })}
              style={{
                width: "100%", padding: "12px 16px",
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 8, cursor: "pointer",
                fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13,
                letterSpacing: 1.5,
              }}>
              {t("logReflectionCta")}
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
};
