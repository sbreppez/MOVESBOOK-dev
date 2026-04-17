import React from 'react';
import { C } from '../../constants/colors';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { Ic } from '../shared/Ic';
import { useT } from '../../hooks/useTranslation';

const TOOLS = [
  { key: 'explore',  title: 'EXPLORE',                   stripe: '#4A90C4', descKey: 'exploreBrief' },
  { key: 'rrr',      title: 'RESTORE / REMIX / REBUILD', stripe: '#C4453E', descKey: 'rrrBrief' },
  { key: 'combine',  title: 'COMBINE',                   stripe: '#D4943A', descKey: 'combineBrief' },
  { key: 'map',      title: 'MAP',                       stripe: '#3A9E9E', descKey: 'mapBrief' },
  { key: 'flow',     title: 'FLOW',                      stripe: '#8B6AAE', descKey: 'flowBrief' },
];

export const CreateOverlay = ({ onOpenExplore, onOpenRRR, onOpenCombine, onOpenMap, onOpenFlow, onClose }) => {
  const t = useT();

  const handlers = {
    explore: onOpenExplore,
    rrr: onOpenRRR,
    combine: onOpenCombine,
    map: onOpenMap,
    flow: onOpenFlow,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 8px',
      }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 16, letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>
          {t('creativeTools')}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Ic n="x" s={18} c={C.textMuted} />
        </button>
      </div>

      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TOOLS.map(tool => (
          <button key={tool.key} onClick={() => { onClose(); handlers[tool.key]?.(); }}
            style={{
              background: C.surface, borderRadius: 8, padding: '14px 14px 14px 18px',
              border: 'none', borderLeft: `4px solid ${tool.stripe}`,
              textAlign: 'left', cursor: 'pointer', width: '100%',
            }}>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 14, letterSpacing: 1.5,
              color: tool.stripe, textTransform: 'uppercase',
            }}>
              {tool.title}
            </div>
            <div style={{
              fontFamily: FONT_BODY, fontSize: 13, color: C.textSec, marginTop: 4, lineHeight: 1.5,
            }}>
              {t(tool.descKey)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
