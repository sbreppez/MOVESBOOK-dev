# MovesBook — Loop Audit (2026-04)

Read-only audit of the four-tab loop:
**HOME (To-Do) → MOVES (Do) → BATTLE (Experiment) → REFLECT (Study) → HOME**

Goal: identify which handoffs between tabs are real coded mechanisms,
which are partial, and which are missing. No code modifications.

Architecture note: state for all tabs is lifted to `src/App.jsx` and
persisted via per-key `useEffect` writes to `localStorage` (App.jsx
L246-L278). Inter-tab "communication" is therefore implicit — two tabs
"connect" if they read/write the same lifted state via setter props or
via an `addCalendarEvent`-style callback.

---

## 1. Tab / Sub-Tab Tree

Top-level entry: [src/App.jsx](../src/App.jsx).
Tab routing: App.jsx L739-L742, conditional render keyed on `tab` state.
Tab labels and bottom bar: App.jsx L851-L880.

```
HOME  (tab="home")            → src/components/home/HomePage.jsx
  └─ Single screen — no sub-tabs
     - WeekStrip (date selector)            src/components/home/WeekStrip.jsx
     - Tile list for selected date          src/components/home/HomeTile.jsx
     - HomeAddPicker (+ button)             src/components/home/HomeAddPicker.jsx
     - PreSessionIntel banner               src/components/home/PreSessionIntel.jsx
     - Modals: RoutineForm, IdeaForm,
       GoalModal, TargetGoalModal,
       HabitModal, MoveModal               (mixed: home/, train/, moves/)

MOVES (tab="moves")           → src/components/moves/WIPPage.jsx
  └─ VocabTabBar (WIPPage L253) — sub-tabs:
     ├─ "moves" (default)                   AllMovesView | CategoryGrid | MoveTree | SearchResultsView | CategoryDetailView (when openCat)
     ├─ "sets"                              src/components/moves/SetsView.jsx
     └─ "gap" (premium)                     src/components/moves/GAPTab.jsx

BATTLE (tab="battle")         → src/components/battle/ReadyPage.jsx
  └─ ReadyPage L29 battleTab state — sub-tabs:
     ├─ "plan"      (default)               inline PlanView (ReadyPage L678) + EditRoundView
     ├─ "prep"      (premium)               src/components/train/BattlePrepPage.jsx
     ├─ "freestyle"                         src/components/battle/FreestylePage.jsx
     └─ "rivals"    (premium)               src/components/battle/RivalsPage.jsx
  Overlays opened from App.jsx (NOT sub-tabs):
     - Sparring                             src/components/train/Sparring.jsx
     - CompetitionSimulator                 src/components/battle/CompetitionSimulator.jsx
     - RepCounter                           src/components/train/RepCounter.jsx
     - MusicFlow                            src/components/train/MusicFlow.jsx
     - ComboMachine, FlowMap, Lab, RRR,
       FlashCards (premium "tools")         src/components/moves/* + train/*

REFLECT (tab="reflect")       → src/components/reflect/ReflectPage.jsx
  └─ ReflectPage L137 subTabs — 4 sub-tabs:
     ├─ "calendar" (default)                src/components/calendar/CalendarOverlay.jsx (inline)
     │     └─ ReportsTimeline               src/components/calendar/ReportsTimeline.jsx (CalendarOverlay L872)
     │     └─ SessionJournal                src/components/calendar/SessionJournal.jsx
     │     └─ BattleResultDetail            src/components/reflect/BattleResultDetail.jsx
     │     └─ BattlePrepArcSummary          src/components/reflect/BattlePrepArcSummary.jsx
     ├─ "stance"   (premium)                src/components/stance/MyStanceSection.jsx
     │     └─ DevelopmentStory              src/components/stance/DevelopmentStory.jsx
     │     └─ StanceRadarChart              src/components/stance/StanceRadarChart.jsx
     │     └─ MyStanceAssessment overlay    src/components/stance/MyStanceAssessment.jsx (App-level, App.jsx L810)
     ├─ "goals"                             inline `renderIdeasList("goals")` (ReflectPage L139)
     │     └─ IdeaTile                      src/components/train/IdeaTile.jsx
     │     └─ TypeChooserSheet              src/components/train/TypeChooserSheet.jsx
     │     └─ Goal/Target/Note modals       src/components/train/{GoalModal,TargetGoalModal,NoteModal}.jsx
     └─ "notes"                             inline `renderIdeasList("notes")` (ReflectPage L260)
           └─ Injury History accordion      inline (ReflectPage L264-L317)
```

**Dead source files** (not imported by any live render path):
[src/components/train/IdeasPage.jsx](../src/components/train/IdeasPage.jsx)
and
[src/components/train/HabitsPage.jsx](../src/components/train/HabitsPage.jsx)
— vestigial from before HOME absorbed their UI. Verified by grep: only
`IdeasPage` itself imports `HabitsPage`; nothing imports `IdeasPage`
under live `src/`.

---

## 2. REFLECT Feature Inventory

| Surface | File (rendered at) | Reads from | Writes / Side effects |
|---|---|---|---|
| Sub-tab nav | ReflectPage.jsx L219-L231 | local `reflectTab` state | local state; notifies App via `onSubTabChange` |
| CALENDAR pane | calendar/CalendarOverlay.jsx (ReflectPage L236) | props: `moves, reps, sparring, musicflow, habits, ideas, sets, calendar, cats, catColors, settings, battleprep, reports, isPremium` | `setCalendar`, `addCalendarEvent`, `removeCalendarEvent`, `setIdeas`, `setMoves`, `onGoToPrep` (cross-tab nav to BATTLE PREP) |
| Reports timeline | calendar/ReportsTimeline.jsx (CalendarOverlay L872) | props: `moves, reps, sparring, musicflow, calendar, cats, catColors, battleprep, rivals, reports` | display only; `onSelectDay` callback |
| Session journal | calendar/SessionJournal.jsx | props: session-day data from calendar | day journal entries (writes back through CalendarOverlay) |
| Battle result detail | reflect/BattleResultDetail.jsx | calendar event payload | display only |
| Battle prep arc summary | reflect/BattlePrepArcSummary.jsx | `battleprep` plan/history | display only |
| STANCE pane | stance/MyStanceSection.jsx (ReflectPage L253) | `moves, stance, sparring, calendar` | opens `MyStanceAssessment` overlay (writes `stance` via `setStance` in App.jsx L810) |
| Stance radar | stance/StanceRadarChart.jsx (inside MyStanceSection) | `stance` | display only |
| Development story | stance/DevelopmentStory.jsx (ReflectPage L254) | `moves, sparring, calendar` | display only |
| GOALS pane | inline `renderIdeasList("goals")` (ReflectPage L139, L259) | `ideas` (filtered `i.type==="goal"\|\|i.type==="target"`) | `setIdeas` (CRUD); `target.current` increment; `target.journal` append (L91-L98) |
| NOTES pane | inline `renderIdeasList("notes")` (ReflectPage L260) | `ideas` (filtered `i.type==="note"`) | `setIdeas` (CRUD) |
| Injury history accordion | inline (ReflectPage L264-L317) | `injuries` (resolved only) | display only |
| + button trigger | ReflectPage L63-L72 | local `reflectTab` to dispatch | opens `NoteModal` / `TypeChooserSheet` / `setShowStanceConfirm` / calendar add-tick |

LocalStorage keys consumed by REFLECT (read indirectly via App.jsx
state passed as props): `mb_moves, mb_reps, mb_sparring, mb_musicflow,
mb_habits, mb_ideas, mb_sets, mb_calendar, mb_stance, mb_battleprep,
mb_reports, mb_injuries, mb_rivals` (defined App.jsx L64-L228).

---

## 3. Loop Handoff Status

| Arrow | Status | Mechanism |
|---|---|---|
| 1. HOME → MOVES | **PARTIAL** | HOME tiles can reference moves by ID (`moveUpdate` tile type) and write journal entries to a move; no nav into the MOVES tab itself; no goal/routine/habit "linkedMoveId" field |
| 2. MOVES → BATTLE | **EXISTS** | BATTLE rounds, freestyle, prep, and overlay sessions read the global `moves`/`sets` arrays via props; round entries store `{type, refId}` move IDs |
| 3. BATTLE → REFLECT | **EXISTS (data) / PARTIAL (reflection)** | All BATTLE session writes (`reps`, `sparring`, `musicflow`, `battleprep`, calendar events) flow through App-level state and are read by REFLECT; the post-session prompt does NOT write to any REFLECT-consumed store |
| 4. REFLECT → HOME | **MISSING** | REFLECT can write to the shared `ideas` store, but cannot create HOME tiles, routines, or habits — no setHomeStack/setHomeIdeas/setHomeChecks/setHabits writes from any reflect/, calendar/, or stance/ component |

### Arrow 1 — HOME → MOVES — PARTIAL

HOME has a dedicated `moveUpdate` tile type that links a HOME tile to a
specific move and lets the user append journal entries to that move
without leaving HOME. There is no navigation from HOME into the MOVES
tab, and goal/routine/habit/idea schemas do not store move/set/category
references.

Evidence:
- [HomePage.jsx:722](../src/components/home/HomePage.jsx) — creates
  `moveUpdate` tile in homeStack referencing `moveId`:
  `setHomeStack(prev => ({ ...prev, defaultStack: [{ id: tileId, type: "moveUpdate", moveId: m.id }, ...prev.defaultStack] }));`
- [HomePage.jsx:319](../src/components/home/HomePage.jsx) — resolves
  the linked move by ID at edit time:
  `const move = moves?.find(m => m.id === tile.moveId);`
- [HomePage.jsx:1060-L1063](../src/components/home/HomePage.jsx) —
  appends journal entries directly into the global `moves[].journal`
  via `setMoves(... { ...m, journal: [entry, ...] })`.
- [HomeTile.jsx](../src/components/home/HomeTile.jsx) — renders the
  linked move's name + latest journal entry on the HOME tile.
- No `setTab("moves")` call exists anywhere in `src/components/home/`.
- No `linkedMoveId` / `linkedSetId` / `category` field appears in
  [IdeaForm.jsx](../src/components/home/IdeaForm.jsx),
  [RoutineForm.jsx](../src/components/home/RoutineForm.jsx), or in
  [GoalModal.jsx](../src/components/train/GoalModal.jsx) /
  [HabitModal.jsx](../src/components/train/HabitModal.jsx). Only the
  `target` idea type has `autoLink` (ReflectPage.jsx:81), which auto-
  pulls `mb_moves.length` into `idea.current`.

### Arrow 2 — MOVES → BATTLE — EXISTS

BATTLE features read the global `moves`/`sets` arrays directly. There
is no duplicated move state in `battle/` or `train/`.

Evidence:
- [App.jsx:741](../src/App.jsx) — passes `moves`, `sets` (and the
  full set CRUD) into `<ReadyPage>`.
- [ReadyPage.jsx:131](../src/components/battle/ReadyPage.jsx) —
  `const getMove = id => moves.find(m => m.id === id);`
  Used by EditRoundView and the inline PlanView for tension visuals.
- [EditRoundView.jsx](../src/components/battle/EditRoundView.jsx) —
  round entries store `{type, refId}` and resolve to a move/set at
  render via `getMove(item.refId)`.
- [FreestylePage.jsx](../src/components/battle/FreestylePage.jsx) —
  picks moves directly from `moves` prop.
- [BattlePrepPage.jsx](../src/components/train/BattlePrepPage.jsx) —
  reads `moves`, `sets` from props.
- App.jsx also wires `setSets` from BATTLE: tools like
  [ComboMachine.jsx](../src/components/train/ComboMachine.jsx) and
  [FlowMap.jsx](../src/components/battle/FlowMap.jsx) `onSaveSet`
  write into the global `sets` array (App.jsx L777, L801) — so the
  arrow is bidirectional for sets/moves creation from tools.

### Arrow 3 — BATTLE → REFLECT — EXISTS (data) / PARTIAL (reflection)

Session data flows from BATTLE/overlay sessions into the global state
that REFLECT reads. The "post-session reflection" prompt fires after
RepCounter/Sparring/MusicFlow but writes only to HOME's `presession`
state — there is no per-session reflection note that REFLECT consumes.

Evidence (data flow):
- [App.jsx:746-L754](../src/App.jsx) — `RepCounter.onSaveSession`:
  `setReps(prev=>[session,...prev])`, `setMoves(...)` to bump trained
  date, then on close fires `setShowPostSessionPrompt(true)` if
  premium.
- [App.jsx:756-L767](../src/App.jsx) — `Sparring.onSaveSession`:
  `setSparring(updatedSparring)`, `setMoves(...)`, then post-session
  prompt.
- [App.jsx:768-L774](../src/App.jsx) —
  `CompetitionSimulator.onSaveSession`: `setSparring(...)`.
- [App.jsx:804-L808](../src/App.jsx) — `MusicFlow` writes
  `setMusicflow(...)` and fires post-session prompt on close.
- BATTLE features pass `addCalendarEvent` callback (App.jsx defines
  it; passed through ReadyPage L741, RepCounter L753, Sparring L765,
  CompSim L773, MusicFlow L807) → all BATTLE/overlay sessions append
  events into the global `calendar.events`.
- REFLECT receives all of these via props at
  [ReflectPage.jsx:18-L25](../src/components/reflect/ReflectPage.jsx)
  (`reps, sparring, musicflow, calendar, battleprep, rivals, reports,
  injuries`), which CalendarOverlay/ReportsTimeline/Stance render.

Evidence (PARTIAL — post-session reflection):
- [App.jsx:809](../src/App.jsx) renders
  `<PostSessionPrompt presession setPresession ...>`. PostSessionPrompt
  writes only to the `presession` object (HOME's pre-session intel),
  not to anything REFLECT renders.
- The `mb_reflections` key (App.jsx:168) is `{lastCategory, lastDate}`
  — UI prompt-cooldown state, not a reflection content store.

### Arrow 4 — REFLECT → HOME — MISSING

REFLECT can mutate the shared `ideas` store (which HOME also reads),
but it cannot create HOME tiles, routines, or habits. A goal or note
created in REFLECT exists in `ideas` but is invisible on HOME because
HOME only shows ideas that have a corresponding tile entry in
`homeStack.defaultStack`.

Evidence (REFLECT prop signature lacks HOME setters):
- [ReflectPage.jsx:18-L25](../src/components/reflect/ReflectPage.jsx)
  receives `ideas, setIdeas, ..., habits, ..., calendar, setCalendar,
  ..., stance, battleprep, ...` — but does NOT receive `setHomeStack`,
  `setHomeIdeas`, `setHomeChecks`, or `setHabits`.
- App.jsx:742 confirms this — only `ideas, setIdeas` and read-only
  `habits` (no `setHabits`) are passed to ReflectPage.

Evidence (no writes to HOME-only stores from REFLECT/calendar/stance):
- Grep across `src/components/{reflect,calendar,stance}/` for
  `setHomeStack` / `setHomeIdeas` / `setHomeChecks` / `setHabits` /
  `mb_home_stack` / `mb_home_ideas` / `mb_home_checks` / `mb_habits`
  → **zero matches**.
- Grep for `pinnedHome` in REFLECT: only
  [ReflectPage.jsx:99](../src/components/reflect/ReflectPage.jsx) — and
  that only RESETS `pinnedHome:false` on idea duplication. The HOME-
  side pin toggle lives in
  [HomePage.jsx:240-L242](../src/components/home/HomePage.jsx) and is
  unreachable from REFLECT.
- Grep for `setTab("home")` in `src/components/{reflect,calendar,stance}/`
  → **zero matches**. (The reverse exists: REFLECT calls
  `onGoToPrep` which is `(seed)=>{setBattlePrepSeed(seed);setTab("battle");}`
  at [App.jsx:742](../src/App.jsx), so REFLECT → BATTLE nav is wired,
  but REFLECT → HOME is not.)
- No "Add to HOME", "Pin to HOME", "Make a Routine", "Add Habit", or
  similar button strings exist in
  [reflect/](../src/components/reflect/),
  [calendar/](../src/components/calendar/), or
  [stance/](../src/components/stance/).

Evidence (asymmetry of the shared `ideas` store):
- HOME-side goal/note creation writes to BOTH `ideas` and `homeStack`
  in one step:
  - [HomePage.jsx:513-L527](../src/components/home/HomePage.jsx) —
    `handleCreateIdea` (notes): `setIdeas(...)` + `setHomeStack(...)`
    with a `note` tile.
  - [HomePage.jsx:530-L535](../src/components/home/HomePage.jsx) —
    `handleCreateGoal`: `setIdeas(...)` + `setHomeStack(...)` with a
    `goalhabit` tile.
  - [HomePage.jsx:537-L542](../src/components/home/HomePage.jsx) —
    `handleCreateHabit`: `setHabits(...)` + `setHomeStack(...)`.
- REFLECT-side creation writes only to `ideas`:
  - [ReflectPage.jsx:85](../src/components/reflect/ReflectPage.jsx) —
    `addIdea = (fields) => setIdeas(p => [...p, { id: Date.now(), ...fields }]);`
    No homeStack mutation.
- Net effect: a goal created in REFLECT will appear in REFLECT > GOALS
  but not on HOME until the user manually creates an equivalent tile
  from HOME.

---

## 4. Tension Points

### 4.1 Goals

- **Schema:** entries in the `ideas` array discriminated by
  `type === "goal"` or `type === "target"`. Persisted under `mb_ideas`
  (App.jsx:123).
- **Create UI:**
  - HOME — [HomePage.jsx:530-L535](../src/components/home/HomePage.jsx)
    `handleCreateGoal`, opened via
    [HomeAddPicker.jsx](../src/components/home/HomeAddPicker.jsx) →
    [GoalModal.jsx](../src/components/train/GoalModal.jsx) /
    [TargetGoalModal.jsx](../src/components/train/TargetGoalModal.jsx).
    Writes BOTH `ideas` AND a `goalhabit` tile in `homeStack`.
  - REFLECT — [ReflectPage.jsx:65-L67](../src/components/reflect/ReflectPage.jsx)
    `+` on GOALS sub-tab opens TypeChooser → GoalModal/TargetGoalModal,
    `addIdea` writes ONLY `ideas`.
- **View UI:**
  - HOME — `goalhabit` tile via [HomeTile.jsx](../src/components/home/HomeTile.jsx),
    resolved by `refId` against `ideas` ([HomePage.jsx:67-L70](../src/components/home/HomePage.jsx)).
  - REFLECT — GOALS sub-tab list ([ReflectPage.jsx:131](../src/components/reflect/ReflectPage.jsx)):
    `ideas.filter(i => i.type === "goal" || i.type === "target")`.
- **Source of truth:** **one** (`ideas`), but **two creators** with
  asymmetric tile-side-effects → goals created in REFLECT are not
  surfaced on HOME.

### 4.2 Habits

- **Schema:** separate `habits` array (with `checkIns` date-stamps).
  Persisted under `mb_habits` (App.jsx:109).
- **Create UI:** **HOME only** —
  [HomePage.jsx:537-L542](../src/components/home/HomePage.jsx)
  `handleCreateHabit` writes BOTH `habits` and a `goalhabit` tile.
- **View UI:** **HOME only** — `goalhabit` tile resolves habit by
  `refId` ([HomePage.jsx:67-L68](../src/components/home/HomePage.jsx));
  daily check writes `habits[i].checkIns`
  ([HomePage.jsx:183-L191](../src/components/home/HomePage.jsx)).
  REFLECT receives `habits` as a prop ([ReflectPage.jsx:19](../src/components/reflect/ReflectPage.jsx))
  but never reads or writes it. CalendarOverlay does receive `habits`
  but only as input to past-day rendering (it does not allow editing
  habit data).
- **Source of truth:** **one** (`habits`), single creator (HOME),
  no REFLECT-side authoring path.
- **Dead code:** [train/HabitsPage.jsx](../src/components/train/HabitsPage.jsx)
  contains a full habits CRUD UI but is only imported by the equally-
  dead [train/IdeasPage.jsx](../src/components/train/IdeasPage.jsx).

### 4.3 Calendar

- **Schema:** `calendar.events` array (event objects with `date, type,
  source, …`). Persisted under `mb_calendar` (App.jsx:156).
- **Writers** (via `addCalendarEvent` callback or direct `setCalendar`):
  - HOME routines — [HomePage.jsx:222-L230](../src/components/home/HomePage.jsx) (`source:"home-routine"`).
  - HOME idea/note showDate —
    [HomePage.jsx:393-L401](../src/components/home/HomePage.jsx),
    [HomePage.jsx:412-L420](../src/components/home/HomePage.jsx),
    [HomePage.jsx:517-L526](../src/components/home/HomePage.jsx)
    (`source:"home-idea"`).
  - BATTLE: RepCounter / Sparring / CompSim / MusicFlow / ComboMachine
    / Lab / RRR / FlashCards / FlowMap — each receives
    `addCalendarEvent` from App.jsx (L753, L765, L773, L778, L787,
    L791, L795, L807).
  - BATTLE PREP — [BattlePrepPage.jsx](../src/components/train/BattlePrepPage.jsx)
    uses `addCalendarEvent`/`removeCalendarEvent` (passed in
    [ReadyPage.jsx:691](../src/components/battle/ReadyPage.jsx)).
  - REFLECT calendar — CalendarOverlay receives `setCalendar` directly
    ([ReflectPage.jsx:239](../src/components/reflect/ReflectPage.jsx))
    and is the only surface that can edit existing events.
- **Readers:**
  - REFLECT > CALENDAR — CalendarOverlay/ReportsTimeline/SessionJournal/
    BattleResultDetail/BattlePrepArcSummary.
  - REFLECT > STANCE — MyStanceSection and DevelopmentStory take
    `calendar` ([ReflectPage.jsx:253-L254](../src/components/reflect/ReflectPage.jsx)).
  - HOME — uses `calendar.events` to upsert routine completions
    ([HomePage.jsx:216-L219](../src/components/home/HomePage.jsx)).
- **Source of truth:** one (`calendar.events`); multi-writer; REFLECT
  is the only edit-existing surface.

### 4.4 Notes

- **Schema:** entries in the `ideas` array with `type === "note"`.
  Persisted under `mb_ideas`.
- **Create UI:**
  - HOME — [HomePage.jsx:513-L527](../src/components/home/HomePage.jsx)
    writes BOTH `ideas` AND a `note` tile in `homeStack`; if `showDate`
    is set, also writes a journal calendar event.
  - REFLECT — `+` on NOTES sub-tab opens NoteModal, `addIdea` writes
    ONLY `ideas` ([ReflectPage.jsx:65](../src/components/reflect/ReflectPage.jsx)).
- **View UI:**
  - HOME — `note` tile resolved by id against `ideas`
    ([HomePage.jsx:32-L36](../src/components/home/HomePage.jsx)).
  - REFLECT — NOTES sub-tab `ideas.filter(i => i.type === "note")`
    ([ReflectPage.jsx:132](../src/components/reflect/ReflectPage.jsx)).
- **Pin asymmetry:** `pinnedHome` (HOME)
  ([HomePage.jsx:240-L242](../src/components/home/HomePage.jsx)) and
  `pinnedNotes` (REFLECT)
  ([ReflectPage.jsx:121](../src/components/reflect/ReflectPage.jsx))
  are **two separate flags** on the same idea object — pinning in one
  surface has no effect on the other.
- **Source of truth:** one (`ideas`), two creators with the same
  asymmetry as goals — REFLECT-created notes are invisible on HOME.

---

## 5. Orphan Features in REFLECT

A REFLECT feature is "orphan" if it does not connect backward to BATTLE
(read or write) AND does not connect forward to HOME (write to a HOME-
surfaced store).

| Feature | Backward (BATTLE) | Forward (HOME) | Orphan? |
|---|---|---|---|
| CALENDAR pane | reads `reps/sparring/musicflow/battleprep` from BATTLE | writes `calendar` only; no HOME-tile creation | **Half-orphan** — wired backward; severed forward |
| ReportsTimeline | reads `reps/sparring/musicflow/battleprep/rivals` | display only | **Half-orphan** — wired backward; severed forward |
| BattleResultDetail | reads BATTLE session data | display only | **Half-orphan** |
| BattlePrepArcSummary | reads `battleprep` | display only | **Half-orphan** |
| STANCE pane (MyStanceSection + DevelopmentStory) | reads `moves/sparring/calendar` | display only; only writes back to `stance` itself | **ORPHAN** (wired backward but produces no actionable item for HOME — insights cannot become routines/habits/goals on HOME) |
| StanceRadarChart | reads `stance` | display only | **ORPHAN** (no HOME path) |
| GOALS pane (renderIdeasList) | doesn't read BATTLE data | writes `ideas` only; HOME doesn't surface REFLECT-created goals without manual tile add | **ORPHAN** for REFLECT-originated goals |
| Goal journal log + target increment | doesn't read BATTLE | writes `idea.journal`/`idea.current`; no HOME notification when target is hit | **ORPHAN** — completion is not visible on HOME |
| NOTES pane | doesn't read BATTLE | writes `ideas` only; REFLECT-created notes never become HOME tiles | **ORPHAN** for REFLECT-originated notes |
| Injury History accordion (NOTES) | doesn't read BATTLE | display only; resolved injuries do not feed HOME or routines | **ORPHAN** |

The recurring failure mode: REFLECT surfaces synthesize information
(stance, reports, journal entries, resolved injuries) but lack any
"surface this on HOME" action. The only forward-leaving arrow REFLECT
has today is REFLECT > CALENDAR > tap-on-future-battle → BATTLE > PREP
([App.jsx:742](../src/App.jsx) `onGoToPrep`), which is REFLECT → BATTLE,
not REFLECT → HOME.

---

## Summary

- **Loop status:** HOME → MOVES (PARTIAL), MOVES → BATTLE (EXISTS),
  BATTLE → REFLECT (EXISTS for data; PARTIAL for reflections),
  REFLECT → HOME (**MISSING**).
- **Critical gap:** Arrow 4. REFLECT can write to the shared `ideas`
  store, but cannot create HOME tiles, routines, or habits. There is
  no "Pin to HOME", "Make a Routine", "Add Habit", or cross-tab nav
  to HOME from any REFLECT/calendar/stance component.
- **Asymmetric pin model:** `pinnedHome` (HOME) and `pinnedNotes`
  (REFLECT) are independent flags on the same idea object.
- **Dead code worth flagging in a follow-up:** `train/IdeasPage.jsx`
  and `train/HabitsPage.jsx` are not imported by any live render path
  in `src/App.jsx` and look like leftovers from before HOME absorbed
  their UI.
