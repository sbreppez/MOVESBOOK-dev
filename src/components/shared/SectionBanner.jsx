import React from 'react';
import { C } from '../../constants/colors';
import { FONT_BODY } from '../../constants/fonts';

const SECTION_DESC = {
  ideas:  "TRAIN — set your goals, capture ideas and decide what to practice.",
  wip:    "MOVES — all your moves in one place, organised and ready to grow.",
  ready:  "BATTLE — plan your rounds and sets, or freestyle through your arsenal.",
};

export const SectionBanner = ({ tab }) => (
  <div style={{ padding:"7px 14px", background:C.surface, borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
    <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY, fontStyle:"italic", letterSpacing:0.3 }}>
      {SECTION_DESC[tab] || ""}
    </span>
  </div>
);
