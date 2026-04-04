import React, { useMemo } from 'react';
import { FONT_DISPLAY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';

export const SparringGapCard = ({ sparring }) => {
  const { C, settings } = useSettings();
  const t = useT();
  const threshold = settings?.sparringGapThreshold || 14;

  const gap = useMemo(() => {
    const sessions = sparring?.sessions || [];
    if (sessions.length === 0) return null;
    let latest = null;
    sessions.forEach(s => {
      const d = s.date || s.endTime?.split("T")[0];
      if (d && (!latest || d > latest)) latest = d;
    });
    if (!latest) return null;
    const days = Math.floor((new Date() - new Date(latest + "T12:00:00")) / 86400000);
    return days;
  }, [sparring]);

  if (gap === null || gap < threshold) return null;

  return (
    <div style={{
      background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
      borderLeft:`4px solid ${C.yellow}`, padding:"12px 14px", marginBottom:8,
    }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:6 }}>
        {t("sparringGap")}
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
        <span style={{ fontSize:22, fontWeight:900, fontFamily:FONT_DISPLAY, color:C.yellow }}>{gap}</span>
        <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{t("daysSinceLastSpar")}</span>
      </div>
      <div style={{ fontSize:11, color:C.yellow, fontWeight:700, fontFamily:FONT_DISPLAY, marginTop:4 }}>
        {t("timeToSpar")}
      </div>
    </div>
  );
};
