import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';
import { FONT_DISPLAY } from '../../constants/fonts';

export const VocabTabBar = ({ vocabTab, onChange, staleCount = 0, isPremium }) => {
  const { C } = useSettings();
  const t = useT();
  const tabs = [["moves", t("library")], ["sets", t("sets")], ["gap", t("gapTab")]];

  return (
    <div style={{ display:"flex", alignItems:"center", padding:"6px 14px", flexShrink:0 }}>
      <div style={{ display:"flex", gap:0 }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => onChange(id)}
            style={{ padding:"4px 10px", background:"none", border:"none", cursor:"pointer",
              fontSize:14, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY, textTransform:"uppercase",
              color: vocabTab === id ? C.text : C.textMuted,
              display:"inline-flex", alignItems:"center", gap:4 }}>
            <span style={{ borderBottom: vocabTab === id ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom:3 }}>
              {label}
            </span>
            {id === "gap" && staleCount > 0 && isPremium && (
              <span style={{ width:6, height:6, borderRadius:3, background:C.red, flexShrink:0 }}/>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
