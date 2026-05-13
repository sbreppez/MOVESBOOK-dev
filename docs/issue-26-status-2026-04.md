# Issue #26 — DS v2.0 Audit Status (5 remaining components)

**Date:** 2026-04-29
**Scope:** Read-only conformance check against MovesBook Design System v2.0 for the 5 components that follow MoveTree's earlier ship.
**Method:** ripgrep across each component file for the 8 DS v2.0 rules, with context reads to disambiguate ambiguous hits.

Reference: [docs/design-system/MovesBook_DesignSystem_v2_0.md](design-system/MovesBook_DesignSystem_v2_0.md)

Notes on hex check: every hex hit across all 5 files is `"#fff"` used as text/icon color on a colored background (accent/red/green button text, `<Ic c="#fff"/>` on filled icon-buttons). Pragmatically a universal pattern; flagged as **PASS-with-note** below rather than FAIL since none introduce a brand/category color hardcode. Treat as a tech-debt item if the team wants strict zero-hex.

---

## Lab.jsx — `src/components/moves/Lab.jsx` (Explore)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No outline borders on cards | **FAIL** | [Lab.jsx:589](../src/components/moves/Lab.jsx#L589) — Live Preview card has `border: 1px solid ${C.border}` with `borderRadius: 8`. All other border hits are inputs (376, 553, 797), modals (784, 864), action buttons (615/635/655/678/696), or chip selectors (339, 812). |
| 2 | No boxShadow | PASS | No matches. |
| 3 | No gradient bars on tiles | PASS | No matches. |
| 4 | borderRadius 8 on cards | PASS | Hits at 605/614/624/634/708 are action buttons (`padding:"12px 16px"`); 863 is the confirm-remove modal. No card uses radius 10–14. |
| 5 | Stripe-only category coloring | PASS | Cat color used as 4px stripe (line 415-style) and as title text within tool (line 472) — DS-allowed exception for Explore. Category-selector chips (812-814) use cat color on chip border/bg/text — chip pattern, allowed. |
| 6 | No `position:fixed` | PASS | No matches. |
| 7 | No hardcoded hex | **PASS-with-note** | All hits (`#fff` only): 384, 387, 606, 625, 709, 843. White text on colored buttons / `<Ic c="#fff">` only — no brand or category hex. |
| 8 | C.accent scoped correctly | PASS | All C.accent usage is button bg/border (709, 843, 884), category-chip dynamic color (812-814), or fallback for category selectors (883). No stray accent on body/text. |

**Verdict:** **PARTIAL** — one outline-border violation on the Live Preview card. Tiny fix.

---

## RestoreRemixRebuild.jsx — `src/components/moves/RestoreRemixRebuild.jsx` (RRR)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No outline borders on cards | PASS | Both `C.border` hits are inputs/textareas: [RRR:443](../src/components/moves/RestoreRemixRebuild.jsx#L443) (text input for manualMoveName), [RRR:665](../src/components/moves/RestoreRemixRebuild.jsx#L665) (notes textarea). Move-list-item border at 411 uses conditional `mc` (mode color) on selection or `C.borderLight` (softer) — not flat `C.border`. |
| 2 | No boxShadow | PASS | No matches. |
| 3 | No gradient bars on tiles | PASS | No matches. |
| 4 | borderRadius 8 on cards | **FAIL** | [RRR:485](../src/components/moves/RestoreRemixRebuild.jsx#L485) — Prompt card uses `borderRadius: 14` (`background:C.surface, borderRadius:14, padding:20, margin:"16px 0"`). Should be 8. Other 1[0-4] hits are buttons (454/601/675), inputs/textareas (443/666), small action buttons (499/511/551/564), and a list-item with conditional border (412). |
| 5 | Stripe-only category coloring | PASS | Move list items (lines 395-419) use cat color `cc` only as a 3px-wide stripe (line 415). List item background uses mode color (`mc`), not category color. |
| 6 | No `position:fixed` | PASS | No matches. |
| 7 | No hardcoded hex | **PASS-with-note** | All hits `#fff`: 456, 565, 602, 605, 625, 676, 679. Button text / Ic colors only. |
| 8 | C.accent scoped correctly | PASS | C.accent used as: rebuild-mode color (42), modeColor fallback (47), default mode color (161), text accent in section header (155), set color fallback (162). All within DS scope (mode = active indicator). |

**Verdict:** **PARTIAL** — one card with wrong radius (14 → 8 on Prompt card).

---

## FlashCards.jsx — `src/components/moves/FlashCards.jsx`

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No outline borders on cards | PASS | No `C.border` outline-border matches. The only border hits are 1.5px solid C.accent on the RETRY MISSED button (line 349) and `border:"none"` on FLASHCARDS DONE (356). |
| 2 | No boxShadow | PASS | No matches. |
| 3 | No gradient bars on tiles | PASS | No matches. |
| 4 | borderRadius 8 on cards | PASS | No matches for radius 10–14. Card faces use `borderRadius: 8` (lines 231, 250). |
| 5 | Stripe-only category coloring | PASS | Set color used only as `borderRadius:"50%"` dots (lines 236, 338) — circular indicators, not tile backgrounds. |
| 6 | No `position:fixed` | PASS | No matches (uses `position:"absolute"` for card-flip faces). |
| 7 | No hardcoded hex | **PASS-with-note** | All hits `#fff`: 172, 193, 286, 357. Check icons + button text only. |
| 8 | C.accent scoped correctly | PASS | C.accent on: progress bar fill (217), accent dot fallback (162, 236, 338), section badge / pill (321-322), retry-missed button border (349-350), done button bg (357). All active-indicator / button usage. |

**Verdict:** **DONE** — fully DS v2.0 conformant.

---

## ComboMachine.jsx — `src/components/train/ComboMachine.jsx` (Combine)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No outline borders on cards | **FAIL** | [ComboMachine.jsx:291](../src/components/train/ComboMachine.jsx#L291) — branch-root selector buttons use `background:C.surface, border:1.5px solid ${C.border}, borderRadius:8` — these read as card-like list-item tiles with a flat outline. Other border hits are increment controls (237/243), tab indicators (264), pill/lock indicators (348/370 — note these use C.yellow on lock, C.border off), inputs (469/636), search bar (539), and modals (466). The combo-preview container at 415 uses softer `C.borderLight`. |
| 2 | No boxShadow | PASS | No matches. |
| 3 | No gradient bars on tiles | PASS | No matches. |
| 4 | borderRadius 8 on cards | PASS | Hits 237/243 are 38×38 increment control buttons (radius 10 — buttons, not cards). 349 is a transition pill (`padding:"3px 14px"` → pill exclusion). Move card at 371 uses radius 8. |
| 5 | Stripe-only category coloring | PASS | `getCatColor` (46, 501) used as text color in combo-preview move text (421, 475 in MovePicker) — DS-allowed title exception within the Combine tool. No tile bg fills with category color. |
| 6 | No `position:fixed` | PASS | No matches. |
| 7 | No hardcoded hex | **PASS-with-note** | All hits `#fff`: 454, 482, 572, 587, 639, 661. Button text on accent / green / mode-color buttons. |
| 8 | C.accent scoped correctly | PASS | C.accent on: tab-indicator border/bg/text (264-266), trans-arrow text inside combo preview (420, 475), section accent text (550), button bg (587, 639, 661). All within DS scope. |

**Verdict:** **PARTIAL** — branch-root selector tiles have full outline borders (stripe-only DS would prefer no border or borderLeft only).

---

## FlowMap.jsx — `src/components/battle/FlowMap.jsx` (Map)

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No outline borders on cards | **FAIL** | [FlowMap.jsx:878](../src/components/battle/FlowMap.jsx#L878) — `SAVE IN CATEGORY` list-container card uses `borderRadius:8, border:1px solid ${C.border}, overflow:"hidden"`. Treats as a card. Grid-cell borders at 546 are heatmap cells (4px radius, table-cell pattern — not cards). Other hits are chips/pills (179, 672, 698, 918, 947, 983 helper), back button (189), input (865), modal (466), and the chipStyleFn helper (983). |
| 2 | No boxShadow | PASS | Single hit at line 737 is on the DetailModal — modal exclusion applies. |
| 3 | No gradient bars on tiles | PASS | No matches. |
| 4 | borderRadius 8 on cards | PASS | No matches for 10–14. Modal uses 16, chips use 20 — outside the rule's scope. |
| 5 | Stripe-only category coloring | PASS | Cat colors used as 3-4px-wide stripes (297, 333, 363, 517, 893) and as title text within DetailModal (656, 658) — DS-allowed for tool internals. No tile background fills with category color. |
| 6 | No `position:fixed` | PASS | No matches (uses `position:"absolute"` for modal overlay). |
| 7 | No hardcoded hex | **PASS-with-note** | All hits `#fff`: 183, 705, 707, 970, 990. btnPrimary text + Ic colors only. |
| 8 | C.accent scoped correctly | PASS | C.accent on: chip active-state (179-180, 672-674, 798-799, 808, 918-919, 947-948), button bg (183, 990, custom-add 704), progress bar (217), category stripe fallbacks (297/333/363/517/893), pill border (698), active-row tint (888, 897, 899). All within DS scope (chip active = active indicator). |

**Verdict:** **PARTIAL** — one outline-border on the SAVE IN CATEGORY list container.

---

## Summary

| Component | Verdict | Failing checks |
|---|---|---|
| Lab (Explore) | **PARTIAL** | Outline border on Live Preview card (Lab.jsx:589) |
| RRR | **PARTIAL** | Prompt card uses `borderRadius:14` (RRR:485) |
| FlashCards | **DONE** | — |
| Combine (ComboMachine) | **PARTIAL** | Outline border on branch-root selector tiles (ComboMachine.jsx:291) |
| FlowMap (Map) | **PARTIAL** | Outline border on SAVE IN CATEGORY list container (FlowMap.jsx:878) |

**Consolidated remaining work for issue #26:**

1. **Lab.jsx:589** — drop `border:1px solid ${C.border}` from Live Preview card (or replace with subtle `C.borderLight`).
2. **RRR:485** — change Prompt card `borderRadius:14` → `8`.
3. **ComboMachine:291** — drop or soften the branch-root selector outline border.
4. **FlowMap:878** — drop the SAVE IN CATEGORY list-container outline border.

Optional tech-debt sweep (low priority, tracked across all 5 files):
- Replace `"#fff"` button-text literals with a DS token (`C.white` or `C.textOnAccent`) if a strict-zero-hex policy is desired. Currently all 30+ hex hits in scope are `#fff` only.

No `position:fixed` Capacitor red flags. No gradient bars on tiles. No off-spec category-color usage. Stripe-only category pattern is correctly applied across all 5 files.
