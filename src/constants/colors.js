export const buildPalette = (theme) => {
  const accent = theme === "dark" ? "#e53935" : "#cf0000";
  if (theme === "dark") return {
    bg:           "#0A0A0A",
    surface:      "#1C1C1E",
    surfaceAlt:   "#2C2C2E",
    surfaceHigh:  "#3A3A3C",
    border:       "#3A3A3C",
    borderLight:  "#2C2C2E",
    header:       "#0A0A0A",
    headerText:   "#E8E8E8",
    accent,
    accentLight:  accent,
    accentWarm:   "#e53935",
    brown:        "#E8E8E8",
    brownMid:     "#9E9E9E",
    brownLight:   "#6E6E6E",
    text:         "#E8E8E8",
    textSec:      "#9E9E9E",
    textMuted:    "#6E6E6E",
    green:        "#1db954",
    yellow:       "#ffa726",
    blue:         "#42a5f5",
    red:          "#e53935",
  };
  return {
    bg:           "#F2F2F7",
    surface:      "#FFFFFF",
    surfaceAlt:   "#F2F2F7",
    surfaceHigh:  "#E5E5EA",
    border:       "#D1D1D6",
    borderLight:  "#E5E5EA",
    header:       "#FFFFFF",
    headerText:   "#1C1C1E",
    accent,
    accentLight:  accent,
    accentWarm:   "#cf0000",
    brown:        "#1C1C1E",
    brownMid:     "#48484A",
    brownLight:   "#8E8E93",
    text:         "#1C1C1E",
    textSec:      "#48484A",
    textMuted:    "#8E8E93",
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

export const PRESET_COLORS = ["#C4453E","#D46A52","#D4943A","#8A6B54","#3D9E72","#3A9E9E","#4A90C4","#6B7BA0","#8B6AAE","#7A5C8A","#B07A5E","#5A8A72"];
