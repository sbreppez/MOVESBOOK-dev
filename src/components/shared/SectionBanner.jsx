import React from 'react';
import { C } from '../../constants/colors';
import { FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';

export const SectionBanner = ({ tab }) => {
  const t = useT();
  const desc = {
    ideas: t("sectionDescTrain"),
    wip:   t("sectionDescMoves"),
    ready: t("sectionDescBattle"),
  };
  return (
    <div style={{ padding:"7px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
      <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, fontStyle:"italic", letterSpacing:0.3 }}>
        {desc[tab] || ""}
      </span>
    </div>
  );
};
