# MovesBook — Log Today v1 — Pivot to Manual-with-Counters

**Status:** Pivot decision locked May 2026. Supersedes the auto-capture addendum (`MovesBook_LogToday_v1_Step3_Addendum.md`) for v1 implementation. Parent spec (`MovesBook_LogToday_v1.md`) remains valid for: entry points, sub-tab structure, modal architecture, Conditioning/Battle/Rest sub-tabs, save/cancel behavior, scope-protection decisions.
**Companion files:**
- `MovesBook_LogToday_v1.md` — parent spec (sections marked below stay canonical; auto-capture references in §Training Sub-Tab become dormant)
- `MovesBook_LogToday_v1_Step3_Addendum.md` — **archived as v0.5 reference**, not the implementation path
- `docs/research/LogToday_v1_AutoCapture_Inventory.md` — archived dossier (untracked); preserved for future reference if auto-capture revisits
**Aligned with:** `MovesBook_DesignSystem_v2_0.md`, `MovesBook_EditMove_Redesign_v1.md` (counter pattern shared)

---

## DECISION

After three days of implementation across prompts D1, D2, E1, E3, E4, and H, the auto-capture infrastructure proved to cost more than the convenience it provides. Last screenshot trace from H QA surfaced four bugs (soft-remove not persisting, Drill subtitle empty, FlashCards bucket missing, dark-mode tile freeze), all in auto-capture code — the form, modal shell, sub-tab nav, ghost button, and pickers worked correctly.

The pivot: **Log Today v1 ships as a manual-entry form with per-row rep counters** for moves and sets. Users open the modal, tap `+` to add moves or sets via the existing pickers, and adjust counters inline. Save aggregates counter values into each move's and set's rep history.

Reasoning:
- Auto-capture was a convenience layer — users already know what they trained. The "mirror" principle says reflect what happened, but the user IS the source of what happened.
- Approximately 5 of the 8 prompts in the auto-capture addendum existed only to support that layer.
- Per-row rep counters land a feature already wanted (move/set rep tracking) that the Edit Move redesign also needs.
- Bug surface drops dramatically — every diagnosed H QA bug lived in code that becomes dormant.

This is a course-correction, not a failure. The shipped auto-capture code stays in the repo as dormant infrastructure (no rip-out), available for revisit if user signal supports it post-launch.

---

## WHAT STAYS ALIVE

Already shipped, no changes needed:

- `LogTodayModal.jsx` — shell, sticky header, 4-sub-tab nav, sticky footer (H)
- `LogTodayTraining.jsx` — `forwardRef` + `useImperativeHandle.save()` pattern (H)
- `ComingSoonState.jsx` — Battle/Conditioning/Rest placeholder (H)
- `LogTodayMovePicker.jsx` — multi-select picker with back-arrow top-left (H)
- `LogTodaySetPicker.jsx` — multi-select picker with back-arrow top-left (H)
- HOME "Log Today" ghost button (H)
- Save → calendar event write via `addCalendarEvent` (E4)
- Picker selection state lifted to `LogTodayModal` (Q1 from H)
- 4-sub-tab navigation pattern (H)
- All non-bucket form fields: title, "How it felt", duration, location, video link, today's note (E4)

---

## WHAT BECOMES DORMANT

Code stays in the repo. Imports + mounts are removed. No deletion. Dormant means "not wired in but available to revisit."

| File / artifact | Status |
|---|---|
| `useLogTodayTrainingState.js` (E1) | Dormant — modal stops calling it |
| `useDayData.js` (D1) | Stays — Calendar still consumes it |
| `mb_log_exclusions` store (E1) | Dormant — no writes, no reads in v1 |
| Soft-remove + commit/revert pattern (E1) | Dormant |
| 7 bucket renderers in `LogTodayTraining.jsx` (E3) | Removed from JSX; component code stays in file commented out OR moved to a `_dormant/` folder |
| Dedup priority tiers (E3) | Dormant (in the hook) |
| FlashCards `setId` schema addition (D2) | **Stays** — backward-compatible, useful regardless |
| 1v1 omission fix bundled with `useDayData` (D1) | **Stays** — Calendar benefits |
| Auto-capture inventory dossier | Archived as reference |

**Move-tile "trained" tap (`m.date = today` mutation):** stays. Still useful as a "last trained" marker on each move tile. The Log Today form ALSO calls `markMoveTrainedToday` on Save for moves with reps > 0 — same behavior, redundant signal that doesn't conflict.

**Calendar's "LOG SESSION" button + grid-tap:** unchanged, still routes to `SessionJournal`. Prompt L (deferred indefinitely) is the only thing that retires SessionJournal.

---

## UPDATED v1 DESIGN — Training sub-tab

The Training sub-tab is now the primary canonical sub-tab. Other three (Battle/Conditioning/Rest) ship as `ComingSoonState` per H, build out in I/J/K.

### Form sections (top to bottom)

| # | Section | Type | Status |
|---|---|---|---|
| 1 | Session title | Text input, optional | Shipped (E4), no change |
| 2 | What I worked on | **Per-row rep counters + free-text "Anything else"** | NEW — replaces auto-capture buckets |
| 3 | How it felt | Free-text textarea | Shipped (E4), no change |
| 4 | Duration | HH + MM numeric inputs | Shipped (E4), no change |
| 5 | Location | Free-text single line | Shipped (E4), no change |
| 6 | Video link | URL, dashed-button reveal | Shipped (E4), no change |
| 7 | Today's note | Free-text textarea | Shipped (E4), no change |

### "What I worked on" — the new shape

**Empty state** (no moves or sets selected yet):
- Section header "What I worked on" with `+` button on the right (existing E4 pattern)
- A single muted hint line below: `t("logTodayWhatIWorkedOnHint")` — *"Tap + to add the moves and sets you trained today."*
- Free-text textarea below: `t("logTodayAnythingElsePlaceholder")` — *"Anything else..."* (existing `workDescription` field, no change)

**Populated state** (one or more moves/sets selected):
- Section header "What I worked on" with `+` button on the right
- A vertical list of rows, one per selected move and one per selected set
- Each row: `[name]  [−]  [count]  [+]  [×]`
- Free-text textarea below

### Row layout

```
┌────────────────────────────────────────────────────┐
│ Move name (or Set name)            [−]  3  [+] [×] │
└────────────────────────────────────────────────────┘
```

**Visual spec (DS v2.0 compliant):**
- Container: `background: C.surface, borderRadius: 8, padding: "10px 12px"`, NO border, NO box-shadow
- Border-left stripe: 4px solid in the move's category color (or set's color if sets carry one); plain rows for sets without colors
- Name (left): FONT_DISPLAY, fontSize 14, weight 800, letterSpacing 1.2, uppercase, color `C.text`. Truncates with ellipsis if too long.
- Counter cluster (right): inline-flex, gap 6
  - `−` button: 28x28, borderRadius 6, background `C.surfaceAlt`, no border, FONT_DISPLAY weight 700, color `C.textSec`. Disabled (opacity 0.4) when count is 0.
  - Count display: minWidth 32, textAlign center, FONT_DISPLAY, fontSize 16, weight 800, color `C.text`. Shows the integer.
  - `+` button: 28x28, same as `−` but color `C.accent`. No upper limit clamp.
- `×` button (rightmost): no background, padding 4, `<Ic n="x" s={14} c={C.textMuted}/>`. Removes the row entirely (move/set deselected).
- Row gap (vertical): 6px between consecutive rows
- Subtitle row (optional, below name): for sets only — `subtitleStyle` (FONT_BODY, fontSize 11, color `C.textMuted`) showing `"{N} moves"`. For individual moves, no subtitle.

### Interaction

**Adding moves/sets:**
1. Tap `+` next to "What I worked on" → chooser BottomSheet opens (existing E4: "Add moves" / "Add a set")
2. Tap "Add moves" → `LogTodayMovePicker` opens full-modal-overlay (H pattern)
3. Multi-select moves → tap back-arrow → form returns
4. Each newly-selected move appears as a new row at the bottom of the list, counter starting at 0
5. Same flow for sets via `LogTodaySetPicker`

**Re-opening the picker** (user wants to add more):
- Currently-selected moves appear pre-checked in the picker (existing E4 behavior — `selectedMoveIds` prop)
- Unchecking in the picker removes the move from the form's row list (and zeroes its counter)
- Checking adds it back as a new row with counter 0 (no memory of previous count)

**Counter behavior:**
- Tap `+` → counter increments by 1
- Tap `−` → counter decrements by 1, clamped at 0
- No long-press, no drag, no keyboard input. Tap-only, simple.
- No upper bound (user can hit + as many times as they want)

**Removing a row:**
- Tap `×` on the right edge → row disappears from the list, move/set deselected. Same as unchecking in the picker.

**The ordering rule:**
- Newly added rows appear at the bottom of the existing list (chronological selection order)
- No drag-to-reorder in v1
- Sets and moves can interleave in the list — they don't get separate buckets visually

---

## SAVE BEHAVIOR

On Save, the calendar event record is written with two new fields:

```js
{
  ...existingFields,
  moveReps: [
    { moveId: "abc", reps: 5 },
    { moveId: "def", reps: 0 },  // user added but didn't count
    // ...
  ],
  setReps: [
    { setId: "xyz", reps: 3 },
    // ...
  ],
}
```

**`moveIds` and `setIds` continue to be written** for backward compatibility — derived as `moveReps.map(r => r.moveId)`. Existing consumers (Calendar day-detail, etc.) read `moveIds` unchanged.

**Per-move rep history:**
For each entry in `moveReps` with `reps > 0`, append to `move.repsHistory[]`:

```js
move.repsHistory = [
  ...existing,
  { date, count: 5, source: "log_today", sessionId: event.id },
];
```

If `move.repsHistory` doesn't exist yet on the schema, create it on first write. Backward-compatible; no migration needed.

**Per-set rep history:**
Same pattern, on `set.repsHistory[]`. A "set rep" represents one full pass through the set, NOT individual move reps within it. Sets and individual moves track their own counts independently — if a user wants per-move counts within a set, they add the moves separately with their own counters.

**`markMoveTrainedToday` calls:**
For every `moveId` in `moveReps` (regardless of count) AND every move inside any set in `setReps`, call `markMoveTrainedToday(moveId)`. Same behavior as E4 today. Picking a move means user trained it; counter just refines how many.

**Aggregation for Edit Move's Total Reps:**
The Edit Move spec (`MovesBook_EditMove_Redesign_v1.md`) defines:
```js
totalReps: { drill, spar, sets, manual }
```
With this pivot, Log Today contributes via `move.repsHistory[].count` summed where `source: "log_today"`. The Edit Move display can either:
- Add a fifth bucket: `logToday`
- Or fold into `manual` since both are user-authored

**Decision deferred** to whichever ships first (Edit Move redesign or Log Today). Either implementation reads `repsHistory` for log-today reps and slots them into the Total Reps display however the Edit Move modal chooses.

---

## STATE MODEL

Modal-local form state additions:

```js
// In LogTodayModal:
const [pendingMoveIds, setPendingMoveIds] = useState([]);    // existing from H
const [pendingSetIds, setPendingSetIds] = useState([]);       // existing from H
const [moveReps, setMoveReps] = useState({});  // NEW: { [moveId]: count }
const [setReps, setSetReps] = useState({});    // NEW: { [setId]: count }
```

**Counter helpers** (passed to LogTodayTraining as props):
```js
const incMoveRep = (id) => setMoveReps(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
const decMoveRep = (id) => setMoveReps(p => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 1) }));
const incSetRep = (id) => setSetReps(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
const decSetRep = (id) => setSetReps(p => ({ ...p, [id]: Math.max(0, (p[id] || 0) - 1) }));
```

**Cleanup on remove:**
When `pendingMoveIds` loses an id (× button or picker uncheck), delete that id from `moveReps`. Same for sets. Otherwise stale counts persist for moves that aren't in the form.

**Initialization (default behavior):**
- New session: all four state values empty
- Edit existing session (FUTURE — not v1): pre-populate `moveReps` and `setReps` from the saved event's data

**Save / Cancel** unchanged from H:
- Save: form's `save()` reads `moveReps` and `setReps` from props, writes the calendar event, calls `markMoveTrainedToday`, appends to `repsHistory` for each, calls `onClose`
- Cancel/X: working state dies on unmount, no writes

---

## PROP CHANGES — what threads through

**Removed from `LogTodayTraining` props:**
- `buckets`
- `isPending`
- `onToggleExclusion`

**Added to `LogTodayTraining` props:**
- `moveReps` (object)
- `setReps` (object)
- `incMoveRep`, `decMoveRep`, `incSetRep`, `decSetRep` (handlers)

**Removed from `LogTodayModal` props (passed through from HomePage):**
- `reps`, `sparring`, `musicflow`, `habits`, `ideas`, `calendar`, `log_exclusions`, `setLogExclusions`

**Removed from `HomePage` props (threaded from App.jsx):**
- Same list as above

**Kept on the chain:**
- `moves`, `sets`, `cats`, `catColors`, `addCalendarEvent`, `addToast`
- `markMoveTrainedToday` — still needed for the "trained today" marker
- `onUpdateCalendarEvent` — needed once edit-mode lands (deferred), but harmless to keep threaded

This simplification undoes most of H's prop-widening on App.jsx and HomePage.

---

## UPDATED PROMPT SEQUENCE

H is shipped. The auto-capture-dependent prompts in the addendum (D-revised, E5, F, etc.) are dormant. The new path:

| Prompt | Description | Status |
|---|---|---|
| **PIVOT-1** | Strip auto-capture from `LogTodayModal` + `LogTodayTraining`. Remove `useLogTodayTrainingState` call, bucket renderers, soft-remove handlers, all dormant props. | NEXT |
| **PIVOT-2** | Build the per-row counter UI in "What I worked on" section. New row component, counter logic, prop wiring. | After PIVOT-1 |
| **PIVOT-3** | Wire Save flow — `moveReps` / `setReps` on calendar event, `repsHistory` append on each move/set. Schema-additive, backward-compatible. | After PIVOT-2 |
| **PIVOT-4** | Translation pass — new keys for the counter UI hint, plus the 5 keys H already shipped. | After PIVOT-3 |
| I (parent spec) | Conditioning sub-tab build-out | Future |
| J (parent spec) | Rest sub-tab build-out | Future |
| K (parent spec) | Battle sub-tab pass-through to existing Rivals modal | Future |
| L (parent spec) | Retire SessionJournal — reroute Calendar entry points | **Deferred indefinitely** per H decision |
| M (parent spec) | Translation pass for everything | Continuous |

PIVOT-1 + PIVOT-2 + PIVOT-3 may be a single prompt depending on scope estimate. PIVOT-4 is small.

**Estimated total scope to v1 ship:** 3–4 CC sessions, vs. the addendum's 8–9.

---

## OPEN QUESTIONS

1. **Set rep semantics confirmation:** "1 rep of a set" = "completed the set once end-to-end"? Locking this for PIVOT-2.
2. **Set color stripe on row:** sets don't have a category color today. Use `C.accent` for set rows? Or leave them with no stripe (which signals "not a category-rooted item")? Lean: no stripe, distinguishes from move rows.
3. **Should sets auto-expand to show member moves below the row?** Probably no for v1 — keeps row compact. Future enhancement if users ask for it.
4. **Edit-mode pre-population:** when editing a saved session, do reps reload? Yes, but edit-mode is deferred to a separate prompt regardless.
5. **`repsHistory` schema name:** confirm field name matches existing patterns. `journal` exists already (per Edit Move spec); `repsHistory` is new. Verify no conflict.
6. **What happens to a row whose underlying move was deleted between session save and reopen?** Probably show as "Move unknown" with the saved count, allow X to remove. Edge case.

---

## WHAT THE USER SEES (summary)

Open Log Today → Training tab is active → empty form with sections.

Tap `+` next to "What I worked on" → chooser → "Add moves" → picker → multi-select → back-arrow.

Form now shows rows for each picked move, counter at 0. Tap `+` on a row to count reps. Tap `+` again. Tap `−` to undo. Tap `×` to remove the move from the session.

Repeat for sets via "Add a set."

Fill in any other fields (duration, location, etc.). Save.

Each move's rep history grows by the count entered. Each set's rep history grows by the count entered. Calendar shows the session.

Manual, deliberate, transparent. The user authored every datum. No surprise auto-capture, no soft-remove confusion, no dedup logic to reason about.

---

## OUT OF SCOPE FOR PIVOT v1

- Editing a saved session (deferred — separate prompt)
- Drag-to-reorder rows
- Bulk-add (e.g., "add all moves from Footworks category")
- Per-move-within-a-set rep counters (sets have one counter for the whole set)
- Long-press for accelerated counter increment
- Numeric keyboard input for counter (tap-only)
- Time-stamping individual reps
- Showing rep deltas vs. yesterday in the row
- Undo on Save (use Calendar to edit/delete after the fact)
- Auto-capture revisit (preserved as dormant code; revisit decision deferred 6+ months)

---

## RELATED ARTIFACTS

- `MovesBook_LogToday_v1.md` — parent spec (still canonical for non-Training sub-tabs and structure)
- `MovesBook_LogToday_v1_Step3_Addendum.md` — archived; do not implement
- `MovesBook_EditMove_Redesign_v1.md` — Total Reps section reads `repsHistory[]` once both ship
- `docs/research/LogToday_v1_AutoCapture_Inventory.md` — archived dossier
- `MovesBook_Battle_Unification_Issue.md` — separate parking ticket
- `MovesBook_BodyCheck_Spec_v0_1.md` — separate spec
- `MovesBook_DesignSystem_v2_0.md` — visual rules

---

## NEXT STEPS

1. **Review this pivot spec** — confirm the design decisions are right before any code.
2. **File three GitHub issues:**
   - "Log Today v1 — strip auto-capture, ship manual-with-counters" (PIVOT-1+2+3 umbrella)
   - "Auto-capture infrastructure dormant — revisit Q4 2026" (parking)
   - "Edit Move Total Reps — read from `repsHistory[]`" (cross-reference for when Edit Move ships)
3. **Decide PIVOT prompt grouping** — single prompt or split into 3? Lean: single prompt if total stays under 600 lines.
4. **Resolve Open Questions 1–6** above before writing the prompt.
5. **Write PIVOT prompt** following the standard 7-phase prompt structure.

---

*End of pivot spec. The shipped H code remains correct — pivot is a forward step, not a rollback.*
