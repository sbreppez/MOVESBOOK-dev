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
import { emitToTextStream, findCurrentEntry, resolveSourceLabel, AUTO_SOURCES } from './textStream';

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

// ─── Ideas (array of {id, type, ...}) ───────────────────────────────────────
//
// Three flavors with different text-bearing shapes:
//   type 'note'   → single text field (NOTE_TEXT, source_id = idea.id)
//   type 'goal'   → description (GOAL_DESCRIPTION, source_id = idea.id)
//                 + journal[].text (GOAL_JOURNAL, composite source_id)
//   type 'target' → journal[].text (TARGET_JOURNAL, composite source_id)
//
// Journal entries (goal, target) are editable in place via
// JournalEntryCard.save — stable composite source_id ${idea.id}:${entry.id}
// allows supersede across edits. This contrasts with move.journal which is
// delete-only (pure-append, no supersede).
//
// Type-change handling: if prev/next differ on .type, the per-branch guard
// (prevIdea?.type === 'note' ? prevIdea.text : '') treats old-type fields as
// empty, so the new emit has no prior — old type's entries naturally become
// orphans. No special branch needed.
//
// Excluded: idea.title (label, not narrative; consistent with habit.name /
// routine.name exclusion), idea.link (URL), target.unit (single-token), and
// legacy goal.why/steps[]/obstacles (collapsed into description on first
// save by GoalModal — that save emits GOAL_DESCRIPTION once).
export async function emitIdeasChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitIdeasChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(i => [i.id, i]));

  for (const nextIdea of nextList) {
    const prevIdea = prevById.get(nextIdea.id);

    if (nextIdea.type === 'note') {
      const prevText = (prevIdea?.type === 'note' ? prevIdea.text ?? '' : '').toString();
      const nextText = (nextIdea.text ?? '').toString();
      if (prevText === nextText) continue;
      if (!nextText.trim()) continue;

      try {
        const prior = prevIdea?.type === 'note'
          ? await findCurrentEntry(uid, SOURCE_TYPES.NOTE_TEXT, nextIdea.id)
          : null;
        await emitToTextStream(uid, {
          source_type: SOURCE_TYPES.NOTE_TEXT,
          source_id: nextIdea.id,
          source_label: resolveSourceLabel(SOURCE_TYPES.NOTE_TEXT, nextIdea),
          text: nextText,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] idea ${nextIdea.id} note emit failed:`, err);
      }
    } else if (nextIdea.type === 'goal') {
      // description
      const prevDesc = (prevIdea?.type === 'goal' ? prevIdea.description ?? '' : '').toString();
      const nextDesc = (nextIdea.description ?? '').toString();
      if (prevDesc !== nextDesc && nextDesc.trim()) {
        try {
          const prior = prevIdea?.type === 'goal'
            ? await findCurrentEntry(uid, SOURCE_TYPES.GOAL_DESCRIPTION, nextIdea.id)
            : null;
          await emitToTextStream(uid, {
            source_type: SOURCE_TYPES.GOAL_DESCRIPTION,
            source_id: nextIdea.id,
            source_label: resolveSourceLabel(SOURCE_TYPES.GOAL_DESCRIPTION, nextIdea),
            text: nextDesc,
            supersedes: prior?.id || null,
          });
        } catch (err) {
          console.error(`[textStream] idea ${nextIdea.id} goal description emit failed:`, err);
        }
      }

      // journal[]
      const prevJournal = prevIdea?.type === 'goal' ? (prevIdea.journal || []) : [];
      const prevJournalById = new Map(prevJournal.map(j => [j.id, j]));
      for (const entry of (nextIdea.journal || [])) {
        const prevEntry = prevJournalById.get(entry.id);
        const prevEntryText = (prevEntry?.text ?? '').toString();
        const nextEntryText = (entry?.text ?? '').toString();
        if (prevEntryText === nextEntryText) continue;
        if (!nextEntryText.trim()) continue;

        const sourceId = `${nextIdea.id}:${entry.id}`;
        try {
          const prior = prevEntry
            ? await findCurrentEntry(uid, SOURCE_TYPES.GOAL_JOURNAL, sourceId)
            : null;
          await emitToTextStream(uid, {
            source_type: SOURCE_TYPES.GOAL_JOURNAL,
            source_id: sourceId,
            source_label: resolveSourceLabel(SOURCE_TYPES.GOAL_JOURNAL, nextIdea),
            text: nextEntryText,
            supersedes: prior?.id || null,
          });
        } catch (err) {
          console.error(`[textStream] idea ${sourceId} goal journal emit failed:`, err);
        }
      }
    } else if (nextIdea.type === 'target') {
      const prevJournal = prevIdea?.type === 'target' ? (prevIdea.journal || []) : [];
      const prevJournalById = new Map(prevJournal.map(j => [j.id, j]));
      for (const entry of (nextIdea.journal || [])) {
        const prevEntry = prevJournalById.get(entry.id);
        const prevEntryText = (prevEntry?.text ?? '').toString();
        const nextEntryText = (entry?.text ?? '').toString();
        if (prevEntryText === nextEntryText) continue;
        if (!nextEntryText.trim()) continue;

        const sourceId = `${nextIdea.id}:${entry.id}`;
        try {
          const prior = prevEntry
            ? await findCurrentEntry(uid, SOURCE_TYPES.TARGET_JOURNAL, sourceId)
            : null;
          await emitToTextStream(uid, {
            source_type: SOURCE_TYPES.TARGET_JOURNAL,
            source_id: sourceId,
            source_label: resolveSourceLabel(SOURCE_TYPES.TARGET_JOURNAL, nextIdea),
            text: nextEntryText,
            supersedes: prior?.id || null,
          });
        } catch (err) {
          console.error(`[textStream] idea ${sourceId} target journal emit failed:`, err);
        }
      }
    }
    // Unknown type: no-op. Removed ideas: no action (orphan handling).
  }
}

// ─── Moves (array of {id, description, journal[], ...}) ─────────────────────
//
// Two text fields per move:
//   description    → singleton, supersede on edit (MOVE_DESCRIPTION)
//   journal[].text → pure-append, NO supersede (MOVE_JOURNAL)
//
// Pure-append is the contract: MoveModal offers append (MoveModal.jsx:603)
// and delete (MoveModal.jsx:635) only — no in-place edit handler, unlike
// goal/target journals which use JournalEntryCard.save. The wrap reflects
// this by emitting MOVE_JOURNAL with supersedes: null and skipping the
// findCurrentEntry lookup for journal entries (no prior to supersede).
//
// Detection of new journal entries via Set-of-prev-ids, not text diff: the
// lifecycle is append-prepend (entries prepended at index 0 per dossier
// 1.1), so positional diff would falsely flag every append as a "change to
// entry 0." Stable entry.id (Date.now() per MoveModal:606) makes Set the
// natural primitive.
//
// Excluded fields: move.name (label), move.link (URL), move.notes
// (deprecated — no UI write site per dossier 1.1 line 84), move.attrs /
// move.parentId (non-text references), customAttributes (separate store).
export async function emitMovesChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitMovesChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(m => [m.id, m]));

  for (const nextMove of nextList) {
    const prevMove = prevById.get(nextMove.id);

    // description (singleton, supersede semantics)
    const prevDesc = (prevMove?.description ?? '').toString();
    const nextDesc = (nextMove?.description ?? '').toString();
    if (prevDesc !== nextDesc && nextDesc.trim()) {
      try {
        const prior = prevMove
          ? await findCurrentEntry(uid, SOURCE_TYPES.MOVE_DESCRIPTION, nextMove.id)
          : null;
        await emitToTextStream(uid, {
          source_type: SOURCE_TYPES.MOVE_DESCRIPTION,
          source_id: nextMove.id,
          source_label: resolveSourceLabel(SOURCE_TYPES.MOVE_DESCRIPTION, nextMove),
          text: nextDesc,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] move ${nextMove.id} description emit failed:`, err);
      }
    }

    // journal[] (pure-append — no supersede, no findCurrentEntry)
    const prevJournalIds = new Set((prevMove?.journal || []).map(j => j.id));
    for (const entry of (nextMove.journal || [])) {
      if (prevJournalIds.has(entry.id)) continue;
      const text = (entry?.text ?? '').toString();
      if (!text.trim()) continue;

      try {
        await emitToTextStream(uid, {
          source_type: SOURCE_TYPES.MOVE_JOURNAL,
          source_id: `${nextMove.id}:${entry.id}`,
          source_label: resolveSourceLabel(SOURCE_TYPES.MOVE_JOURNAL, nextMove),
          text,
          supersedes: null,
        });
      } catch (err) {
        console.error(`[textStream] move ${nextMove.id} journal ${entry.id} emit failed:`, err);
      }
    }
    // Removed entries: no action (orphan handling).
  }
  // Removed moves: no action.
}

// ─── Calendar events (array of {id, source?, title, notes, ...}) ────────────
//
// Four text fields per event. Auto-capture events (source values in
// AUTO_SOURCES) are filtered at the wrap layer — their parent stores own
// their canonical text. The same filter runs in backfillTextStream's
// calendar branch — single source of truth via the shared AUTO_SOURCES Set.
//
// Pass-through: events with no source key (SessionJournal manual events,
// source === undefined) clear the falsy short-circuit and emit. Events
// with source: "log_today" (LogTodayTraining) also pass — "log_today" is
// not in AUTO_SOURCES.
//
// Excluded fields per dossier §1.7 / §5.2:
//   event.title    — template-fallback semantics, not narrative
//   event.text     — home-idea mirror only; auto-source filtered anyway
//   event.videoLink / event.eventLink — URLs
//
// All four source_types share bare event.id as source_id; discriminator
// is source_type. source_label resolves via resolveSourceLabel →
// event.title || event.date || '(event)'.
const CALENDAR_TEXT_FIELDS = [
  { path: 'notes',           source_type: SOURCE_TYPES.CALENDAR_NOTES },
  { path: 'workDescription', source_type: SOURCE_TYPES.CALENDAR_WORK_DESCRIPTION },
  { path: 'howItFelt',       source_type: SOURCE_TYPES.CALENDAR_HOW_IT_FELT },
  { path: 'location',        source_type: SOURCE_TYPES.CALENDAR_LOCATION },
];

export async function emitCalendarChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitCalendarChanges called without uid; skipping');
    }
    return;
  }

  const prevEvents = prev?.events || [];
  const nextEvents = next?.events || [];
  const prevById = new Map(prevEvents.map(e => [e.id, e]));

  for (const nextEvent of nextEvents) {
    if (nextEvent.source && AUTO_SOURCES.has(nextEvent.source)) continue;

    const prevEvent = prevById.get(nextEvent.id);
    for (const { path, source_type } of CALENDAR_TEXT_FIELDS) {
      const prevVal = (prevEvent?.[path] ?? '').toString();
      const nextVal = (nextEvent?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevEvent
          ? await findCurrentEntry(uid, source_type, nextEvent.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextEvent.id,
          source_label: resolveSourceLabel(source_type, nextEvent),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] calendar event ${nextEvent.id}.${path} emit failed:`, err);
      }
    }
  }
  // Removed events: no action (orphan handling).
}

// ─── Reps (array of session records; mb_reps is the array itself) ───────────
//
// Single text field per session: reflection. Two-stage lifecycle — session is
// created without reflection (RepCounter builds the session at handleDone
// without a text field); reflection is added later via a debounced post-save
// update callback. The diff handles both stages: creation is a no-op
// (prev/next reflection both empty), and subsequent updates emit with
// supersede semantics via findCurrentEntry.
//
// source_id = session.id (bare). source_label resolves via resolveSourceLabel →
// session.moveName fallback (session carries moveName at construction).
//
// Excluded structural fields: moveId, moveCategory, reps, duration, date.
export async function emitRepsChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitRepsChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(s => [s.id, s]));

  for (const nextSession of nextList) {
    const prevSession = prevById.get(nextSession.id);
    const prevText = (prevSession?.reflection ?? '').toString();
    const nextText = (nextSession?.reflection ?? '').toString();
    if (prevText === nextText) continue;
    if (!nextText.trim()) continue;

    try {
      const prior = prevSession
        ? await findCurrentEntry(uid, SOURCE_TYPES.REPS_REFLECTION, nextSession.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.REPS_REFLECTION,
        source_id: nextSession.id,
        source_label: resolveSourceLabel(SOURCE_TYPES.REPS_REFLECTION, nextSession),
        text: nextText,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] reps session ${nextSession.id} reflection emit failed:`, err);
    }
  }
  // Removed sessions: no action (orphan handling).
}

// ─── Sparring (parent object with sessions[] + sessions1v1[]) ───────────────
//
// One store covering two session flavors:
//   sessions[]    — Spar Solo + Competition (same shape: notes + reflection).
//                   CompetitionSimulator writes here with isCompetition:true
//                   and the same text fields; the per-field loop handles both.
//   sessions1v1[] — Spar 1v1, single text field: journal (single string, not
//                   an array — naming collision with move.journal[] /
//                   idea.journal[] per dossier §1.10).
//
// All three emits use bare session.id as source_id; source_type discriminates.
// source_label is entity-self-sufficient: SPARRING_* resolve via
// `Spar — ${session.date}`; SPAR1V1_JOURNAL resolves via session.opponent.
//
// Excluded fields per dossier §1.10:
//   sessions1v1.opponent  — no source_type (label-only)
//   sessions1v1.location  — no source_type (label-only)
//   records / records1v1  — numeric PR counters
//   All structural fields (roundLog, durations, side, etc.)
const SPARRING_SOLO_TEXT_FIELDS = [
  { path: 'notes',      source_type: SOURCE_TYPES.SPARRING_NOTES },
  { path: 'reflection', source_type: SOURCE_TYPES.SPARRING_REFLECTION },
];

export async function emitSparringChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitSparringChanges called without uid; skipping');
    }
    return;
  }

  // Solo + Competition (sessions[])
  const prevSolo = prev?.sessions || [];
  const nextSolo = next?.sessions || [];
  const prevSoloById = new Map(prevSolo.map(s => [s.id, s]));

  for (const nextSession of nextSolo) {
    const prevSession = prevSoloById.get(nextSession.id);
    for (const { path, source_type } of SPARRING_SOLO_TEXT_FIELDS) {
      const prevVal = (prevSession?.[path] ?? '').toString();
      const nextVal = (nextSession?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevSession
          ? await findCurrentEntry(uid, source_type, nextSession.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextSession.id,
          source_label: resolveSourceLabel(source_type, nextSession),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] sparring session ${nextSession.id}.${path} emit failed:`, err);
      }
    }
  }

  // Spar 1v1 (sessions1v1[])
  const prev1v1 = prev?.sessions1v1 || [];
  const next1v1 = next?.sessions1v1 || [];
  const prev1v1ById = new Map(prev1v1.map(s => [s.id, s]));

  for (const nextSession of next1v1) {
    const prevSession = prev1v1ById.get(nextSession.id);
    const prevText = (prevSession?.journal ?? '').toString();
    const nextText = (nextSession?.journal ?? '').toString();
    if (prevText === nextText) continue;
    if (!nextText.trim()) continue;

    try {
      const prior = prevSession
        ? await findCurrentEntry(uid, SOURCE_TYPES.SPAR1V1_JOURNAL, nextSession.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.SPAR1V1_JOURNAL,
        source_id: nextSession.id,
        source_label: resolveSourceLabel(SOURCE_TYPES.SPAR1V1_JOURNAL, nextSession),
        text: nextText,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] sparring 1v1 session ${nextSession.id} journal emit failed:`, err);
    }
  }
  // Removed sessions: no action (orphan handling).
}

// ─── Music Flow (parent object with sessions[]) ─────────────────────────────
//
// Single text field per session: reflection. Same two-stage lifecycle as reps
// — session created without reflection, text added via debounced post-save
// callback. The diff handles both stages naturally.
//
// source_id = session.id (bare). source_label resolves via resolveSourceLabel →
// `Flow — ${session.date}`.
//
// Excluded structural fields: duration, promptCount, stageReached, date.
export async function emitMusicflowChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitMusicflowChanges called without uid; skipping');
    }
    return;
  }

  const prevSessions = prev?.sessions || [];
  const nextSessions = next?.sessions || [];
  const prevById = new Map(prevSessions.map(s => [s.id, s]));

  for (const nextSession of nextSessions) {
    const prevSession = prevById.get(nextSession.id);
    const prevText = (prevSession?.reflection ?? '').toString();
    const nextText = (nextSession?.reflection ?? '').toString();
    if (prevText === nextText) continue;
    if (!nextText.trim()) continue;

    try {
      const prior = prevSession
        ? await findCurrentEntry(uid, SOURCE_TYPES.MUSICFLOW_REFLECTION, nextSession.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.MUSICFLOW_REFLECTION,
        source_id: nextSession.id,
        source_label: resolveSourceLabel(SOURCE_TYPES.MUSICFLOW_REFLECTION, nextSession),
        text: nextText,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] musicflow session ${nextSession.id} reflection emit failed:`, err);
    }
  }
  // Removed sessions: no action (orphan handling).
}

// ─── Rivals (array of {id, type, battles[], ...}) ───────────────────────────
//
// Single store mb_rivals[] with type discriminator ('rival' | 'sparringMate' |
// 'crew'). All three types share the same text fields — the discriminator
// affects only UI sub-tab routing, not emit semantics. The wrap treats all
// three uniformly.
//
// Two diff styles inside one function:
//
//   Rival-level (7 fields, standard supersede via findCurrentEntry):
//     crew, city, signatureMoves, gamePlan, sparringJournal, targetWhen,
//     targetWhere — edited in place via RivalModal.handleSave.
//     source_id = rival.id (bare).
//
//   Battle-level (4 fields, pure-append via Set-of-prev-ids):
//     battle.event, howDidItGo, whatSurprised, trainingNext.
//     Mirrors MOVE_JOURNAL (Batch D) — dossier §1.16 declares battles
//     append-only (handleSaveBattle appends; no UI edit path), so wrap
//     enforces the same contract via Set primitive and supersedes: null.
//     source_id = `${rival.id}:${battle.id}` (composite).
//     resolveSourceLabel needs ctx.{battle} for battle-level cases.
//
// Excluded per dossier §1.16 / §5.2:
//   rival.name        - label (used as source_label)
//   rival.instagram   - handle
//   rival.videoRefs   - URL + label
//   rival.sparHistory - auto-populated from sparring (Batch F canonical)
//   battle.result     - enum
//   battle.date       - date
//
// Cross-store side effect: saving a battle also writes a calendar event with
// source: 'rivals'. AUTO_SOURCES (Batch E shared filter) suppresses double-
// emit — no coordination needed here.
const RIVAL_TEXT_FIELDS = [
  { path: 'crew',            source_type: SOURCE_TYPES.RIVAL_CREW },
  { path: 'city',            source_type: SOURCE_TYPES.RIVAL_CITY },
  { path: 'signatureMoves',  source_type: SOURCE_TYPES.RIVAL_SIGNATURE_MOVES },
  { path: 'gamePlan',        source_type: SOURCE_TYPES.RIVAL_GAME_PLAN },
  { path: 'sparringJournal', source_type: SOURCE_TYPES.RIVAL_SPARRING_JOURNAL },
  { path: 'targetWhen',      source_type: SOURCE_TYPES.RIVAL_TARGET_WHEN },
  { path: 'targetWhere',     source_type: SOURCE_TYPES.RIVAL_TARGET_WHERE },
];
const RIVAL_BATTLE_TEXT_FIELDS = [
  { path: 'event',         source_type: SOURCE_TYPES.RIVAL_BATTLE_EVENT },
  { path: 'howDidItGo',    source_type: SOURCE_TYPES.RIVAL_BATTLE_HOW_DID_IT_GO },
  { path: 'whatSurprised', source_type: SOURCE_TYPES.RIVAL_BATTLE_WHAT_SURPRISED },
  { path: 'trainingNext',  source_type: SOURCE_TYPES.RIVAL_BATTLE_TRAINING_NEXT },
];

export async function emitRivalsChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitRivalsChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(r => [r.id, r]));

  for (const nextRival of nextList) {
    const prevRival = prevById.get(nextRival.id);

    // Rival-level fields (standard supersede via findCurrentEntry)
    for (const { path, source_type } of RIVAL_TEXT_FIELDS) {
      const prevVal = (prevRival?.[path] ?? '').toString();
      const nextVal = (nextRival?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevRival
          ? await findCurrentEntry(uid, source_type, nextRival.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextRival.id,
          source_label: resolveSourceLabel(source_type, nextRival),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] rival ${nextRival.id}.${path} emit failed:`, err);
      }
    }

    // Battle-level fields (pure-append via Set-of-prev-ids; supersedes: null)
    const prevBattleIds = new Set((prevRival?.battles || []).map(b => b.id));
    for (const battle of (nextRival.battles || [])) {
      if (prevBattleIds.has(battle.id)) continue;
      for (const { path, source_type } of RIVAL_BATTLE_TEXT_FIELDS) {
        const text = (battle?.[path] ?? '').toString();
        if (!text.trim()) continue;

        try {
          await emitToTextStream(uid, {
            source_type,
            source_id: `${nextRival.id}:${battle.id}`,
            source_label: resolveSourceLabel(source_type, nextRival, { battle }),
            text,
            supersedes: null,
          });
        } catch (err) {
          console.error(`[textStream] rival ${nextRival.id} battle ${battle.id}.${path} emit failed:`, err);
        }
      }
    }
    // Removed battles: no action (orphan handling).
  }
  // Removed rivals: no action (orphan handling).
}

// ─── Battle Prep (mb_battleprep.plans[] — three diff levels) ────────────────
//
// One store, one wrap, three distinct diff mechanics — the structurally
// densest wrap in the system. Mirrors the rivals wrap's plan-level + battle-
// level split but adds a third level (battleDay.customItems) with a primitive
// not used elsewhere.
//
//   Plan-level (3 fields, standard supersede):
//     eventName, planName, location — written together in BattlePrepSetup
//     buildPlanObject. source_id = plan.id (bare).
//
//   battleDay.customItems[] (1 field, pure-append per MOVE_JOURNAL pattern):
//     customItem.text only. Detection via Set-of-prev-ids; source_id =
//     `${plan.id}:${ci.id}` is stable per item. No supersede — customItems
//     are append/remove only (no in-place text edit), mirroring move
//     journal. ids are guaranteed by BattleDayView write-site
//     (BattleDayView:117) and migrateBattlePrep injection (App.jsx) for
//     legacy/cross-device data — see TEXTSTREAM-CUSTOMITEM-FIX. Do not
//     remediate here.
//
//   battles[].reflection (4 fields, standard supersede):
//     takeaway, whatWorked, needsWork, changeTraining. Dossier §1.17 treats
//     reflection as one-shot, but BattleDayView:289–297 allows overwrite on
//     re-save. Wrap uses standard supersede defensively. One Firestore read
//     per emit; in the one-shot common case findCurrentEntry returns null
//     and supersedes is null.
//     source_id = `${plan.id}:${battle.id}` (composite). resolveSourceLabel
//     requires { battle } in ctx for the `${planLabel} — ${battleDate}`
//     suffix per textStream.js:89–93.
//
// Excluded fields per dossier §1.17 / §5.2:
//   plan.eventUrl           - URL
//   plan.customPhases[].name - label data
//   battles[].eventName     - no source type in constants; mirror backfill
//   battles[].mood/result/date - enum/date
//   plan.arsenal / completedTasks / customDayOverrides / createdDate
//   /status / preset / trainingDays — metadata
const BATTLEPREP_PLAN_TEXT_FIELDS = [
  { path: 'eventName', source_type: SOURCE_TYPES.BATTLEPREP_EVENT_NAME },
  { path: 'planName',  source_type: SOURCE_TYPES.BATTLEPREP_PLAN_NAME },
  { path: 'location',  source_type: SOURCE_TYPES.BATTLEPREP_LOCATION },
];
const BATTLEPREP_REFLECTION_FIELDS = [
  { path: 'takeaway',       source_type: SOURCE_TYPES.BATTLEPREP_REFLECTION_TAKEAWAY },
  { path: 'whatWorked',     source_type: SOURCE_TYPES.BATTLEPREP_REFLECTION_WHAT_WORKED },
  { path: 'needsWork',      source_type: SOURCE_TYPES.BATTLEPREP_REFLECTION_NEEDS_WORK },
  { path: 'changeTraining', source_type: SOURCE_TYPES.BATTLEPREP_REFLECTION_CHANGE_TRAINING },
];

export async function emitBattleprepChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitBattleprepChanges called without uid; skipping');
    }
    return;
  }

  const prevPlans = prev?.plans || [];
  const nextPlans = next?.plans || [];
  const prevPlansById = new Map(prevPlans.map(p => [p.id, p]));

  for (const nextPlan of nextPlans) {
    const prevPlan = prevPlansById.get(nextPlan.id);

    // ── Plan-level fields (standard supersede) ────────────────────────────
    for (const { path, source_type } of BATTLEPREP_PLAN_TEXT_FIELDS) {
      const prevVal = (prevPlan?.[path] ?? '').toString();
      const nextVal = (nextPlan?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevPlan
          ? await findCurrentEntry(uid, source_type, nextPlan.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextPlan.id,
          source_label: resolveSourceLabel(source_type, nextPlan),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] battleprep plan ${nextPlan.id}.${path} emit failed:`, err);
      }
    }

    // ── battleDay.customItems (pure-append per MOVE_JOURNAL pattern) ──────
    // ids are stable post-fix (TEXTSTREAM-CUSTOMITEM-FIX); source_ids no
    // longer collide.
    const prevCustomIds = new Set(
      (prevPlan?.battleDay?.customItems || []).map(ci => ci.id)
    );
    for (const ci of (nextPlan?.battleDay?.customItems || [])) {
      if (prevCustomIds.has(ci.id)) continue;
      const text = (ci?.text ?? '').toString();
      if (!text.trim()) continue;

      const sourceId = `${nextPlan.id}:${ci.id}`;
      try {
        await emitToTextStream(uid, {
          source_type: SOURCE_TYPES.BATTLEPREP_BATTLEDAY_CUSTOM_ITEM,
          source_id: sourceId,
          source_label: resolveSourceLabel(
            SOURCE_TYPES.BATTLEPREP_BATTLEDAY_CUSTOM_ITEM,
            nextPlan
          ),
          text,
          supersedes: null,
        });
      } catch (err) {
        console.error(`[textStream] battleprep customItem ${sourceId} emit failed:`, err);
      }
    }

    // ── battles[].reflection (standard supersede, composite source_id) ────
    const prevBattlesById = new Map(
      (prevPlan?.battles || []).map(b => [b.id, b])
    );
    for (const battle of (nextPlan?.battles || [])) {
      const prevBattle = prevBattlesById.get(battle.id);
      for (const { path, source_type } of BATTLEPREP_REFLECTION_FIELDS) {
        const prevVal = (prevBattle?.reflection?.[path] ?? '').toString();
        const nextVal = (battle?.reflection?.[path] ?? '').toString();
        if (prevVal === nextVal) continue;
        if (!nextVal.trim()) continue;

        const sourceId = `${nextPlan.id}:${battle.id}`;
        try {
          const prior = prevBattle
            ? await findCurrentEntry(uid, source_type, sourceId)
            : null;
          await emitToTextStream(uid, {
            source_type,
            source_id: sourceId,
            source_label: resolveSourceLabel(source_type, nextPlan, { battle }),
            text: nextVal,
            supersedes: prior?.id || null,
          });
        } catch (err) {
          console.error(`[textStream] battleprep battle ${sourceId}.${path} emit failed:`, err);
        }
      }
    }
    // Removed battles / customItems: no action (orphan handling).
  }
  // Removed plans: no action (orphan handling).
}

// ─── Sets (mb_sets[] — single text field per item) ──────────────────────────
//
// Top-level array (mb_sets is the array itself, not wrapped). Single emit-
// eligible field per dossier §1.13:
//   set.details → SET_DETAILS, source_id = set.id (bare).
//
// Excluded fields:
//   set.name      - label (used as source_label via resolveSourceLabel)
//   set.notes     - DEPRECATED. Only ComboMachine writes user-influenced
//                   content here, and even that is auto-generated arrow-
//                   joined combo text (ComboMachine.jsx:167), not free-form.
//                   SetDetailModal freezes the field: `const [notes] =
//                   useState(item.notes || "")` at SetDetailModal.jsx:32
//                   — destructured without a setter, so the edit-modal
//                   pass-through preserves any existing value but cannot
//                   change it. No source_type in constants; do not emit.
//   set.link, color, mastery, date - URL / label / metadata
//   set.moveIds[]                  - non-text references
export async function emitSetsChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitSetsChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(s => [s.id, s]));

  for (const nextSet of nextList) {
    const prevSet = prevById.get(nextSet.id);
    const prevVal = (prevSet?.details ?? '').toString();
    const nextVal = (nextSet?.details ?? '').toString();
    if (prevVal === nextVal) continue;
    if (!nextVal.trim()) continue;

    try {
      const prior = prevSet
        ? await findCurrentEntry(uid, SOURCE_TYPES.SET_DETAILS, nextSet.id)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.SET_DETAILS,
        source_id: nextSet.id,
        source_label: resolveSourceLabel(SOURCE_TYPES.SET_DETAILS, nextSet),
        text: nextVal,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] set ${nextSet.id} details emit failed:`, err);
    }
  }
  // Removed sets: no action (orphan handling).
}

// ─── Injuries (mb_injuries[] — array of {id, description, resolutionNote, ...}) ─
//
// Two text fields per injury:
//   description    → singleton, supersede on edit (INJURY_DESCRIPTION)
//   resolutionNote → singleton, supersede on edit (INJURY_RESOLUTION_NOTE)
//
// Both use the habit pattern: skip emit when the new value is empty/whitespace,
// supersede prior entry via findCurrentEntry. Resolved-then-reopened lifecycle
// leaves the prior resolutionNote un-superseded as an orphan (matches removed-
// habits behavior); the next resolve supersedes it cleanly.
//
// source_id = injury.id (bare). source_label is body-part-derived and resolves
// inside resolveSourceLabel — no ctx needed because injury carries bodyPart/side
// on the entity itself.
//
// Excluded fields per dossier §1.21:
//   bodyPart / side / severity / startDate / resolvedDate / resolved — structural
//     (enums, dates, booleans). bodyPart/side feed the source_label.
const INJURY_TEXT_FIELDS = [
  { path: 'description',    source_type: SOURCE_TYPES.INJURY_DESCRIPTION },
  { path: 'resolutionNote', source_type: SOURCE_TYPES.INJURY_RESOLUTION_NOTE },
];

export async function emitInjuriesChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitInjuriesChanges called without uid; skipping');
    }
    return;
  }

  const prevList = prev || [];
  const nextList = next || [];
  const prevById = new Map(prevList.map(i => [i.id, i]));

  for (const nextInj of nextList) {
    const prevInj = prevById.get(nextInj.id);
    for (const { path, source_type } of INJURY_TEXT_FIELDS) {
      const prevVal = (prevInj?.[path] ?? '').toString();
      const nextVal = (nextInj?.[path] ?? '').toString();
      if (prevVal === nextVal) continue;
      if (!nextVal.trim()) continue;

      try {
        const prior = prevInj
          ? await findCurrentEntry(uid, source_type, nextInj.id)
          : null;
        await emitToTextStream(uid, {
          source_type,
          source_id: nextInj.id,
          source_label: resolveSourceLabel(source_type, nextInj),
          text: nextVal,
          supersedes: prior?.id || null,
        });
      } catch (err) {
        console.error(`[textStream] injury ${nextInj.id}.${path} emit failed:`, err);
      }
    }
  }
  // Removed injuries: no action (orphan handling).
}

// ─── Rest Log (mb_rest_log — object keyed by YYYY-MM-DD) ────────────────────
//
// Single text field per date entry: todayNote. Storage shape differs from every
// other wrap (object keyed by date, not array of records) — iterate via
// Object.entries instead of array map. source_id is the bare date string.
//
// LogTodayRest.save() deletes the date key entirely when the entry becomes
// empty (no restType, no note, no sleep, no soreness). The diff treats the
// missing key as prevVal '' → no emit. The prior textstream entry for that
// date stays un-superseded (orphan) per the standard removed-record contract.
//
// Excluded fields per dossier §1.22:
//   restType / sleep.hours / sleep.quality / soreness[] — enums, numerics,
//     structural arrays. Not narrative.
export async function emitRestLogChanges(prev, next, uid) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emitRestLogChanges called without uid; skipping');
    }
    return;
  }

  const prevMap = prev || {};
  const nextMap = next || {};

  for (const [date, nextEntry] of Object.entries(nextMap)) {
    const prevEntry = prevMap[date];
    const prevVal = (prevEntry?.todayNote ?? '').toString();
    const nextVal = (nextEntry?.todayNote ?? '').toString();
    if (prevVal === nextVal) continue;
    if (!nextVal.trim()) continue;

    try {
      const prior = prevEntry
        ? await findCurrentEntry(uid, SOURCE_TYPES.REST_TODAY_NOTE, date)
        : null;
      await emitToTextStream(uid, {
        source_type: SOURCE_TYPES.REST_TODAY_NOTE,
        source_id: date,
        source_label: resolveSourceLabel(SOURCE_TYPES.REST_TODAY_NOTE, nextEntry, { date }),
        text: nextVal,
        supersedes: prior?.id || null,
      });
    } catch (err) {
      console.error(`[textStream] restLog ${date}.todayNote emit failed:`, err);
    }
  }
  // Removed dates: no action (orphan handling).
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
