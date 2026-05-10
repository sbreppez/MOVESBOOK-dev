// TextStream surface wraps — Batches A–H.
//
// Diff-and-emit helpers consumed by App.jsx setter wrappers. Each
// emit*Changes function compares prev vs next for one canonical store
// and emits one TextStream entry per changed text field, with supersede
// semantics for in-place edits.
//
// Wrap pattern is documented in docs/CORE_PRINCIPLES.md (TextStream
// invariant section).

import { SOURCE_TYPES } from '../constants/textStream';
import { emitToTextStream, findCurrentEntry, resolveSourceLabel } from './textStream';

// ─── Profile (singleton, keyed by uid) ───────────────────────────────────────
//
// Three single-string fields. Every change supersedes the prior entry
// for that field. PROFILE_TEXT_FIELDS is the source of truth for "which
// profile fields emit." Adding a new text field to profile means adding
// it here AND to SOURCE_TYPES.
const PROFILE_TEXT_FIELDS = [
  { path: 'nickname', source_type: SOURCE_TYPES.PROFILE_NICKNAME },
  { path: 'goals',    source_type: SOURCE_TYPES.PROFILE_GOALS },
  { path: 'why',      source_type: SOURCE_TYPES.PROFILE_WHY },
];

export async function emitProfileChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitProfileChanges called without uid; skipping');
    }
    return;
  }
  if (!next) return;

  const emittedFields = new Set();
  for (const { path, source_type } of PROFILE_TEXT_FIELDS) {
    const prevVal = (prev?.[path] ?? '').toString();
    const nextVal = (next?.[path] ?? '').toString();
    if (prevVal === nextVal) continue;

    try {
      const prior = await findCurrentEntry(uid, source_type, uid);
      await emitToTextStream(uid, {
        source_type,
        source_id: uid,
        source_label: 'Profile',
        text: nextVal,
        supersedes: prior?.id || null,
      });
      emittedFields.add(path);
    } catch (err) {
      console.error(`[textStream] profile.${path} emit failed:`, err);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    assertCompleteness(prev, next, PROFILE_TEXT_FIELDS.map(f => f.path), emittedFields, 'profile');
  }
}

// ─── Reminders (array of {id, text}) ─────────────────────────────────────────
//
// Three operations:
//   - New item (id appears in next, not prev) → emit new entry, no supersede
//   - Existing item's text edited           → emit new + supersede prior
//   - Item removed                          → no emit; prior entry stays
//                                             un-superseded (orphan)
export async function emitReminderChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitReminderChanges called without uid; skipping');
    }
    return;
  }

  const prevItems = prev?.items || [];
  const nextItems = next?.items || [];
  const prevById = new Map(prevItems.map(i => [i.id, i]));

  for (const nextItem of nextItems) {
    const prevItem = prevById.get(nextItem.id);
    const prevText = (prevItem?.text ?? '').toString();
    const nextText = (nextItem.text ?? '').toString();
    if (prevText === nextText) continue;
    if (!nextText.trim()) continue;

    try {
      const prior = prevItem
        ? await findCurrentEntry(uid, SOURCE_TYPES.REMINDER_TEXT, nextItem.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.REMINDER_TEXT,
        source_id: nextItem.id,
        source_label: 'My Notes',
        text: nextText,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] reminder ${nextItem.id} emit failed:`, err);
    }
  }
  // Removed items: no action (orphan handling).
}

// ─── Pre-session (singleton + array) ─────────────────────────────────────────
//
// Two singleton string fields (fromLastSession, fromFootage) + array of
// {id, text} (wantToTry). Combination of the profile and reminder patterns.
const PRESESSION_SINGLETON_FIELDS = [
  { path: 'fromLastSession', source_type: SOURCE_TYPES.PRESESSION_FROM_LAST_SESSION },
  { path: 'fromFootage',     source_type: SOURCE_TYPES.PRESESSION_FROM_FOOTAGE },
];

export async function emitPresessionChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitPresessionChanges called without uid; skipping');
    }
    return;
  }
  if (!next) return;

  const emittedFields = new Set();

  // Singleton fields
  for (const { path, source_type } of PRESESSION_SINGLETON_FIELDS) {
    const prevVal = (prev?.[path] ?? '').toString();
    const nextVal = (next?.[path] ?? '').toString();
    if (prevVal === nextVal) continue;

    try {
      const prior = await findCurrentEntry(uid, source_type, uid);
      await emitToTextStream(uid, {
        source_type,
        source_id: uid,
        source_label: 'Before You Train',
        text: nextVal,
        supersedes: prior?.id || null,
      });
      emittedFields.add(path);
    } catch (err) {
      console.error(`[textStream] presession.${path} emit failed:`, err);
    }
  }

  // wantToTry array — same pattern as reminders
  const prevItems = prev?.wantToTry || [];
  const nextItems = next?.wantToTry || [];
  const prevById = new Map(prevItems.map(i => [i.id, i]));

  for (const nextItem of nextItems) {
    const prevItem = prevById.get(nextItem.id);
    const prevText = (prevItem?.text ?? '').toString();
    const nextText = (nextItem.text ?? '').toString();
    if (prevText === nextText) continue;
    if (!nextText.trim()) continue;

    try {
      const prior = prevItem
        ? await findCurrentEntry(uid, SOURCE_TYPES.PRESESSION_WANT_TO_TRY, nextItem.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.PRESESSION_WANT_TO_TRY,
        source_id: nextItem.id,
        source_label: 'Before You Train',
        text: nextText,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] presession.wantToTry ${nextItem.id} emit failed:`, err);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    assertCompleteness(
      prev, next,
      PRESESSION_SINGLETON_FIELDS.map(f => f.path),
      emittedFields,
      'presession'
    );
  }
}

// ─── Habits (array of {id, why, notes, ...}) ────────────────────────────────
//
// Two text fields per habit (why, notes). Same operation triad as reminders,
// but multi-field per item. Mirrors backfillTextStream's habit branch:
//   source_id    = habit.id (bare; one source_id per habit, two source_types)
//   source_label = resolveSourceLabel(source_type, habit) → habit.name
const HABIT_TEXT_FIELDS = [
  { path: 'why',   source_type: SOURCE_TYPES.HABIT_WHY },
  { path: 'notes', source_type: SOURCE_TYPES.HABIT_NOTES },
];

export async function emitHabitsChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitHabitsChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(h => [h.id, h]));

  for (const nextHabit of nextList) {
    const prevHabit = prevById.get(nextHabit.id);
    for (const { path, source_type } of HABIT_TEXT_FIELDS) {
      const prevVal = (prevHabit?.[path] ?? '').toString();
      const nextVal = (nextHabit?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevHabit
          ? await findCurrentEntry(uid, source_type, nextHabit.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextHabit.id,
          source_label: resolveSourceLabel(source_type, nextHabit),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] habit ${nextHabit.id}.${path} emit failed:`, err);
      }
    }
  }
  // Removed habits: no action (orphan handling).
}

// ─── Routines (homeStack — defaultStack + overrides[date].added) ─────────────
//
// Routine tiles live in two locations within homeStack:
//   - defaultStack[] filtered to type === 'routine'
//   - overrides[date].added[] filtered to type === 'routine' (synthetic ids
//     of the form `${original.id}_ovr_${date}` per HomePage:498)
// Both are flattened into one routine list. source_id format is composite
// `${routine.id}:${step.id}` per backfillTextStream — the override-tile's
// synthetic routine id keeps its step source_ids distinct from the canonical.
function flattenRoutines(homeStack) {
  const fromDefault = (homeStack?.defaultStack || []).filter(t => t.type === 'routine');
  const fromOverrides = Object.values(homeStack?.overrides || {})
    .flatMap(o => o?.added || [])
    .filter(t => t.type === 'routine');
  return [...fromDefault, ...fromOverrides];
}

export async function emitRoutinesChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitRoutinesChanges called without uid; skipping');
    }
    return;
  }

  const prevRoutines = flattenRoutines(prev);
  const nextRoutines = flattenRoutines(next);
  const prevById = new Map(prevRoutines.map(r => [r.id, r]));

  for (const nextR of nextRoutines) {
    const prevR = prevById.get(nextR.id);
    const prevSteps = new Map((prevR?.steps || []).map(s => [s.id, s]));

    for (const step of (nextR.steps || [])) {
      const prevStep = prevSteps.get(step.id);
      const prevText = (prevStep?.text ?? '').toString();
      const nextText = (step?.text ?? '').toString();
      if (prevText === nextText) continue;
      if (!nextText.trim()) continue;

      const sourceId = `${nextR.id}:${step.id}`;
      try {
        const prior = prevStep
          ? await findCurrentEntry(uid, SOURCE_TYPES.ROUTINE_STEP, sourceId)
          : null;
        await emitToTextStream(uid, {
          source_type: SOURCE_TYPES.ROUTINE_STEP,
          source_id: sourceId,
          source_label: resolveSourceLabel(SOURCE_TYPES.ROUTINE_STEP, nextR),
          text: nextText,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] routine ${sourceId} emit failed:`, err);
      }
    }
    // Removed steps: no action (orphan handling).
  }
  // Removed routines: no action (orphan handling).
}

// ─── Dev-mode assertion ──────────────────────────────────────────────────────
// Catches the case where a developer adds a new text field to the canonical
// schema but forgets to add it to the wrap's *_TEXT_FIELDS list.
// Singleton-only — array fields are handled per-item with explicit dedup.
function assertCompleteness(prev, next, expectedFields, emittedFields, storeLabel) {
  if (!prev || !next) return;
  for (const field of expectedFields) {
    const prevVal = (prev?.[field] ?? '').toString();
    const nextVal = (next?.[field] ?? '').toString();
    if (prevVal !== nextVal && !emittedFields.has(field)) {
      console.error(
        `[textStream] ${storeLabel}.${field} changed but no emit happened. ` +
        `Add to *_TEXT_FIELDS or update the wrap.`
      );
    }
  }
}
