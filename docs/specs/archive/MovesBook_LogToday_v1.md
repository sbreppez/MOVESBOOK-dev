# MovesBook — Log Today v1

**Status:** Design locked. Step 3 (auto-capture data model) **resolved** — see `MovesBook_LogToday_v1_Step3_Addendum.md`. Steps 4–6 (parent reconcile, preview JSX) in progress.
**Companion files:**
- `MovesBook_LogToday_v1_Step3_Addendum.md` — auto-capture data model resolution (canonical for §What I worked on internals)
- `docs/research/LogToday_v1_AutoCapture_Inventory.md` — deployed-reality dossier (untracked)
- Preview JSX (Training sub-tab, full modal navigation) — to follow
**Aligned with:** `MovesBook_DesignSystem_v2_0.md`

---

## PURPOSE

Replace the current event-logging fragmentation — top "LOG SESSION" button opens one modal, bottom-tile `+` and floating `+` open a different BottomSheet picker — with a single coherent flow: a **"Log Today"** button on HOME and Calendar that opens a unified four-sub-tab modal. The modal becomes the one place a user logs anything that happened on a given day.

The redesign also shifts the modal philosophy from *"form the user fills out"* to *"summary the app and the user co-author."* Fields the app already captured (drilled moves, spar sessions, sets practiced) auto-populate the Training sub-tab; the user confirms, removes, or adds. Free-text fields handle subjective meaning. Structured fields are reserved for data that *must* be parseable (duration, video URL, routine links).

---

## METHODOLOGY

Three principles drove the design:

1. **One modal, every door.** Every entry point that says "log something for this day" opens the same modal, prefilled to the relevant date. No more parallel forms with overlapping fields and different storage.
2. **Mirror, not coach.** The modal shows the user what the app captured, plus space for what only the user can describe. The app does not interpret, suggest, score, or nag. A button is a door, not a push.
3. **Co-authored over self-reported.** Where the app has data (Drill, Spar, Sets, Combine, move-tile taps, Flow), it surfaces it. The user confirms or removes. Where only the user has data (how it felt, location, notes), the form asks plainly.

---

## ENTRY POINTS

### HOME

A new ghost-button under the date ribbon and above the TODAY section, labeled **"Log Today"**. Same DS v2.0 ghost-button style as Calendar's existing button and Battle's "Simulate Competition." Always opens the modal prefilled to today's date.

This pattern (under-the-brief primary action) is being formalized as the app's "primary action of this section" pattern. Calendar already uses it. MOVES will use it for Creative Tools (separate ticket).

### Calendar

Existing top button stays. Floating in-content `+` and day-tile `+` are **removed** — the calendar grid handles non-today logging via day-tap (already deployed: tapping a day in the grid opens the modal prefilled to that date). The bottom-bar global `+` is unaffected; it remains for moves/notes/goals/non-event creation.

This produces a clean rule:
- Under-the-brief button → today
- Calendar grid tap → any other day
- Bottom-bar `+` → non-event creation

Three doors, three purposes, no overlap.

---

## MODAL STRUCTURE

### Header

- Title: **"Log Today"** (or **"Log [date]"** when entered via Calendar grid tap with a non-today date — the title reflects the actual date being logged)
- Today badge (small accent pill) when the date is today
- Close X (top-right)

### Sub-tab navigation

Four sub-tabs across the top of the modal body: **Training / Battle / Conditioning / Rest**.

Visual treatment matches the app's existing sub-tab pattern (LIBRARY/SETS/GAP, PLAN/PREP/FREESTYLE/RIVALS):
- Uppercase Barlow Condensed, weight 800, letter-spacing 1.5
- Active: `C.text` color, accent underline on text-width (not button-width)
- Inactive: `C.textMuted` color, transparent underline
- No background fills, no chip styling, no panel behind the row

Default active sub-tab on open: **Training** (most common case).

### Footer

- Save button (full-width, primary filled, `C.accent`)
- Cancel link below

---

## SUB-TAB 1 — TRAINING

Identity: breaking practice. The default sub-tab; the most common log.

| # | Section | Type | Notes |
|---|---|---|---|
| 1 | What I worked on | Auto-populated list + manual move-search picker + free-text field | See "Auto-capture system" below |
| 2 | How it felt | Free-text textarea, auto-expanding | Pure free-text — no exertion faces, no rating system. User describes feeling in their own language. |
| 3 | Duration | Two numeric inputs side by side: hours + minutes | Structured because reports may aggregate later. UX win: user enters in the unit they think in. |
| 4 | Location | Free-text, single line, optional | Deferred from structured picker — `mb_places` may come later. |
| 5 | Video link | Optional URL, dashed-button reveal | DS v2.0 dashed-button pattern; collapsed by default. |
| 6 | Today's Note | Free-text textarea, auto-expanding, catch-all | Renamed from "Notes." The catch-all for thoughts that don't belong to other sections. |

### What I worked on — auto-capture system

The most structurally novel part of v1. The Training sub-tab opens with a list of items the app already captured during the day:

- **Drill sessions** logged today (move + rep count)
- **Spar sessions** (Solo + 1v1) logged today
- **Sets practiced** (one row per set, expandable chevron showing the moves inside)
- **Combine combos** saved today
- **Flow sessions** logged today (duration, stage reached, prompt count)
- **Move-tile "trained/drilled" taps** (the per-move tap-circle that marks a move as practiced)

> **Internals canonical in addendum.** Bucket keys, query rules per source, dedup priority across overlapping writes, soft-remove store shape, and the `useDayData(date)` extraction are specified in `MovesBook_LogToday_v1_Step3_Addendum.md`. The bullet list above is the user-facing description; the addendum is the technical contract.

Each item is removable via an X button — **soft remove only**. X removes the item from this Log Today summary; the underlying record (Drill session, Spar session, etc.) stays intact in its own feature's history. A logged session is a curated view of the day, not the source of truth for the underlying records.

For accidental records (user explored the app, generated junk records they don't want preserved): a long-press on the X (or secondary action) opens a confirmation prompt to **hard-delete from underlying history**. Default tap is non-destructive; deliberate action is destructive.

**Manual addition** path: a search field opens a side panel (full-screen on mobile) showing the entire move library as a tappable multi-select list with search-to-filter at the top. Same picker pattern Sets uses for adding moves and Battle Plan uses for round entries — pattern continuity, no new vocabulary.

Moves already auto-captured appear **already-checked** in the picker (visual feedback that they're in the log). Tapping unchecks them in the picker but does not remove them from the log; removal happens only via the X on the captured item itself.

**Free-text field** sits below both lists for moves not in the app yet — the user types whatever isn't auto-captured and isn't in the library.

### Auto-capture sources — locked list

| Source | Auto-captured | Notes |
|---|---|---|
| Drill | Yes | Move + rep count |
| Spar (Solo + 1v1) | Yes | Session record. Two sub-renderers internally — see addendum §1.1 |
| Sets practice | Yes | Set as one item, expandable chevron showing moves. Requires `setId` schema addition on FlashCards calendar event — see addendum §7.1 |
| Combine combos saved | Yes | Saved combo only — not just opening Combine |
| Flow | Yes | Music Flow session — duration, stage reached, prompt count, optional reflection |
| Move-tile trained/drilled tap | Yes | Per-move event. Dedup-filtered when the same move appears in another bucket — see addendum §2.1 |
| Explore | **No** | Browsing tool, not committed practice |
| R/R/R | **No** | Thinking tool, not committed practice |
| Map | **No** | Browsing tool, not committed practice |

**Principle:** auto-capture is for things the user explicitly committed to. Opening a tool is browsing; saving an artifact is committing.

If the user *saves* something from Explore/R/R/R/Map (e.g., a saved Map pairing), that saved artifact is auto-captured. Bare opens are not.

---

## SUB-TAB 2 — BATTLE

Identity: competitive event the user took part in or watched.

### v1 implementation: Path A (defer redesign)

For Log Today v1, tapping the Battle sub-tab **opens the existing Rivals Battle Log modal unchanged**. Single source of truth temporarily; full redesign is filed as its own multi-session ticket (`MovesBook_Battle_Unification_Issue.md`).

This is a deliberate scope-protection decision. The Battle data model needs unification (three current surfaces, three stores, two different result enums, no round-by-round structure) — but unifying it is a 5-8 session project that overlaps heavily with the same code Log Today v1 modifies. Bundling them = merge hell. Shipping them sequentially keeps both clean.

When Battle Unification ships, the Battle sub-tab becomes a first-class member of Log Today with round-by-round structure, judges, votes per round, etc. Until then, it's a thin pass-through to the existing modal.

---

## SUB-TAB 3 — CONDITIONING

Identity: physical work that supports breaking but isn't breaking. Gym, run, swim, mobility, yoga, climbing, etc.

| # | Section | Type | Notes |
|---|---|---|---|
| 1 | Type | Customizable chip row | Defaults: Gym / Run / Swim / Yoga / Mobility / Climbing / Other. User can add custom types via "+ Add type" chip; custom types saved to `mb_conditioning_types` and persist as first-class chips on next use. Removal UI deferred to v1.1. |
| 2 | Duration | Two numeric inputs (hours + minutes) | Same pattern as Training. |
| 3 | Link to HOME routine/habit | Optional, dashed-button reveal | See "Routine link" below. |
| 4 | How it felt | Free-text textarea, optional, expand-to-show | Same pattern as Training. |
| 5 | Location | Free-text, single line, optional | Same as Training. |
| 6 | Video link | Optional URL, dashed-button reveal | Same as Training. |
| 7 | Today's Note | Free-text textarea | Same as Training. |

### Routine link (snapshot model)

The user can attach a link to one of today's HOME routines or habits — typically one they've already ticked off. Tapping the dashed-button reveal opens a picker showing today's ticked routines/habits. Selecting one attaches a link.

**Snapshot model:** the link captures the routine's content at the time of linking. Future edits to the routine on HOME do not retroactively change what the session displays. A logged session is a historical record; routine templates can change, but the past session shouldn't.

**Disclosure:** below the picker, a small `C.textMuted` microcopy line: *"Saved as it was today — won't change if you edit the routine later."* One translation key, twelve languages. The user is told *what the link means* in the moment they're using it. No tooltip, no help icon, no first-use nudge.

The session displays the linked routine's snapshot content as a read-only summary inside the form. Unlink available anytime.

### Conditioning auto-capture

None for v1. Hooks for future Apple Health / Google Fit / Strava integration are noted in the data shape but not built. Data shape leaves room for these without requiring schema changes later.

---

## SUB-TAB 4 — REST

Identity: deliberate rest, body recovery, illness, life events. The catch-all sub-tab.

| # | Section | Type | Notes |
|---|---|---|---|
| 1 | Rest type | Customizable chip row | Defaults: Rest / Active Recovery / Injury or Sick / Other. Same customization model as Conditioning. |
| 2 | Today's Note | Free-text textarea, large | Placeholder text shifts based on chip selection — when "Other" is selected, placeholder reads *"Travel, life event, anything else..."* Guides the user toward useful content per case. |
| 3 | How's the body? | Free-text textarea, optional, expand-to-show | Placeholder for future Body Check feature. When Body Check ships, this textarea is replaced by the structured diagram. |

### Rest does NOT have

- Duration field — Rest is the absence of structured activity. "How long did you rest?" is not a meaningful question.
- Location field — irrelevant to most Rest entries; the Note field handles "rested at the beach" if needed.
- Video link — no use case.

### Injury linking (deferred)

When "Injury or Sick" is selected in v1, it's just a tag on that entry. The Note field captures detail. When Body Check ships, selecting this chip can trigger a structured prompt to mark a region on the body diagram as injured. This is a Body Check phase concern, not a Log Today v1 concern.

Cross-referenced in the Body Check spec.

---

## CROSS-CUTTING DECISIONS

### Customizable chip rows (Conditioning + Rest)

Both sub-tabs use the same pattern:
- Default chips ship with the app
- "+ Add type" chip at the end of the row opens a small text input
- Custom types save to a per-sub-tab localStorage list (`mb_conditioning_types`, `mb_rest_types`)
- On future opens, both default and custom chips render in order
- Removal UI: deferred to v1.1 (likely hybrid: long-press inline + edit-mode toggle)

The lists are sub-tab-scoped. A custom Conditioning type does not appear in Rest, and vice versa. This prevents "Sets" leaking from Training context into Rest context.

### Save behavior

- **Save** writes the session and any auto-captured items' include/exclude state. Hard-deleted underlying records (via long-press X) are removed from their respective stores.
- **Cancel** discards all edits. Auto-captured items return to their original state. Soft-removed items are restored.
- No auto-save per sub-tab.
- Existing snapshot pattern (`useRef`) used to support clean cancel.
- Technical state model (working state held in component state, soft-remove pending until Save, hard-delete writes immediately): see addendum §5.

### Date handling

- Title shows the date being logged (today by default, or any other day if entered via Calendar grid tap)
- Modal does not allow date change inside the modal — date is set by entry point
- Editing a previously logged session opens the modal prefilled to that session's data and date
- "Today" is determined by `todayLocal()` (device local time, YYYY-MM-DD) — see addendum §1 and dossier Cross-Cutting Concern 1

---

## OUT OF SCOPE FOR v1 (filed separately)

- **For Next Time** — schedulable training reminder surfaced on HOME on a chosen date. Captured in parking issue draft. Filed when Log Today v1 ships.
- **Battle Data Model Unification** — round-by-round structure, three-surface consolidation, judges/votes per round. Captured in `MovesBook_Battle_Unification_Issue.md`. Parking ticket — do not action until Log Today v1 ships and stabilizes.
- **Body Check** — structured body diagram with regional state tracking. Captured in `MovesBook_BodyCheck_Spec_v0_1.md`. Multi-phase project; integrates into Training/Conditioning/Rest sub-tabs when built.
- **Place picker** — structured `mb_places` storage with last-used surfacing. Deferred; v1 ships free-text Location.
- **Make day-detail events tappable as individual modals** — separate filed issue (referenced in the Calendar grid-tap behavior).
- **Conditioning chip removal UI** — deferred to v1.1.
- **Rest chip removal UI** — deferred to v1.1.
- **Apple Health / Strava / external fitness data integration** — long-future hook noted in Conditioning data shape but not built.
- **Five-sub-tab variant** with separate Journal — folded into Rest; Journal does not exist as a separate sub-tab.

---

## OPEN QUESTIONS / DECISIONS PENDING

These need resolution before final spec lock and CC prompt writing:

1. **Auto-capture data model — RESOLVED.** See `MovesBook_LogToday_v1_Step3_Addendum.md`. All four sub-questions (item field shape, soft-remove technical model, "today" determination, query mechanism) answered against deployed reality.
2. **Modal scroll behavior** — sub-tabs sticky during scroll, or scroll with the body? Locked once preview JSX exists (Step 5).
3. **Save button enabled state** — always enabled? Disabled until at least one field is touched? What's the empty-state save behavior (does saving an empty Training session log create a record)? Locked once preview JSX exists (Step 5).
4. **Animation between sub-tabs** — hard cut or fade/slide? Performance concern on lower-end Android Capacitor builds. Locked once preview JSX exists (Step 6).
5. **Translation pass** — all new strings across 12 languages: sub-tab names, section headers, chip labels (Type defaults for both Conditioning and Rest), the snapshot disclosure microcopy, "+ Add type", "+ Add video link", placeholder copy variants, plus new keys from addendum §"Open Questions" — bucket headers, soft-remove confirm copy, hard-delete confirm copy, "Set unknown" placeholder, "Manual session" bucket label.

---

## RELATED ARTIFACTS

- **GitHub issue #169** — Log Today HOME button (parent context)
- `MovesBook_LogToday_v1_Step3_Addendum.md` — auto-capture data model resolution (canonical for §What I worked on internals)
- `docs/research/LogToday_v1_AutoCapture_Inventory.md` — deployed-reality dossier (untracked; Sources 1–7 + Cross-Cutting Concerns 1–4)
- `MovesBook_Battle_Unification_Issue.md` — Battle redesign parking ticket
- `MovesBook_BodyCheck_Spec_v0_1.md` — Body Check feature parking spec
- For Next Time issue draft (in working memory; filed when Log Today v1 ships)
- `MovesBook_DesignSystem_v2_0.md` — single source of truth for visual rules
- `MovesBook_EditMove_Redesign_v1.md` — methodological precedent for this spec doc

---

## NEXT STEPS

1. ~~**Step 3** — auto-capture data model session~~ **DONE.** See `MovesBook_LogToday_v1_Step3_Addendum.md`.
2. ~~**Step 4** — refine and lock this spec doc against Step 3 outcomes~~ **DONE.** This document.
3. **Step 5** — preview JSX of Training sub-tab (validates auto-capture UX visually). Resolves OQ#2 + OQ#3 + chevron animation + empty-state copy + manual picker mobile pattern.
4. **Step 6** — preview JSX of full modal navigation (validates four-sub-tab structure across themes/languages). Resolves OQ#4.
5. **Step 7** — break into surgical CC prompts. **Estimated 7–9 sessions** (revised from 4–6 after addendum's depth absorbed). See addendum §"Next Step" for the A → M prompt breakdown. Prompt-order summary: extract `useDayData(date)` → FlashCards `setId` → projection layer + 7 buckets → Training sub-tab UI → `mb_log_exclusions` store → entry points (HOME button, Calendar `+` removal) → modal shell → Conditioning sub-tab → Rest sub-tab → Battle pass-through → SessionJournal removal → translations.

---

*End of v1 spec. Companion preview JSX files to follow.*
