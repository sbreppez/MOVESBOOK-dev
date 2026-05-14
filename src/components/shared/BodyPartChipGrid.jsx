import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

const CHIP_ORDER = [
  { bodyPart: "head",       side: null    },
  { bodyPart: "neck",       side: null    },
  { bodyPart: "shoulder",   side: "left"  },
  { bodyPart: "shoulder",   side: "right" },
  { bodyPart: "elbow",      side: "left"  },
  { bodyPart: "elbow",      side: "right" },
  { bodyPart: "wrist",      side: "left"  },
  { bodyPart: "wrist",      side: "right" },
  { bodyPart: "upperBack",  side: null    },
  { bodyPart: "lowerBack",  side: null    },
  { bodyPart: "hip",        side: "left"  },
  { bodyPart: "hip",        side: "right" },
  { bodyPart: "knee",       side: "left"  },
  { bodyPart: "knee",       side: "right" },
  { bodyPart: "ankle",      side: "left"  },
  { bodyPart: "ankle",      side: "right" },
];

const partLabelKey = (p) => p ? "bodyPart" + p.charAt(0).toUpperCase() + p.slice(1) : "";

export const BodyPartChipGrid = ({ selected = [], onToggle }) => {
  const { C } = useSettings();
  const t = useT();

  const chipStyle = (active) => ({
    borderRadius: 20, padding: "5px 13px",
    border: `1.5px solid ${active ? C.accent : C.border}`,
    background: active ? C.accent + "18" : "transparent",
    color: active ? C.accent : C.text,
    fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY,
    letterSpacing: 0.5, textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.15s",
    width: "100%",
  });

  const chipLabel = (chip) => {
    const part = t(partLabelKey(chip.bodyPart));
    if (!chip.side) return part;
    return `${t(chip.side === "left" ? "leftSide" : "rightSide")} ${part}`;
  };

  const isChipActive = (chip) =>
    selected.some(s => s.bodyPart === chip.bodyPart && (s.side || null) === (chip.side || null));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
      {CHIP_ORDER.map((chip, i) => (
        <button
          key={i}
          onClick={() => onToggle({ bodyPart: chip.bodyPart, side: chip.side })}
          style={chipStyle(isChipActive(chip))}>
          {chipLabel(chip)}
        </button>
      ))}
    </div>
  );
};
