# User Text Storage Inventory — TextStream Migration Foundation

**Status:** Research only — Phase 0
**Generated:** 2026-05-09
**Branch:** v2
**Commit explored:** 2a7664b
**Purpose:** Enumerate every user-authored text field across MovesBook — canonical store, write sites, read sites, and current edit-history mechanism — as the foundation for an upcoming **canonical-plus-stream** migration. Existing canonical stores stay; a parallel append-only `TextStream` will enable cross-cutting reads (long-term look-back, Reports, Dev Story, shareable cards, search).

This dossier documents deployed reality only. It does not propose schemas, migration prompts, or design decisions beyond the recommendations explicitly requested in Section 5. It does not modify any source code.

---

## Section 0 — Architecture context

The target architecture (decided in chat, **not implemented in this prompt**):

- **Canonical stores** (already exist) stay as-is. Each is the source of truth for its own surface; user edits, deletes, and displays use the canonical record.
- **TextStream** (to be built later) is an append-only log with the schema: `{ id, source_type, source_id, source_label, text, created_at, superseded_at, superseded_by }`. Multiple entries per `(source_type, source_id)` are allowed. The `superseded_at`/`superseded_by` pair preserves edit history.

This inventory feeds migration order: every text-bearing canonical field must be enumerated before the migration plan can be drafted, and every UI write site must be enumerated because each will eventually be wrapped to also write to TextStream.

Citation density precedent: [docs/research/LogToday_v1_AutoCapture_Inventory.md](docs/research/LogToday_v1_AutoCapture_Inventory.md).

---

## Section 1 — Catalog of text-bearing canonical fields

Grouped by entity. For each field: schema shape, storage location, existing edit-history, write/read sites, associated translation keys (placeholder/helper only — not the user content), notes.

**Convention used throughout:** "translation keys" lists the i18n keys for *labels and placeholders* only. User-authored content is never passed through `t()` — see Concern 6 (Section 2).

### 1.1 — Move (`mb_moves[]`)

The Move record is the central artifact. Schema shape comes from [src/utils/storage.js:3–24](src/utils/storage.js:3) `migrateMove(m)`. Four user-text fields ride on it.

#### `move.name`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_moves"]` → array entry; Firestore `users/{uid}/moves` (registered at [src/App.jsx:294](src/App.jsx:294), synced at [src/App.jsx:329](src/App.jsx:329)) |
| Existing edit-history | None |
| Write sites | [src/components/moves/MoveModal.jsx:147](src/components/moves/MoveModal.jsx:147) (Inp); [src/hooks/useMoveCrud.js:10–16](src/hooks/useMoveCrud.js:10) `saveMove`; [src/hooks/useMoveCrud.js:50–53](src/hooks/useMoveCrud.js:50) `dupMove` (` + " (copy)"` suffix); [src/components/moves/BulkModal.jsx:18–20](src/components/moves/BulkModal.jsx:18) (parsed from textarea); [src/components/moves/Lab.jsx:269–284](src/components/moves/Lab.jsx:269) `handleSave` (field `name: saveName.trim() || …`); [src/components/battle/FlowMap.jsx:639](src/components/battle/FlowMap.jsx:639) (Flow Map "discovered" save path with name)|
| Read sites | Everywhere — [src/components/moves/MoveTile.jsx](src/components/moves/MoveTile.jsx), [src/components/calendar/CalendarOverlay.jsx](src/components/calendar/CalendarOverlay.jsx), [src/components/train/RepCounter.jsx:162](src/components/train/RepCounter.jsx:162), [src/components/moves/SetDetailModal.jsx:122](src/components/moves/SetDetailModal.jsx:122), [src/components/train/Sparring.jsx](src/components/train/Sparring.jsx), etc. (sample only — `move.name` is the most-read user-text field in the app) |
| Translation keys | `name`, `moveNamePlaceholder` (label/placeholder, not content) |
| Notes | Required — Save disabled when blank ([MoveModal.jsx:143](src/components/moves/MoveModal.jsx:143)). `dupMove` mutates the name with `" (copy)"` suffix — a derived write to flag during migration. Bulk import parses comma-or-newline-separated names into per-record writes ([BulkModal.jsx:18](src/components/moves/BulkModal.jsx:18)). |

#### `move.description`

| Aspect | Value |
|---|---|
| Schema shape | `string` (default `""`) |
| Storage location | Same record as `move.name` |
| Existing edit-history | None |
| Write sites | [src/components/moves/MoveModal.jsx:149](src/components/moves/MoveModal.jsx:149) (Txtarea); [src/components/moves/Lab.jsx:274](src/components/moves/Lab.jsx:274) `description: preview` (templated from selected chips, not free text — see Section 4); [src/components/battle/FlowMap.jsx:639](src/components/battle/FlowMap.jsx:639) `description: state === "interesting" ? t("discoveredInFlowMap") : ""` (translated literal — not user-authored) |
| Read sites | [src/components/home/HomePage.jsx:1176–1181](src/components/home/HomePage.jsx:1176) (rendered as context in Updates BottomSheet); [src/components/moves/MoveModal.jsx:149](src/components/moves/MoveModal.jsx:149) (re-displayed in edit) |
| Translation keys | `description`, `describeMove` |
| Notes | Multiline allowed (Txtarea autoExpand). `MoveModal` line 42 also receives `initialDesc` prefill from outer call sites. Lab.jsx's write is **template-generated chip preview text** (`buildPreview()`), not user-typed — flag in Section 4. |

#### `move.link`

| Aspect | Value |
|---|---|
| Schema shape | `string` (URL) |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/moves/MoveModal.jsx:154](src/components/moves/MoveModal.jsx:154) (raw `<input>`, not Inp helper) |
| Read sites | [src/components/moves/MoveModal.jsx:155](src/components/moves/MoveModal.jsx:155) (preview-link rendering) |
| Translation keys | `videoLink`, `videoLinkHint`, `openLink` |
| Notes | URL field. **Borderline for TextStream:** structural data, not narrative. Recommend exclude — see 5.2. |

#### `move.journal[]`

| Aspect | Value |
|---|---|
| Schema shape | `Array<{ id: number, date: string, text: string }>` (array of objects). Default `[]` per [storage.js:22](src/utils/storage.js:22) |
| Storage location | Same record |
| Existing edit-history | **Append-only by construction** — entries are prepended via `[entry, ...prev]` and individual entries can be deleted but not edited. The closest existing analog to a TextStream — but NOT a supersede pattern; deletes are hard. |
| Write sites | [src/components/moves/MoveModal.jsx:603–612](src/components/moves/MoveModal.jsx:603) (in-modal append; new entry shape `{ id: Date.now(), date: todayLocal(), text }`); [src/components/moves/MoveModal.jsx:635](src/components/moves/MoveModal.jsx:635) (delete entry); [src/components/home/HomePage.jsx:1206–1219](src/components/home/HomePage.jsx:1206) (HOME "Updates" BottomSheet — same shape, mutates `m.journal` directly via `setMoves`); [src/components/home/HomePage.jsx:1244–1249](src/components/home/HomePage.jsx:1244) (delete entry from HOME) |
| Read sites | [src/components/moves/MoveModal.jsx:629–646](src/components/moves/MoveModal.jsx:629); [src/components/home/HomePage.jsx:1232–1260](src/components/home/HomePage.jsx:1232) |
| Translation keys | `moveJournal`, `journalEntryPlaceholder`, `noJournalEntries`, `updatePlaceholder`, `updatesAlsoInEdit` |
| Notes | **Date format is `YYYY-MM-DD` only** (via `todayLocal()`) — within-day ordering not preserved, only insertion order in the array. Two distinct write surfaces (`MoveModal` "Move Journal" accordion + HOME "Updates" sheet) operate on the same field; both prepend, both expose delete. |

**Move-level deprecated fields (see Section 4):** `move.notes` — declared in [storage.js:11](src/utils/storage.js:11), no UI write site found.

---

### 1.2 — Goal (sub-entity in `mb_ideas[]`, `type:"goal"`)

Goals live inside the shared `ideas` array (`mb_ideas`) but their fields differ enough from notes/targets to warrant separate documentation. Created/edited via [src/components/train/GoalModal.jsx](src/components/train/GoalModal.jsx).

#### `idea.title` (goal flavor)

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_ideas"]` → array entry; Firestore `users/{uid}/ideas` ([App.jsx:298](src/App.jsx:298), synced [App.jsx:330](src/App.jsx:330)) |
| Existing edit-history | None (overwrite) |
| Write sites | [src/components/train/GoalModal.jsx:45](src/components/train/GoalModal.jsx:45) (handleSave) — title from `useState` at [GoalModal.jsx:34](src/components/train/GoalModal.jsx:34) |
| Read sites | [src/components/home/HomePage.jsx:67](src/components/home/HomePage.jsx:67) (resolveTileName); [src/components/reflect/ReflectPage.jsx:144](src/components/reflect/ReflectPage.jsx:144) (history rendering) |
| Translation keys | `goalTitleLabel`, `goalTitlePlaceholder` |
| Notes | Required — Save disabled when blank ([GoalModal.jsx:155](src/components/train/GoalModal.jsx:155)). Same `title` field is shared across goal/target/note variants of `ideas[]`. |

#### `idea.description` (goal flavor)

| Aspect | Value |
|---|---|
| Schema shape | `string` (multiline) |
| Storage location | Same record |
| Existing edit-history | None — but legacy fields (`why`, `steps[]`, `obstacles`) preserved on read; new edits collapse them into `description` via `buildLegacyDump(idea, t)` at [GoalModal.jsx:14–24](src/components/train/GoalModal.jsx:14) only on first edit (when `legacyMigrated !== true`) |
| Write sites | [src/components/train/GoalModal.jsx:46](src/components/train/GoalModal.jsx:46); via Txtarea at [GoalModal.jsx:127–128](src/components/train/GoalModal.jsx:127) |
| Read sites | [src/components/train/GoalModal.jsx:31](src/components/train/GoalModal.jsx:31) (`initialDescription` resolution) |
| Translation keys | `goalDescriptionLabel`, `goalDescriptionPlaceholder` |
| Notes | **Legacy migration path.** Goals predating the description field have `why` / `steps[]` / `obstacles` filled instead — first edit dumps them into `description` (literal English-translated headers via `t("legacyDumpWhy")` etc., interleaved with user content). After first save, `legacyMigrated:true` is set and legacy fields stop being read. **The legacy `why`/`steps[]`/`obstacles` fields may still exist on un-edited records** — see Section 4. |

#### `idea.link` (goal flavor)

| Aspect | Value |
|---|---|
| Schema shape | `string` (URL) |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/train/GoalModal.jsx:48](src/components/train/GoalModal.jsx:48) (`ensureHttps(link.trim())`) |
| Read sites | Same modal (preview link button) |
| Translation keys | `goalVideoRefLabel` |
| Notes | URL — exclude from TextStream (5.2). |

#### `idea.journal[]` (goal flavor)

| Aspect | Value |
|---|---|
| Schema shape | `Array<{ id: number, date: string, text: string, link?: string }>` |
| Storage location | Same record |
| Existing edit-history | **Hybrid.** Entries can be EDITED in place (overwriting `text`/`link`) via [JournalEntryCard.jsx:17](src/components/train/JournalEntryCard.jsx:17) `save()` — unlike `move.journal[]` which is delete-only. Also append-prepend and delete. |
| Write sites | [src/components/train/GoalModal.jsx:102](src/components/train/GoalModal.jsx:102) (append, via `JournalEntryInput` at [GoalModal.jsx:101–103](src/components/train/GoalModal.jsx:101)); [src/components/train/GoalModal.jsx:112](src/components/train/GoalModal.jsx:112) (in-place edit, via `JournalEntryCard.onUpdate`); [src/components/train/GoalModal.jsx:57](src/components/train/GoalModal.jsx:57) `deleteJournalEntry` |
| Read sites | [src/components/train/GoalModal.jsx:109–114](src/components/train/GoalModal.jsx:109) (list render); [src/components/calendar/CalendarOverlay.jsx:116](src/components/calendar/CalendarOverlay.jsx:116) (notesOnDay aggregation) |
| Translation keys | `journal`, `journalPlaceholder`, `todaysNote`, `videoRefLabel`, `addEntryBtn`, `videoRefLink` |
| Notes | **Date format is `toLocaleDateString("en-AU", { day:"2-digit", month:"short", year:"numeric" })`** — e.g. `"14 Mar 2026"` — set at [GoalModal.jsx:102](src/components/train/GoalModal.jsx:102) and [TargetGoalModal.jsx:84](src/components/train/TargetGoalModal.jsx:84). **This is a DIFFERENT format from `move.journal[].date` (which uses `todayLocal()` `YYYY-MM-DD`).** See Concern 1 (Section 2). The CalendarOverlay aggregator at [CalendarOverlay.jsx:116](src/components/calendar/CalendarOverlay.jsx:116) compensates with `toYMD()` but only because `toYMD` short-circuits already-day-keyed strings — it does not actually parse `"14 Mar 2026"` correctly (would return the string unchanged, breaking equality). The day-of-month grid filter therefore likely drops these entries entirely (see Section 4). |

**Goal legacy fields preserved on read:** `why` (string), `steps` (array of strings), `obstacles` (string). All three remain in storage on un-migrated records ([GoalModal.jsx:29–31](src/components/train/GoalModal.jsx:29)). No UI write site for these any more — they only convert TO `description` on edit.

---

### 1.3 — Target (sub-entity in `mb_ideas[]`, `type:"target"`)

Targets are a numeric-progress flavor of goal. Their text fields:

#### `idea.title` (target flavor)

Same schema and surfaces as goal `title`. Write site: [src/components/train/TargetGoalModal.jsx:32](src/components/train/TargetGoalModal.jsx:32). Translation: `targetTitleLabel`, `targetTitlePlaceholder`.

#### `idea.unit` (target flavor)

| Aspect | Value |
|---|---|
| Schema shape | `string` (e.g. "moves", "battles", "reps") |
| Storage location | Same `mb_ideas` record |
| Existing edit-history | None |
| Write sites | [src/components/train/TargetGoalModal.jsx:33](src/components/train/TargetGoalModal.jsx:33) (`unit:unit.trim()||"items"`) |
| Read sites | Target tile rendering (HomePage / IdeaForm helpers) |
| Translation keys | `targetUnitLabel`, `unitPlaceholder` |
| Notes | Single-token user-authored label (≤ 1 word typical). **Borderline** — short label data, not narrative. Recommend exclude (5.2). |

#### `idea.link` (target flavor)

URL — same shape as goal `link`. Write: [TargetGoalModal.jsx:34](src/components/train/TargetGoalModal.jsx:34). Exclude (5.2).

#### `idea.journal[]` (target flavor)

Identical schema and write surface to goal `idea.journal[]` — both use `JournalEntryInput` + `JournalEntryCard`. Write append: [TargetGoalModal.jsx:84](src/components/train/TargetGoalModal.jsx:84). Edit in-place: [TargetGoalModal.jsx:96](src/components/train/TargetGoalModal.jsx:96). Same date-format issue (see Concern 1).

---

### 1.4 — Note (sub-entity in `mb_ideas[]`, `type:"note"`)

#### `idea.title` (note flavor)

Same `mb_ideas` record. Write sites: [src/components/train/NoteModal.jsx:24](src/components/train/NoteModal.jsx:24); [src/components/home/IdeaForm.jsx:28](src/components/home/IdeaForm.jsx:28). Used in [src/components/home/HomePage.jsx:62](src/components/home/HomePage.jsx:62) (resolveTileName), [HomePage.jsx:480](src/components/home/HomePage.jsx:480) (mirrored to calendar event title on save with showDate). Translation: `title`, `noteTitle`, `ideaTitle`.

#### `idea.text` (note flavor)

| Aspect | Value |
|---|---|
| Schema shape | `string` (multiline; auto-expanding textarea) |
| Storage location | Same `mb_ideas` record |
| Existing edit-history | None — overwrite |
| Write sites | [src/components/train/NoteModal.jsx:24](src/components/train/NoteModal.jsx:24) `onSave`; [src/components/home/IdeaForm.jsx:29](src/components/home/IdeaForm.jsx:29) (used by HomePage create/edit at [HomePage.jsx:486](src/components/home/HomePage.jsx:486)); [src/components/reflect/ReflectPage.jsx:165](src/components/reflect/ReflectPage.jsx:165) (Add-to-Home note flow) |
| Read sites | [src/components/home/HomePage.jsx:62](src/components/home/HomePage.jsx:62) (resolveTileName fallback); [src/components/reflect/ReflectPage.jsx:150](src/components/reflect/ReflectPage.jsx:150) (history) |
| Translation keys | `description`, `describeIdea`, `noteHint` |
| Notes | When a note has a `showDate`, **a parallel calendar event is mirrored** with `text: fields.text` ([HomePage.jsx:481,486](src/components/home/HomePage.jsx:481), [HomePage.jsx:586](src/components/home/HomePage.jsx:586)). So `idea.text` and the corresponding `calendar.events[].text` (Section 1.7) end up as duplicate copies of the same user content. Edits to the note do NOT propagate to the calendar event ([HomePage.jsx:473](src/components/home/HomePage.jsx:473) explicitly TODOs this). |

#### `idea.link` (note flavor)

URL — same shape as other ideas. Write: [NoteModal.jsx:24](src/components/train/NoteModal.jsx:24); [IdeaForm.jsx:30](src/components/home/IdeaForm.jsx:30). Exclude (5.2).

---

### 1.5 — Habit (`mb_habits[]`)

Sync: localStorage write at [App.jsx:242](src/App.jsx:242) plus debounced Firestore save inline in same effect. (Note: habits use a custom 1500ms-debounced direct save rather than the `dbSave.current.habits` pattern used by everything else — habits are missing from the `dbSave.current` registry at [App.jsx:293–326](src/App.jsx:293).)

#### `habit.name`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_habits"]` array entry; Firestore `users/{uid}/habits` |
| Existing edit-history | None |
| Write sites | [src/components/train/HabitModal.jsx:105](src/components/train/HabitModal.jsx:105) `onSave({name:name.trim(), …})` |
| Read sites | [src/components/home/HomePage.jsx:65](src/components/home/HomePage.jsx:65) (resolveTileName); [src/components/calendar/CalendarOverlay.jsx:115](src/components/calendar/CalendarOverlay.jsx:115) (habits day query — name display) |
| Translation keys | `habitNameLabel`, `habitNamePlaceholder`, `habitTip` |
| Notes | Required — Save disabled when blank ([HabitModal.jsx:105](src/components/train/HabitModal.jsx:105)). |

#### `habit.why`

| Aspect | Value |
|---|---|
| Schema shape | `string` (single-line) |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/train/HabitModal.jsx:105](src/components/train/HabitModal.jsx:105) `why:why.trim()` (Inp at [HabitModal.jsx:48](src/components/train/HabitModal.jsx:48)) |
| Read sites | None active (`why` is captured but not displayed in any read surface inspected) — flag in Section 4 as orphan-read candidate |
| Translation keys | `whyHabitPlaceholder`, `whyOptional` |

#### `habit.notes`

| Aspect | Value |
|---|---|
| Schema shape | `string` (multiline; Txtarea autoExpand) |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/train/HabitModal.jsx:105](src/components/train/HabitModal.jsx:105) `notes:notes.trim()` (Txtarea at [HabitModal.jsx:94–101](src/components/train/HabitModal.jsx:94)) |
| Read sites | None active in surfaces inspected — flag |
| Translation keys | `notesHabitPlaceholder`, `notesOptional` |

---

### 1.6 — Routine (sub-entity in `mb_home_stack`)

Routines live as tiles inside `homeStack.defaultStack[]` with `type:"routine"`, plus per-day overrides at `homeStack.overrides[date].added[]` ([HomePage.jsx:498](src/components/home/HomePage.jsx:498)).

#### `routine.name`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_home_stack"]` → `defaultStack[].name` or `overrides[date].added[].name` |
| Existing edit-history | None |
| Write sites | [src/components/home/RoutineForm.jsx:35](src/components/home/RoutineForm.jsx:35) `name: f.name.trim()`; [src/components/home/HomePage.jsx:572](src/components/home/HomePage.jsx:572) `handleCreateRoutine` (wraps Form output) |
| Read sites | [src/components/home/HomePage.jsx:58](src/components/home/HomePage.jsx:58) (resolveTileName); [src/components/home/HomePage.jsx:340](src/components/home/HomePage.jsx:340) (mirrored to calendar event `title` when steps complete on a day) |
| Translation keys | `routineName`, `routineHint` |
| Notes | Required — early-return when blank ([RoutineForm.jsx:33](src/components/home/RoutineForm.jsx:33)). Routine name flows to the auto-captured `home-routine` calendar event title ([HomePage.jsx:340](src/components/home/HomePage.jsx:340)) — duplicate-write pattern. |

#### `routine.steps[].text`

| Aspect | Value |
|---|---|
| Schema shape | `Array<{ id: string, text: string }>` |
| Storage location | Same record |
| Existing edit-history | None — full-array overwrite on each save |
| Write sites | [src/components/home/RoutineForm.jsx:36](src/components/home/RoutineForm.jsx:36) (filter empty + trim); inline edit at [RoutineForm.jsx:80–84](src/components/home/RoutineForm.jsx:80) |
| Read sites | [src/components/home/HomeTile.jsx](src/components/home/HomeTile.jsx); [src/components/home/HomePage.jsx:328–329](src/components/home/HomePage.jsx:328) (steps progress for calendar events) |
| Translation keys | `step`, `addStep` |
| Notes | Each step has a generated `id` (Date.now-based string at [RoutineForm.jsx:97](src/components/home/RoutineForm.jsx:97)). Empty steps are filtered out at save. |

---

### 1.7 — Calendar event (`mb_calendar.events[]`)

The calendar events store is the **most heavily-written user-text store** because it's both the source of truth for manual session journals AND the auto-capture target for Drill/Spar/Combine/FlashCards/Music Flow/Lab/RRR/Battle Prep/HOME-routines/HOME-ideas/Rivals/Log Today (12 distinct write surfaces — see LogToday dossier for details on the auto-capture half). Schema is open-ended: any caller of `addCalendarEvent` can add fields. Common text-bearing fields:

#### `calendar.events[].title`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_calendar"].events[]`; Firestore `users/{uid}/calendar` ([App.jsx:311](src/App.jsx:311), synced [App.jsx:345](src/App.jsx:345)) |
| Existing edit-history | None |
| Write sites — manual (user-typed) | [src/components/calendar/SessionJournal.jsx:120](src/components/calendar/SessionJournal.jsx:120) `title: title.trim() || defaultTitles[type] || "Event"` (with translated default fallbacks); [src/components/logToday/LogTodayTraining.jsx:90](src/components/logToday/LogTodayTraining.jsx:90) `title: title.trim() || t("trainingSession")`. |
| Write sites — auto-capture (template-generated) | [RepCounter.jsx:116](src/components/train/RepCounter.jsx:116) ``Rep Counter — ${selectedMove.name}``; [Sparring.jsx:375](src/components/train/Sparring.jsx:375) ``Sparring — ${modeLabel}``; [Spar1v1.jsx:302](src/components/train/Spar1v1.jsx:302) ``1v1 Spar vs ${session.opponent}``; [MusicFlow.jsx:109](src/components/train/MusicFlow.jsx:109) ``Music Flow · ${fmtTime(...)}``; [FlashCards.jsx:80](src/components/moves/FlashCards.jsx:80) ``"Flash Cards"`` (literal); [ComboMachine.jsx:177](src/components/train/ComboMachine.jsx:177) ``Combo Machine — ${saveName}``; [Lab.jsx:293](src/components/moves/Lab.jsx:293) ``Lab — ${saveName}``; [RestoreRemixRebuild.jsx:286](src/components/moves/RestoreRemixRebuild.jsx:286) ``${t(mode)} — ${moveName}``; [HomePage.jsx:340](src/components/home/HomePage.jsx:340) `tile.name` (routine echo); [HomePage.jsx:480](src/components/home/HomePage.jsx:480),[HomePage.jsx:585](src/components/home/HomePage.jsx:585) `fields.title` (note echo); [BattlePrepSetup.jsx:180](src/components/train/BattlePrepSetup.jsx:180) `plan.eventName \|\| plan.planName`; [RivalsPage.jsx:309](src/components/battle/RivalsPage.jsx:309) ``Battle vs ${rival.name}``. |
| Read sites | [src/components/calendar/CalendarOverlay.jsx:609](src/components/calendar/CalendarOverlay.jsx:609) (day-event row); [src/components/train/BattlePrepSetup.jsx:57](src/components/train/BattlePrepSetup.jsx:57) (calendar→prep import). |
| Translation keys | Default titles (`trainingSession`, `battleEvent`, `restDay`, `journalEvent`, `sessionTitleOptional`) |
| Notes | **Mixed user-text vs. template-generated.** Manual writes (SessionJournal, LogTodayTraining) are user-typed. Auto-capture writes are deterministic templates with embedded user content (move names, opponent names, etc.). For TextStream purposes, the user-typed manual writes are the relevant write sites; auto-capture titles arguably stay out (the user-text content they embed lives in the canonical source — `move.name`, `rival.name`). |

#### `calendar.events[].notes`

| Aspect | Value |
|---|---|
| Schema shape | `string \| null` |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites — manual | [SessionJournal.jsx:121](src/components/calendar/SessionJournal.jsx:121) (Txtarea, training/rest/journal/battle types); [LogTodayTraining.jsx:98](src/components/logToday/LogTodayTraining.jsx:98) (Txtarea, "today's note") |
| Write sites — auto-capture | [Sparring.jsx:377](src/components/train/Sparring.jsx:377) (Solo `notes.trim() \|\| null` — passes the user-typed Sparring notes through); [Spar1v1.jsx:304](src/components/train/Spar1v1.jsx:304) ``${t("locationLabel")}: ${session.location}`` (template + user location); [CompetitionSimulator.jsx:487](src/components/battle/CompetitionSimulator.jsx:487) (`notes.trim() \|\| null`); [ComboMachine.jsx:181](src/components/train/ComboMachine.jsx:181) `notes: comboText` (auto-generated combo text with `→` arrows, NOT user-typed); [RestoreRemixRebuild.jsx:290](src/components/moves/RestoreRemixRebuild.jsx:290) `notesWithPrompt` (user notes + literal English `"Prompt: "` + prompt text — mixed); [RivalsPage.jsx:310](src/components/battle/RivalsPage.jsx:310) ``Result: ${...} — ${entry.event}`` (template + user event name) |
| Read sites | [CalendarOverlay.jsx:622](src/components/calendar/CalendarOverlay.jsx:622) (day-event detail) |
| Translation keys | `notesPlaceholder`, `sessionNotes`, `todaysNotePlaceholder` |
| Notes | The "notes" field on the calendar event is user-typed in manual paths and **template-generated-with-embedded-user-content** in auto-capture paths. The Combine and RRR auto-captures specifically inject literal English headers and arrow characters that aren't user-authored. |

#### `calendar.events[].workDescription`

LogToday-only. Free-text "anything else" textarea for session breakdown. Write: [LogTodayTraining.jsx:93](src/components/logToday/LogTodayTraining.jsx:93). Mirror in [SessionJournal.jsx:125](src/components/calendar/SessionJournal.jsx:125) (raw `<input>` line 374–381). Translation: `whatIWorkedOn`, `anythingElse`.

#### `calendar.events[].howItFelt`

LogToday-only narrative-text counterpart to SessionJournal's structured `exertion`/`bodyStatus` fields. Write: [LogTodayTraining.jsx:94](src/components/logToday/LogTodayTraining.jsx:94). Translation: `howItFelt`, `howItFeltPlaceholder`. **Distinct from SessionJournal's structured BodyCheckIn** — see Section 4.

#### `calendar.events[].location`

LogToday-only event location text. Write: [LogTodayTraining.jsx:96](src/components/logToday/LogTodayTraining.jsx:96). Translation: `location`, `locationPlaceholder`.

#### `calendar.events[].videoLink`

LogToday-only. URL field. Write: [LogTodayTraining.jsx:97](src/components/logToday/LogTodayTraining.jsx:97). **Borderline**, exclude (5.2).

#### `calendar.events[].eventLink`

SessionJournal battle-type only. URL. Write: [SessionJournal.jsx:129](src/components/calendar/SessionJournal.jsx:129). Exclude (5.2).

#### `calendar.events[].text`

Used only on `home-idea` source events (note→calendar mirror). Write: [HomePage.jsx:481](src/components/home/HomePage.jsx:481), [HomePage.jsx:486](src/components/home/HomePage.jsx:486), [HomePage.jsx:586](src/components/home/HomePage.jsx:586), [ReflectPage.jsx:176](src/components/reflect/ReflectPage.jsx:176). **Duplicates `idea.text`** (see Section 1.4 notes).

---

### 1.8 — Drill / RepCounter session (`mb_reps[]`)

Schema and write site enumerated in detail in [docs/research/LogToday_v1_AutoCapture_Inventory.md](docs/research/LogToday_v1_AutoCapture_Inventory.md). User-text-bearing field:

#### `reps[].reflection`

| Aspect | Value |
|---|---|
| Schema shape | `string \| undefined` (debounced post-save additive — record may exist without this field) |
| Storage location | `localStorage["mb_reps"]` array entry; Firestore `users/{uid}/reps` ([App.jsx:304](src/App.jsx:304), synced [App.jsx:338](src/App.jsx:338)) |
| Existing edit-history | None — debounced overwrites of the latest value (last-write-wins after 800ms idle, plus a synchronous flush on close at [RepCounter.jsx:54](src/components/train/RepCounter.jsx:54)) |
| Write sites | [src/components/train/RepCounter.jsx:48–58](src/components/train/RepCounter.jsx:48) `useEffect` debounced + `flushReflection()` synchronous flush; both call `onUpdateSession(savedSession.id, { reflection: reflection.trim() })` wired in App.jsx at [src/App.jsx:662–664](src/App.jsx:662) `onUpdateRepSession` |
| Read sites | None inspected actively — `reflection` is captured but no surface re-displays it. Flag in Section 4 as orphan-read candidate. |
| Translation keys | `trainingLog`, `aFewWords`, `reflectionReps`, `hint_*` (rotating hint pool) |
| Notes | Captured via the shared `<TrainingLog>` component ([src/components/shared/TrainingLog.jsx](src/components/shared/TrainingLog.jsx)). The reflection is added AFTER the session is saved (via update-by-id) — so the canonical record may have N versions over time as the user types. **No edit history preserved.** |

---

### 1.9 — Spar Solo session (`mb_sparring.sessions[]`)

Schema in LogToday dossier (Source 2). User-text-bearing fields:

#### `sparring.sessions[].notes`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_sparring"].sessions[]`; Firestore `users/{uid}/sparring` ([App.jsx:305](src/App.jsx:305), synced [App.jsx:339](src/App.jsx:339)) |
| Existing edit-history | None — set once at save |
| Write sites | [src/components/train/Sparring.jsx:328](src/components/train/Sparring.jsx:328) (textarea bound at [Sparring.jsx:932](src/components/train/Sparring.jsx:932)) |
| Read sites | None inspected actively — orphan-read candidate. Flag. |
| Translation keys | `workedOnNotes` |

#### `sparring.sessions[].reflection`

| Aspect | Value |
|---|---|
| Schema shape | `string \| null` |
| Storage location | Same record |
| Existing edit-history | None — set once at save (unlike `reps[].reflection` which uses the post-save debounce pattern; Sparring captures reflection synchronously in `handleSave` at [Sparring.jsx:329](src/components/train/Sparring.jsx:329)) |
| Write sites | [src/components/train/Sparring.jsx:329](src/components/train/Sparring.jsx:329) (`reflection.trim() \|\| null`) — captured via `<TrainingLog>` at [Sparring.jsx:940–942](src/components/train/Sparring.jsx:940) |
| Read sites | None inspected actively. Flag. |
| Translation keys | `reflectionSparring`, `aFewWords`, `hint_*` |

---

### 1.10 — Spar 1v1 session (`mb_sparring.sessions1v1[]`)

Schema in LogToday dossier (Source 3). User-text-bearing fields:

#### `sparring.sessions1v1[].opponent`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | Same `mb_sparring` record, sub-array `sessions1v1[]` |
| Existing edit-history | None — but the value is captured TWICE: once at session-end (`opponentName.trim()` at [Spar1v1.jsx:236](src/components/train/Spar1v1.jsx:236)) and once at save (`editOpponent.trim() || completedSession.opponent` at [Spar1v1.jsx:263](src/components/train/Spar1v1.jsx:263)). The save-time value wins. |
| Write sites | [src/components/train/Spar1v1.jsx:236](src/components/train/Spar1v1.jsx:236) (initial, from setup screen text input at [Spar1v1.jsx:458](src/components/train/Spar1v1.jsx:458)); [Spar1v1.jsx:263](src/components/train/Spar1v1.jsx:263) (edit on summary screen at [Spar1v1.jsx:787](src/components/train/Spar1v1.jsx:787)) |
| Read sites | [Spar1v1.jsx:302](src/components/train/Spar1v1.jsx:302) (calendar event title); [RivalsPage.jsx:309](src/components/battle/RivalsPage.jsx:309) (auto-link via `linkedPersonId`) |
| Translation keys | `opponent`, `opponentName`, `opponentNamePlaceholder` |
| Notes | If `linkedPersonId` is set, the opponent name is **also** copied into the `rivals[]` person's `sparHistory[]` ([Spar1v1.jsx:320](src/components/train/Spar1v1.jsx:320)) — duplicate write. |

#### `sparring.sessions1v1[].location`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | Same record |
| Existing edit-history | None — same dual-capture pattern as `opponent` |
| Write sites | [src/components/train/Spar1v1.jsx:238](src/components/train/Spar1v1.jsx:238) (initial); [Spar1v1.jsx:264](src/components/train/Spar1v1.jsx:264) (edit at [Spar1v1.jsx:792](src/components/train/Spar1v1.jsx:792)) |
| Read sites | [Spar1v1.jsx:304](src/components/train/Spar1v1.jsx:304) (calendar event notes; embeds in template ``${t("locationLabel")}: ${session.location}``) |
| Translation keys | `locationLabel`, `locationPlaceholder` |

#### `sparring.sessions1v1[].journal`

| Aspect | Value |
|---|---|
| Schema shape | `string \| null` (note: **single string, NOT an array** — different shape from move/idea journals) |
| Storage location | Same record |
| Existing edit-history | None — set once on save |
| Write sites | [src/components/train/Spar1v1.jsx:265](src/components/train/Spar1v1.jsx:265) `journal: journal.trim() \|\| null` (from textarea at [Spar1v1.jsx:843](src/components/train/Spar1v1.jsx:843)) |
| Read sites | None inspected — orphan-read candidate. Flag. |
| Translation keys | `journal`, `journalPlaceholder` |
| Notes | **Naming collision with `move.journal[]` and `idea.journal[]`.** This `journal` is a single multi-line string, not a structured entry list. The same field name carries different schema in different stores — flag for migration. |

---

### 1.11 — Competition Sim session (`mb_sparring.sessions[]` with `isCompetition:true`)

Same store and shape as Spar Solo — distinguished only by the `isCompetition: true` flag and `brackets` array ([CompetitionSimulator.jsx:455](src/components/battle/CompetitionSimulator.jsx:455)). Same text fields:

- `notes` — write at [CompetitionSimulator.jsx:466](src/components/battle/CompetitionSimulator.jsx:466), translation `competitionNotes`.
- `reflection` — write at [CompetitionSimulator.jsx:467](src/components/battle/CompetitionSimulator.jsx:467) via `<TrainingLog>` at [CompetitionSimulator.jsx:1351](src/components/battle/CompetitionSimulator.jsx:1351).

Treat as part of Section 1.9; no separate canonical store.

---

### 1.12 — Music Flow session (`mb_musicflow.sessions[]`)

Schema in LogToday dossier (Source 7). One user-text field:

#### `musicflow.sessions[].reflection`

| Aspect | Value |
|---|---|
| Schema shape | `string \| undefined` (debounced post-save additive — same pattern as `reps[].reflection`) |
| Storage location | `localStorage["mb_musicflow"].sessions[]`; Firestore `users/{uid}/musicflow` ([App.jsx:313](src/App.jsx:313), synced [App.jsx:347](src/App.jsx:347)) |
| Existing edit-history | None — debounced overwrite + sync flush at [MusicFlow.jsx:82](src/components/train/MusicFlow.jsx:82) |
| Write sites | [src/components/train/MusicFlow.jsx:73–87](src/components/train/MusicFlow.jsx:73) `useEffect` + `flushReflection()`; both call `onUpdateSession(savedSession.id, { reflection: reflection.trim() })`; wired in App.jsx [src/App.jsx:665–670](src/App.jsx:665) `onUpdateMusicflowSession` |
| Read sites | None inspected. Flag. |
| Translation keys | `trainingLog`, `aFewWords`, `hint_*` |
| Notes | Same `<TrainingLog>` shared component pattern as Drill. |

---

### 1.13 — Set (`mb_sets[]`)

Sets carry several fields, with mixed editing surfaces.

#### `sets[].name`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_sets"]` array entry; Firestore `users/{uid}/sets` ([App.jsx:295](src/App.jsx:295), synced [App.jsx:331](src/App.jsx:331)) |
| Existing edit-history | None |
| Write sites | [src/components/battle/ReadyPage.jsx:146](src/components/battle/ReadyPage.jsx:146) `addSet(name)` (via `NameModal` at [ReadyPage.jsx:702](src/components/battle/ReadyPage.jsx:702)); [src/components/moves/SetDetailModal.jsx:45](src/components/moves/SetDetailModal.jsx:45) `name: name.trim()` (Inp at [SetDetailModal.jsx:71](src/components/moves/SetDetailModal.jsx:71)); [src/components/train/ComboMachine.jsx:164](src/components/train/ComboMachine.jsx:164) ``saveName \|\| `Combo ${todayLocal()}` `` (auto-default with English literal) |
| Read sites | [src/components/calendar/CalendarOverlay.jsx](src/components/calendar/CalendarOverlay.jsx); [SetDetailModal.jsx:202](src/components/moves/SetDetailModal.jsx:202) and other tile renders |
| Translation keys | None for the field itself; placeholder is hardcoded English at [ReadyPage.jsx:702](src/components/battle/ReadyPage.jsx:702) (`"e.g. Opening Combo…"`) |
| Notes | Combine-origin sets get the literal English name `"Combo YYYY-MM-DD"` if `saveName` is blank — flag. |

#### `sets[].details`

| Aspect | Value |
|---|---|
| Schema shape | `string` (multiline; Txtarea autoExpand) |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/moves/SetDetailModal.jsx:45](src/components/moves/SetDetailModal.jsx:45) `details: details.trim()` (Txtarea at [SetDetailModal.jsx:74–81](src/components/moves/SetDetailModal.jsx:74)) |
| Read sites | [SetDetailModal.jsx:31](src/components/moves/SetDetailModal.jsx:31) (re-display in edit) |
| Translation keys | `detailsLabel` |
| Notes | Currently the only narrative-text field on a Set — `notes` is frozen (see below). |

#### `sets[].notes` (legacy / partly read-only / Combine-origin)

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | Same record |
| Existing edit-history | N/A — UI does not edit it |
| Write sites — initial | [src/components/battle/ReadyPage.jsx:146](src/components/battle/ReadyPage.jsx:146) `addSet`: writes `notes:""` empty; [src/components/train/ComboMachine.jsx:167](src/components/train/ComboMachine.jsx:167) writes `notes: comboText` (auto-generated combo text with U+2192 `→` arrows — NOT user-typed) |
| Write sites — pass-through on edit | [src/components/moves/SetDetailModal.jsx:32](src/components/moves/SetDetailModal.jsx:32) reads `item.notes` into local state but the variable has **no setter** — `useState`'s setter is destructured-and-ignored: `const [notes] = useState(...)`. The save at [SetDetailModal.jsx:45](src/components/moves/SetDetailModal.jsx:45) passes `notes.trim()` through unchanged. |
| Read sites | None inspected actively — possible orphan read or display through the day-event aggregator |
| Translation keys | None (no UI control) |
| Notes | **`set.notes` is effectively a Combine-only payload** — the only writer that fills it with user-influenced content is ComboMachine (and even there, `comboText` is auto-generated from move sequence, not free text). Recommend treating as deprecated for TextStream purposes (5.2). See Section 4. |

#### `sets[].link`

URL — write at [SetDetailModal.jsx:45](src/components/moves/SetDetailModal.jsx:45) `link: ensureHttps(link.trim())`. Exclude (5.2).

---

### 1.14 — Round (`mb_rounds[]`)

Battle-tab rounds (timer plans). Initialized from `buildInitRounds()` defaults at [App.jsx:105](src/App.jsx:105). User-text fields:

#### `rounds[].name`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | `localStorage["mb_rounds"]`; Firestore `users/{uid}/rounds` ([App.jsx:296](src/App.jsx:296), synced [App.jsx:332](src/App.jsx:332)) |
| Existing edit-history | None |
| Write sites | [src/components/battle/ReadyPage.jsx:140](src/components/battle/ReadyPage.jsx:140) `addRound(name, color, entryCount)` via `NewRoundModal` at [ReadyPage.jsx:700](src/components/battle/ReadyPage.jsx:700) (input at [NewRoundModal.jsx:21](src/components/battle/NewRoundModal.jsx:21)); [src/components/battle/EditRoundView.jsx:22](src/components/battle/EditRoundView.jsx:22) `onSave(round.id, { name:localRound.name, … })` |
| Read sites | Round tile rendering throughout the BATTLE tab |
| Translation keys | `roundNameLabel`, `roundPlaceholder`, `newRoundTitle` |
| Notes | Required at create — Save button disabled when blank ([NewRoundModal.jsx:50](src/components/battle/NewRoundModal.jsx:50)). |

#### `rounds[].notes`

| Aspect | Value |
|---|---|
| Schema shape | `string` |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/battle/ReadyPage.jsx:140](src/components/battle/ReadyPage.jsx:140) initial `notes:""`; [src/components/battle/EditRoundView.jsx:22](src/components/battle/EditRoundView.jsx:22) and edit textarea at [EditRoundView.jsx:176–177](src/components/battle/EditRoundView.jsx:176) |
| Read sites | None inspected actively — flag |
| Translation keys | `notesRound` |

#### `rounds[].entries[].name`

| Aspect | Value |
|---|---|
| Schema shape | Per-entry `string` |
| Storage location | Same record |
| Existing edit-history | None |
| Write sites | [src/components/battle/ReadyPage.jsx:138](src/components/battle/ReadyPage.jsx:138) auto-generated `t("entryPrefix")+" "+(i+1)` at create; [src/components/battle/EditRoundView.jsx:28](src/components/battle/EditRoundView.jsx:28) `localAddEntry`; **rename via inline `setRenaming`/`renameVal` at [EditRoundView.jsx:15–16](src/components/battle/EditRoundView.jsx:15)** (UI not fully read above line 35; renaming flow exists). |
| Read sites | Round detail rendering |
| Translation keys | `entryPrefix` |
| Notes | Most entry names are auto-defaults; only renamed ones are user-authored. **Borderline — recommend exclude as label data (5.2).** |

---

### 1.15 — Custom Attribute (`mb_custom_attrs[]`)

User-defined move attribute schema. Each attribute has a `name` (the attribute label like "Concept") and `values[]` (the option labels like "Loop", "Spin", "Drop").

#### `customAttrs[].name`

User-typed attribute label. Write: [src/components/modals/AttributeModal.jsx:46–52](src/components/modals/AttributeModal.jsx:46) `onSave({ name: trimmed, multi, values, … })`. Read: [src/components/moves/MoveModal.jsx:556](src/components/moves/MoveModal.jsx:556).

#### `customAttrs[].values[]`

Array of user-typed option labels (≤ 20 items, ≤ ~1 word each typically). Write: [src/components/modals/AttributeModal.jsx:32](src/components/modals/AttributeModal.jsx:32) `addValue` and [AttributeModal.jsx:38](src/components/modals/AttributeModal.jsx:38) `removeValue`. Read: [src/components/moves/AttributeChips.jsx](src/components/moves/AttributeChips.jsx).

**Notes:** Both fields are user-authored but they are **lookup/label data** — they parameterize the attribute filter UI, not narrative content. Per the prompt's directive, recommend exclude (Section 5.2 + open question Section 6).

---

### 1.16 — Rival / SparringMate / Crew (`mb_rivals[]`)

The most text-rich entity in the app. All three person-types share one record schema, distinguished by `type` field. Write paths centered in [src/components/battle/RivalsPage.jsx](src/components/battle/RivalsPage.jsx). Schema normalized via `normalizeRival` at [RivalsPage.jsx:58–63](src/components/battle/RivalsPage.jsx:58).

#### `rivals[].name`

Required string. Write: [src/components/battle/RivalsPage.jsx:276](src/components/battle/RivalsPage.jsx:276) (clean `.trim()`); UI input at [RivalsPage.jsx:429](src/components/battle/RivalsPage.jsx:429). Translation: `name`. Read: many — calendar event titles ([RivalsPage.jsx:309](src/components/battle/RivalsPage.jsx:309)), home tile rendering, etc.

#### `rivals[].crew`

User-typed string. Write: [RivalsPage.jsx:278](src/components/battle/RivalsPage.jsx:278); input [RivalsPage.jsx:455](src/components/battle/RivalsPage.jsx:455). Translation: `crewLabel`, `crewPlaceholder`.

#### `rivals[].city`

User-typed string. Write: [RivalsPage.jsx:279](src/components/battle/RivalsPage.jsx:279); input [RivalsPage.jsx:461](src/components/battle/RivalsPage.jsx:461). Translation: `cityLabel`, `cityPlaceholder`.

#### `rivals[].instagram`

Username string (passed through `cleanIG()` at [RivalsPage.jsx:49–56](src/components/battle/RivalsPage.jsx:49) which strips URL prefix, query string, leading `@`, trailing `/`). Write: [RivalsPage.jsx:277](src/components/battle/RivalsPage.jsx:277). **Borderline — exclude (5.2).**

#### `rivals[].signatureMoves`

Multiline narrative text. Write: [RivalsPage.jsx:285](src/components/battle/RivalsPage.jsx:285); Txtarea at [RivalsPage.jsx:512–519](src/components/battle/RivalsPage.jsx:512). Translation: `signatureMovesLabel`, `signatureMovesPlaceholder`.

#### `rivals[].gamePlan`

Multiline narrative text. Write: [RivalsPage.jsx:285](src/components/battle/RivalsPage.jsx:285) (passes `f.gamePlan` through); Txtarea at [RivalsPage.jsx:522–529](src/components/battle/RivalsPage.jsx:522). Translation: `gamePlanLabel`, `gamePlanPlaceholder`.

#### `rivals[].targetWhen`

Single-line user text, e.g. "Q3 2026". Write: [RivalsPage.jsx:281](src/components/battle/RivalsPage.jsx:281); input [RivalsPage.jsx:557](src/components/battle/RivalsPage.jsx:557). Translation: `rivalWhen`, `rivalWhenPlaceholder`, `rivalWhenHint`.

#### `rivals[].targetWhere`

Single-line user text, e.g. event name. Write: [RivalsPage.jsx:282](src/components/battle/RivalsPage.jsx:282); input [RivalsPage.jsx:564](src/components/battle/RivalsPage.jsx:564). Translation: `rivalWhere`, `rivalWherePlaceholder`, `rivalWhereHint`.

#### `rivals[].sparringJournal`

Multiline narrative text — **single string, not array** (same shape as `sparring.sessions1v1[].journal`). Write: [RivalsPage.jsx:280](src/components/battle/RivalsPage.jsx:280); Txtarea at [RivalsPage.jsx:568–575](src/components/battle/RivalsPage.jsx:568). Translation: `sparringJournalLabel`, `sparringJournalPlaceholder`. **Naming collision with `move.journal[]` / `idea.journal[]` — flag.**

#### `rivals[].videoRefs[].url` and `rivals[].videoRefs[].label`

Array of `{url, label}`. URL exclude. `label` is user-typed annotation. Write: [RivalsPage.jsx:264–268](src/components/battle/RivalsPage.jsx:264). Translation: `pasteLink`, `labelOptional`. **Borderline — short label data, recommend exclude (5.2).**

#### `rivals[].battles[]` (battle log entries)

Each entry `{ id, date, result, event?, howDidItGo?, whatSurprised?, trainingNext? }` — user-text fields are `event`, `howDidItGo`, `whatSurprised`, `trainingNext`. All four are written together in a single `handleSaveBattle` at [RivalsPage.jsx:289–314](src/components/battle/RivalsPage.jsx:289). Existing edit-history: **append-only by construction** — entries are added via `[...rival.battles||[], entry]` and there is no UI edit path for an existing battle entry (display-only at [RivalsPage.jsx:617–621](src/components/battle/RivalsPage.jsx:617)). Translation: `eventName`, `eventPlaceholder`, `howDidItGo`, `howDidItGoPlaceholder`, `whatSurprised`, `whatSurprisedPlaceholder`, `trainingNext`, `trainingNextPlaceholder`. The `event` user text is also embedded in a calendar event note ([RivalsPage.jsx:310](src/components/battle/RivalsPage.jsx:310)) on save — duplicate-write pattern.

#### `rivals[].sparHistory[]`

Auto-populated from Spar 1v1 saves and JSON import — see Section 1.10 and [src/components/battle/RivalsPage.jsx:106–131](src/components/battle/RivalsPage.jsx:106) `handleImportFile`. **Not user-typed at the rival level**; the user-text content (opponent name, location, journal) is canonical at `sparring.sessions1v1[]`. The `sparHistory` array is a denormalized index. Recommend **read-only mirror, not in TextStream** (5.2).

---

### 1.17 — Battle Plan (`mb_battleprep.plans[]`)

The Battle Prep system. Each plan has its own large schema. User-text-bearing fields:

#### `battleprep.plans[].eventName`, `planName`, `eventUrl`, `location`

All four are written together in the plan-build path. Write: [src/components/train/BattlePrepSetup.jsx:147–164](src/components/train/BattlePrepSetup.jsx:147) `buildPlanObject` which is then activated at [BattlePrepSetup.jsx:171–184](src/components/train/BattlePrepSetup.jsx:171) `handleActivate`. Inputs at [BattlePrepSetup.jsx:17,18,19,20](src/components/train/BattlePrepSetup.jsx:17). Existing edit-history: **none — plans are created and never edited** (only completed/archived through the BattleDayView reflection flow). Translation: `eventName`, `planName`, `eventUrl`, `location`, `battleDetails`. `eventUrl` exclude (URL).

#### `battleprep.plans[].battles[].eventName`

Per-battle event name (when a plan has multiple battle dates). Write: [BattlePrepSetup.jsx:148](src/components/train/BattlePrepSetup.jsx:148) (uses plan's `eventName` as fallback). Read: [BattleDayView.jsx:165](src/components/train/BattleDayView.jsx:165). Translation: `battleEvent`.

#### `battleprep.plans[].customPhases[].name`

Only for `preset:"custom"` plans. Each phase user-named. Write: [BattlePrepSetup.jsx:161](src/components/train/BattlePrepSetup.jsx:161). Translation: `prepDefinePhases`. **Borderline — short label data; recommend exclude (5.2).**

#### `battleprep.plans[].battleDay.customItems[].text`

Pre-battle ritual checklist additions (e.g., "Pack water bottle"). Write: [src/components/train/BattleDayView.jsx:114–121](src/components/train/BattleDayView.jsx:114) `addCustomItem`; persisted via [BattleDayView.jsx:98–100](src/components/train/BattleDayView.jsx:98) `persistChecklist`. Read: [BattleDayView.jsx:198–199](src/components/train/BattleDayView.jsx:198). Translation: none for the items themselves; UI label `preBattleChecklist`.

#### `battleprep.plans[].battles[].reflection.{takeaway, whatWorked, needsWork, changeTraining}`

Four-pane post-battle reflection. Set together in `handleSave` at [src/components/train/BattleDayView.jsx:283–311](src/components/train/BattleDayView.jsx:283). Each field is a separate textarea backed by the `<ReflectionField>` helper at [BattleDayView.jsx:921–926](src/components/train/BattleDayView.jsx:921) (raw textarea). Existing edit-history: none — `reflection` is set once then read-only in subsequent surfaces ([reflect/BattleResultDetail.jsx](src/components/reflect/BattleResultDetail.jsx)). Translation: `reflectionTakeaway`, `reflectionWhatWorked`, `reflectionNeedsWork`, `reflectionChangeTraining` + `*Hint` placeholder keys.

---

### 1.18 — Profile (`mb_profile`)

Single-record store. User-text-bearing fields:

#### `profile.nickname`

Single-line user name. Write: [src/components/modals/ProfileModal.jsx:96](src/components/modals/ProfileModal.jsx:96). Read: [App.jsx:719,721](src/App.jsx:719) (header rendering). Translation: `nickname`, `nicknamePlaceholder`.

#### `profile.goals`

Multiline. Write: [ProfileModal.jsx:144](src/components/modals/ProfileModal.jsx:144). Translation: `goalsPlaceholder`, `breakingGoals`.

#### `profile.why`

Multiline (large — `minHeight:"20vh"`). Write: [ProfileModal.jsx:151](src/components/modals/ProfileModal.jsx:151). Translation: `rememberWhy`, `whyBreaking`.

**Notes:** `profile.age`, `profile.gender`, `profile.years`, `profile.startYear/Month/Day` are non-text demographic fields. The full default shape is at [App.jsx:119](src/App.jsx:119). Recommend including only `nickname`/`goals`/`why` in TextStream (5.1).

---

### 1.19 — Reminders / "My Notes" (`mb_reminders.items[]`)

Profile-attached sticky-note style reminders. Surfaces in three places: ProfileModal "My Notes" card, ManageReminders dedicated screen, and ReminderBlock embedded in WIP page (and shown on Trust Mode reveal in FreestylePage at [src/components/battle/FreestylePage.jsx:38](src/components/battle/FreestylePage.jsx:38)).

#### `reminders.items[].text`

| Aspect | Value |
|---|---|
| Schema shape | `Array<{ id: string, text: string, createdAt: string }>` (`createdAt` is `todayLocal()` YYYY-MM-DD) |
| Storage location | `localStorage["mb_reminders"]`; Firestore `users/{uid}/reminders` ([App.jsx:310](src/App.jsx:310), synced [App.jsx:344](src/App.jsx:344)) |
| Existing edit-history | None — direct in-place text overwrite |
| Write sites | [src/components/modals/ProfileModal.jsx:34](src/components/modals/ProfileModal.jsx:34) (append on save); [src/components/moves/ManageReminders.jsx:30–40](src/components/moves/ManageReminders.jsx:30) (in-place edit) and [ManageReminders.jsx:42–50](src/components/moves/ManageReminders.jsx:42) (append); [src/components/moves/ReminderBlock.jsx:56–64](src/components/moves/ReminderBlock.jsx:56) (append) and [ReminderBlock.jsx:66–76](src/components/moves/ReminderBlock.jsx:66) (in-place edit). Three distinct write surfaces all targeting the same array. |
| Read sites | [ProfileModal.jsx:155](src/components/modals/ProfileModal.jsx:155); [ManageReminders.jsx:155](src/components/moves/ManageReminders.jsx:155); [ReminderBlock.jsx:124,193](src/components/moves/ReminderBlock.jsx:124); [FreestylePage.jsx:38](src/components/battle/FreestylePage.jsx:38) (random pick on Trust Mode toggle) |
| Translation keys | `myNotes`, `addNote`, `writeYourselfANote`, `noteSaved`, `noteDeleted`, `manageNotes`, `stickyNoteHint`, `xNotes` |
| Notes | Each reminder capped at 280 chars by all three writers. Three write surfaces are an excellent migration target — wrapping the array setter `onRemindersChange` would cover all writes at once. |

---

### 1.20 — Pre-session intel (`mb_presession`)

Captured by PostSessionPrompt and edited by PreSessionIntel. Default shape at [App.jsx:213](src/App.jsx:213).

#### `presession.fromLastSession`

Single-line text (rendered as multi-line via `whiteSpace`). Write: [PostSessionPrompt.jsx:16](src/components/home/PostSessionPrompt.jsx:16); edit [src/components/home/PreSessionIntel.jsx:25](src/components/home/PreSessionIntel.jsx:25). Translation: `fromLastSession`, `noteForNextTime`, `noteForNextTimePlaceholder`.

#### `presession.fromFootage`

Same shape and pattern. Write: [PostSessionPrompt.jsx:17](src/components/home/PostSessionPrompt.jsx:17); edit [PreSessionIntel.jsx:25](src/components/home/PreSessionIntel.jsx:25). Translation: `fromFootageReview`, `anythingToFilm`, `anythingToFilmPlaceholder`.

#### `presession.wantToTry[].text`

Append-only short-text array. Write: [PreSessionIntel.jsx:34–41](src/components/home/PreSessionIntel.jsx:34) `addTry`; delete [PreSessionIntel.jsx:43–48](src/components/home/PreSessionIntel.jsx:43). Date `todayLocal()`. Translation: `wantToTry`, `addNote`. Read: [PreSessionIntel.jsx:106–119](src/components/home/PreSessionIntel.jsx:106).

---

### 1.21 — Lab custom chips (`mb_lab.customChips`)

User-typed chip labels grouped by pool (`technical`/`conceptual`) and category. Write: [src/components/moves/Lab.jsx:131–151](src/components/moves/Lab.jsx:131) (add/remove via `onLabChange`).

**Notes:** This is **label data**, not narrative. Each chip is typically 1–3 words. Recommend exclude from TextStream (5.2).

---

### 1.22 — Categories (`mb_cats`)

User-renamable category strings. Write: [src/components/moves/AddCategoryModal.jsx:23](src/components/moves/AddCategoryModal.jsx:23). Read: every Move-related surface.

**Notes:** Pure lookup-key data — referenced by `move.category`, `customAttrs[].values`, etc. Recommend exclude (5.2).

---

### 1.23 — Freestyle saved lists (`mb_freestyle_saved`)

**This store is owned by FreestylePage at [src/components/battle/FreestylePage.jsx:80–85](src/components/battle/FreestylePage.jsx:80) — NOT in App.jsx central state and NOT synced to Firestore.** Each entry has a user-typed `name`. Write: [FreestylePage.jsx:88–92](src/components/battle/FreestylePage.jsx:88).

**Notes:** Localhost-only. Single-line label. **Borderline — recommend exclude (5.2)**, with the additional caveat that since it's not in central state / Firestore, including it would require lifting state to App.jsx first.

---

### 1.24 — Drafts and transient state (excluded)

Captured here for completeness — these are **transient editor buffers, never persisted**:

- `MoveModal.newJournalText` ([MoveModal.jsx:45](src/components/moves/MoveModal.jsx:45)) — append-buffer; persists nothing on close.
- `HomePage.newUpdateText` ([HomePage.jsx:112](src/components/home/HomePage.jsx:112)) — same, for HOME Updates.
- `RepCounter.reflection` ([RepCounter.jsx:26](src/components/train/RepCounter.jsx:26)) — buffer until debounced flush; final value lives in `reps[].reflection`.
- `Sparring.notes` / `.reflection` ([Sparring.jsx:103](src/components/train/Sparring.jsx:103)) — buffer; persisted on Save.
- All `setEditText` / `editText` state in ManageReminders, ReminderBlock, PreSessionIntel — in-place edit buffers.
- `MoveModal.manualDelta` ([MoveModal.jsx:78](src/components/moves/MoveModal.jsx:78)) — numeric, not text.
- `mb_editmove_journal` / `mb_editmove_depth` ([MoveModal.jsx:48,68](src/components/moves/MoveModal.jsx:48)) — UI accordion state, not user content.
- `mb_home_filter` ([HomePage.jsx:251,263](src/components/home/HomePage.jsx:251)) — filter checkbox state, not user content.
- `mb_freestyle_list` ([FreestylePage.jsx:69](src/components/battle/FreestylePage.jsx:69)) — moves' to-use list (move-id references, not text).
- `mb_settings` — UI settings; no user-authored narrative.

These do not migrate.

---

## Section 2 — Cross-cutting concerns

### Concern 1 — Timestamp format inconsistencies on text records

**Three competing formats are in active use across user-text records.** TextStream's schema (`created_at: ISO 8601`) requires a single canonical timestamp, so any migration must reconcile these.

| Format | Used by | Example |
|---|---|---|
| ISO 8601 (`new Date().toISOString()`) — **full timestamp** | `reps[].date`, `sparring.sessions[].date`, `sparring.sessions1v1[].date`, `musicflow.sessions[].date`, `idea.archivedDate`, `idea.createdDate` (when set on note creation; goal/target use YMD), `rivals[].createdDate` / `updatedDate`, `rivals[].sparHistory[].importedAt` | `2026-05-09T14:23:01.412Z` |
| `todayLocal()` YYYY-MM-DD — **device local day key** | `move.date`, `move.prevDate`, `move.journal[].date`, `calendar.events[].date` (most), `goal.createdDate` / `target.createdDate` (set in modal handleSave), `flashcards.bestScore.date`, `Set` `.date`, `reminders.items[].createdAt`, `presession.wantToTry[].date`, `rrr.lastUsed.date`, `stance.assessments[].date`, `battleprep.plans[].createdDate`, `battleprep.plans[].battles[].date`, `battleprep.plans[].battles[].reflection.date` | `2026-05-09` |
| `toLocaleDateString("en-AU")` — **localized formatted string** | `idea.journal[].date` (goal/target — set at [GoalModal.jsx:102](src/components/train/GoalModal.jsx:102) and [TargetGoalModal.jsx:84](src/components/train/TargetGoalModal.jsx:84)) | `"09 May 2026"` |

**Key observations:**

- The `idea.journal[].date` "en-AU" format is the **outlier**. It cannot be fed into `toYMD()` for day-bucket equality (would need a parser). The CalendarOverlay aggregator at [CalendarOverlay.jsx:116](src/components/calendar/CalendarOverlay.jsx:116) currently filters via `(i.journal||[]).some(j => toYMD(j.date) === d)` but `toYMD` short-circuits already-string inputs that match `YYYY-MM-DD` — `"09 May 2026"` does NOT match, so it falls through to `toLocalYMD()` which calls `new Date("09 May 2026")`. This **happens to parse correctly in V8** but is browser-dependent and not specified. **Bordering on a latent bug.**
- For TextStream, every text record needs `created_at` as ISO 8601. Records with YMD only have **no within-day ordering**; records with `toLocaleDateString("en-AU")` need re-parsing.
- **Recommendation (5.3):** when wrapping write helpers, normalize to ISO 8601 at the wrap point. Backfilling existing records is a separate question — see Section 6.

### Concern 2 — Existing shared write hooks (migration wrap candidates)

Wrapping these centralized setters/helpers would catch multiple write sites at once:

| Wrap point | Reaches | File:line |
|---|---|---|
| `useMoveCrud.saveMove` | `move.name`, `description`, `link`, `journal[]` for create + edit | [src/hooks/useMoveCrud.js:10–16](src/hooks/useMoveCrud.js:10) |
| `useMoveCrud.bulkImport` | `move.name` for paste-import | [src/hooks/useMoveCrud.js:35–41](src/hooks/useMoveCrud.js:35) |
| `App.addCalendarEvent` | All `calendar.events[].title/notes/text/...` writes including auto-capture | [src/App.jsx:634–643](src/App.jsx:634) |
| `App.updateCalendarEvent` | LogToday session edits (and any future calendar-event edits) | [src/App.jsx:649–656](src/App.jsx:649) |
| `App.removeCalendarEvent` | Calendar event deletes (TextStream supersede semantics question) | [src/App.jsx:645–647](src/App.jsx:645) |
| `App.onUpdateRepSession` | `reps[].reflection` post-save updates | [src/App.jsx:662–664](src/App.jsx:662) |
| `App.onUpdateMusicflowSession` | `musicflow.sessions[].reflection` post-save updates | [src/App.jsx:665–670](src/App.jsx:665) |
| `setReps` (sparring saves on `App.jsx:766`) | Drill session creates | [src/App.jsx:763–769](src/App.jsx:763) |
| `setSparring` updater (in `App.jsx:776`) | Sparring + Spar 1v1 + Competition Sim saves (all funnel through) | [src/App.jsx:775–786](src/App.jsx:775) |
| `setMusicflow` updater | Music Flow saves | [src/App.jsx:823–826](src/App.jsx:823) |
| `setIdeas` (used in HomePage / IdeaForm / NoteModal / GoalModal / TargetGoalModal) | All goal/target/note CRUD | many call sites |
| `setHabits` | Habit creates/edits | [src/App.jsx:758](src/App.jsx:758) wiring |
| `setRivals` (`onRivalsChange`) | All rival/sparringMate/crew CRUD including sparHistory mutations | [src/App.jsx:785](src/App.jsx:785) wiring |
| `setBattleprep` | Plan creates and battle reflections | [src/App.jsx:761,317](src/App.jsx:761) |
| `setReminders` (`onRemindersChange`) | All three reminder-write surfaces | [src/App.jsx:799](src/App.jsx:799) wiring |
| `setPresession` | Pre-session intel writes | [src/App.jsx:758](src/App.jsx:758) wiring |

**The `setIdeas` and `setRivals` setters are passed down through many components**, so wrapping at the App level (or via a thin facade hook) catches all writes without modifying every component.

### Concern 3 — Existing search/aggregation patterns

**There is no global text-search across user content today.** Closest existing aggregations:

- [src/hooks/useDayData.js](src/hooks/useDayData.js) + [CalendarOverlay.jsx:107–119](src/components/calendar/CalendarOverlay.jsx:107) — per-day cross-store query (moves/reps/sparring/musicflow/habits/ideas/calendar) — non-text, day-keyed. (Documented in detail in LogToday Concern 3.)
- [src/components/reflect/ReflectPage.jsx:74–92](src/components/reflect/ReflectPage.jsx:74) `historyEntries` — combines archived `ideas` (notes/goals) and resolved `injuries` for the HISTORY tab. Date-keyed sort.
- [src/components/calendar/ReportsTimeline.jsx](src/components/calendar/ReportsTimeline.jsx) — temporal aggregator (didn't read fully; consumes `reps`/`sparring`/`musicflow`/`calendar` for milestone detection via `reportEngine.js`).
- [src/utils/reportEngine.js](src/utils/reportEngine.js) — milestone detection (count-based, not text-based).

**Implication:** A TextStream-backed search/look-back UI would be a NEW capability. No existing surface needs migration to "use TextStream instead" — TextStream adds capability rather than replacing existing reads.

### Concern 4 — Edit-history precedents

**Three patterns exist; none is a true supersede mechanism.**

| Pattern | Used by | Semantics |
|---|---|---|
| **Append-only array (delete allowed, no edit)** | `move.journal[]` | Each entry has its own `id` and `date`; new entries are prepended; entries can be hard-deleted but not edited. Closest precedent for TextStream's append model. |
| **Append-or-edit array (edit allowed via in-place overwrite)** | `idea.journal[]` (goal + target) | Same shape as `move.journal[]` BUT the per-entry edit at [JournalEntryCard.jsx:17](src/components/train/JournalEntryCard.jsx:17) overwrites `text`/`link` on the entry — no version history. |
| **Single-string overwrite with debounced last-write-wins** | `reps[].reflection`, `musicflow.sessions[].reflection`, `sparring.sessions[].reflection`, `sparring.sessions1v1[].journal`, all `rivals[].*`, all `habits[].*`, all `presession.*`, all calendar event text fields, all profile fields, etc. | Most user text. No history at all. |
| **One-step rollback (`prevDate`)** | `move.date` / `move.prevDate` ([useMoveCrud.js:18–33](src/hooks/useMoveCrud.js:18)) | Store the prior value to support undo of "trained today" toggle. Not text, but the only existing backup-of-prior-value pattern. |
| **Soft archive (hide-from-view)** | `idea.archived` + `idea.archivedDate`, `battleprep.plans[].archived` (assumed similar) | Hide rather than delete. Documented in LogToday Concern 4. **Not a supersede mechanism** — text content remains the latest single value. |

**Implication for TextStream:** the supersede pattern (`superseded_at`/`superseded_by`) has **no in-app precedent**. Designing it is a clean-slate exercise.

### Concern 5 — Multi-line conventions

| Convention | Used by | Notes |
|---|---|---|
| `<Txtarea>` shared component with `autoExpand` | MoveModal description, GoalModal description, HabitModal notes, RivalsPage signatureMoves/gamePlan/sparringJournal, BattleDayView reflection panes, JournalEntryInput, etc. | Auto-resize on input. Consistent. |
| Raw `<textarea>` | MoveModal Move Journal append ([MoveModal.jsx:593](src/components/moves/MoveModal.jsx:593)), HomePage Updates append ([HomePage.jsx:1191](src/components/home/HomePage.jsx:1191)), Sparring notes ([Sparring.jsx:931](src/components/train/Sparring.jsx:931)), TrainingLog ([TrainingLog.jsx:51](src/components/shared/TrainingLog.jsx:51)), CompetitionSimulator notes ([CompetitionSimulator.jsx:1341](src/components/battle/CompetitionSimulator.jsx:1341)), ReminderBlock/ManageReminders/ProfileModal note adders, RestoreRemixRebuild summary, Spar1v1 journal, FeedbackModal (multiple — but not persisted) | Manual `style.height` calc OR `resize:"vertical"` user-resize. |
| Single-line `<input>` | All `name`/`title` fields, `link`/URL fields, `crew`/`city`/`instagram`, `targetWhen`/`targetWhere`, RoutineForm step text, AttributeModal value text | Newlines effectively stripped on submit. |

**Newline handling:** none of the writers explicitly strip newlines from textareas — `text.trim()` only removes leading/trailing whitespace. Newlines within multi-line fields persist into storage as-is. Read surfaces handle newlines via `whiteSpace: "pre-wrap"` ([JournalEntryCard.jsx:56](src/components/train/JournalEntryCard.jsx:56)) or implicit (no styling — collapses in HTML). For TextStream, the `text` field can hold newlines; no normalization needed.

### Concern 6 — User text never passed through `t()`

**Confirmed clean.** Sample sweep across all major write sites: every `t(...)` call site in this dossier references a `placeholder=` or `label=` prop, never a value bound to user state. The only "false positives" are template-generated calendar event titles like ``${t(mode)} — ${moveName}`` where `t(mode)` is a fixed enum key — but these are template strings, not user content passing through `t()`.

This is a sanity check the prompt requested. No translation-locale issue blocks TextStream migration.

### Concern 7 — Capacitor / PWA storage considerations

- **localStorage size limits.** Capacitor WebView on mobile typically caps localStorage at 5–10 MB. Heavy `move.journal[]` users + `calendar.events[]` accumulation could approach this. Adding TextStream as a parallel store **doubles the text payload** in storage (canonical + stream copy). Recommend Firestore-first for TextStream rather than mirroring it through localStorage by default — but that conflicts with the existing offline-first pattern. Open question for Section 6.
- **No `beforeunload` reliance for text.** [App.jsx:367–374](src/App.jsx:367) registers a `beforeunload` flush only for `profilePhoto`. Text writes are debounced + persisted on each setter call. TextStream wraps fit this pattern.
- **Auth flush patterns.** All Firestore syncs are debounced 1500ms. A TextStream wrap that piggybacks on this debounce keeps the same sync cadence.

### Concern 8 — Source-label resolution for TextStream

The TextStream schema requires `source_label` (e.g., "Windmill" / "March 14" / "Learn airflare"). For each `source_type`, the canonical record provides:

| `source_type` | `source_id` | `source_label` derivation |
|---|---|---|
| `move_journal` | move.id | `move.name` |
| `move_description` | move.id | `move.name` |
| `goal_description` | idea.id | `idea.title` |
| `goal_journal` | idea.id (+ entry.id?) | `idea.title` |
| `target_journal` | idea.id (+ entry.id?) | `idea.title` |
| `note_text` | idea.id | `idea.title \|\| idea.text.slice(0, 60)` (mirrors [HomePage.jsx:62](src/components/home/HomePage.jsx:62)) |
| `habit_why` / `habit_notes` | habit.id | `habit.name` |
| `routine_step` | tile.id (+ step.id?) | `routine.name` |
| `calendar_notes` / `calendar_workDescription` / etc. | event.id | `event.title \|\| date` |
| `reps_reflection` | session.id | `move.name` (via `session.moveName`) |
| `sparring_notes` / `sparring_reflection` | session.id | "Spar — {date}" (no title field) |
| `spar1v1_journal` | session.id | `session.opponent \|\| "1v1 Spar"` |
| `musicflow_reflection` | session.id | "Flow — {date}" |
| `rival_signatureMoves` / `gamePlan` / `sparringJournal` / `targetWhen` / `targetWhere` / `crew` / `city` | rival.id | `rival.name` |
| `rival_battle_*` | rival.id (+ battle.id) | `rival.name` ` — ` `battle.event \|\| battle.date` |
| `battleprep_plan_*` | plan.id | `plan.eventName \|\| plan.planName` |
| `battleprep_battle_reflection_*` | plan.id (+ battle.id) | `plan.eventName \|\| plan.planName` ` — ` `battle.date` |
| `profile_*` | (singleton) | `t("myProfile")` or `profile.nickname` |
| `reminder_text` | item.id | `t("myNotes")` |
| `presession_*` | (singleton) | `t("beforeYouTrain")` |

Most labels resolve from a single canonical-record field. **No exotic resolution logic required.** But notice: several stores have NO natural label (Spar Solo, Music Flow, Pre-session) and would need a date-derived synthetic label. Section 6 question.

---

## Section 3 — Write-site enumeration (flat list)

Every UI write site that puts user-authored text into a canonical store. Grouped by store for navigability.

```
# mb_moves
- src/components/moves/MoveModal.jsx:147               → move.name (Inp)
- src/components/moves/MoveModal.jsx:149               → move.description (Txtarea)
- src/components/moves/MoveModal.jsx:154               → move.link (raw input)
- src/components/moves/MoveModal.jsx:603-619           → move.journal[].text (append; entry shape {id, date, text})
- src/components/moves/MoveModal.jsx:635               → move.journal[] (delete entry)
- src/components/home/HomePage.jsx:1206-1219           → move.journal[].text (HOME Updates append)
- src/components/home/HomePage.jsx:1244-1249           → move.journal[] (HOME Updates delete entry)
- src/components/moves/BulkModal.jsx:18-20             → move.name × N (bulk paste import)
- src/components/moves/Lab.jsx:269-284                 → move.name + .description (Lab "create variation" save)
- src/components/battle/FlowMap.jsx:639                → move.name + .description (Flow Map "interesting" → save move)
- src/hooks/useMoveCrud.js:10-16                       → move.* (saveMove central)
- src/hooks/useMoveCrud.js:50-53                       → move.name (dupMove " (copy)" suffix — derived)

# mb_ideas
- src/components/train/GoalModal.jsx:42-54             → idea.{title, description, link} (goal create/edit)
- src/components/train/GoalModal.jsx:102               → idea.journal[].{text, link} (append)
- src/components/train/GoalModal.jsx:112               → idea.journal[] entry.{text, link} (in-place edit)
- src/components/train/GoalModal.jsx:57                → idea.journal[] (delete entry)
- src/components/train/TargetGoalModal.jsx:32-37       → idea.{title, unit, link} (target create/edit)
- src/components/train/TargetGoalModal.jsx:84          → idea.journal[].{text, link} (append)
- src/components/train/TargetGoalModal.jsx:96          → idea.journal[] entry.{text, link} (in-place edit)
- src/components/train/TargetGoalModal.jsx:40          → idea.journal[] (delete entry)
- src/components/train/NoteModal.jsx:24                → idea.{title, text, link} (note create/edit)
- src/components/home/IdeaForm.jsx:27-32               → idea.{title, text, link} (note create via HomeAddPicker)
- src/components/home/HomePage.jsx:579                 → idea.{title, text, link} (handleCreateIdea)
- src/components/home/HomePage.jsx:470-471             → idea.* (handleEditSave for note)
- src/components/home/HomePage.jsx:1128-1130           → idea.* (handleEditSave for goal via GoalModal)
- src/components/home/HomePage.jsx:1271-1273           → idea.* (handleEditSave for goal via journalGoalTile)
- src/components/reflect/ReflectPage.jsx:163-181       → idea.* (handleSaveAddToHomeNote — REFLECT → HOME loop)
- src/App.jsx:744-745                                  → idea.* (TrainModalCtx note save dispatch)
- src/App.jsx:746-749                                  → idea.* (TrainModalCtx goal save dispatch)
- src/App.jsx:750-754                                  → idea.* (TrainModalCtx target save dispatch)

# mb_habits
- src/components/train/HabitModal.jsx:105              → habit.{name, why, notes}
- src/components/home/HomePage.jsx:1112-1114           → habit.* (handleEditSave)
- src/components/home/HomePage.jsx:602-604             → habit.* (handleCreateHabit)

# mb_home_stack (routines)
- src/components/home/RoutineForm.jsx:33-39            → tile.{name, steps[].text}
- src/components/home/HomePage.jsx:572-575             → tile.* (handleCreateRoutine)
- src/components/home/HomePage.jsx:450-466             → tile.{name, steps[]} (handleEditSave for routine; default + override paths)
- src/components/home/HomePage.jsx:494-499             → tile.* (handleEditScopeJustToday — append override)
- src/components/home/HomePage.jsx:506-513             → tile.* (handleEditScopeAllDays)

# mb_calendar.events
- src/components/calendar/SessionJournal.jsx:116-130   → event.{title, notes, workDescription, eventLink} (manual)
- src/components/logToday/LogTodayTraining.jsx:84-99   → event.{title, workDescription, howItFelt, location, videoLink, notes} (LogToday create + edit)
- src/components/train/RepCounter.jsx:113-122          → event.title, .notes (auto, template)
- src/components/train/Sparring.jsx:372-381            → event.title, .notes (auto, template + user notes pass-through)
- src/components/train/Spar1v1.jsx:299-307             → event.title, .notes (auto, template + user location embed)
- src/components/battle/CompetitionSimulator.jsx:482-491 → event.title, .notes (auto, template + user notes pass-through)
- src/components/train/MusicFlow.jsx:108-111           → event.title (auto, template)
- src/components/moves/FlashCards.jsx:77-83            → event.title (literal "Flash Cards")
- src/components/train/ComboMachine.jsx:174-182        → event.title, .notes (auto-generated combo text)
- src/components/moves/Lab.jsx:289-296                 → event.title (auto, template)
- src/components/moves/RestoreRemixRebuild.jsx:283-293 → event.title, .notes (auto, template + user notes embed with "Prompt: " prefix)
- src/components/home/HomePage.jsx:336-346             → event.title (routine echo on step completion)
- src/components/home/HomePage.jsx:476-485             → event.title, .text (note→calendar mirror on edit if showDate set)
- src/components/home/HomePage.jsx:581-590             → event.title, .text (note→calendar mirror on create if showDate set)
- src/components/reflect/ReflectPage.jsx:172-179       → event.title, .text (Add-to-Home note mirror)
- src/components/train/BattlePrepSetup.jsx:179-181     → event.title (battle-date events from new plan)
- src/components/battle/RivalsPage.jsx:305-313         → event.title, .notes (battle log template)
- src/App.jsx:634-643                                  → addCalendarEvent central (dedupe + persist)
- src/App.jsx:649-656                                  → updateCalendarEvent central
- src/components/calendar/CalendarOverlay.jsx:107-128  → event.* (handleSaveEvent — accepts SessionJournal output)

# mb_reps
- src/components/train/RepCounter.jsx:99-111           → reps[].* (createSession; no text fields at create)
- src/components/train/RepCounter.jsx:48-58            → reps[].reflection (debounced post-save update)
- src/components/train/RepCounter.jsx:54-58            → reps[].reflection (synchronous flush on close)
- src/App.jsx:662-664                                  → onUpdateRepSession central

# mb_sparring (sessions[])
- src/components/train/Sparring.jsx:313-368            → sparring.sessions[].{notes, reflection}
- src/components/battle/CompetitionSimulator.jsx:451-478 → sparring.sessions[].{notes, reflection} (with isCompetition flag)
- src/App.jsx:775-786                                  → setSparring central wiring

# mb_sparring (sessions1v1[])
- src/components/train/Spar1v1.jsx:234-249             → sparring.sessions1v1[].{opponent, location} (initial capture at session-end)
- src/components/train/Spar1v1.jsx:260-266             → sparring.sessions1v1[].{opponent, location, journal} (final on save)
- src/components/train/Spar1v1.jsx:295                 → sparring.sessions1v1[] (persist via onSaveSession)
- src/components/train/Spar1v1.jsx:320-324             → rivals[].sparHistory[] (auto-link denormalized copy)
- src/components/train/Spar1v1.jsx:391-425             → rivals[] new person + sparHistory[0] (after-save add-person flow)

# mb_musicflow
- src/components/train/MusicFlow.jsx:89-106            → musicflow.sessions[].* (createSession; no text fields at create)
- src/components/train/MusicFlow.jsx:73-87             → musicflow.sessions[].reflection (debounced + sync flush)
- src/App.jsx:665-670                                  → onUpdateMusicflowSession central

# mb_sets
- src/components/battle/ReadyPage.jsx:146              → set.{name, notes:""} (initial; via NameModal)
- src/components/moves/SetDetailModal.jsx:42-47        → set.{name, color, link, mastery, notes (frozen pass-through), details, date}
- src/components/train/ComboMachine.jsx:163-170        → set.{name, color, moveIds, notes:comboText, mastery:0, date} (Combine save)
- src/App.jsx:794-797                                  → onSaveSet central wiring (Combine)

# mb_rounds
- src/components/battle/ReadyPage.jsx:135-141          → round.{name, color, notes:"", date, entries[].name} (initial via NewRoundModal)
- src/components/battle/EditRoundView.jsx:21-24        → round.{name, color, notes, entries} (edit)
- src/components/battle/EditRoundView.jsx:28           → round.entries[].name (auto-generated on add)
- src/components/battle/EditRoundView.jsx:15-16        → round.entries[].name (rename — `setRenaming`/`renameVal` flow)

# mb_custom_attrs
- src/components/modals/AttributeModal.jsx:46-52       → customAttrs[].{name, multi, values[]}
- src/components/moves/MoveModal.jsx:657-660           → customAttrs[] (passes through onAddAttr)
- src/App.jsx HomePage wiring at 758,1157              → setCustomAttrs

# mb_rivals
- src/components/battle/RivalsPage.jsx:92-95           → rivals[] (addRival; createdDate ISO)
- src/components/battle/RivalsPage.jsx:96-98           → rivals[].* (updateRival; updatedDate ISO)
- src/components/battle/RivalsPage.jsx:272-286         → rivals[].{name, crew, city, instagram, signatureMoves, gamePlan, targetWhen, targetWhere, sparringJournal, videoRefs[].{url, label}, …} (handleSave)
- src/components/battle/RivalsPage.jsx:289-314         → rivals[].battles[] append (battle log) + linked calendar event
- src/components/battle/RivalsPage.jsx:106-131         → rivals[].sparHistory[] append (JSON import)

# mb_battleprep
- src/components/train/BattlePrepSetup.jsx:171-184     → battleprep.plans[] append (handleActivate; eventName, planName, eventUrl, location, customPhases[].name)
- src/components/train/BattleDayView.jsx:98-100        → plans[].battleDay.{checklist, customItems[].text} (persistChecklist)
- src/components/train/BattleDayView.jsx:114-121       → plans[].battleDay.customItems[].text (addCustomItem)
- src/components/train/BattleDayView.jsx:283-311       → plans[].battles[].reflection.{takeaway, whatWorked, needsWork, changeTraining}

# mb_profile
- src/components/modals/ProfileModal.jsx:96            → profile.nickname
- src/components/modals/ProfileModal.jsx:144           → profile.goals
- src/components/modals/ProfileModal.jsx:151           → profile.why

# mb_reminders
- src/components/modals/ProfileModal.jsx:31-39         → reminders.items[].text (append)
- src/components/moves/ManageReminders.jsx:30-40       → reminders.items[].text (in-place edit)
- src/components/moves/ManageReminders.jsx:42-50       → reminders.items[].text (append)
- src/components/moves/ReminderBlock.jsx:56-64         → reminders.items[].text (append)
- src/components/moves/ReminderBlock.jsx:66-76         → reminders.items[].text (in-place edit)

# mb_presession
- src/components/home/PostSessionPrompt.jsx:14-22      → presession.{fromLastSession, fromFootage}
- src/components/home/PreSessionIntel.jsx:24-28        → presession.{fromLastSession | fromFootage} (in-place edit)
- src/components/home/PreSessionIntel.jsx:30-32        → presession.{fromLastSession | fromFootage} (clear)
- src/components/home/PreSessionIntel.jsx:34-41        → presession.wantToTry[] append
- src/components/home/PreSessionIntel.jsx:43-48        → presession.wantToTry[] delete

# mb_lab
- src/components/moves/Lab.jsx:131-151                 → lab.customChips[pool][category] (add/remove user-typed chip labels)

# mb_cats (renames possible but not via UI — only add at AddCategoryModal)
- src/components/moves/AddCategoryModal.jsx:23         → cats[] append (user-typed name)

# mb_freestyle_saved (LOCAL ONLY — not in App.jsx state)
- src/components/battle/FreestylePage.jsx:88-92        → freestyleSaved[].name (append)
- src/components/battle/FreestylePage.jsx:100          → freestyleSaved[] (delete)
```

---

## Section 4 — Special cases & surprises

### 4.1 — Orphan stores (no UI write site found)

**`mb_injuries`** — declared in [App.jsx:215–218](src/App.jsx:215) and rehydrated at [App.jsx:445](src/App.jsx:445). Read by [ReflectPage.jsx:74–79,99](src/components/reflect/ReflectPage.jsx:74) (history rendering of resolved injuries) and [HomePage.jsx:79](src/components/home/HomePage.jsx:79) (received as prop — but the destructured names start with `_` indicating intentional non-use). **No UI write site found in the inspected codebase.** Either there is a write surface elsewhere I haven't found, or this is a deferred/planned feature where the read code is in place but the create/edit modal isn't built yet. Recommend: confirm with Beppuzzo whether the injury form is missing or whether `mb_injuries` is a dormant store.

The `injuries[].description` field that ReflectPage reads at [ReflectPage.jsx:120](src/components/reflect/ReflectPage.jsx:120) and `injuries[].bodyPart` etc. are **read-only references to a store that nothing writes** — full-orphan reads. Flag as design debt.

### 4.2 — Deprecated / frozen fields still present in storage

- **`move.notes`** ([storage.js:11](src/utils/storage.js:11)) — present in `migrateMove`, default `""`, no UI write site found. Likely deprecated in favor of `journal[]`. Read sites: none active. Recommend cleanup separately.
- **`set.notes`** — see Section 1.13. Pass-through only at edit; only Combine writes user-influenced content (and that is auto-generated combo text, not user narrative).
- **`idea.why` / `idea.steps[]` / `idea.obstacles`** ([GoalModal.jsx:14–24](src/components/train/GoalModal.jsx:14)) — preserved on read for un-migrated goals; stop being writable once `legacyMigrated:true`. Records older than the description-rewrite still carry these. **For TextStream migration: backfill must consult these.**
- **Old `move.journal[].id` shape:** `Date.now()` integer rather than UUID. Collision risk under burst writes within the same millisecond — non-zero in theory. Flag.

### 4.3 — Fields with overlapping semantics (design debt)

- **`move.notes` vs `move.description` vs `move.journal[]`** — three potentially-narrative-text fields on the same record. `notes` deprecated, `description` is "what is this move", `journal[]` is "training notes over time". Documented but worth flagging.
- **`set.notes` vs `set.details`** — same Set record. `details` is the live edit field; `notes` is frozen / Combine-payload only.
- **`idea.text` vs `calendar.events[].text`** — when a note has `showDate`, both stores carry the same string (HomePage mirrors at create + edit). Edits to the note do NOT propagate to the calendar event ([HomePage.jsx:473](src/components/home/HomePage.jsx:473) acknowledges this with a TODO comment).
- **`sparring.sessions1v1[].journal` (string) vs `move.journal[]` (array of objects) vs `idea.journal[]` (array of objects with localized date)** — same field name, three different schemas. Naming collision; flag for migration.
- **`rivals[].sparringJournal` (string) vs the above three** — fourth use of "journal".

### 4.4 — Date format outliers

See Section 2 / Concern 1. Most surprising:

- **`idea.journal[].date` is `toLocaleDateString("en-AU")`** — e.g. `"09 May 2026"`. Every other journal-shape uses `todayLocal()` YYYY-MM-DD. Almost certainly an oversight from when GoalModal was written. The CalendarOverlay aggregator's `toYMD()` falls through to `new Date(string)` parsing, which works in V8 but is browser-dependent. **Latent bug.**
- **`reps[].date` and `sparring.sessions[].date` are full ISO 8601** while `flashcards.bestScore.date` and `Sets[].date` are `todayLocal()` YMD. Documented in LogToday Concern 2; restated here for completeness.

### 4.5 — Auto-generated content masquerading as user text

- **`set.notes = comboText`** at [ComboMachine.jsx:167](src/components/train/ComboMachine.jsx:167) — string like ``"Move A → Thread → Move B → Sweep → Move C"``. Auto-generated from selection, not user-typed. **Should NOT enter TextStream as a user-text record.**
- **`calendar.events[].notes = notesWithPrompt`** at [RestoreRemixRebuild.jsx:282](src/components/moves/RestoreRemixRebuild.jsx:282) — concatenates user-typed `summaryNotes` with literal English `"Prompt: <prompt>"`. Mixed content. The user portion is fair game; the template prefix is not.
- **`calendar.events[].notes = ${t("locationLabel")}: ${session.location}``** at [Spar1v1.jsx:304](src/components/train/Spar1v1.jsx:304) — template + user content. The user `location` is captured canonically at `sparring.sessions1v1[].location`; this calendar-event copy is a derived view.
- **`calendar.events[].title`** in all auto-capture writes — template strings embedding canonical user content. Already discussed in Section 1.7.
- **`calendar.events[].notes = `Result: ${...} — ${entry.event}`** at [RivalsPage.jsx:310](src/components/battle/RivalsPage.jsx:310) — same pattern.
- **Goal `description` legacy dump** at [GoalModal.jsx:31](src/components/train/GoalModal.jsx:31) — wraps user `why`/`steps[]`/`obstacles` with translated headers `legacyDumpWhy`/`legacyDumpSteps`/`legacyDumpObstacles`. The field becomes a hybrid of user content and translated headers after first edit.

**Design implication:** TextStream entries should source from the **canonical user-input field**, not from the auto-generated derivative. E.g., the user's Spar 1v1 location should yield ONE `spar1v1_location` entry sourced from `sparring.sessions1v1[].location`, not also a `calendar_notes` entry sourced from the templated mirror.

### 4.6 — Custom Attribute values & Lab custom chips: include or exclude?

Both are user-authored short labels (typically ≤ 3 words):
- `customAttrs[].name` (e.g., "Concept") and `customAttrs[].values[]` (e.g., ["Loop", "Spin", "Drop"])
- `lab.customChips[pool][cat]` (e.g., "Like a wave")

These are **lookup data** — they parameterize the move-tagging UI, not narrative content. They are persisted, edited via dedicated modals, and never displayed as "user writing" anywhere. Recommend exclude. **Open question Section 6 (confirm).**

### 4.7 — Categories: include or exclude?

`mb_cats` carries user-renamable strings. But every `move.category` references one by string-key, so renaming is a multi-record update (not yet implemented in UI; only **add** is supported via [AddCategoryModal.jsx:23](src/components/moves/AddCategoryModal.jsx:23)). Categories are pure lookup keys. Exclude.

### 4.8 — Fields captured but never displayed

Fields marked "None inspected actively" in Section 1 — possible orphan-read candidates:

- `habit.why` (HabitModal write, no read surface found)
- `habit.notes` (same)
- `reps[].reflection` (RepCounter writes via debounce, no read surface found in CalendarOverlay or elsewhere)
- `sparring.sessions[].notes` (Sparring writes, no read surface found — though it does flow to the calendar event note as a copy)
- `sparring.sessions[].reflection` (same)
- `sparring.sessions1v1[].journal` (same)
- `musicflow.sessions[].reflection` (MusicFlow writes via debounce, no read surface)
- `round.notes`

These represent "captured-but-buried" user text. **TextStream migration is independently valuable for these** — even if no surface reads them today, the canonical record holds them and they can be surfaced via TextStream's cross-cutting reads.

I did not exhaustively grep every component for read sites; some of these may have read surfaces I missed (e.g., share cards, export flows). The "no read found" claim is best-effort, not definitive. Flag for explicit verification before migration.

### 4.9 — `mb_freestyle_saved` is not in App-level state

This local-only store ([FreestylePage.jsx:80](src/components/battle/FreestylePage.jsx:80)) carries user-typed list `name`. It is NOT registered with `dbSave.current` and is NOT synced to Firestore. To include in TextStream, state would need to lift to App.jsx first. **Open question Section 6.**

### 4.10 — `dupMove` derives a name (`" (copy)"` suffix)

[useMoveCrud.js:50–53](src/hooks/useMoveCrud.js:50). The new move's `name` is derived (`m.name + " (copy)"`), not user-typed at the moment of creation. The user can subsequently rename it. For TextStream: only the LATER user-rename should produce a TextStream entry; the initial duplicate write is an artifact. Edge case to flag in the wrap.

### 4.11 — Drafts are explicitly out of scope

Many components hold transient editor buffers (newJournalText, addText, editText, etc.). All persist nothing on close. Listed in Section 1.24 for completeness; do not migrate.

### 4.12 — Duplicate-write ripple from a single user save

Several user actions write the same content into multiple stores:

- **Note with `showDate`** → `idea.text` AND `calendar.events[].text` ([HomePage.jsx:579–589](src/components/home/HomePage.jsx:579))
- **Spar 1v1 with linked person** → `sparring.sessions1v1[].opponent/location/journal` AND `rivals[].sparHistory[]` ([Spar1v1.jsx:320–324](src/components/train/Spar1v1.jsx:320))
- **Routine step completion** → `homeChecks[date]` AND `calendar.events[].title` (echo of routine.name) ([HomePage.jsx:336–346](src/components/home/HomePage.jsx:336))
- **Battle log on rival** → `rivals[].battles[]` AND `calendar.events[].notes` ([RivalsPage.jsx:305–313](src/components/battle/RivalsPage.jsx:305))
- **All session saves with auto-capture** → primary store AND calendar event (LogToday dossier covers this in detail)

For TextStream: define which side is canonical and emit the entry from that side only. Recommend the **deepest store** (idea, sparring, rivals, etc.) is canonical; calendar event copies are derivatives.

---

## Section 5 — Recommendations

### 5.1 — Suggested migration order (lowest risk first)

Each batch corresponds to wrapping a single setter / write helper to dual-write into TextStream.

**Batch A — single-write, single-surface, simple shape:**
1. `mb_profile` (`nickname`, `goals`, `why`) — singleton record, single modal, simple overwrite.
2. `mb_reminders.items[].text` — wrap `setReminders`/`onRemindersChange`; covers all three surfaces.
3. `mb_presession` (`fromLastSession`, `fromFootage`, `wantToTry[].text`) — wrap `setPresession`.

**Batch B — mid-complexity single-store:**
4. `mb_habits` (`name`, `why`, `notes`) — wrap `setHabits`.
5. `mb_home_stack` routine `name` + `steps[].text` — wrap `setHomeStack`. Routines have the most complex shape (default/override structure) but a single setter.

**Batch C — ideas (notes/goals/targets) — multi-flavor single store:**
6. `mb_ideas` notes (`title`, `text`) — wrap `setIdeas`. Mirror to `calendar.events[].text` becomes derivative once TextStream is the source of truth.
7. `mb_ideas` goals (`title`, `description`) + targets (`title`).
8. `mb_ideas.journal[]` (goal + target) — append + edit. Address date-format outlier (Concern 1) at the wrap point: normalize to ISO on write.

**Batch D — moves:**
9. `mb_moves` (`name`, `description`) — wrap `useMoveCrud.saveMove` plus the Lab/FlowMap/BulkModal direct setters.
10. `mb_moves.journal[]` — append + delete (no in-place edit).

**Batch E — calendar events:**
11. `mb_calendar.events` user-typed text fields (`title`, `notes`, `workDescription`, `howItFelt`, `location`, `text`) — wrap `addCalendarEvent` and `updateCalendarEvent`. Skip auto-capture writes (template-generated) — they pass through as derivative.

**Batch F — sessions:**
12. `mb_reps[].reflection` — wrap `onUpdateRepSession`.
13. `mb_sparring.sessions[].{notes, reflection}` — wrap `setSparring` (filtering by `isCompetition` if needed).
14. `mb_sparring.sessions1v1[].{opponent, location, journal}` — single string `journal` becomes a single TextStream entry per save; `opponent`/`location` carry through.
15. `mb_musicflow.sessions[].reflection` — wrap `onUpdateMusicflowSession`.

**Batch G — rivals (highest complexity):**
16. `mb_rivals` simple text fields (`name`, `crew`, `city`, `signatureMoves`, `gamePlan`, `targetWhen`, `targetWhere`, `sparringJournal`) — wrap `setRivals`/`onRivalsChange`.
17. `mb_rivals.battles[]` (event, howDidItGo, whatSurprised, trainingNext) — append-only.

**Batch H — battle prep:**
18. `mb_battleprep.plans[].{eventName, planName, location}` (skip `eventUrl`) — wrap `setBattleprep` plan-create path.
19. `mb_battleprep.plans[].battles[].reflection.*` — wrap reflection save in BattleDayView.
20. `mb_battleprep.plans[].battleDay.customItems[].text` — append.

**Skip / defer:**
- `mb_sets.notes` (deprecated/frozen) and `mb_sets.details` (decide whether `details` is worth migrating; it has only one write site and limited cross-cutting value).
- `mb_rounds` and round entries (all label-data candidates).
- `mb_freestyle_saved` (out of central state).

### 5.2 — Fields to exclude from TextStream (with reasoning)

| Field | Exclusion reason |
|---|---|
| All URL/`link` fields (move, idea, set, video refs, `instagram`, `eventUrl`, `videoLink`, `eventLink`) | Structural data, not narrative. URLs don't benefit from cross-cutting search/look-back. |
| `move.notes` | Deprecated; no UI writer. |
| `set.notes` | Frozen / auto-generated combo content, not user narrative. |
| `set.details` | Only one write site; consider a "phase 2" candidate but skip in initial migration unless demand emerges. |
| `customAttrs[].name`, `customAttrs[].values[]` | Lookup/label data parameterizing UI, not narrative. |
| `lab.customChips[*][*]` | Same — chip labels. |
| `mb_cats` | Pure lookup keys. |
| `round.entries[].name` (when auto-default) | Mostly auto-generated; rename minority is short label data. |
| `customPhases[].name` (battleprep) | Short label data. |
| `mb_freestyle_saved.name` | Local-only store; not in central state. Lift state first if needed. |
| `stance.assessments[]` | Numeric scores only — no user text. |
| `mb_injuries` | Apparent orphan store; resolve separately before any migration. |
| FeedbackModal text | Sent via EmailJS, not persisted. |
| All draft/transient buffers | Per Section 1.24. |
| Auto-capture calendar event `title` and template-generated `notes` | Derivative of canonical user content (move name, opponent name, etc.) — TextStream entries should source from canonical store, not the calendar mirror. |

### 5.3 — Discipline mechanism — wrap point and rule wording

**Where to install runtime dev-mode assertions** (so any future write that bypasses the wrap fires a console.warn):

The cleanest single hook point is **`useEffect`-driven `saveLocal` calls** at [src/utils/storage.js:35–42](src/utils/storage.js:35) — every persist passes through here. An assertion that compares the previous-vs-current array length and complains if a text-bearing field changed without a corresponding TextStream emit would catch most leaks.

Alternatively, wrap the React state setters at the App level. `setMoves`, `setIdeas`, `setSparring`, `setRivals`, etc. could be replaced with thin wrappers (`setMovesWithStream`) that detect text-field deltas and emit. This is closer to the data and easier to reason about per-store.

Given the codebase's use of inline `setX(prev => ...)` updaters all over, the dev-mode assertion is best placed at the *storage* layer (after the React state has flushed) to catch all paths.

**Suggested CORE_PRINCIPLES rule wording (draft):**

> **TextStream invariant.** Any user-authored text field that ships in a canonical store must also be emitted to TextStream on save. The list of such fields is documented in `docs/research/UserText_Storage_Inventory.md`. Adding a new text field requires:
> 1. Adding it to the inventory dossier.
> 2. Wiring the canonical write to also emit a TextStream entry (`source_type`, `source_id`, `source_label`, `text`, `created_at`, with optional `superseded_at`/`superseded_by` for in-place edits).
> 3. Verifying the dev-mode assertion does not warn during a save round-trip.
>
> If a field is intentionally excluded (e.g., URLs, label data, drafts), record the exclusion in the dossier's Section 5.2 with reasoning.

### 5.4 — Notes on the supersede mechanism

Existing in-place edit patterns (Section 2 / Concern 4) all overwrite without history. For TextStream's supersede:

- For **append-then-edit** stores (`idea.journal[]`): each new entry is a fresh TextStream record. An in-place edit produces a NEW TextStream entry with `superseded_at` set on the prior entry, `superseded_by` pointing at the new id. The canonical entry's `id` need not change.
- For **single-string overwrite** stores (`profile.why`, `habit.notes`, `reps[].reflection`, etc.): every save produces a new TextStream entry with `superseded_at` on the prior.
- For **debounced overwrites** (`reps[].reflection`, `musicflow.sessions[].reflection`): debounce matches with TextStream entry generation — emit only on flush, not per-keystroke.

---

## Section 6 — Open questions

1. **Custom Attributes & Lab chips: include or exclude?** Recommended exclude (5.2) on the basis that they are lookup/label data, not narrative. Confirm.

2. **Set `details` field: include or exclude?** Single write site, modest cross-cutting value. Defer to phase 2?

3. **`mb_injuries` orphan store:** is the injury form genuinely missing from the codebase, or is the writer somewhere I haven't found? If it's missing, that's a separate cleanup issue. If it exists, document its write site and add to Section 1.

4. **`idea.journal[].date` format outlier (`"09 May 2026"`):** this is a latent bug in CalendarOverlay's day aggregation. Should it be normalized in a separate cleanup pass BEFORE TextStream migration, or normalize-on-migrate (write ISO when emitting the TextStream entry, leave canonical as-is)? Question for chat.

5. **`mb_freestyle_saved`** is local-only. Lift state to App.jsx first, or skip from migration entirely?

6. **`sparring.sessions1v1[].journal` (single string):** when the user edits a 1v1 session's journal (currently overwrites the string), do we emit a NEW TextStream entry with supersede, or treat each save as an idempotent "current state" write? The current UX says only one journal value exists per session.

7. **Source-label resolution for sessions without titles** (Spar Solo, Music Flow, Pre-session Intel singletons): synthetic "Spar — May 9" / "Flow — May 9" / "Before You Train" labels OK, or is there a richer derivation we should prefer?

8. **Backfill strategy:** when TextStream first ships, do we backfill from existing canonical records (one-time migration script), or only emit going forward? Backfilling preserves history but the legacy date format outlier (Concern 1) and `idea.legacyMigrated:false` records (legacy goal `why`/`steps[]`/`obstacles`) complicate it.

9. **Duplicate-write reconciliation** (Section 4.12): when both `idea.text` and `calendar.events[].text` are written for a note-with-showDate, does the TextStream emit once (from `idea.text`) or twice? Recommend once.

10. **Auto-capture calendar event titles/notes:** recommended exclude as derivative (5.2). Confirm — or include them as their own `source_type`s?

11. **Storage doubling on mobile** (Concern 7): TextStream as a parallel localStorage store could push past Capacitor WebView quotas for heavy users. Acceptable risk given dev-mode-only data, or design Firestore-first from day one?

12. **Capacity vs scope:** is `set.details` worth migrating, or is set-level text just not narrative-heavy enough to bother?

---

*End of dossier. No source code was modified.*
