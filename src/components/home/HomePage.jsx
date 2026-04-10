import React, { useState, useMemo } from 'react';
import { WeekStrip } from './WeekStrip';
import { HomeTile } from './HomeTile';
import { HomeAddPicker } from './HomeAddPicker';
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

  const base = (homeStack.defaultStack || []).filter(tile => {
    if (removed.includes(tile.id)) return false;
    if (tile.type === 'idea' || tile.type === 'goalhabit') return true;
    const r = tile.repeat || { type: "daily", days: [] };
    if (r.type === "daily") return true;
    if (r.type === "workdays") return dow >= 1 && dow <= 5;
    if (r.type === "specificDays") return (r.days || []).includes(dow);
    if (r.type === "none") return false;
    return true;
  });

  const added = overrides.added || [];
  return [...base, ...added];
}

// Resolve a tile's display name for confirmations
function resolveTileName(tile, homeIdeas, habits, ideas) {
  if (tile.type === 'routine') return tile.name || "";
  if (tile.type === 'idea') {
    const idea = homeIdeas?.find(i => i.id === tile.id);
    return idea?.title || idea?.text?.slice(0, 60) || "";
  }
  if (tile.type === 'goalhabit') {
    const habit = habits?.find(h => String(h.id) === String(tile.refId));
    if (habit) return habit.name || "";
    const goal = ideas?.find(i => String(i.id) === String(tile.refId));
    return goal?.title || "";
  }
  return "";
}

export const HomePage = ({
  habits, setHabits,
  injuries, setInjuries, presession, setPresession,
  ideas, setIdeas, settings, onSettingsChange,
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

  // Feature 2: edit scope
  const [pendingEdit, setPendingEdit] = useState(null);

  // Feature 3: reorder
  const [showReorder, setShowReorder] = useState(false);

  // Feature 4: manage routines + reset confirm
  const [showManageRoutines, setShowManageRoutines] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const todayTiles = useMemo(
    () => getTilesForDate(homeStack, selectedDate),
    [homeStack, selectedDate]
  );

  const dayChecks = homeChecks?.[selectedDate] || {};
  const isToday = selectedDate === todayStr;

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const lang = settings?.language || "en";
    const month = d.toLocaleString(lang, { month: "long" });
    return `${month.toUpperCase()} ${d.getFullYear()}`;
  }, [selectedDate, settings?.language]);

  const isBreakingDay = isToday && todayTiles.some(tile =>
    tile.type === 'routine' && (/break/i.test(tile.name))
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTileCheck = (tile) => {
    const tileId = tile.id;
    const wasChecked = !!dayChecks[tileId];

    setHomeChecks(prev => {
      const day = { ...(prev[selectedDate] || {}) };
      if (wasChecked) { delete day[tileId]; } else { day[tileId] = true; }
      return { ...prev, [selectedDate]: day };
    });

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

  // ── Feature 1: Smart remove ──────────────────────────────────────────────

  const doRemove = (mode) => {
    const tile = confirmRemove;
    if (!tile) return;

    if (mode === "justToday") {
      setHomeStack(prev => {
        const overrides = { ...(prev.overrides || {}) };
        const dayOvr = { ...(overrides[selectedDate] || {}) };
        dayOvr.removed = [...(dayOvr.removed || []), tile.id];
        overrides[selectedDate] = dayOvr;
        return { ...prev, overrides };
      });
    } else if (mode === "deleteEntirely") {
      // Remove tile from HOME
      setHomeStack(prev => ({
        ...prev,
        defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
      }));
      // Delete underlying data
      if (tile.refId) {
        const isHabit = habits?.some(h => String(h.id) === String(tile.refId));
        if (isHabit) {
          setHabits(prev => prev.filter(h => String(h.id) !== String(tile.refId)));
        } else if (setIdeas) {
          setIdeas(prev => prev.filter(i => String(i.id) !== String(tile.refId)));
        }
      }
    } else {
      // "allDays" — remove from defaultStack permanently
      setHomeStack(prev => ({
        ...prev,
        defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
      }));
      if (tile.type === 'idea') {
        setHomeIdeas(prev => prev.filter(i => i.id !== tile.id));
      }
    }
    setConfirmRemove(null);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleTileEdit = (tile) => {
    // Orphan goalhabit: referenced item was deleted — auto-remove
    if (tile.type === 'goalhabit') {
      const habit = habits?.find(h => String(h.id) === String(tile.refId));
      const goal = ideas?.find(i => String(i.id) === String(tile.refId));
      if (!habit && !goal) {
        setHomeStack(prev => ({
          ...prev,
          defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
        }));
        return;
      }
    }
    if (tile.type === 'routine' || tile.type === 'idea') {
      setEditTile(tile);
    }
  };

  // Feature 2: intercept save for recurring routines
  const handleEditSave = (fields) => {
    if (!editTile) return;

    if (editTile.type === 'routine') {
      const isRecurring = editTile.repeat && editTile.repeat.type !== 'none';
      // Check if tile is from overrides.added (not defaultStack)
      const isOverrideTile = !(homeStack.defaultStack || []).some(t => t.id === editTile.id);

      if (isRecurring && !isOverrideTile) {
        // Stash for scope prompt
        setPendingEdit({ tile: editTile, fields });
        setEditTile(null);
        return;
      }

      if (isOverrideTile) {
        // Save directly to override
        setHomeStack(prev => {
          const overrides = { ...(prev.overrides || {}) };
          const dayOvr = { ...(overrides[selectedDate] || {}) };
          dayOvr.added = (dayOvr.added || []).map(t =>
            t.id === editTile.id ? { ...t, ...fields } : t
          );
          overrides[selectedDate] = dayOvr;
          return { ...prev, overrides };
        });
      } else {
        // Non-recurring or direct save
        setHomeStack(prev => ({
          ...prev,
          defaultStack: prev.defaultStack.map(t =>
            t.id === editTile.id ? { ...t, ...fields } : t
          ),
        }));
      }
    } else if (editTile.type === 'idea') {
      setHomeIdeas(prev => prev.map(i =>
        i.id === editTile.id ? { ...i, ...fields } : i
      ));
    }
    setEditTile(null);
  };

  // Feature 2: scope handlers
  const handleEditScopeJustToday = () => {
    if (!pendingEdit) return;
    const { tile, fields } = pendingEdit;
    setHomeStack(prev => {
      const overrides = { ...(prev.overrides || {}) };
      const dayOvr = { ...(overrides[selectedDate] || {}) };
      dayOvr.removed = [...(dayOvr.removed || []), tile.id];
      dayOvr.added = [...(dayOvr.added || []), { ...tile, ...fields, id: tile.id + '_ovr_' + selectedDate }];
      overrides[selectedDate] = dayOvr;
      return { ...prev, overrides };
    });
    setPendingEdit(null);
  };

  const handleEditScopeAllDays = () => {
    if (!pendingEdit) return;
    const { tile, fields } = pendingEdit;
    setHomeStack(prev => ({
      ...prev,
      defaultStack: prev.defaultStack.map(t =>
        t.id === tile.id ? { ...t, ...fields } : t
      ),
    }));
    setPendingEdit(null);
  };

  // ── Feature 4: Reset today with confirm ──────────────────────────────────

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
    setShowResetConfirm(false);
    setShowGearMenu(false);
  };

  // ── Feature 3: Reorder handlers ─────────────────────────────────────────

  const moveTileUp = (idx) => {
    if (idx === 0) return;
    setHomeStack(prev => {
      const arr = [...(prev.defaultStack || [])];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return { ...prev, defaultStack: arr };
    });
  };

  const moveTileDown = (idx) => {
    const stack = homeStack.defaultStack || [];
    if (idx >= stack.length - 1) return;
    setHomeStack(prev => {
      const arr = [...(prev.defaultStack || [])];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...prev, defaultStack: arr };
    });
  };

  // Helper: resolve emoji + fallback icon for reorder/manage rows
  const resolveEmoji = (tile) => {
    if (tile.type === 'routine') return { emoji: tile.emoji || null, icon: "dumbbell" };
    if (tile.type === 'idea') {
      const idea = homeIdeas?.find(i => i.id === tile.id);
      return { emoji: idea?.emoji || null, icon: "bulb" };
    }
    if (tile.type === 'goalhabit') {
      const habit = habits?.find(h => String(h.id) === String(tile.refId));
      return { emoji: habit?.emoji || null, icon: "target" };
    }
    return { emoji: null, icon: "clipboard" };
  };

  // Helper: resolve name for reorder/manage rows
  const resolveName = (tile) => resolveTileName(tile, homeIdeas, habits, ideas);

  // All routines from defaultStack (for manage routines)
  const allRoutines = (homeStack.defaultStack || []).filter(t => t.type === 'routine');

  // Repeat label helper
  const repeatLabel = (tile) => {
    const r = tile.repeat || { type: "daily" };
    if (r.type === "daily") return t("repeatEveryDay");
    if (r.type === "workdays") return t("repeatWorkdays");
    if (r.type === "specificDays") return t("repeatSpecificDays");
    if (r.type === "none") return t("repeatNone");
    return "";
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: C.textMuted, fontFamily: FONT_DISPLAY }}>
          {dateLabel}
        </span>
        <button onClick={() => setShowGearMenu(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: C.textMuted }}>
          <Ic n="moreH" s={16} c={C.textMuted}/>
        </button>
      </div>

      {/* Week strip */}
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate}/>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 76 }}>
        {/* Pre-session intelligence */}
        {isBreakingDay && presession && (
          <PreSessionIntel presession={presession} setPresession={setPresession}/>
        )}

        {/* Tile stack */}
        <div style={{ padding: "6px 12px" }}>
          {todayTiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted }}>
              <div style={{ marginBottom: 10 }}><Ic n="sun" s={32} c={C.textMuted}/></div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT_DISPLAY, marginBottom: 6, textTransform: "uppercase" }}>
                {t("dayStartsHere")}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{t("dayStartsHereHint")}</div>
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
      </div>

      {/* Add Picker */}
      <HomeAddPicker open={showAddPicker} onClose={() => setShowAddPicker(false)}
        homeStack={homeStack} setHomeStack={setHomeStack}
        homeIdeas={homeIdeas} setHomeIdeas={setHomeIdeas}
        habits={habits} ideas={ideas} selectedDate={selectedDate}
      />

      {/* ── Feature 4: Gear Menu ── */}
      <BottomSheet open={showGearMenu} onClose={() => setShowGearMenu(false)} title={t("home")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: "grip", label: t("reorderTiles"), action: () => { setShowGearMenu(false); setShowReorder(true); } },
            { icon: "list", label: t("manageRoutines"), action: () => { setShowGearMenu(false); setShowManageRoutines(true); } },
            { icon: "refresh", label: t("resetToDefault") || "Reset today", action: () => { setShowGearMenu(false); setShowResetConfirm(true); } },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 12px", borderRadius: 8, cursor: "pointer",
                background: C.surface, border: "none",
                color: C.text, fontSize: 13, fontWeight: 700, fontFamily: FONT_DISPLAY,
                textAlign: "left", letterSpacing: 0.3,
              }}>
              <Ic n={item.icon} s={16} c={C.textMuted}/>
              {item.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ── Feature 4: Reset today confirmation ── */}
      {showResetConfirm && (
        <Modal title={t("confirm")} onClose={() => setShowResetConfirm(false)}>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            {t("resetDayConfirm")}
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            <Btn variant="primary" onClick={handleResetDay}>{t("resetToDefault")}</Btn>
            <Btn variant="secondary" onClick={() => setShowResetConfirm(false)}>{t("cancel")}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Feature 4: Manage Routines ── */}
      <BottomSheet open={showManageRoutines} onClose={() => setShowManageRoutines(false)} title={t("manageRoutines")}>
        {allRoutines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMuted, fontSize: 13 }}>
            {t("noRoutinesAvailable")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {allRoutines.map(tile => (
              <div key={tile.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, background: C.surface,
              }}>
                {tile.emoji ? <span style={{ fontSize: 18, flexShrink: 0 }}>{tile.emoji}</span> : <Ic n="dumbbell" s={18}/>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, fontFamily: FONT_DISPLAY, color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tile.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, marginTop: 2,
                    textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {repeatLabel(tile)}
                  </div>
                </div>
                <button onClick={() => { setShowManageRoutines(false); setEditTile(tile); }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                    background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="edit" s={14} c={C.textMuted}/>
                </button>
                <button onClick={() => { setShowManageRoutines(false); setConfirmRemove(tile); }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                    background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="trash" s={14} c={C.accent}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* ── Feature 3: Reorder Tiles ── */}
      <BottomSheet open={showReorder} onClose={() => setShowReorder(false)} title={t("reorderTiles")}>
        {(homeStack.defaultStack || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMuted, fontSize: 13 }}>
            {t("dayStartsHereHint")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(homeStack.defaultStack || []).map((tile, idx) => (
              <div key={tile.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, background: C.surface,
              }}>
                {(() => { const { emoji, icon } = resolveEmoji(tile); return emoji ? <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span> : <Ic n={icon} s={18}/>; })()}
                <div style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 13, fontFamily: FONT_DISPLAY,
                  color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {resolveName(tile)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveTileUp(idx)} disabled={idx === 0}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`,
                      background: C.bg, cursor: idx === 0 ? "default" : "pointer",
                      color: idx === 0 ? C.border : C.accent,
                      fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>▲</button>
                  <button onClick={() => moveTileDown(idx)} disabled={idx === (homeStack.defaultStack || []).length - 1}
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`,
                      background: C.bg, cursor: idx === (homeStack.defaultStack || []).length - 1 ? "default" : "pointer",
                      color: idx === (homeStack.defaultStack || []).length - 1 ? C.border : C.accent,
                      fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>▼</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* ── Feature 1: Smart remove confirmation ── */}
      {confirmRemove && (
        <Modal title={t("confirm")} onClose={() => setConfirmRemove(null)}>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: C.text }}>
              {resolveTileName(confirmRemove, homeIdeas, habits, ideas)}
            </span>
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            {/* Recurring routine: Just today + All days */}
            {confirmRemove.type === 'routine' && confirmRemove.repeat?.type !== 'none' && (<>
              <Btn variant="secondary" onClick={() => doRemove("justToday")}>{t("justToday")}</Btn>
              <Btn variant="primary" onClick={() => doRemove("allDays")}>{t("deletePermanently")}</Btn>
            </>)}

            {/* Non-recurring routine: Delete permanently only */}
            {confirmRemove.type === 'routine' && (confirmRemove.repeat?.type === 'none' || !confirmRemove.repeat) && (
              <Btn variant="primary" onClick={() => doRemove("allDays")}>{t("deletePermanently")}</Btn>
            )}

            {/* Idea: Just today + Delete permanently */}
            {confirmRemove.type === 'idea' && (<>
              <Btn variant="secondary" onClick={() => doRemove("justToday")}>{t("justToday")}</Btn>
              <Btn variant="primary" onClick={() => doRemove("allDays")}>{t("deletePermanently")}</Btn>
            </>)}

            {/* Goal/Habit: Remove from HOME + Delete entirely */}
            {confirmRemove.type === 'goalhabit' && (<>
              <Btn variant="secondary" onClick={() => doRemove("allDays")}>{t("removeFromHome")}</Btn>
              <Btn variant="primary" onClick={() => doRemove("deleteEntirely")}>{t("deleteEntirely")}</Btn>
            </>)}

            <Btn variant="secondary" onClick={() => setConfirmRemove(null)}>{t("cancel")}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Feature 2: Edit scope modal ── */}
      {pendingEdit && (
        <Modal title={t("applyChanges")} onClose={() => setPendingEdit(null)}>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: C.text }}>{pendingEdit.tile.name}</span>
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            <Btn variant="secondary" onClick={handleEditScopeJustToday}>{t("justToday")}</Btn>
            <Btn variant="primary" onClick={handleEditScopeAllDays}>{t("allDays")}</Btn>
            <Btn variant="secondary" onClick={() => setPendingEdit(null)}>{t("cancel")}</Btn>
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
