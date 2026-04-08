import React from 'react';
import { FONT_BODY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';

export const SectionBrief = ({ desc, stat, settings }) => {
  if (settings?.showSectionDescriptions === false) return null;
  const { C } = useSettings();
  return (
    <div style={{ padding: "8px 12px 4px" }}>
      {desc && <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5, fontFamily: FONT_BODY }}>{desc}</div>}
      {stat && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 3, fontFamily: FONT_BODY }}>{stat}</div>}
    </div>
  );
};
