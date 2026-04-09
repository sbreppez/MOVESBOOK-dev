import { C } from './colors';
import { FONT_DISPLAY, FONT_BODY } from './fonts';

export const CARD_BASE  = () => ({ borderRadius:8, background:C.surface, overflow:"hidden", minWidth:0, display:"flex", flexDirection:"column", position:"relative" });
export const CARD_BAR   = (color) => ({ height:5, background:`linear-gradient(90deg,${color},${color}55)`, flexShrink:0 });
export const CARD_BODY  = () => ({ padding:"13px 13px 13px 13px", flex:1, display:"flex", flexDirection:"column" });

export const masteryColor = p => p < 30 ? C.red : p < 60 ? C.yellow : p < 80 ? C.blue : C.green;
export const masteryLabel = p => p < 15 ? "Just found it" : p < 35 ? "Learning" : p < 55 ? "Getting there" : p < 75 ? "Feels natural" : p < 90 ? "Looking clean" : "I like it \u2713";

export const lbl = () => ({ display:"block", fontSize:13, color:C.textSec, marginBottom:5, letterSpacing:1.2, fontWeight:700, fontFamily:FONT_DISPLAY });
export const inp = () => ({ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:FONT_BODY });
