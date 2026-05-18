# Sets Practice → trainingLog — Investigation (#262)

Read-only audit of branch `v2`. All citations are `file:line` against
the deployed code.

---

## 1. Sets practice surfaces — every entry point

Searching by `mb_sets` consumers, `set.moveIds` references, `setId`
references, and any component that renders or iterates `sets[]` in a
loop driven by user interaction.

Only **one** surface in the app exists where a user "practices a Set"
in the sense the prompt intends — i.e. trains *because they picked a
Set to train against*:

- **FlashCards overlay** — [src/components/moves/FlashCards.jsx](src/components/moves/FlashCards.jsx).
  - Entry point: bordered "FLASH CARDS" button rendered at the top of
    the MOVES → SETS sub-tab, visible only when at least one Set has
    ≥ 2 moves
    ([src/components/moves/SetsView.jsx:74-91](src/components/moves/SetsView.jsx:74)).
    The button calls `onOpenFlashCards` which is wired in App.jsx to
    `setShowFlashCards(true)`
    ([src/App.jsx:939](src/App.jsx:939),
    [src/App.jsx:1361-1363](src/App.jsx:1361)).
  - What it does in one sentence: shows a deck of Set cards, lets the
    user flip each card to see the moves inside, then tap **GOT IT**
    or **MISSED IT** per card — i.e. it tests *recall of set
    composition*, not execution of the moves.

Everything else that touches `setIds` is **tagging / planning /
viewing**, not practicing:

- **LogTodayTraining picked-sets row** — [src/components/logToday/LogTodayTraining.jsx:245-281](src/components/logToday/LogTodayTraining.jsx:245).
  Renders sets the user attached to the log entry as a flat tile
  (name + move count). There is no per-move interaction inside the
  set on this surface — the set is just a label that expands to its
  moves via `movesFromSets` at save time
  ([LogTodayTraining.jsx:95-99](src/components/logToday/LogTodayTraining.jsx:95)).
  This is post-hoc logging, not practice.

- **SessionJournal `setIds` field** — [src/components/calendar/SessionJournal.jsx:28](src/components/calendar/SessionJournal.jsx:28),
  [SessionJournal.jsx:124](src/components/calendar/SessionJournal.jsx:124),
  [SessionJournal.jsx:349-353](src/components/calendar/SessionJournal.jsx:349).
  Same idea — selecting sets to attach to a journal entry.

- **BattlePrepSetup arsenal `setIds`** — [src/components/train/BattlePrepSetup.jsx:159](src/components/train/BattlePrepSetup.jsx:159).
  Planning input for a battle-prep plan. No practice loop.

- **SetsView / SetDetailModal** — [src/components/moves/SetsView.jsx](src/components/moves/SetsView.jsx),
  [src/components/moves/SetDetailModal.jsx](src/components/moves/SetDetailModal.jsx).
  CRUD on Sets (add, edit, reorder, delete, view moves inside, set
  mastery slider). No practice loop.

- **Search jump-to-source via `setsSeed`** — [src/App.jsx:925](src/App.jsx:925),
  [src/App.jsx:1171](src/App.jsx:1171),
  [src/components/moves/SetsView.jsx:40-46](src/components/moves/SetsView.jsx:40),
  [src/components/moves/WIPPage.jsx:86-91](src/components/moves/WIPPage.jsx:86).
  Opens the SetDetailModal for a specific set from a search result.
  No practice loop.

ComboMachine and MusicFlow reference "FlashCards" only in style
comments ([src/components/train/ComboMachine.jsx:529,547,585](src/components/train/ComboMachine.jsx:529),
[src/components/train/MusicFlow.jsx:124](src/components/train/MusicFlow.jsx:124));
neither consumes sets.

**Conclusion:** FlashCards is the only Set-driven practice surface in
the deployed app. Every other `setIds` reference is tagging,
planning, or CRUD.

---

## 2. FlashCards specifically

Full read of [src/components/moves/FlashCards.jsx](src/components/moves/FlashCards.jsx)
(372 lines).

**Per-card state ([FlashCards.jsx:56-58](src/components/moves/FlashCards.jsx:56)):**

```js
const newResults = [...results, { setId: deck[cardIndex].id, gotIt }];
```

Only two fields per card: the `setId` and a boolean `gotIt`. There is
no rep count, no per-move attribution, no timing — just pass/fail at
the *set* level.

**Per-session state — what's written at end of session
([FlashCards.jsx:64-86](src/components/moves/FlashCards.jsx:64)):**

1. **`mb_flashcards` slice** — when the session beats the prior best,
   updates `flashcards.bestScore = { percentage, total, correct, date }`
   ([FlashCards.jsx:70-75](src/components/moves/FlashCards.jsx:70)).
   The slice is owned by App.jsx
   ([src/App.jsx:166-167](src/App.jsx:166)) and persisted to
   `localStorage.mb_flashcards`
   ([src/App.jsx:290](src/App.jsx:290)).

2. **One calendar event** — `addCalendarEvent` with
   `type: "flashcards"`, `source: "flashcards"`, a `score` object, and
   bundled `setIds` + flattened `moveIds` from every card in the deck
   ([FlashCards.jsx:77-86](src/components/moves/FlashCards.jsx:77)):
   ```js
   addCalendarEvent({
     source: "flashcards",
     date: todayLocal(),
     title: `Flash Cards · ${correct}/${total}`,
     type: "flashcards",
     score: { percentage, total, correct },
     setId: deck[0].id,
     setIds: deck.map(s => s.id),
     moveIds: [...new Set(deck.flatMap(s => s.moveIds || []))],
   });
   ```

**Does FlashCards write to `trainingLog`?** **No.** No
`appendTrainingEntry`, no `setEventTraining`, no direct mutation of
any move's `trainingLog`. A grep of FlashCards.jsx for `trainingLog`
returns zero matches. The calendar event captures which moves were
*in the deck*, but the moves' own `trainingLog` arrays are untouched.

**Does FlashCards have any concept of "reps per move"?** **No.** The
unit of interaction is the *set card* (the user is being tested on
whether they remember the set's contents). There is no UI for "I did
this move 5 times," no timer per move, no execution capture. The only
signal is `gotIt: true | false` per set card.

**Conclusion:** FlashCards is a recall / memorization game over Set
*composition*, not a rep-capturing practice surface. It writes one
calendar event + an `mb_flashcards.bestScore` field. It has zero
per-move rep semantics.

---

## 3. Other Sets practice surfaces

Per §1, there are no other Set-driven practice surfaces. The closest
neighbours and how they handle the rep question:

- **LogTodayTraining picked-sets row**
  ([LogTodayTraining.jsx:245-281](src/components/logToday/LogTodayTraining.jsx:245)).
  Each picked set is rendered as a name + move-count tile. **There
  is no per-move stepper inside the set row** — contrast with the
  per-pickedMove `+`/`-` stepper at
  [LogTodayTraining.jsx:197-230](src/components/logToday/LogTodayTraining.jsx:197).
  At save, set-derived moves are flattened into `allMoveIdsToMark`
  and passed to `recordEventTraining(record.id, allMoveIdsToMark,
  record.date, pendingMoveReps)`
  ([LogTodayTraining.jsx:95-99, 127-128](src/components/logToday/LogTodayTraining.jsx:95));
  because the user never typed reps for set-derived moves, they fall
  through `counts[id] || 0`
  ([src/App.jsx:1075](src/App.jsx:1075)) and are written with
  `count: 0` and `source: 'log_today'`.

- **SessionJournal**
  ([SessionJournal.jsx:108-132](src/components/calendar/SessionJournal.jsx:108),
  [DaySections.jsx:67-75](src/components/home/DaySections.jsx:67)).
  Picked sets are saved on the event as `setIds`; only `moveIds` are
  passed to `setEventTraining` with `count: 0` and
  `source: 'session_journal'` — set-derived moves are not flattened
  in at all here. Again, no per-move rep capture.

- **BattlePrepSetup**, **SetsView**, **SetDetailModal** — no practice
  loop, no rep capture.

**Conclusion:** Nothing outside FlashCards qualifies as Set practice.
Adjacent surfaces that *could* capture per-move reps via a Set
(LogToday) deliberately stop at the set name and write `count: 0` for
the expanded moves.

---

## 4. Set schema

Set initial state lives in App.jsx and is hydrated from
`localStorage.mb_sets` ([src/App.jsx:110-116](src/App.jsx:110)). New
sets are created in SetsView with `{ id: Date.now(), ...fields }`
([SetsView.jsx:359](src/components/moves/SetsView.jsx:359)). Fields
are sourced from SetDetailModal's save handler
([SetDetailModal.jsx:42-47](src/components/moves/SetDetailModal.jsx:42)):

```js
const extra = isSet ? { moveIds: localIds } : { setIds: localIds };
onSave({ name: name.trim(), color, link: ensureHttps(link.trim()),
         mastery, notes: notes.trim(), details: details.trim(),
         date, ...extra });
```

Example Set object:

```js
{
  id: 1747555201234,    // Date.now() at creation; preserved on edit
  name: "Opening Set",  // required, trimmed
  color: "#3B82F6",     // hex from PRESET_COLORS, default PRESET_COLORS[1]
  link: "https://…",    // optional URL, normalized via ensureHttps
  mastery: 50,          // 0-100, user-driven slider (SetDetailModal.jsx:230-249)
  notes: "",            // present in initial item but locked to "" in modal
                        //   (SetDetailModal.jsx:32 is read-only useState)
  details: "Style…",    // free-text description (SetDetailModal.jsx:74-81)
  date: "2026-05-18",   // YYYY-MM-DD, defaults to todayLocal()
  moveIds: [12, 7, 9],  // ordered list of move ids — DnD-reorderable
}
```

**Move-list field name:** `moveIds: number[]`. Confirmed at
[SetDetailModal.jsx:34](src/components/moves/SetDetailModal.jsx:34)
(`item.moveIds||[]`), [SetDetailModal.jsx:44](src/components/moves/SetDetailModal.jsx:44)
(`{ moveIds: localIds }`), and every consumer
(e.g. [FlashCards.jsx:24,84,85,106](src/components/moves/FlashCards.jsx:24);
[SetsView.jsx:74,173,180,236,313](src/components/moves/SetsView.jsx:74);
[LogTodayTraining.jsx:97,250](src/components/logToday/LogTodayTraining.jsx:97)).
The #263 investigation note agrees with the current code.

**Practice-related fields on the Set itself:**

- `mastery` — **maintained, but user-driven only.** A slider in
  SetDetailModal
  ([SetDetailModal.jsx:230-249](src/components/moves/SetDetailModal.jsx:230)).
  Nothing in the codebase writes set mastery automatically — grep for
  `set.mastery =` / `s.mastery =` / `mastery:` writes confirms no
  auto-update from FlashCards or anywhere else.
- `practiceCount`, `lastPracticedAt`, `bestScore` on the Set — **do
  not exist.** `bestScore` exists, but on the **`mb_flashcards`
  slice**, not on the Set
  ([App.jsx:166-167](src/App.jsx:166),
  [FlashCards.jsx:34,70-75](src/components/moves/FlashCards.jsx:34)).
  There is one `bestScore` for the whole flashcards game, not
  per-set.
- `notes` — declared in SetDetailModal but the setter is destructured
  away (`const [notes] = useState(...)` at
  [SetDetailModal.jsx:32](src/components/moves/SetDetailModal.jsx:32))
  with no UI to edit. It will persist whatever the initial value was;
  effectively vestigial in the edit path.

**Conclusion:** Sets carry no native practice telemetry. They have a
user-driven `mastery` slider, a vestigial `notes` field, and an
ordered `moveIds: number[]`. Practice tracking, where it exists at
all, lives on the calendar event (FlashCards score) or on each move
individually (`trainingLog`).

---

## 5. trainingLog schema and write helper

Helper module: [src/utils/trainingLog.js](src/utils/trainingLog.js).
All other modules read/write via these helpers.

**Entry shape** (per
[trainingLog.js:3](src/utils/trainingLog.js:3) docblock and confirmed
by every call site):

```js
{
  date: "YYYY-MM-DD",   // required — local date string;
                        //   lexicographic max == chronological
                        //   (trainingLog.js:18)
  count: number,        // required — reps performed (0 is valid;
                        //   sparring/session_journal use 0 as a
                        //   "tagged but no rep count" marker)
  source: string,       // required — one of 'manual', 'drill',
                        //   'sparring', 'log_today', 'session_journal'
                        //   (see call sites below)
  sourceId?: any,       // optional — present iff the entry is upserted
                        //   by a calendar event (Log Today,
                        //   SessionJournal). Used as the dedup key in
                        //   setEventTraining()
                        //   (trainingLog.js:64-80)
}
```

There are no defaults inside the helpers — the caller must supply
`date`, `count`, and `source`. The reducer at
[MoveModal.jsx:91](src/components/moves/MoveModal.jsx:91) sums
`entry.count`, so `count` must be a finite number (treating absent as
0 would silently truncate).

**Write helpers:**

- `appendTrainingEntry(moves, moveId, entry)` —
  [trainingLog.js:49-55](src/utils/trainingLog.js:49). Plain append.
  Used for sources that don't have a parent event id to upsert
  against. (The docblock at
  [trainingLog.js:47](src/utils/trainingLog.js:47) mentions "GAP
  quick-mark" — that surface no longer writes; GAPTab is read-only
  via `lastActivityDate`, [GAPTab.jsx:9](src/components/moves/GAPTab.jsx:9).
  Minor stale comment, not load-bearing.)
- `setEventTraining(moves, { eventId, moveIds, date, source, count })`
  — [trainingLog.js:64-80](src/utils/trainingLog.js:64). Upsert keyed
  by `sourceId === eventId`. Every move in `moveIds` gets (or has
  replaced) its entry for this event; any move previously tagged by
  this event but no longer in `moveIds` has its entry dropped.
  `count` may be a number or `(moveId) => number`.
- `removeEventTraining(moves, eventId)` —
  [trainingLog.js:86-92](src/utils/trainingLog.js:86). Drops every
  entry tied to an event id. Called when a calendar event is deleted.

**Every existing call site that writes to trainingLog:**

| Source            | Call site                                                                                       | Trigger                                                                                                                                | What `count` represents                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `manual`          | [MoveModal.jsx:56-58](src/components/moves/MoveModal.jsx:56)                                    | User taps `+`/`−` on the manual reps stepper in Edit Move and hits Save while `manualDelta > 0`.                                       | The typed delta — reps the user is attributing to *today* manually.                                |
| `drill`           | [App.jsx:1311](src/App.jsx:1311) (RepCounter `onSaveSession`)                                   | User finishes a RepCounter session (the drill counter) and saves.                                                                      | `session.reps` — the live counter total from the drill session.                                    |
| `sparring`        | [App.jsx:1324](src/App.jsx:1324) (Sparring `onSaveSession`)                                     | User finishes a Sparring session and saves; one entry appended per move in `session.movesTrained`.                                     | `0` — sparring doesn't track per-move reps; the entry is a "this move was sparred today" marker.   |
| `log_today`       | [App.jsx:1071-1077](src/App.jsx:1071) (`recordEventTraining`) ← [LogTodayTraining.jsx:127-128](src/components/logToday/LogTodayTraining.jsx:127) | User saves a Log Today training entry; upsert keyed by the calendar event id.                                                          | `counts[moveId] || 0` — per-move stepper value; **set-derived moves default to 0** ([App.jsx:1075](src/App.jsx:1075)). |
| `session_journal` | [DaySections.jsx:67-75](src/components/home/DaySections.jsx:67)                                 | User saves an event from the SessionJournal modal with `type: "training"`.                                                             | `0` — no per-move rep input in SessionJournal.                                                     |

(Note the prompt listed four sources — `manual`, `drill`, `sparring`,
`log_today`. The deployed code has a fifth: `session_journal`, added
via DaySections. Flagging the discrepancy per the working principles.)

**Conclusion:** When `source: 'sets'` is added, the existing pattern
is clear:
- if the write is tied to a single one-shot Set practice session →
  `appendTrainingEntry(moves, moveId, { date, count, source: 'sets' })`
  per move;
- if the write is tied to an editable parent record →
  `setEventTraining(moves, { eventId, moveIds, date, source: 'sets',
  count })` where `count` can be a per-move resolver.
The pattern to match is whichever model the chosen capture site
uses.

---

## 6. Existing rep-capture UX patterns

Where the app already lets a user *type* or *count* reps:

- **RepCounter "counting" screen** — [src/components/train/RepCounter.jsx:174-220](src/components/train/RepCounter.jsx:174).
  A giant tap-target counter screen. User selects one move, then taps
  to increment a single `count` while the timer runs; `−` and Reset
  also available; Done → SAVE saves `count` reps for that one move
  ([RepCounter.jsx:101-120](src/components/train/RepCounter.jsx:101)).
  Pattern: **dedicated drill loop, one move per session, live tap
  counter.**

- **MoveModal manual-reps stepper** — [src/components/moves/MoveModal.jsx:79](src/components/moves/MoveModal.jsx:79),
  [MoveModal.jsx:56-58](src/components/moves/MoveModal.jsx:56).
  Inside Edit Move, a `manualDelta` stepper (controlled by
  `setManualDelta`) lets the user nudge a number; on save, the delta
  is committed as one `trainingLog` entry with `source: 'manual'`.
  Pattern: **inline +/- stepper attached to an existing edit form.**

- **LogTodayTraining per-pickedMove stepper** — [src/components/logToday/LogTodayTraining.jsx:197-230](src/components/logToday/LogTodayTraining.jsx:197).
  Within the Log Today training entry, each individually-picked move
  has its own small `+`/`−` stepper next to its name. Per-move reps
  are restored on edit by reading the prior `trainingLog` entry for
  this event id
  ([LogTodayTraining.jsx:47-59](src/components/logToday/LogTodayTraining.jsx:47)).
  Pattern: **per-move steppers in a list, persisted via the parent
  event's upsert.**

**Conclusion:** Three established rep-capture patterns exist — the
dedicated counter (RepCounter), the modal-bound delta stepper
(MoveModal manual), and the per-row stepper in a list
(LogTodayTraining). Any "Sets practice with reps" UX would most
naturally borrow from #1 or #3.

---

## Bottom-line answer

**(B) Sets practice has no concept of per-move rep counts today.**

The only Set-driven practice surface is FlashCards, and FlashCards
captures `gotIt: boolean` at the *set* level — never reps, never even
per-move attribution. It writes one calendar event and a
`bestScore`; it does not touch `trainingLog` at all. Sets themselves
carry no per-move practice telemetry, and no other surface "practices"
a Set in any rep-emitting sense.

So #262 cannot ship as a one-shot wiring task. It needs a design
decision first:

- **Add rep-capture UX to a Set practice surface.** Either extend
  FlashCards (giving each card a per-move stepper or a "did this move
  N times" step on the back of the card), or introduce a new "drill
  this Set" surface modelled on RepCounter or the LogToday
  per-move-stepper pattern.
- **Or use a proxy** — e.g. treat each completed FlashCards card as
  `count: 1` per move in the set, writing one `setEventTraining` call
  keyed by the FlashCards calendar event id. This requires no new UX
  but the semantics are weak (a recall game ≠ reps practiced).

Recommended split: **(1) a short design step to pick the model and
the surface, then (2) a focused implementation prompt that wires the
chosen capture site to `trainingLog` with `source: 'sets'` using the
patterns documented in §5.**

---

## Open questions for the spec phase

- **What does `source: 'sets'` actually mean?** Reps physically
  performed (which FlashCards doesn't capture), or "this set was
  practiced today" tags (count: 0 per move, matching `sparring` /
  `session_journal`)? The answer dictates whether new UX is needed at
  all.
- **If extending FlashCards: is a rep-count step compatible with the
  game's recall-test purpose?** Adding a stepper to the back of each
  card changes the loop's character — worth a UX call before
  implementing.
- **If introducing a new "drill this Set" surface: where does it live
  and how is it launched?** SetsView already has FlashCards as the
  only call-to-action button. A second button would compete for the
  same slot.
- **Set mastery (currently user-driven only — §4) — should successful
  Set practice update it automatically?** Out of scope for #262 as
  stated, but related and worth noting before downstream work
  collides.
- **Stale doc comment**: [trainingLog.js:47](src/utils/trainingLog.js:47)
  mentions "GAP quick-mark" as a writer — that surface no longer
  writes. Cosmetic; not blocking #262.
