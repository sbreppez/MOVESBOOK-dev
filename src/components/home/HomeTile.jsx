import React, { useState } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { ExpandableText } from '../shared/ExpandableText';

export const HomeTile = ({ tile, isChecked, onCheck, onRemove, onEdit, habits, ideas, homeIdeas }) => {
  const { C } = useSettings();
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  // Resolve data based on tile type
  let emoji = null, fallbackIcon = null, name, description, showCheckbox = false, extraInfo = null, isOrphan = false;

  if (tile.type === 'routine') {
    emoji = tile.emoji || null;
    fallbackIcon = "dumbbell";
    name = tile.name || "";
    description = tile.description || "";
    showCheckbox = tile.checkable;
    if (tile.duration > 0) {
      extraInfo = `${tile.duration} min`;
    }
  } else if (tile.type === 'idea') {
    const idea = homeIdeas?.find(i => i.id === tile.id);
    emoji = idea?.emoji || null;
    fallbackIcon = "bulb";
    name = idea?.title || "";
    description = idea?.text || "";
    if (idea?.link) {
      extraInfo = idea.link;
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
        emoji = null;
        fallbackIcon = "target";
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
  }

  return (
    <div
      onClick={() => onEdit?.(tile)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 12px", marginBottom: 6, borderRadius: 10, cursor: "pointer",
        background: isOrphan ? "transparent" : isChecked ? `${C.green}0a` : C.surface,
        borderTop: `1px ${isOrphan ? "dashed" : "solid"} ${isChecked ? `${C.green}30` : C.border}`,
        borderRight: `1px ${isOrphan ? "dashed" : "solid"} ${isChecked ? `${C.green}30` : C.border}`,
        borderBottom: `1px ${isOrphan ? "dashed" : "solid"} ${isChecked ? `${C.green}30` : C.border}`,
        borderLeft: `3px ${isOrphan ? "dashed" : "solid"} ${isChecked ? C.green : C.border}`,
        opacity: isOrphan ? 0.45 : isChecked ? 0.65 : 1,
        transition: "all 0.2s",
      }}>
      {/* Emoji / Icon */}
      <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {emoji ? emoji : <Ic n={fallbackIcon} s={16} c={isOrphan ? C.textMuted : undefined}/>}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 800, fontSize: 13, fontFamily: FONT_DISPLAY, letterSpacing: 0.3,
          color: isChecked ? C.textMuted : C.text,
          textDecoration: isChecked ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name}
          {extraInfo && tile.type === 'routine' && (
            <span style={{ fontWeight: 600, fontSize: 11, color: C.textMuted, marginLeft: 6 }}>
              · {extraInfo}
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

        {/* Idea link */}
        {tile.type === 'idea' && extraInfo && (
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

        {/* Description */}
        {description && (
          <ExpandableText
            text={description} maxLines={2} fontSize={11}
            color={C.textMuted} lineHeight={1.4}
            expanded={expanded} onToggle={() => setExpanded(!expanded)}
            style={{ marginTop: 3 }}
          />
        )}
      </div>

      {/* Checkbox */}
      {showCheckbox && (
        <button onClick={e => { e.stopPropagation(); onCheck?.(tile); }}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isChecked ? C.green : "transparent",
            border: `2px solid ${isChecked ? C.green : C.border}`,
            transition: "all 0.15s", marginTop: 2,
          }}>
          {isChecked && <Ic n="check" s={16} c="#fff"/>}
        </button>
      )}

      {/* Remove X */}
      <button onClick={e => { e.stopPropagation(); onRemove?.(tile); }}
        style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", color: C.textMuted,
          opacity: 0.5, marginTop: 2,
        }}>
        <Ic n="x" s={14} c={C.textMuted}/>
      </button>
    </div>
  );
};
