import React from "react";
import { FONT_DISPLAY } from "../../constants/fonts";
import { Ic } from "./Ic";

/**
 * Shared circular avatar with fallback chain:
 *  1. profilePhoto (custom uploaded base64)
 *  2. fbUser.photo  (Google auth URL)
 *  3. Initials circle (first letter of nickname or fbUser.name)
 *  4. Generic user icon
 */
export const ProfileAvatar = ({ profilePhoto, fbUser, nickname, size = 36, C, onClick, style, id }) => {
  const src = profilePhoto || fbUser?.photo || null;
  const name = nickname || fbUser?.name || "";
  const initial = name.trim().charAt(0).toUpperCase();

  const baseStyle = {
    width: size, height: size, borderRadius: "50%", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, border: `1.5px solid ${C.border}`,
    ...style,
  };

  const content = src ? (
    <img src={src} alt={name} style={{ width: size, height: size, objectFit: "cover", display: "block" }} />
  ) : initial ? (
    <div style={{ width: size, height: size, background: C.accent, display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#fff", fontWeight: 900, fontSize: Math.round(size * 0.44),
        fontFamily: FONT_DISPLAY, letterSpacing: 0.5, lineHeight: 1 }}>{initial}</span>
    </div>
  ) : (
    <div style={{ width: size, height: size, background: C.surfaceAlt, display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <Ic n="user" s={Math.round(size * 0.5)} c={C.textMuted} />
    </div>
  );

  if (onClick) {
    return (
      <button id={id} onClick={onClick}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, ...baseStyle }}>
        {content}
      </button>
    );
  }

  return <div id={id} style={baseStyle}>{content}</div>;
};
