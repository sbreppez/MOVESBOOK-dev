import React from 'react';
import { FONT_DISPLAY } from '../../constants/fonts';
import { useSettings } from '../../hooks/useSettings';
import { useT } from '../../hooks/useTranslation';

const DAY_LETTERS = ['S','M','T','W','T','F','S'];

export const WeekStrip = ({ selectedDate, onSelectDate }) => {
  const { C } = useSettings();
  const t = useT();
  const todayStr = new Date().toISOString().split("T")[0];

  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().split("T")[0],
      dayNum: d.getDate(),
      dow: d.getDay(),
    });
  }

  return (
    <div style={{ display:"flex", padding:"8px 10px", gap:4, background:C.surface,
      borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
      {days.map(({ dateStr, dayNum, dow }) => {
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === selectedDate;
        const isActive = isToday || isSelected;
        return (
          <button key={dateStr} onClick={() => onSelectDate(dateStr)}
            style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              padding:"6px 0", borderRadius:10, border:"none", cursor:"pointer",
              background: isToday ? C.accent : isSelected ? `${C.accent}18` : "transparent",
              outline: isSelected && !isToday ? `1.5px solid ${C.accent}` : "none",
              transition:"all 0.15s",
            }}>
            <span style={{
              fontSize:10, fontWeight:800, letterSpacing:1, fontFamily:FONT_DISPLAY,
              color: isToday ? "#fff" : isSelected ? C.accent : C.textMuted,
            }}>
              {DAY_LETTERS[dow]}
            </span>
            <span style={{
              fontSize:15, fontWeight:900, fontFamily:FONT_DISPLAY,
              color: isToday ? "#fff" : isSelected ? C.accent : C.text,
            }}>
              {dayNum}
            </span>
            {isToday && (
              <div style={{ width:4, height:4, borderRadius:"50%", background:"#fff", marginTop:-1 }}/>
            )}
          </button>
        );
      })}
    </div>
  );
};
