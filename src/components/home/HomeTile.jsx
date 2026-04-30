import React, { useState, useRef, useEffect } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { ExpandableText } from '../shared/ExpandableText';

export const HomeTile = ({ tile, isChecked, onCheck, onCheckStep, onRemove, onEdit, onTogglePin, onArchive, onOpenJournal, onOpenUpdates, selectMode, isSelected, onToggleSelect, habits, ideas, moves }) => {
  const { C } = useSettings();
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [menu]);

  // Resolve data based on tile type
  let emoji = null, fallbackIcon = null, name, description, showCheckbox = false, extraInfo = null, isOrphan = false, isPinned = false, isGoal = false;

  if (tile.type === 'routine') {
    fallbackIcon = "list";
    name = tile.name || "";
  } else if (tile.type === 'note') {
    const note = ideas?.find(i => i.id === tile.id);
    emoji = null;
    fallbackIcon = "fileText";
    name = note?.title || "";
    description = note?.text || "";
    isPinned = note?.pinnedHome || false;
    if (note?.link) {
      extraInfo = note.link;
    }
  } else if (tile.type === 'goalhabit') {
    const habit = habits?.find(h => String(h.id) === String(tile.refId));
    if (habit) {
      emoji = habit.emoji || null;
      fallbackIcon = "check";
      name = habit.name || "";
      description = "";
      showCheckbox = true;
    } else {
      const goal = ideas?.find(i => String(i.id) === String(tile.refId) && (i.type === 'goal' || i.type === 'target'));
      if (goal) {
        isGoal = true;
        emoji = null;
        fallbackIcon = "trophy";
        name = goal.title || "";
        description = goal.text || "";
        if (goal.byWhen) {
          const d = new Date(goal.byWhen + "T12:00:00");
          extraInfo = d.toLocaleDateString();
        }
      } else {
        // Orphan: referenced habit/goal was deleted
        isOrphan = true;
        emoji = null;
        fallbackIcon = "info";
        name = t("deleted") || "Deleted";
        description = "";
      }
    }
  } else if (tile.type === 'moveUpdate') {
    const move = moves?.find(m => m.id === tile.moveId);
    if (!move) {
      isOrphan = true;
      fallbackIcon = "info";
      name = t("deleted") || "Deleted";
      description = "";
    } else {
      fallbackIcon = "notebookPen";
      name = move.name;
      const latestEntry = (move.journal || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0];
      description = latestEntry ? `${latestEntry.date}: ${latestEntry.text}` : move.description || "";
      extraInfo = move.category;
    }
  }

  // Step completion state for routines
  const hasSteps = tile.type === 'routine' && tile.steps?.length > 0;
  const stepCheckObj = hasSteps && typeof isChecked === 'object' ? isChecked : {};
  const completedSteps = hasSteps ? Object.keys(stepCheckObj).filter(k => stepCheckObj[k]).length : 0;
  const totalSteps = hasSteps ? tile.steps.length : 0;
  const allStepsComplete = hasSteps && totalSteps > 0 && completedSteps === totalSteps;

  // For non-step tiles, isChecked is boolean; for step routines, use allStepsComplete
  const tileChecked = hasSteps ? allStepsComplete : !!isChecked;

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 12px", marginBottom: 6, borderRadius: 8, cursor: "pointer",
        background: isOrphan ? "transparent" : tileChecked ? `${C.green}0a` : C.surface,
        opacity: isOrphan ? 0.45 : tileChecked ? 0.65 : 1,
        transition: "all 0.2s",
      }}>
      {/* Selection checkbox */}
      {selectMode && (
        <button onClick={e => { e.stopPropagation(); onToggleSelect?.(); }}
          style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            border: `2px solid ${isSelected ? C.accent : C.border}`,
            background: isSelected ? C.accent : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", marginTop: 2, padding: 0,
          }}>
          {isSelected && <Ic n="check" s={14} c="#fff"/>}
        </button>
      )}

      {/* Emoji / Icon */}
      <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {emoji ? emoji : <Ic n={fallbackIcon} s={16} c={isOrphan ? C.textMuted : undefined}/>}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={
            isGoal && onOpenJournal ? (e) => { e.stopPropagation(); onOpenJournal(tile); }
            : tile.type === 'moveUpdate' && onOpenUpdates ? (e) => { e.stopPropagation(); onOpenUpdates(tile); }
            : undefined
          }
          style={{
          fontWeight: 800, fontSize: 13, fontFamily: FONT_DISPLAY, letterSpacing: 0.3,
          color: tileChecked ? C.textMuted : C.text,
          textDecoration: tileChecked ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          cursor: isGoal || tile.type === 'moveUpdate' ? "pointer" : undefined,
        }}>
          {name}
          {isPinned && <Ic n="pin" s={10} c={C.accent} style={{marginLeft:4, verticalAlign:"middle"}}/>}
          {tile.type === 'moveUpdate' && !isOrphan && (
            <span style={{ fontSize: 9, color: C.yellow, fontWeight: 700, fontFamily: FONT_DISPLAY,
              marginLeft: 5, letterSpacing: 0.3, verticalAlign: "middle" }}>
              update
            </span>
          )}
          {hasSteps && totalSteps > 0 && (
            <span style={{ fontSize: 10, color: allStepsComplete ? C.green : C.textMuted, fontWeight: 700, fontFamily: FONT_DISPLAY, marginLeft: 6 }}>
              {completedSteps}/{totalSteps}
            </span>
          )}
        </div>

        {/* Time of day pill for routines */}
        {tile.type === 'routine' && tile.timeOfDay && (
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, fontFamily: FONT_DISPLAY,
            color: C.textMuted, background: C.surfaceAlt, borderRadius: 8,
            padding: "2px 8px", marginTop: 3, letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            {t("tod" + tile.timeOfDay.charAt(0).toUpperCase() + tile.timeOfDay.slice(1)) || tile.timeOfDay}
          </span>
        )}

        {/* Step checkboxes for routines */}
        {hasSteps && (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
            {tile.steps.map(step => {
              const stepChecked = typeof isChecked === 'object' ? !!isChecked[step.id] : false;
              return (
                <button key={step.id}
                  onClick={e => { e.stopPropagation(); onCheckStep?.(tile, step.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "4px 0", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${stepChecked ? C.green : C.border}`,
                    background: stepChecked ? C.green : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {stepChecked && <Ic n="check" s={12} c="#fff"/>}
                  </div>
                  <span style={{
                    fontSize: 13, fontFamily: FONT_BODY, color: stepChecked ? C.textMuted : C.text,
                    textDecoration: stepChecked ? "line-through" : "none",
                    flex: 1,
                  }}>
                    {step.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Note link */}
        {tile.type === 'note' && extraInfo && (
          <button onClick={e => { e.stopPropagation(); window.open(extraInfo, "_blank"); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              color: C.accent, fontSize: 11, fontFamily: FONT_BODY, padding: "2px 0", marginTop: 2,
            }}>
            <Ic n="link" s={10} c={C.accent}/> Link
          </button>
        )}

        {/* Goal deadline */}
        {tile.type === 'goalhabit' && extraInfo && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            {extraInfo}
          </div>
        )}

        {/* Description (non-routine tiles only) */}
        {description && tile.type !== 'routine' && (
          <ExpandableText
            text={description} maxLines={2} fontSize={11}
            color={C.textSec} lineHeight={1.4}
            expanded={expanded} onToggle={() => setExpanded(!expanded)}
            style={{ marginTop: 3 }}
          />
        )}
      </div>

      {/* Checkbox (goalhabit only — routines use step checkboxes) */}
      {showCheckbox && (
        <button onClick={e => { e.stopPropagation(); onCheck?.(tile); }}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isChecked ? C.green : "transparent",
            border: `2px solid ${isChecked ? C.green : C.border}`,
            transition: "all 0.15s", marginTop: 2,
          }}>
          {!!isChecked && <Ic n="check" s={16} c="#fff"/>}
        </button>
      )}

      {/* Three-dot menu — hidden during select mode */}
      {!selectMode && <div ref={menuRef} style={{ flexShrink: 0, position: "relative" }}>
        <button onClick={e => { e.stopPropagation(); setMenu(m => !m); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 2 }}>
          <Ic n="more" s={13}/>
        </button>
        {menu && (
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: 24, right: 0, background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden",
              zIndex: 9999, minWidth: 140, boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            }}>
            <button onClick={() => { setMenu(false); onEdit?.(tile); }}
              style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                color: C.text, fontSize: 12, fontFamily: "inherit" }}>
              <Ic n="edit" s={12} c={C.textSec}/>{tile.type === 'moveUpdate' ? t("editMoveDetails") : t("edit")}
            </button>
            {tile.type === 'note' && (
              <button onClick={() => { setMenu(false); onTogglePin?.(tile); }}
                style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  color: C.text, fontSize: 12, fontFamily: "inherit", borderTop: `1px solid ${C.border}` }}>
                <Ic n="pin" s={12} c={C.textSec}/>{isPinned ? t("unpinBtn") : t("pinToTop")}
              </button>
            )}
            {(tile.type === 'note' ||
              (tile.type === 'goalhabit' && ideas?.find(i => String(i.id) === String(tile.refId) && (i.type === 'goal' || i.type === 'target')))
             ) && (
              <button onClick={() => { setMenu(false); onArchive?.(tile); }}
                style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  color: C.text, fontSize: 12, fontFamily: "inherit", borderTop: `1px solid ${C.border}` }}>
                <Ic n="archive" s={12} c={C.textSec}/>{t("archive")}
              </button>
            )}
            <button onClick={() => { setMenu(false); onRemove?.(tile); }}
              style={{ width: "100%", padding: "9px 13px", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                color: C.accent, fontSize: 12, fontFamily: "inherit", borderTop: `1px solid ${C.border}` }}>
              <Ic n="trash" s={12} c={C.accent}/>{t("delete")}
            </button>
          </div>
        )}
      </div>}
    </div>
  );
};
