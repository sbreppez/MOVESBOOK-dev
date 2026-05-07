import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { Ic } from '../shared/Ic';

export function ComingSoonState() {
  const t = useT();
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <Ic n="wrench" s={32} c={C.textMuted} />
      <div style={{
        fontSize: 16, fontFamily: FONT_DISPLAY, fontWeight: 800,
        color: C.text, textTransform: "uppercase", letterSpacing: 1.5,
        marginTop: 13, marginBottom: 6,
      }}>
        {t("logTodayComingSoon")}
      </div>
      <div style={{
        fontSize: 13, fontFamily: FONT_BODY, color: C.textMuted, lineHeight: 1.5,
      }}>
        {t("logTodayComingSoonHint")}
      </div>
    </div>
  );
}

export default ComingSoonState;
