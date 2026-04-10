# MOVESBOOK — MASTER CONTEXT v5.4

Read this at the start of every Claude Code session. Then read Navigation Architecture v5.4.

---

## WHAT IS MOVESBOOK

A mobile-first PWA for breakdancers to manage their move vocabulary, track training, and prepare for battles. Built with Vite + React 18, Firebase Auth + Firestore, localStorage offline-first, EmailJS feedback, PWA service worker.

**Philosophy:** "Mirror, not coach" — the app reflects user data without suggestions, coaching cues, or assumptions.

---

## TECH STACK

- Vite + React 18 (no external component libraries)
- Firebase Auth + Firestore
- localStorage as primary offline store
- EmailJS for feedback
- PWA service worker
- Inline React styles (no CSS files, no CSS-in-JS libraries)
- GitHub repo is source of truth
- Deployed on Vercel

---

## DESIGN SYSTEM v5.4

Full reference: `docs/MovesBook_DesignSystem_v2_0.md`

### Color Palette

Colors are managed in `src/constants/colors.js` via `buildPalette(theme)`. The `C` object is a mutable singleton — `App.jsx` calls `Object.assign(C, buildPalette(theme))` to update in-place.

**Dark mode (default):**
```
bg:          #0A0A0A      (near-black background)
surface:     #1C1C1E      (card/tile surface — lifted from bg)
surfaceAlt:  #2C2C2E      (alternate surface for sections)
surfaceHigh: #3A3A3C      (highest surface, pressed states)
border:      #3A3A3C      (input borders, dividers)
borderLight: #2C2C2E      (subtle dividers)
header:      #0A0A0A      (header + bottom bar bg)
headerText:  #E8E8E8      (header text)
accent:      #e53935      (brand red — buttons, active states, + button)
text:        #E8E8E8      (primary text — off-white, NOT pure white)
textSec:     #9E9E9E      (secondary text — descriptions, counts)
textMuted:   #6E6E6E      (muted text — hints, stats, inactive tabs)
brown:       #E8E8E8      (tracks text)
brownMid:    #9E9E9E      (tracks textSec)
brownLight:  #6E6E6E      (tracks textMuted)
green:       #1db954      yellow: #ffa726    blue: #42a5f5    red: #e53935
```

**Light mode:**
```
bg:          #F2F2F7      (warm off-white background — NOT pure white)
surface:     #FFFFFF      (white cards pop on grey bg)
surfaceAlt:  #F2F2F7      (matches bg for flat sections)
surfaceHigh: #E5E5EA      (pressed states)
border:      #D1D1D6      (input borders, dividers)
borderLight: #E5E5EA      (subtle dividers)
header:      #FFFFFF      (header + bottom bar bg)
headerText:  #1C1C1E      (header text)
accent:      #cf0000      (brand red — slightly deeper for light bg)
text:        #1C1C1E      (primary text)
textSec:     #48484A      (secondary text)
textMuted:   #8E8E93      (muted text)
brown:       #1C1C1E      brownMid: #48484A    brownLight: #8E8E93
green:       #2e7d32      yellow: #f57f17      blue: #1565c0    red: #cf0000
```

### Category Colors (harmonized jewel tones)
```
Toprocks:       #C4453E    (warm red/brick)
Godowns:        #8B6AAE    (soft purple)
Footworks:      #4A90C4    (calm blue)
Power Moves:    #D4943A    (amber gold)
Freezes:        #3D9E72    (sage green)
Transitions:    #D46A52    (terracotta)
Burns:          #8A6B54    (warm brown)
Blowups:        #3A9E9E    (teal)
Custom:         #6B7BA0    (slate blue-grey)
```

### Domain Colors
```
musicality:  #3A9E9E    performance: #C4453E    technique: #4A90C4
variety:     #D4943A    creativity:  #8B6AAE    personality: #3D9E72
```

### Preset Colors (user pickers)
```
#C4453E  #D46A52  #D4943A  #8A6B54  #3D9E72  #3A9E9E
#4A90C4  #6B7BA0  #8B6AAE  #7A5C8A  #B07A5E  #5A8A72
```

### Card & Tile Style
- Background: `C.surface`
- Border: **NONE** — no card outline borders. Surface color difference (#0A0A0A bg vs #1C1C1E surface) provides separation.
- borderRadius: **8**
- Category tiles have a **left-edge color stripe** (`borderLeft: 4px solid [categoryColor]`) — this is the ONLY border on cards. No top, bottom, right borders. No gradient bars.
- Card-to-card gaps: **6px** maximum in vertical lists
- Padding: **14px vertical, 16px horizontal**
- Goal/Note tiles (IdeaTile): left-edge stripe only. No bottom bar, no top gradient bar.

### Typography

Golden ratio scale:
```
21px — Logo
16px — Tile titles, category names, card headers, move names
14px — Sub-tab labels, section headers (ROUNDS etc.), bottom bar labels
13px — Body text, descriptions, SectionBrief desc
11px — Stats, secondary info, meta text, SectionBrief stat
```

- `FONT_DISPLAY`: 'Barlow Condensed' (headings, labels, nav)
- `FONT_BODY`: 'Barlow' (body text, descriptions)
- All headings: `textTransform: uppercase`
- CJK support: Noto Sans SC, JP, KR + Noto Sans Thai via Google Fonts

### Content Side Padding

All scrollable content areas use **16px** left and right padding. This ensures tiles, text, and icons align to the same margin.

### Icons
- Lucide icons via `Ic` component (SVG paths, no npm package)
- Default: 24×24, strokeWidth 2, round linecap/linejoin

---

## SHARED COMPONENTS

**SectionBrief** (`src/components/shared/SectionBrief.jsx`):
Brief description block shown at the top of feature screens below the title/sub-tabs.
Props: `desc` (string), `stat` (string, optional), `settings` (reads `showSectionDescriptions`).
When `showSectionDescriptions` is false, renders null.
Style: desc in C.textSec ~13px, stat in C.textMuted italic ~11px, marginTop 3. Padding 8px 12px 4px. NO divider lines.

**BottomSheet** (`src/components/shared/BottomSheet.jsx`):
Slides up, rounded top 20px, X to close + overlay tap. No grab handle. Props: open, onClose, title, children, maxHeight, zIndex.

**ExpandableText** (`src/components/shared/ExpandableText.jsx`):
Inline expand/collapse with chevron.

**Ic** (`src/components/shared/Ic.jsx`):
Lucide icon wrapper. Props: n (icon name), s (size), c (color).

---

## BOTTOM BAR

Four tab buttons with icons above labels, plus a centre + button.

```
  HOME    MOVES    [+]    BATTLE    REFLECT
```

- Each tab: Ic icon (s=18) above text label
- Tab labels: `FONT_DISPLAY`, uppercase, fontSize **12**, fontWeight 800, letterSpacing 1.2
- Active tab: `C.accent` color on icon + text, accent background tint, `3px solid C.accent` bottom border
- Inactive tabs: `C.textMuted` icon + text
- + button: **48px** circle, `C.accent` background, white plus icon, floats above bar with `translateY(-10px)`, boxShadow
- No borderTop on the bar — surface color difference provides separation
- Bar background: `C.bg`
- Height: **58px**
- Badge on MOVES tab: stale count (positioned above label)

Tab icons: home→"home", moves→"book", battle→"sword", reflect→"barChart"

---

## + BUTTON BEHAVIOUR — CONTEXTUAL

The + button is **contextual** — its action depends on which tab and sub-tab is active.

| Tab | Sub-tab | + action | Type |
|-----|---------|----------|------|
| HOME | — | Opens HomeAddPicker BottomSheet (Add Routine, Add Idea, Add Goal/Habit) | BottomSheet |
| MOVES | Library | Opens Library BottomSheet (Add Move, Bulk Import, Add Category, Tools) | BottomSheet |
| MOVES | Sets | Add Set directly | Direct |
| MOVES | Gap | Open Drill directly | Direct |
| BATTLE | Plan | Add Round directly | Direct |
| BATTLE | Prep | Add Battle directly | Direct |
| BATTLE | Freestyle | Opens move picker | Direct |
| BATTLE | Rivals | Opens Rivals BottomSheet (Add Rival, Sparring Mate, Crew) | BottomSheet |
| REFLECT | Calendar | Opens Calendar BottomSheet (Training, Battle Event, Rest Day, Journal Event) | BottomSheet |
| REFLECT | Stance | Update Stance directly | Direct |
| REFLECT | Goals | Opens type chooser (Goal/Target) | Direct |
| REFLECT | Notes | Add Note directly | Direct |

Architecture: `App.jsx` increments `addTick` on + press. Each page component receives `addTick` as `onAddTrigger` and routes internally based on its active sub-tab. App.jsx has NO BottomSheet for the + menu — each page owns its own.

---

## LANGUAGES

11 supported: en, it, es, fr, pt, de, ja, zh, ru, ko, vi
ALL new UI strings require translation keys across all 11 languages.
`useT()` hook returns `t(key)` function. Fallback chain: lang → en → key.
Breaking terminology stays in English.

---

## FEATURE DISPLAY NAMES

| Internal name | Display name |
|--------------|-------------|
| Lab | Explore |
| Combo Machine | Combine |
| Sparring | Spar |
| Rep Counter | Drill |
| Music Flow | Flow |
| Flow Map | Map |
| R/R/R | R/R/R (overlay title: RESTORE / REMIX / REBUILD) |

---

## MOVE SCHEMA

```
{ id, name, category, description, mastery, date, videoLink,
  origin: 'learned'|'version'|'creation',
  musicEnergy: 'slow'|'mid'|'fast'|'heavy'|'any'|null,
  parentId: string|null,
  attrs: { [customAttrId]: value } }
```

---

## DATA STORAGE

All localStorage keys: mb_moves, mb_sets, mb_rounds, mb_ideas, mb_habits, mb_profile, mb_settings, mb_templates, mb_cats, mb_cat_colors, mb_custom_attrs, mb_data_version, mb_reps, mb_sparring, mb_combos, mb_flowmap, mb_battleprep, mb_calendar, mb_lab, mb_freestyle, mb_reminders, mb_rrr, mb_stance, mb_rivals, mb_musicflow, mb_reflections, mb_blocks, mb_schedule, mb_injuries, mb_presession, mb_reports, mb_home_stack, mb_home_ideas, mb_home_checks, mb_home_migrated, mb_flashcards

All sync to Firestore via MB_DB.save(). Debounced. Offline-first.

---

## DEFAULT STATE — NEW USERS

New users start with an **empty app**:
- `INIT_IDEAS = []` — no default goals or notes
- `homeStack = { defaultStack: [], overrides: {} }` — no default home tiles
- No seed data in home or reflect

Existing seed data for moves, sets, rounds, and habits may still exist but is being phased out.

---

## PREMIUM SYSTEM

**Free:** Move library, Sets, Battle Plan, Freestyle, Goals, Habits, Notes, Calendar, Drill, Backup.

**Premium ($4.99/month, $39.99/year, $79.99 lifetime AUD):** MyStance, Move Lineage, Origin, Explore, Flow, Spar (Solo + 1v1), Combine, GAP, Map, Round Arc, Rivals (all sub-tabs), Battle Prep, Competition Simulator, R/R/R, Post-Session Reflection, Development Story, Shareable Cards, Flash Cards, Reports, Injuries, Sparring GAP.

---

## OVERLAY PATTERN

All overlays render INSIDE content area div (below app header).
App header: ALWAYS visible.
Tab bar / sub-tabs: HIDDEN when overlay open.
Bottom bar: VISIBLE.
Close button (X): returns to previous state.

---

## REMOVED FEATURES — DO NOT BUILD

Daily Word, Constraint Cards, Mirror Mode, Warm Flow, Body Care Habit Suggestions, Manage Constraints overlay. If any prompt references these, IGNORE.

---

**— END OF MASTER CONTEXT v5.4 —**
