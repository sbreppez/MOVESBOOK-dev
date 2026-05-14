import React, { useState } from 'react';
import { FONT_BODY, FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { todayLocal } from '../../utils/dateUtils';
import { InjuryModal } from '../modals/InjuryModal';

const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

// Day counter — Day 1 on the day of injury (rounded up per spec §CONFIRMED DECISIONS #5)
const daysSince = (startDate) => {
  if (!startDate) return 1;
  const ms = new Date(todayLocal() + "T12:00:00") - new Date(startDate + "T12:00:00");
  return Math.max(1, Math.floor(ms / 86400000) + 1);
};

const CAP = 3;

export const HomeActiveInjuryBanner = ({ injuries, setInjuries }) => {
  const { C } = useSettings();
  const t = useT();
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const active = (injuries || [])
    .filter(i => !i.resolved)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  if (active.length === 0) return null;

  const visible = expanded ? active : active.slice(0, CAP);
  const overflow = expanded ? 0 : Math.max(0, active.length - CAP);
  const sevColors = { 1: C.green, 2: C.yellow, 3: C.accent };

  const labelFor = (inj) => {
    const part = inj.bodyPart ? t(partLabelKey(inj.bodyPart)) : "";
    if (!inj.side) return part;
    return `${t(inj.side === "left" ? "leftSide" : "rightSide")} ${part}`;
  };

  return (
    <div style={{ padding: "8px 16px 0", flexShrink: 0 }}>
      {visible.map(inj => {
        const stripeColor = inj.severity ? sevColors[inj.severity] : C.border;
        const n = daysSince(inj.startDate);
        return (
          <div key={inj.id}
            onClick={() => setEditing(inj)}
            style={{
              background: C.surfaceAlt,
              borderRadius: 8,
              borderLeft: `4px solid ${stripeColor}`,
              padding: "8px 14px",
              marginBottom: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textSec, fontFamily: FONT_BODY }}>
              {labelFor(inj)}
            </span>
            <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT_BODY, marginLeft: 6 }}>
              · {t("injuryDayCounter").replace("{n}", n)}
            </span>
          </div>
        );
      })}

      {overflow > 0 && (
        <div
          onClick={() => setExpanded(true)}
          style={{
            background: C.surfaceAlt,
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 6,
            cursor: "pointer",
            textAlign: "center",
            color: C.textMuted,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: FONT_DISPLAY,
            letterSpacing: 0.5,
          }}>
          {t("injuryNMoreActive").replace("{n}", overflow)}
        </div>
      )}

      {editing && (
        <InjuryModal
          injury={editing}
          onClose={() => setEditing(null)}
          onSave={(inj) => setInjuries((injuries || []).map(i => i.id === inj.id ? inj : i))}
          onDelete={(id) => setInjuries((injuries || []).filter(i => i.id !== id))}
        />
      )}
    </div>
  );
};

export default HomeActiveInjuryBanner;
