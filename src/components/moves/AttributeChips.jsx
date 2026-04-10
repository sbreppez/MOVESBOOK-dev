import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';

/**
 * Reusable chip selector for custom attributes.
 * Used in MoveModal (assign values) and AttributeFilter (filter values).
 *
 * Props:
 *   attr     — { id, name, multi, values }
 *   selected — string (single) | array (multi) | "" | []
 *   onChange — (newValue) => void
 *   compact  — boolean, smaller chips for filter panel
 */
export const AttributeChips = ({ attr, selected, onChange, compact }) => {
  const isMulti = attr.multi;

  const handleTap = (val) => {
    if (isMulti) {
      const arr = Array.isArray(selected) ? selected : [];
      if (arr.includes(val)) {
        onChange(arr.filter(v => v !== val));
      } else {
        onChange([...arr, val]);
      }
    } else {
      // Single-select: tap selected to deselect
      onChange(selected === val ? "" : val);
    }
  };

  const isActive = (val) => {
    if (isMulti) {
      return Array.isArray(selected) && selected.includes(val);
    }
    return selected === val;
  };

  const chipBase = {
    border: "none",
    cursor: "pointer",
    borderRadius: 20,
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    letterSpacing: 0.3,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    ...(compact
      ? { fontSize: 11, padding: "3px 10px" }
      : { fontSize: 11, padding: "5px 13px" }
    ),
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? 4 : 6 }}>
      {(attr.values || []).map(val => {
        const active = isActive(val);
        return (
          <button
            key={val}
            onClick={() => handleTap(val)}
            style={{
              ...chipBase,
              background: active ? C.accent : C.surface,
              color: active ? C.bg : C.textSec,
              border: `1.5px solid ${active ? C.accent : C.border}`,
            }}
          >
            {val}
          </button>
        );
      })}
    </div>
  );
};
