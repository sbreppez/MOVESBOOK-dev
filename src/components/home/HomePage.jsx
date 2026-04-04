import React, { useState, useMemo } from 'react';
import { HabitsPage } from '../train/HabitsPage';
import { WeeklyReportCard } from './WeeklyReportCard';
import { WeekStrip } from './WeekStrip';
import { BlockCard } from './BlockCard';
import { BlockModal } from './BlockModal';
import { BlockLibrary } from './BlockLibrary';
import { BlockPicker } from './BlockPicker';
import { HomeCardsContainer } from './HomeCardsContainer';
import { PreSessionIntel } from './PreSessionIntel';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { Modal } from '../shared/Modal';

const TOD_ORDER = { morning:0, midday:1, afternoon:2, evening:3 };
const TOD_KEYS = ["morning","midday","afternoon","evening"];
const TOD_LABELS = { morning:"todMorning", midday:"todMidday", afternoon:"todAfternoon", evening:"todEvening" };

function getBlocksForDate(blocks, schedule, dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const daySched = schedule[dateStr] || {};
  const hidden = daySched.hidden || [];
  const added = daySched.added || [];

  const repeating = blocks.filter(b => {
    if (hidden.includes(b.id)) return false;
    const r = b.repeat || { type:"daily", days:[] };
    if (r.type === "daily") return true;
    if (r.type === "workdays") return dow >= 1 && dow <= 5;
    if (r.type === "specificDays") return (r.days || []).includes(dow);
    return false;
  });

  const addedBlocks = blocks.filter(b =>
    added.includes(b.id) && !repeating.find(r => r.id === b.id) && !hidden.includes(b.id)
  );

  return [...repeating, ...addedBlocks].sort((a, b) =>
    (TOD_ORDER[a.timeOfDay] || 0) - (TOD_ORDER[b.timeOfDay] || 0)
  );
}

export const HomePage = ({
  habits, setHabits, onAddTrigger, moves, reps, sparring, musicflow,
  calendar, cats, catColors, reports, setReports,
  blocks, setBlocks, schedule, setSchedule, onOpenBlockLibrary,
  injuries, setInjuries, presession, setPresession,
  ideas, reminders, battleprep, settings, onSettingsChange, onNavigate,
}) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const dayBlocks = useMemo(
    () => getBlocksForDate(blocks, schedule, selectedDate),
    [blocks, schedule, selectedDate]
  );

  const daySched = schedule[selectedDate] || {};
  const checked = daySched.checked || [];
  const hasOverrides = (daySched.hidden?.length > 0) || (daySched.added?.length > 0);

  const updateDaySched = (dateStr, updater) => {
    setSchedule(prev => {
      const current = prev[dateStr] || {};
      const updated = updater(current);
      return { ...prev, [dateStr]: updated };
    });
  };

  const handleCheck = (blockId) => {
    updateDaySched(selectedDate, s => {
      const arr = s.checked || [];
      const isChecked = arr.includes(blockId);
      return { ...s, checked: isChecked ? arr.filter(id => id !== blockId) : [...arr, blockId] };
    });
  };

  const handleDismiss = (blockId) => {
    updateDaySched(selectedDate, s => ({
      ...s,
      hidden: [...(s.hidden || []), blockId],
      added: (s.added || []).filter(id => id !== blockId),
    }));
  };

  const handleAddForDay = (blockId) => {
    updateDaySched(selectedDate, s => ({
      ...s,
      added: [...(s.added || []), blockId],
    }));
  };

  const handleResetDay = () => {
    setSchedule(prev => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setConfirmReset(false);
  };

  const handleBlockEdit = (fields) => {
    if (editBlock) {
      setBlocks(prev => prev.map(b => b.id === editBlock.id ? { ...b, ...fields } : b));
    }
  };

  const handleBlockDelete = () => {
    if (editBlock) {
      setBlocks(prev => prev.filter(b => b.id !== editBlock.id));
    }
  };

  const scheduledIds = dayBlocks.map(b => b.id);

  // Group blocks by time of day
  const grouped = {};
  TOD_KEYS.forEach(tod => { grouped[tod] = []; });
  dayBlocks.forEach(b => {
    const tod = b.timeOfDay || "morning";
    if (grouped[tod]) grouped[tod].push(b);
    else grouped.morning.push(b);
  });

  const isToday = selectedDate === todayStr;
  const isBreakingDay = isToday && dayBlocks.some(b => b.tag === "breaking" || /break/i.test(b.name));
  const weeklyReportPinned = settings?.homeCards?.some(c => c.id === "weeklyReport" && c.visible);

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Header row with gear */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 14px", flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY }}>
          {isToday ? t("today").toUpperCase() : selectedDate}
        </span>
        <button onClick={onOpenBlockLibrary || (() => setShowLibrary(true))}
          style={{ background:"none", border:"none", cursor:"pointer", padding:5, borderRadius:5, color:C.textMuted }}>
          <Ic n="cog" s={16} c={C.textMuted}/>
        </button>
      </div>

      {/* Week strip */}
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate}/>

      {/* Scrollable content */}
      <div style={{ flex:1, overflow:"auto", paddingBottom:76 }}>
        {/* Weekly Report (auto-dismiss version — hidden if pinned card is on) */}
        {!weeklyReportPinned && (
          <WeeklyReportCard moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
            calendar={calendar} cats={cats} catColors={catColors} reports={reports} setReports={setReports}/>
        )}

        {/* Pre-session intelligence — on breaking days only */}
        {isBreakingDay && presession && (
          <PreSessionIntel presession={presession} setPresession={setPresession}/>
        )}

        {/* Block schedule */}
        <div style={{ padding:"6px 12px" }}>
          {dayBlocks.length === 0 && (
            <div style={{ textAlign:"center", padding:"30px 20px", color:C.textMuted }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:13, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("noBlocksYet")}</div>
              <div style={{ fontSize:12, lineHeight:1.5 }}>{t("noBlocksHint")}</div>
            </div>
          )}

          {TOD_KEYS.map(tod => {
            const todBlocks = grouped[tod];
            if (!todBlocks || todBlocks.length === 0) return null;
            return (
              <div key={tod} style={{ marginBottom:8 }}>
                {/* Time of day header */}
                <div style={{
                  display:"flex", alignItems:"center", gap:8, padding:"8px 2px 4px",
                }}>
                  <span style={{
                    fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted,
                    fontFamily:FONT_DISPLAY,
                  }}>
                    {t(TOD_LABELS[tod])}
                  </span>
                  <div style={{ flex:1, height:1, background:C.borderLight }}/>
                </div>

                {/* Block cards */}
                {todBlocks.map(b => (
                  <BlockCard key={b.id} block={b}
                    isChecked={checked.includes(b.id)}
                    onCheck={() => handleCheck(b.id)}
                    onDismiss={() => handleDismiss(b.id)}
                    onEdit={() => setEditBlock(b)}/>
                ))}
              </div>
            );
          })}

          {/* Add block for today + Reset */}
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
            <button onClick={() => setShowPicker(true)}
              style={{
                width:"100%", padding:"12px 0", borderRadius:10, cursor:"pointer",
                background:"transparent", border:`1.5px dashed ${C.border}`,
                color:C.accent, fontSize:13, fontWeight:800, fontFamily:FONT_DISPLAY,
                letterSpacing:0.5, transition:"all 0.15s",
              }}>
              {t("addBlockForToday")}
            </button>

            {hasOverrides && (
              <button onClick={() => setConfirmReset(true)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:C.textMuted, fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                  letterSpacing:0.5, textAlign:"center", padding:6,
                }}>
                {t("resetToDefault")}
              </button>
            )}
          </div>
        </div>

        {/* HOME cards */}
        <HomeCardsContainer
          moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
          calendar={calendar} cats={cats} catColors={catColors}
          injuries={injuries} setInjuries={setInjuries}
          battleprep={battleprep} reminders={reminders} ideas={ideas}
          reports={reports} setReports={setReports}
          settings={settings} onSettingsChange={onSettingsChange} onNavigate={onNavigate}
        />

        {/* Habits section below */}
        <div style={{ borderTop:`1px solid ${C.borderLight}`, marginTop:12 }}>
          <HabitsPage onAddTrigger={onAddTrigger} habits={habits} setHabits={setHabits}/>
        </div>
      </div>

      {/* Block Library overlay (from gear in header) */}
      {showLibrary && (
        <BlockLibrary blocks={blocks} setBlocks={setBlocks} onClose={() => setShowLibrary(false)}/>
      )}

      {/* Block Picker bottom sheet */}
      {showPicker && (
        <BlockPicker blocks={blocks} scheduledIds={scheduledIds}
          onPick={handleAddForDay} onClose={() => setShowPicker(false)}/>
      )}

      {/* Edit block modal */}
      {editBlock && (
        <BlockModal block={editBlock} onClose={() => setEditBlock(null)}
          onSave={handleBlockEdit} onDelete={handleBlockDelete}/>
      )}

      {/* Reset confirm */}
      {confirmReset && (
        <Modal title={t("resetToDefault")} onClose={() => setConfirmReset(false)}>
          <p style={{ color:C.textSec, fontSize:13, lineHeight:1.6, marginBottom:16 }}>
            {t("resetDayConfirm")}
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Btn variant="secondary" onClick={() => setConfirmReset(false)}>{t("cancel")}</Btn>
            <Btn variant="primary" onClick={handleResetDay}>{t("confirm")}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
