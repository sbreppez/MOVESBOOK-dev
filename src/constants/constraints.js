import { todayLocal } from '../utils/dateUtils';

// ── Constraint Card: themes, pool (72 constraints), and daily-pick utilities ──

export const CONSTRAINT_THEMES = [
  { id: "foundation",  nameKey: "constraintThemeFoundation",  color: "#4A90C4" },
  { id: "power",       nameKey: "constraintThemePower",       color: "#D4943A" },
  { id: "freezes",     nameKey: "constraintThemeFreezes",     color: "#3D9E72" },
  { id: "direction",   nameKey: "constraintThemeDirection",   color: "#8B6AAE" },
  { id: "opposite",    nameKey: "constraintThemeOpposite",    color: "#D46A52" },
  { id: "transitions", nameKey: "constraintThemeTransitions", color: "#C4453E" },
  { id: "musicality",  nameKey: "constraintThemeMusicality",  color: "#3A9E9E" },
  { id: "abstract",    nameKey: "constraintThemeAbstract",    color: "#8A6B54" },
  { id: "music",       nameKey: "constraintThemeMusic",       color: "#7A5C8A" },
  { id: "cultural",    nameKey: "constraintThemeCultural",    color: "#B07A5E" },
  { id: "custom",      nameKey: "constraintThemeCustom",      color: "#6B7BA0" },
];

export const CONSTRAINT_POOL = [
  // ── Foundation & Footwork (6) ──
  { id:"c_001", textKey:"constraint001", theme:"foundation",  mode:"restore" },
  { id:"c_002", textKey:"constraint002", theme:"foundation",  mode:"remix"   },
  { id:"c_003", textKey:"constraint003", theme:"foundation",  mode:"remix"   },
  { id:"c_004", textKey:"constraint004", theme:"foundation",  mode:"restore" },
  { id:"c_005", textKey:"constraint005", theme:"foundation",  mode:"remix"   },
  { id:"c_006", textKey:"constraint006", theme:"foundation",  mode:"restore" },
  // ── Power & Airwork (4) ──
  { id:"c_007", textKey:"constraint007", theme:"power",       mode:"restore" },
  { id:"c_008", textKey:"constraint008", theme:"power",       mode:"remix"   },
  { id:"c_009", textKey:"constraint009", theme:"power",       mode:"remix"   },
  { id:"c_010", textKey:"constraint010", theme:"power",       mode:"remix"   },
  // ── Freezes & Control (5) ──
  { id:"c_011", textKey:"constraint011", theme:"freezes",     mode:"remix"   },
  { id:"c_012", textKey:"constraint012", theme:"freezes",     mode:"remix"   },
  { id:"c_013", textKey:"constraint013", theme:"freezes",     mode:"remix"   },
  { id:"c_014", textKey:"constraint014", theme:"freezes",     mode:"rebuild" },
  { id:"c_015", textKey:"constraint015", theme:"freezes",     mode:"rebuild" },
  // ── Direction & Levels (4) ──
  { id:"c_016", textKey:"constraint016", theme:"direction",   mode:"remix"   },
  { id:"c_017", textKey:"constraint017", theme:"direction",   mode:"remix"   },
  { id:"c_018", textKey:"constraint018", theme:"direction",   mode:"remix"   },
  { id:"c_019", textKey:"constraint019", theme:"direction",   mode:"restore" },
  // ── Opposite Side & Balance (4) ──
  { id:"c_020", textKey:"constraint020", theme:"opposite",    mode:"restore" },
  { id:"c_021", textKey:"constraint021", theme:"opposite",    mode:"remix"   },
  { id:"c_022", textKey:"constraint022", theme:"opposite",    mode:"remix"   },
  { id:"c_023", textKey:"constraint023", theme:"opposite",    mode:"remix"   },
  // ── Transitions & Flow (3) ──
  { id:"c_024", textKey:"constraint024", theme:"transitions", mode:"remix"   },
  { id:"c_025", textKey:"constraint025", theme:"transitions", mode:"remix"   },
  { id:"c_026", textKey:"constraint026", theme:"transitions", mode:"remix"   },
  // ── Musicality & Tempo (6) ──
  { id:"c_027", textKey:"constraint027", theme:"musicality",  mode:"restore" },
  { id:"c_028", textKey:"constraint028", theme:"musicality",  mode:"remix"   },
  { id:"c_029", textKey:"constraint029", theme:"musicality",  mode:"remix"   },
  { id:"c_030", textKey:"constraint030", theme:"musicality",  mode:"remix"   },
  { id:"c_031", textKey:"constraint031", theme:"musicality",  mode:"remix"   },
  { id:"c_032", textKey:"constraint032", theme:"musicality",  mode:"remix"   },
  // ── Abstract Creativity (10) ──
  { id:"c_033", textKey:"constraint033", theme:"abstract",    mode:"rebuild" },
  { id:"c_034", textKey:"constraint034", theme:"abstract",    mode:"rebuild" },
  { id:"c_035", textKey:"constraint035", theme:"abstract",    mode:"rebuild" },
  { id:"c_036", textKey:"constraint036", theme:"abstract",    mode:"rebuild" },
  { id:"c_037", textKey:"constraint037", theme:"abstract",    mode:"rebuild" },
  { id:"c_038", textKey:"constraint038", theme:"abstract",    mode:"rebuild" },
  { id:"c_039", textKey:"constraint039", theme:"abstract",    mode:"rebuild" },
  { id:"c_040", textKey:"constraint040", theme:"abstract",    mode:"rebuild" },
  { id:"c_041", textKey:"constraint041", theme:"abstract",    mode:"rebuild" },
  { id:"c_042", textKey:"constraint042", theme:"abstract",    mode:"rebuild" },
  // ── Music & Genre (18) ──
  { id:"c_043", textKey:"constraint043", theme:"music",       mode:"restore" },
  { id:"c_044", textKey:"constraint044", theme:"music",       mode:"restore" },
  { id:"c_045", textKey:"constraint045", theme:"music",       mode:"restore" },
  { id:"c_046", textKey:"constraint046", theme:"music",       mode:"remix"   },
  { id:"c_047", textKey:"constraint047", theme:"music",       mode:"remix"   },
  { id:"c_048", textKey:"constraint048", theme:"music",       mode:"remix"   },
  { id:"c_049", textKey:"constraint049", theme:"music",       mode:"restore" },
  { id:"c_050", textKey:"constraint050", theme:"music",       mode:"remix"   },
  { id:"c_051", textKey:"constraint051", theme:"music",       mode:"remix"   },
  { id:"c_052", textKey:"constraint052", theme:"music",       mode:"remix"   },
  { id:"c_053", textKey:"constraint053", theme:"music",       mode:"rebuild" },
  { id:"c_054", textKey:"constraint054", theme:"music",       mode:"rebuild" },
  { id:"c_055", textKey:"constraint055", theme:"music",       mode:"rebuild" },
  { id:"c_056", textKey:"constraint056", theme:"music",       mode:"remix"   },
  { id:"c_057", textKey:"constraint057", theme:"music",       mode:"remix"   },
  { id:"c_058", textKey:"constraint058", theme:"music",       mode:"remix"   },
  { id:"c_059", textKey:"constraint059", theme:"music",       mode:"rebuild" },
  { id:"c_060", textKey:"constraint060", theme:"music",       mode:"rebuild" },
  // ── Cultural Wisdom (12) ──
  { id:"c_061", textKey:"constraint061", theme:"cultural",    mode:"restore" },
  { id:"c_062", textKey:"constraint062", theme:"cultural",    mode:"restore" },
  { id:"c_063", textKey:"constraint063", theme:"cultural",    mode:"restore" },
  { id:"c_064", textKey:"constraint064", theme:"cultural",    mode:"rebuild" },
  { id:"c_065", textKey:"constraint065", theme:"cultural",    mode:"restore" },
  { id:"c_066", textKey:"constraint066", theme:"cultural",    mode:"remix"   },
  { id:"c_067", textKey:"constraint067", theme:"cultural",    mode:"restore" },
  { id:"c_068", textKey:"constraint068", theme:"cultural",    mode:"restore" },
  { id:"c_069", textKey:"constraint069", theme:"cultural",    mode:"restore" },
  { id:"c_070", textKey:"constraint070", theme:"cultural",    mode:"remix"   },
  { id:"c_071", textKey:"constraint071", theme:"cultural",    mode:"restore" },
  { id:"c_072", textKey:"constraint072", theme:"cultural",    mode:"restore" },
];

// ── Helpers ──

export const todayString = () => todayLocal();

/** Build the active pool from state: built-in minus removed, plus custom, filtered by modeFilter */
export const buildActivePool = (state) => {
  const removed = new Set(state.removedConstraints || []);
  const mf = state.modeFilter || null;
  const builtIn = CONSTRAINT_POOL.filter(c => !removed.has(c.id) && (!mf || c.mode === mf));
  const custom = (state.customConstraints || [])
    .filter(c => !mf || c.mode === mf)
    .map(c => ({
      id: c.id, textKey: null, text: c.text, theme: "custom", mode: c.mode || "rebuild",
    }));
  return [...builtIn, ...custom];
};

/** Pick a random constraint from pool, avoiding excludeId when possible */
export const pickRandomConstraint = (pool, excludeId) => {
  if (!pool || pool.length === 0) return null;
  const filtered = pool.filter(c => c.id !== excludeId);
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
};

/** Look up theme object by id */
export const getTheme = (themeId) =>
  CONSTRAINT_THEMES.find(t => t.id === themeId) || CONSTRAINT_THEMES[CONSTRAINT_THEMES.length - 1];

/** Default state for mb_constraint */
export const getDefaultConstraintState = () => ({
  date: null,
  constraintId: null,
  constraintText: null,
  theme: null,
  mode: null,
  dismissed: false,
  modeFilter: null,
  customConstraints: [],
  removedConstraints: [],
});
