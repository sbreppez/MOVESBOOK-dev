// TextStream constants — enum of canonical source types.
// Each entry references the inventory dossier's Section 1 surface.
//
// When migrating a new surface (Batches A–H), add its source_type here
// and update docs/research/UserText_Storage_Inventory.md accordingly.

export const TEXTSTREAM_VERSION = 1;

export const SOURCE_TYPES = Object.freeze({
  // Section 1.1 — Move
  MOVE_DESCRIPTION:                 'move_description',
  MOVE_JOURNAL:                     'move_journal',

  // Sections 1.2-1.4 — Idea (note / goal / target)
  NOTE_TEXT:                        'note_text',
  GOAL_DESCRIPTION:                 'goal_description',
  GOAL_JOURNAL:                     'goal_journal',
  TARGET_JOURNAL:                   'target_journal',

  // Section 1.5 — Habit
  HABIT_WHY:                        'habit_why',
  HABIT_NOTES:                      'habit_notes',

  // Section 1.6 — Routine
  ROUTINE_STEP:                     'routine_step',

  // Section 1.7 — Calendar event (manual / user-typed only)
  CALENDAR_NOTES:                   'calendar_notes',
  CALENDAR_WORK_DESCRIPTION:        'calendar_workDescription',
  CALENDAR_HOW_IT_FELT:             'calendar_howItFelt',
  CALENDAR_LOCATION:                'calendar_location',

  // Sections 1.8-1.12 — Sessions
  REPS_REFLECTION:                  'reps_reflection',
  SPARRING_NOTES:                   'sparring_notes',
  SPARRING_REFLECTION:              'sparring_reflection',
  SPAR1V1_JOURNAL:                  'spar1v1_journal',
  MUSICFLOW_REFLECTION:             'musicflow_reflection',

  // Section 1.13 — Set
  SET_DETAILS:                      'set_details',

  // Section 1.16 — Rival
  RIVAL_CREW:                       'rival_crew',
  RIVAL_CITY:                       'rival_city',
  RIVAL_SIGNATURE_MOVES:            'rival_signatureMoves',
  RIVAL_GAME_PLAN:                  'rival_gamePlan',
  RIVAL_SPARRING_JOURNAL:           'rival_sparringJournal',
  RIVAL_TARGET_WHEN:                'rival_targetWhen',
  RIVAL_TARGET_WHERE:               'rival_targetWhere',
  RIVAL_BATTLE_EVENT:               'rival_battle_event',
  RIVAL_BATTLE_HOW_DID_IT_GO:       'rival_battle_howDidItGo',
  RIVAL_BATTLE_WHAT_SURPRISED:      'rival_battle_whatSurprised',
  RIVAL_BATTLE_TRAINING_NEXT:       'rival_battle_trainingNext',

  // Section 1.17 — Battle Prep
  BATTLEPREP_EVENT_NAME:            'battleprep_eventName',
  BATTLEPREP_PLAN_NAME:             'battleprep_planName',
  BATTLEPREP_LOCATION:              'battleprep_location',
  BATTLEPREP_BATTLEDAY_CUSTOM_ITEM: 'battleprep_battleDay_customItem',
  BATTLEPREP_REFLECTION_TAKEAWAY:        'battleprep_reflection_takeaway',
  BATTLEPREP_REFLECTION_WHAT_WORKED:     'battleprep_reflection_whatWorked',
  BATTLEPREP_REFLECTION_NEEDS_WORK:      'battleprep_reflection_needsWork',
  BATTLEPREP_REFLECTION_CHANGE_TRAINING: 'battleprep_reflection_changeTraining',

  // Section 1.18 — Profile
  PROFILE_NICKNAME:                 'profile_nickname',
  PROFILE_GOALS:                    'profile_goals',
  PROFILE_WHY:                      'profile_why',

  // Section 1.19 — Reminders
  REMINDER_TEXT:                    'reminder_text',

  // Section 1.20 — Pre-session intel
  PRESESSION_FROM_LAST_SESSION:     'presession_fromLastSession',
  PRESESSION_FROM_FOOTAGE:          'presession_fromFootage',
  PRESESSION_WANT_TO_TRY:           'presession_wantToTry',
});
