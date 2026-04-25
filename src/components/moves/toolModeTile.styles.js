import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';

export const toolModeTileStyle = (stripeColor, C) => ({
  background: C.surface,
  borderRadius: 8,
  border: 'none',
  borderLeft: `4px solid ${stripeColor}`,
  padding: '14px 14px 14px 18px',
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
});

export const toolModeTitleStyle = (stripeColor) => ({
  fontFamily: FONT_DISPLAY,
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: 1.5,
  color: stripeColor,
  textTransform: 'uppercase',
});

export const toolModeDescStyle = (C) => ({
  fontFamily: FONT_BODY,
  fontSize: 13,
  color: C.textSec,
  marginTop: 4,
  lineHeight: 1.5,
  fontStyle: 'normal',
});

export const toolListContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '8px 0',
};

export const toolHeaderStyle = () => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px 8px',
  background: 'transparent',
  borderBottom: 'none',
  flexShrink: 0,
});

export const toolHeaderTitleStyle = (C) => ({
  fontFamily: FONT_DISPLAY,
  fontWeight: 900,
  fontSize: 16,
  letterSpacing: 2,
  color: C.text,
  textTransform: 'uppercase',
});

export const toolBackButtonStyle = (C) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: C.accent,
  fontSize: 14,
  fontFamily: FONT_DISPLAY,
  fontWeight: 700,
  padding: 0,
});
