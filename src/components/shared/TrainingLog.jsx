import React, { useState, useEffect, useRef } from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { useT } from '../../hooks/useTranslation';
import { todayLocal } from '../../utils/dateUtils';

const HINT_KEYS = ['hint_body','hint_rhythm','hint_mental','hint_creative','hint_performance'];

export const TrainingLog = ({ value, onChange, framingKey, reflections, onReflectionsChange }) => {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const hintIdx = useRef(0);

  useEffect(() => {
    // Pick hint on mount
    const today = todayLocal();
    const last = reflections?.lastCategory ?? -1;
    if (reflections?.lastDate === today && last >= 0 && last < 5) {
      hintIdx.current = last;
    } else {
      const candidates = [0,1,2,3,4].filter(i => i !== last);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      hintIdx.current = pick;
      onReflectionsChange({ lastCategory: pick, lastDate: today });
    }
    // 2-second delay then fade in
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setOpacity(1));
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fade-in timer; reflections/onReflectionsChange must not retrigger the 2-second timer
  }, []);

  if (!visible) return null;

  return (
    <div style={{ marginTop: 20, marginBottom: 16, opacity, transition: "opacity 0.3s ease-in" }}>
      {/* Section header */}
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: C.textMuted,
        letterSpacing: 1, marginBottom: 6 }}>
        {t("trainingLog")}
      </div>
      {/* Framing line */}
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, fontStyle: "italic",
        marginBottom: 10, lineHeight: 1.4 }}>
        {t(framingKey)}
      </div>
      {/* Textarea */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t("aFewWords")}
        rows={2}
        style={{ width: "100%", fontSize: 13, color: C.text, background: C.surfaceAlt,
          borderRadius: 8, padding: 12, border: `1px solid ${C.border}`,
          fontFamily: FONT_BODY, resize: "vertical", outline: "none", boxSizing: "border-box" }}
      />
      {/* Rotating hint */}
      <div style={{ fontFamily: FONT_BODY, fontStyle: "italic", fontSize: 11, color: C.textMuted,
        marginTop: 6 }}>
        {t(HINT_KEYS[hintIdx.current])}
      </div>
    </div>
  );
};
