import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { AttributeChips } from './AttributeChips';

/**
 * Collapsible filter panel for Moves tab.
 * Renders chip toggles for each defined attribute.
 *
 * Props:
 *   customAttrs    — array of attribute definitions
 *   activeFilters  — { ca_id: "value" | ["v1","v2"] }
 *   setActiveFilters — state setter
 *   totalCount     — total moves count (before filter)
 *   filteredCount  — filtered moves count
 */
export const AttributeFilter = ({ customAttrs, activeFilters, setActiveFilters, totalCount, filteredCount }) => {
  const t = useT();

  const hasFilters = Object.keys(activeFilters).some(k => {
    const v = activeFilters[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v != null;
  });

  const handleChange = (attrId, value) => {
    setActiveFilters(prev => {
      const next = { ...prev, [attrId]: value };
      // Clean up empty values
      if (Array.isArray(value) && value.length === 0) delete next[attrId];
      if (value === "" || value === null) delete next[attrId];
      return next;
    });
  };

  if (customAttrs.length === 0) {
    return (
      <div style={{ padding: "10px 14px", background: C.surfaceAlt, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>
          {t("noAttributesDefined")}
        </div>
      </div>
    );
  }

  const sorted = [...customAttrs].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div style={{ padding: "10px 14px", background: C.surfaceAlt,
      borderBottom: `1px solid ${C.borderLight}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          color: C.textMuted, fontFamily: FONT_DISPLAY }}>{t("filterByAttributes")}</span>
        {hasFilters && (
          <button onClick={() => setActiveFilters({})}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: C.accent, fontWeight: 700, fontFamily: FONT_DISPLAY,
              padding: "2px 6px" }}>
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Attribute sections */}
      {sorted.map(attr => (
        <div key={attr.id} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.textMuted,
            fontFamily: FONT_DISPLAY, marginBottom: 4 }}>
            {attr.name.toUpperCase()}{attr.multi ? " (multi)" : ""}
          </div>
          <AttributeChips
            attr={attr}
            selected={activeFilters[attr.id] || (attr.multi ? [] : "")}
            onChange={val => handleChange(attr.id, val)}
            compact
          />
        </div>
      ))}

      {/* Count */}
      {hasFilters && (
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
          {t("showingXofY").replace("{x}", filteredCount).replace("{y}", totalCount)}
        </div>
      )}
    </div>
  );
};
