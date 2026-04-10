# MOVESBOOK DESIGN SYSTEM v2.0

Universal visual rules for the entire app. Every screen, every component, every element follows these rules. No exceptions unless explicitly documented here.

This document is the single source of truth. If any prompt, context doc, or component contradicts this document, **this document wins**.

Place in Claude project files AND in `docs/design-system/` in the GitHub repo.

---

## HOW TO USE THIS DOCUMENT

When applying this design system to any component:
1. Read the component file in full
2. Compare every inline style value against this document
3. Change any value that doesn't match
4. Verify with grep after changes

---

## 1. COLOR TOKENS

All colors come from the `C` object (imported from `src/constants/colors.js`). Never use hardcoded hex values in components — always reference `C.tokenName`.

### Dark mode
| Token | Hex | Purpose |
|-------|-----|---------|
| bg | #0A0A0A | Page background. The darkest surface. |
| surface | #1C1C1E | Cards, tiles, panels. Lifted from bg. |
| surfaceAlt | #2C2C2E | Alternate panels, pressed chip backgrounds. |
| surfaceHigh | #3A3A3C | Highest elevation, active pressed states. |
| border | #3A3A3C | Input borders, divider lines. NOT card borders. |
| borderLight | #2C2C2E | Subtle dividers only. |
| header | #0A0A0A | App header and bottom bar background. |
| headerText | #E8E8E8 | App header text. |
| accent | #e53935 | Brand red. Buttons, active indicators, + button. |
| text | #E8E8E8 | Primary text. Off-white, NOT pure #ffffff. |
| textSec | #9E9E9E | Secondary text. Descriptions, body copy. |
| textMuted | #6E6E6E | Tertiary text. Hints, stats, inactive labels. |

### Light mode
| Token | Hex | Purpose |
|-------|-----|---------|
| bg | #F2F2F7 | Page background. Warm off-white, NOT pure #ffffff. |
| surface | #FFFFFF | Cards, tiles, panels. |
| surfaceAlt | #F2F2F7 | Alternate panels. |
| surfaceHigh | #E5E5EA | Pressed states. |
| border | #D1D1D6 | Input borders, divider lines. |
| borderLight | #E5E5EA | Subtle dividers. |
| header | #FFFFFF | Header and bottom bar. |
| headerText | #1C1C1E | Header text. |
| accent | #cf0000 | Brand red (deeper for light backgrounds). |
| text | #1C1C1E | Primary text. |
| textSec | #48484A | Secondary text. |
| textMuted | #8E8E93 | Tertiary text. |

### Semantic colors
| Token | Dark | Light | Purpose |
|-------|------|-------|---------|
| green | #1db954 | #2e7d32 | Success, completion, checked states |
| yellow | #ffa726 | #f57f17 | Warning, mid-mastery |
| blue | #42a5f5 | #1565c0 | Info, technique |
| red | #e53935 | #cf0000 | Danger, low mastery, accent alias |

### Category colors (harmonized jewel tones)
| Category | Hex |
|----------|-----|
| Toprocks | #C4453E |
| Godowns | #8B6AAE |
| Footworks | #4A90C4 |
| Power Moves | #D4943A |
| Freezes | #3D9E72 |
| Transitions | #D46A52 |
| Burns | #8A6B54 |
| Blowups | #3A9E9E |
| Custom | #6B7BA0 |

### Domain colors
| Domain | Hex |
|--------|-----|
| musicality | #3A9E9E |
| performance | #C4453E |
| technique | #4A90C4 |
| variety | #D4943A |
| creativity | #8B6AAE |
| personality | #3D9E72 |

### User-facing color picker palette
```
#C4453E  #D46A52  #D4943A  #8A6B54  #3D9E72  #3A9E9E
#4A90C4  #6B7BA0  #8B6AAE  #7A5C8A  #B07A5E  #5A8A72
```

---

## 2. TYPOGRAPHY

### Font families
| Name | Family | Use |
|------|--------|-----|
| FONT_DISPLAY | 'Barlow Condensed' | Headings, labels, tab names, category names, buttons |
| FONT_BODY | 'Barlow' | Body text, descriptions, paragraphs |

CJK support: Noto Sans SC, JP, KR + Noto Sans Thai appended to both families.

### Type scale
Rooted in the golden ratio (√φ ≈ 1.272). Four core steps plus two practical intermediates.

| Step | Size | Use |
|------|------|-----|
| XS | 10px | Mastery percentages, timestamps, micro labels, day-of-week letters |
| S | 11px | Stats, hints, bottom bar labels, pill text, durations, descriptions in compact context |
| M | 13px | Body text, descriptions, move counts, brief descriptions |
| M+ | 14px | Tab/sub-tab labels, date headers, emphasis labels |
| L | 16px | Tile titles, category names, card headers, day numbers |
| XL | 21px | App logo, page-level titles |

### Font weights
| Weight | Use |
|--------|-----|
| 900 | Logo, page titles |
| 800 | Tab labels, sub-tab labels, category names, tile titles, chip labels |
| 700 | Emphasis numbers, button text, counts |
| 600 | Secondary emphasis |
| 400 | Body text, descriptions, paragraphs |

### Letter spacing
| Value | Use |
|-------|-----|
| 3 | App logo |
| 1.5 | Sub-tab labels, section headers |
| 1.2 | Category names, bottom bar labels |
| 0.5 | Chip labels, pill text |
| 0 (default) | Body text |

### Text transforms
- All headings, labels, tab names, category names: `textTransform: "uppercase"`
- Body text, descriptions: normal case

---

## 3. SPACING

Fibonacci-based with practical additions.

| Value | Use |
|-------|-----|
| 2px | Hairline gaps (margin between stat and dot) |
| 3px | Micro gaps (between icon and adjacent text) |
| 5px | Small internal gaps (pill padding vertical, tight button padding) |
| 6px | Tile-to-tile gap in vertical lists |
| 8px | Icon row gaps, medium internal padding, grid gaps |
| 13px | Standard internal padding, section spacing |
| 14px | Tile vertical padding |
| 16px | Tile horizontal padding, content area side padding |
| 21px | Large section spacing, separation between major blocks |

### Content area side padding
All scrollable content areas use **16px** left and right padding. This ensures tiles, text, and icons align to the same margin.

---

## 4. CARDS & TILES

### Universal card style
Every card, tile, or panel in the app follows these rules:

| Property | Value |
|----------|-------|
| background | `C.surface` |
| borderRadius | 8 |
| border | **NONE** — no outline borders on any card |
| boxShadow | **NONE** |
| padding | 14px vertical, 16px horizontal (default) |

The contrast between `C.bg` and `C.surface` provides visual separation. No borders or shadows needed.

### Category-colored tiles
Tiles representing a category (move categories, round cards, tool tiles) add:
```
borderLeft: 4px solid [categoryColor]
```
This left-edge stripe is the ONLY border on these tiles. No top, bottom, or right borders. No gradient bars.

### Plain tiles
Tiles that don't represent a category (home items, settings rows, notes) have:
- NO borderLeft stripe
- NO borders of any kind
- Just `C.surface` background + borderRadius 8

### Tile spacing
- Gap between stacked tiles: **6px**
- No marginBottom on individual tiles when parent uses gap
- If marginBottom is used instead of gap: **6px**

### What NEVER appears on cards
- `border: Xpx solid C.border` (outline borders)
- `boxShadow: ...` (elevation shadows)
- Gradient bars (`linear-gradient`) across top or bottom
- `minHeight` constraints (let content dictate height)

---

## 5. TABS & NAVIGATION

### Sub-tabs (LIBRARY/SETS/GAP, PLAN/PREP/FREESTYLE/RIVALS, etc.)

| Property | Active | Inactive |
|----------|--------|----------|
| color | C.text | C.textMuted |
| fontSize | 14 (M+ step) | 14 |
| fontWeight | 800 | 800 |
| fontFamily | FONT_DISPLAY | FONT_DISPLAY |
| textTransform | uppercase | uppercase |
| letterSpacing | 1.5 | 1.5 |
| background | **none / transparent** | transparent |
| borderBottom | 2px solid C.accent (on `<span>` wrapping text) | 2px solid transparent |

**Critical rules:**
- The underline follows the **text width**, not the button width. Achieved by placing `borderBottom` on an inner `<span>`, not on the button element.
- NO background fill on active tab. No rgba, no surfaceAlt, nothing.
- NO panel/surface behind the sub-tab row. Sub-tabs sit directly on `C.bg`.
- NO border lines (top or bottom) on the sub-tab container row.

### Bottom bar

| Property | Value |
|----------|-------|
| Background | C.header |
| Height | ~50px |
| borderTop | **NONE** |
| Icons | **NONE** — text labels only |
| + button | 36px circle, C.accent bg, white "+" icon (Ic "plus" s=16) |

| Property | Active tab | Inactive tab |
|----------|-----------|-------------|
| color | C.text | C.textMuted |
| fontSize | 11 (S step) | 11 |
| fontWeight | 800 | 800 |
| fontFamily | FONT_DISPLAY | FONT_DISPLAY |
| letterSpacing | 1.2 | 1.2 |
| borderBottom | 2px solid C.accent (on `<span>`) | 2px solid transparent |
| background | **none** | none |

The + button has no active state, no elevation, no float, no transform, no hover animation. It sits inline in the bar.

---

## 6. ICONS

All icons rendered via the `Ic` component (Lucide SVG paths).

| Size | Use |
|------|-----|
| 13px | Small inline icons (chevron, menu dots, mastery indicator, status dots) |
| 16px | Standard toolbar icons (filter, view, search, sort, action icons) |
| 18px | Header icons (settings cog, navigation) |
| 21px | Feature icons, empty state icons |
| 32px | Large empty state illustrations |

Properties: strokeWidth 2, strokeLinecap round, strokeLinejoin round.

### Icon buttons (toolbar style)
When icons are used as toolbar buttons (filter, view, search, sort):
```
background: "none"
border: "none"
cursor: "pointer"
padding: 4
```
Icon color: `C.textSec` default, `C.accent` when active/toggled on.

NO background fill, NO borderRadius, NO surface panel behind icon buttons.

---

## 7. BUTTONS

### Primary (filled)
```
background: C.accent
color: "#ffffff"
border: "none"
borderRadius: 8
fontFamily: FONT_DISPLAY
fontWeight: 800
letterSpacing: 1
textTransform: "uppercase"
```

### Ghost (outline)
```
background: "transparent"
border: `1px solid ${C.accent}`
color: C.accent
borderRadius: 8
fontFamily: FONT_DISPLAY
fontWeight: 800
```
Use for secondary CTAs that should be visible but not dominant.

### Dashed (add/create)
```
background: "transparent"
border: `1.5px dashed ${C.border}`
color: C.accent
borderRadius: 8
fontFamily: FONT_DISPLAY
fontWeight: 800
```
Use for "add something" actions within content areas.

### Text button
```
background: "none"
border: "none"
color: C.accent (or C.textMuted for dismiss)
fontFamily: FONT_BODY
```

---

## 8. FORM INPUTS

All text inputs, textareas, and selects:
```
background: C.surface
border: 1px solid C.border
borderRadius: 8
padding: 9px 12px
color: C.text
fontSize: 14
fontFamily: FONT_BODY
outline: "none"
```

Form inputs are the ONE place where `border: 1px solid C.border` is correct and required.

Active/focused state: `border: 1px solid C.accent` (or `1.5px`).

---

## 9. CHIPS & PILLS

```
borderRadius: 20
padding: 5px 13px
fontSize: 11
fontWeight: 700
fontFamily: FONT_DISPLAY
letterSpacing: 0.5
```

| State | Style |
|-------|-------|
| Default | border: 1.5px solid C.border, background: transparent, color: C.text |
| Active | border: 1.5px solid C.accent, background: C.accent + "18", color: C.accent |

---

## 10. CHECKBOXES

For inline checklists (routine steps, to-do items):

| State | Style |
|-------|-------|
| Unchecked | width: 18, height: 18, borderRadius: 4, border: 2px solid C.border, background: transparent |
| Checked | border: 2px solid C.green, background: C.green, with white check icon (Ic "check" s=12 c="#fff") |

Checked items: text gets `textDecoration: "line-through"`, `color: C.textMuted`.

---

## 11. BOTTOM SHEETS

```
Background: C.bg
Border radius: 20px 20px 0 0 (top corners only)
Close: X button + overlay tap
No grab handle
Slide up animation: 0.3s
```

### Sheet items (menu rows)
```
background: C.surface
border: none
borderRadius: 8
padding: 14px 16px
fontSize: 13
fontWeight: 700
fontFamily: FONT_DISPLAY
color: C.text
gap: 6 between items
```

Sheet items have NO outline borders.

---

## 12. MODALS

```
background: C.bg
borderRadius: 16
maxWidth: 420px (mobile), 520px (tablet)
padding: 20px
```

Center-aligned on screen with dark overlay (`rgba(0,0,0,0.6)`).

---

## 13. TOASTS

```
position: fixed
top: 68px
right: 12px
background: C.surface
borderRadius: 8
padding: 10px 14px
fontSize: 13
```

No buttons inside toasts. Auto-dismiss.

---

## 14. SECTION HEADERS

Section grouping labels (like "APPEARANCE", "FEATURES", "DATA" in settings):

```
fontSize: 10 (XS step)
fontWeight: 800
fontFamily: FONT_DISPLAY
letterSpacing: 1.5
color: C.textMuted
textTransform: "uppercase"
marginBottom: 5
marginTop: 21 (except first section)
```

---

## 15. DIVIDERS

Horizontal dividers between sections (NOT between cards):

```
height: 1px
background: C.borderLight
margin: 0 (full width of container)
```

Dividers are used sparingly. Cards separated by gap do NOT need dividers.

---

## 16. WEEK STRIPS / DATE HEADERS

Week strips and date navigation bars:

```
background: transparent (NO C.surface panel)
borderBottom: NONE
padding: 8px 16px
```

Individual day cells:
- Today: `background: C.accent`, text: `#fff`
- Selected (not today): `outline: 1.5px solid C.accent`, text: `C.accent`
- Inactive: `background: transparent`, text: `C.text` / `C.textMuted`

---

## 17. OVERLAYS

Full-screen content overlays (tools, create, etc.):
- Render inside content area (below app header)
- App header: always visible
- Bottom bar: always visible
- Close button: X icon in top-right of overlay header
- Background: `C.bg`

---

## 18. EMPTY STATES

When a section has no content:

```
textAlign: "center"
padding: "40px 20px"
```

- Icon: Ic s=32 c=C.textMuted (centered)
- Title: fontSize 16 (L step), fontWeight 800, FONT_DISPLAY, uppercase, C.text
- Hint: fontSize 13 (M step), C.textMuted, lineHeight 1.5

---

## 19. TRANSITIONS & ANIMATION

```
transition: "all 0.15s"
```

Applied to: tab active states, button hover/press, card appearance. Keep animations subtle and fast. No bounces, no springs, no elaborate sequences.

---

## 20. IMMUTABLE ELEMENTS

These values NEVER change regardless of future design updates:

| Element | Value | Reason |
|---------|-------|--------|
| Accent red (dark) | #e53935 | Brand identity |
| Accent red (light) | #cf0000 | Brand identity |
| FONT_DISPLAY family | Barlow Condensed | Brand identity |
| FONT_BODY family | Barlow | Brand identity |
| Ic component interface | n, s, c props | Shared across all components |
| localStorage key names | mb_* prefix | Data persistence |
| Firebase integration | MB_DB pattern | Backend |

---

## QUICK REFERENCE: ELEMENT VALUES

For any element, find its role and read across:

| Role | fontSize | fontWeight | fontFamily | color | letterSpacing |
|------|----------|-----------|------------|-------|---------------|
| App logo | 21 | 900 | DISPLAY | accent + headerText | 3 |
| Page/overlay title | 16-21 | 900 | DISPLAY | text | 1.5-2 |
| Sub-tab label (active) | 14 | 800 | DISPLAY | text | 1.5 |
| Sub-tab label (inactive) | 14 | 800 | DISPLAY | textMuted | 1.5 |
| Tile title | 16 | 800 | DISPLAY | text | 1.2 |
| Tile subtitle/count | 13 | 400-700 | BODY | textMuted | 0 |
| Body text | 13 | 400 | BODY | textSec | 0 |
| Description brief | 13 | 400 | BODY | textSec | 0 |
| Stat/hint text | 11 | 400 | BODY | textMuted | 0 |
| Micro label | 10 | 700-800 | DISPLAY | textMuted | 1 |
| Bottom bar label (active) | 11 | 800 | DISPLAY | text | 1.2 |
| Bottom bar label (inactive) | 11 | 800 | DISPLAY | textMuted | 1.2 |
| Button text | 13 | 800 | DISPLAY | (varies) | 1 |
| Input text | 14 | 400 | BODY | text | 0 |
| Chip text | 11 | 700 | DISPLAY | text/accent | 0.5 |

---

## AUDIT COMMANDS

To verify the design system is applied correctly across the app:

```bash
# No hardcoded old colors
grep -rn "#121212\|#1e1e1e\|#282828\|#ffffff\|#b3b3b3\|#7a7a7a\|#f8f8f8\|#111111\|#444444\|#888888" src/

# No card outline borders (should return 0 non-input borders)
grep -rn "border:.*solid.*C\.border" src/components/ | grep -v "input\|Input\|textarea\|select\|borderLeft\|borderBottom\|borderTop\|borderRadius\|dashed\|inp()"

# No boxShadow on cards
grep -rn "boxShadow" src/constants/styles.js src/components/ | grep -v "dropdown\|menu\|tooltip\|modal"

# No gradient bars on tiles
grep -rn "linear-gradient" src/components/ | grep -v "slider\|progress\|mastery"

# borderRadius 8 on cards (not 10, 12, 14)
grep -rn "borderRadius.*:.*1[0-4]" src/components/ | grep -v "pill\|chip\|avatar\|badge\|toggle\|BottomSheet\|modal\|Modal\|circle\|50%\|999"

# No C.surface background on sub-tab rows
grep -rn "background.*surface.*sub\|background.*surface.*tab" src/components/
```

---

*Every new component built, every existing component modified, must conform to this document. When in doubt, reference the Quick Reference table.*

**— END OF DESIGN SYSTEM v2.0 —**
