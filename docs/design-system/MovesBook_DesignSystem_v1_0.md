# MOVESBOOK DESIGN SYSTEM v1.0

Single source of truth for all visual decisions. Every Claude Code session must reference this document. Place in Claude project files AND in `docs/design-system/` in the repo.

---

## COLOR PALETTE

Managed in `src/constants/colors.js` via `buildPalette(theme)`.

### Dark mode (default)
```
bg:          #0A0A0A      near-black background
surface:     #1C1C1E      card/tile surface
surfaceAlt:  #2C2C2E      alternate surface
surfaceHigh: #3A3A3C      pressed states
border:      #3A3A3C      input borders, dividers
borderLight: #2C2C2E      subtle dividers
header:      #0A0A0A      header + bottom bar bg
headerText:  #E8E8E8      header text
accent:      #e53935      brand red
text:        #E8E8E8      primary text (off-white, NOT pure white)
textSec:     #9E9E9E      secondary text
textMuted:   #6E6E6E      muted text, inactive tabs
```

### Light mode
```
bg:          #F2F2F7      warm off-white (NOT pure white)
surface:     #FFFFFF      card surface
surfaceAlt:  #F2F2F7      flat sections
surfaceHigh: #E5E5EA      pressed states
border:      #D1D1D6      input borders, dividers
borderLight: #E5E5EA      subtle dividers
header:      #FFFFFF      header + bottom bar bg
headerText:  #1C1C1E      header text
accent:      #cf0000      brand red (deeper for light bg)
text:        #1C1C1E      primary text
textSec:     #48484A      secondary text
textMuted:   #8E8E93      muted text, inactive tabs
```

### Semantic colors (same both modes)
```
Dark:   green #1db954   yellow #ffa726   blue #42a5f5   red #e53935
Light:  green #2e7d32   yellow #f57f17   blue #1565c0   red #cf0000
```

---

## CATEGORY COLORS (harmonized jewel tones)

```
Toprocks:      #C4453E    warm red / brick
Godowns:       #8B6AAE    soft purple
Footworks:     #4A90C4    calm blue
Power Moves:   #D4943A    amber gold
Freezes:       #3D9E72    sage green
Transitions:   #D46A52    terracotta
Burns:         #8A6B54    warm brown
Blowups:       #3A9E9E    teal
Custom:        #6B7BA0    slate blue-grey
```

### Domain colors
```
musicality:   #3A9E9E    performance: #C4453E    technique:   #4A90C4
variety:      #D4943A    creativity:  #8B6AAE    personality: #3D9E72
```

### Preset colors (user pickers)
```
#C4453E  #D46A52  #D4943A  #8A6B54  #3D9E72  #3A9E9E
#4A90C4  #6B7BA0  #8B6AAE  #7A5C8A  #B07A5E  #5A8A72
```

---

## TYPOGRAPHY SCALE

Based on golden ratio (√φ ≈ 1.272). Four core steps plus two practical intermediates.

| Step | Size | Ratio | Use |
|------|------|-------|-----|
| XS | 10px | — | Mastery %, timestamps, micro labels |
| S | 11px | ×1.1 | Stats, hints, bottom bar labels, SectionBrief stat |
| M | 13px | ×1.18 | Body text, descriptions, move counts, SectionBrief desc |
| M+ | 14px | ×1.08 | Sub-tab labels (LIBRARY/SETS/GAP etc.) |
| L | 16px | ×1.14 | Category names, tile headers, prominent text |
| XL | 21px | ×1.31 | Page titles, MOVESBOOK logo |

### Font families
- `FONT_DISPLAY` ('Barlow Condensed'): headings, labels, nav, category names
- `FONT_BODY` ('Barlow'): body text, descriptions
- All headings: `textTransform: uppercase`

### Font weights
- 800: headings, labels, category names, sub-tabs
- 700: emphasis, counts, buttons
- 400: body text, descriptions

### Letter spacing
- Sub-tabs: 1.5
- Category names: 1.2
- Bottom bar: 1.2
- General labels: 1.0

---

## SPACING SCALE

Fibonacci-based with practical additions.

| Value | Use |
|-------|-----|
| 3px | Micro gaps (dot to text, stat margin-top) |
| 5px | Small gaps (tile-to-tile in pure Fibonacci — current app uses 6) |
| 6px | Tile-to-tile gap (practical compromise) |
| 8px | Icon row internal gaps, medium padding |
| 13px | Standard internal padding, section gaps |
| 16px | Tile padding (horizontal), content area side padding |
| 14px | Tile padding (vertical) |
| 21px | Large section spacing |
| 34px | + button diameter (practical: app uses 36px) |

---

## ICON SIZES

| Size | Use |
|------|-----|
| 13px | Small icons (chevron, menu dots, mastery indicator) |
| 16px | Standard icons (filter, view, search, sort, toolbar) |
| 18px | Header icons (settings cog) |
| 21px | + button inner icon |

All icons via `Ic` component (Lucide SVG paths, strokeWidth 2, round linecap/linejoin).

---

## CARD RULES

- **Background:** `C.surface` (NOT `C.bg`, NOT transparent)
- **Border:** NONE — no outline borders on cards. Surface/bg color difference provides separation.
- **borderRadius:** 8
- **boxShadow:** NONE
- **Category tiles:** `borderLeft: 4px solid [categoryColor]` — this is the ONLY border on category cards
- **Home tiles:** plain `C.surface`, no color stripe
- **Settings cards:** plain `C.surface`, no color stripe
- **Card-to-card gap:** 6px in vertical lists
- **Tile padding:** 14px vertical, 16px horizontal

### What uses the left-edge color stripe:
- Category tiles (Library)
- Round cards (Battle Plan)
- Tool tiles (Create overlay)
- Explore/R-R-R/Combine/Map option cards

### What does NOT have stripes:
- Home tiles (routines, goals, ideas)
- Settings cards
- Set cards
- Note cards

---

## SUB-TAB RULES

- Text only: FONT_DISPLAY, fontSize 14, fontWeight 800, letterSpacing 1.5, uppercase
- Active: `color: C.text` + `borderBottom: 2px solid C.accent` on a `<span>` wrapping the text (underline follows text width)
- Inactive: `color: C.textMuted`, no border
- **NO background fill** on active or inactive
- **NO panel/surface** behind sub-tabs — they sit on `C.bg` directly
- **NO border lines** above or below the sub-tab row
- Consistent across ALL pages (Library, Battle, Reflect)

---

## BOTTOM BAR RULES

- **Text only — NO icons** on tabs
- Labels: FONT_DISPLAY, fontSize 11, fontWeight 800, letterSpacing 1.2, uppercase
- Active tab: `color: C.text` + `borderBottom: 2px solid C.accent` (text-width underline via span)
- Inactive tab: `color: C.textMuted`
- **NO background fill** on active tab
- **NO borderTop** on the bar
- Bar background: `C.header`
- + button: 36px circle, `C.accent` bg, white "+" inside (Ic "plus" s=16)
- No elevation, no transform, no hover animation on + button

---

## SECTIONBRIEF RULES

Shared component: `src/components/shared/SectionBrief.jsx`

- **desc:** fontSize 13, color C.textSec, lineHeight 1.5, FONT_BODY
- **stat:** fontSize 11, color C.textMuted, fontStyle italic, marginTop 3, FONT_BODY
- **Padding:** 8px 16px 5px
- **NO divider lines** — just text, then content begins
- Controlled by `settings.showSectionDescriptions` (default true)
- When false, renders null

### Where SectionBrief appears:
- MOVES: Library, Sets, Gap
- BATTLE: Plan, Prep, Freestyle, Rivals
- REFLECT: Calendar, Stance, Goals, Notes
- TOOL OVERLAYS: Explore, R/R/R, Combine, Map

### Where SectionBrief does NOT appear:
- HOME
- Create overlay (tiles have inline descriptions instead)
- Settings
- Profile overlay
- Any modal or BottomSheet

---

## BUTTON STYLES

### Primary (filled):
- Background: `C.accent`, color: white, borderRadius: 8
- Use: main CTAs (e.g., "ADD CATEGORY", "SAVE")

### Ghost (outline):
- Background: transparent, border: `1px solid C.accent`, color: `C.accent`
- Use: secondary CTAs (e.g., "SIMULATE COMPETITION")

### Dashed:
- Background: transparent, border: `1.5px dashed C.border`, color: `C.accent`
- Use: add/create actions (e.g., "ADD TO TODAY")

---

## + BUTTON BOTTOMSHEET

Opens on tap from any tab. Contains:
1. Add a Move → MoveModal
2. Add Moves in Bulk → BulkModal
3. Add Category → AddCategoryModal
4. Create → Create overlay (4 tool tiles)

---

## CREATE OVERLAY

Title: "CREATE" (FONT_DISPLAY, uppercase)
4 tiles with left-edge stripes and descriptions:
- EXPLORE (#4A90C4)
- RESTORE / REMIX / REBUILD (#C4453E)
- COMBINE (#D4943A)
- MAP (#3A9E9E)

Each tile: C.surface bg, borderRadius 8, borderLeft 4px solid [color], no outline border. Title in stripe color (FONT_DISPLAY, bold), description in C.textSec.

---

## OVERLAY PATTERN

- Renders inside content area (below app header)
- App header: always visible
- Bottom bar: always visible
- Close button (X): returns to previous state
- Sub-tabs: hidden when overlay is open

---

## WHAT NEVER CHANGES

- Accent red: #e53935 (dark) / #cf0000 (light) — brand identity
- Semantic colors (green/yellow/blue/red)
- FONT_DISPLAY / FONT_BODY family definitions
- Ic component interface
- Data schemas
- Firebase integration
- localStorage key names

---

## ELEMENT REFERENCE TABLE

Quick lookup for any element's exact values:

| Element | fontSize | fontWeight | fontFamily | color | letterSpacing |
|---------|----------|-----------|------------|-------|---------------|
| MOVESBOOK logo | 21 | 900 | DISPLAY | accent + headerText | 3 |
| "of bboy [name]" | 13 | 400 | BODY | textSec | — |
| Sub-tab active | 14 | 800 | DISPLAY | text | 1.5 |
| Sub-tab inactive | 14 | 800 | DISPLAY | textMuted | 1.5 |
| SectionBrief desc | 13 | 400 | BODY | textSec | — |
| SectionBrief stat | 11 | 400 | BODY | textMuted | — |
| Category name | 16 | 800 | DISPLAY | brown (tracks text) | 1.2 |
| Move count | 13 | 400 | BODY | textMuted | — |
| Bottom bar active | 11 | 800 | DISPLAY | text | 1.2 |
| Bottom bar inactive | 11 | 800 | DISPLAY | textMuted | 1.2 |
| Body text | 13 | 400 | BODY | textSec | — |
| Micro text | 10 | 400-700 | BODY | textMuted | — |
| Overlay title | 16-21 | 900 | DISPLAY | text | 1.5-2 |

---

*This document is the single source of truth. If a Claude Code prompt contradicts this document, this document wins.*

**— END OF DESIGN SYSTEM v1.0 —**
