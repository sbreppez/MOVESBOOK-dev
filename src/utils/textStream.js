/* global firebase */
import { SOURCE_TYPES } from '../constants/textStream';
import { toLocalYMD } from './dateUtils';

// ─── Source-label resolver ──────────────────────────────────────────────────
// Per inventory Section 2/Concern 8.
// Most source_types resolve from a single field on the canonical entity.
// Some need additional context (e.g. reps_reflection needs the move name).

export function resolveSourceLabel(sourceType, entity, ctx = {}) {
  if (!entity) return '(missing)';

  switch (sourceType) {
    // Move
    case SOURCE_TYPES.MOVE_DESCRIPTION:
    case SOURCE_TYPES.MOVE_JOURNAL:
      return entity.name || '(unnamed move)';

    // Idea — note
    case SOURCE_TYPES.NOTE_TEXT:
      return entity.title || (entity.text || '').slice(0, 60) || '(untitled note)';

    // Idea — goal / target
    case SOURCE_TYPES.GOAL_DESCRIPTION:
    case SOURCE_TYPES.GOAL_JOURNAL:
    case SOURCE_TYPES.TARGET_JOURNAL:
      return entity.title || '(untitled)';

    // Habit
    case SOURCE_TYPES.HABIT_WHY:
    case SOURCE_TYPES.HABIT_NOTES:
      return entity.name || '(unnamed habit)';

    // Routine
    case SOURCE_TYPES.ROUTINE_STEP:
      return entity.name || ctx.routineName || '(routine)';

    // Calendar — entity is the event; label uses event.title or date
    case SOURCE_TYPES.CALENDAR_NOTES:
    case SOURCE_TYPES.CALENDAR_WORK_DESCRIPTION:
    case SOURCE_TYPES.CALENDAR_HOW_IT_FELT:
    case SOURCE_TYPES.CALENDAR_LOCATION:
      return entity.title || entity.date || '(event)';

    // Sessions — synthetic labels per architecture decision
    case SOURCE_TYPES.REPS_REFLECTION:
      return ctx.moveName || entity.moveName || 'Drill';
    case SOURCE_TYPES.SPARRING_NOTES:
    case SOURCE_TYPES.SPARRING_REFLECTION:
      return `Spar — ${toLocalYMD(entity.date) || ''}`;
    case SOURCE_TYPES.SPAR1V1_JOURNAL:
      return entity.opponent || '1v1 Spar';
    case SOURCE_TYPES.MUSICFLOW_REFLECTION:
      return `Flow — ${toLocalYMD(entity.date) || ''}`;

    // Set
    case SOURCE_TYPES.SET_DETAILS:
      return entity.name || '(unnamed set)';

    // Rival — single-field cases (entity is the rival)
    case SOURCE_TYPES.RIVAL_CREW:
    case SOURCE_TYPES.RIVAL_CITY:
    case SOURCE_TYPES.RIVAL_SIGNATURE_MOVES:
    case SOURCE_TYPES.RIVAL_GAME_PLAN:
    case SOURCE_TYPES.RIVAL_SPARRING_JOURNAL:
    case SOURCE_TYPES.RIVAL_TARGET_WHEN:
    case SOURCE_TYPES.RIVAL_TARGET_WHERE:
      return entity.name || '(unnamed rival)';

    // Rival battle — entity is the rival, ctx.battle is the battle entry
    case SOURCE_TYPES.RIVAL_BATTLE_EVENT:
    case SOURCE_TYPES.RIVAL_BATTLE_HOW_DID_IT_GO:
    case SOURCE_TYPES.RIVAL_BATTLE_WHAT_SURPRISED:
    case SOURCE_TYPES.RIVAL_BATTLE_TRAINING_NEXT: {
      const rivalName = entity.name || '(rival)';
      const battleLabel = ctx.battle?.event || ctx.battle?.date || '(battle)';
      return `${rivalName} — ${battleLabel}`;
    }

    // Battle Prep — entity is the plan
    case SOURCE_TYPES.BATTLEPREP_EVENT_NAME:
    case SOURCE_TYPES.BATTLEPREP_PLAN_NAME:
    case SOURCE_TYPES.BATTLEPREP_LOCATION:
      return entity.eventName || entity.planName || '(plan)';
    case SOURCE_TYPES.BATTLEPREP_BATTLEDAY_CUSTOM_ITEM:
      return entity.eventName || entity.planName || '(battle day)';
    case SOURCE_TYPES.BATTLEPREP_REFLECTION_TAKEAWAY:
    case SOURCE_TYPES.BATTLEPREP_REFLECTION_WHAT_WORKED:
    case SOURCE_TYPES.BATTLEPREP_REFLECTION_NEEDS_WORK:
    case SOURCE_TYPES.BATTLEPREP_REFLECTION_CHANGE_TRAINING: {
      const planLabel = entity.eventName || entity.planName || '(plan)';
      const battleDate = ctx.battle?.date || '';
      return battleDate ? `${planLabel} — ${battleDate}` : planLabel;
    }

    // Profile — singletons
    case SOURCE_TYPES.PROFILE_NICKNAME:
    case SOURCE_TYPES.PROFILE_GOALS:
    case SOURCE_TYPES.PROFILE_WHY:
      return 'Profile';

    // Reminder
    case SOURCE_TYPES.REMINDER_TEXT:
      return 'My Notes';

    // Pre-session — singletons
    case SOURCE_TYPES.PRESESSION_FROM_LAST_SESSION:
    case SOURCE_TYPES.PRESESSION_FROM_FOOTAGE:
    case SOURCE_TYPES.PRESESSION_WANT_TO_TRY:
      return 'Before You Train';

    // Injury — entity is the injury record; label is body-part-derived.
    // Resolution prefix distinguishes the resolutionNote case from the
    // initial description in textstream lookups.
    case SOURCE_TYPES.INJURY_DESCRIPTION:
    case SOURCE_TYPES.INJURY_RESOLUTION_NOTE: {
      const part = entity.bodyPart
        ? (ctx.bodyPartLabel || entity.bodyPart)
        : '';
      const side = entity.side
        ? (ctx.sideLabel || entity.side)
        : '';
      const where = side ? `${side} ${part}` : (part || '(injury)');
      return sourceType === SOURCE_TYPES.INJURY_RESOLUTION_NOTE
        ? `Resolved — ${where}`
        : where;
    }

    // Rest log — entity is the per-date entry; label is the date itself.
    case SOURCE_TYPES.REST_TODAY_NOTE:
      return ctx.date || '(rest day)';

    default:
      console.warn(`[textStream] No label resolver for source_type: ${sourceType}`);
      return '(unknown)';
  }
}

// ─── Write helper ────────────────────────────────────────────────────────────
/**
 * Emit a TextStream entry.
 *
 * @param {string} uid - Firebase Auth user id
 * @param {Object} entry - { source_type, source_id, source_label, text, supersedes?, backfilled? }
 *   supersedes (optional): id of a prior entry being replaced. The prior gets
 *     superseded_at + superseded_by set; the new entry has its own created_at.
 *     For pure appends (e.g. journal entries that don't replace anything), omit.
 *   backfilled (optional): if true, sets backfilled_at on the new entry.
 *
 * @returns {Promise<string|null>} the new entry's Firestore doc id, or null on validation failure
 */
export async function emitToTextStream(
  uid,
  { source_type, source_id, source_label, text, supersedes = null, backfilled = false }
) {
  if (!uid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emit called without uid');
    }
    return null;
  }
  if (!source_type || !source_id || source_label == null || text == null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[textStream] emit missing required fields:', {
        source_type, source_id, source_label, text,
      });
    }
    return null;
  }

  const now = new Date().toISOString();
  const collRef = firebase.firestore()
    .collection('users').doc(uid)
    .collection('textstream');

  const newDocRef = await collRef.add({
    source_type,
    source_id,
    source_label,
    text,
    created_at: now,
    superseded_at: null,
    superseded_by: null,
    backfilled_at: backfilled ? now : null,
  });

  // If this entry supersedes a prior one, mark the prior as superseded.
  if (supersedes) {
    const priorRef = firebase.firestore()
      .collection('users').doc(uid)
      .collection('textstream').doc(supersedes);
    await priorRef.update({
      superseded_at: now,
      superseded_by: newDocRef.id,
    });
  }

  return newDocRef.id;
}

// ─── Lookup helper ──────────────────────────────────────────────────────────
/**
 * Find the current un-superseded TextStream entry for a (source_type, source_id).
 *
 * Used by the wrap layer to look up the prior entry to supersede on edits.
 * Returns null if no current entry exists (first emit case).
 *
 * Note: requires a Firestore composite index on
 * (source_type, source_id, superseded_at). On first run, Firestore will
 * surface a console error with a one-click index-creation link.
 *
 * @param {string} uid
 * @param {string} source_type
 * @param {string} source_id
 * @returns {Promise<{id: string, [k: string]: any} | null>}
 */
export async function findCurrentEntry(uid, source_type, source_id) {
  if (!uid || !source_type || !source_id) return null;
  const snap = await firebase.firestore()
    .collection('users').doc(uid)
    .collection('textstream')
    .where('source_type', '==', source_type)
    .where('source_id', '==', source_id)
    .where('superseded_at', '==', null)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

// ─── Backfill ────────────────────────────────────────────────────────────────
//
// Calendar event source values that are auto-capture (canonical content lives
// elsewhere; emit there, not here). Verified by greppping `source: '...'` across
// every addCalendarEvent call site.
//   Auto:    rep_counter, sparring, spar-1v1, combo_machine, flashcards,
//            musicflow, rrr, lab, home-routine, home-idea, battleprep,
//            competition, flowmap, rivals
//   Manual:  log_today, plus SessionJournal events which omit `source` entirely
//
// home-idea events excluded: note→calendar mirror — emit once from idea.
export const AUTO_SOURCES = new Set([
  'rep_counter',
  'sparring',
  'spar-1v1',
  'combo_machine',
  'flashcards',
  'musicflow',
  'rrr',
  'lab',
  'home-routine',
  'home-idea',
  'battleprep',
  'competition',
  'flowmap',
  'rivals',
]);

/**
 * One-time backfill from current canonical-store state.
 *
 * Idempotent: for each canonical text record, checks if a TextStream entry
 * already exists matching (source_type, source_id, text) — if yes, skips. If no,
 * emits an entry with backfilled_at marker.
 *
 * Safe to re-run. Resumes from where it left off on interruption.
 *
 * @param {string} uid - Firebase Auth user id
 * @param {Object} stores - { moves, ideas, habits, homeStack, calendar, reps,
 *                             sparring, musicflow, sets, rivals, battleprep,
 *                             profile, reminders, presession }
 * @returns {Promise<{ emitted: number, skipped: number }>}
 */
export async function backfillTextStream(uid, stores) {
  if (!uid) return { emitted: 0, skipped: 0 };

  // Read current TextStream state for dedup. Build a Set of
  // "source_type|source_id|text" keys for fast match.
  const collRef = firebase.firestore()
    .collection('users').doc(uid)
    .collection('textstream');
  const snap = await collRef.get();
  const seen = new Set();
  snap.forEach(d => {
    const e = d.data();
    seen.add(`${e.source_type}|${e.source_id}|${e.text}`);
  });

  let emitted = 0;
  let skipped = 0;

  const tryEmit = async (source_type, source_id, source_label, text) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
      skipped++;
      return;
    }
    const key = `${source_type}|${source_id}|${text}`;
    if (seen.has(key)) {
      skipped++;
      return;
    }
    await emitToTextStream(uid, {
      source_type, source_id, source_label, text,
      backfilled: true,
    });
    seen.add(key);
    emitted++;
  };

  // ── Walk every canonical store per inventory Section 1 ────────────────────

  // 1.1 Moves
  for (const m of (stores.moves || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.MOVE_DESCRIPTION, m);
    await tryEmit(SOURCE_TYPES.MOVE_DESCRIPTION, m.id, label, m.description);
    for (const j of (m.journal || [])) {
      await tryEmit(SOURCE_TYPES.MOVE_JOURNAL, `${m.id}:${j.id}`, label, j.text);
    }
  }

  // 1.2-1.4 Ideas (notes / goals / targets)
  for (const i of (stores.ideas || [])) {
    const label = resolveSourceLabel(
      i.type === 'note' ? SOURCE_TYPES.NOTE_TEXT :
      i.type === 'target' ? SOURCE_TYPES.TARGET_JOURNAL :
      SOURCE_TYPES.GOAL_DESCRIPTION,
      i
    );
    if (i.type === 'note') {
      await tryEmit(SOURCE_TYPES.NOTE_TEXT, i.id, label, i.text);
    } else if (i.type === 'goal') {
      await tryEmit(SOURCE_TYPES.GOAL_DESCRIPTION, i.id, label, i.description);
      for (const j of (i.journal || [])) {
        await tryEmit(SOURCE_TYPES.GOAL_JOURNAL, `${i.id}:${j.id}`, label, j.text);
      }
    } else if (i.type === 'target') {
      for (const j of (i.journal || [])) {
        await tryEmit(SOURCE_TYPES.TARGET_JOURNAL, `${i.id}:${j.id}`, label, j.text);
      }
    }
  }

  // 1.5 Habits
  for (const h of (stores.habits || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.HABIT_WHY, h);
    await tryEmit(SOURCE_TYPES.HABIT_WHY,   h.id, label, h.why);
    await tryEmit(SOURCE_TYPES.HABIT_NOTES, h.id, label, h.notes);
  }

  // 1.6 Routines (homeStack — both defaultStack and overrides)
  const allRoutines = [
    ...((stores.homeStack?.defaultStack) || []),
    ...Object.values(stores.homeStack?.overrides || {}).flatMap(o => o?.added || []),
  ].filter(t => t.type === 'routine');
  for (const r of allRoutines) {
    const label = resolveSourceLabel(SOURCE_TYPES.ROUTINE_STEP, r);
    for (const s of (r.steps || [])) {
      await tryEmit(SOURCE_TYPES.ROUTINE_STEP, `${r.id}:${s.id}`, label, s.text);
    }
  }

  // 1.7 Calendar events — manual/user-typed text fields ONLY
  // Auto-capture template content excluded via AUTO_SOURCES set above.
  // Note→calendar mirrors (source: 'home-idea') excluded — emit once from idea.
  for (const e of (stores.calendar?.events || [])) {
    if (e.source && AUTO_SOURCES.has(e.source)) continue;
    const label = resolveSourceLabel(SOURCE_TYPES.CALENDAR_NOTES, e);
    await tryEmit(SOURCE_TYPES.CALENDAR_NOTES,            e.id, label, e.notes);
    await tryEmit(SOURCE_TYPES.CALENDAR_WORK_DESCRIPTION, e.id, label, e.workDescription);
    await tryEmit(SOURCE_TYPES.CALENDAR_HOW_IT_FELT,      e.id, label, e.howItFelt);
    await tryEmit(SOURCE_TYPES.CALENDAR_LOCATION,         e.id, label, e.location);
  }

  // 1.8 Reps
  const moveById = new Map((stores.moves || []).map(m => [m.id, m]));
  for (const r of (stores.reps || [])) {
    const move = moveById.get(r.moveId);
    const label = resolveSourceLabel(SOURCE_TYPES.REPS_REFLECTION, r, { moveName: move?.name });
    await tryEmit(SOURCE_TYPES.REPS_REFLECTION, r.id, label, r.reflection);
  }

  // 1.9-1.10 Sparring (Solo + 1v1)
  for (const s of (stores.sparring?.sessions || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.SPARRING_NOTES, s);
    await tryEmit(SOURCE_TYPES.SPARRING_NOTES,      s.id, label, s.notes);
    await tryEmit(SOURCE_TYPES.SPARRING_REFLECTION, s.id, label, s.reflection);
  }
  for (const s of (stores.sparring?.sessions1v1 || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.SPAR1V1_JOURNAL, s);
    await tryEmit(SOURCE_TYPES.SPAR1V1_JOURNAL, s.id, label, s.journal);
  }

  // 1.12 Music Flow
  for (const s of (stores.musicflow?.sessions || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.MUSICFLOW_REFLECTION, s);
    await tryEmit(SOURCE_TYPES.MUSICFLOW_REFLECTION, s.id, label, s.reflection);
  }

  // 1.13 Sets — only `details` field per architecture decision
  for (const s of (stores.sets || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.SET_DETAILS, s);
    await tryEmit(SOURCE_TYPES.SET_DETAILS, s.id, label, s.details);
  }

  // 1.16 Rivals — multi-field per record
  for (const r of (stores.rivals || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.RIVAL_CREW, r);
    await tryEmit(SOURCE_TYPES.RIVAL_CREW,             r.id, label, r.crew);
    await tryEmit(SOURCE_TYPES.RIVAL_CITY,             r.id, label, r.city);
    await tryEmit(SOURCE_TYPES.RIVAL_SIGNATURE_MOVES,  r.id, label, r.signatureMoves);
    await tryEmit(SOURCE_TYPES.RIVAL_GAME_PLAN,        r.id, label, r.gamePlan);
    await tryEmit(SOURCE_TYPES.RIVAL_SPARRING_JOURNAL, r.id, label, r.sparringJournal);
    await tryEmit(SOURCE_TYPES.RIVAL_TARGET_WHEN,      r.id, label, r.targetWhen);
    await tryEmit(SOURCE_TYPES.RIVAL_TARGET_WHERE,     r.id, label, r.targetWhere);
    for (const b of (r.battles || [])) {
      const bLabel = resolveSourceLabel(SOURCE_TYPES.RIVAL_BATTLE_EVENT, r, { battle: b });
      await tryEmit(SOURCE_TYPES.RIVAL_BATTLE_EVENT,           `${r.id}:${b.id}`, bLabel, b.event);
      await tryEmit(SOURCE_TYPES.RIVAL_BATTLE_HOW_DID_IT_GO,   `${r.id}:${b.id}`, bLabel, b.howDidItGo);
      await tryEmit(SOURCE_TYPES.RIVAL_BATTLE_WHAT_SURPRISED,  `${r.id}:${b.id}`, bLabel, b.whatSurprised);
      await tryEmit(SOURCE_TYPES.RIVAL_BATTLE_TRAINING_NEXT,   `${r.id}:${b.id}`, bLabel, b.trainingNext);
    }
  }

  // 1.17 Battle Prep
  for (const p of (stores.battleprep?.plans || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.BATTLEPREP_PLAN_NAME, p);
    await tryEmit(SOURCE_TYPES.BATTLEPREP_EVENT_NAME, p.id, label, p.eventName);
    await tryEmit(SOURCE_TYPES.BATTLEPREP_PLAN_NAME,  p.id, label, p.planName);
    await tryEmit(SOURCE_TYPES.BATTLEPREP_LOCATION,   p.id, label, p.location);
    for (const ci of (p.battleDay?.customItems || [])) {
      await tryEmit(
        SOURCE_TYPES.BATTLEPREP_BATTLEDAY_CUSTOM_ITEM,
        `${p.id}:${ci.id}`, label, ci.text
      );
    }
    for (const b of (p.battles || [])) {
      const bLabel = resolveSourceLabel(SOURCE_TYPES.BATTLEPREP_REFLECTION_TAKEAWAY, p, { battle: b });
      const ref = b.reflection || {};
      await tryEmit(SOURCE_TYPES.BATTLEPREP_REFLECTION_TAKEAWAY,        `${p.id}:${b.id}`, bLabel, ref.takeaway);
      await tryEmit(SOURCE_TYPES.BATTLEPREP_REFLECTION_WHAT_WORKED,     `${p.id}:${b.id}`, bLabel, ref.whatWorked);
      await tryEmit(SOURCE_TYPES.BATTLEPREP_REFLECTION_NEEDS_WORK,      `${p.id}:${b.id}`, bLabel, ref.needsWork);
      await tryEmit(SOURCE_TYPES.BATTLEPREP_REFLECTION_CHANGE_TRAINING, `${p.id}:${b.id}`, bLabel, ref.changeTraining);
    }
  }

  // 1.18 Profile (singleton — use uid as source_id)
  if (stores.profile) {
    await tryEmit(SOURCE_TYPES.PROFILE_NICKNAME, uid, 'Profile', stores.profile.nickname);
    await tryEmit(SOURCE_TYPES.PROFILE_GOALS,    uid, 'Profile', stores.profile.goals);
    await tryEmit(SOURCE_TYPES.PROFILE_WHY,      uid, 'Profile', stores.profile.why);
  }

  // 1.19 Reminders
  for (const r of (stores.reminders?.items || [])) {
    await tryEmit(SOURCE_TYPES.REMINDER_TEXT, r.id, 'My Notes', r.text);
  }

  // 1.20 Pre-session
  if (stores.presession) {
    await tryEmit(SOURCE_TYPES.PRESESSION_FROM_LAST_SESSION, uid, 'Before You Train', stores.presession.fromLastSession);
    await tryEmit(SOURCE_TYPES.PRESESSION_FROM_FOOTAGE,      uid, 'Before You Train', stores.presession.fromFootage);
    for (const w of (stores.presession.wantToTry || [])) {
      await tryEmit(SOURCE_TYPES.PRESESSION_WANT_TO_TRY, w.id, 'Before You Train', w.text);
    }
  }

  // 1.25 Injuries
  for (const inj of (stores.injuries || [])) {
    const label = resolveSourceLabel(SOURCE_TYPES.INJURY_DESCRIPTION, inj);
    await tryEmit(SOURCE_TYPES.INJURY_DESCRIPTION,     inj.id, label, inj.description);
    const resolvedLabel = resolveSourceLabel(SOURCE_TYPES.INJURY_RESOLUTION_NOTE, inj);
    await tryEmit(SOURCE_TYPES.INJURY_RESOLUTION_NOTE, inj.id, resolvedLabel, inj.resolutionNote);
  }

  // 1.26 Rest log — keyed by YYYY-MM-DD; source_id is the bare date
  for (const [date, entry] of Object.entries(stores.restLog || {})) {
    await tryEmit(SOURCE_TYPES.REST_TODAY_NOTE, date, date, entry?.todayNote);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[textStream] backfill complete — emitted: ${emitted}, skipped: ${skipped}`);
  }
  return { emitted, skipped };
}
