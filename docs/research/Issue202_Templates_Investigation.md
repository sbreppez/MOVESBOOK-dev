# Issue #202 — Routines & Goals as Templates: Codebase Investigation

**Date:** 2026-05-18
**Branch:** v2
**Status:** Read-only research dossier. No code changed.

---

## Section 1 — Routines on HOME

### Storage

Routines are persisted inline inside the **`mb_home_stack`** slice, not in their own store. There is no separate `mb_routines` key.

- State declaration: `src/App.jsx:253-256`
  ```
  const [homeStack, setHomeStackState] = useState(() => {
    try { const s=localStorage.getItem("mb_home_stack"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{}
    return { defaultStack:[], overrides:{} };
  });
  ```
- localStorage write: `src/App.jsx:309` — `useEffect(()=>{ saveLocal("mb_home_stack", homeStack); },[homeStack]);`
- Firestore save wiring: `src/App.jsx:580` (registers in `dbSave.current`), `src/App.jsx:619` (per-state-change effect that pushes to `__MB_DB__.save(uid, "homeStack", homeStack)`).
- TextStream emit wrap: `src/App.jsx:397-407` — `setHomeStack` is a `useCallback` that calls `emitRoutinesChanges(prev, next, fbUser.uid)` (defined in `src/utils/textStreamWraps.js:251`) then forwards to `setHomeStackState`.
- Firestore subscribe handler: `index.html:267-304`, with the `homeStack` key landing back in `localStorage` at line 299: `if (d.homeStack) localStorage.setItem('mb_home_stack', d.homeStack);` (no React state update from the subscribe — it writes to localStorage only; the React state is re-hydrated on the next `mb-auth-resolved` event handler, `src/App.jsx:718-719`).
- Rehydrate path on auth resolve: `src/App.jsx:718-719` — `const hs = localStorage.getItem("mb_home_stack"); if (hs) { ... setHomeStackState(p); }`.

### Schema of a routine tile

From the create handler `handleCreateRoutine` at `src/components/home/HomePage.jsx:661-665`:

```
{ id: Date.now().toString(), type: 'routine', ...fields }
```

The `fields` come from `RoutineForm.handleSave` at `src/components/home/RoutineForm.jsx:32-40`:

```
{
  name: string,                                        // trimmed
  steps: [{ id: string, text: string }],               // checklist items
  repeat: { type: "daily"|"specificDays"|"workdays"|"none", days: number[] },
  timeOfDay: "morning"|"midday"|"afternoon"|"evening",
}
```

Initial values seen at `src/components/home/RoutineForm.jsx:22-28`. `repeat.days` only populated when `repeat.type === "specificDays"`.

Routine tiles are mixed into `homeStack.defaultStack` alongside tiles of `type: 'note' | 'goalhabit' | 'moveUpdate'` (see filtering at `src/components/home/HomePage.jsx:647`).

`homeStack.overrides` is a `{ [date]: { added: [...] } }` map used for non-recurring per-day tile insertions (see `src/components/home/HomePage.jsx:532-542`).

### Render on HOME

- Mounted in `HomePage` at `src/components/home/HomePage.jsx`, rendered via `HomeTile`. The `today`/`notes`/`goals` section split is computed in `sections` (computed inside HomePage; routine tiles land in the `today` section).
- `HomeTile.jsx:26-28` resolves routine name: `if (tile.type === 'routine') { fallbackIcon = "list"; name = tile.name || ""; }`.
- Time-of-day pill: `src/components/home/HomeTile.jsx:154-155`.
- Step checkboxes: `src/components/home/HomeTile.jsx:165` (the `hasSteps` branch).
- Completion model: derived in `HomeTile` at `src/components/home/HomeTile.jsx:87-94` — for step routines, `homeChecks[date][tileId]` is an object `{ [stepId]: true }`; the tile is "checked" when every step has a true. For non-step tiles, `homeChecks[date][tileId]` is a boolean.
- Per-step toggle handler: `src/components/home/HomePage.jsx:390-426` (`handleStepCheck`) — also upserts a `type: "routine"` calendar event (via `addCalendarEvent` with `source: "home-routine"`, `routineId: tile.id`, `stepsCompleted`, `stepsTotal`).

### Daily-reset / "active today" filtering

Per-day rendering is driven by repeat-type evaluation; `repeat.type === 'none'` makes a routine non-recurring. The reset behaviour deletes per-day check state and per-day overrides — `src/components/home/HomePage.jsx:603-616` (`handleResetDay`). Day-of-week filtering for `specificDays` is computed inside HomePage's section assembly logic (not isolated into a helper).

### Create & edit modal

- Create entrypoint (from HOME `+`): tile `{ icon: "list", label: t("addRoutine"), type: "routine" }` at `src/components/home/HomeAddPicker.jsx:14`. Picker tile click dispatches to `HomePage` which sets `addFormType = "routine"` (HomePage `handleCreateRoutine` at `src/components/home/HomePage.jsx:661-665`).
- Create form rendered via `BottomSheet` at `src/components/home/HomePage.jsx:1004-1008`, body `RoutineForm` (`src/components/home/RoutineForm.jsx`).
- Edit modal: `src/components/home/HomePage.jsx:1260-1264` — `RoutineForm routine={editTile}` inside `BottomSheet`. Edit save handler at `src/components/home/HomePage.jsx:516-552` (`handleEditSave`) — for recurring routines, stashes the edit in `pendingEdit` to prompt the user about scope (this-day-only via overrides vs default for all).

### Manage Routines surface

Gear-menu entry: `src/components/home/HomePage.jsx:1111` (`{ icon: "list", label: t("manageRoutines"), action: ... setShowManageRoutines(true) }`). Sheet body at `src/components/home/HomePage.jsx:1142-1180`. Lists `allRoutines = (homeStack.defaultStack || []).filter(t => t.type === 'routine')` from line 647.

---

## Section 2 — Goals on HOME

### Storage

Goals (and "targets") are stored in **`mb_ideas`** as items of `type: 'goal'` or `type: 'target'`. They surface on HOME via a separate `goalhabit` tile in `mb_home_stack.defaultStack` that holds a `refId` back to the idea/habit id.

- State declaration: `src/App.jsx:141-147`
  ```
  const [ideas, setIdeasState] = useState(() => {
    try { const s = localStorage.getItem("mb_ideas");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map(migrateIdea); }
    } catch {}
    return [];
  });
  ```
- localStorage write: `src/App.jsx:311` — `useEffect(()=>{ saveLocal("mb_ideas", ideas); },[ideas]);`
- Firestore save: registered at `src/App.jsx:550` (`ideas: save("ideas")`), per-change push at `src/App.jsx:587`.
- TextStream emit wrap: `src/App.jsx:409-419` — `setIdeas` is a `useCallback` calling `emitIdeasChanges(prev, next, fbUser.uid)` (`src/utils/textStreamWraps.js:317`) then forwarding to `setIdeasState`.
- Firestore subscribe handler: `index.html:272` — `if (d.ideas) localStorage.setItem('mb_ideas', d.ideas);`
- Rehydrate on auth resolve: `src/App.jsx:654-655`.
- `migrateIdea` (`src/utils/storage.js:25-38`) only normalizes journal entry dates; it does not enforce any goal/target shape.

### Schema (goal vs target — exact divergence)

**Goal** (from `GoalModal.handleSave` at `src/components/train/GoalModal.jsx:44-58`):
```
{
  type: "goal",
  pinned: true,
  title: string,
  description: string,
  byWhen: string,                // YYYY-MM-DD or ""
  link: string,                   // ensureHttps wrapped
  journal: [{ id, date, text, link }],
  text: "",
  createdDate: string,            // YYYY-MM-DD
  legacyMigrated: true,
}
```

**Target** (from `TargetGoalModal.handleSave` at `src/components/train/TargetGoalModal.jsx:30-38`):
```
{
  type: "target",
  pinned: true,
  title: string,
  target: number,                 // numeric quota
  unit: string,                   // free-text e.g. "moves"
  current: number,                // progress counter (or moves.length via autoLink)
  byWhen: string,
  link: string,
  autoLink: boolean,              // ties current to moves.length
  journal: [{ id, date, text, link }],
  text: "",
  createdDate: string,
}
```

Shared fields: `type`, `pinned`, `title`, `byWhen`, `link`, `journal`, `text`, `createdDate`.
Goal-only: `description`, `legacyMigrated`.
Target-only: `target`, `unit`, `current`, `autoLink`.

### Progress tracking model

- **Goal**: no progress counter at the schema level. Free-form `description` field and a `journal` array; lifecycle = checkbox-style completion on HOME tile (see "Lifecycle" below).
- **Target**: numeric `current` toward `target` (with optional `autoLink` to `moves.length`). Stepper +/- in `TargetGoalModal.jsx:127-136`.

### Lifecycle (active / completed / archived)

- "Active" = present in `mb_ideas` AND surfaced via a `goalhabit` tile in `homeStack.defaultStack`. `goalhabit` tiles are created at `src/components/home/HomePage.jsx:686-691` (`handleCreateGoal`).
- "Archived" = `archived: true` flag set on the idea (legacy/single-source-of-truth on the idea, not the tile). Archive handlers at `src/components/home/HomePage.jsx:199-206` (single) and lines 222-256 (bulk). Archived items are filtered out of HOME via `if (ref?.archived) return false;` at `src/components/home/HomePage.jsx:40` and similar guards. There is no "completed" state distinct from archived in the schema; the HOME tile checkbox sets a `homeChecks[date][tileId]` entry but does not mutate the goal record.
- For `goalhabit` tile referencing a goal, the checkbox toggle at `src/components/home/HomePage.jsx:374-387` does NOT mutate the goal (only mutates `habits[].checkIns` when the `refId` resolves to a habit). So goal "completion" is not tracked in the data model — it's purely a per-day check on HOME.

### Create/edit modals

- `src/components/train/GoalModal.jsx` (entire file) — Title / Description / Deadline / Video reference + Journal tab.
- `src/components/train/TargetGoalModal.jsx` (entire file) — Title / Target / Unit / Current / Auto-link / Deadline / Video + Journal tab.
- Invoked from HOME via the picker → TypeChooserSheet (goal vs target): `src/components/home/HomePage.jsx:1014-1023`. The picker entry on `HomeAddPicker` is `{ icon: "trophy", label: t("addGoalOrTarget"), type: "goal" }` (`src/components/home/HomeAddPicker.jsx:15`), which routes to `setHomeTypeChooser(true)` at `src/components/home/HomePage.jsx:995`.

### HOME `goalhabit` tile (the bridge)

When created, `handleCreateGoal` writes BOTH the idea and a tile (`src/components/home/HomePage.jsx:686-691`):
```
setIdeas(prev => [...prev, { id, ...goalData }]);
setHomeStack(prev => ({ ...prev, defaultStack: [{ id: 'gh_' + id, type: 'goalhabit', refId: id }, ...prev.defaultStack] }));
```
Tile rendering resolution at `src/components/home/HomeTile.jsx:39-67` (looks up `refId` first in `habits`, then in `ideas` for `type === 'goal' || 'target'`; if neither matches → orphan tile).

---

## Section 3 — Persistence slice pattern (canonical reference)

### Important correction to the prompt's premise

The prompt cites **`mb_log_exclusions`** as the canonical pattern triple. **This key does not exist in the codebase** — `Grep` for `mb_log_exclusions`, `log_exclusions`, `logExclusions`, and `exclusions` (case-insensitive across `src/`) all return no matches. The canonical pattern below is reconstructed from the ~30 slices that *do* exist in `src/App.jsx`, taking `mb_home_stack` and `mb_ideas` as fully wired exemplars.

### The canonical slice wiring (numbered checklist)

For a new slice keyed `mb_foo`, exposed as React state `foo`, mirroring the way `homeStack` and `ideas` are wired in v2:

1. **Hydrate state from localStorage on mount** — `useState(() => { try { const s=localStorage.getItem("mb_foo"); if(s){const p=JSON.parse(s); if (valid(p)) return p;} } catch{} return DEFAULTS; })`. Bind to a `*State` setter (`setFooState`), not the plain name. Example: `src/App.jsx:253-256` (`setHomeStackState`).
2. **Per-change localStorage write-through** — `useEffect(()=>{ saveLocal("mb_foo", foo); },[foo]);`. Example: `src/App.jsx:309`.
3. **Register a debounced Firestore saver** in `dbSave.current` — `dbSave.current = { ..., foo: save("foo"), ... }` inside the mount-time `useEffect` at `src/App.jsx:541-584`. Default debounce is 1500ms. Example: `src/App.jsx:580` (`homeStack: save("homeStack")`).
4. **Per-change Firestore push** — `useEffect(()=>{ if(fbUser?.uid) dbSave.current.foo?.(fbUser.uid, foo); },[foo, fbUser]);`. Example: `src/App.jsx:619`.
5. **Define the user-action wrapper setter** as `setFoo = useCallback(updater => setFooState(prev => { const next = typeof updater === 'function' ? updater(prev) : updater; if (fbUser?.uid) emitFooChanges(prev, next, fbUser.uid).catch(...); return next; }), [fbUser?.uid]);`. The unwrapped name is what children consume. Examples: `src/App.jsx:397-407` (homeStack), `src/App.jsx:409-419` (ideas). If the slice contains no text-bearing fields, the wrapper can be omitted and the `*State` setter exposed directly (no current slice does this for user-facing data).
6. **Add the slice to the Firestore subscribe handler** in `index.html:267-304`, which writes the value into `localStorage` — `if (d.foo) localStorage.setItem('mb_foo', d.foo);`. Example: `index.html:299` (`homeStack`).
7. **Add the slice to the initial Firestore load handler** in `index.html:219-258`, writing to localStorage with shape validation — example `index.html:252` (`homeStack`). Note: this load fires BEFORE `mb-auth-resolved`, so React reads the fresh value at step 8.
8. **Rehydrate React state on auth resolve** inside the `handleAuthResolved` handler at `src/App.jsx:639-744` — `const fv = localStorage.getItem("mb_foo"); if (fv) { try { const p = JSON.parse(fv); if (valid(p)) setFooState(p); } catch {} }`. **Critical**: call the `*State` raw setter here, not the wrapped `setFoo`, so rehydration does not trigger a TextStream emit. Example: `src/App.jsx:718-719`.
9. **Add the slice to the sign-out reset branch** of `handleAuthResolved` — call `setFooState(DEFAULTS)`. Example: `src/App.jsx:782` (`setHomeStackState({ defaultStack:[], overrides:{} })`).
10. **Add the localStorage key to the sign-out cleanup list** in `index.html:307-313` — the array of keys passed to `forEach(k => localStorage.removeItem(k))`. `mb_home_stack` is in that list (line 313).
11. **Add the localStorage key to the backup map** at `src/components/modals/BackupModal.jsx:8-30` so it's included in export/restore.
12. **If the slice contains text-bearing fields**, also register the emit helper in `src/utils/textStreamWraps.js` (and import in `src/App.jsx:48`), and update `*_TEXT_FIELDS` per `docs/CORE_PRINCIPLES.md:118`.

### Conflict handling between subscribe and local writes

The Firestore subscribe handler (`index.html:267-304`) writes only to localStorage; it does NOT call React setters. There is **no in-app conflict resolution** — the next time `handleAuthResolved` runs (e.g. tab refocus that triggers re-auth) the new localStorage value re-seeds React state. Mid-session, a remote write to a slice will not update the running React state; the slice persists with local state until next auth-resolve cycle.

### How existing slices conform

- **`mb_home_stack`** (routines + `goalhabit` + `note` + `moveUpdate` tiles): all 11 steps present. Wrapped setter at `src/App.jsx:397-407` emits via `emitRoutinesChanges`.
- **`mb_ideas`** (goals, targets, notes): all 11 steps present. Wrapped setter at `src/App.jsx:409-419` emits via `emitIdeasChanges`.
- **`mb_templates`** (battle round templates; see §6): partial. Has its own ad-hoc hydrate at `src/components/battle/ReadyPage.jsx:54-56`, ad-hoc write+debounced save at `lines 57-63` inside the component (not in `App.jsx`), and its own `mb-auth-resolved` listener at `lines 64-71` to re-pull from localStorage. It is NOT wired through any `*State` / wrapper / `dbSave.current` registry. It IS in the Firestore subscribe handler (`index.html:276`), the initial load handler (`index.html:230`), the sign-out cleanup list (`index.html:308`), and the BackupModal map (`src/components/modals/BackupModal.jsx:12`). No TextStream emit wrap.
- **`mb_combos`**: full wiring through `App.jsx` except no TextStream wrapper (the slice holds no user-text — it's `{ transitions, selectedMoveIds }`); the setter is the plain `setCombos` from `useState` (no `*State` rename).
- **`mb_freestyle_saved`**: ad-hoc inside `src/components/battle/FreestylePage.jsx:80-85` — localStorage only, no Firestore save, no rehydrate, no TextStream. Not in BackupModal map. Not in sign-out cleanup list.

The `mb_templates` divergence is documented evidence that the canonical pattern is the newer convention; older artifact slices (templates, freestyle_saved) predate it.

---

## Section 4 — Log Today Prompt I status

### Modal shipped

`LogTodayModal` (`src/components/logToday/LogTodayModal.jsx`) is mounted as an absolutely-positioned `z-index: 500` overlay. The four sub-tabs are declared at `src/components/logToday/LogTodayModal.jsx:79-84`:
```
const tabs = [
  { id: "training",     label: t("training") },
  { id: "battle",       label: t("battle") },
  { id: "conditioning", label: t("conditioning") },
  { id: "rest",         label: t("rest") },
];
```
All four sub-tab forms are imported and rendered: `LogTodayTraining`, `LogTodayBattle`, `LogTodayConditioning`, `LogTodayRest` (`src/components/logToday/LogTodayModal.jsx:7-10`, rendered at lines 177-246). Training and Rest forms stay mounted via `display: none` toggling (line 169 comment) so local state persists across sub-tab switches.

### Conditioning sub-tab fields (current shape)

From `src/components/logToday/LogTodayConditioning.jsx:93-114` (state declarations) and `handleSave` at lines 155-194:

```
{
  sessionName: string,
  durationHours: number,
  durationMinutes: number,
  stamina:  { subCategories: ["liss"|"miss"|"hiit"][],  details: string },
  strength: { subCategories: ["max"|"hypertrophy"|"power"|"endurance"][],
              regions:       ["upper"|"mid"|"lower"][],
              details:       string },
  mobility: { subCategories: ["cars"|"dynamic"|"static"|"loaded"|"tissue"][],
              joints:        ["neck"|"wrists"|"shoulders"|"hips"|"spine"|"ankles"][],
              details:       string },
  todayNote: string,
}
```

The "Add to HOME" checkbox at line 115 (`const [addToHome, setAddToHome] = useState(false)`) drives a single-shot copy into a HOME note via `createHomeNoteFromLog` (`src/utils/logTodayHomeNote.js`); the resulting HOME note is independent of the calendar event after creation.

### Link-to-routine / link-to-goal picker — does it exist?

**No.** `Grep` over `src/components/logToday/LogTodayConditioning.jsx` for `routine|template|habit|goal` (case-insensitive) returns one hit only: `gridTemplateColumns` (a CSS property at line 424). There is no picker UI, no state, no field for routine/goal/template/habit linkage in any Log Today sub-tab. The same `Grep` over `LogTodayBattle.jsx`, `LogTodayRest.jsx`, `LogTodayTraining.jsx`, `LogTodayModal.jsx` returns zero hits. The Issue #202 snapshot-model concern is **N/A as of v2 HEAD**: there's nothing to snapshot because no link picker exists yet.

### LogTodayTraining "+ pick moves/sets" analog

`LogTodayTraining.jsx` exposes a `+` next to the "WHAT I WORKED ON" header at `src/components/logToday/LogTodayTraining.jsx:162-175` that opens a chooser sheet (`chooserOpen` state, line 45). The chooser routes to either `LogTodayMovePicker` or `LogTodaySetPicker` — both rendered at `LogTodayModal` level (`src/components/logToday/LogTodayModal.jsx:291-308`).

Selection model: `pendingMoveIds: string[]` and `pendingSetIds: string[]` are held on `LogTodayModal` (`src/components/logToday/LogTodayModal.jsx:51-52`) and threaded into `LogTodayTraining` via props. On save (`src/components/logToday/LogTodayTraining.jsx:90-119`):
- `moveIds: pendingMoveIds` and `setIds: pendingSetIds` are stored on the calendar event by **id reference**, not embedded copies.
- The actual moves selected by reference get a `recordEventTraining` call (`src/components/logToday/LogTodayTraining.jsx:127-129`) which appends a training-log entry on each move via `setEventTraining` (logged with `sourceId === event.id` so it round-trips correctly on re-edit, lines 49-58 of the same file).
- Sets are resolved to their `moveIds` and union-merged into `allMoveIdsToMark` at lines 95-99 so the underlying moves also receive training-log entries.

The pattern is therefore **id-reference**, not snapshot-copy; the link picker for routines/goals (per #202 spec) is not present and there is no precedent for snapshotting routine/goal contents inside this code path today.

---

## Section 5 — UI entry-point candidates for a template library

### Settings (`SettingsModal.jsx`)

File: `src/components/modals/SettingsModal.jsx` (482 lines). Rendered from `App.jsx:1366` as an absolutely-positioned overlay (`z-index: 1000`), and also rendered inline inside `ProfileModal.jsx:230-232` when the user expands the "Show settings" disclosure.

Section structure (each via `sectionHdr` at `src/components/modals/SettingsModal.jsx:79-84`):

| Section | Rows |
|---|---|
| **APPEARANCE** | `theme` (light/dark segmented, `:110-112`), `textSize` (S/M/L segmented, `:114-116`), `defaultView` (list/tiles/tree segmented, `:118-120`), `displayZoom` (+/- buttons with reset, `:122-141`), `language` (12-option select, `:143-161`) |
| **BEHAVIOUR** | `showMastery` toggle (`:166-169`), `decaySensitivity` (off/gentle/normal/aggressive segmented, `:171-179`), `showMoveCount` toggle (`:181-184`), `showDeadlineIndicator` toggle (`:186-189`), `confirmDelete` toggle (`:191-194`), `linkOnCard` (inside/both select, `:196-205`), `trackMovesInSparring` toggle (`:207-210`), `showSectionDescriptions` toggle (`:212-215`), `sparringGapThreshold` numeric input (`:217-225`) |
| **NAVIGATION** | `defaultTab` (home/moves/battle/reflect select, `:231-241`), `sortMoves` (custom/date/name/nameDesc/mastery/masteryLow select, `:243-255`), `sortCategories` (manual/name/progress select, `:257-266`) |
| **CUSTOM ATTRIBUTES** | List of user-defined `customAttrs` with edit/delete + "Add Attribute" dashed button (`:268-306`) |
| **DATA / PRIVACY** | `saveBackup` (button, `:311-319`), `restoreBackup` (file input, `:321-341`), `clearAllMoves` (confirm-on-click, `:343-364`), `restoreDefaultRounds` (confirm-on-click, `:366-387`) |
| **ABOUT** | Version row, build label row, italic blurb (`:390-403`) |
| Footer (non-inline only) | `userManual` link, `restartWalkthrough` link (`:405-417`) |

Density: 25 distinct rows + Custom Attributes list + About block. Already long (footer reachable only via scroll on standard mobile heights).

### Avatar overlay (top-right header)

There is **no avatar overlay/menu**. The ProfileAvatar in the header (`src/App.jsx:1248-1249`) is a direct trigger: `onClick={()=>setShowProfile(true)}` opens `ProfileModal` (`src/App.jsx:1357-1363`).

`ProfileModal` (`src/components/modals/ProfileModal.jsx`, 297 lines) is the de-facto "profile + settings + legal + feedback + backup" hub. Its sections in render order:

| Section | Source line |
|---|---|
| Profile photo + remove (`:71-91`) | header has only Save+Close, no Settings/Feedback button |
| IDENTITY (nickname, age, start date) | `:93-121` |
| Stance link button (navigates to REFLECT > STANCE) | `:123-140` |
| BREAKING GOALS (textarea) | `:142-147` |
| WHY BREAKING (textarea) | `:148-155` |
| MY NOTES card | `:157-217` |
| SETTINGS section header + "Show settings" disclosure → inline `<SettingsModal inline ... />` | `:219-232` |
| LEGAL section header + 3 buttons (privacy / terms / disclaimers) | `:234-246` |
| FEEDBACK section header + "Show feedback form" disclosure → inline `<FeedbackModal inline />` | `:248-259` |
| BACKUP section header + Save/Restore buttons | `:261-278` |
| SIGN OUT button | `:280-288` |
| Footer Cancel/Save buttons | `:289-292` |

There is also a separate gear icon in the header at `src/App.jsx:1250-1254` that opens `SettingsModal` directly (not inline) — so settings are reachable via TWO paths: header gear → standalone modal, AND header avatar → ProfileModal → "Show settings" disclosure → inline-mounted same modal.

The Profile / Settings / Feedback split described in the starter context as separate entries in an "avatar overlay" does not match what's in the code today: there is no overlay, and Profile *contains* Settings + Feedback + Legal + Backup inline.

### Bottom-bar center `+`

The plus button is centered in the bottom bar at `src/App.jsx:1403-1413` — its `onClick={handlePlusPress}` (`:1075`) simply increments `addTick`, which child pages consume via `onAddTrigger`. Each tab handles `+` differently:

- **HOME** (`src/components/home/HomePage.jsx:109-116`): opens `HomeAddPicker`. Picker tiles (verbatim from `src/components/home/HomeAddPicker.jsx:12-18`):
  ```
  { icon: "fileText",    label: t("addNoteTile"),    type: "idea" },
  { icon: "list",        label: t("addRoutine"),     type: "routine" },
  { icon: "trophy",      label: t("addGoalOrTarget"),type: "goal" },
  { icon: "check",       label: t("addHabit"),       type: "habit" },
  { icon: "notebookPen", label: t("addMoveUpdate"),  type: "moveUpdate" },
  ```
- **MOVES** (`src/components/moves/WIPPage.jsx`, triggers via `useWipTriggers` at `:176-188`): on LIBRARY sub-tab the trigger opens `LibraryMenuSheet`. Entries (`src/components/moves/LibraryMenuSheet.jsx:19-24`):
  ```
  { icon: "plus",       label: t("addMoveMenu"),     action: onAddMove },
  { icon: "cards",      label: t("bulkImportMenu"),  action: onBulkImport },
  { icon: "folderPlus", label: t("addCategoryMenu"), action: onAddCategory },
  { icon: "compass",    label: t("creativeTools"),   action: () => onOpenTools() },
  ```
  On other MOVES sub-tabs (sets, gap), the trigger dispatches to different handlers via `useWipTriggers` switching on `vocabTab`.
- **BATTLE** (`src/components/battle/ReadyPage.jsx:106-117`): trigger dispatches per `battleTab` — on `plan` it sets `addingRound=true` (NewRoundModal), on `freestyle` it bumps an internal tick for FreestylePage, on `rivals` and `prep` it bumps internal ticks for those sub-pages. No top-level picker.
- **REFLECT** (`src/components/reflect/ReflectPage.jsx`): handles `onAddTrigger` per its own sub-tabs (not inspected exhaustively here; the `+` is not a HomeAddPicker-style menu).

So the `+` is contextual: HOME and MOVES surface a bottom-sheet picker menu; BATTLE and REFLECT contextually trigger an inline action.

---

## Section 6 — Naming usage scan

Each hit listed with `path:line` and the matched line (truncated to ~80 chars where needed). Translation-file hits are not deduplicated by language — every language hit is its own line of code.

### `template` / `templates`

**Code (non-translation):**

- `src/utils/textStream.js:376` — `// Auto-capture template content excluded via AUTO_SOURCES set above.`
- `src/utils/textStreamWraps.js:523` — `//   event.title    — template-fallback semantics, not narrative`
- `src/components/modals/BackupModal.jsx:12` — `habits: "mb_habits", templates: "mb_templates",`
- `src/components/modals/FeedbackModal.jsx:28` — `const EMAILJS_TEMPLATE= import.meta.env.VITE_EMAILJS_TEMPLATE_ID;`
- `src/components/modals/FeedbackModal.jsx:75` — `await window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {`
- `src/components/moves/RestoreRemixRebuild.jsx:50` — `// ── Prompt templates ────────...`
- `src/components/moves/RestoreRemixRebuild.jsx:229` — `const template = pool[currentPromptIdx] || pool[0];`
- `src/components/moves/RestoreRemixRebuild.jsx:230` — `return template.replace(/\{move\}/g, moveName);`
- `src/components/battle/ReadyPage.jsx:53` — `// ── Battle Templates ───────────...`
- `src/components/battle/ReadyPage.jsx:54` — `const [templates, setTemplates] = useState(() => {`
- `src/components/battle/ReadyPage.jsx:55` — `try { const s = localStorage.getItem("mb_templates"); return s ? JSON.parse(s) : []; } catch { return []; }`
- `src/components/battle/ReadyPage.jsx:58` — `try { localStorage.setItem("mb_templates", JSON.stringify(templates)); } catch {}`
- `src/components/battle/ReadyPage.jsx:60` — `if (window.__MB_USER__?.uid && window.__MB_DB__) window.__MB_DB__.save(window.__MB_USER__.uid, "templates", templates);`
- `src/components/battle/ReadyPage.jsx:63` — `}, [templates]);`
- `src/components/battle/ReadyPage.jsx:66` — `const raw = localStorage.getItem("mb_templates");`
- `src/components/battle/ReadyPage.jsx:67` — `if (raw) { try { const p = JSON.parse(raw); setTemplates(p); } catch {} }`
- `src/components/battle/ReadyPage.jsx:73` — `const [showSaveTemplate,  setShowSaveTemplate]  = useState(false);`
- `src/components/battle/ReadyPage.jsx:74` — `const [showLoadTemplate,  setShowLoadTemplate]  = useState(false);`
- `src/components/battle/ReadyPage.jsx:75` — `const [templateName,      setTemplateName]      = useState("");`
- `src/components/battle/ReadyPage.jsx:76` — `const [confirmLoadTpl,    setConfirmLoadTpl]    = useState(null); // template to load`
- `src/components/battle/ReadyPage.jsx:77` — `const [confirmDeleteTpl,  setConfirmDeleteTpl]  = useState(null); // template to delete`
- `src/components/battle/ReadyPage.jsx:79` — `const saveTemplate = () => {`
- `src/components/battle/ReadyPage.jsx:83` — `name: templateName.trim(),`
- `src/components/battle/ReadyPage.jsx:87` — `setTemplates(p => [...p, tpl]);`
- `src/components/battle/ReadyPage.jsx:88` — `setTemplateName("");`
- `src/components/battle/ReadyPage.jsx:89` — `setShowSaveTemplate(false);`
- `src/components/battle/ReadyPage.jsx:92` — `const loadTemplate = (tpl) => {`
- `src/components/battle/ReadyPage.jsx:95` — `setShowLoadTemplate(false);`
- `src/components/battle/ReadyPage.jsx:98` — `const deleteTemplate = (id) => {`
- `src/components/battle/ReadyPage.jsx:99` — `setTemplates(p => p.filter(t => t.id !== id));`
- `src/components/battle/ReadyPage.jsx:234` — `<button onClick={()=>setShowLoadTemplate(true)}` (Load Template button)
- `src/components/battle/ReadyPage.jsx:236` — `title={t("loadSavedTemplate")}>`
- `src/components/battle/ReadyPage.jsx:239` — `<button onClick={()=>{ setTemplateName(""); setShowSaveTemplate(true); }}`
- `src/components/battle/ReadyPage.jsx:241` — `title={t("saveCurrentTemplate")}>`
- `src/components/battle/ReadyPage.jsx:271-272` — `{/* Save Template Modal */} {showSaveTemplate&&(`
- `src/components/battle/ReadyPage.jsx:273` — `<Modal title={t("saveBattleTemplate")} onClose={()=>setShowSaveTemplate(false)}>`
- `src/components/battle/ReadyPage.jsx:275` — `Saves your current round structure and all entries as a reusable template.`
- `src/components/battle/ReadyPage.jsx:278` — `<label style={lbl()}>{t("templateNameLabel")} *</label>`
- `src/components/battle/ReadyPage.jsx:279` — `<input autoFocus value={templateName} ...`
- `src/components/battle/ReadyPage.jsx:280` — `onKeyDown={e=>{ if(e.key==="Enter") saveTemplate(); }}`
- `src/components/battle/ReadyPage.jsx:290` — `<Btn variant="secondary" onClick={()=>setShowSaveTemplate(false)}>{t("cancel")}</Btn>`
- `src/components/battle/ReadyPage.jsx:291` — `<Btn onClick={saveTemplate} disabled={!templateName.trim()}>Save Template</Btn>`
- `src/components/battle/ReadyPage.jsx:296-298` — `{/* Load Template Modal */} ... <Modal title={t("loadBattleTemplate")} ...`
- `src/components/battle/ReadyPage.jsx:299` — `{templates.length===0 ? (`
- `src/components/battle/ReadyPage.jsx:302` — `<div ...>{t("noTemplatesSaved")}</div>`
- `src/components/battle/ReadyPage.jsx:303` — `<div style={{ fontSize:13 }}>Set up your rounds then tap Save to create your first template.</div>`
- `src/components/battle/ReadyPage.jsx:308` — `Tap a template to load it. This will replace your current rounds and entries.`
- `src/components/battle/ReadyPage.jsx:310` — `{templates.map(tpl=>(`
- `src/components/battle/ReadyPage.jsx:339` — `<Btn variant="secondary" onClick={()=>setShowLoadTemplate(false)}>{t("close")}</Btn>`
- `src/components/battle/ReadyPage.jsx:346` — `<Modal title={t("loadTemplate")} onClose={()=>setConfirmLoadTpl(null)}>`
- `src/components/battle/ReadyPage.jsx:355` — `<Btn variant="danger" onClick={()=>loadTemplate(confirmLoadTpl)}>{t("yesLoadTemplate")}</Btn>`
- `src/components/battle/ReadyPage.jsx:360` — `{/* Confirm Delete Template */}`
- `src/components/battle/ReadyPage.jsx:362` — `<Modal title={t("deleteTemplate")} onClose={()=>setConfirmDeleteTpl(null)}>`
- `src/components/battle/ReadyPage.jsx:371` — `<Btn variant="danger" onClick={()=>deleteTemplate(confirmDeleteTpl.id)}>{t("delete")}</Btn>`
- `index.html:230` — `if (data.templates)  localStorage.setItem('mb_templates',  data.templates);`
- `index.html:276` — `if (d.templates)  localStorage.setItem('mb_templates',  d.templates);`
- `index.html:308` — `'mb_habits','mb_templates','mb_cats',...` (sign-out clear list)

**Docs (manual content):** 4 entries — `src/constants/manualContent.js:68,69,215,216,644` (Battle Templates docs in en/it/pt).

**`gridTemplateColumns` (CSS, not the template concept):** `src/components/train/BattleDayView.jsx:258, 813`, `src/components/logToday/LogTodayConditioning.jsx:424`, `src/components/train/MusicFlow.jsx:249`, `src/components/calendar/ReportsTimeline.jsx:75`, `src/components/train/Spar1v1.jsx:804`, `src/components/train/Sparring.jsx:859`, `src/components/shared/BodyPartChipGrid.jsx:52`, `src/components/moves/CategoryGrid.jsx:36`, `src/components/home/HomeMonthSheet.jsx:145, 160`, `src/components/moves/SearchResultsView.jsx:37`, `src/components/moves/SetsView.jsx:127`, `src/components/battle/FlowMap.jsx:490`, `src/components/battle/CompetitionSimulator.jsx:1281`. These are unrelated to the "template" concept — listed for completeness only.

**Translations (`src/constants/translations.js`) — battle template keys, ~12 keys × 12 languages:** `saveBattleTemplate`, `loadBattleTemplate`, `loadTemplate`, `deleteTemplate`, `templateNameLabel`, `yesLoadTemplate`, `saveTemplateBtn`, `noTemplatesSaved`, `loadSavedTemplate`, `saveCurrentTemplate`, with comment header "Battle/Template buttons" at `:180`. Anchor lines for the en bundle: `:144, 145, 149, 180, 182, 183, 185, 297`. The same set repeats per locale at lines `:1430, 1431, 1434, 1463, 1464, 1466, 1566` (it), `:2686, 2687, 2690, 2719, 2720, 2722, 2815` (es), `:3931, 3932, 3935, 3964, 3965, 3967, 4060` (fr), `:5176, 5177, 5180, 5209, 5210, 5212, 5305` (pt), `:6421, 6422, 6425, 6454, 6455, 6457, 6550` (de), `:7667, 7668, 7671, 7700, 7701, 7703, 7796` (ja), `:8911, 8912, 8915, 8944, 8945, 8947, 9040` (zh), `:10155, 10156, 10159, 10188, 10189, 10191, 10284` (ru), `:11418, 11419, 11423, 11454, 11456, 11457, 11459, 11564` (ko), `:12698, 12699, 12703, 12734, 12736, 12737, 12739, 12851` (th), `:13973, 13974, 13978, 14009, 14011, 14012, 14014, 14126` (vi).

**Summary** — the `template` / `templates` name is fully owned by **Battle Round Templates** (`mb_templates` slice in ReadyPage.jsx) in both code and translations. Repurposing this term for routines/goals would create a direct collision.

### `preset` / `presets`

`preset` appears 104 times across 18 files. Concentrated usages:

- `src/constants/colors.js:1` (export of `PRESET_COLORS`)
- `src/components/battle/ReadyPage.jsx:2, 140, 151, 640` — uses of `PRESET_COLORS` (color palette for rounds/sets, unrelated to data presets)
- `src/components/battle/NewRoundModal.jsx:2, 12, 28` — `PRESET_COLORS` usage
- `src/components/battle/BattleFormBody.jsx:9, 138` — `FORMAT_PRESETS` (battle format choices like 1v1, 2v2, etc.)
- `src/components/battle/RoundCard.jsx:11, 77, 138` — `ROUND_NAME_PRESETS` (suggested round names)
- `src/components/train/BattlePrepSetup.jsx:6, 11, 13, 14, 41, 128, 129, 132, 153, 161, 207, 233, 322, 331, 333` — **battle-prep planner preset** ("smoke" / "prove" / "mark" / "custom"): this is the dominant non-CSS use. Selected via radio cards.
- `src/components/train/BattlePrepPage.jsx:7, 23, 31, 75` — `PRESET_IDS`, `PRESET_META`, `setupPreset`, `setSetupPreset`. Same battle-prep preset concept.
- `src/components/train/battlePrepHelpers.js:14` — `PRESET_META` definition (likely)
- `src/components/train/BattleDayView.jsx` — 6 hits (`Get` indirectly via plan.preset metadata)
- `src/components/train/BattleHistoryView.jsx` — 2 hits
- `src/components/reflect/BattleResultDetail.jsx` — 4 hits
- `src/components/calendar/SessionJournal.jsx` — 3 hits
- `src/components/moves/AddCategoryModal.jsx` — 3 hits (likely preset categories)
- `src/components/moves/GAPTab.jsx` — 2 hits
- `src/components/moves/SetDetailModal.jsx` — 3 hits
- `src/components/moves/SetsView.jsx` — 2 hits
- `src/utils/textStreamWraps.js:1060` — comment about preset metadata
- `src/constants/translations.js` — 8 hits across locales for `switchPlanConfirm` ("Switch preset? This will rebuild your training schedule.")

**Summary** — `preset` is in heavy use, primarily for: (a) the battle-prep planner type (smoke/prove/mark/custom), (b) format presets in battles, (c) color palette presets, (d) category presets. Repurposing the term for routines/goals would overload an already-loaded word.

### `library` / `libraries`

**LIBRARY sub-tab of MOVES (sub-list, per prompt):**

- `src/constants/translations.js:8` — `library:"LIBRARY"` (en navigation key; same key per locale at `:1309, 2565, 3810, 5055, 6300, 7545, 8791, 10035, 11282, 12562, 13837`)
- `src/components/moves/VocabTabBar.jsx:9` — `const tabs = [["moves", t("library")], ["sets", t("sets")], ["gap", t("gapTab")]];` (the actual sub-tab rendering — note `t("library")` is the label for the `moves` sub-tab id)
- `src/components/moves/LibraryMenuSheet.jsx` (the entire 50-line file — sheet opened from the LIBRARY sub-tab's `+` button)
- `src/constants/manualContent.js:46, 56, 67, 103, 105, 107, 109` — manual entries describing the LIBRARY sub-tab and its tools strip
- `src/constants/manualContent.js:10, 12, 40, 50, 126, 147` — "move library" general references
- `src/components/train/ComboMachine.jsx:228` — `stat={`${moves.length} moves in your library`}`

**"Library" as a free-floating term ("save to library", "add to library", "move library") — potential conflict list:**

- `src/constants/translations.js:34` — `combineBrief:"Spin random combinations from your move library..."`
- `src/constants/translations.js:158` — `autoLinkMoveLib:"AUTO-LINK TO MOVE LIBRARY"`
- `src/constants/translations.js:227` — `autoLinkedMoveLib:"Auto-linked to move library"`
- `src/constants/translations.js:253` — `clearAllMovesDesc:"Permanently delete your entire move library. Cannot be undone."`
- `src/constants/translations.js:411` — `selectMoves:"SELECT MOVES FROM LIBRARY"`
- `src/constants/translations.js:413` — `comboNoMoves:"Add some moves to your library first"`
- `src/constants/translations.js:443` — `randomise:"RANDOMISE", livePreview:"LIVE PREVIEW", saveToLibrary:"SAVE TO LIBRARY"`
- `src/constants/translations.js:1182` — `addToLibrary:"+ ADD TO LIBRARY"`
- `src/constants/translations.js:1192` — `savedToLibrary:"Saved to library"` (+ each locale copy: `:2450, 3695, 4940, 6185, 7430, 8676, 9920, 11164, 12444, 15015`)
- `src/constants/translations.js:1205` — `addToMoveLibrary:"ADD TO MOVE LIBRARY"`
- `src/constants/translations.js:1206` — `addToLibraryTitle:"ADD TO LIBRARY"` (used as `LibraryMenuSheet` title)
- `src/constants/translations.js:1210` — `saveToLibrary:"SAVE TO LIBRARY"`
- `src/components/battle/FlowMap.jsx:599, 647, 648, 836, 846, 960` — "save to library" and "add to library" UI flows
- `src/components/moves/Lab.jsx:251, 704` — "save to library" handlers and section header
- `src/components/moves/RestoreRemixRebuild.jsx:385` — `{/* Library section */}`

**Summary** — "library" is exclusively the move library (MOVES > LIBRARY sub-tab) and its bulk-import sheet. Outside the LIBRARY sub-tab, the term is used as a verb-object ("save to library", "add to library") to mean "promote this generated thing into the user's persistent move collection." No use for sets, routines, goals, or templates.

### `recipe` / `recipes`

`Grep` with case-insensitive flag across `src/`: **zero matches.** The term is free.

### `blueprint` / `blueprints`

`Grep` with case-insensitive flag across `src/`: **zero matches.** The term is free.

### `saved` as a prefix in variable/key/property names

Distinct prefixed identifiers found:

- **`savedSession`** — `src/components/train/Spar1v1.jsx:108, 393, 395-398, 405, 896, 900, 920, 928` and `src/components/train/RepCounter.jsx:25, 46-58, 228-247` (and more lines through 247). Used for the post-session complete-screen reference to the just-saved session record.
- **`savedAt`** — `src/components/battle/ReadyPage.jsx:84, 319` (battle template metadata field), `src/components/battle/FreestylePage.jsx:90, 609` (freestyle saved-list metadata).
- **`savedLists`** — `src/components/battle/FreestylePage.jsx:80, 84, 85, 92, 100, 197, 198, 590, 601` (Freestyle saved freestyle-target lists, persisted to `mb_freestyle_saved` localStorage).
- **`savedToLibrary`** — `src/components/battle/FlowMap.jsx:648, 817` (FlowMap connection metadata flag indicating the move was promoted to the move library).
- **`savedTo`** — `src/constants/translations.js:1211` and per-locale copies at `:2469, 3714, 4959, 6204, 7449, 8695, 9939, 11183, 12463, 13721, 15034` (toast string "Saved to {category}").

There is **no** `savedCombos`, `savedRoutines`, `savedSets`, `savedGoals`, or `savedTemplates` identifier anywhere in `src/`.

---

## Section 7 — Adjacent "saved artifact" pattern: Saved Combos (or equivalent)

### Combine ("Combo Machine") does not save combos as a separate artifact type

The `mb_combos` slice (state declared at `src/App.jsx:157-159`) is shaped as:
```
{ transitions: string[], selectedMoveIds: string[] | null }
```
This is the user's transition pool and the subset of moves the combo generator may pick from — **configuration**, not a list of saved combos.

When a user "saves" a generated combo in `ComboMachine`, the save handler at `src/components/train/ComboMachine.jsx:158-184` calls `onSaveSet({ name, color, moveIds, notes: comboText, mastery: 0, date })` — this writes a new entry into **`mb_sets`** (the canonical Sets store), not a combos store. There is no separate "saved combos" library.

The Save modal lives at `src/components/train/ComboMachine.jsx:153-157` (`openSaveModal`) and `:158-184` (`doSave`). It is invoked from the Combine main screen after a spin completes — see the save-CTA region rendered around `:415-475` (a "save as a Set" button next to the combo preview).

After saving, the combo is reachable to the user as any other Set: under MOVES > SETS via `SetsView` / `SetDetailModal`. There is no "load combo" or "instantiate combo" affordance back inside `ComboMachine` — once saved, it lives only in the Sets store.

### Wiring observations (not recommendations)

- `mb_combos` follows the canonical slice pattern (§3): state in App.jsx, debounced Firestore save, subscribe handler, sign-out clear, BackupModal map entry (`src/components/modals/BackupModal.jsx:16`). It has no TextStream emit wrap (no user-text fields).
- The "saved combo = entry in `mb_sets`" pattern means saved combos pick up every behavior of Sets: cross-referencing from training events (`pendingSetIds`), Set picker UI in LogTodayTraining, etc. No additional plumbing was required to make saved combos searchable / referenceable elsewhere.
- The closest in-codebase analog to "user creates a thing they want to reuse" with its own dedicated store is `mb_freestyle_saved` (`src/components/battle/FreestylePage.jsx:80-102`) — but that slice is itself an ad-hoc local-only slice (no Firestore save, no sign-out cleanup, not in BackupModal map), so it is not a good reference for the canonical pattern.

---

## Gaps and Caveats

- **`mb_log_exclusions` does not exist.** The prompt referenced it as the canonical pattern triple. Grep returns zero matches for that key, `log_exclusions`, `logExclusions`, or `exclusions`. The §3 checklist was reconstructed from `mb_home_stack` + `mb_ideas` + comparison to the partial wiring of `mb_templates` and `mb_freestyle_saved`. If a more canonical recently-added slice exists that the maintainer had in mind, it should be checked against the checklist directly.
- **Avatar overlay does not exist.** The prompt's framing implied a Profile / Settings / Feedback overlay accessible from the avatar; in code, the avatar opens `ProfileModal` directly, and `ProfileModal` itself inlines Settings + Feedback + Legal + Backup as expandable sub-sections. There is a separate gear icon in the header that opens `SettingsModal` standalone. No floating menu/overlay is rendered from the avatar click.
- **Goal completion state.** Goals (idea `type: 'goal'`) have no schema field for "completed" — only `archived: true` (set via the archive handler) and the per-day `homeChecks[date][tileId]` for the `goalhabit` tile. Targets have numeric `current` toward `target` but no auto-archive on `current >= target`. If #202 needs a "completed" lifecycle for goals/targets, it would be net-new schema.
- **Section count in §6 is high for translations.** The 12-language repetition of every template/library/savedTo key means each new template-related string is a 12-line translation change. The exact line counts above are accurate at this snapshot but new strings added to en before the doc is read may have shifted later locales by N lines.
- **`mb_templates` in `index.html:308` sign-out cleanup list is present, but the slice is otherwise not centrally wired.** This is a documented inconsistency — flagging here as observed (per prompt: "If you find dead code or bugs, note them in the report — do not touch them"). The `mb_templates` Firestore push at `src/components/battle/ReadyPage.jsx:60` is in-component and unconditional on its inner-component lifecycle, not on `dbSave.current` like every other slice.
- **`useWipTriggers` was not opened.** §5's MOVES `+` behavior summary cites `src/hooks/useWipTriggers.js` by reference (from the import at `src/components/moves/WIPPage.jsx:188`). The exact branching logic per `vocabTab` value was not inspected line-by-line; the LibraryMenuSheet entries are sourced from `LibraryMenuSheet.jsx` directly. If §5's claim about non-LIBRARY MOVES sub-tabs (sets, gap) handling `+` differently matters for #202, that hook should be opened to verify.
