import React, { useMemo } from 'react';
import { FONT_DISPLAY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';

export const MoveSnapshotCard = ({ moves, reps }) => {
  const { C } = useSettings();
  const t = useT();

  const stats = useMemo(() => {
    if (!moves || moves.length === 0) return null;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const d14 = new Date(now); d14.setDate(d14.getDate() - 14);
    const d14Str = d14.toISOString().split("T")[0];
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const d30Str = d30.toISOString().split("T")[0];

    // Sharp: mastery >= 80
    const sharp = moves.filter(m => (m.mastery || 0) >= 80).length;

    // Rising: trained 3+ times in last 14 days (from reps)
    const repCounts = {};
    (reps || []).forEach(r => {
      if (r.date && r.date >= d14Str && r.date <= todayStr) {
        repCounts[r.moveId] = (repCounts[r.moveId] || 0) + 1;
      }
    });
    const rising = Object.values(repCounts).filter(c => c >= 3).length;

    // Stale: not touched in 30+ days
    const stale = moves.filter(m => !m.date || m.date < d30Str).length;

    return { sharp, rising, stale, total: moves.length };
  }, [moves, reps]);

  if (!stats) return null;

  const statBox = (label, value, color) => (
    <div style={{ flex:1, textAlign:"center" }}>
      <div style={{ fontSize:20, fontWeight:900, fontFamily:FONT_DISPLAY, color }}>{value}</div>
      <div style={{ fontSize:9, fontWeight:800, letterSpacing:1, color:C.textMuted, fontFamily:FONT_DISPLAY, marginTop:2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{
      background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
      borderLeft:`4px solid ${C.accent}`, padding:"12px 14px", marginBottom:8,
    }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:10 }}>
        {t("moveSnapshot")}
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {statBox(t("sharp"), stats.sharp, C.green)}
        {statBox(t("rising"), stats.rising, C.blue)}
        {statBox(t("stale"), stats.stale, C.yellow)}
        {statBox(t("totalMoves"), stats.total, C.text)}
      </div>
    </div>
  );
};
