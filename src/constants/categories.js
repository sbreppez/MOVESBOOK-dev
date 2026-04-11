import { TRANSLATIONS } from './translations';
import { todayLocal } from '../utils/dateUtils';

export const CAT_COLORS = {
  Toprocks:       "#C4453E",
  Godowns:        "#8B6AAE",
  Footworks:      "#4A90C4",
  "Power Moves":  "#D4943A",
  Freezes:        "#3D9E72",
  Transitions:    "#D46A52",
  Burns:          "#8A6B54",
  Blowups:        "#3A9E9E",
  Custom:         "#6B7BA0",
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

export const DOMAIN_COLORS = {
  musicality:  '#3A9E9E',
  performance: '#C4453E',
  technique:   '#4A90C4',
  variety:     '#D4943A',
  creativity:  '#8B6AAE',
  personality: '#3D9E72',
};

export const IDEA_COLORS = [
  "#C4453E","#D46A52","#D4943A","#8A6B54","#3D9E72","#3A9E9E",
  "#4A90C4","#6B7BA0","#8B6AAE","#7A5C8A","#B07A5E","#5A8A72",
];

export const HABIT_COLORS = ["#C4453E","#4A90C4","#3D9E72","#D4943A","#8B6AAE","#6B7BA0","#3A9E9E"];

export const INIT_MOVES = [
  { id:101, name:"Indian Step",   category:"Toprocks",    mastery:78, description:"The Indian Step is a classic toprock — cross your right foot over your left while swinging your arms, then step back. Keep the rhythm bouncy and relaxed.", link:"", date:"2025-01-10", status:"wip", rotation:false, travelling:false },
  { id:102, name:"Knee Drop",     category:"Godowns",     mastery:45, description:"The Knee Drop is a foundational go-down — from standing, swing one leg forward while dropping onto your trailing knee in one fluid motion. Protect your knee with pads when learning.", link:"", date:"2025-01-12", status:"wip",   rotation:false, travelling:false },
  { id:103, name:"Six Steps",     category:"Footworks",   mastery:62, description:"Six Steps is the core footwork pattern of breaking — a six-count cycle that circles your legs around your supporting arms. Master this and everything else builds on top.", link:"", date:"2025-01-08", status:"wip",   rotation:false, travelling:false },
  { id:104, name:"Backspin",      category:"Power Moves", mastery:22, description:"The Backspin is one of the first power moves to learn — spin horizontally on your back with legs tucked in or extended. Use your arms to initiate the rotation.", link:"", date:"2025-02-01", status:"wip",   rotation:true,  travelling:false },
  { id:105, name:"Baby Freeze",   category:"Freezes",     mastery:91, description:"The Baby Freeze is the entry-level freeze — balance on one elbow planted in your hip while the other arm and your head form a tripod. Clean, compact, and essential.", link:"", date:"2025-01-20", status:"wip", rotation:false, travelling:false },
];

const _t = (lang, key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;

export const getInitIdeas = (lang="en") => [];
export const INIT_IDEAS = getInitIdeas("en");

export const getInitHabits = (lang="en") => [
  { id:601, name:_t(lang,"initHabit1Name"), frequency:"daily", createdDate: todayLocal(), checkIns:[], color:"#C4453E", why:_t(lang,"initHabit1Why"), timeOfDay:"anytime", notes:"" },
  { id:602, name:_t(lang,"initHabit2Name"), frequency:"daily", createdDate: todayLocal(), checkIns:[], color:"#4A90C4", why:_t(lang,"initHabit2Why"), timeOfDay:"morning", notes:_t(lang,"initHabit2Notes") },
];
export const INIT_HABITS = getInitHabits("en");

export const getInitSets = (lang="en") => [
  { id:301, name:_t(lang,"initSet1Name"), color:"#4A90C4", notes:_t(lang,"initSet1Notes"), mastery:35, date:"2025-03-01" },
  { id:302, name:_t(lang,"initSet2Name"), color:"#D4943A", notes:_t(lang,"initSet2Notes"), mastery:18, date:"2025-03-10" },
  { id:303, name:_t(lang,"initSet3Name"), color:"#3D9E72", notes:_t(lang,"initSet3Notes"), mastery:52, date:"2025-03-15" },
];
export const INIT_SETS = getInitSets("en");

export const INIT_ROUNDS = [
  { id:401, name:"Prelims",      color:"#6B7BA0", notes:"", date:"2025-03-01",
    entries:[ { id:4011, name:"Entry 1", items:[] } ] },
  { id:402, name:"Top 32",       color:"#4A90C4", notes:"", date:"2025-03-01",
    entries:[ { id:4021, name:"Entry 1", items:[] }, { id:4022, name:"Entry 2", items:[] } ] },
  { id:403, name:"Top 16",       color:"#3D9E72", notes:"", date:"2025-03-01",
    entries:[ { id:4031, name:"Entry 1", items:[] }, { id:4032, name:"Entry 2", items:[] } ] },
  { id:404, name:"Top 8",        color:"#D4943A", notes:"", date:"2025-03-01",
    entries:[ { id:4041, name:"Entry 1", items:[] }, { id:4042, name:"Entry 2", items:[] } ] },
  { id:405, name:"Semi-Finals",  color:"#8B6AAE", notes:"", date:"2025-03-01",
    entries:[ { id:4051, name:"Entry 1", items:[] }, { id:4052, name:"Entry 2", items:[] } ] },
  { id:406, name:"Finals",       color:"#C4453E", notes:"", date:"2025-03-01",
    entries:[ { id:4061, name:"Entry 1", items:[] }, { id:4062, name:"Entry 2", items:[] }, { id:4063, name:"Entry 3", items:[] } ] },
  { id:407, name:"Reserve",      color:"#5A8A72", notes:"", date:"2025-03-01",
    entries:[ { id:4071, name:"Entry 1", items:[] }, { id:4072, name:"Entry 2", items:[] } ] },
];
