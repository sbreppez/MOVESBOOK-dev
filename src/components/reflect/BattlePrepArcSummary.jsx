import React, { useMemo } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { getTasksForDay, getPrevDayTasks } from '../train/battlePrepHelpers';

/**
 * Per-battle prep arc summary. Lists every prep day leading up to a
 * specific battle, showing phase + completed tasks per day.
 *
 * For battle B in plan P:
 *   - Arc start: day after the prior battle's date (if any), else the
 *     earliest date in dayMap (i.e., plan start).
 *   - Arc end: B.date inclusive.
 *
 * Used inside BattleResultDetail's BottomSheet so users can review what
 * they actually did to prepare for that specific battle.
 *
 * Props:
 *  - plan: { id, battles[], completedTasks, ... }
 *  - battle: { id, date, ... }
 *  - dayMap: { [YYYY-MM-DD]: { type, phase, phaseColor, ... } }
 *  - t: translation function
 */
export const BattlePrepArcSummary = ({ plan, battle, dayMap, t }) => {
  const arcDates = useMemo(() => {
    if (!plan || !battle || !dayMap) return [];
    const battles = (plan.battles || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const idx = battles.findIndex(b => b.id === battle.id);
    const priorBattle = idx > 0 ? battles[idx - 1] : null;
    const allDates = Object.keys(dayMap).sort();
    const startDate = priorBattle
      ? allDates.find(d => d > priorBattle.date)
      : allDates[0];
    if (!startDate) return [];
    return allDates.filter(d => d >= startDate && d <= battle.date);
  }, [plan, battle, dayMap]);

  if (arcDates.length === 0) return null;

  const completed = plan?.completedTasks || {};

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 10,
        letterSpacing: 1, color: C.textMuted, marginBottom: 6,
      }}>
        {t("prepArc")}
      </div>
      {arcDates.map(date => {
        const info = dayMap[date];
        if (!info) return null;
        const prevKeys = getPrevDayTasks(plan.id, date, dayMap);
        const tasks = getTasksForDay(plan.id, date, info, prevKeys) || [];
        const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short", month: "short", day: "numeric",
        });
        const isBattleDay = info.type === "battle";

        return (
          <div key={date} style={{
            background: C.surface, borderRadius: 8, padding: "8px 10px", marginBottom: 4,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: tasks.length ? 6 : 0,
            }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.text, flex: 1 }}>
                {dateLabel}
              </span>
              {!isBattleDay && info.phase && (
                <span style={{
                  fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  background: `${info.phaseColor}25`, color: info.phaseColor,
                  borderRadius: 4, padding: "1px 6px",
                }}>
                  {info.phase}
                </span>
              )}
              {isBattleDay && (
                <span style={{
                  fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  background: `${C.red}15`, color: C.red,
                  borderRadius: 4, padding: "1px 6px",
                }}>
                  <Ic n="swords" s={10} c={C.red} /> {t("battleDay")}
                </span>
              )}
            </div>
            {tasks.length > 0 && (
              <div>
                {tasks.map((task, i) => {
                  const done = !!completed[`${date}-${i}`];
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 11, fontFamily: FONT_BODY,
                      color: done ? C.textMuted : C.textSec,
                      textDecoration: done ? "line-through" : "none",
                      opacity: done ? 0.6 : 1,
                      padding: "2px 0",
                    }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: 3,
                        border: `1.5px solid ${done ? C.green : C.borderLight}`,
                        background: done ? C.green : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {done && <Ic n="check" s={8} c="#fff" />}
                      </div>
                      <span style={{ fontSize: 12, flexShrink: 0 }}>{task.emoji}</span>
                      <span style={{ flex: 1 }}>{t(task.key)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
