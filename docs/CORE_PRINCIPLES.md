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

## When this doc is wrong

This doc drifts too. If you find the code disagrees with anything here,
flag it. Either the code needs to change or this doc does — the
maintainer decides which.
