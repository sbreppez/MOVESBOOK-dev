import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { PRESET_META, BATTLE_MOODS, BATTLE_RESULTS } from './battlePrepHelpers';

export const BattleHistoryView = ({ history, onClose, t }) => {
  const [expandedBattle, setExpandedBattle] = useState(null); // "planId-battleId"

  // Sort history by endDate descending
  const sorted = [...(history || [])].sort((a, b) => (b.endDate || "").localeCompare(a.endDate || ""));

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "12px 12px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Ic n="chevL" s={18} c={C.text} />
        </button>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 2, color: C.text }}>
          {t("battleHistory")}
        </span>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <span style={{ fontSize: 40 }}>{"\u2694\uFE0F"}</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textMuted, margin: "12px 0", lineHeight: 1.5 }}>
            {t("noBattleHistoryYet")}
          </p>
        </div>
      )}

      {/* History entries */}
      {sorted.map(plan => {
        const meta = PRESET_META[plan.preset] || PRESET_META.smoke;
        const endLabel = plan.endDate ? new Date(plan.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
        const isCompleted = plan.status === "completed";
        const battlesWithReflections = (plan.battles || []).filter(b => b.reflection);

        return (
          <div key={plan.id} style={{
            background: C.surface, borderRadius: 8,
            overflow: "hidden", marginBottom: 6,
          }}>
            {/* Plan header */}
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{
                    fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 0.5, color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {plan.eventName || plan.planName}
                  </span>
                  <span style={{
                    fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 700,
                    background: `${meta.color}20`, color: meta.color,
                    borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                  }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textSec }}>{endLabel}</span>
                  <span style={{
                    fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 700,
                    background: isCompleted ? `${C.green}20` : `${C.textMuted}15`,
                    color: isCompleted ? C.green : C.textMuted,
                    borderRadius: 4, padding: "2px 6px",
                  }}>
                    {isCompleted ? t("planCompleteStatus") : t("planCancelled")}
                  </span>
                </div>
              </div>
            </div>

            {/* Battles with reflections */}
            {battlesWithReflections.map(battle => {
              const ref = battle.reflection;
              const moodObj = BATTLE_MOODS.find(m => m.key === ref.mood) || {};
              const resultObj = BATTLE_RESULTS.find(r => r.key === ref.result) || {};
              const battleDateLabel = new Date(battle.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const expandKey = `${plan.id}-${battle.id}`;
              const isExpanded = expandedBattle === expandKey;

              return (
                <div key={battle.id} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                  <button onClick={() => setExpandedBattle(isExpanded ? null : expandKey)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "10px 14px", background: "none", border: "none",
                      cursor: "pointer", textAlign: "left",
                    }}>
                    <span style={{ fontSize: 18 }}>{moodObj.emoji || ""}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, color: C.text }}>
                          {battleDateLabel}
                        </span>
                        {battle.eventName && (
                          <span style={{ fontSize: 11, fontFamily: FONT_BODY, color: C.textSec }}>
                            {battle.eventName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9, fontFamily: FONT_DISPLAY, fontWeight: 700,
                      background: `${resultObj.color || C.textMuted}20`,
                      color: resultObj.color || C.textMuted,
                      borderRadius: 4, padding: "2px 8px", flexShrink: 0,
                    }}>
                      {t(resultObj.labelKey) || ref.result}
                    </span>
                    <Ic n={isExpanded ? "chevD" : "chevR"} s={11} c={C.textMuted} />
                  </button>

                  {/* Expanded reflection */}
                  {isExpanded && (
                    <div style={{ padding: "4px 14px 14px", background: C.bg, borderTop: `1px solid ${C.borderLight}` }}>
                      {ref.takeaway && (
                        <ReflectionRow label={t("reflectionTakeaway")} text={ref.takeaway} />
                      )}
                      {ref.whatWorked && (
                        <ReflectionRow label={t("reflectionWhatWorked")} text={ref.whatWorked} />
                      )}
                      {ref.needsWork && (
                        <ReflectionRow label={t("reflectionNeedsWork")} text={ref.needsWork} />
                      )}
                      {ref.changeTraining && (
                        <ReflectionRow label={t("reflectionChangeTraining")} text={ref.changeTraining} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* No reflections for cancelled plans */}
            {!isCompleted && battlesWithReflections.length === 0 && (
              <div style={{ borderTop: `1px solid ${C.borderLight}`, padding: "10px 14px" }}>
                <span style={{ fontSize: 12, fontFamily: FONT_BODY, color: C.textMuted, fontStyle: "italic" }}>
                  {t("planCancelled")}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ReflectionRow = ({ label, text }) => (
  <div style={{ marginTop: 8 }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 9, letterSpacing: 0.8, color: C.textMuted, marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>
      {text}
    </div>
  </div>
);
