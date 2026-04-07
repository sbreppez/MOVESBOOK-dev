export const buildPalette = (theme) => {
  const accent = theme === "dark" ? "#e53935" : "#cf0000";
  if (theme === "dark") return {
    bg:           "#121212",
    surface:      "#1e1e1e",
    surfaceAlt:   "#282828",
    surfaceHigh:  "#323232",
    border:       "#3a3a3a",
    borderLight:  "#2a2a2a",
    header:       "#0a0a0a",
    headerText:   "#ffffff",
    accent,
    accentLight:  accent,
    accentWarm:   "#e53935",
    brown:        "#ffffff",
    brownMid:     "#b3b3b3",
    brownLight:   "#7a7a7a",
    text:         "#ffffff",
    textSec:      "#b3b3b3",
    textMuted:    "#7a7a7a",
    green:        "#1db954",
    yellow:       "#ffa726",
    blue:         "#42a5f5",
    red:          "#e53935",
  };
  return {
    bg:           "#ffffff",
    surface:      "#f8f8f8",
    surfaceAlt:   "#f0f0f0",
    surfaceHigh:  "#e8e8e8",
    border:       "#dddddd",
    borderLight:  "#eeeeee",
    header:       "#ffffff",
    headerText:   "#111111",
    accent,
    accentLight:  accent,
    accentWarm:   "#cf0000",
    brown:        "#111111",
    brownMid:     "#333333",
    brownLight:   "#666666",
    text:         "#111111",
    textSec:      "#444444",
    textMuted:    "#888888",
    green:        "#2e7d32",
    yellow:       "#f57f17",
    blue:         "#1565c0",
    red:          "#cf0000",
  };
};

// Mutable palette object — shared across all modules via ES module singleton
// App.jsx calls Object.assign(C, buildPalette(theme)) to update in-place
export let C = buildPalette("light");

export const FONT_SIZES = { small: 0.88, medium: 1, large: 1.14 };

export const PRESET_COLORS = ["#8b1a1a","#2a5f8a","#b5850a","#2d6a4f","#6b3a8a","#c0391b","#8a3a2a","#1a6a6a","#4a4a6a","#1a6a3a","#8a5a1a","#2a3a8a"];
