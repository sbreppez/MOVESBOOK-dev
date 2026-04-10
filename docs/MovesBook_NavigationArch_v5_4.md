# NAVIGATION ARCHITECTURE v5.4

Read this after Master Context v5.4.

**You must follow this navigation architecture for ALL features.**
It overrides any placement instructions from v5.3 or earlier.

---

## BOTTOM BAR

```
  HOME    MOVES    [+]    BATTLE    REFLECT
```

Icons above labels. Each tab has an Ic icon (s=18) above a text label. Active tab: C.accent color + 3px bottom border. Inactive: C.textMuted. + button: 48px circle, C.accent bg, white "+" icon, floats with translateY(-10px). No borderTop on bar. Bar background: C.bg. Height: 58px. Labels: fontSize 12, FONT_DISPLAY, uppercase, fontWeight 800, letterSpacing 1.2.

Tab icons: home→"home", moves→"book", battle→"sword", reflect→"barChart"

---

## + BUTTON — CONTEXTUAL

The + button is **contextual** — its action depends on which tab and sub-tab is active.

**Architecture:** App.jsx increments `addTick` on press. Each page receives it as `onAddTrigger` and routes internally. App.jsx has NO BottomSheet for + — each page owns its own.

| Tab | Sub-tab | + action |
|-----|---------|----------|
| HOME | — | HomeAddPicker BottomSheet: Add Routine, Add Idea, Add Goal/Habit |
| MOVES | Library | Library BottomSheet: Add Move, Bulk Import, Add Category, Tools |
| MOVES | Sets | → Add Set directly (skip sheet) |
| MOVES | Gap | → Open Drill directly (skip sheet) |
| BATTLE | Plan | → Add Round directly (skip sheet) |
| BATTLE | Prep | → Add Battle directly (skip sheet) |
| BATTLE | Freestyle | → Opens move picker (skip sheet) |
| BATTLE | Rivals | Rivals BottomSheet: Add Rival, Add Sparring Mate, Add Crew |
| REFLECT | Calendar | Calendar BottomSheet: Training, Battle Event, Rest Day, Journal Event |
| REFLECT | Stance | → Update Stance directly (skip sheet) |
| REFLECT | Goals | → Opens type chooser (Goal/Target) directly |
| REFLECT | Notes | → Add Note directly (skip sheet) |

---

## HEADER

Left to right: MOVESBOOK logo → [spacer] → Settings sprocket → Profile avatar

Settings sprocket: Ic "cog". Tap → opens SettingsModal.
Profile avatar: tap → Profile overlay.

---

## HOME TAB

No sub-tabs. Single scrollable screen.

**Layout (top to bottom):**
1. Header row: Month name + year (localized, fontSize 14, FONT_DISPLAY, padding "8px 16px") + gear icon (moreH)
2. **SectionBrief**: "Add your daily routines, notes and pin tasks for the day." (key: `homeBrief`)
3. Week strip (7 days, today highlighted)
4. Tile stack (Routine, Idea, Goal/Habit tiles)

**+ on HOME:** Opens HomeAddPicker BottomSheet (Add Routine, Add Idea, Add Goal/Habit).

**Gear icon** → BottomSheet (Reorder tiles / Manage routines / Reset today).

**Default state:** Empty. No seed tiles for new users.

---

## MOVES TAB

Sub-tabs: **LIBRARY · SETS · GAP**

All sub-tab labels uppercase, FONT_DISPLAY, fontSize 14.

### LIBRARY sub-tab

Layout (top to bottom):
1. Sub-tabs row (LIBRARY active)
2. **SectionBrief**: "All your moves in one place, organised and ready to grow." + stat: "[count] moves across [count] categories"
3. **Icon row** (right-aligned): Filter (Ic "filter") + View toggle (Ic cycles: "list" → "grid" → "gitFork") + Search (Ic "search") + Reorder. Bare icons, no borders, gap:8, padding:4, C.textSec color.
4. Category tiles (C.surface bg, borderRadius 8, left-edge color stripe, no outline borders)

**+ on Library:** Opens Library BottomSheet (Add Move, Bulk Import, Add Category, Tools).

### SETS sub-tab

Layout:
1. Sub-tabs row (SETS active)
2. **SectionBrief**: "Group moves into themed sets for focused training and flash card sessions." + stat: "[count] sets"
3. Set cards
4. Flash Cards button in header area (visible when 1+ sets with moves)

**+ on Sets:** → Add Set directly (skip sheet).

### GAP sub-tab

Layout:
1. Sub-tabs row (GAP active)
2. **SectionBrief**: "Moves that need attention — stale, low mastery, or missing from your practice." + stat: "[count] moves need work"
3. Filter chips (7 DAYS / 14 DAYS / 30 DAYS / CUSTOM)
4. Summary bar with progress ring
5. Move cards: C.surface bg, borderRadius 8, left-edge stripe in **category color** (not staleness color), padding 14px 16px, move name fontSize 16
6. DRILL button: **ghost/outline** (transparent bg, 1px solid catCol, text catCol) — uses category color, not accent
7. Mastery bar + percentage: uses category color
8. No outline borders on tiles

**+ on Gap:** → Opens Drill directly (skip sheet).

---

## CREATE OVERLAY

Accessed via MOVES Library BottomSheet → "Tools" option.

Full-screen overlay. Header visible. Bottom bar visible. Close X returns to previous state.

Layout:
1. Title: "CREATE" (FONT_DISPLAY, uppercase, bold)
2. 4 tool tiles, each with:
   - Left-edge color stripe (4px)
   - Title in stripe color (FONT_DISPLAY, bold, uppercase)
   - Description in C.textSec (~13px, 1-2 lines)
   - No card borders
   - borderRadius 8
   - Background C.surface

Tiles:

| Tool | Stripe color | Title | Description |
|------|-------------|-------|-------------|
| Explore | #4A90C4 | EXPLORE | Constraints breed invention — the weirder the combo, the more original the result. |
| R/R/R | #C4453E | RESTORE / REMIX / REBUILD | Three ways to evolve your existing vocabulary. Pick a move and choose your path. |
| Combine | #D4943A | COMBINE | Spin random combinations from your move library. The stranger the combo, the more you learn. |
| Map | #3A9E9E | MAP | Map how your moves connect. Every explored pairing reveals your personal movement vocabulary. |

Tap tile → close Create overlay → open corresponding tool overlay (Lab, RestoreRemixRebuild, ComboMachine, FlowMap).

Premium check: each tool tap checks `isPremium`. If not premium, shows PremiumGate instead.

---

## BATTLE TAB

Sub-tabs: **PLAN · PREP · FREESTYLE · RIVALS**

All sub-tab labels uppercase, FONT_DISPLAY, fontSize 14.

### PLAN sub-tab
1. Sub-tabs row (PLAN active)
2. **SectionBrief**: "Build your battle strategy round by round. Organise entries and simulate competition pressure." + stat: "[count] rounds configured"
3. ROUNDS header (fontSize 14, FONT_DISPLAY) + icon row (bare icons, gap:8): refreshCw (reset), download (load template), upload (save template), ⇅ (reorder)
4. Simulate Competition button — **ghost/outline style** (transparent bg, 1px solid C.accent border, C.accent text). NOT a filled red button.
5. Round Arc legend (collapsible)
6. Round cards: C.surface bg, left-edge color stripe, borderRadius 8, padding 14px 16px, title fontSize 16, **collapsed by default** (`isOpen = expRounds[round.id] === true`)
7. Entry count + chevrons: C.textMuted (not colored)

**+ on Plan:** → Add Round directly (skip sheet).

### PREP sub-tab
1. Sub-tabs row (PREP active)
2. **SectionBrief**: "Track upcoming battles, prepare your game plan, and review past performances."
3. Battle cards with countdown
4. Battle History at bottom

**+ on Prep:** → Add Battle directly (skip sheet).

### FREESTYLE sub-tab
1. Sub-tabs row (FREESTYLE active)
2. **SectionBrief**: "Build freestyle lists from your move vocabulary."
3. TO USE header + icon row (bare icons, gap:8, padding:4, no borders): eye/eyeOff (Trust Mode), refreshCw (reset), download (load), upload (save), arrowUpDown (reorder)
4. Move list with check/uncheck, drag reorder

**+ on Freestyle:** → Opens move picker (skip sheet).

### RIVALS sub-tab
1. Sub-tabs row (RIVALS active)
2. **SectionBrief**: "Track your rivals, sparring mates, and crew."
3. Inner sub-tabs: RIVALS · SPARRING MATE · CREW (fontSize 14, span underline, no bg)
4. Person cards: borderRadius 8, name fontSize 16

**+ on Rivals:** Opens Rivals BottomSheet (Add Rival, Add Sparring Mate, Add Crew).

---

## REFLECT TAB

Sub-tabs: **CALENDAR · STANCE · GOALS · NOTES**

### CALENDAR sub-tab
1. Sub-tabs row (CALENDAR active)
2. **SectionBrief**: "Your training history at a glance. Tap any day to see what you worked on."
3. Days/Reports view toggles
4. Month grid, day detail, session journal

**+ on Calendar:** Opens Calendar BottomSheet (Training, Battle Event, Rest Day, Journal Event).

### STANCE sub-tab
1. Sub-tabs row (STANCE active)
2. **SectionBrief**: "Your breaking identity across six domains." + stat: "Last updated [date]"
3. Radar chart + domain rows
4. Update My Stance button

**+ on Stance:** → Update Stance directly (skip sheet).

### GOALS sub-tab
1. Sub-tabs row (GOALS active)
2. **SectionBrief**: "Long-term goals and measurable targets." + stat: "[count] active goals"
3. Goal cards: left-edge stripe only, NO bottom bar, NO top gradient bar
4. Progress bars inside expanded targets

**+ on Goals:** → Opens type chooser (Goal/Target) directly.

### NOTES sub-tab
1. Sub-tabs row (NOTES active)
2. **SectionBrief**: "Thoughts, reflections, and session notes." + stat: "[count] notes"
3. Note cards: left-edge stripe only, NO bottom bar, NO top gradient bar

**+ on Notes:** → Add Note directly (skip sheet).

---

## TOOL OVERLAYS

Each tool (Explore, R/R/R, Combine, Map) renders as a full-screen overlay. Header visible, bottom bar visible, close X returns.

Each tool overlay has its own **SectionBrief** at the top:

| Tool | desc | stat |
|------|------|------|
| Explore | Constraints breed invention — the weirder the combo, the more original the result. | 4 creative modes to spark new movement ideas |
| R/R/R | Three ways to evolve your existing vocabulary. Pick a move and choose your path. | Select a move to begin |
| Combine | Spin random combinations from your move library. The stranger the combo, the more you learn. | [count] moves in your library |
| Map | Map how your moves connect. Every explored pairing reveals your personal movement vocabulary. | [X] of [Y] connections explored ([Z]%) |

---

## PROFILE OVERLAY

Accessed via header avatar tap.

Contains: Identity fields, MyStance section, Development Story, Breaking goals, Why breaking, My Notes, Settings, User Manual, Legal (Privacy/ToS/Disclaimers), Feedback, Backup, Sign out.

---

## SETTINGS

Accessed via header sprocket or inside Profile overlay.

Key settings relevant to design:
- **Theme:** dark / light (toggle)
- **Show section descriptions:** boolean, default true. Controls SectionBrief visibility across entire app.
- **Show mastery level:** boolean
- **Confirm before delete:** boolean
- **Text size:** small / medium / large
- **Language:** 11 options

---

## TRAINING TOOLS — ACCESS POINTS

| Tool | Access |
|------|--------|
| Explore | MOVES Library BottomSheet → Tools → Create overlay → Explore tile |
| R/R/R | MOVES Library BottomSheet → Tools → Create overlay → R/R/R tile |
| Combine | MOVES Library BottomSheet → Tools → Create overlay → Combine tile |
| Map | MOVES Library BottomSheet → Tools → Create overlay → Map tile |
| Drill | GAP + button / GAP Drill button on each move card |
| Spar | HOME shortcuts → Solo/1v1 chooser |
| Flow | HOME shortcuts |
| Flash Cards | MOVES > SETS header button |

---

## SECTIONBRIEF PLACEMENT SUMMARY

SectionBrief appears on these screens (and ONLY these screens):

**HOME tab:** Below month header, above week strip
**MOVES tab:** Library, Sets, Gap
**BATTLE tab:** Plan, Prep, Freestyle, Rivals
**REFLECT tab:** Calendar, Stance, Goals, Notes
**Tool overlays:** Explore, R/R/R, Combine, Map

---

## TRANSLATION RULE

ALL new translation keys must be added to ALL 11 languages: en, it, es, fr, pt, de, ja, zh, ru, ko, vi.

---

## DATA PERSISTENCE RULE

Every new feature that stores data must:
1. Save to localStorage under a unique key
2. Sync to Firestore via MB_DB.save()
3. Load from Firestore on auth resolution
4. Handle localStorage/Firestore mismatch

---

## WHAT DOESN'T CHANGE

- No feature logic changes — every component works as built
- No data schema changes
- No Firebase changes
- Ic component unchanged
- FONT_DISPLAY / FONT_BODY unchanged
- All existing localStorage keys preserved
- Premium system unchanged

---

## REMOVED FEATURES — DO NOT BUILD

Daily Word, Constraint Cards, Mirror Mode, Warm Flow, Body Care Habit Suggestions.
The old TRAIN tab no longer exists.

**— END OF NAVIGATION ARCHITECTURE v5.4 —**
