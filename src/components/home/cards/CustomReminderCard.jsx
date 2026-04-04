import React from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../../constants/fonts';
import { useSettings } from '../../../hooks/useSettings';
import { useT } from '../../../hooks/useTranslation';

export const CustomReminderCard = ({ reminders }) => {
  const { C } = useSettings();
  const t = useT();

  const items = reminders?.items || [];
  if (items.length === 0) return null;

  return (
    <div style={{
      background:C.surface, borderRadius:14, border:`1.5px solid ${C.border}`,
      borderLeft:`4px solid ${C.blue}`, padding:"12px 14px", marginBottom:8,
    }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>
        {t("pinnedReminders")}
      </div>
      {items.slice(0, 3).map((item, i) => (
        <div key={item.id || i} style={{
          fontSize:13, color:C.text, fontFamily:FONT_BODY, lineHeight:1.5,
          padding:"4px 0", borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none",
        }}>
          {item.text}
        </div>
      ))}
      {items.length > 3 && (
        <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>+{items.length - 3} more</div>
      )}
    </div>
  );
};
