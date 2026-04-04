import React, { useState, useMemo } from 'react';
import { WeeklyReportCard } from './WeeklyReportCard';
import { WeekStrip } from './WeekStrip';
import { HomeTile } from './HomeTile';
import { HomeAddPicker } from './HomeAddPicker';
import { HomeCardsContainer } from './HomeCardsContainer';
import { PreSessionIntel } from './PreSessionIntel';
import { RoutineForm } from './RoutineForm';
import { IdeaForm } from './IdeaForm';
import { BottomSheet } from '../shared/BottomSheet';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';

function getTilesForDate(homeStack, selectedDate) {
  if (!homeStack) return [];
  const dow = new Date(selectedDate + "T12:00:00").getDay();
  const overrides = homeStack.overrides?.[selectedDate] || {};
  const removed = overrides.removed || [];

  // Filter defaultStack by repeat rule and remove overridden
  const base = (homeStack.defaultStack || []).filter(tile => {
    if (removed.includes(tile.id)) return false;
    // Ideas have no repeat — always show
    if (tile.type === 'idea' || tile.type === 'goalhabit') return true;
    // Routines: check repeat
    const r = tile.repeat || { type: "daily", days: [] };
    if (r.type === "daily") return true;
    if (r.type === "workdays") return dow >= 1 && dow <= 5;
    if (r.type === "specificDays") return (r.days || []).includes(dow);
    if (r.type === "none") return false;
    return true;
  });

  // Add day-specific additions
  const added = overrides.added || [];
  return [...base, ...added];
}

export const HomePage = ({
  habits, setHabits, moves, reps, sparring, musicflow,
  calendar, cats, catColors, reports, setReports,
  injuries, setInjuries, presession, setPresession,
  ideas, reminders, battleprep, settings, onSettingsChange, onNavigate,
  homeStack, setHomeStack, homeIdeas, setHomeIdeas, homeChecks, setHomeChecks,
}) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [editTile, setEditTile] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const todayTiles = useMemo(
    () => getTilesForDate(homeStack, selectedDate),
    [homeStack, selectedDate]
  );

  const dayChecks = homeChecks?.[selectedDate] || {};
  const isToday = selectedDate === todayStr;

  // Format date as "Month Year" localized
  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const lang = settings?.language || "en";
    const month = d.toLocaleString(lang, { month: "long" });
    return `${month.toUpperCase()} ${d.getFullYear()}`;
  }, [selectedDate, settings?.language]);

  const isBreakingDay = isToday && todayTiles.some(tile =>
    tile.type === 'routine' && (/break/i.test(tile.name))
  );
  const weeklyReportPinned = settings?.homeCards?.some(c => c.id === "weeklyReport" && c.visible);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTileCheck = (tile) => {
    const tileId = tile.id;
    const wasChecked = !!dayChecks[tileId];

    // Update homeChecks
    setHomeChecks(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      if (wasChecked) { delete day[tileId]; } else { day[tileId] = true; }
      return { ...prev, [selectedDate]: day };
    });

    // For goalhabit habits, also toggle habit checkIns
    if (tile.type === 'goalhabit' && tile.refId) {
      const habit = habits?.find(h => String(h.id) === String(tile.refId));
      if (habit) {
        setHabits(prev => prev.map(h => {
          if (String(h.id) !== String(tile.refId)) return h;
          const checks = h.checkIns || [];
          if (wasChecked) {
            return { ...h, checkIns: checks.filter(d => d !== selectedDate) };
          } else {
            return { ...h, checkIns: [...checks, selectedDate] };
          }
        }));
      }
    }
  };

  const handleTileRemove = (tile) => {
    setConfirmRemove(tile);
  };

  const doRemove = (mode) => {
    const tile = confirmRemove;
    if (!tile) return;

    if (mode === "justToday") {
      // Add to today's removed override
      setHomeStack(prev => {
        const overrides = { ...(prev.overrides || {}) };
        const dayOvr = { ...(overrides[selectedDate] || {}) };
        dayOvr.removed = [...(dayOvr.removed || []), tile.id];
        overrides[selectedDate] = dayOvr;
        return { ...prev, overrides };
      });
    } else {
      // Remove from defaultStack entirely
      setHomeStack(prev => ({
        ...prev,
        defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
      }));

      // If idea, also remove from homeIdeas
      if (tile.type === 'idea') {
        setHomeIdeas(prev => prev.filter(i => i.id !== tile.id));
      }
    }
    setConfirmRemove(null);
  };

  const handleTileEdit = (tile) => {
    if (tile.type === 'routine' || tile.type === 'idea') {
      setEditTile(tile);
    }
  };

  const handleEditSave = (fields) => {
    if (!editTile) return;
    if (editTile.type === 'routine') {
      setHomeStack(prev => ({
        ...prev,
        defaultStack: prev.defaultStack.map(t =>
          t.id === editTile.id ? { ...t, ...fields } : t
        ),
      }));
    } else if (editTile.type === 'idea') {
      setHomeIdeas(prev => prev.map(i =>
        i.id === editTile.id ? { ...i, ...fields } : i
      ));
    }
    setEditTile(null);
  };

  const handleResetDay = () => {
    setHomeStack(prev => {
      const overrides = { ...(prev.overrides || {}) };
      delete overrides[selectedDate];
      return { ...prev, overrides };
    });
    setHomeChecks(prev => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setShowGearMenu(false);
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.textMuted, fontFamily: FONT_DISPLAY }}>
          {dateLabel}
        </span>
        <button onClick={() => setShowGearMenu(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: C.textMuted }}>
          <Ic n="cog" s={16} c={C.textMuted}/>
        </button>
      </div>

      {/* Week strip */}
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate}/>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 76 }}>
        {/* Weekly Report (auto-dismiss version) */}
        {!weeklyReportPinned && (
          <WeeklyReportCard moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
            calendar={calendar} cats={cats} catColors={catColors} reports={reports} setReports={setReports}/>
        )}

        {/* Pre-session intelligence */}
        {isBreakingDay && presession && (
          <PreSessionIntel presession={presession} setPresession={setPresession}/>
        )}

        {/* Tile stack */}
        <div style={{ padding: "6px 12px" }}>
          {todayTiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌅</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT_DISPLAY, marginBottom: 6, textTransform: "uppercase" }}>
                {t("dayStartsHere")}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>{t("dayStartsHereHint")}</div>
            </div>
          )}

          {todayTiles.map(tile => (
            <HomeTile key={tile.id} tile={tile}
              isChecked={!!dayChecks[tile.id]}
              onCheck={handleTileCheck}
              onRemove={handleTileRemove}
              onEdit={handleTileEdit}
              habits={habits} ideas={ideas} homeIdeas={homeIdeas}
            />
          ))}

          {/* Add to today button */}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowAddPicker(true)}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10, cursor: "pointer",
                background: "transparent", border: `1.5px dashed ${C.border}`,
                color: C.accent, fontSize: 13, fontWeight: 800, fontFamily: FONT_DISPLAY,
                letterSpacing: 0.5, transition: "all 0.15s",
              }}>
              {t("addToToday")}
            </button>
          </div>
        </div>

        {/* HOME cards (simplified) */}
        <HomeCardsContainer
          moves={moves} reps={reps} sparring={sparring} musicflow={musicflow}
          calendar={calendar} cats={cats} catColors={catColors}
          injuries={injuries} setInjuries={setInjuries}
          battleprep={battleprep} reminders={reminders} ideas={ideas}
          reports={reports} setReports={setReports}
          settings={settings} onSettingsChange={onSettingsChange} onNavigate={onNavigate}
        />
      </div>

      {/* Add Picker */}
      <HomeAddPicker open={showAddPicker} onClose={() => setShowAddPicker(false)}
        homeStack={homeStack} setHomeStack={setHomeStack}
        homeIdeas={homeIdeas} setHomeIdeas={setHomeIdeas}
        habits={habits} ideas={ideas} selectedDate={selectedDate}
      />

      {/* Gear Menu */}
      <BottomSheet open={showGearMenu} onClose={() => setShowGearMenu(false)} title={t("home")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: "list", label: t("manageRoutines"), action: () => { /* future */ setShowGearMenu(false); } },
            { icon: "rotateCcw", label: t("resetToDefault") || "Reset today", action: handleResetDay },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 12px", borderRadius: 10, cursor: "pointer",
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.text, fontSize: 13, fontWeight: 700, fontFamily: FONT_DISPLAY,
                textAlign: "left", letterSpacing: 0.3,
              }}>
              <Ic n={item.icon} s={16} c={C.textMuted}/>
              {item.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Remove confirmation */}
      {confirmRemove && (
        <Modal title={t("confirm")} onClose={() => setConfirmRemove(null)}>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            {confirmRemove.type === 'goalhabit'
              ? t("removeFromHome")
              : confirmRemove.type === 'routine'
              ? confirmRemove.name || t("editRoutine")
              : homeIdeas?.find(i => i.id === confirmRemove.id)?.title || homeIdeas?.find(i => i.id === confirmRemove.id)?.text?.slice(0, 40) || t("editIdea")}
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            {confirmRemove.type === 'routine' && confirmRemove.repeat?.type !== 'none' && (
              <Btn variant="secondary" onClick={() => doRemove("justToday")}>{t("justToday")}</Btn>
            )}
            <Btn variant="primary" onClick={() => doRemove("allDays")}>
              {confirmRemove.type === 'goalhabit' ? t("removeFromHome") : t("deletePermanently")}
            </Btn>
            <Btn variant="secondary" onClick={() => setConfirmRemove(null)}>{t("cancel")}</Btn>
          </div>
        </Modal>
      )}

      {/* Edit tile */}
      {editTile && editTile.type === 'routine' && (
        <BottomSheet open={true} onClose={() => setEditTile(null)} title={t("editRoutine")}>
          <RoutineForm routine={editTile} onSave={handleEditSave} onCancel={() => setEditTile(null)}/>
        </BottomSheet>
      )}
      {editTile && editTile.type === 'idea' && (
        <BottomSheet open={true} onClose={() => setEditTile(null)} title={t("editIdea")}>
          <IdeaForm idea={homeIdeas?.find(i => i.id === editTile.id)} onSave={handleEditSave} onCancel={() => setEditTile(null)}/>
        </BottomSheet>
      )}
    </div>
  );
};
