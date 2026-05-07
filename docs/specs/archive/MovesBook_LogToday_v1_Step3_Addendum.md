# MovesBook — Log Today v1 — Step 3 Addendum

**Status:** Step 3 design locked. Code not yet written. **Flow inventory pass resolved** (see §7).
**Parent spec:** `MovesBook_LogToday_v1.md` (this addendum overrides where they conflict)
**Source of facts:** `docs/research/LogToday_v1_AutoCapture_Inventory.md` (the dossier; commit `998772e`, branch `v2`; Sources 1–6 + Source 7 (Flow) at lines 278–335)
**Aligned with:** `MovesBook_DesignSystem_v2_0.md`

---

## PURPOSE

This addendum resolves Open Question #1 from the parent v1 spec: the auto-capture data model. It captures the technical decisions for how the Training sub-tab **queries**, **displays**, **deduplicates**, and **writes** its session record.

It supersedes any conflicting guidance in the parent spec. Where the dossier surfaced surprises that change the parent spec's assumptions, this addendum is the canonical version.

This is a design decision document, not implementation. Before any Claude Code prompt is written, the working protocol applies: re-grep deployed code (the commit cited above will have moved), present analysis, ask permission, then write.

---

## METHODOLOGY

The decisions were derived in three layers:

1. **Spec principles** — "Mirror, not coach" / "Co-authored over self-reported" / auto-capture is for committed practice (parent spec, lines 22–23, 121). These principles dictate what gets surfaced and what doesn't.
2. **Deployed reality** — the dossier inventoried six auto-capture sources plus four cross-cutting concerns. Where the codebase has already decided something (e.g. `todayLocal()` as the canonical day-key), we inherit. Where it hasn't (e.g. soft-remove on session records), we pick.
3. **Pattern continuity** — when a precedent exists in the codebase, we extend it rather than introduce a parallel mechanism. `homeStack.overrides[date].removed` is the precedent for per-day soft-hide; the existing Calendar `dayData` `useMemo` is the precedent for multi-store day queries.

Where there was a real fork — soft-remove store shape, dedup priority, SessionJournal migration, Flow inclusion — the choice is justified inline.

---

## 1. AUTO-CAPTURE SOURCES — LOCKED

The Training sub-tab surfaces these seven sources. Each is a separate **bucket** [a named group of rows] in the rendered list. Within a bucket, rows render with that source's native fields — there is no normalized cross-source row shape.

| # | Source | Bucket key | Query rule | Calendar event `source` (if any) |
|---|---|---|---|---|
| 1 | Drill | `drillSessions` | `(reps \|\| []).filter(r => toYMD(r.date) === d)` | `"rep_counter"` |
| 2 | Spar — Solo | `sparSoloSessions` | `(sparring?.sessions \|\| []).filter(s => toYMD(s.date) === d)` | `"sparring"` |
| 3 | Spar — 1v1 | `sparOneVoneSessions` | `(sparring?.sessions1v1 \|\| []).filter(s => toYMD(s.date) === d)` | `"spar-1v1"` |
| 4 | Sets practice (FlashCards) | `setsPracticed` | `(calendar?.events \|\| []).filter(e => e.date === d && e.source === "flashcards")` | `"flashcards"` (also `type: "flashcards"`) |
| 5 | Combine — saved combo | `savedCombos` | `(calendar?.events \|\| []).filter(e => e.date === d && e.source === "combo_machine")` | `"combo_machine"` |
| 6 | Move-tile trained tap | `movesTrained` | `(moves \|\| []).filter(m => toYMD(m.date) === d)`, then dedup-filtered (see §2) | None — no calendar event written |
| 7 | Flow | `flowSessions` | `(musicflow?.sessions \|\| []).filter(s => toYMD(s.date) === d)` | `"musicflow"` |

### 1.1 Tile rendering — bucket-by-bucket

Each bucket gets its own renderer because the underlying record shapes diverge sharply. The Spar bucket has **two sub-renderers** because Solo and 1v1 share a store but not a shape (dossier §3, lines 121–166).

| Bucket | Tile content (first line) | Tile content (second line) | Expandable? |
|---|---|---|---|
| `drillSessions` | "Drill — {moveName}" | "{reps} reps · {duration}" | No |
| `sparSoloSessions` | "Solo Spar" | "{rounds} rounds · {totalDuration}" | Optional: chevron expands `movesTrained[]` |
| `sparOneVoneSessions` | "1v1 Spar vs {opponent}" | "{userRounds}–{opponentRounds} · {location}" | Optional: chevron expands `roundLog` |
| `setsPracticed` | Set name (resolved via `setId` — see §7) | "{correct}/{total} correct" | Yes — chevron shows `moveIds[]` from the linked Set |
| `savedCombos` | Set name from event title | Combo text from `notes` (already includes `→` arrows) | Yes — chevron shows `moveIds[]` from event |
| `movesTrained` | Move name | Move category | No |
| `flowSessions` | "Flow" | "{duration} · Stage {stageReached} · {promptCount} prompts" | Optional: chevron expands `reflection` text if present |

Each row carries an X button (soft-remove) and supports long-press for hard-delete. See §4.

---

## 2. DEDUP PRIORITY — THE 7-TIER RULE

**The structural finding the parent spec missed.** A single Drill save touches three stores (`mb_reps`, `mb_moves` via `m.date` mutation at `App.jsx:754`, `mb_calendar.events` with `source: "rep_counter"`) — dossier line 462. A single Spar Solo with tagged moves does the same. Without dedup, the Training sub-tab would render one action up to three times.

Calendar tolerates this because Calendar is a forensic surface [shows everything that touched the day]. Log Today is a curated session summary — triple-rendering is a design failure.

### 2.1 The priority order (locked)

When building the Training sub-tab's bucket list, apply in order:

1. **`drillSessions`** — authoritative for Drill. `mb_reps[]` is the source of truth.
2. **`sparSoloSessions`** — authoritative for Solo Spar. `mb_sparring.sessions[]` is the source of truth.
3. **`sparOneVoneSessions`** — authoritative for 1v1 Spar. `mb_sparring.sessions1v1[]` is the source of truth.
4. **`savedCombos`** — calendar events with `source: "combo_machine"` are authoritative. The matched Set in `mb_sets` is read for chevron expansion only.
5. **`setsPracticed`** — calendar events with `source: "flashcards"` are authoritative. The matched Set is read for chevron expansion only (requires `setId` schema addition; see §7).
6. **`flowSessions`** — `mb_musicflow.sessions[]` is the source of truth.
7. **`movesTrained`** — show ONLY moves whose `move.date === today` AND whose `id` is **not** present in any of:
   - `drillSessions[].moveId`
   - `sparSoloSessions[].movesTrained[]`
   - `savedCombos[].moveIds[]` (from event)
   - `setsPracticed[].moveIds[]` (from linked Set)

   This bucket represents standalone tile-taps not produced by any other source.

   **Flow exempt from this dedup-against list.** Flow does not mutate `move.date` for any move (verified `MusicFlow.jsx` does not call `setMoves`; dossier Source 7 Notes paragraph). It cannot produce phantom `movesTrained` rows.

8. **`calendarEvents` blocklist** — manual session-journal events (`type === "training"` with no `source` field, or `source` not in the list below) get a separate "Manual session" bucket OR fold into the Training sub-tab as their own row type. Events whose `source` is in the dedup blocklist are **suppressed** because they're already represented by the authoritative bucket above:

   ```
   DEDUP_SOURCE_BLOCKLIST = [
     "rep_counter",
     "sparring",
     "spar-1v1",
     "combo_machine",
     "flashcards",
     "musicflow",
   ]
   ```

### 2.2 Where the dedup logic lives

In the **projection layer** that sits on top of `useDayData(date)` (see §3), not inside the hook. Calendar still wants the un-deduped view; only Log Today's Training sub-tab applies dedup.

Concretely: `useLogTodayTraining(date)` consumes `useDayData(date)`, applies the 7-tier rule, and returns the bucketed shape ready for render.

---

## 3. `useDayData(date)` — EXTRACTION SPEC

### 3.1 Why extract

The query already exists at `CalendarOverlay.jsx:107–119` (dossier §Concern 3). Log Today is the second consumer, which clears the YAGNI threshold [don't-build-shared-helpers-until-needed rule] noted in project working memory. Extracting now means:

- Calendar continues to consume the same hook unchanged.
- Log Today consumes it via its projection layer (§2).
- One query, one set of correctness guarantees.

### 3.2 What the extraction does

Move the `useMemo` body to a new hook `src/hooks/useDayData.js`. Signature:

```js
export function useDayData(date) {
  // returns { movesTrained, repSessions,
  //           sparringSessions, sparringSessions1v1,   // ← new key
  //           musicflowSessions, habitsCompleted,
  //           notesOnDay, calendarEvents }
  // or null if !date
}
```

CalendarOverlay imports and consumes the hook in place of its inline `useMemo`. Log Today consumes it from its own projection layer.

**Naming note:** the hook returns `musicflowSessions` (matching the existing field name and Calendar's existing variable). Log Today's projection layer maps it to `flowSessions` for the user-facing bucket name. No schema-level rename of the underlying store — only a local alias.

### 3.3 Bundled fix — 1v1 omission

The current `dayData` reads only `sparring?.sessions`, NOT `sparring?.sessions1v1` (`CalendarOverlay.jsx:113`, dossier line 401). This is a **pre-existing Calendar bug** — 1v1 sessions only render in the day breakdown via their calendar event, not as a dedicated row.

The extraction fixes it: the new hook adds a `sparringSessions1v1` key alongside `sparringSessions`. Both Calendar's day-detail panel and Log Today's Spar bucket benefit. No widening of scope — the fix is one line and the function is being touched anyway.

**To flag in the extraction prompt:** "Bundles a one-line fix for pre-existing 1v1 omission in Calendar's day-detail. Resolves the dossier's Concern 3 closing flag."

---

## 4. `mb_log_exclusions` — SOFT-REMOVE STORE

### 4.1 Why a new store

The dossier's Concern 4 confirmed: **no soft-remove pattern exists on session records**. Two patterns exist for other entities — `archived: true` on top-level objects, and `homeStack.overrides[date].removed[]` for per-day home-tile hiding — but neither targets sessions.

The closest precedent is `homeStack.overrides[date].removed[]` (`HomePage.jsx:28`, dossier lines 433–448). It's per-day-scoped and doesn't mutate the underlying record. Generalising that pattern to sessions is the lowest-friction path.

### 4.2 Shape

localStorage key: `mb_log_exclusions`
Firestore path (when synced): `users/{uid}/log_exclusions`

```js
{
  "2026-05-04": [
    { source: "rep_counter",   sourceId: 1714867200000 },
    { source: "spar-1v1",      sourceId: 1714870800000 },
    { source: "flashcards",    sourceId: "evt_abc123" },
    { source: "musicflow",     sourceId: 1714874400000 },
  ],
  "2026-05-05": [
    { source: "movesTrained",  sourceId: "move_42" },
  ],
  // ...
}
```

`source` matches the bucket source string from §1. `sourceId`:
- For Drill / Spar Solo / Spar 1v1 / Flow → the `id` field (Date.now() integer).
- For Sets practiced / saved combos → the calendar event's `id`.
- For movesTrained → the `move.id` string.

### 4.3 Apply rule

After §2's dedup priority produces the bucket list, filter each bucket against `mb_log_exclusions[date]`:

```js
const exclusions = log_exclusions?.[date] || [];
const isExcluded = (source, id) =>
  exclusions.some(e => e.source === source && e.sourceId === id);

// applied per bucket before render
```

### 4.4 Lifecycle

- **Tap X on a row (soft-remove):** append `{ source, sourceId }` to working state.
- **Tap X again or untoggle (restore):** remove the entry from working state.
- **Save:** working state writes to `mb_log_exclusions[date]`. Append-or-replace, not merge — Save is the truth for that day.
- **Cancel:** working state discards. The store is unchanged.
- **Long-press X (hard-delete):** writes immediately to the underlying store (deletes the record from `mb_reps`, `mb_sparring.sessions[]`, etc.). Does NOT add to `mb_log_exclusions`. Does NOT roll back on Cancel.

This produces a clean asymmetry:

| Action | Underlying record | Exclusion store | Cancel-revertible? |
|---|---|---|---|
| Tap X (soft) | Untouched | Pending until Save | Yes |
| Long-press X (hard) | Deleted immediately | Untouched | No (already gone) |
| Manual additions, free-text fields | — | — | Yes (snapshot pattern) |

---

## 5. SAVE / CANCEL STATE MODEL

Mirrors the `useRef` snapshot pattern the parent spec already references (line 213) and that Settings overlay uses today. Concretely:

- On modal open, snapshot the relevant slices into `useRef`: form fields, working exclusions, working manual additions.
- Working state is held in component state during the session.
- **Save** commits all working state in one transaction-style burst: writes session record, writes `mb_log_exclusions[date]`, calls `addCalendarEvent` for any manual additions, fires the move-date mutation hook for any tagged moves.
- **Cancel** unmounts without writing. Hard-deletes already happened (per §4.4); everything else reverts.

No auto-save per sub-tab. No partial commits. Save-or-Cancel is atomic.

---

## 6. SESSIONJOURNAL MIGRATION

The parent spec promises to "replace the current event-logging fragmentation" (line 11). Concretely:

### 6.1 The replacement

**The SessionJournal modal is removed** from the deployed UI in the same release that ships Log Today v1. Its entry points (Calendar's top "LOG SESSION" button, the floating in-content `+`, the day-tile `+`) all route to Log Today instead.

### 6.2 Reuse the underlying writes

Log Today's Save handler **reuses the existing write API**:
- `addCalendarEvent({ date, type, title, ... })` — already canonical.
- The move-date mutation pattern at `CalendarOverlay.handleSaveEvent` lines 121–142 (dossier line 476) — for tagged moves, mutate `m.date = eventObj.date`.

This is option (c) from the resolution. It avoids a parallel write path that would diverge from Calendar's writes over time.

### 6.3 Legacy events keep rendering

Existing manual events in `mb_calendar.events` (likely written by SessionJournal with no `source` field, or `source: undefined`) are **not** in the §2.1 dedup blocklist. They surface in Log Today's "Manual session" row category (or as un-deduped `calendarEvents` rows, depending on the §2.1 line 8 implementation choice). No data migration required.

### 6.4 What gets deleted from the codebase

- `src/components/calendar/SessionJournal.jsx` — modal removed.
- The "LOG SESSION" button in `CalendarOverlay.jsx`'s top bar — replaced by the unified modal launch.
- The floating in-content `+` and day-tile `+` in `CalendarOverlay.jsx` — removed per parent spec line 37.

The new "Log Today" button on HOME is the canonical surface; Calendar's top button stays but launches Log Today; Calendar's grid-tap launches Log Today prefilled to the tapped date.

---

## 7. FLOW INVENTORY — RESOLVED

Earlier draft of this addendum flagged Flow as needing a prerequisite inventory pass. **Done.** See dossier Source 7 (`docs/research/LogToday_v1_AutoCapture_Inventory.md` lines 278–335). All §1 and §1.1 table values for Flow are now verified:

- Component: `src/components/train/MusicFlow.jsx`
- Persisted at: `mb_musicflow` (`App.jsx:257`) → `users/{uid}/musicflow` (`App.jsx:313, 347`)
- Session shape: `{ id, date, duration, promptCount, stageReached }` + optional debounced `reflection` field
- Calendar event `source`: `"musicflow"` with `{ silent: true }` + explicit toast
- Companion writes: calendar event + toast only. **No `mb_moves` mutation** (this is why Flow is exempt from §2.1 tier 7's dedup-against list).
- Timestamp format: full ISO 8601 on the session record; `todayLocal()` YYYY-MM-DD on the calendar event (matches Drill/Spar dual-format pattern).

**No schema additions required for Flow.** The `flowSessions` query reads `musicflow.sessions[]` directly — the session table itself is the persistent record, so chevron expansion (showing `reflection`) has direct access. (Compare with FlashCards in §7.1 below, where `setId` had to be added to the calendar event because FlashCards has no per-session table.)

### 7.1 FlashCards calendar event must carry `setId`

Current shape (`FlashCards.jsx:77–83`, dossier line 188):

```js
addCalendarEvent({
  source: "flashcards",
  date: todayLocal(),
  title: "Flash Cards",
  type: "flashcards",
  score: { percentage, total, correct },
});
```

Required:

```js
addCalendarEvent({
  source: "flashcards",
  date: todayLocal(),
  title: "Flash Cards",
  type: "flashcards",
  score: { percentage, total, correct },
  setId: deck.setId,           // ← new
  setIds: deck.setIds || null, // ← if multi-deck sessions are possible; null otherwise
});
```

The user picks a deck before flashcarding (the per-card `results` state already holds `{ setId, gotIt }` per card per dossier line 196), so `setId` is known at write time. Without this, the Training sub-tab cannot resolve "Sets practiced today" → "which Set" → "show its moves on chevron expand."

This is a one-line code change in the eventual prompt. Note in the prompt: **the change must be backward-compatible** — old events without `setId` fall through to a "Set unknown" tile, not a render crash.

---

## 8. DOCUMENTED v1 LIMITATIONS

These are accepted; do not engineer around in v1.

### 8.1 Cross-source within-day chronological ordering is impossible

Drill, Spar Solo, Spar 1v1, and Flow use full ISO 8601 timestamps. FlashCards, Combine, and move-tile-trained use `todayLocal()` YYYY-MM-DD only (dossier line 463). Sorting all sources together by timestamp produces nonsense.

**Resolution:** order by source bucket (Drill, Solo, 1v1, Sets practiced, Combine saved, Flow, Move-tile trained). Within a bucket, render in array natural order (newest-first by prepend convention).

### 8.2 Move-tile trained attribution can be stale

`move.date === today` cannot be distinguished from Drill / Spar / SessionJournal authorship — all four mutate the same field (dossier line 274). For **today's open**, the §2.1 dedup catches it (Drill/Spar records are present to dedup against). For **past-day open via Calendar grid-tap on an unlogged day**, if the underlying Drill/Spar record was deleted, `move.date` may surface as a "tile-tap" when it wasn't.

**Resolution:** accept. Edit-a-saved-session is unaffected (uses the saved record, not live query). The risk is narrow.

### 8.3 Translation gaps — file separately

- `"Flash Cards"` hardcoded English at `FlashCards.jsx:80` — title literal in calendar event.
- `"Combo ${YYYY-MM-DD}"` hardcoded English at `ComboMachine.jsx:155, 164` — Set name default.
- `"Music Flow"` hardcoded English at `MusicFlow.jsx:109` — calendar event title literal that doesn't respect the `Music Flow → Flow` rename in `docs/CORE_PRINCIPLES.md:32`. The component's user-facing intro header at `MusicFlow.jsx:129` correctly uses `t("flow")`, but every calendar event written shows the old name in every language.

These should be filed as their own translation issues, not bundled into Log Today work. The Training sub-tab can render whatever's on the record (translated or not); fixing the writes is a separate concern.

### 8.4 Two `toYMD` copies

`CalendarOverlay.jsx:16` and `battlePrepHelpers.js:95` (dossier line 475). Functionally identical. Unify when one of them is touched anyway — likely as part of the `useDayData(date)` extraction.

### 8.5 RepCounter `exertion` / `bodyStatus` dead read

`bodyLogData` at `CalendarOverlay.jsx:178–180` iterates `dayData.repSessions` looking for `exertion`/`bodyStatus`. RepCounter's record never carries those fields (dossier line 403). The branch is dead. **Out of scope for Log Today** — file as separate cleanup ticket.

---

## OPEN QUESTIONS / PREREQUISITES

Before the CC prompt for Step 3 is written, these still need resolution:

1. **Translation keys** — every new string in this addendum across 12 languages. Deferred per batch policy. Keys to add:
   - Bucket headers: `drillSessions`, `sparSoloSessions`, `sparOneVoneSessions`, `setsPracticed`, `savedCombos`, `flowSessions`, `movesTrained` (label, not bucket key)
   - Soft-remove confirm copy: "Remove from today's log?"
   - Hard-delete confirm copy: "Delete this {sessionType} permanently?" with substitution per source
   - "Set unknown" placeholder (for legacy FlashCards events without `setId`)
   - "Manual session" bucket label
2. **Tile chevron animation** — preview JSX should validate the expand/collapse on real device before code. Likely fine with simple show/hide; spring optional.
3. **Empty-state copy** — what does the Training sub-tab show when no auto-capture rows exist for the day? Probably a friendly nudge to use the manual move-search picker, but copy not yet written.

---

## OUT OF SCOPE FOR THIS ADDENDUM

- Conditioning sub-tab data model — no auto-capture; deferred.
- Battle sub-tab data model — Path A pass-through to existing Rivals modal per parent spec line 131.
- Rest sub-tab data model — no auto-capture; chip + free-text only.
- Body Check integration — separate spec.
- For Next Time scheduling — separate parking issue.
- Apple Health / Strava integration — long-future hook noted in parent spec, not built.
- Translation pass — deferred batch.

---

## NEXT STEP

When ready to build:

1. **Re-grep the deployed code** — commit `998772e` will have moved. Verify line numbers in the dossier still hold; if they don't, update.
2. **Break Step 3 into surgical CC prompts.** Estimated breakdown:
   - **Prompt A:** Extract `useDayData(date)` hook + bundle 1v1 omission fix. Calendar continues to work unchanged.
   - **Prompt B:** Add `setId` to FlashCards calendar event write (one-line backward-compatible change).
   - ~~**Prompt C:** Flow schema addition.~~ **Resolved as not needed** — Flow's `musicflow.sessions[]` table is direct-readable, so chevron expansion has direct access to `reflection`. No calendar-event schema change required.
   - **Prompt D:** Build `useLogTodayTraining(date)` projection layer + the seven bucket renderers + dedup logic from §2. (May split — Spar bucket has two sub-renderers; Sets/Combine require Set lookup.)
   - **Prompt E:** Build the Training sub-tab UI consuming the projection layer, with X / long-press-X handlers and the working-state model from §5.
   - **Prompt F:** Wire `mb_log_exclusions` store + Firestore sync.
   - **Prompt G:** HOME "Log Today" button + Calendar `+` removal + grid-tap polish (entry-point work; can run in parallel with A–F).
   - **Prompt H:** Modal shell + 4-sub-tab navigation (depends on E).
   - **Prompt I:** Conditioning sub-tab + routine link.
   - **Prompt J:** Rest sub-tab.
   - **Prompt K:** Battle sub-tab pass-through (Path A integration).
   - **Prompt L:** Remove SessionJournal modal; reroute its entry points to Log Today. Purge dead code. (Riskiest commit — runs after D+E+F are stable on real device.)
   - **Prompt M:** Translation pass (12 languages, all new keys).

Each prompt follows the EXPLORE → PLAN → CODE → CHECK → COMMIT discipline. None should touch more than 2–3 files unless the structural change demands it (Prompt L likely demands more — split further if so).

---

*End of Step 3 addendum. Companion: parent spec `MovesBook_LogToday_v1.md` and dossier at `docs/research/LogToday_v1_AutoCapture_Inventory.md` (lines 278–335 contain Source 7 — Flow).*
