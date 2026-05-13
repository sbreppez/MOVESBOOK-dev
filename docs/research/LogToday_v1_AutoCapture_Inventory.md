# Log Today v1 — Auto-Capture Inventory Dossier

**Generated:** 2026-05-04
**Branch:** v2
**Commit:** 998772e
**Purpose:** Step 3 inventory — deployed reality of the 5 auto-capture sources + 4 cross-cutting concerns.

---

## Source 1 — Drill (Rep Counter)

| Field | Value |
|---|---|
| Component file | `src/components/train/RepCounter.jsx` |
| Hook / state owner | Inline in `App.jsx` — `const [reps, setReps] = useState(...)` at `src/App.jsx:131` |
| localStorage key | `mb_reps` |
| Firestore collection | `users/{uid}/reps` (via `dbSave.current.reps` registered at `src/App.jsx:304`, synced at `src/App.jsx:338`) |
| Timestamp field | `date` — full ISO 8601 string (`new Date().toISOString()`) |
| Write trigger | User taps "DONE — SAVE [N] reps" in counting screen at `RepCounter.jsx:217` → `handleDone` at `RepCounter.jsx:99` calls `onSaveSession(session)` at `RepCounter.jsx:111`. Wired in `App.jsx:752–760` to (a) prepend to `reps`, (b) mutate the matching move's `date` to `todayLocal()` (`App.jsx:754`). `RepCounter.jsx:112–122` ALSO calls `addCalendarEvent({ ..., source:"rep_counter" }, { silent:true })` |

**Record shape (verbatim from `RepCounter.jsx:102–110`):**

```js
const session = {
  id: Date.now(),
  moveId: selectedMove.id,
  moveName: selectedMove.name,
  moveCategory: selectedMove.category,
  reps: count,
  duration: Math.floor(elapsed / 1000),
  date: new Date().toISOString(),
};
```

**Companion writes triggered by the same save:**

- Move mutation at `App.jsx:754`: `setMoves(prev=>prev.map(m=>m.id===session.moveId?{...m,date:todayLocal()}:m));` — overwrites the move's `date` field with today's `YYYY-MM-DD` (no `prevDate` backup, unlike the trained-tap path).
- Calendar event at `RepCounter.jsx:113–121`:

```js
addCalendarEvent({
  date: todayLocal(),
  type: "training",
  title: `Rep Counter — ${selectedMove.name}`,
  categories: [selectedMove.category],
  moveIds: [selectedMove.id],
  duration: Math.round(Math.floor(elapsed / 1000) / 60) || 1,
  source: "rep_counter",
}, { silent: true });
```

**Notes:** A single Drill save touches THREE stores (`mb_reps`, `mb_moves`, `mb_calendar.events`). The Calendar day-events query (Concern 3) consequently surfaces this single action three times. The session record's `date` is full ISO with millisecond precision; the calendar event's `date` is `todayLocal()` YYYY-MM-DD; the move's mutated `date` is also `todayLocal()` YYYY-MM-DD — so the rep session is the only artifact with within-day ordering. Optional `reflection` field is added later via `onUpdateSession` (`RepCounter.jsx:48–58`). No `exertion` / `bodyStatus` fields on this record despite `CalendarOverlay.jsx:178–180` reading them off `repSessions` (dead read — RepCounter never writes them).

---

## Source 2 — Spar (Solo)

| Field | Value |
|---|---|
| Component file | `src/components/train/Sparring.jsx` |
| Hook / state owner | Inline in `App.jsx` — `const [sparring, setSparring] = useState(...)` at `src/App.jsx:134`. Default shape: `{ sessions:[], records:{} }` |
| localStorage key | `mb_sparring` (shared with Spar 1v1; sub-array `sessions[]`) |
| Firestore collection | `users/{uid}/sparring` (via `dbSave.current.sparring` registered at `src/App.jsx:305`, synced at `src/App.jsx:339`) |
| Timestamp field | `date` — full ISO 8601 string (`new Date().toISOString()`) |
| Write trigger | User taps "Save Session" on Done screen → `handleSave` at `Sparring.jsx:313` builds the session, computes PR records, calls `onSaveSession(session, updatedSparring)` at `Sparring.jsx:368`. Wired in `App.jsx:761–773` to (a) replace `sparring` with `updatedSparring`, (b) if `session.movesTrained?.length`, mutate each tagged move's `date` to `todayLocal()` (`App.jsx:765`). `Sparring.jsx:370–381` ALSO calls `addCalendarEvent({ ..., source:"sparring" }, { silent:true })` |

**Record shape (verbatim from `Sparring.jsx:315–333`, plus `prBroken` set at line 361):**

```js
const session = {
  id: Date.now(),
  mode,                              // "rounds" | "time" | "death"
  targetRounds: mode === "rounds" ? targetRounds : null,
  timeLimit: mode === "time" ? timeLimit : null,
  restRatio,
  rounds: completedSession.rounds,
  roundLog: completedSession.roundLog,
  totalDuration: completedSession.totalDuration,
  avgRoundLength: completedSession.avgRoundLength,
  longestRound: completedSession.longestRound,
  shortestRound: completedSession.shortestRound,
  movesTrained: selectedMoves,       // array of move ids
  notes,
  reflection: reflection.trim() || null,
  exertion,                          // EXERTION_OPTIONS value | null
  bodyStatus,                        // { wrists, shoulders, knees, back } | null
  date: new Date().toISOString(),
};
session.prBroken = prs[0] || null;
```

**Persisted as (verbatim from `Sparring.jsx:363–366`):**

```js
const updatedSparring = {
  sessions: [session, ...(sparring.sessions || [])],
  records,                           // { mostRounds, longestRound, longestSession, longestDeathSession }
};
```

**Companion writes triggered by the same save:**

- Move mutation at `App.jsx:765` for each id in `session.movesTrained`.
- Calendar event at `Sparring.jsx:370–381` with `mode`-derived label, `duration` in minutes, optional `notes`, plus the same `exertion` / `bodyStatus` snapshot.

**Notes:** Same triple-write pattern as Drill (`mb_sparring`, `mb_moves`, `mb_calendar.events`) when the user tags moves on the Done screen. The `mode` chooser (`Sparring.jsx:495–499`) is `solo`-only — the 1v1 path is rendered via `<Spar1v1 …/>` at `Sparring.jsx:434–442` and writes a different shape (Source 3). The `Sparring.jsx:66` `Sparring` component is the entry point reachable from HOME shortcuts → "Solo Spar" tile (`Sparring.jsx:415–420`).

---

## Source 3 — Spar (1v1)

| Field | Value |
|---|---|
| Component file | `src/components/train/Spar1v1.jsx` |
| Hook / state owner | Same `[sparring, setSparring]` as Solo (`src/App.jsx:134`) — but uses sub-arrays `sessions1v1[]` + `records1v1` |
| localStorage key | `mb_sparring` (shared with Solo) |
| Firestore collection | `users/{uid}/sparring` (shared with Solo) |
| Timestamp field | `date` — full ISO 8601 string (`new Date().toISOString()`) |
| Write trigger | User taps "Save" on Summary screen at `Spar1v1.jsx:860` → `handleSave` at `Spar1v1.jsx:260` builds session, computes PR records, calls `onSaveSession(session, updatedSparring)` at `Spar1v1.jsx:295`. Reuses Sparring's wiring in `App.jsx:761–773`. `Spar1v1.jsx:298–307` ALSO calls `addCalendarEvent({ ..., source:"spar-1v1" }, { silent:true })` |

**Record shape (verbatim from `Spar1v1.jsx:234–249`, then merged at `Spar1v1.jsx:261–266` with edited fields):**

```js
const session = {
  id: Date.now(),
  opponent: opponentName.trim(),
  opponentId: linkedPersonId,
  location: location.trim(),
  targetRounds: hasRoundLimit ? targetRounds : null,
  roundLog: finalLog,                // [{ roundNumber, side: "user"|"opponent", durationMs }, …]
  totalDuration,
  userRounds,
  opponentRounds,
  userTotalMs,
  opponentTotalMs,
  journal: null,
  date: new Date().toISOString(),
  firstSide: firstSide || "user",
};
// then in handleSave (lines 261–266):
const session = {
  ...completedSession,
  opponent: editOpponent.trim() || completedSession.opponent,
  location: editLocation.trim(),
  journal: journal.trim() || null,
};
```

**Persisted as (verbatim from `Spar1v1.jsx:289–293`):**

```js
const updatedSparring = {
  ...sparring,
  sessions1v1: [session, ...(sparring.sessions1v1 || [])],
  records1v1: records,               // { mostRounds, longestRound, longestSession }
};
```

**Companion writes triggered by the same save:**

- Calendar event at `Spar1v1.jsx:299–306` (different from Solo: title is `1v1 Spar vs ${opponent}`, notes embeds `locationLabel: ${location}`, no `exertion`/`bodyStatus`).
- If `linkedPersonId` exists, mutates `rivals` at `Spar1v1.jsx:320–324` to append a `sparEntry` (date, rounds, totalDuration, roundLog, perspective:"self") to that person's `sparHistory` array.
- After-save flow (`Spar1v1.jsx:329–338`): if no `linkedPersonId` and an opponent name is set, opens `showAddPerson` UI which on confirmation appends a NEW person to `rivals` with the session embedded as their first `sparHistory[0]` entry (`Spar1v1.jsx:391–425`).

**Notes:** Solo and 1v1 SHARE the store (`mb_sparring`) but DO NOT share the record shape — kept as separate arrays (`sessions[]` vs `sessions1v1[]`) and separate PR registries (`records` vs `records1v1`). Per the prompt's rule, both slots are filled. The Calendar day-events query (`CalendarOverlay.jsx:113`) merges them under a single `sparringSessions` key by combining both arrays — done at `CalendarOverlay.jsx:86–87` for the activity dot map but the `dayData` memo only reads `sparring?.sessions`, NOT `sparring?.sessions1v1`. **This is a real gap: 1v1 sessions are NOT included in the Calendar's per-day breakdown — they only show up via the calendar event entry, not the dedicated "Sparring Sessions" section.** See Concern 3 closing flag.

---

## Source 4 — Sets practice (FlashCards)

| Field | Value |
|---|---|
| Component file | `src/components/moves/FlashCards.jsx` |
| Hook / state owner | Inline in `FlashCards.jsx:21–34` (screen state, deck, results, isNewBest); persisted slice owned by `App.jsx:146–148` — `[flashcards, setFlashcards]` with default `{ bestScore:null }` |
| localStorage key | `mb_flashcards` (best-score metadata only — NO per-session table) |
| Firestore collection | `users/{uid}/flashcards` for the bestScore (registered at `src/App.jsx:309`, synced at `src/App.jsx:343`); per-session record exists ONLY in `users/{uid}/calendar` as a calendar event |
| Timestamp field | `date` — `todayLocal()` YYYY-MM-DD only (no time component, no millisecond ordering) |
| Write trigger | At end of deck, `handleAnswer` at `FlashCards.jsx:56–87` (line 64 onward) computes percentage, conditionally writes a new `bestScore` (`FlashCards.jsx:73`), and ALWAYS writes a calendar event (`FlashCards.jsx:77–83`) — note: NO `{ silent:true }` second arg, so this auto-capture surfaces a toast (unlike Drill/Spar/Combine) |

**Record shapes (verbatim from `FlashCards.jsx:73`, `FlashCards.jsx:77–83`):**

```js
// Best-score metadata write (only when newBest):
onFlashcardsChange({ ...flashcards, bestScore: { percentage, total, correct, date: todayLocal() } });

// Calendar event (always):
addCalendarEvent({
  source: "flashcards",
  date: todayLocal(),
  title: "Flash Cards",
  type: "flashcards",
  score: { percentage, total, correct },
});
```

**Notes:** No per-session record is persisted. Per-card answers (`results` state in `FlashCards.jsx:31`, line 57's `{ setId, gotIt }` entries) are lost when the screen unmounts — only the aggregate `score` survives via the calendar event. Title is hard-coded English `"Flash Cards"` (not translated). The calendar event's `type: "flashcards"` is a non-standard type (the documented types per `SessionJournal.jsx:118–122` are `training`/`battle`/`rest`/`journal`/`custom`) — `CalendarOverlay.jsx:608` defaults the icon to `mapPin` for unknown types and the title rendering at `CalendarOverlay.jsx:609` uses `e.title || t(e.type === "training" ? …)` so it shows `"Flash Cards"` literally. The `dayData.calendarEvents` filter (`CalendarOverlay.jsx:117`) DOES surface it, so it shows up in the day breakdown.

---

## Source 5 — Combine (saved combo)

| Field | Value |
|---|---|
| Component file | `src/components/train/ComboMachine.jsx` |
| Hook / state owner | Inline in `ComboMachine.jsx:28–38` (slots, saveModal, saveName); the persisted `combos` slice (`mb_combos`) at `src/App.jsx:137–139` only stores config (`transitions`, `selectedMoveIds`), NOT combo history. Combos saved as Sets land in `mb_sets` (App.jsx wires `onSaveSet` at `App.jsx:783` to append to `sets`) |
| localStorage key | `mb_combos` (config) + `mb_sets` (saved combos as Sets) + `mb_calendar` (event log). **No dedicated combo-history key.** |
| Firestore collection | `users/{uid}/sets` for the saved Set, `users/{uid}/combos` for config, `users/{uid}/calendar` for the event |
| Timestamp field | `date` on the saved Set: `todayLocal()` YYYY-MM-DD; `date` on the calendar event: same. **No millisecond ordering anywhere on this path.** |
| Write trigger | Spin → user taps "SAVE AS SET" at `ComboMachine.jsx:441–445` → opens save modal → user taps modal "SAVE AS SET" at `ComboMachine.jsx:481–485` → `doSave` at `ComboMachine.jsx:158`. Calls `onSaveSet({…})` at `ComboMachine.jsx:163–170` (App wiring at `App.jsx:783` appends to `sets` with a generated `id`), then `addCalendarEvent({…}, { silent:true })` at `ComboMachine.jsx:174–182` |

**Record shape — saved Set (verbatim from `ComboMachine.jsx:163–170`):**

```js
onSaveSet({
  name: saveName || `Combo ${todayLocal()}`,
  color: tierColor,                  // rainbow-by-move-count tier (3→9 → violet→red)
  moveIds: slots.map(s => s.move.id),
  notes: comboText,                  // "Move A → [Trans] → Move B → …"
  mastery: 0,
  date: todayLocal(),
});
```

**Record shape — calendar event (verbatim from `ComboMachine.jsx:174–182`):**

```js
addCalendarEvent({
  date: todayLocal(),
  type: "training",
  title: `Combo Machine — ${saveName || "Combo"}`,
  categories: [...new Set(slots.map(s => s.move.category))],
  moveIds: slots.map(s => s.move.id),
  notes: comboText,
  source: "combo_machine",
}, { silent: true });
```

**Notes:** A saved combo is INDISTINGUISHABLE from a manually-created Set in `mb_sets` — the only marker that this Set originated from Combine is the matching calendar event with `source: "combo_machine"`. The Set's `name` defaults to literal English `"Combo ${YYYY-MM-DD}"` (not translated) and `notes` carries the raw combo text including U+2192 `→` arrows. `tierColor` comes from the rainbow palette in `ComboMachine.jsx:12–20` — six discrete CAT_COLORS keyed by move count. The `addCalendarEvent` wiring receives `{ silent: true }` so the toast comes only from `addToast({ icon:"check", title: t("comboSaved") })` at `ComboMachine.jsx:172`.

---

## Source 6 — Move-tile trained/drilled tap

| Field | Value |
|---|---|
| Component file | `src/components/moves/MoveTile.jsx` (the circular trained-today button at `MoveTile.jsx:77–86`) |
| Hook / state owner | `useMoveCrud` hook at `src/hooks/useMoveCrud.js:18–33` — `handleToggleTrainedToday` mutates the `moves` array. Owned by `App.jsx` `[moves, setMoves]` at `App.jsx:120` (visible via `setMovesGrad` wrapper passed down) |
| localStorage key | `mb_moves` — mutates `move.date` and `move.prevDate` IN PLACE on the existing move record. **No dedicated session table, no per-instance record.** |
| Firestore collection | `users/{uid}/moves` (registered at `src/App.jsx:294`, synced at `src/App.jsx:329`). The mutation rides on the existing `moves` sync. |
| Timestamp field | `date` on the move — `todayLocal()` YYYY-MM-DD only. `prevDate` holds the ONE prior value to allow a single undo/toggle-off step. |
| Write trigger | User taps the circular button at `MoveTile.jsx:79`: `onClick={e => { e.stopPropagation(); onToggleTrainedToday(move.id); }}`. The button shows green-checked when `move.date === todayLocal()` (`MoveTile.jsx:78`). `useMoveCrud.handleToggleTrainedToday` at `useMoveCrud.js:18–33` toggles the field |

**Record shape — toggle logic (verbatim from `useMoveCrud.js:18–33`):**

```js
const handleToggleTrainedToday = (id) => {
  const today = todayLocal();
  const move = moves.find(m => m.id === id);
  if (!move) return;
  const isToday = move.date === today;
  setMoves(prev => prev.map(m => {
    if (m.id !== id) return m;
    return isToday
      ? { ...m, date: m.prevDate || null, prevDate: null }   // toggle off → restore
      : { ...m, prevDate: m.date, date: today };             // toggle on  → swap
  }));
  addToast({
    icon: isToday ? "refresh" : "check",
    title: t(isToday ? "unmarkedToday" : "markedTrainedToday"),
  });
};
```

**Notes:** This is the only auto-capture source that **does not write a calendar event**. It also does not produce a per-tap record — every tap simply rewrites the move's `date`. Consequently, the only history this preserves is "the most recent date the move was trained" + a single rollback via `prevDate`. The Calendar day-events query surfaces it via `movesTrained: (moves||[]).filter(m => toYMD(m.date) === d)` (`CalendarOverlay.jsx:110`), but the same record is also surfaced if a move was last touched by Drill (which mutates `m.date` at `App.jsx:754`) or by Sparring with `movesTrained` (`App.jsx:765`) or by SessionJournal (`CalendarOverlay.jsx:130–134`). **The "trained today" tile button cannot be distinguished from Drill / Spar / SessionJournal once the day passes.**

---

## Source 7 — Flow (Music Flow)

| Field | Value |
|---|---|
| Component file | `src/components/train/MusicFlow.jsx` |
| Hook / state owner | Inline in `App.jsx` — `const [musicflow, setMusicflow] = useState(...)` at `src/App.jsx:161` (default `{ sessions:[] }`) |
| localStorage key | `mb_musicflow` (persisted at `src/App.jsx:257`) |
| Firestore collection | `users/{uid}/musicflow` (via `dbSave.current.musicflow` registered at `src/App.jsx:313`, synced at `src/App.jsx:347`) |
| Timestamp field | `date` — full ISO 8601 string (`new Date().toISOString()`) on the session record; the calendar event uses `todayLocal()` YYYY-MM-DD |
| Write trigger | User taps "DONE" on active screen at `MusicFlow.jsx:210` → `handleDone` at `MusicFlow.jsx:89` builds the session and calls `onMusicflowChange` (wired in `App.jsx:810` to `setMusicflow`) at `MusicFlow.jsx:103–106`. The same handler ALSO calls `addCalendarEvent({ ..., source:"musicflow" }, { silent:true })` at `MusicFlow.jsx:108–111` and fires a toast at `MusicFlow.jsx:113` |

**Record shape (verbatim from `MusicFlow.jsx:95–101`):**

```js
const session = {
  id: Date.now(),
  date: new Date().toISOString(),
  duration,
  promptCount: finalPromptCount,
  stageReached,
};
```

**Persisted as (verbatim from `MusicFlow.jsx:103–106`):**

```js
onMusicflowChange(prev => ({
  ...prev,
  sessions: [session, ...(prev.sessions || [])],
}));
```

**Companion writes triggered by the same save:**

- Calendar event at `MusicFlow.jsx:108–111`:

```js
addCalendarEvent(
  { date: today, type: "training", title: "Music Flow", duration, source: "musicflow" },
  { silent: true }
);
```

- Toast at `MusicFlow.jsx:113`: `addToast({ icon: "check", title: t("sessionLogged") })` — explicit toast despite `{ silent: true }` on the calendar event.
- **No** `setMoves` mutation. Flow does NOT touch `mb_moves` even though a session may train moves implicitly.
- **No** other store touched.

**Optional reflection added post-save (verbatim from `MusicFlow.jsx:73–87`):** A debounced `useEffect` writes `onUpdateSession(savedSession.id, { reflection: reflection.trim() })` 800ms after the user stops typing in the Done-screen `<TrainingLog>`. `flushReflection()` is called on close (`MusicFlow.jsx:223`) to flush any pending text synchronously. The persisted record shape is therefore dynamic: 5 fields at save time, 6 fields if a reflection is written.

**Notes:** Component is still named `MusicFlow` internally and the calendar event title is hardcoded literal `"Music Flow"` (`MusicFlow.jsx:109`) — does not respect the `Music Flow → Flow` rename in `docs/CORE_PRINCIPLES.md:32`. The user-facing intro header at `MusicFlow.jsx:129` correctly uses `t("flow")`. This is the only auto-capture source that **opts out of the silent-event default to take manual control of the toast**: it passes `{ silent: true }` to suppress `addCalendarEvent`'s automatic toast at line 110, then explicitly fires its own `addToast` at line 113. (FlashCards is the inverse — no `{ silent: true }`, leaning on the auto-toast.) The session record carries no `exertion` / `bodyStatus` / `moveIds` / `categories` fields, so it never contributes to the `bodyLogData` memo at `CalendarOverlay.jsx:172–194`. The session timestamp is full ISO 8601 (millisecond precision via `Date.now()` for `id` and `new Date().toISOString()` for `date`), but the calendar event's `date` is `todayLocal()` YYYY-MM-DD — the same dual-format pattern as Drill and Spar.

**Recommended tile rendering for Log Today's Training sub-tab:**
- Line 1: `Flow — Stage {stageReached}`
- Line 2: `{duration formatted as MM:SS} · {promptCount} prompts`

(Adapts the three stat tiles already shown on the Done screen at `MusicFlow.jsx:251–254`: `mfSessionLength`, `mfPromptsCycled`, `mfStageReached`. Stage-reached is the most distinctive Flow-specific metric and goes on line 1; duration + prompt count are the natural session-quantity pair for line 2.)

---

## Cross-Cutting Concern 1 — Today-derivation

**Single canonical utility, no competition.**

- Function: `todayLocal()` at [src/utils/dateUtils.js:5–8](src/utils/dateUtils.js:5):

  ```js
  export function todayLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  ```

- Returns: `YYYY-MM-DD` string.
- Timezone: **device local time.** A comment at `dateUtils.js:1–4` explicitly warns: *"NEVER use `new Date().toISOString().split("T")[0]` — that's UTC and wrong for half the world."*
- Companion: `toLocalYMD(date)` at `dateUtils.js:13–16` — generic Date-or-string → YYYY-MM-DD converter, used only by `CalendarOverlay`'s defensive `toYMD` wrapper.
- Defensive parser: `toYMD(d)` at `src/components/calendar/CalendarOverlay.jsx:16–20` short-circuits already-formatted strings, otherwise delegates to `toLocalYMD`. A near-identical `toYMD(d)` at `src/components/train/battlePrepHelpers.js:95–99` (with its own internal `localYMD()` at `battlePrepHelpers.js:88–93`) — two helpers compute the same thing but are not imported from one another.

**Used by (call sites confirmed by grep):**

- `src/components/train/RepCounter.jsx:7,114` — calendar event date.
- `src/components/train/Sparring.jsx:11,373` — calendar event date.
- `src/components/train/Spar1v1.jsx:7,300,369` — calendar event date + JSON export filename.
- `src/components/moves/FlashCards.jsx:6,73,79` — bestScore.date + calendar event date.
- `src/components/train/ComboMachine.jsx:9,154,164,169,175` — save modal default name + Set date + calendar event date.
- `src/components/moves/MoveTile.jsx:10,78` — render-time check `move.date === todayLocal()`.
- `src/hooks/useMoveCrud.js:2,19` — toggle logic.
- `src/utils/nextTrainingDay.js:2,9` — active-plan filter.
- `src/components/calendar/CalendarOverlay.jsx:14,37,440,460,527,528` — selected-day default + "today" badge + future/past battle routing.
- `src/components/calendar/SessionJournal.jsx:9,65` — `isToday` badge.
- `src/components/home/HomePage.jsx:22,87` — `todayStr` default selected date.
- `src/App.jsx:754,765` — companion writes from RepCounter/Sparring saves.

**Conflicts / surprises:** None at the `todayLocal()` level. There is a minor duplication between `CalendarOverlay`'s `toYMD` and `battlePrepHelpers`' `toYMD` (both with the same name + behavior), and between `dateUtils.toLocalYMD` and `battlePrepHelpers.localYMD` — but every call site that needs a day-key today reaches `todayLocal()`.

---

## Cross-Cutting Concern 2 — Day-key shape

**Canonical format: `YYYY-MM-DD` string in device local time.** No competing key shapes anywhere.

Stores and fields keyed by day:

| Where | Shape | Example call site |
|---|---|---|
| `calendar.events[].date` | `YYYY-MM-DD` (set via `todayLocal()` or `eventObj.date` from SessionJournal) | `CalendarOverlay.jsx:117` filters with `e.date === d` |
| `battleprep.plans[].battles[].date` | `YYYY-MM-DD` | `nextTrainingDay.js:13` `b.date >= today` string compare |
| Battle prep `dayMap[dateStr]` | `YYYY-MM-DD` keys → `{ phase, type, session, eventName, … }` | `battlePrepHelpers.js:581–643` `computeAllDayMaps` |
| `homeStack.overrides[selectedDate]` | `YYYY-MM-DD` keys | `HomePage.jsx:27` `homeStack.overrides?.[selectedDate]` |
| `habits[].checkIns[]` | array of `YYYY-MM-DD` strings | `CalendarOverlay.jsx:88,115` `(h.checkIns||[]).includes(d)` |
| `ideas[].journal[].date` | `YYYY-MM-DD` | `CalendarOverlay.jsx:89,116` `(i.journal||[]).some(j => toYMD(j.date) === d)` |
| `move.date` / `move.prevDate` | `YYYY-MM-DD` (via `todayLocal()`) | `MoveTile.jsx:78`, `useMoveCrud.js:19` |
| `flashcards.bestScore.date` | `YYYY-MM-DD` | `FlashCards.jsx:73` |
| Saved Set `.date` (combo-origin) | `YYYY-MM-DD` | `ComboMachine.jsx:169` |
| `reps[].date` | full ISO 8601 string (NOT a day-key) — must be normalized via `toYMD()` | `CalendarOverlay.jsx:112` |
| `sparring.sessions[].date` and `sparring.sessions1v1[].date` | full ISO 8601 string — must be normalized via `toYMD()` | `CalendarOverlay.jsx:113`, but only `sessions` (not `sessions1v1`) is read |
| `musicflow.sessions[].date` | string (treated as ISO; normalized via `toYMD()`) | `CalendarOverlay.jsx:114` |

**Producer utilities:**

- `todayLocal()` — `src/utils/dateUtils.js:5`
- `toLocalYMD(date)` — `src/utils/dateUtils.js:13`
- `toYMD(d)` — `src/components/calendar/CalendarOverlay.jsx:16` (short-circuit + delegate)
- `toYMD(d)` — `src/components/train/battlePrepHelpers.js:95` (separate copy)

---

## Cross-Cutting Concern 3 — Calendar day-events query

**Calendar component:** [src/components/calendar/CalendarOverlay.jsx](src/components/calendar/CalendarOverlay.jsx) (lines 25–941).

**Day-detail panel:** rendered inline at `CalendarOverlay.jsx:454–848` when `selectedDay` is non-null. Initial state: `selectedDay = todayLocal()` (`CalendarOverlay.jsx:43`). Tap on a grid cell at `CalendarOverlay.jsx:395–397` toggles selection.

**Day-events query (verbatim, `CalendarOverlay.jsx:107–119`):**

```js
const dayData = useMemo(() => {
  if (!selectedDay) return null;
  const d = selectedDay;
  return {
    movesTrained: (moves || []).filter(m => toYMD(m.date) === d),
    repSessions: (reps || []).filter(r => toYMD(r.date) === d),
    sparringSessions: (sparring?.sessions || []).filter(s => toYMD(s.date) === d),
    musicflowSessions: (musicflow?.sessions || []).filter(s => toYMD(s.date) === d),
    habitsCompleted: (habits || []).filter(h => (h.checkIns || []).includes(d)),
    notesOnDay: (ideas || []).filter(i => (i.journal || []).some(j => toYMD(j.date) === d)),
    calendarEvents: (calendar?.events || []).filter(e => e.date === d),
  };
}, [selectedDay, moves, reps, sparring, musicflow, habits, ideas, calendar]);
```

**Stores it pulls from (7 inside the memo; 1 more derived via `activityMap`):**

1. `moves` → `movesTrained` (filter by `toYMD(m.date) === d`)
2. `reps` → `repSessions`
3. `sparring.sessions` (Solo only) → `sparringSessions` — **`sparring.sessions1v1` is NOT included here**
4. `musicflow.sessions` → `musicflowSessions`
5. `habits` → `habitsCompleted` (membership in `h.checkIns[]`)
6. `ideas` → `notesOnDay` (any `i.journal[]` entry matches)
7. `calendar.events` → `calendarEvents`
8. Battle-prep phases via `activityMap[selectedDay]?.battlePrepPhases` (computed separately at `CalendarOverlay.jsx:96–101` from `computeAllDayMaps(battleprep.plans)`); rendered at `CalendarOverlay.jsx:507–579`.

**Filter logic:**

- ISO-timestamp records (`reps`, `sparring.sessions`, `musicflow.sessions`, `moves.date`, `ideas.journal[].date`) → normalized via `toYMD()` then `=== d` string compare.
- Already-day-keyed records (`calendar.events.date`, `habits.checkIns`) → direct string compare.
- Battle prep phases → precomputed by `computeAllDayMaps(plans)` at `CalendarOverlay.jsx:70–73`, looked up by `dayMap[dateStr]`.

**Merge / sort logic:** None across stores. The day-detail panel renders independent sections in fixed order, each iterating its own array in source order:

- Calendar Events — `CalendarOverlay.jsx:593–702`
- Moves Trained — `CalendarOverlay.jsx:704–726`
- Rep Counter Sessions — `CalendarOverlay.jsx:728–747`
- Sparring Sessions — `CalendarOverlay.jsx:749–767` (Solo only — see flag below)
- Music Flow Sessions — `CalendarOverlay.jsx:769–787`
- Habits — `CalendarOverlay.jsx:789–802`
- Notes — `CalendarOverlay.jsx:804–814`
- Body Log — `CalendarOverlay.jsx:817–846` (derived from `bodyLogData` memo at `CalendarOverlay.jsx:172–194`, which reads `dayData.sparringSessions`, `dayData.repSessions`, `dayData.calendarEvents` and combines `exertion` + `bodyStatus`)

Within each section, items are not sorted — they appear in the array's natural order (newest-first because Drill/Spar prepend with `[session, ...prev]`).

**Activity-dot map** (separate from `dayData`, at `CalendarOverlay.jsx:76–104`): both `sparring.sessions` AND `sparring.sessions1v1` are scanned (`CalendarOverlay.jsx:86–87`) to mark "sparring" activity dots on the grid. So 1v1 sessions DO surface as a dot, but their session details DO NOT appear in the day-detail panel (only as a calendar event with `source: "spar-1v1"`).

**Flag — 1v1 omission:** The `dayData.sparringSessions` filter at `CalendarOverlay.jsx:113` reads ONLY `sparring?.sessions`. `sparring?.sessions1v1` is NOT read by the per-day query. A 1v1 session is therefore visible in the day breakdown ONLY via `dayData.calendarEvents` (which carries the auto-capture event with `source: "spar-1v1"`). If the calendar event is deleted or fails to write, the session disappears from the day view entirely.

**Flag — RepCounter `exertion`/`bodyStatus` dead read:** `CalendarOverlay.jsx:178–180` (the `bodyLogData` memo) iterates `dayData.repSessions` and pushes any record with `exertion || bodyStatus`. RepCounter's record shape (`RepCounter.jsx:102–110`) does NOT include those fields, so this branch is dead code — it never contributes to the body log.

---

## Cross-Cutting Concern 4 — Existing soft-remove patterns

Two distinct patterns exist; **NO pattern targets session records (Drill/Spar/Combine/FlashCards/calendar events).**

### Pattern A — `archived` boolean + `archivedDate` ISO timestamp (on ideas/goals/notes/battle plans)

Field shape — set at `src/components/home/HomePage.jsx:141`, `HomePage.jsx:171`, `HomePage.jsx:178`:

```js
{ ...i, archived: true, archivedDate: new Date().toISOString() }
```

Note: `archivedDate` is full ISO (with time), not a YYYY-MM-DD day-key.

Filter-on-read sites:

| File:line | Field check | Behavior |
|---|---|---|
| `src/components/home/HomePage.jsx:34` | `if (ref?.archived) return false;` | Hide goal/habit tile from home tile rendering |
| `src/components/home/HomePage.jsx:39` | `if (note?.archived) return false;` | Hide note tile from home tile rendering |
| `src/components/reflect/ReflectPage.jsx:81` | `(ideas || []).filter(i => i.archived === true)` | Collect archived ideas for REFLECT > HISTORY tab (kept in app, just hidden from active surfaces) |
| `src/components/reflect/ReflectPage.jsx:137` | `entry.kind === "goal" ? "archivedGoalContext" : "archivedNoteContext"` | Translation-key lookup for context labels in HISTORY entries |
| `src/utils/nextTrainingDay.js:12` | `if (p?.archived) return false;` | Skip archived battle plans when picking the next active plan |

Semantics: **hide-from-view, preserve in array.** No hard delete pathway; archived records stay in `ideas` / `battleprep.plans` indefinitely. The "history" surface in REFLECT is the only place archived items are intentionally shown.

### Pattern B — Per-day `removed` array on `homeStack.overrides[date]`

Field shape — at `src/components/home/HomePage.jsx:28`:

```js
const overrides = homeStack.overrides?.[selectedDate] || {};
const removed = overrides.removed || [];
```

Filter-on-read at `HomePage.jsx:31`:

```js
if (removed.includes(tile.id)) return false;
```

Semantics: **per-date soft-hide.** Tiles can be removed from a SPECIFIC day's home view without affecting other days or archiving the underlying record. Stored in `mb_home_stack.overrides[YYYY-MM-DD].removed = [tileId, …]`. Companion array `overrides[date].added = [tile, …]` for one-day insertions (`HomePage.jsx:52`).

### What does NOT exist

- No `excluded`, `hidden`, `dismissed`, `softDeleted`, or `isArchived` field on any session record (`reps[]`, `sparring.sessions[]`, `sparring.sessions1v1[]`, `calendar.events[]`, `musicflow.sessions[]`).
- No filter-on-read at any session-query site that respects an exclusion flag — `dayData` at `CalendarOverlay.jsx:107–119` simply concatenates raw arrays.
- No precedent for excluding a record from "today" specifically — the `homeStack.overrides[date].removed` pattern is the closest analog but it operates on home-tile IDs, not on session records.

**Bottom line:** Log Today v1's exclusion mechanism has **no soft-remove precedent on session records** to extend. Any "remove from Today" affordance will be designing against a clean slate (or generalising the `homeStack.overrides[date].removed` per-date array pattern, which is the only existing per-date hide).

---

## Open observations / surprises

- **Triple-write on Drill and Spar (Solo with movesTrained).** A single Drill save touches `mb_reps`, `mb_moves` (mutates `m.date` at `App.jsx:754`), and `mb_calendar.events`. A single Spar Solo save with tagged moves touches `mb_sparring`, `mb_moves` (`App.jsx:765`), and `mb_calendar.events`. The Calendar day-events query consequently surfaces these single actions in **three sections** simultaneously: `repSessions` (or `sparringSessions`), `movesTrained`, and `calendarEvents`. Log Today's modal will need a dedupe / source-of-truth strategy.
- **Timestamp format inconsistency.**
  - Drill (`reps[].date`), Spar Solo (`sparring.sessions[].date`), Spar 1v1 (`sparring.sessions1v1[].date`): full ISO 8601 (`new Date().toISOString()`).
  - FlashCards (`flashcards.bestScore.date`, calendar event), Combine (Set `.date`, calendar event), Move-tile trained tap (`move.date`/`move.prevDate`): `todayLocal()` YYYY-MM-DD only.
  - Cross-source within-day ordering is impossible without falling back to array order (newest-first by prepend convention) or, for the day-key sources, write order.
- **Move-tile trained tap writes no calendar event.** Only mutates `move.date` + one-step `prevDate` rollback. There is no record of *which past day* a move was previously trained on (only the latest plus one rollback). Once a move is re-trained on a later day, the previous day's "trained" trace is lost from `mb_moves` permanently. The only persistent trace in such cases is whatever `mb_calendar.events` happens to hold for that earlier day (i.e. a Drill / Spar / SessionJournal event tagging that move).
- **FlashCards has no per-session table.** Per-card answers are discarded after the summary screen; only `bestScore` is persisted. The session itself exists only as a `calendar.events` entry with `type: "flashcards"` (a non-standard type vs. `training`/`battle`/`rest`/`journal`).
- **FlashCards is the only auto-capture that toasts.** Drill, Spar Solo, Spar 1v1, Combine all pass `{ silent: true }` to `addCalendarEvent`. FlashCards (`FlashCards.jsx:77–83`) does not — it surfaces a toast. (`addCalendarEvent`'s `options` parameter handling lives upstream in App.jsx — not inspected here, but the call-site asymmetry is the relevant fact.)
- **Combine save creates a Set, not a combo-history entry.** `mb_combos` only stores config (transitions, selectedMoveIds). The saved combo lives in `mb_sets` indistinguishable from a manually-created Set; only the calendar event with `source: "combo_machine"` distinguishes its origin.
- **Calendar day-events omits `sparring.sessions1v1`.** `CalendarOverlay.jsx:113` reads only `sparring?.sessions`. 1v1 sessions appear in the per-day breakdown ONLY via `dayData.calendarEvents` (auto-captured event with `source: "spar-1v1"`). If that calendar event is missing or deleted, 1v1 sessions disappear from the day view despite still existing in `mb_sparring.sessions1v1`. (The activity-dot map at `CalendarOverlay.jsx:86–87` does include them, so the day still gets a "sparring" dot.)
- **Flow's calendar event title is hardcoded literal `"Music Flow"`** (`MusicFlow.jsx:109`), not translated and not respecting the `Music Flow → Flow` rename in `docs/CORE_PRINCIPLES.md:32`. The user-facing intro header at `MusicFlow.jsx:129` uses `t("flow")` correctly, but the calendar event log will show the old name in every language.
- **Flow does not mutate `mb_moves`.** Unlike Drill and Spar Solo, a Flow session does not mark any move as "trained today" — even if the user mentally associated specific moves with the session. The only persistent trace is the `musicflow.sessions[]` record + the calendar event with `source: "musicflow"`.
- **Flow's silent-vs-toast pattern is the only one of its kind.** It passes `{ silent: true }` to `addCalendarEvent` AND fires an explicit `addToast` (`MusicFlow.jsx:108–113`). Drill / Spar Solo / Spar 1v1 / Combine all use `{ silent: true }` and rely on downstream feedback. FlashCards uses no `{ silent: true }` (relies on the auto-toast). Flow is alone in opting out of the auto-toast while still firing one — intentional, but makes its toast string (`t("sessionLogged")`) the only translated label in the whole save path while the calendar event title remains untranslated literal English.
- **RepCounter `exertion`/`bodyStatus` dead read.** `bodyLogData` at `CalendarOverlay.jsx:178–180` iterates `dayData.repSessions` and pushes any with `exertion || bodyStatus`. RepCounter's record shape at `RepCounter.jsx:102–110` includes neither field, so this branch never contributes.
- **Saved-combo Set name uses untranslated English** (`"Combo ${YYYY-MM-DD}"` at `ComboMachine.jsx:155,164`). FlashCards calendar event title is also untranslated literal `"Flash Cards"` at `FlashCards.jsx:80`.
- **Two `toYMD` copies exist** (`CalendarOverlay.jsx:16` and `battlePrepHelpers.js:95`) with the same name and equivalent behavior, neither importing from the other or from `dateUtils`. Not load-bearing for Log Today design but worth noting.
- **Companion writes from manual logging.** `SessionJournal` saves go through `CalendarOverlay.handleSaveEvent` (`CalendarOverlay.jsx:121–142`) which on `type === "training"` mutates `m.date = eventObj.date` for each tagged move (`CalendarOverlay.jsx:130–134`). So MANUAL session logs also overwrite `move.date`, joining the chorus of writers on `mb_moves`.
