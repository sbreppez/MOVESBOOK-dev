# MovesBook — Core Principles

This document is the non-negotiable brief for every Claude Code session.
It contains only what cannot be discovered from reading the code. For
everything else — features, file structure, tech stack, schema, UI
patterns — read the actual current code. The codebase is the source
of truth.

## Philosophy

**Mirror, not coach.** The app holds the user's own data and words.
It never generates suggestions, advice, seed content, or coaching.
Features that produce content on the user's behalf are out of scope.

## Killed features — do not reintroduce

- Constraint Cards (all 72)
- Daily Word / daily phrase generator
- Mirror Mode (replaced by direction tag on moves)
- Body Care Habit Suggestions (6 presets killed; empty habits = empty)
- Warm Flow
- Seed data — new users start empty

If a task implies reintroducing any of these, STOP and flag.

## Naming — use the new names, always

- Lab → Explore
- Combo Machine → Combine
- Sparring → Spar
- Rep Counter → Drill
- Music Flow → Flow
- Flow Map → Map

Old names don't exist in the app. If you see them in old comments or
docs, they're drift.

## Non-negotiables

- **12 languages always:** en, it, es, fr, pt, de, ja, zh, ru, ko, th, vi.
  Every user-visible string gets a key in all 12. If userMemories or
  older docs say 11, that's stale.
- **Capacitor compatibility:** the app will be wrapped for native iOS
  and Android. Every technical choice must work in a Capacitor WebView.
  - Prefer `position: absolute` over `position: fixed`
  - No zoom-dependent positioning
  - No browser-only APIs without a platform-detection wrapper
  - Avoid `vh` units (status bar / keyboard breaks them)
  - Auth flows using Google OAuth are a known blocker — flag before
    adding
- **No new tech dependencies** without flagging. The stack is locked:
  Vite + React 18 + Firebase Auth + Firestore + localStorage + EmailJS.

## Working style

- **Read actual files first.** Before proposing a plan, read the files
  the task touches. Never rely on memory, prior context, this document,
  or older docs. If the code disagrees with what a doc says, the code
  wins.
- **Present a plan before writing code.** Explicit approval required.
- **Do the right work once.** Precision over speed. No patch-work
  hoping it's close enough.
- **Stay in scope.** If you discover adjacent issues, flag them — do
  not fix them silently.
- **Visual comparisons are systematic.** Background, borders, text,
  sizing, spacing, icons, active states, position, shadows, element
  presence. Never eyeball.
- **Flag Capacitor risks before coding.** Not after.

## TextStream invariant

Every user-authored text field that ships in a canonical store must
also emit to `users/{uid}/textstream`. TextStream is the cross-cutting
source for look-back, search, Reports, and Dev Story.

- Schema and source-type catalog: `src/constants/textStream.js`
- Inventory of every text-bearing field: `docs/research/UserText_Storage_Inventory.md`
- Helpers: `emitToTextStream`, `resolveSourceLabel`, `backfillTextStream`
  in `src/utils/textStream.js`

When adding or modifying a text-bearing field:
1. Update the inventory dossier (Section 1).
2. Add the new `source_type` to `src/constants/textStream.js` and a
   case to `resolveSourceLabel`.
3. Wire the canonical write to call `emitToTextStream` with
   `source_type`, `source_id`, `source_label`, `text`.
4. For in-place edits (single-string fields like `profile.why`,
   `habit.notes`), pass the prior entry's id as `supersedes` so the
   prior gets `superseded_at` and `superseded_by` set. The new entry
   has its own `created_at`.
5. For pure appends (journal entries), omit `supersedes`.

### Wrap pattern (Batches A–H)

Surface migrations follow a setter-wrap pattern, not direct emits at modal Save handlers:

- App.jsx's `useState` setter is renamed with a `*State` suffix (e.g. `setProfileState`).
- The un-suffixed name (e.g. `setProfile`) is reassigned to a wrapper that diffs `prev` vs `next` and calls the appropriate `emit*Changes` function from `src/utils/textStreamWraps.js`.
- Children consume the un-suffixed name unchanged.
- System paths inside App.jsx (rehydrate, Firestore sync, sign-out reset) call the raw `*State` setter — they must NOT trigger emits.

This keeps emit logic centralized, rather than scattered across modal Save handlers.

### System vs user setters

| Path | Setter to use | Emits TextStream? |
|---|---|---|
| Modal Save handler (user action) | `setProfile` (wrapped) | Yes |
| localStorage rehydrate on app boot | `setProfileState` (raw) | No |
| Firestore subscribe handler (cross-device sync) | `setProfileState` (raw) | No |
| Sign-out reset | `setProfileState` (raw) | No |

Adding a new text-bearing field to a wrapped store requires updating the corresponding `*_TEXT_FIELDS` list in `src/utils/textStreamWraps.js`. The dev-mode assertion catches missing entries with `console.error` if a field changes but no emit fires.

Excluded fields — URLs, label data (Custom Attributes, Lab chips,
Categories), drafts, and auto-capture calendar derivatives — are
listed in inventory Section 5.2. Don't migrate excluded fields
without first updating the dossier.

## When this doc is wrong

This doc drifts too. If you find the code disagrees with anything here,
flag it. Either the code needs to change or this doc does — the
maintainer decides which.
