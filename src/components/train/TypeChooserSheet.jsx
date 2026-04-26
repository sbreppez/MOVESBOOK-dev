import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';
import { BottomSheet } from '../shared/BottomSheet';

export const TypeChooserSheet = ({ open, onClose, onChoose }) => {
  const { C } = useSettings();
  const t = useT();

  const tiles = [
    { icon: "target",    label: t("newGoal"),   type: "goal" },
    { icon: "crosshair", label: t("newTarget"), type: "target" },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={t("addGoalOrTarget")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tiles.map((tile, i) => (
          <button key={i} onClick={() => { onClose(); onChoose(tile.type); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt, border: "none", textAlign: "left",
            }}>
            <Ic n={tile.icon} s={18} c={C.textSec}/>
            <span style={{ fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text }}>
              {tile.label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};
