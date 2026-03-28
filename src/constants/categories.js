import { TRANSLATIONS } from './translations';

export const CAT_COLORS = {
  Toprocks:       "#8b1a1a",
  Godowns:        "#6b3a8a",
  Footworks:      "#2a5f8a",
  "Power Moves":  "#b5850a",
  Freezes:        "#2d6a4f",
  Transitions:    "#c0391b",
  Burns:          "#8a3a2a",
  Blowups:        "#1a6a6a",
  Custom:         "#4a4a6a",
};
export const CATS = Object.keys(CAT_COLORS);

export const CATEGORY_DOMAIN_MAP = {
  Toprocks:      { primary: 'performance', secondary: 'musicality' },
  Godowns:       { primary: 'technique',   secondary: 'variety' },
  Footworks:     { primary: 'technique',   secondary: 'musicality' },
  'Power Moves': { primary: 'technique',   secondary: 'variety' },
  Freezes:       { primary: 'technique',   secondary: 'performance' },
  Transitions:   { primary: 'variety',     secondary: 'creativity' },
  Burns:         { primary: 'performance', secondary: 'personality' },
  Blowups:       { primary: 'performance', secondary: 'creativity' },
};

export const IDEA_COLORS = [
  "#c0391b","#8b1a1a","#2a5f8a","#2d6a4f","#b5850a","#6b3a8a",
  "#1a6a6a","#4a4a6a","#8a3a2a","#2a6a3a","#6a2a5a","#3a5a8a",
];

export const HABIT_COLORS = ["#c0391b","#2a5f8a","#2d6a4f","#b5850a","#6b3a8a","#4a4a4a","#1a7a6a"];

export const INIT_MOVES = [
  { id:101, name:"Indian Step",   category:"Toprocks",    mastery:78, description:"The Indian Step is a classic toprock — cross your right foot over your left while swinging your arms, then step back. Keep the rhythm bouncy and relaxed.", link:"", date:"2025-01-10", status:"wip", rotation:false, travelling:false },
  { id:102, name:"Knee Drop",     category:"Godowns",     mastery:45, description:"The Knee Drop is a foundational go-down — from standing, swing one leg forward while dropping onto your trailing knee in one fluid motion. Protect your knee with pads when learning.", link:"", date:"2025-01-12", status:"wip",   rotation:false, travelling:false },
  { id:103, name:"Six Steps",     category:"Footworks",   mastery:62, description:"Six Steps is the core footwork pattern of breaking — a six-count cycle that circles your legs around your supporting arms. Master this and everything else builds on top.", link:"", date:"2025-01-08", status:"wip",   rotation:false, travelling:false },
  { id:104, name:"Backspin",      category:"Power Moves", mastery:22, description:"The Backspin is one of the first power moves to learn — spin horizontally on your back with legs tucked in or extended. Use your arms to initiate the rotation.", link:"", date:"2025-02-01", status:"wip",   rotation:true,  travelling:false },
  { id:105, name:"Baby Freeze",   category:"Freezes",     mastery:91, description:"The Baby Freeze is the entry-level freeze — balance on one elbow planted in your hip while the other arm and your head form a tripod. Clean, compact, and essential.", link:"", date:"2025-01-20", status:"wip", rotation:false, travelling:false },
];

const _t = (lang, key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;

export const getInitIdeas = (lang="en") => [
  {
    id:201, type:"goal", title:_t(lang,"initGoalTitle"), text:"", color:"#c0391b", pinned:true, link:"",
    createdDate: (() => { const d = new Date(); return d.toISOString().split("T")[0]; })(),
    byWhen: (() => { const d = new Date(); d.setMonth(d.getMonth()+4); return d.toISOString().split("T")[0]; })(),
    why:_t(lang,"initGoalWhy"),
    steps:[_t(lang,"initGoalStep1"), _t(lang,"initGoalStep2"), _t(lang,"initGoalStep3")],
    daysPerWeek:_t(lang,"initGoalCommitments"), sessionLength:_t(lang,"initGoalSession"), trainWhere:_t(lang,"initGoalWhere"),
    obstacles:_t(lang,"initGoalObstacles"),
    journal:[{
      id:99901,
      date: new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}),
      text:_t(lang,"initGoalJournalEntry"),
      link:""
    }]
  },
  {
    id:203, type:"target", title:_t(lang,"initTargetTitle"), text:"", color:"#2a5f8a", pinned:true, link:"",
    createdDate: (() => { const d = new Date(); return d.toISOString().split("T")[0]; })(),
    byWhen: (() => { const d = new Date(); d.setMonth(d.getMonth()+5); return d.toISOString().split("T")[0]; })(),
    target:20, unit:"moves", current:0, autoLink:false
  },
  { id:202, type:"note", title:_t(lang,"initNoteTitle"), text:_t(lang,"initNoteText"), color:"#2d6a4f", pinned:false, link:"" },
];
export const INIT_IDEAS = getInitIdeas("en");

export const getInitHabits = (lang="en") => [
  { id:601, name:_t(lang,"initHabit1Name"), frequency:"daily", createdDate: new Date().toISOString().split('T')[0], checkIns:[], color:"#c0391b", why:_t(lang,"initHabit1Why"), timeOfDay:"anytime", notes:"" },
  { id:602, name:_t(lang,"initHabit2Name"), frequency:"daily", createdDate: new Date().toISOString().split('T')[0], checkIns:[], color:"#2a5f8a", why:_t(lang,"initHabit2Why"), timeOfDay:"morning", notes:_t(lang,"initHabit2Notes") },
];
export const INIT_HABITS = getInitHabits("en");

export const getInitSets = (lang="en") => [
  { id:301, name:_t(lang,"initSet1Name"), color:"#2a5f8a", notes:_t(lang,"initSet1Notes"), mastery:35, date:"2025-03-01" },
  { id:302, name:_t(lang,"initSet2Name"), color:"#b5850a", notes:_t(lang,"initSet2Notes"), mastery:18, date:"2025-03-10" },
  { id:303, name:_t(lang,"initSet3Name"), color:"#2d6a4f", notes:_t(lang,"initSet3Notes"), mastery:52, date:"2025-03-15" },
];
export const INIT_SETS = getInitSets("en");

export const INIT_ROUNDS = [
  { id:401, name:"Prelims",      color:"#4a4a4a", notes:"", date:"2025-03-01",
    entries:[ { id:4011, name:"Entry 1", items:[] } ] },
  { id:402, name:"Top 32",       color:"#2a5f8a", notes:"", date:"2025-03-01",
    entries:[ { id:4021, name:"Entry 1", items:[] }, { id:4022, name:"Entry 2", items:[] } ] },
  { id:403, name:"Top 16",       color:"#2d6a4f", notes:"", date:"2025-03-01",
    entries:[ { id:4031, name:"Entry 1", items:[] }, { id:4032, name:"Entry 2", items:[] } ] },
  { id:404, name:"Top 8",        color:"#b5850a", notes:"", date:"2025-03-01",
    entries:[ { id:4041, name:"Entry 1", items:[] }, { id:4042, name:"Entry 2", items:[] } ] },
  { id:405, name:"Semi-Finals",  color:"#6b3a8a", notes:"", date:"2025-03-01",
    entries:[ { id:4051, name:"Entry 1", items:[] }, { id:4052, name:"Entry 2", items:[] } ] },
  { id:406, name:"Finals",       color:"#c0391b", notes:"", date:"2025-03-01",
    entries:[ { id:4061, name:"Entry 1", items:[] }, { id:4062, name:"Entry 2", items:[] }, { id:4063, name:"Entry 3", items:[] } ] },
  { id:407, name:"Reserve",      color:"#5a7a5a", notes:"", date:"2025-03-01",
    entries:[ { id:4071, name:"Entry 1", items:[] }, { id:4072, name:"Entry 2", items:[] } ] },
];
