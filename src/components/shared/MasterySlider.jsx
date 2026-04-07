import React, { useState } from 'react';
import { C } from '../../constants/colors';
import { masteryColor, masteryLabel, lbl } from '../../constants/styles';
import { useT } from '../../hooks/useTranslation';
import { computeDecay } from '../../utils/masteryDecay';
import { useSettings } from '../../hooks/useSettings';

export const MasterySlider = ({ value, onChange, moveDate, moveDifficulty }) => {
  const t = useT();
  const { settings } = useSettings();
  const col = masteryColor(value);

  const decay = moveDate
    ? computeDecay({ mastery: value, date: moveDate, difficulty: moveDifficulty }, settings.decaySensitivity)
    : null;

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <label style={lbl()}>{t("mastery")}</label>
        <span style={{ fontSize:13, color:col, fontWeight:700 }}>{value}% · {masteryLabel(value)}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e=>onChange(+e.target.value)} style={{ width:"100%", accentColor:col, cursor:"pointer" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.textMuted, marginTop:4 }}>
        <span>{t("beginnerLabel")}</span><span style={{color:C.yellow}}>{t("consistentLabel")}</span><span style={{color:C.green}}>{t("masteredCheck")}</span>
      </div>
      {decay && decay.decayAmount > 0 && (
        <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>
          {t("effectiveMastery")}: {decay.displayMastery}% ({"\u2193"}{decay.decayAmount}%)
        </div>
      )}
    </div>
  );
};
