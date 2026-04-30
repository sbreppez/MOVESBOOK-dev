import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WeekStrip } from './WeekStrip';
import { HomeTile } from './HomeTile';
import { HomeAddPicker } from './HomeAddPicker';
import { PreSessionIntel } from './PreSessionIntel';
import { RoutineForm } from './RoutineForm';
import { IdeaForm } from './IdeaForm';
import { GoalModal } from '../train/GoalModal';
import { TargetGoalModal } from '../train/TargetGoalModal';
import { TypeChooserSheet } from '../train/TypeChooserSheet';
import { HabitModal } from '../train/HabitModal';
import { MoveModal } from '../moves/MoveModal';
import { BottomSheet } from '../shared/BottomSheet';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { Modal } from '../shared/Modal';
import { Btn } from '../shared/Btn';
import { SectionBrief } from '../shared/SectionBrief';
import { todayLocal } from '../../utils/dateUtils';

function getTilesForDate(homeStack, selectedDate, ideas) {
  if (!homeStack) return [];
  const dow = new Date(selectedDate + "T12:00:00").getDay();
  const overrides = homeStack.overrides?.[selectedDate] || {};
  const removed = overrides.removed || [];

  const base = (homeStack.defaultStack || []).filter(tile => {
    if (removed.includes(tile.id)) return false;
    if (tile.type === 'goalhabit') {
      const ref = ideas?.find(i => String(i.id) === String(tile.refId));
      if (ref?.archived) return false;
      return true;
    }
    if (tile.type === 'note') {
      const note = ideas?.find(i => i.id === tile.id);
      if (note?.archived) return false;
      if (note?.showDate && selectedDate < note.showDate) return false;
      return true;
    }
    if (tile.type === 'moveUpdate') return true;
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
function resolveTileName(tile, habits, ideas, moves) {
  if (tile.type === 'routine') return tile.name || "";
  if (tile.type === 'note') {
    const note = ideas?.find(i => i.id === tile.id);
    return note?.title || note?.text?.slice(0, 60) || "";
  }
  if (tile.type === 'goalhabit') {
    const habit = habits?.find(h => String(h.id) === String(tile.refId));
    if (habit) return habit.name || "";
    const goal = ideas?.find(i => String(i.id) === String(tile.refId));
    return goal?.title || "";
  }
  if (tile.type === 'moveUpdate') {
    const move = moves?.find(m => m.id === tile.moveId);
    return move?.name || "";
  }
  return "";
}

export const HomePage = ({
  habits, setHabits,
  injuries: _injuries, setInjuries: _setInjuries, presession, setPresession,
  ideas, setIdeas, settings, onSettingsChange: _onSettingsChange,
  homeStack, setHomeStack, homeChecks, setHomeChecks,
  onAddTrigger, addCalendarEvent, removeCalendarEvent, calendar,
  moves, setMoves, cats, catColors, customAttrs, setCustomAttrs, isPremium,
  addToast,
}) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = todayLocal();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [addFormType, setAddFormType] = useState(null);
  const [homeTypeChooser, setHomeTypeChooser] = useState(false);
  const [showMoveUpdatePicker, setShowMoveUpdatePicker] = useState(false);
  const [moveUpdateSearch, setMoveUpdateSearch] = useState("");

  // + button: open HomeAddPicker
  const lastAddTrigger = useRef(onAddTrigger);
  useEffect(() => {
    if (onAddTrigger === lastAddTrigger.current) return;
    lastAddTrigger.current = onAddTrigger;
    if (!onAddTrigger) return;
    setShowAddPicker(true);
  }, [onAddTrigger]);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [editTile, setEditTile] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [journalGoalTile, setJournalGoalTile] = useState(null);
  const [editMoveFromHome, setEditMoveFromHome] = useState(null);
  const [updatesMove, setUpdatesMove] = useState(null);
  const [newUpdateText, setNewUpdateText] = useState("");
  const updateTextareaRef = useRef(null);

  // Feature 2: edit scope
  const [pendingEdit, setPendingEdit] = useState(null);

  // Feature 3: reorder
  const [showReorder, setShowReorder] = useState(false);

  // Feature 5: bulk select + delete
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const toggleSelect = (tileId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(tileId)) next.delete(tileId);
      else next.add(tileId);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleSingleArchive = (tile) => {
    const archive = (id) => {
      setIdeas(prev => prev.map(i =>
        String(i.id) === String(id)
          ? { ...i, archived: true, archivedDate: new Date().toISOString() }
          : i
      ));
    };
    let archivedCount = 0;
    if (tile.type === 'note') {
      archive(tile.id);
      archivedCount = 1;
    } else if (tile.type === 'goalhabit') {
      const ref = ideas?.find(i => String(i.id) === String(tile.refId) && (i.type === 'goal' || i.type === 'target'));
      if (ref) {
        archive(tile.refId);
        archivedCount = 1;
      }
    }
    if (archivedCount > 0) {
      addToast?.({ icon: "archive", title: t("archivedFromHome") });
    }
  };

  const handleBulkArchive = () => {
    const tilesNow = sections.today.concat(sections.notes, sections.goals);
    const selected = tilesNow.filter(tile => selectedIds.has(tile.id));
    let archivable = 0;
    let skipped = 0;
    setIdeas(prev => {
      let next = prev;
      selected.forEach(tile => {
        if (tile.type === 'note') {
          next = next.map(i => String(i.id) === String(tile.id)
            ? { ...i, archived: true, archivedDate: new Date().toISOString() }
            : i);
          archivable++;
        } else if (tile.type === 'goalhabit') {
          const ref = prev.find(i => String(i.id) === String(tile.refId) && (i.type === 'goal' || i.type === 'target'));
          if (ref) {
            next = next.map(i => String(i.id) === String(tile.refId)
              ? { ...i, archived: true, archivedDate: new Date().toISOString() }
              : i);
            archivable++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      });
      return next;
    });
    exitSelectMode();
    if (archivable > 0 && skipped > 0) {
      addToast?.({ icon: "archive", title: t("archivedSomeOfSelected").replace("{n}", archivable).replace("{total}", archivable + skipped) });
    } else if (archivable > 0) {
      addToast?.({ icon: "archive", title: t("archivedItemsCount").replace("{n}", archivable) });
    }
  };

  // Feature 4: manage routines + reset confirm
  const [showManageRoutines, setShowManageRoutines] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sections = useMemo(() => {
    const tiles = getTilesForDate(homeStack, selectedDate, ideas);

    const today = [];
    const notes = [];
    const goals = [];

    tiles.forEach(tile => {
      if (tile.type === 'routine' || tile.type === 'moveUpdate') {
        today.push(tile);
        return;
      }
      if (tile.type === 'goalhabit') {
        const habit = habits?.find(h => String(h.id) === String(tile.refId));
        if (habit) today.push(tile);
        else goals.push(tile);
        return;
      }
      if (tile.type === 'note') {
        const note = ideas?.find(i => i.id === tile.id);
        if (note?.showDate === selectedDate) today.push(tile);
        else notes.push(tile);
        return;
      }
      today.push(tile);
    });

    notes.sort((a, b) => {
      const aN = ideas?.find(i => i.id === a.id);
      const bN = ideas?.find(i => i.id === b.id);
      const aPin = aN?.pinnedHome ? 1 : 0;
      const bPin = bN?.pinnedHome ? 1 : 0;
      return bPin - aPin;
    });

    return { today, notes, goals };
  }, [homeStack, selectedDate, ideas, habits]);

  const totalTiles = sections.today.length + sections.notes.length + sections.goals.length;

  // Filter + search state (L2)
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState(() => {
    try {
      const s = localStorage.getItem("mb_home_filter");
      if (s) {
        const p = JSON.parse(s);
        if (p && typeof p === "object") {
          return { today: p.today !== false, notes: p.notes !== false, goals: p.goals !== false };
        }
      }
    } catch {}
    return { today: true, notes: true, goals: true };
  });

  useEffect(() => {
    try { localStorage.setItem("mb_home_filter", JSON.stringify(sectionFilter)); } catch {}
  }, [sectionFilter]);

  const dayChecks = homeChecks?.[selectedDate] || {};
  const isToday = selectedDate === todayStr;

  // Reset search on date change (filter persists by design)
  useEffect(() => { setSearchOpen(false); setSearch(""); }, [selectedDate]);

  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const lang = settings?.language || "en";
    const month = d.toLocaleString(lang, { month: "long" });
    return `${month.toUpperCase()} ${d.getFullYear()}`;
  }, [selectedDate, settings?.language]);

  const isBreakingDay = isToday && sections.today.some(tile =>
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

  const handleStepCheck = (tile, stepId) => {
    // Compute new check state
    const day = { ...(homeChecks[selectedDate] || {}) };
    const tileChecks = typeof day[tile.id] === 'object' ? { ...day[tile.id] } : {};

    if (tileChecks[stepId]) {
      delete tileChecks[stepId];
    } else {
      tileChecks[stepId] = true;
    }

    day[tile.id] = Object.keys(tileChecks).length > 0 ? tileChecks : undefined;
    if (!day[tile.id]) delete day[tile.id];

    setHomeChecks(prev => ({ ...prev, [selectedDate]: day }));

    // Upsert calendar event for this routine + date
    const allSteps = tile.steps || [];
    const completedCount = allSteps.filter(s => tileChecks[s.id]).length;

    const existing = (calendar?.events || []).find(e =>
      e.source === "home-routine" && e.date === selectedDate && e.routineId === tile.id
    );
    if (existing) removeCalendarEvent(existing.id);

    if (completedCount > 0) {
      addCalendarEvent({
        date: selectedDate,
        type: "routine",
        title: tile.name,
        source: "home-routine",
        routineId: tile.id,
        stepsCompleted: completedCount,
        stepsTotal: allSteps.length,
      }, { silent: true });
    }
  };

  const handleTileRemove = (tile) => {
    setConfirmRemove(tile);
  };

  const handleTogglePinHome = (tile) => {
    if (tile.type === 'note') {
      setIdeas(prev => prev.map(i =>
        i.id === tile.id ? { ...i, pinnedHome: !i.pinnedHome, pinned: undefined } : i
      ));
    }
  };

  // ── Feature 1: Remove tile ──────────────────────────────────────────────

  const doRemove = () => {
    const tile = confirmRemove;
    if (!tile) return;

    setHomeStack(prev => ({
      ...prev,
      defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
    }));

    if (tile.type === 'goalhabit' && tile.refId) {
      const isHabit = habits?.some(h => String(h.id) === String(tile.refId));
      if (isHabit) {
        setHabits(prev => prev.filter(h => String(h.id) !== String(tile.refId)));
      } else if (setIdeas) {
        setIdeas(prev => prev.filter(i => String(i.id) !== String(tile.refId)));
      }
    } else if (tile.type === 'note') {
      setIdeas(prev => prev.filter(i => i.id !== tile.id));
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
    if (tile.type === 'moveUpdate') {
      const move = moves?.find(m => m.id === tile.moveId);
      if (move) {
        setEditMoveFromHome(move);
      } else {
        // Orphan — move was deleted, remove tile
        setHomeStack(prev => ({
          ...prev,
          defaultStack: prev.defaultStack.filter(t => t.id !== tile.id),
        }));
      }
      return;
    }
    if (tile.type === 'routine' || tile.type === 'note' || tile.type === 'goalhabit') {
      setEditTile(tile);
    }
  };

  const handleOpenJournal = (tile) => {
    const goal = ideas?.find(i => String(i.id) === String(tile.refId) && (i.type === 'goal' || i.type === 'target'));
    if (goal) setJournalGoalTile({ tile, goal });
  };

  const handleOpenUpdates = (tile) => {
    const move = moves?.find(m => m.id === tile.moveId);
    if (move) {
      setUpdatesMove(move);
      setNewUpdateText("");
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
    } else if (editTile.type === 'note') {
      const oldNote = ideas?.find(i => i.id === editTile.id);
      setIdeas(prev => prev.map(i =>
        i.id === editTile.id ? { ...i, ...fields } : i
      ));
      // TODO: sync updated fields to calendar event (setCalendar not available in HomePage)
      const oldDate = oldNote?.showDate;
      const newDate = fields.showDate;
      if (oldDate !== newDate && newDate && addCalendarEvent) {
        addCalendarEvent({
          date: newDate,
          type: "journal",
          title: fields.title || oldNote?.title || "Note",
          text: fields.text || "",
          source: "home-idea",
          ideaId: editTile.id,
        }, { silent: true });
      }
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

  const moveTileUp = (tileId) => {
    setHomeStack(prev => {
      const arr = [...(prev.defaultStack || [])];
      const idx = arr.findIndex(t => t.id === tileId);
      if (idx <= 0) return prev;
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return { ...prev, defaultStack: arr };
    });
  };

  const moveTileDown = (tileId) => {
    setHomeStack(prev => {
      const arr = [...(prev.defaultStack || [])];
      const idx = arr.findIndex(t => t.id === tileId);
      if (idx < 0 || idx >= arr.length - 1) return prev;
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...prev, defaultStack: arr };
    });
  };

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

  // ── Create handlers (from Add Picker tiles) ─────────────────────────────

  const handleCreateRoutine = (fields) => {
    const newTile = { id: Date.now().toString(), type: 'routine', ...fields };
    setHomeStack(prev => ({ ...prev, defaultStack: [newTile, ...prev.defaultStack] }));
    setAddFormType(null);
  };

  const handleCreateIdea = (fields) => {
    const id = Date.now().toString();
    setIdeas(prev => [{ id, type: 'note', title: fields.title, text: fields.text, link: fields.link, showDate: fields.showDate || null, createdDate: new Date().toISOString() }, ...prev]);
    setHomeStack(prev => ({ ...prev, defaultStack: [{ id, type: 'note' }, ...prev.defaultStack] }));
    if (fields.showDate && addCalendarEvent) {
      addCalendarEvent({
        date: fields.showDate,
        type: "journal",
        title: fields.title || "Note",
        text: fields.text || "",
        source: "home-idea",
        ideaId: id,
      }, { silent: true });
    }
    setAddFormType(null);
  };

  const handleCreateGoal = (goalData) => {
    const id = Date.now().toString();
    setIdeas(prev => [...prev, { id, ...goalData }]);
    setHomeStack(prev => ({ ...prev, defaultStack: [{ id: 'gh_' + id, type: 'goalhabit', refId: id }, ...prev.defaultStack] }));
    setAddFormType(null);
  };

  const handleCreateHabit = (habitData) => {
    const id = Date.now().toString();
    setHabits(prev => [...prev, { id, ...habitData }]);
    setHomeStack(prev => ({ ...prev, defaultStack: [{ id: 'gh_' + id, type: 'goalhabit', refId: id }, ...prev.defaultStack] }));
    setAddFormType(null);
  };

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: C.text, fontFamily: FONT_DISPLAY, textTransform: "uppercase" }}>
          {dateLabel}
        </span>
        <button onClick={() => setShowGearMenu(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: C.textMuted }}>
          <Ic n="moreH" s={16} c={C.textMuted}/>
        </button>
      </div>

      {/* Week strip */}
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate}/>
      <SectionBrief desc={t("homeBrief")} settings={settings}/>

      {/* Toolbar row — Filter+Search left, Select+Reorder right */}
      {totalTiles >= 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 16px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFilterOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
                color: (sectionFilter.today && sectionFilter.notes && sectionFilter.goals) ? C.textMuted : C.accent }}>
              <Ic n="filter" s={16}/>
            </button>
            <button onClick={() => { setSearchOpen(s => !s); if (searchOpen) setSearch(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
                color: searchOpen ? C.accent : C.textMuted }}>
              <Ic n="search" s={16}/>
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Select mode toggle */}
            {selectMode ? (
              <>
                {selectedIds.size > 0 && (
                  <button onClick={handleBulkArchive}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4 }}
                    aria-label={t("archive")}>
                    <Ic n="archive" s={16} c={C.textSec}/>
                  </button>
                )}
                {selectedIds.size > 0 && (
                  <button onClick={() => setConfirmBulkDelete(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Ic n="trash" s={16} c={C.accent}/>
                    <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{selectedIds.size}</span>
                  </button>
                )}
                <button onClick={exitSelectMode}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Ic n="x" s={16} c={C.textMuted}/>
                </button>
              </>
            ) : (
              <button onClick={() => setSelectMode(true)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
                  color: C.textMuted }}>
                <Ic n="checkCircle" s={16} c={C.textMuted}/>
              </button>
            )}
            {/* Reorder toggle — hide during select mode */}
            {!selectMode && totalTiles >= 2 && (
              <button onClick={() => setShowReorder(r => !r)}
                style={{
                  background: showReorder ? C.accent : "none",
                  border: "none", cursor: "pointer",
                  padding: "4px 8px", borderRadius: 5,
                  color: showReorder ? C.bg : C.textMuted,
                  fontSize: 13, fontWeight: 800,
                  fontFamily: FONT_DISPLAY, letterSpacing: 1,
                }}>
                {showReorder ? t("done") : "⇅"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search bar */}
      {searchOpen && totalTiles >= 1 && (
        <div style={{ padding: "6px 14px", background: C.surface, borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", background: C.bg,
            borderRadius: 7, padding: "5px 10px", gap: 6,
            border: `1px solid ${search ? C.accent : C.border}` }}>
            <Ic n="search" s={13} c={C.textMuted}/>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("search")}
              style={{ flex: 1, background: "none", border: "none", outline: "none",
                color: C.text, fontSize: 13, fontFamily: "inherit" }}/>
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: C.textMuted, padding: 0, display: "flex" }}>
                <Ic n="x" s={13}/>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 76 }}>
        {/* Pre-session intelligence */}
        {isBreakingDay && presession && (
          <PreSessionIntel presession={presession} setPresession={setPresession}/>
        )}

        {/* Tile stack — sectioned (TODAY / NOTES / GOALS) */}
        <div style={{ padding: "6px 12px" }}>
          {totalTiles === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMuted }}>
              <div style={{ marginBottom: 10 }}><Ic n="sun" s={32} c={C.textMuted}/></div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT_DISPLAY, marginBottom: 6, textTransform: "uppercase" }}>
                {t("dayStartsHere")}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{t("dayStartsHereHint")}</div>
            </div>
          )}

          {totalTiles > 0 && (() => {
            const q = search.toLowerCase().trim();
            const matches = (tile) => {
              if (!q) return true;
              const name = resolveTileName(tile, habits, ideas, moves).toLowerCase();
              return name.includes(q);
            };

            const visibleSections = [
              { key: 'today', label: t('sectionToday'), tiles: sectionFilter.today ? sections.today.filter(matches) : [] },
              { key: 'notes', label: t('sectionNotes'), tiles: sectionFilter.notes ? sections.notes.filter(matches) : [] },
              { key: 'goals', label: t('sectionGoals'), tiles: sectionFilter.goals ? sections.goals.filter(matches) : [] },
            ];

            const totalVisible = visibleSections.reduce((sum, s) => sum + s.tiles.length, 0);

            if (totalVisible === 0 && q) {
              return (
                <div style={{ textAlign: "center", padding: 30, color: C.textMuted }}>
                  <p style={{ fontSize: 13 }}>{t("noResultsFor")} &quot;{search}&quot;</p>
                </div>
              );
            }

            return visibleSections.map(sec => {
              if (sec.tiles.length === 0) return null;
              return (
                <div key={sec.key} style={{ marginBottom: 8 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, fontFamily: FONT_DISPLAY,
                    letterSpacing: 1.5, textTransform: "uppercase",
                    color: C.textMuted, padding: "8px 4px 4px",
                  }}>
                    {sec.label} · {sec.tiles.length}
                  </div>
                  {sec.tiles.map((tile, idx) => (
                    <div key={tile.id} style={{ position: "relative" }}>
                      {showReorder && (
                        <div style={{
                          position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                          zIndex: 10, display: "flex", flexDirection: "column", gap: 2,
                        }}>
                          <button onClick={() => moveTileUp(tile.id)} disabled={idx === 0}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              border: `1px solid ${C.border}`, background: C.bg,
                              cursor: idx === 0 ? "default" : "pointer",
                              color: idx === 0 ? C.border : C.accent,
                              fontSize: 14, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>▲</button>
                          <button onClick={() => moveTileDown(tile.id)} disabled={idx === sec.tiles.length - 1}
                            style={{
                              width: 26, height: 26, borderRadius: 6,
                              border: `1px solid ${C.border}`, background: C.bg,
                              cursor: idx === sec.tiles.length - 1 ? "default" : "pointer",
                              color: idx === sec.tiles.length - 1 ? C.border : C.accent,
                              fontSize: 14, fontWeight: 700,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>▼</button>
                        </div>
                      )}
                      <HomeTile tile={tile}
                        isChecked={tile.type === 'routine' && tile.steps?.length > 0 ? dayChecks[tile.id] : !!dayChecks[tile.id]}
                        onCheck={handleTileCheck}
                        onCheckStep={handleStepCheck}
                        onRemove={handleTileRemove}
                        onEdit={handleTileEdit}
                        onTogglePin={handleTogglePinHome}
                        onArchive={handleSingleArchive}
                        onOpenJournal={handleOpenJournal}
                        onOpenUpdates={handleOpenUpdates}
                        selectMode={selectMode}
                        isSelected={selectedIds.has(tile.id)}
                        onToggleSelect={() => toggleSelect(tile.id)}
                        habits={habits} ideas={ideas} moves={moves}
                      />
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Add Picker */}
      <HomeAddPicker open={showAddPicker} onClose={() => setShowAddPicker(false)}
        onAction={(type) => {
          if (type === "moveUpdate") setShowMoveUpdatePicker(true);
          else if (type === "goal") setHomeTypeChooser(true);
          else setAddFormType(type);
        }}
      />

      <TypeChooserSheet open={homeTypeChooser} onClose={() => setHomeTypeChooser(false)}
        onChoose={tp => { setHomeTypeChooser(false); setAddFormType(tp); }}/>

      {/* ── Create forms (opened from Add Picker tiles) ── */}
      {addFormType === "routine" && (
        <BottomSheet open onClose={() => setAddFormType(null)} title={t("createNewRoutine")}>
          <RoutineForm onSave={handleCreateRoutine} onCancel={() => setAddFormType(null)}/>
        </BottomSheet>
      )}
      {addFormType === "idea" && (
        <BottomSheet open onClose={() => setAddFormType(null)} title={t("addNoteTile")}>
          <IdeaForm onSave={handleCreateIdea} onCancel={() => setAddFormType(null)}/>
        </BottomSheet>
      )}
      {addFormType === "goal" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
          <GoalModal onClose={() => setAddFormType(null)} onSave={handleCreateGoal}/>
        </div>
      )}
      {addFormType === "target" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
          <TargetGoalModal moves={moves} onClose={() => setAddFormType(null)} onSave={handleCreateGoal}/>
        </div>
      )}
      {addFormType === "habit" && (
        <HabitModal onClose={() => setAddFormType(null)} onSave={handleCreateHabit}/>
      )}

      {/* Move Update picker */}
      <BottomSheet open={showMoveUpdatePicker} onClose={() => { setShowMoveUpdatePicker(false); setMoveUpdateSearch(""); }} title={t("pickAMove")}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", background: C.bg, borderRadius: 7, padding: "5px 10px", gap: 6, border: `1px solid ${moveUpdateSearch ? C.accent : C.border}` }}>
            <Ic n="search" s={13} c={C.textMuted}/>
            <input autoFocus value={moveUpdateSearch} onChange={e => setMoveUpdateSearch(e.target.value)} placeholder={t("searchMoves")}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, fontFamily: "inherit" }}/>
            {moveUpdateSearch && <button onClick={() => setMoveUpdateSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0, display: "flex" }}><Ic n="x" s={13}/></button>}
          </div>
        </div>
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {(moves || []).filter(m => !moveUpdateSearch.trim() || m.name.toLowerCase().includes(moveUpdateSearch.toLowerCase())).map(m => (
            <button key={m.id} onClick={() => {
              const tileId = "mu_" + m.id + "_" + Date.now();
              setHomeStack(prev => ({ ...prev, defaultStack: [{ id: tileId, type: "moveUpdate", moveId: m.id }, ...prev.defaultStack] }));
              setShowMoveUpdatePicker(false);
              setMoveUpdateSearch("");
              setUpdatesMove(m);
              setNewUpdateText("");
            }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", background: "none", border: "none", cursor: "pointer",
                borderBottom: `1px solid ${C.borderLight}`, textAlign: "left" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: catColors?.[m.category] || C.accent, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT_DISPLAY, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{m.category}</div>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ── Filter BottomSheet (L2) ── */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t("filterSections")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { key: 'today', label: t('sectionToday'), count: sections.today.length },
            { key: 'notes', label: t('sectionNotes'), count: sections.notes.length },
            { key: 'goals', label: t('sectionGoals'), count: sections.goals.length },
          ].map(row => (
            <button key={row.key}
              onClick={() => setSectionFilter(prev => ({ ...prev, [row.key]: !prev[row.key] }))}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                background: C.surface, border: "none", textAlign: "left",
              }}>
              <span style={{ fontSize: 13, fontFamily: FONT_DISPLAY, fontWeight: 800,
                letterSpacing: 1.5, textTransform: "uppercase", color: C.text }}>
                {row.label} <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 4 }}>· {row.count}</span>
              </span>
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: sectionFilter[row.key] ? `2px solid ${C.green}` : `2px solid ${C.border}`,
                background: sectionFilter[row.key] ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sectionFilter[row.key] && <Ic n="check" s={12} c="#fff"/>}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

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

      {/* ── Remove tile confirmation ── */}
      {confirmRemove && (
        <Modal title={t("confirm")} onClose={() => setConfirmRemove(null)}>
          <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: C.text }}>
              {resolveTileName(confirmRemove, habits, ideas, moves)}
            </span>
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            <Btn variant="primary" onClick={() => doRemove()}>{t("removeFromHome")}</Btn>
            <Btn variant="secondary" onClick={() => setConfirmRemove(null)}>{t("cancel")}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Feature 5: Bulk delete confirmation ── */}
      {confirmBulkDelete && (
        <Modal onClose={() => setConfirmBulkDelete(false)}>
          <div style={{ padding: 20, textAlign: "center" }}>
            <Ic n="trash" s={28} c={C.accent}/>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 1, color: C.text, margin: "8px 0" }}>
              {t("deleteSelected")}
            </h3>
            <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16, lineHeight: 1.5 }}>
              {selectedIds.size} {t("itemsWillBeDeleted")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmBulkDelete(false)}
                style={{ flex: 1, padding: "10px", background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>
                {t("cancel")}
              </button>
              <button onClick={() => {
                const ids = [...selectedIds];
                // Remove from homeStack
                setHomeStack(prev => ({
                  ...prev,
                  defaultStack: (prev.defaultStack || []).filter(t => !ids.includes(t.id)),
                }));
                // Delete underlying data for each tile
                const allVisibleTiles = [...sections.today, ...sections.notes, ...sections.goals];
                ids.forEach(tileId => {
                  const tile = allVisibleTiles.find(t => t.id === tileId);
                  if (!tile) return;
                  if (tile.type === 'note') {
                    setIdeas(prev => prev.filter(i => i.id !== tileId));
                  } else if (tile.type === 'goalhabit' && tile.refId) {
                    const isHabit = habits?.some(h => String(h.id) === String(tile.refId));
                    if (isHabit) {
                      setHabits(prev => prev.filter(h => String(h.id) !== String(tile.refId)));
                    } else {
                      setIdeas(prev => prev.filter(i => String(i.id) !== String(tile.refId)));
                    }
                  }
                });
                setConfirmBulkDelete(false);
                exitSelectMode();
              }}
                style={{ flex: 1, padding: "10px", background: C.accent, border: "none",
                  borderRadius: 8, cursor: "pointer", fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 13, color: "#fff" }}>
                {t("delete")}
              </button>
            </div>
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
      {editTile && editTile.type === 'note' && (
        <BottomSheet open={true} onClose={() => setEditTile(null)} title={t("editNote")}>
          <IdeaForm idea={ideas?.find(i => i.id === editTile.id)} onSave={handleEditSave} onCancel={() => setEditTile(null)}/>
        </BottomSheet>
      )}
      {editTile && editTile.type === 'goalhabit' && (() => {
        const habit = habits?.find(h => String(h.id) === String(editTile.refId));
        const goal = ideas?.find(i => String(i.id) === String(editTile.refId) && (i.type === 'goal' || i.type === 'target'));

        if (habit) {
          return (
            <HabitModal
              onClose={() => setEditTile(null)}
              onSave={(fields) => {
                setHabits(prev => prev.map(h =>
                  String(h.id) === String(editTile.refId) ? { ...h, ...fields } : h
                ));
                setEditTile(null);
              }}
              habit={habit}
            />
          );
        }

        if (goal) {
          return (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
              <GoalModal
                onClose={() => setEditTile(null)}
                onSave={(fields) => {
                  setIdeas(prev => prev.map(i =>
                    String(i.id) === String(editTile.refId) ? { ...i, ...fields } : i
                  ));
                  setEditTile(null);
                }}
                idea={goal}
              />
            </div>
          );
        }

        setHomeStack(prev => ({
          ...prev,
          defaultStack: prev.defaultStack.filter(t => t.id !== editTile.id),
        }));
        setEditTile(null);
        return null;
      })()}

      {editMoveFromHome && (
        <MoveModal
          move={editMoveFromHome}
          cats={cats}
          onClose={() => setEditMoveFromHome(null)}
          onSave={(f) => {
            setMoves(prev => prev.map(m => m.id === editMoveFromHome.id ? { ...m, ...f } : m));
            setEditMoveFromHome(null);
          }}
          customAttrs={customAttrs}
          onAddAttr={def => setCustomAttrs && setCustomAttrs(p => [...p, def])}
          allMoves={moves}
          catColors={catColors}
          isPremium={isPremium}
        />
      )}

      {/* Updates BottomSheet */}
      {updatesMove && (
        <BottomSheet open={true} onClose={() => setUpdatesMove(null)} title={updatesMove.name} maxHeight="85vh">
          {/* Category tag */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: FONT_DISPLAY, fontWeight: 700,
              color: catColors?.[updatesMove.category] || C.accent, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {updatesMove.category}
            </span>
          </div>

          {/* Description as context */}
          {updatesMove.description && (
            <div style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_BODY, lineHeight: 1.4,
              marginBottom: 12, padding: "8px 10px", background: C.surfaceAlt, borderRadius: 8 }}>
              {updatesMove.description}
            </div>
          )}

          {/* Discoverability note */}
          <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", fontFamily: FONT_BODY,
            marginBottom: 12, lineHeight: 1.4 }}>
            {t("updatesAlsoInEdit")}
          </div>

          {/* Add entry input */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <textarea
              ref={updateTextareaRef}
              value={newUpdateText}
              onChange={e => {
                setNewUpdateText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder={t("updatePlaceholder")}
              rows={2}
              style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12,
                fontFamily: FONT_BODY, outline: "none", resize: "none", overflow: "hidden", lineHeight: 1.4 }}
            />
            <button
              onClick={() => {
                if (!newUpdateText.trim()) return;
                const entry = {
                  id: Date.now(),
                  date: todayLocal(),
                  text: newUpdateText.trim(),
                };
                setMoves(prev => prev.map(m =>
                  m.id === updatesMove.id
                    ? { ...m, journal: [entry, ...(m.journal || [])] }
                    : m
                ));
                setUpdatesMove(prev => prev ? { ...prev, journal: [entry, ...(prev.journal || [])] } : null);
                setNewUpdateText("");
                if (updateTextareaRef.current) updateTextareaRef.current.style.height = 'auto';
              }}
              disabled={!newUpdateText.trim()}
              style={{ alignSelf: "flex-end", width: 36, height: 36, borderRadius: 8,
                background: newUpdateText.trim() ? C.accent : C.surfaceAlt,
                border: "none", cursor: newUpdateText.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic n="plus" s={16} c={newUpdateText.trim() ? "#fff" : C.textMuted} />
            </button>
          </div>

          {/* Entries list */}
          {(updatesMove.journal || []).length === 0 ? (
            <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", padding: "6px 0" }}>
              {t("noJournalEntries")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(updatesMove.journal || []).map(entry => (
                <div key={entry.id} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                      {entry.date}
                    </span>
                    <button onClick={() => {
                      const updated = (updatesMove.journal || []).filter(e => e.id !== entry.id);
                      setMoves(prev => prev.map(m =>
                        m.id === updatesMove.id ? { ...m, journal: updated } : m
                      ));
                      setUpdatesMove(prev => prev ? { ...prev, journal: updated } : null);
                    }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                      <Ic n="x" s={10} c={C.textMuted} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: C.text, fontFamily: FONT_BODY, lineHeight: 1.4 }}>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          )}

        </BottomSheet>
      )}

      {journalGoalTile && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
          <GoalModal
            onClose={() => setJournalGoalTile(null)}
            onSave={(fields) => {
              setIdeas(prev => prev.map(i =>
                String(i.id) === String(journalGoalTile.tile.refId) ? { ...i, ...fields } : i
              ));
              setJournalGoalTile(null);
            }}
            idea={journalGoalTile.goal}
          />
        </div>
      )}
    </div>
  );
};
