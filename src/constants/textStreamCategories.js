// User-facing category groupings for the 45 TextStream source types.
// Each source_type maps to one of 13 buckets used by the search UI.
//
// Adding a new source type to constants/textStream.js requires adding
// it here too — otherwise it falls into 'other' and search treats
// it as uncategorized. The dev-mode warning at the bottom catches
// catalog drift on module load.

import { SOURCE_TYPES } from './textStream';

export const CATEGORIES = [
  { key: 'moves',      labelKey: 'searchCategoryMoves' },
  { key: 'ideas',      labelKey: 'searchCategoryIdeas' },
  { key: 'habits',     labelKey: 'searchCategoryHabits' },
  { key: 'routines',   labelKey: 'searchCategoryRoutines' },
  { key: 'calendar',   labelKey: 'searchCategoryCalendar' },
  { key: 'sessions',   labelKey: 'searchCategorySessions' },
  { key: 'sets',       labelKey: 'searchCategorySets' },
  { key: 'rivals',     labelKey: 'searchCategoryRivals' },
  { key: 'battles',    labelKey: 'searchCategoryBattles' },
  { key: 'battleprep', labelKey: 'searchCategoryBattlePrep' },
  { key: 'profile',    labelKey: 'searchCategoryProfile' },
  { key: 'reminders',  labelKey: 'searchCategoryReminders' },
  { key: 'presession', labelKey: 'searchCategoryPresession' },
];

const SOURCE_TO_CATEGORY = {
  // Moves
  [SOURCE_TYPES.MOVE_DESCRIPTION]: 'moves',
  [SOURCE_TYPES.MOVE_JOURNAL]:     'moves',

  // Ideas (note / goal / target)
  [SOURCE_TYPES.NOTE_TEXT]:        'ideas',
  [SOURCE_TYPES.GOAL_DESCRIPTION]: 'ideas',
  [SOURCE_TYPES.GOAL_JOURNAL]:     'ideas',
  [SOURCE_TYPES.TARGET_JOURNAL]:   'ideas',

  // Habits
  [SOURCE_TYPES.HABIT_WHY]:   'habits',
  [SOURCE_TYPES.HABIT_NOTES]: 'habits',

  // Routines
  [SOURCE_TYPES.ROUTINE_STEP]: 'routines',

  // Calendar (manual / user-typed only)
  [SOURCE_TYPES.CALENDAR_NOTES]:            'calendar',
  [SOURCE_TYPES.CALENDAR_WORK_DESCRIPTION]: 'calendar',
  [SOURCE_TYPES.CALENDAR_HOW_IT_FELT]:      'calendar',
  [SOURCE_TYPES.CALENDAR_LOCATION]:         'calendar',

  // Sessions (reps / sparring / 1v1 / musicflow)
  [SOURCE_TYPES.REPS_REFLECTION]:      'sessions',
  [SOURCE_TYPES.SPARRING_NOTES]:       'sessions',
  [SOURCE_TYPES.SPARRING_REFLECTION]:  'sessions',
  [SOURCE_TYPES.SPAR1V1_JOURNAL]:      'sessions',
  [SOURCE_TYPES.MUSICFLOW_REFLECTION]: 'sessions',

  // Sets
  [SOURCE_TYPES.SET_DETAILS]: 'sets',

  // Rivals (rival-level fields only)
  [SOURCE_TYPES.RIVAL_CREW]:             'rivals',
  [SOURCE_TYPES.RIVAL_CITY]:             'rivals',
  [SOURCE_TYPES.RIVAL_SIGNATURE_MOVES]:  'rivals',
  [SOURCE_TYPES.RIVAL_GAME_PLAN]:        'rivals',
  [SOURCE_TYPES.RIVAL_SPARRING_JOURNAL]: 'rivals',
  [SOURCE_TYPES.RIVAL_TARGET_WHEN]:      'rivals',
  [SOURCE_TYPES.RIVAL_TARGET_WHERE]:     'rivals',

  // Battles (split from Rivals for UX clarity)
  [SOURCE_TYPES.RIVAL_BATTLE_EVENT]:          'battles',
  [SOURCE_TYPES.RIVAL_BATTLE_HOW_DID_IT_GO]:  'battles',
  [SOURCE_TYPES.RIVAL_BATTLE_WHAT_SURPRISED]: 'battles',
  [SOURCE_TYPES.RIVAL_BATTLE_TRAINING_NEXT]:  'battles',

  // Battle Prep
  [SOURCE_TYPES.BATTLEPREP_EVENT_NAME]:                'battleprep',
  [SOURCE_TYPES.BATTLEPREP_PLAN_NAME]:                 'battleprep',
  [SOURCE_TYPES.BATTLEPREP_LOCATION]:                  'battleprep',
  [SOURCE_TYPES.BATTLEPREP_BATTLEDAY_CUSTOM_ITEM]:     'battleprep',
  [SOURCE_TYPES.BATTLEPREP_REFLECTION_TAKEAWAY]:       'battleprep',
  [SOURCE_TYPES.BATTLEPREP_REFLECTION_WHAT_WORKED]:    'battleprep',
  [SOURCE_TYPES.BATTLEPREP_REFLECTION_NEEDS_WORK]:     'battleprep',
  [SOURCE_TYPES.BATTLEPREP_REFLECTION_CHANGE_TRAINING]:'battleprep',

  // Profile
  [SOURCE_TYPES.PROFILE_NICKNAME]: 'profile',
  [SOURCE_TYPES.PROFILE_GOALS]:    'profile',
  [SOURCE_TYPES.PROFILE_WHY]:      'profile',

  // Reminders
  [SOURCE_TYPES.REMINDER_TEXT]: 'reminders',

  // Pre-session intel
  [SOURCE_TYPES.PRESESSION_FROM_LAST_SESSION]: 'presession',
  [SOURCE_TYPES.PRESESSION_FROM_FOOTAGE]:      'presession',
  [SOURCE_TYPES.PRESESSION_WANT_TO_TRY]:       'presession',
};

export function getSourceCategory(sourceType) {
  return SOURCE_TO_CATEGORY[sourceType] || 'other';
}

// Bare vs composite source_id split. Composites are joined with ':' by
// the emit pipeline (move_journal, goal_journal, target_journal,
// routine_step, rival_battle_*, battleprep_battleDay_customItem,
// battleprep_reflection_*). The dispatcher uses primaryId to navigate
// to the parent entity; secondaryId is reserved for Cap 2b's within-tab
// scroll targets.
export function parseSourceId(sourceType, sourceId) {
  if (typeof sourceId !== 'string') return { primaryId: sourceId };
  if (sourceId.includes(':')) {
    const [primary, secondary] = sourceId.split(':');
    return { primaryId: primary, secondaryId: secondary };
  }
  return { primaryId: sourceId };
}

if (process.env.NODE_ENV !== 'production') {
  Object.values(SOURCE_TYPES).forEach(t => {
    if (!SOURCE_TO_CATEGORY[t]) {
      console.warn('[textStreamCategories] Unmapped source_type:', t);
    }
  });
}
