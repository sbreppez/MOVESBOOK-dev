import React, { useState, useMemo } from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from './Ic';
import { BottomSheet } from './BottomSheet';
import { TypeChooserSheet } from '../train/TypeChooserSheet';
import { NoteModal } from '../train/NoteModal';
import { GoalModal } from '../train/GoalModal';
import { TargetGoalModal } from '../train/TargetGoalModal';
import { HabitModal } from '../train/HabitModal';
import { todayLocal } from '../../utils/dateUtils';

export const AddToHomeSheet = ({
  open, onClose, context,
  setIdeas, setHomeStack, setHabits,
  addCalendarEvent, battleprep, addToast,
}) => {
  const { C } = useSettings();
  const t = useT();
  const [showTypeChooser, setShowTypeChooser] = useState(false);
  const [modal, setModal] = useState(null);

  const nextTrainingDay = useMemo(() => {
    const today = todayLocal();
    const plans = battleprep?.plans || [];
    const activePlan = plans.find(p => {
      if (p?.archived) return false;
      const battles = p?.battles || [];
      return battles.some(b => b?.date >= today);
    });
    if (!activePlan?.dailyTasks) return "";
    const upcoming = Object.keys(activePlan.dailyTasks)
      .filter(d => d >= today)
      .sort();
    return upcoming[0] || "";
  }, [battleprep]);

  const closeAll = () => {
    setModal(null);
    setShowTypeChooser(false);
    onClose();
  };
  const cancelModal = () => {
    setModal(null);
    onClose();
  };

  const handleSaveNote = (fields) => {
    const id = Date.now().toString();
    setIdeas(prev => [{
      id, type: 'note', title: fields.title, text: fields.text,
      link: fields.link, showDate: fields.showDate || null,
      createdDate: new Date().toISOString(),
    }, ...prev]);
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [{ id, type: 'note' }, ...(prev.defaultStack || [])],
    }));
    if (fields.showDate && addCalendarEvent) {
      addCalendarEvent({
        date: fields.showDate, type: "journal",
        title: fields.title || "Note", text: fields.text || "",
        source: "home-idea", ideaId: id,
      }, { silent: true });
    }
    if (addToast) addToast({ icon: "home", title: t("addToHome") });
    closeAll();
  };

  const handleSaveGoalOrTarget = (data) => {
    const id = Date.now().toString();
    setIdeas(prev => [...prev, { id, ...data }]);
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [{ id: 'gh_' + id, type: 'goalhabit', refId: id }, ...(prev.defaultStack || [])],
    }));
    if (addToast) addToast({ icon: "home", title: t("addToHome") });
    closeAll();
  };

  const handleSaveHabit = (habitData) => {
    const id = Date.now().toString();
    setHabits(prev => [...prev, { id, ...habitData }]);
    setHomeStack(prev => ({
      ...prev,
      defaultStack: [{ id: 'gh_' + id, type: 'goalhabit', refId: id }, ...(prev.defaultStack || [])],
    }));
    if (addToast) addToast({ icon: "home", title: t("addToHome") });
    closeAll();
  };

  const tiles = [
    { type: 'note',  label: t("addToHomeAsNote"),  icon: "paperclip" },
    { type: 'goal',  label: t("addToHomeAsGoal"),  icon: "target"    },
    { type: 'habit', label: t("addToHomeAsHabit"), icon: "repeat"    },
  ];

  const tileBtn = {
    display: "flex", alignItems: "center", gap: 12, width: "100%",
    padding: "14px 16px", borderRadius: 8, cursor: "pointer",
    background: C.surfaceAlt, border: "none", textAlign: "left",
    fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 800,
    letterSpacing: 1.5, textTransform: "uppercase", color: C.text,
  };

  const sheetOpen = open && !modal && !showTypeChooser;

  return (
    <>
      <BottomSheet open={sheetOpen} onClose={onClose} title={t("addToHome")}>
        {context && (
          <div style={{
            fontSize: 13, color: C.textSec, fontStyle: "italic",
            padding: "4px 0 12px", lineHeight: 1.5,
          }}>
            {t("addToHomeContext")} {context}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tiles.map(tile => (
            <button key={tile.type} onClick={() => {
              if (tile.type === 'goal') setShowTypeChooser(true);
              else setModal(tile.type);
            }} style={tileBtn}>
              <Ic n={tile.icon} s={18} c={C.textSec}/>
              <span>{tile.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <TypeChooserSheet
        open={showTypeChooser}
        onClose={() => setShowTypeChooser(false)}
        onChoose={(type) => { setShowTypeChooser(false); setModal(type); }}
      />

      {(modal === 'note' || modal === 'goal' || modal === 'target') && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 10000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: 10,
        }}>
          {modal === 'note' && (
            <NoteModal
              prefill={{ title: context, showDate: nextTrainingDay }}
              onClose={cancelModal}
              onSave={handleSaveNote}
            />
          )}
          {modal === 'goal' && (
            <GoalModal
              prefill={{ title: context }}
              onClose={cancelModal}
              onSave={handleSaveGoalOrTarget}
            />
          )}
          {modal === 'target' && (
            <TargetGoalModal
              prefill={{ title: context }}
              onClose={cancelModal}
              onSave={handleSaveGoalOrTarget}
            />
          )}
        </div>
      )}

      {modal === 'habit' && (
        <HabitModal
          prefill={{ name: context }}
          onClose={cancelModal}
          onSave={handleSaveHabit}
        />
      )}
    </>
  );
};
