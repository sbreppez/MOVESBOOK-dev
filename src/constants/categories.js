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
