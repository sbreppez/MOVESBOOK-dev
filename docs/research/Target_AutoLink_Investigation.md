# Target Auto-Link to Library — Investigation

**Branch:** `v2`
**Scope:** Read-only. Document the current state of target storage, modal,
move identity, rep totals, and cross-entity linkage patterns. Inputs for
the next-step design issue on target auto-link.

---

## 1. TargetGoalModal — current shape

File: [src/components/train/TargetGoalModal.jsx](../../src/components/train/TargetGoalModal.jsx).

**Component signature** ([src/components/train/TargetGoalModal.jsx:13](../../src/components/train/TargetGoalModal.jsx)):
```
TargetGoalModal({ onClose, onSave, idea, moves=[], prefill })
```

**Props:**
- `onClose()` — close the modal.
- `onSave(targetObj)` — receives the assembled target object on save
  ([src/components/train/TargetGoalModal.jsx:32-36](../../src/components/train/TargetGoalModal.jsx)).
- `idea` — pre-existing target being edited; absent in "new" mode
  (`isEdit = !!idea`, [src/components/train/TargetGoalModal.jsx:16](../../src/components/train/TargetGoalModal.jsx)).
- `moves=[]` — the user's whole move library; used **only** for the
  autoLink count (`moves.length`, [src/components/train/TargetGoalModal.jsx:28](../../src/components/train/TargetGoalModal.jsx),
  [:144](../../src/components/train/TargetGoalModal.jsx)).
- `prefill` — optional seed for `title` only ([src/components/train/TargetGoalModal.jsx:19](../../src/components/train/TargetGoalModal.jsx)).

**Form fields (TARGET tab):**

| Field         | State var      | Input             | Required | Stored as     | Default                  | Source line                                                                       |
| ------------- | -------------- | ----------------- | -------- | ------------- | ------------------------ | --------------------------------------------------------------------------------- |
| Title         | `title`        | text              | yes¹     | `title`       | `prefill?.title \|\| ""` | [:19](../../src/components/train/TargetGoalModal.jsx), [:107](../../src/components/train/TargetGoalModal.jsx) |
| Target number | `target` / `targetRaw` | number    | no       | `target`      | `10`                     | [:20-21](../../src/components/train/TargetGoalModal.jsx), [:113-117](../../src/components/train/TargetGoalModal.jsx) |
| Unit          | `unit`         | text              | no       | `unit`²       | `"moves"`                | [:22](../../src/components/train/TargetGoalModal.jsx), [:120](../../src/components/train/TargetGoalModal.jsx) |
| Current       | `current`      | number + −/+ btns | no       | `current`³    | `0`                      | [:23](../../src/components/train/TargetGoalModal.jsx), [:127-136](../../src/components/train/TargetGoalModal.jsx) |
| Auto-link toggle | `autoLink`  | toggle switch     | no       | `autoLink`    | `false`                  | [:26](../../src/components/train/TargetGoalModal.jsx), [:146-151](../../src/components/train/TargetGoalModal.jsx) |
| Deadline      | `byWhen`       | date              | no       | `byWhen`      | `""`                     | [:24](../../src/components/train/TargetGoalModal.jsx), [:156](../../src/components/train/TargetGoalModal.jsx) |
| Video link    | `link`         | url text          | no       | `link` (https-prefixed via `ensureHttps`) | `""`     | [:25](../../src/components/train/TargetGoalModal.jsx), [:161](../../src/components/train/TargetGoalModal.jsx) |

¹ Save button disabled when `title.trim()` is empty ([:173](../../src/components/train/TargetGoalModal.jsx)).
² Defaults to `"items"` if blank at save time ([:33](../../src/components/train/TargetGoalModal.jsx)).
³ Replaced by `effectiveCurrent = moves.length` when both `autoLink`
and the global `settings.targetAutoLink` are true ([:28](../../src/components/train/TargetGoalModal.jsx), [:33](../../src/components/train/TargetGoalModal.jsx)).

**Conditional sections:**
- Tab strip renders only in edit mode (`isEdit && (...)`, [:62](../../src/components/train/TargetGoalModal.jsx)). New mode shows only the TARGET tab.
- JOURNAL tab exists only in edit mode (tab definitions, [:45-47](../../src/components/train/TargetGoalModal.jsx)).
- Current field hides when auto-link is on AND enabled (`!(autoLink && autoLinkEnabled)`, [:124](../../src/components/train/TargetGoalModal.jsx)).
- Auto-link toggle row renders only when `autoLinkEnabled` is true (`{autoLinkEnabled && (...)}`, [:139](../../src/components/train/TargetGoalModal.jsx)). `autoLinkEnabled = settings.targetAutoLink === true` ([:17](../../src/components/train/TargetGoalModal.jsx)).

**Save payload** ([src/components/train/TargetGoalModal.jsx:32-36](../../src/components/train/TargetGoalModal.jsx)):
```js
onSave({ type:"target", pinned:true, title:title.trim(),
  target, unit:unit.trim()||"items", current:effectiveCurrent,
  byWhen, link: ensureHttps(link.trim()), autoLink, journal, text:"",
  createdDate: idea?.createdDate || todayLocal()
});
```

`description` is **not** in the target payload (it's a goal-only field on the
shared `mb_ideas` slice; see §2).

**Conclusion:** The modal already persists an `autoLink` boolean per
target and computes `effectiveCurrent = moves.length` at save time when
auto-link is toggled on. The toggle UI is gated by a settings flag
(`settings.targetAutoLink`) and only counts the **total move count**
— there is no filter, no per-move selection, no rep-summing path.

---

## 2. Target schema in storage

**Slice:** `mb_ideas` (confirmed). Targets, goals, and notes all share
this single array, discriminated by `type`.

Persisted from React state in [src/App.jsx:315](../../src/App.jsx):
```js
useEffect(()=>{ saveLocal("mb_ideas", ideas); },[ideas]);
```

Initial load at [src/App.jsx:141-146](../../src/App.jsx):
```js
const [ideas, setIdeasState] = useState(() => {
  try {
    const s = localStorage.getItem("mb_ideas");
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map(migrateIdea); }
  } catch {}
  return [];
});
```

Storage migration at [src/utils/storage.js:25-38](../../src/utils/storage.js): only
normalizes journal entry dates; does **not** add or default any of
`autoLink`, `current`, `target`, `unit`, `byWhen`, etc.

**Backup-key inventory** confirms the same key:
[src/components/modals/BackupModal.jsx:10-11](../../src/components/modals/BackupModal.jsx)
(`ideas: "mb_ideas"`).

**Example target object** (assembled from the save payload at
[src/components/train/TargetGoalModal.jsx:32-36](../../src/components/train/TargetGoalModal.jsx)
and field state initializers at lines 19-27):

```js
{
  id: 1715000000000,        // Date.now() at create (see §3)
  type: "target",            // discriminator
  pinned: true,
  title: "Learn 20 new moves",
  target: 20,
  unit: "moves",
  current: 7,
  byWhen: "2026-12-31",      // YYYY-MM-DD or ""
  link: "https://youtu.be/…",// https-prefixed via ensureHttps()
  autoLink: false,           // see §7
  journal: [                 // { id, date:"YYYY-MM-DD", text, link }
    { id: 1715100000000, date: "2026-05-15", text: "first attempt", link: "" }
  ],
  text: "",                  // always empty for targets (legacy carry-over)
  createdDate: "2026-05-01", // todayLocal() at create
  // — fields written by other code paths, not the target modal —
  archived: true,            // set by HomePage archive action (HomePage.jsx:240)
  archivedDate: "2026-05-10T…",
}
```

**Discriminator:** `type` field. Possible values seen in target-vs-goal
checks across the codebase: `"target"`, `"goal"`, `"note"`. Examples:
[src/utils/homeMigration.js:50](../../src/utils/homeMigration.js)
(`idea.type === "goal" || idea.type === "target"`),
[src/utils/textStream.js:343-354](../../src/utils/textStream.js)
(`i.type === 'note' ? … : i.type === 'target' ? … : (goal)`),
[src/components/home/HomePage.jsx:1465](../../src/components/home/HomePage.jsx)
(`goalOrTarget.type === 'target' ? <TargetGoalModal/> : <GoalModal/>`).

**Unique-ID field:** `id`. Generated as `Date.now()` per the move
pattern at [src/utils/storage.js:6](../../src/utils/storage.js)
(`id: m.id || Date.now()`); the ideas store follows the same convention
— see `entry={id:Date.now(),date:todayLocal(),text,link}` in the
JournalEntryInput callback at
[src/components/train/TargetGoalModal.jsx:84](../../src/components/train/TargetGoalModal.jsx).
Direct creation paths through `setIdeas([..., {id: Date.now(), ...}])`
follow the same pattern across the codebase.

Cross-record comparisons use `String(i.id) === String(tile.refId)`
defensively (e.g. [src/components/home/HomeTile.jsx:48](../../src/components/home/HomeTile.jsx),
[src/components/home/HomePage.jsx:519](../../src/components/home/HomePage.jsx))
because tile `refId`s can be strings even when ideas have numeric `id`s.

**Conclusion:** Targets live in `mb_ideas[]` alongside goals and notes,
discriminated by `type === "target"`, identified by `id = Date.now()` at
creation. The modal save in §1 is the only known write path that
includes target-specific fields (`target`, `unit`, `current`, `autoLink`).

---

## 3. Move identification

**ID field:** `id`. Generated as `Date.now()` at create time
([src/utils/storage.js:6](../../src/utils/storage.js)):
```js
id: m.id || Date.now(),
```
Save path confirms ([src/hooks/useMoveCrud.js:14](../../src/hooks/useMoveCrud.js)):
```js
setMoves(prev => [...prev, { ...form, id: Date.now() }]);
```

Bulk-import uses `Date.now() + Math.random()` to keep ids unique within
a single batch ([src/hooks/useMoveCrud.js:18-23](../../src/hooks/useMoveCrud.js)).

**Stability across edits:** the edit path is
[src/hooks/useMoveCrud.js:11-12](../../src/hooks/useMoveCrud.js):
```js
setMoves(prev => prev.map(m => m.id === id ? { ...m, ...form } : m));
```
The id is preserved verbatim; renames, category changes, mastery
changes, etc. do **not** regenerate the id. The id survives any field
edit performed through `MoveModal`.

**Uniqueness:** `Date.now()` gives millisecond resolution. Two moves
created via the same UI gesture would collide if hit in the same
millisecond. The bulk-import path explicitly defends against that with
`Date.now() + Math.random()`
([src/hooks/useMoveCrud.js:21](../../src/hooks/useMoveCrud.js)); the
single-create path does **not** add an entropy suffix. In practice
collisions require sub-millisecond user actions and have not been
observed.

Scope of uniqueness: the moves array itself — `mb_moves` is one flat
list, no per-category sub-arrays
([src/App.jsx:82-86](../../src/App.jsx)). So ids are unique across the
whole library, not just within a category.

**Conclusion:** Move ids are numeric `Date.now()` values, stable across
all edits (rename, category change, mastery, etc.), unique across the
flat `mb_moves[]` array. Single-create collision risk is theoretical;
bulk-import already mitigates it.

---

## 4. Total Reps on a move — what's actually deployed

The proposed `totalReps: { drill, spar, sets, manual }` field on each
move is **NOT deployed**. `migrateMove` at
[src/utils/storage.js:3-23](../../src/utils/storage.js) initializes no
such field. Greps for `totalReps` outside of MoveModal's local variable
return only translations and an archived spec doc.

The deployed pattern uses an **event log per move**: each move carries
a `trainingLog: []` array (initialized in `migrateMove` at
[src/utils/storage.js:21](../../src/utils/storage.js)).

**Entry shape** ([src/utils/trainingLog.js:1-7](../../src/utils/trainingLog.js)):
```
{ date: "YYYY-MM-DD", count: number, source: string, sourceId?: string }
```

**Sources observed in writes:**
- `'manual'` — `MoveModal` "+/-" buttons via
  [src/components/moves/MoveModal.jsx:57](../../src/components/moves/MoveModal.jsx):
  `[...(f.trainingLog || []), { date: todayLocal(), count: manualDelta, source: 'manual' }]`.
- `'log_today'` — calendar event sync via
  [src/App.jsx:1071-1075](../../src/App.jsx) `recordEventTraining(...)`
  → `setEventTraining` (upserts keyed by `eventId`).
- `'drill'`, `'sparring'` — explicit sources read back by
  [src/components/moves/MoveModal.jsx:82-89](../../src/components/moves/MoveModal.jsx):
  ```js
  const repsBySource = useMemo(() => {
    const sums = { manual: 0, drill: 0, sparring: 0 };
    for (const entry of (f.trainingLog || [])) {
      if (sums[entry.source] !== undefined) sums[entry.source] += entry.count;
    }
    return sums;
  }, [f.trainingLog]);
  ```

**Total computation** ([src/components/moves/MoveModal.jsx:90-91](../../src/components/moves/MoveModal.jsx)):
```js
const totalReps =
  repsBySource.manual + repsBySource.drill + repsBySource.sparring + manualDelta;
```
`manualDelta` is the not-yet-saved pending count from the "+/-" buckets,
not a stored field.

**Important gap vs. the spec's four sources:** the deployed reducer
only sums `manual + drill + sparring`. There is **no `sets` bucket** in
the reader. Anywhere `entry.source` is something other than those three
(or `'log_today'`, which equally doesn't match the keys above), the
reps are silently dropped from the displayed total. Log Today calendar
events therefore do not contribute to the displayed "Total Reps" on a
move tile unless they were written with `source: 'drill'` or
`'sparring'` — see `setEventTraining(..., source: 'log_today', ...)`
at [src/App.jsx:1073-1076](../../src/App.jsx). Worth flagging when
designing the auto-link.

**Conclusion:** Today's rep total on a move is **computed live** by
summing `entry.count` across the move's `trainingLog[]`, filtered to
sources `manual | drill | sparring`. No stored `totalReps` field; no
`sets` source bucket; auto-linking by total-reps requires choosing
whether to lean on this log (with its filter quirks) or define a new
read path.

---

## 5. Sets — the closest "links to specific moves" pattern

**Schema:** A set stores its associated moves as a **flat array of
move ids** under `moveIds`. See the save shape at
[src/components/moves/SetDetailModal.jsx:42-46](../../src/components/moves/SetDetailModal.jsx):
```js
const extra = isSet ? { moveIds: localIds } : { setIds: localIds };
onSave({ name: …, color, link, mastery, notes, details, date, ...extra });
```
`localIds` is initialized from `item.moveIds || []` ([:34](../../src/components/moves/SetDetailModal.jsx)).

**Editor:** the entire move-picker UI lives inline in
[src/components/moves/SetDetailModal.jsx:96-208](../../src/components/moves/SetDetailModal.jsx).
Key affordances:
- Add/remove via `toggleId(id)` / `removeId(id)` ([:49-50](../../src/components/moves/SetDetailModal.jsx)).
- Inline searchable picker grouped by category ([:158-196](../../src/components/moves/SetDetailModal.jsx)).
- Drag-to-reorder on the already-added list ([:101-133](../../src/components/moves/SetDetailModal.jsx)).
- No external file/component — the picker is not factored out and not
  reused elsewhere.

**Stale-reference handling:** **filter-on-read, no cleanup-on-delete.**
Reads use `find()` and skip missing moves:
- [src/components/moves/SetDetailModal.jsx:105](../../src/components/moves/SetDetailModal.jsx):
  `const m = allMoves.find(mv=>mv.id===id); if(!m) return null;`
- [src/components/moves/SetDetailModal.jsx:213](../../src/components/moves/SetDetailModal.jsx):
  `const m = allMoves.find(mv => mv.id === id); return getMoveTension(m);` (passes `undefined` through).

The move delete path is
[src/hooks/useMoveCrud.js:26](../../src/hooks/useMoveCrud.js):
```js
const delMove = (id) => setMoves(prev => prev.filter(m => m.id !== id));
```
…and `bulkDeleteSelected` at [:51-56](../../src/hooks/useMoveCrud.js).
**Neither touches `sets`, `combos`, `plans`, calendar events, or any
other entity that may reference the deleted move's id.** The stale
ids remain in storage indefinitely, and every consumer must defensively
filter on read. The Arc chart at
[src/components/moves/SetDetailModal.jsx:211-228](../../src/components/moves/SetDetailModal.jsx)
does **not** filter out missing moves before passing them to
`getMoveTension`; if that helper crashes on `undefined`, deleted-move
ids would surface as a render bug. (Not verified — outside scope.)

**Conclusion:** Sets store associated moves as `moveIds: number[]` and
edit them via an inline grouped-by-category picker in
`SetDetailModal.jsx`. There is no app-wide cleanup on move delete —
the pattern is filter-on-read. Any new "linked to specific moves"
feature inherits the same convention and the same gotcha.

---

## 6. Other "linked to library" precedents

Confirmed entities that store one or more move ids:

| Entity                         | Field                              | Source line                                                                                          | Notes                                                              |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Set** (`mb_sets[]`)          | `moveIds: number[]`                | [SetDetailModal.jsx:44](../../src/components/moves/SetDetailModal.jsx)                               | Ordered (drag-to-reorder). See §5.                                 |
| **Combo** (Combo Machine)      | `moveIds: number[]`                | [ComboMachine.jsx:166](../../src/components/train/ComboMachine.jsx), [:179](../../src/components/train/ComboMachine.jsx) | Ordered (sequence is the combo). Two callsites: save-as-set and a calendar-event creation. |
| **Combo state** (`mb_combos`)  | `selectedMoveIds: number[]\|null`  | [App.jsx:158](../../src/App.jsx)                                                                     | UI session state, not a saved entity.                              |
| **Battle plan arsenal** (`mb_battlePrep` / homeStack tile data) | `arsenal.moveIds: number[]`, `arsenal.setIds: number[]` | [BattlePrepSetup.jsx:159](../../src/components/train/BattlePrepSetup.jsx), [BattleDayView.jsx:135](../../src/components/train/BattleDayView.jsx) | Resolved with filter-on-read: `ids.map(id => moves.find(m => m.id === id)).filter(Boolean)`. |
| **Calendar event** (Log Today) | `moveIds: number[]`                | [LogTodayTraining.jsx:52](../../src/components/logToday/LogTodayTraining.jsx), [App.jsx:1071-1075](../../src/App.jsx) | Drives `setEventTraining(...)` → upserts into each move's `trainingLog`. |

**No move linkage found in:**
- **Habits** (`mb_habits[]`, [App.jsx:127-130](../../src/App.jsx)).
  No `moveIds` field on habits anywhere in `src/`.
- **Routines** (no `mb_routines` slice exists; routines are HOME tiles
  whose content does not include `moveIds`). `tile.moveIds` and
  `routine.moves` grep zero matches.

**Different shape — non-library "moves":**
- **Battle entry** (`battle.moves: []`,
  [BattleFormBody.jsx:24](../../src/components/battle/BattleFormBody.jsx),
  [RivalsPage.jsx:170](../../src/components/battle/RivalsPage.jsx)).
  This is per-battle freestyle move logging, not a pointer to library
  ids. Worth noting only so it isn't confused with a precedent.

**Conclusion:** The well-trodden pattern for "this entity references
moves from the library" is **`moveIds: number[]`** with filter-on-read.
At least four current entity types use it. Habits and routines do
**not** link to moves. Any auto-link work should match this convention,
not invent a new shape.

---

## 7. Pre-existing dormant fields

### `autoLink` on a target

**Status:** partially deployed, behind a settings gate that has no UI.

- The field is **written** unconditionally by the save payload:
  [src/components/train/TargetGoalModal.jsx:34](../../src/components/train/TargetGoalModal.jsx)
  (`…autoLink, journal, text:""…`). State init at [:26](../../src/components/train/TargetGoalModal.jsx):
  `const [autoLink, setAutoLink] = useState(idea?.autoLink || false);`
- It is **read** in exactly one place: the same modal, to decide
  whether to show the manual-current row vs. the auto-link toggle row
  ([:124](../../src/components/train/TargetGoalModal.jsx), [:139](../../src/components/train/TargetGoalModal.jsx)).
- The auto-link toggle UI is gated by the global flag
  `settings.targetAutoLink === true` at [:17](../../src/components/train/TargetGoalModal.jsx).
- **Default for `settings.targetAutoLink` is `false`** — set in two
  places: [src/App.jsx:949](../../src/App.jsx) and
  [src/components/modals/SettingsModal.jsx:16](../../src/components/modals/SettingsModal.jsx).
- **No UI exists to flip this setting.** A read of
  [src/components/modals/SettingsModal.jsx:180-225](../../src/components/modals/SettingsModal.jsx)
  shows toggles for `showMoveCount`, `showDeadlineIndicator`,
  `confirmDelete`, `linkOnCard`, `trackMovesInSparring`,
  `showSectionDescriptions`, and `sparringGapThreshold` — but **not**
  `targetAutoLink`. The flag can only be set by direct localStorage
  edit.

**Critical:** there is **no runtime sync** keeping a target's `current`
in step with `moves.length` after save. The earlier prototype at
`index_prod_2026_3_15.html:3389-3397` had a `useEffect` that watched
`mb_moves` and rewrote every auto-linked target's `current`. That
`useEffect` does **not** exist in `src/App.jsx` today (grep for
`autoLink` in `src/App.jsx` returns zero matches). Today's behaviour:
`current` is stamped to `moves.length` at the moment of save and then
stays stale until the user re-opens and re-saves the modal.

### `startingCurrent`

**Not found.** Grep for `startingCurrent` across `src/` returns zero
matches. It exists only in #260's proposed template schema, not in
deployed target code.

### Other half-built target fields

- **`text: ""`** is included in the target save payload
  ([TargetGoalModal.jsx:34](../../src/components/train/TargetGoalModal.jsx))
  but is always empty for targets. It's a carry-over from the shared
  `mb_ideas` shape used by notes. Not a dormant feature, just dead
  weight.
- **`pinned: true`** is hard-coded to true on save
  ([:32](../../src/components/train/TargetGoalModal.jsx)). Suggests
  pinning was once user-controllable; it isn't today.
- **`createdDate`** is plain `YYYY-MM-DD` from `todayLocal()`
  ([:35](../../src/components/train/TargetGoalModal.jsx)), distinct
  from the move-tile `createdAt` field. Naming inconsistency, not a
  dormant feature.
- **`archived` / `archivedDate`** are not written by the modal but are
  set by the HOME archive action
  ([HomePage.jsx:240](../../src/components/home/HomePage.jsx)) and read
  by REFLECT
  ([ReflectPage.jsx:78-84](../../src/components/reflect/ReflectPage.jsx)).
  Expected, not dormant.

**Conclusion:** `autoLink` is the only true dormant feature on targets
— the field, the modal UI, and the settings flag are all there, but
the SettingsModal toggle and the runtime sync `useEffect` were never
shipped (or were torn out). `startingCurrent` does not exist in code.
No other half-built fields beyond the cosmetic carry-overs above.

---

## Open questions for the issue spec

These could not be resolved from code alone — they need the user's
intent.

1. **Sets-as-source vs. trainingLog-as-source.** §4 shows that today's
   "Total Reps" displayed on a move only sums sources
   `manual | drill | sparring`, and Log Today events (`source: 'log_today'`)
   are silently excluded from that total. If the auto-link's "count reps"
   mode mirrors the displayed total, those reps drop. If it sums *all*
   `entry.count` regardless of source, it diverges from the visible
   number. Which behaviour is desired? Or should auto-link define its
   own filter (e.g. "all sources including log_today")?

2. **`source: 'sets'` doesn't exist in the deployed log.** The
   investigation prompt mentions "Sets" as a fourth source alongside
   Drill/Spar/Manual. Should sessions logged against a Set be written
   to `trainingLog` as a new `source: 'sets'`, or do Sets already feed
   reps via one of the existing sources (drill/sparring), or are they
   currently a non-source? (No write path observed uses `source: 'sets'`.)

3. **Auto-link runtime sync.** Today's behaviour stamps `current` at
   save time and lets it go stale. The prototype had a `useEffect` in
   App.jsx that kept it live. Which model should ship: stamp-on-save,
   or stamp-on-anything-changes (and if so, which "anything" —
   `moves[]` change, app open, day rollover)?

4. **Filter on "count moves" mode.** Today's `moves.length` is the
   whole library, with no filter. The prompt names a "Count moves
   matching some criteria" mode. What criteria are in scope —
   category, mastery threshold, tag, origin, parent, custom attr?

5. **Specific-moves selection vs. category/filter selection.** Should
   the "count reps" mode use the §5 inline picker pattern (pick exact
   move ids, mirroring Sets), or use a filter (category, mastery
   bracket)? These have very different UI weight.

6. **Cleanup on move delete.** §5 confirms the codebase-wide pattern
   is filter-on-read with no cleanup of `moveIds` arrays. Auto-link's
   "specific moves" picker would inherit this — picked move ids stay
   in `target.moveIds` after the move is deleted. Acceptable per
   precedent, or should this feature be the trigger to add proper
   referential cleanup?

7. **Surface the dormant `settings.targetAutoLink` flag, or remove
   it?** If auto-link ships as a per-target option (and not gated by a
   global feature flag), the flag becomes dead weight. If it should be
   user-controllable as a kill switch, the SettingsModal row needs to
   be added.

---

*End of investigation. No code changes were made.*
