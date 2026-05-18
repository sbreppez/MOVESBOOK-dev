# #264 — Move Delete Cleanup — Investigation

**Branch:** `v2`
**Scope:** Read-only. Document every store that references moves, the
shape of each reference, and the current move-delete code path.
Verify post-#262 changes. Surface conflicts with the design
conversation's locked decisions.

---

## 1. Every store referencing moves

Exhaustive sweep across `src/` for `moveId`, `moveIds`, `move_id`,
`move_ids`, and other field names that hold a move reference. Storage
keys are enumerated from `App.jsx` initializers and the BackupModal
key map ([src/App.jsx:78-265](../../src/App.jsx),
[src/components/modals/BackupModal.jsx:7-20](../../src/components/modals/BackupModal.jsx)).

### Stores that reference moves

| Store | Field | Shape | Where written | Where read |
| ----- | ----- | ----- | ------------- | ---------- |
| `mb_sets` | `set.moveIds: number[]` | ordered array of move IDs | [SetDetailModal.jsx:44](../../src/components/moves/SetDetailModal.jsx) (`{ moveIds: localIds }`) | [SetDetailModal.jsx:105](../../src/components/moves/SetDetailModal.jsx) (`allMoves.find(mv=>mv.id===id); if(!m) return null`), [SetDetailModal.jsx:213](../../src/components/moves/SetDetailModal.jsx) (Arc chart — no missing-move guard), [RepCounter.jsx:118, :125, :139, :230, :246](../../src/components/train/RepCounter.jsx), [BattlePrepSetup.jsx:508](../../src/components/train/BattlePrepSetup.jsx), [SetsView.jsx](../../src/components/moves/SetsView.jsx), [FlashCards.jsx](../../src/components/moves/FlashCards.jsx), [LogTodaySetPicker.jsx](../../src/components/logToday/LogTodaySetPicker.jsx). |
| `mb_combos` | `combos.selectedMoveIds: number[] \| null` | pool filter for the spin machine | [ComboMachine.jsx](../../src/components/train/ComboMachine.jsx) `MovePicker` | [ComboMachine.jsx:71-72](../../src/components/train/ComboMachine.jsx) (`moves.filter(m => combos.selectedMoveIds.includes(m.id))` — stale IDs silently dropped at filter time). |
| `mb_battleprep` | `plan.arsenal.moveIds: number[]` + `plan.arsenal.setIds: number[]` | two arrays per plan | [BattlePrepSetup.jsx:159](../../src/components/train/BattlePrepSetup.jsx) (`arsenal: { moveIds: selectedMoveIds, setIds: selectedSetIds }`) | [BattleDayView.jsx:135-136](../../src/components/train/BattleDayView.jsx) (`ids.map(id => moves.find(m => m.id === id)).filter(Boolean)`). |
| `mb_reps` | `session.moveId: number` (single-move) **or** `session.moveIds: number[]` + `session.setId` (set session) | discriminated by `session.isSet` | [RepCounter.jsx:119-130](../../src/components/train/RepCounter.jsx) (set session: `{id, isSet:true, setId, setName, setColor, moveIds, moveCount, reps, duration, date}`), [RepCounter.jsx:151-159](../../src/components/train/RepCounter.jsx) (single-move: `{id, moveId, moveName, moveCategory, reps, duration, date}`) | [textStream.js:395](../../src/utils/textStream.js) (`moveById.get(r.moveId)` returns `undefined` for missing); [RepCounter.jsx:391-410](../../src/components/train/RepCounter.jsx) history list — renders `s.moveName` (denormalized; survives move delete). |
| `mb_sparring` | `session.movesTrained: number[]` | array of move IDs tagged in the session | [Sparring.jsx](../../src/components/train/Sparring.jsx) save | [App.jsx:1337-1340](../../src/App.jsx) — reduces over IDs to append a `'sparring'` trainingLog entry. No display-time reader uses `movesTrained` directly (verified by grep). |
| `mb_calendar` | `event.moveIds: number[]` (+ `event.setId`, `event.setIds`, `event.categories`) | array | [RepCounter.jsx:139, :144, :167](../../src/components/train/RepCounter.jsx) (Rep Counter / Set), [ComboMachine.jsx:179](../../src/components/train/ComboMachine.jsx) (Combo Machine calendar event), [LogTodayTraining.jsx](../../src/components/logToday/LogTodayTraining.jsx), [Sparring.jsx](../../src/components/train/Sparring.jsx), [CompetitionSimulator.jsx](../../src/components/battle/CompetitionSimulator.jsx) | [LogTodayTraining.jsx:52](../../src/components/logToday/LogTodayTraining.jsx) (`existingEvent.moveIds.map(...)`), [App.jsx:1071-1075](../../src/App.jsx) `recordEventTraining` propagates to each move's trainingLog (`setEventTraining`). |
| `mb_battles` | `round.moves: number[]` **— field name is `moves`, NOT `moveIds`** | array of move IDs per round; default `[]` ([BattleFormBody.jsx:24](../../src/components/battle/BattleFormBody.jsx), [RivalsPage.jsx:170](../../src/components/battle/RivalsPage.jsx)) | round form (no current write surface — picker is TODO at [RoundCard.jsx:303](../../src/components/battle/RoundCard.jsx)) | [RoundCard.jsx:282-298](../../src/components/battle/RoundCard.jsx) — `round.moves.map((moveId) => moves.find(m => m.id === moveId))` then renders chip with **bare numeric ID** as fallback text if the move is gone (`<span … >{moveId}</span>` at :297). |
| `mb_battles` | `round.entries[].items[]: { type: 'move'\|'set', refId }` | mixed array | [CompetitionSimulator.jsx:251-258](../../src/components/battle/CompetitionSimulator.jsx) (write) | [CompetitionSimulator.jsx:251-258](../../src/components/battle/CompetitionSimulator.jsx) — filters with `.filter(Boolean)`; [EditRoundView.jsx:33-34](../../src/components/battle/EditRoundView.jsx) — dedupe key. |
| `mb_rrr` | `rrr.lastUsed.moveId: number \| null` (+ denormalized `moveName`) | single ID | [App.jsx:164](../../src/App.jsx), [App.jsx:789](../../src/App.jsx) (reset) | Display reads `moveName` directly (denormalized), so it survives move delete. ID becomes silently stale. |
| `mb_home_stack` | `tile.moveId: number` (when `tile.type === 'moveUpdate'`) | single ID per tile | [HomePage.jsx:1095](../../src/components/home/HomePage.jsx) (`{ id: tileId, type: "moveUpdate", moveId: m.id }`) | [HomePage.jsx:76](../../src/components/home/HomePage.jsx), [HomePage.jsx:501](../../src/components/home/HomePage.jsx) — `moves?.find(m => m.id === tile.moveId)` returns `undefined`. If the move is gone, the tile likely renders broken (worth verifying in implementation). |
| `mb_freestyle_list` | `item.refId` + `item.type ('move'\|'set')` | array of mixed refs | [FreestylePage.jsx:117, :134-135](../../src/components/battle/FreestylePage.jsx) | [FreestylePage.jsx:108](../../src/components/battle/FreestylePage.jsx) — `find` returns `undefined`. |
| `mb_freestyle_saved` | `list.items[].refId` + `list.items[].type` | same shape as above | [FreestylePage.jsx:89-91](../../src/components/battle/FreestylePage.jsx) (snapshot of `toUse` on save) | Same read pattern when loading a saved list. |

### Stores that DO NOT reference moves (verified)

Confirmed via `moveId`/`moveIds`/`refId` grep + per-store schema check:

| Store | Notes |
| ----- | ----- |
| `mb_ideas` | Notes / goals / targets. No moveIds today. ([src/utils/storage.js:25-38](../../src/utils/storage.js)). Note: #263 will add `moveIds` to count-reps targets — explicitly out of scope per the prompt. |
| `mb_habits` | Habits. No moveIds anywhere. ([src/App.jsx:127-131](../../src/App.jsx)). |
| `mb_user_templates` | Routine templates have `{name, steps:[{id, text}], repeat, timeOfDay}` ([RoutineForm.jsx:32-37](../../src/components/home/RoutineForm.jsx)). Steps are free-text checkboxes — no move refs. |
| `mb_rounds` | Stores Sets-of-Sets via `round.setIds: number[]` ([SetDetailModal.jsx:44](../../src/components/moves/SetDetailModal.jsx)). Indirectly references moves through Sets, but holds no moveIds itself. |
| `mb_flowmap` | `pairings` keys are derived from **move name strings** (e.g. `"MoveA → MoveB"`), with `__u2192` migration at [App.jsx:212-222](../../src/App.jsx). `customTransitions: string[]` are arrow labels. No move IDs at all — name-based, immune to ID churn but susceptible to renames. |
| `mb_musicflow` | `{sessions: []}` — sessions store `{date, duration, ...}`. No move refs (verified by grep). |
| `mb_lab` | `{customChips: {technical:{}, conceptual:{}}}`. No move refs. |
| `mb_flashcards` | `{bestScore}`. No move refs. |
| `mb_sparring.records` | The records sub-store on `mb_sparring` tracks PRs (rounds, time, etc.), not move references. |
| `mb_reports`, `mb_stance`, `mb_rivals`, `mb_battle_formats`, `mb_reminders`, `mb_presession`, `mb_injuries`, `mb_rest_log`, `mb_rest_types`, `mb_reflections`, `mb_milestones_shown`, `mb_cats`, `mb_cat_colors`, `mb_cat_domains`, `mb_custom_attrs`, `mb_profile`, `mb_profile_photo`, `mb_settings`, `mb_home_checks` | All checked: no moveId/moveIds/refId-to-move fields. |

### Per-move data (lives inside the move object — automatically deleted with the move)

| Field | Where | Notes |
| ----- | ----- | ----- |
| `move.trainingLog: []` | initialized in [src/utils/storage.js:21](../../src/utils/storage.js); entries `{date, count, source, sourceId?}` per [src/utils/trainingLog.js:1-7](../../src/utils/trainingLog.js) | **Not a separate store.** Lives on each move. Deleting the move deletes the log. |
| `move.journal: []` | initialized in [src/utils/storage.js:20](../../src/utils/storage.js); entries written by MoveModal | Same — per-move, deleted with the move. |
| `move.parentId: number \| null` | initialized in [src/utils/storage.js:19](../../src/utils/storage.js) | **Cross-move reference!** Children of a deleted parent become orphan parents. Read by [MoveModal.jsx:110](../../src/components/moves/MoveModal.jsx) (`allMoves.find(m => m.id === f.parentId)`) — returns `undefined` silently. Worth flagging for the implementation prompt as a possible additional sweep target. |

**Conclusion:** Eleven distinct stores (or sub-paths within stores)
hold move references; the issue body's enumeration named four of them
and missed seven, including the post-#262 calendar/reps additions,
home stack moveUpdate tiles, sparring `movesTrained`, freestyle lists,
battle rounds, RRR last-used, and combos pool filter. Plus one
**within-`mb_moves`** cross-reference (`move.parentId`) the issue body
didn't anticipate.

---

## 2. Beyond `moveIds[]` — other reference shapes

The issue body's framing ("sweep `moveIds[]` arrays") would miss the
following shapes:

### 2.1 Singular `moveId` fields (number, not array)

- **`mb_reps` single-move sessions** carry `session.moveId` ([RepCounter.jsx:153](../../src/components/train/RepCounter.jsx)). A sweep that only handles arrays would skip these.
- **`mb_rrr.lastUsed.moveId`** ([src/App.jsx:164](../../src/App.jsx)) — single ID nested inside an object.
- **`mb_home_stack` `moveUpdate` tiles** carry `tile.moveId` ([HomePage.jsx:1095](../../src/components/home/HomePage.jsx)). Singular per tile.

### 2.2 Differently-named array fields

- **`mb_battles[].rounds[].moves: number[]`** — the field is named `moves` (not `moveIds`). A literal pattern match on `moveIds` would miss it. See [RoundCard.jsx:282](../../src/components/battle/RoundCard.jsx).
- **`mb_combos.selectedMoveIds: number[]`** — uses an unusual name (`selected…`).
- **`mb_sparring[].sessions[].movesTrained: number[]`** — uses `movesTrained`, not `moveIds`.

### 2.3 Mixed `refId` + `type` discriminator

The `refId` pattern is used in three places. The same field can hold a
move ID, a set ID, an idea ID, or a habit ID — distinguished by a
sibling `type` field:

- **Battle round entry items** (`round.entries[].items[]`): `{type: 'move' \| 'set', refId}` ([CompetitionSimulator.jsx:253](../../src/components/battle/CompetitionSimulator.jsx), [EditRoundView.jsx:33](../../src/components/battle/EditRoundView.jsx)).
- **Freestyle list / saved-list items**: `{id, refId, type: 'move' \| 'set', checked}` ([FreestylePage.jsx:117, :134-135](../../src/components/battle/FreestylePage.jsx)).
- **Home stack tile of type `goalhabit`** uses `refId` for ideas/habits — not moves — so it's not in scope for this cleanup ([homeMigration.js:42, :54](../../src/utils/homeMigration.js)). Just flagging so the implementation doesn't accidentally touch it.

A sweep that handles `refId` must check `type === 'move'` to avoid
nuking set/idea/habit references.

### 2.4 Denormalized name copies

`mb_rrr.lastUsed` carries `moveName` alongside `moveId`. `mb_reps[]`
sessions carry `moveName`, `moveCategory`, `setName`, `setColor`. These
denormalized copies mean the user-visible label survives a move delete
even if the ID is orphaned — which is part of why the issue's
"`mb_reps` filter-on-read" decision actually works: the history UI
reads `s.moveName` ([RepCounter.jsx:395](../../src/components/train/RepCounter.jsx)), not the move object.

**Caveat:** If the cleanup also decides to update the denormalized
labels (e.g. mark "(deleted)" on stale `moveName`), that's a separate
design choice — flagged in Open questions.

### 2.5 Name-based references (no IDs)

- **`mb_flowmap.pairings`** keys are derived from move-name strings (e.g. `"MoveA · MoveB"`, transition arrows in between). Deleting a move by ID does **not** affect flowmap pairings — they survive intact as orphan name keys. A move *rename* affects them, not a delete. This is out of scope for move-delete cleanup but worth noting so the prompt doesn't try to sweep flowmap.

### 2.6 Embedded move objects

No store grep-confirmed to embed the whole move object inline (vs.
referencing by ID). All readers go through `moves.find(m => m.id === …)`.

**Conclusion:** The issue body's "sweep `moveIds[]` arrays" is too
narrow. The implementation prompt needs to handle: singular
`moveId` fields, the `moves` array on battle rounds (misleadingly
named), the `selectedMoveIds` and `movesTrained` arrays, and the
`refId`-with-`type='move'` pattern. Name-based references in flowmap
are immune to delete and need no sweep.

---

## 3. Current move-delete code path

**Location:** [src/hooks/useMoveCrud.js:26](../../src/hooks/useMoveCrud.js).

```js
const delMove = (id) => setMoves(prev => prev.filter(m => m.id !== id));
```

That is the entire delete. One-liner; no cascading anything.

**Confirm-delete gate** ([useMoveCrud.js:28-31](../../src/hooks/useMoveCrud.js)):
```js
const tryDelMove = (m) => {
  if (st.confirmDelete !== false) setConfirmDeleteMove(m);
  else delMove(m.id);
};
```
Standard `settings.confirmDelete` gate. The confirmation modal calls
`delMove(m.id)` on accept. No side effects beyond removing from the
moves array.

**Bulk delete** ([useMoveCrud.js:51-56](../../src/hooks/useMoveCrud.js)):
```js
const bulkDeleteSelected = () => {
  setMoves(prev => prev.filter(m => !selectedMoveIds.has(m.id)));
  setConfirmBulkDeleteMoves(false);
  exitMoveSelectMode();
  addToast({ icon: "trash", title: t("deleted") });
};
```
Adds a toast and exits select mode. Same: zero cascade.

**Cleanup hook placement options:**

Three patterns are already in use in this codebase; pick whichever the
implementation prompt prefers:

- **Hook on the action** (chosen by the calendar event delete path).
  See [DaySections.jsx:81-84](../../src/components/home/DaySections.jsx):
  ```js
  const handleDeleteEvent = useCallback((id) => {
    setCalendar(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
    setMoves(prev => removeEventTraining(prev, id));
  }, [setCalendar, setMoves]);
  ```
  Calendar delete also calls `removeEventTraining` on moves — atomic
  paired update in one click handler. This is the most natural pattern
  for the move-delete cleanup: extend `delMove` and `bulkDeleteSelected`
  to call setters for every affected store, in the same handler.

- **Effect watching `moves`** would react to any change, including
  reordering and edits, which would fire unnecessary cleanup work.
  Discouraged unless the prompt has a reason.

- **Move IDs as `Set` parameter** — `bulkDeleteSelected` already uses a
  `Set` of selected IDs. A single helper `cleanupAfterMoveDelete(ids: Set<number>)`
  called from both `delMove` (wrapped in a 1-element Set) and
  `bulkDeleteSelected` would minimise duplication. Suggested for the
  prompt to consider.

**Existing cleanup:** none whatsoever. Verified via grep for
`setSets`, `setCombos`, `setBattleprep`, `setCalendar`, etc. inside
`useMoveCrud.js` and around `delMove`. The function has zero awareness
of any other store.

**Conclusion:** Cleanup must be added at the action level (mirroring
the calendar→trainingLog pattern at DaySections.jsx:81-84) and must
run for both `delMove` and `bulkDeleteSelected`. The hook factory at
`useMoveCrud.js` currently has no access to the other stores' setters,
so either the hook signature grows or the cleanup is hoisted to the
caller in `App.jsx`.

---

## 4. Sets after #262

Verified against the deployed code post-`d66bcae feat(#262): Drill integrates Sets`.

### `set.moveIds` shape — unchanged

Still `moveIds: number[]`, written verbatim by [SetDetailModal.jsx:44](../../src/components/moves/SetDetailModal.jsx). #262 did not change the Set's pre-existing move-linkage shape.

### `set.drillCount` and `set.lastDrilledAt` — added by #262

Confirmed at [src/App.jsx:1323-1327](../../src/App.jsx) inside the
`onSaveSetSession` handler:

```js
setSets(prev => prev.map(s =>
  s.id === session.setId
    ? { ...s, drillCount: (s.drillCount || 0) + session.reps, lastDrilledAt: Date.now() }
    : s
));
```

Both fields are Set-level aggregates (total reps drilled into this
Set, last-drilled timestamp), independent of any individual move's
existence. **They need no cleanup on move delete** — they're rollups,
not pointers. They're not initialized in any `migrateSet` (no
`migrateSet` function exists in [src/utils/storage.js](../../src/utils/storage.js));
the `(s.drillCount || 0)` fallback handles missing values lazily.

### Rep Counter calendar event for Set sessions

Confirmed at [src/components/train/RepCounter.jsx:132-145](../../src/components/train/RepCounter.jsx):

```js
addCalendarEvent({
  date: todayLocal(),
  type: "training",
  title: `Rep Counter — ${selectedSet.name}`,
  categories: cats,                 // unique categories from setMoves
  moveIds: selectedSet.moveIds || [],
  duration: Math.round(duration / 60) || 1,
  source: "rep_counter",
  sessionId: session.id,
  setId: selectedSet.id,
  setIds: [selectedSet.id],
}, { silent: true });
```

All five claimed fields confirmed: `setId`, `setIds: [setId]`,
`moveIds: <K move IDs>`, `categories: <unique cats>`, plus the
existing event scaffolding (`date`, `type`, `title`, `duration`,
`source`, `sessionId`). The single-move Rep Counter calendar event
([RepCounter.jsx:162-171](../../src/components/train/RepCounter.jsx))
uses `moveIds: [selectedMove.id]` (length-1 array), with no
`setId`/`setIds`.

### Set session record in `mb_reps`

Confirmed at [src/components/train/RepCounter.jsx:119-130](../../src/components/train/RepCounter.jsx):

```js
{
  id: Date.now(),
  isSet: true,
  setId: selectedSet.id,
  setName: selectedSet.name,
  setColor: selectedSet.color,
  moveIds: selectedSet.moveIds || [],
  moveCount: (selectedSet.moveIds || []).length,
  reps: count,
  duration,
  date: new Date().toISOString(),
}
```

So `mb_reps` set sessions carry both `setId` and `moveIds` (frozen
snapshot of the Set's members at session time).

### #262 also writes `'sets'` source training entries

The Set session flow at [src/App.jsx:1314-1321](../../src/App.jsx)
also appends a `'sets'`-source training entry to each member move's
`trainingLog`. Per-move data — auto-deleted with the move.

**Conclusion:** Post-#262 changes are fully verified. The new `drillCount` /
`lastDrilledAt` Set-level fields are immune to move delete. New
calendar event fields (`setId`, `setIds`, `moveIds`, `categories`) and
`mb_reps` set sessions follow the same shapes already enumerated in §1.
No additional surprises.

---

## 5. Locked decisions — verify and flag conflicts

### Decision 1: `trainingLog` → delete entries pointing to deleted moves

**Critical discrepancy with the issue body.** The issue body and the
design conversation both reference `trainingLog` as if it were a
separate store keyed by `moveId`. **It is not.** `trainingLog` is a
per-move array field (`move.trainingLog: []` initialized in
[src/utils/storage.js:21](../../src/utils/storage.js)). Reading helpers
take a `move` argument and read `move.trainingLog`
([src/utils/trainingLog.js:13-43](../../src/utils/trainingLog.js)).

When the move is deleted from `mb_moves[]`, its `trainingLog` goes
with it — there is no separate cleanup to perform. The decision is
**structurally vacuous**: there are no orphan trainingLog entries to
delete because the log doesn't outlive its move.

**Readers that could break if the move (and its log) vanish:**

- [src/utils/trainingLog.js:13-24](../../src/utils/trainingLog.js)
  `lastTrainedDate(move)` returns `null` when the move is missing.
- [src/utils/trainingLog.js:31-33](../../src/utils/trainingLog.js)
  `lastActivityDate(move)` returns `null`.
- [src/utils/trainingLog.js:39-43](../../src/utils/trainingLog.js)
  `wasTrainedOn(move, dateStr)` returns `false`.
- [src/utils/masteryDecay.js:17](../../src/utils/masteryDecay.js),
  [src/utils/reportEngine.js](../../src/utils/reportEngine.js),
  [src/hooks/useVersionPrompt.js](../../src/hooks/useVersionPrompt.js),
  [src/hooks/useDayData.js](../../src/hooks/useDayData.js) all consume
  the per-move log. None iterate over an external trainingLog list
  expecting entries to exist for missing moves.

All readers walk `moves[]` and consult each move's local log. Removing
the move from `moves[]` simply means no reader ever asks for its log.
No filter-on-read needed; no readers will break. ✅

### Decision 2: `mb_reps` → keep entries, filter-on-read

**Display readers:**

- [src/components/train/RepCounter.jsx:391-410](../../src/components/train/RepCounter.jsx)
  (session history list). Renders `s.moveName`, `s.setName`,
  `s.setColor`, `s.moveCategory` — all denormalized fields. **Does not
  touch `s.moveId` for display.** Survives move delete by reading the
  frozen snapshot.
- [src/utils/textStream.js:393-397](../../src/utils/textStream.js)
  sets a `moveById.get(r.moveId)` lookup for the per-reps reflection
  label. `move` will be `undefined` if the move is gone, and `move?.name`
  passes `undefined` to `resolveSourceLabel` — verify this doesn't
  crash (it likely falls back to a generic label, but worth a tracer
  in implementation).
- [src/utils/reportEngine.js](../../src/utils/reportEngine.js) — uses
  `reps` for activity rollups. Aggregates on count/duration/date, not
  on move-existence.

**Filter-on-read sufficiency:**

The denormalized snapshot model (each `mb_reps` entry stores
`moveName`, `moveCategory`, `setName`, etc.) means existing display
code reads correctly without changes. The locked decision works
because the data is already self-contained.

**One soft caveat — `mb_battles[].rounds[].moves` is NOT
filter-on-read safe:**

This isn't `mb_reps`, but the same "no cleanup" framing extended to
battles would break: [RoundCard.jsx:282-298](../../src/components/battle/RoundCard.jsx)
does `round.moves.map((moveId) => ...)` and the chip falls back to
rendering the **bare numeric ID** at line 297 (`{moveId}`) when
`moves.find(...)` returns `undefined`. A deleted-move ID would surface
as a chip labelled `1715000000000`. The implementation prompt should
clean `round.moves` (since `mb_battles` is historical record and "keep
the entry, drop the dead reference" is the only sensible read).

**Conclusion:** Decision 1 is a no-op given the actual schema — flag
this so the implementation doesn't try to do anything to trainingLog
beyond what `delMove` already implicitly does. Decision 2 holds for
`mb_reps` because of denormalized snapshot fields. But the same
"no cleanup" stance does NOT extend to `mb_battles[].rounds[].moves`,
which renders the bare ID as a visible bug — that needs a sweep
(remove the dead IDs from `round.moves`).

---

## 6. Edge cases worth flagging

These are surfaced for the implementation prompt to address; no locked
answers needed here.

### 6.1 Empty husks after cleanup

- **Sets**: a Set whose every move is deleted ends with `moveIds: []`. Rep Counter already excludes empty sets from the picker ([RepCounter.jsx:183](../../src/components/train/RepCounter.jsx) — `sets.filter(s => (s.moveIds || []).length > 0)`). SetDetailModal renders an empty list. The Set is otherwise functional. Decision: leave or delete?
- **Combos pool filter** (`combos.selectedMoveIds`): if every ID becomes stale, `combos.selectedMoveIds: []` means the pool filter selects nothing → ComboMachine.jsx:71-72 falls through to `moves` (all moves). Probably fine; possibly surprising.
- **Battle plan arsenal** (`plan.arsenal.moveIds`): emptied arsenals are still usable plans. Likely leave alone.
- **Battle round** (`round.moves`): emptied moves list. The round retains its other data (opponent, outcome, entries, videos, notes). Leave alone.
- **Battle entry items** (`round.entries[].items`): emptied items inside an entry. Same — entry retains text. Leave alone.
- **Calendar event** (`event.moveIds`): see 6.2.
- **Freestyle list / saved list**: emptied list still usable; user can re-add. Leave alone.
- **Home stack `moveUpdate` tile** (`tile.moveId` now points to nothing): this one is **different**. The tile has nothing else to display — its entire purpose is to show update activity for one move. With the move gone, the tile is dead UI. Probably should be deleted from `homeStack.defaultStack` and `homeStack.overrides`. Flag for design call.

### 6.2 Empty calendar events after cleanup

Same question for calendar events whose `moveIds` becomes empty.
Options:
- Delete the event entirely (drives DaySections to remove it from the day).
- Keep as an empty session record (event still shows on the timeline with `0 moves` — `removeEventTraining` already runs on full event delete, see [DaySections.jsx:83](../../src/components/home/DaySections.jsx)).

The calendar event's `categories` field is also derived from move
categories at write time and would become stale (cats listed that no
longer correspond to any tagged move). Decide whether to recompute.

### 6.3 Cross-move parent reference (`move.parentId`)

[src/utils/storage.js:19](../../src/utils/storage.js):
`parentId: m.parentId || null` — a move can reference another move as
its parent. Read at [MoveModal.jsx:110](../../src/components/moves/MoveModal.jsx):
`f.parentId ? allMoves.find(m => m.id === f.parentId) : null`.

**Within-`mb_moves` reference that the issue body doesn't mention.**
If you delete a move that is a parent, its children retain
`parentId` pointing to a non-existent move. The MoveModal returns
`null` silently and likely just hides the "Based On" indicator. A
sweep that clears child `parentId` on parent delete would be more
correct but is its own scope decision.

### 6.4 Order-of-operations across multiple store writes

All store updates are `setX(prev => ...)` against React state with a
`useEffect` writeback to localStorage (the standard pattern, e.g.
[App.jsx:274-316](../../src/App.jsx)). React batches state updates
within a single event handler — multiple setters in `delMove` will
re-render once. localStorage writes are independent per store via
their respective `useEffect(...)` dependency arrays. **No atomic
multi-store write exists** today.

Implications:
- A cleanup sweep that fires 6+ `setX` calls will work correctly under
  React's batching.
- If the browser crashes between the React state update and the
  localStorage flush, you could persist some stores but not others.
  Acceptable given the no-users-yet status and the wipe-and-redo
  policy.

### 6.5 Firestore sync after delete

`mb_moves` change triggers a Firestore sync via the per-store
`useEffect(... fbUser ...)` pattern at e.g.
[App.jsx:629](../../src/App.jsx). Each touched store will independently
trigger its own Firestore sync. No special handling needed; multiple
syncs in quick succession are debounced or sequential per
[App.jsx:540-635](../../src/App.jsx) (not deeply read here).

### 6.6 Undo / redo of move delete

No undo path exists for `delMove` ([useMoveCrud.js:26](../../src/hooks/useMoveCrud.js)).
If the implementation later adds undo, the cleanup sweep would also
need to be reversible, which the multi-store-write nature makes hard.
Not in scope for this issue but worth flagging if the prompt asks
about undo.

**Conclusion:** Empty-husk handling and calendar-event-emptying are
the two real design calls. `moveUpdate` tiles are the only entity
where empty-husk = dead UI and probably warrant tile-level removal.
`parentId` is a within-`mb_moves` reference the issue body missed.
Order-of-operations and Firestore are non-blocking.

---

## Definitive cleanup list

For the implementation prompt. Every store + every field + locked action.

| Store / sub-path | Field | Shape | Action on move delete |
| ---------------- | ----- | ----- | --------------------- |
| `mb_sets` | `set.moveIds` | `number[]` | **Sweep** — remove deleted IDs from the array. |
| `mb_combos` | `combos.selectedMoveIds` | `number[] \| null` | **Sweep** — remove deleted IDs from the array. If result is `[]`, set back to `null` (preserve "no filter" semantics). |
| `mb_battleprep` | `plan.arsenal.moveIds` | `number[]` | **Sweep** — remove deleted IDs. (`arsenal.setIds` untouched.) |
| `mb_reps` (single-move) | `session.moveId` | `number` | **No cleanup** — keep as historical record. UI reads denormalized `moveName`, `moveCategory`. |
| `mb_reps` (set session) | `session.moveIds` | `number[]` | **No cleanup** — same rationale. Frozen snapshot of Set members at session time. |
| `mb_sparring` | `session.movesTrained` | `number[]` | **No cleanup** — historical record. No display-time reader consumes it. |
| `mb_calendar` | `event.moveIds` | `number[]` | **Sweep** — remove deleted IDs from the array. **Recompute `event.categories` from remaining moves.** Empty-result handling: see Open question. |
| `mb_battles` | `round.moves` | `number[]` (named `moves`, not `moveIds`!) | **Sweep** — remove deleted IDs. RoundCard renders bare numeric IDs as fallback if not cleaned. |
| `mb_battles` | `round.entries[].items[]` where `item.type === 'move'` | `{type, refId}` | **Sweep** — remove items where `item.type === 'move' && deletedIds.has(item.refId)`. |
| `mb_rrr` | `rrr.lastUsed.moveId` | `number \| null` | **Sweep** — if `lastUsed.moveId` is being deleted, reset `lastUsed` to `{mode:null, moveId:null, moveName:null, date:null}` (matches existing reset shape at App.jsx:789). |
| `mb_home_stack` | `defaultStack`/`overrides` tile where `tile.type === 'moveUpdate'` | `{id, type:'moveUpdate', moveId}` | **Sweep** — remove tiles whose `moveId` is being deleted (the tile has no purpose without the move). |
| `mb_freestyle_list` | `item.refId` where `item.type === 'move'` | `{id, refId, type, checked}` | **Sweep** — remove items where `item.type === 'move' && deletedIds.has(item.refId)`. |
| `mb_freestyle_saved` | `list.items[].refId` where `type === 'move'` | same | **Sweep** — same logic, applied per saved list. |
| `mb_moves` (within itself) | `move.parentId` | `number \| null` | **Sweep** — if `parentId` matches a deleted ID, set to `null`. Or scope out — see Open question. |
| `move.trainingLog` (per-move) | n/a | per-move array | **Implicit** — auto-deleted with the move. No explicit handling. |
| `move.journal` (per-move) | n/a | per-move array | **Implicit** — same. |
| `mb_sets` (Set-level aggregates) | `set.drillCount`, `set.lastDrilledAt` | scalar | **No cleanup** — Set-level rollups, independent of move existence. |
| All "no moves" stores | — | — | **No cleanup** — `mb_ideas` (until #263), `mb_habits`, `mb_user_templates`, `mb_rounds`, `mb_flowmap`, `mb_musicflow`, `mb_lab`, `mb_flashcards`, `mb_reports`, `mb_stance`, `mb_rivals`, `mb_battle_formats`, `mb_reminders`, `mb_presession`, `mb_injuries`, `mb_rest_log`, `mb_rest_types`, `mb_reflections`, `mb_milestones_shown`, `mb_cats`, `mb_cat_*`, `mb_custom_attrs`, `mb_profile*`, `mb_settings`, `mb_home_checks`. |

**Action types defined:**
- **Sweep** — remove the deleted move's ID(s) from the array / set the
  singular field to null. Keep the surrounding entity (Set, plan,
  event, etc.) — see Open questions for empty-husk policy.
- **No cleanup** — entry stays as historical/denormalized record;
  display readers already handle it correctly without cleanup.
- **Implicit** — the data lives inside the move object and is removed
  when the move is filtered out of `mb_moves`.

---

## Open questions for the implementation prompt

These need the user's call before code is written.

1. **Empty calendar event after cleanup.** If `event.moveIds` becomes empty after the sweep, do we (a) delete the event entirely, or (b) keep it as a "session with 0 moves" record? Also: should `event.categories` be recomputed each time `moveIds` changes, or left frozen at write time and accepted as potentially stale?

2. **Empty `moveUpdate` tile.** Confirmed in §6.1 that a `moveUpdate` tile with a deleted `tile.moveId` is dead UI. Confirm: sweep removes the tile from `homeStack.defaultStack` and any `overrides`? (Recommended yes — different from Sets/plans where the husk is still functional.)

3. **`move.parentId` sweep.** A move can reference another move as parent ([storage.js:19](../../src/utils/storage.js), [MoveModal.jsx:110](../../src/components/moves/MoveModal.jsx)). Issue body didn't mention this. Sweep child `parentId → null` when the parent is deleted, or leave as filter-on-read (today's behaviour)? Sweep is more correct but expands scope.

4. **Battle entry items that become empty after cleanup.** A `round.entries[].items` array can be fully drained if every item was a deleted move. Round/entry stays (it has text content). Confirm: leave the entry husk, just drop the dead items?

5. **`mb_battles[].rounds[].moves` is the only "historical record" surface where filter-on-read is broken** (renders bare ID chip per [RoundCard.jsx:297](../../src/components/battle/RoundCard.jsx)). The locked decision was "keep `mb_reps` historical, filter-on-read." Confirm that `mb_battles` rounds get **sweep** (not the same treatment as `mb_reps`) because the read path is broken without it.

6. **Bulk delete behaviour.** Should `bulkDeleteSelected` ([useMoveCrud.js:51-56](../../src/hooks/useMoveCrud.js)) run the cleanup once with the whole set of IDs, or fire `delMove` N times? Recommended once (one re-render, one Firestore sync per touched store).

7. **Cleanup hook placement.** Per §3 there are three plausible architectures. Recommended: hoist `delMove` / `bulkDeleteSelected` into `App.jsx` where every store setter is in scope, mirroring the calendar+trainingLog paired update at [DaySections.jsx:81-84](../../src/components/home/DaySections.jsx). Or extend the `useMoveCrud` hook signature with every needed setter.

8. **Denormalized `moveName` "deleted" marking.** In `mb_reps`,
   `mb_rrr`, etc., the user-visible label is a denormalized string
   that survives the delete. Do nothing (current direction — accept
   that history shows the move's old name) vs. append `(deleted)` to
   the name as a sweep step. Recommended: do nothing — over-engineering.

9. **Out-of-scope check.** Per the prompt, `mb_ideas` `moveIds[]` (added by #263) is excluded from this issue. Confirm that the implementation should treat targets as the existing schema (no `moveIds`) and let #263 add its own sweep handler when it lands.

---

*End of investigation. No code changes were made.*
