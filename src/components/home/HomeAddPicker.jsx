import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { BottomSheet } from '../shared/BottomSheet';
import { RoutineForm } from './RoutineForm';
import { IdeaForm } from './IdeaForm';

export const HomeAddPicker = ({ open, onClose, homeStack, setHomeStack, homeIdeas, setHomeIdeas, habits, ideas, selectedDate }) => {
  const { C } = useSettings();
  const t = useT();
  const [view, setView] = useState("picker"); // picker | newRoutine | newIdea

  const todayTileIds = (homeStack?.defaultStack || []).map(t => t.id);

  // Existing routines not yet on today
  const existingRoutines = (homeStack?.defaultStack || []).filter(
    tile => tile.type === 'routine'
  );

  // Goals and habits not yet on stack
  const availableGoals = (ideas || []).filter(
    i => (i.type === 'goal' || i.type === 'target') && !todayTileIds.includes('gh_' + i.id)
  );
  const availableHabits = (habits || []).filter(
    h => !todayTileIds.includes('gh_' + h.id)
  );

  const handleAddExistingRoutine = (routine) => {
    // Add to today's override if not already in default
    setHomeStack(prev => {
      const overrides = { ...(prev.overrides || {}) };
      const dayOvr = { ...(overrides[selectedDate] || {}) };
      dayOvr.added = [...(dayOvr.added || []), { ...routine }];
      overrides[selectedDate] = dayOvr;
      return { ...prev, overrides };
    });
    onClose();
  };

  const handleCreateRoutine = (fields) => {
    const newTile = {
      id: Date.now().toString(),
      type: 'routine',
      ...fields,
    };
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [...prev.defaultStack, newTile],
    }));
    onClose();
  };

  const handleCreateIdea = (fields) => {
    const id = Date.now().toString();
    const newIdea = { id, ...fields };
    setHomeIdeas(prev => [...prev, newIdea]);
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [...prev.defaultStack, { id, type: 'idea' }],
    }));
    onClose();
  };

  const handleAddGoalHabit = (refId) => {
    const tileId = 'gh_' + refId;
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [...prev.defaultStack, { id: tileId, type: 'goalhabit', refId: String(refId) }],
    }));
    onClose();
  };

  const sectionHeader = (label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 2px 6px" }}>
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.textMuted,
        fontFamily: FONT_DISPLAY, textTransform: "uppercase",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.borderLight }}/>
    </div>
  );

  const createBtn = (label, onClick) => (
    <button onClick={onClick}
      style={{
        width: "100%", padding: "12px 0", borderRadius: 10, cursor: "pointer",
        background: "transparent", border: `1.5px dashed ${C.border}`,
        color: C.accent, fontSize: 12, fontWeight: 800, fontFamily: FONT_DISPLAY,
        letterSpacing: 0.5, marginBottom: 6,
      }}>
      + {label}
    </button>
  );

  const itemRow = (emojiOrIcon, name, subtitle, onClick) => (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
        padding: "10px 12px", marginBottom: 4, borderRadius: 8, cursor: "pointer",
        background: C.surface, transition: "background 0.15s",
      }}>
      <span style={{ fontSize: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{emojiOrIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13, fontFamily: FONT_DISPLAY, color: C.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      <Ic n="plus" s={16} c={C.accent}/>
    </button>
  );

  const title = view === "newRoutine" ? t("createNewRoutine")
    : view === "newIdea" ? t("createNewIdea")
    : t("addToToday");

  return (
    <BottomSheet open={open} onClose={onClose} title={title} maxHeight="80vh">
      {view === "picker" && (
        <div>
          {/* Routines */}
          {sectionHeader(t("addRoutine"))}
          {createBtn(t("createNewRoutine"), () => setView("newRoutine"))}

          {/* Ideas */}
          {sectionHeader(t("addIdea"))}
          {createBtn(t("createNewIdea"), () => setView("newIdea"))}

          {/* Goals & Habits */}
          {sectionHeader(t("addGoalOrHabit"))}
          {availableHabits.length === 0 && availableGoals.length === 0 && (
            <div style={{ textAlign: "center", padding: "12px 0", color: C.textMuted, fontSize: 12 }}>
              {t("noGoalsHabits")}
            </div>
          )}
          {availableHabits.map(h => (
            itemRow(h.emoji || <Ic n="check" s={16}/>, h.name, h.frequency, () => handleAddGoalHabit(h.id))
          ))}
          {availableGoals.map(g => (
            itemRow(<Ic n="target" s={16}/>, g.title, g.byWhen ? `by ${g.byWhen}` : "", () => handleAddGoalHabit(g.id))
          ))}
        </div>
      )}

      {view === "newRoutine" && (
        <RoutineForm
          onSave={handleCreateRoutine}
          onCancel={() => setView("picker")}
        />
      )}

      {view === "newIdea" && (
        <IdeaForm
          onSave={handleCreateIdea}
          onCancel={() => setView("picker")}
        />
      )}
    </BottomSheet>
  );
};
