import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl } from '../../constants/styles';
import { useT } from '../../hooks/useTranslation';

const levelColor = (lvl) => {
  if (lvl <= 3) return C.red;
  if (lvl <= 6) return C.yellow;
  return C.green;
};

export const ExecutionLevelBattery = ({ value, onChange }) => {
  const t = useT();
  const level = Math.max(1, Math.min(10, Math.ceil((value || 0) / 10)));
  const fillColor = levelColor(level);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 8,
      }}>
        <label style={lbl()}>{t('executionLevel')}</label>
        <span style={{
          fontSize: 13, color: C.text, fontWeight: 700,
          fontFamily: FONT_DISPLAY,
        }}>
          {level}/10 · {t(`execLevel_${level}`)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 3, width: '100%' }}>
        {Array.from({ length: 10 }, (_, i) => {
          const segLevel = i + 1;
          const filled = segLevel <= level;
          return (
            <button
              key={segLevel}
              onClick={() => onChange(segLevel * 10)}
              aria-label={`${t('executionLevel')} ${segLevel}`}
              style={{
                flex: 1, height: 28, borderRadius: 4,
                background: filled ? fillColor : 'transparent',
                border: filled ? 'none' : `1px solid ${C.border}`,
                cursor: 'pointer', padding: 0,
                transition: 'all 0.15s',
              }}
            />
          );
        })}
      </div>
      <div style={{
        fontSize: 11, color: C.textMuted, fontStyle: 'italic',
        marginTop: 6, fontFamily: FONT_BODY,
      }}>
        {t(`execSub_${level}`)}
      </div>
    </div>
  );
};
