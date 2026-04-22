import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';
import { BottomSheet } from '../shared/BottomSheet';
import { Ic } from '../shared/Ic';

export const LibraryMenuSheet = ({
  open,
  onClose,
  onAddMove,
  onBulkImport,
  onAddCategory,
  onOpenTools,
}) => {
  const { C } = useSettings();
  const t = useT();

  const items = [
    { icon: "plus",       label: t("addMoveMenu"),      action: onAddMove },
    { icon: "cards",      label: t("bulkImportMenu"),   action: onBulkImport },
    { icon: "folderPlus", label: t("addCategoryMenu"),  action: onAddCategory },
    { icon: "compass",    label: t("creativeTools"),    action: () => { if (onOpenTools) onOpenTools(); } },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={t("addToLibraryTitle")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(opt => (
          <button
            key={opt.icon}
            onClick={() => { onClose(); opt.action(); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "14px 16px", borderRadius: 8, cursor: "pointer",
              background: C.surfaceAlt, border: "none", textAlign: "left",
            }}
          >
            <Ic n={opt.icon} s={18} c={C.textSec} />
            <span style={{
              fontSize: 14, fontFamily: FONT_DISPLAY, fontWeight: 700, color: C.text
            }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};
