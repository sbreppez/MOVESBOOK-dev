import React, { useState, useRef, useEffect, useMemo } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT, usePlural } from "../../hooks/useTranslation";
import { useSettings } from "../../hooks/useSettings";

const MANUAL_SECTIONS = [
  {
    id:"overview", title:"📖 Overview", icon:"📖",
    items:[
      { title:"What is MovesBook?",
        body:"MovesBook is a personal breaking trainer designed to help you train smarter. It covers every stage of your practice: setting goals, building your move library, planning battle sets, and tracking daily habits. Everything is saved locally on your device and synced to the cloud when you're signed in." },
      { title:"The three main tabs",
        body:"TRAIN — where you set goals, capture ideas and track habits.\nMOVES — your personal move library and combo sets.\nBATTLE — where you plan rounds and build freestyle lists for jams and battles." },
      { title:"The + button (bottom center)",
        body:"The large + button at the bottom center is context-aware. It does something different depending on which tab and sub-tab you're on:\n• TRAIN › Goals — opens the goal type chooser\n• TRAIN › Notes — opens a new note\n• TRAIN › Habits — opens a new habit\n• MOVES › Moves — opens a new move\n• MOVES › Sets — opens a new set\n• BATTLE › Plan — opens the new round modal\n• BATTLE › Freestyle — opens the move picker" },
      { title:"Cloud sync",
        body:"Sign in with Google or Email to sync all your data to the cloud. Your moves, goals, habits, rounds and sets are stored securely and available on any device. If you're not signed in, everything is still saved locally in your browser." },
      { title:"Zoom",
        body:"Use the − and + zoom controls in Settings to scale the entire app up or down. Useful on small screens or when you want a larger touch target. Tap the % number to reset to 100%." },
    ]
  },
  {
    id:"train", title:"🎯 TRAIN", icon:"🎯",
    items:[
      { title:"What TRAIN is for",
        body:"TRAIN is your planning and reflection space. Use it to define what you want to achieve (Goals), capture anything on your mind (Notes), and build daily routines (Habits). It's not about tracking moves — it's about tracking progress as a dancer." },
      { title:"Sub-tabs: Goals · Habits · Notes",
        body:"TRAIN has three sub-tabs. You can reorder them in Settings › Behaviour › TRAIN Tab Order using the ▲▼ buttons. The order is saved and applied immediately." },
      { title:"The flame counter",
        body:"A 🔥 counter appears in the TRAIN sub-tab bar showing how many habits you've completed today (e.g. 2/2). When all habits are done it glows amber. Tapping it takes you straight to the Habits tab." },
    ]
  },
  {
    id:"goals", title:"🎯 Goals", icon:"🎯",
    items:[
      { title:"Journey Goals vs Target Goals",
        body:"There are two types of goals:\n• Journey Goal 🎯 — a qualitative milestone with a plan and a deadline. E.g. 'Hit my first battle'.\n• Target Goal 🏹 — a number to reach. E.g. 'Learn 20 new moves'. You track progress with a counter." },
      { title:"Creating a Journey Goal",
        body:"Tap + and select 🎯 GOAL. Fill in:\n• What you want to achieve (required)\n• Why — how it benefits your situation\n• By When — your deadline\n• 3 Steps — three concrete actions to get there\n• Practice Plan — days per week, session length, where you train\n• Obstacles — what might get in the way\n• Colour — visual identifier" },
      { title:"Journey Goal tile",
        body:"Collapsed view shows the deadline and the first 2 steps. Tap the tile to expand — all 3 steps in full, your Why, Commitments as badges, and Obstacles. Tap again to collapse. The deadline label is colour-coded: green = plenty of time (>30% remaining), amber = getting close (11–30%), red = nearly due (0–10%)." },
      { title:"Deadline indicator",
        body:"The coloured days-remaining label (e.g. '122 days left') appears next to the deadline date. You can hide it in Settings › Behaviour › Show Deadline Indicator." },
      { title:"Journey Goal journal",
        body:"Open any Journey Goal via the ··· menu and go to the 📓 JOURNAL tab. Add an entry after every session — what went well, what clicked. Each entry is date-stamped, editable, and can include an optional video reference link." },
      { title:"Creating a Target Goal",
        body:"Tap + and select 🏹 TARGET. Fill in:\n• Title (required)\n• Target number — what you're working toward\n• Unit — what you're counting (moves, sessions, hours…)\n• Current progress\n• Deadline (optional)\n• Video Reference — a link to a tutorial or inspiration\n• Colour" },
      { title:"Target Goal counter",
        body:"Tap the + button on the tile to increment the counter directly. Tap − to decrement. The current count and total are always visible on the tile (e.g. '3 / 20 moves'). No popup, no friction." },
      { title:"Target Goal journal",
        body:"Open the goal and switch to the 📓 JOURNAL tab to log entries. Each entry can include a note and a video reference link. Entries are editable — tap the pencil icon on any entry to update it." },
      { title:"Goal colours and pinning",
        body:"All goals are pinned by default. Change colour or unpin via the ··· menu. Use colour to group or prioritise goals visually." },
    ]
  },
  {
    id:"notes", title:"📝 Notes", icon:"📝",
    items:[
      { title:"What notes are for",
        body:"Notes are your creative scratchpad. Use them for combo ideas, observations from training, references you want to come back to, or anything your brain needs to offload. Just a title, body text, colour, and an optional link." },
      { title:"Creating a note",
        body:"Go to TRAIN › Notes and tap +. Add a title, body text, an optional video/reference link, and pick a colour. Tap Save." },
      { title:"Pinning and colours",
        body:"Tap ··· on any note to pin it (keeps it at the top), change colour, or delete. Colours are purely visual — use them however makes sense to you." },
    ]
  },
  {
    id:"habits", title:"🔥 Habits", icon:"🔥",
    items:[
      { title:"What habits are for",
        body:"Habits are recurring actions you want to do consistently. Unlike goals (which have an end point), habits are ongoing. The app tracks your check-in history, calculates streaks, and shows your completion rate over the last 30 days." },
      { title:"Creating a habit",
        body:"Go to TRAIN › Habits and tap +. Fill in:\n• Name — include an emoji, e.g. '👟 Daily Practice'\n• Why — one sentence on your motivation\n• Time of Day — 🌅 Morning / ☀️ Afternoon / 🌙 Evening / ⚡ Anytime\n• Frequency — Every day, 2–6× per week, or Weekdays\n• Notes — shown when you expand the card\n• Colour — your habit's accent colour" },
      { title:"Checking in",
        body:"On the habit card, tap the check-in button (✓ or your emoji) to mark today as done. It fills with the habit colour. Tap again to undo. Each check-in stores today's date and resets automatically the next day." },
      { title:"Tile view and List view",
        body:"Tile view shows a ring chart for the current week with a Did it! / Done ✓ · undo button. List view shows each habit as a row — tap the › chevron to expand and see the same ring chart, 7-day bar, 30-day dot grid, streak, best, notes, and the full Did it! button." },
      { title:"Did it! button",
        body:"The large button at the bottom of each expanded card is your check-in. When done it shows DONE ✅ · undo in green. Tapping it again undoes the check-in." },
      { title:"Streaks and Best",
        body:"Streak = consecutive days you've hit your habit. Best = your longest streak ever. Both shown in days. Miss a day and the streak resets to zero." },
      { title:"30-day dot grid",
        body:"In the expanded view, a grid of 30 dots shows your recent history. Filled = checked in, empty = missed, outlined = today." },
      { title:"Today's progress banner",
        body:"At the top of the Habits tab, a progress bar shows how many habits you've done today. When all habits are done it turns green and shows 🔥 All done!" },
      { title:"Editing and deleting",
        body:"In tile view, use the ✏️ and 🗑 icons on each tile. In list view, use the icons in the collapsed row header." },
    ]
  },
  {
    id:"moves", title:"📜 MOVES", icon:"📜",
    items:[
      { title:"What MOVES is for",
        body:"MOVES is your personal move library. Every move you know or are learning lives here. Organise by category, track mastery, add descriptions and video references, and group moves into sets for battle." },
      { title:"Adding a move",
        body:"Tap + in the MOVES tab. Fill in:\n• Move name (required)\n• Category\n• Description — technique notes, cues, anything helpful\n• Video link — a YouTube or other reference URL\n• Mastery — 0–100% slider\nTap Save." },
      { title:"Mastery level",
        body:"Mastery is a 0–100% score you assign manually. The bar colour follows:\n• Red — 0–30% (learning)\n• Amber — 30–60% (developing)\n• Yellow — 60–80% (solid)\n• Green — 80–100% (battle-ready)" },
      { title:"Move tiles and rows",
        body:"In tile view, each move shows its name, description (2 lines), and mastery bar. In list view, each row shows name, description, and mastery. Tap anywhere on a tile or row to open and edit the move. The × button deletes." },
      { title:"Categories",
        body:"Moves are grouped by category. Tap a category to drill in and see its moves. From the ··· menu on a category you can rename, change colour, duplicate, or delete it. Reorder categories manually using the ⇅ button." },
      { title:"Sets",
        body:"Sets are named groups of moves — a combo or sequence. Go to MOVES › Sets to create one. Give it a name, details, and colour, then add moves from your library. Sets appear in both tile and list view with their details and move count visible." },
      { title:"Tile vs List view",
        body:"Toggle between views with the grid/list icon in the top right of MOVES. Your preference is remembered per section." },
      { title:"Video links",
        body:"Control how video links appear in Settings › Display › Video Link on Card: Inside only (link only in the move detail) or Inside & outside (quick-open icon on the card)." },
      { title:"Searching moves",
        body:"Tap the 🔍 icon to filter moves by name. The search is live." },
      { title:"CSV export and import",
        body:"Export all your data (moves, habits, goals, sets, notes) as a single CSV file via Settings › Data › Export All Data. Re-import moves from a CSV file using Import Moves — duplicates are automatically skipped." },
    ]
  },
  {
    id:"battle", title:"⚔️ BATTLE", icon:"⚔️",
    items:[
      { title:"What BATTLE is for",
        body:"BATTLE has two modes:\n• PLAN — build and organise your battle rounds in advance\n• FREESTYLE — build a live list of moves to cycle through during a jam or cypher" },
      { title:"Creating a round",
        body:"In BATTLE › Plan, tap + to open the New Round modal. Set:\n• Name (e.g. 'Semi Finals')\n• Colour\n• Number of entry slots (how many entries to pre-create)\nTap Create Round." },
      { title:"Round entries",
        body:"Each entry inside a round holds moves or sets from your library. Tap + inside an entry to add from your library. Reorder entries with ▲▼. Remove with ×. The mastery level of each item is shown." },
      { title:"Save and Load templates",
        body:"Save your current round layout as a named template with 💾 Save in the PLAN header. Load it back with 📂 Load. Templates store the full structure. Loading replaces your current rounds — you'll be warned first." },
      { title:"Reset rounds",
        body:"Tap ↺ in the PLAN header to restore the default round structure. You'll be asked to confirm — this erases all current rounds." },
      { title:"FREESTYLE — Building a list",
        body:"In BATTLE › Freestyle, tap + to open the move picker. Search by name or category, select moves or entire sets, then tap DONE to add them to your list." },
      { title:"FREESTYLE — Using the list",
        body:"Tap a move to mark it as used (moves to the bottom with a checkmark). Drag to reorder. The header shows remaining vs used count." },
      { title:"FREESTYLE — Save, Load and Reset",
        body:"Save your list with 💾 Save, load a saved list with 📂 Load, or clear it with ↺ Reset. Saved lists persist across sessions." },
    ]
  },
  {
    id:"settings", title:"⚙️ Settings", icon:"⚙️",
    items:[
      { title:"Opening Settings",
        body:"Tap the ⚙️ icon in the bottom navigation bar." },
      { title:"Display — Theme",
        body:"Switch between Light and Dark mode. Dark mode uses a deep Spotify-style palette with high contrast accents." },
      { title:"Display — Accent Colour",
        body:"Change the app's primary accent colour. Choose from several presets — the colour applies globally across buttons, highlights, and category bars." },
      { title:"Display — Default View",
        body:"Sets the starting layout for MOVES and Sets: List or Tiles." },
      { title:"Display — Show Mastery Level",
        body:"Shows or hides the mastery bar on move cards. Turn off for a cleaner look." },
      { title:"Display — Show Move Count Badge",
        body:"Shows the number of moves on category tiles." },
      { title:"Display — Video Link on Card",
        body:"'Inside only' = link only in the move detail. 'Inside & outside' = quick-open icon on the card surface." },
      { title:"Display — Zoom",
        body:"Scales the entire app. Range: 60%–140%. Use + and − buttons. Tap the % number to reset to 100%." },
      { title:"Behaviour — Confirm Before Deleting",
        body:"Shows a confirmation dialog before any delete. Recommended on. Default: on." },
      { title:"Behaviour — Show Deadline Indicator",
        body:"Shows or hides the coloured days-remaining label on Journey Goal tiles and list rows. Default: on." },
      { title:"Behaviour — Sort Categories By",
        body:"Manual (drag to reorder), Date Added, Alphabetical, or Mastery %. Default: Manual." },
      { title:"Behaviour — TRAIN Tab Order",
        body:"Reorder the Goals, Habits and Notes sub-tabs using the ▲▼ buttons. Saved immediately." },
      { title:"Behaviour — Streak Tracking",
        body:"Enables streak counting for Habits. Default: on." },
      { title:"Data — Export All Data",
        body:"Downloads all your data (moves, habits, goals, notes, sets) as a single timestamped CSV file." },
      { title:"Data — Import Moves from CSV",
        body:"Re-import moves from a MovesBook CSV export. Duplicates (same name + category) are skipped automatically. The app reloads after a successful import." },
      { title:"Data — Restart Tour",
        body:"Replays the onboarding walkthrough from the beginning." },
    ]
  },
  {
    id:"account", title:"👤 Account", icon:"👤",
    items:[
      { title:"Signing in",
        body:"Tap the profile circle in the top right corner. Sign in with Google (one tap) or with an email and password. Signing in enables cloud sync." },
      { title:"Your profile",
        body:"Tap the profile circle to open your profile. Set your nickname (shown in the header as 'MOVESBOOK of [name]'), age, gender, when you started breaking, your goals, and your why. Tap Save when done." },
      { title:"Cloud sync",
        body:"When signed in, all your data is synced automatically with a short debounce after each change. Available on any device when you sign back in." },
      { title:"Signing out",
        body:"Open your profile and tap SIGN OUT at the bottom. Your local data is preserved. Cloud data is waiting when you sign back in." },
      { title:"What gets synced",
        body:"Everything: moves, categories, sets, goals, notes, habits, battle rounds, freestyle lists, and settings." },
    ]
  },
  {
    id:"tips", title:"💡 Tips & Tricks", icon:"💡",
    items:[
      { title:"Use emojis in titles",
        body:"Goals, habits, notes and moves all support emojis in the title. E.g. '👟 Daily Practice', '🏹 Learn 20 moves', '🔥 Six Step Drill'. Makes the list feel alive and easier to scan at a glance." },
      { title:"Tap a goal tile to expand",
        body:"Journey Goal tiles expand in place — tap to see all 3 steps in full, your Why, Commitments, and Obstacles. Tap again to collapse. No need to open the edit modal just to review your plan." },
      { title:"Use sets for signature combos",
        body:"Create a Set in MOVES › Sets for your signature combo or opening sequence. Add it to your Freestyle list or Battle round as a single entry — all its moves come along for the ride." },
      { title:"Keep notes short",
        body:"Notes work best as quick captures. If something needs structure, it's probably a Goal. Use Notes for fragments, observations, and references — use Goals for anything with a plan behind it." },
      { title:"Check in daily",
        body:"The streak system only works if you check in consistently. Make it a ritual — open the app after training, tap ✓ on each habit. 5 seconds." },
      { title:"Add descriptions to moves",
        body:"The description field on a move is your personal technique note — key cues, common mistakes, what to focus on. It shows as a preview on the tile so you can read it without opening the move." },
      { title:"The Freestyle list persists",
        body:"Your Freestyle list is saved automatically. If you close the app mid-session, it's still there when you come back. Use 💾 Save to store it as a named list for future use." },
      { title:"Export before big changes",
        body:"Before clearing your move library or restoring rounds, use Settings › Export All Data to download a CSV backup. Import it back anytime." },
    ]
  },
];

export const ManualModal = ({ onClose }) => {
  const { C } = useSettings();
  const t = useT();
  const { resultCountStr } = usePlural();
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState({});
  const searchRef = useRef(null);

  const q = search.toLowerCase().trim();

  const filtered = MANUAL_SECTIONS.map(sec => ({
    ...sec,
    items: sec.items.filter(item =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q)
    )
  })).filter(sec => !q || sec.items.length > 0);

  // Auto-expand all sections when searching
  const sectionsOpen = q
    ? Object.fromEntries(filtered.map(s => [s.id, true]))
    : openSections;

  const toggleSection = (id) => {
    if (q) return; // don't toggle when searching
    setOpenSections(p => ({ ...p, [id]: !p[id] }));
  };

  const highlight = (text) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q
        ? <mark key={i} style={{ background:`${C.accent}40`, color:C.text, borderRadius:2, padding:"0 1px" }}>{part}</mark>
        : part
    );
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:900, display:"flex", flexDirection:"column",
      background:C.bg }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
        background:C.surface, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontWeight:900, fontSize:16, letterSpacing:2, fontFamily:FONT_DISPLAY, color:C.accent }}>
          {t("userManual")}
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic n="x" s={20} c={C.textMuted}/>
        </button>
      </div>

      {/* Search bar */}
      <div style={{ padding:"10px 14px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.bg,
          border:`1.5px solid ${q ? C.accent : C.border}`, borderRadius:10, padding:"7px 12px",
          transition:"border-color 0.15s" }}>
          <span style={{ fontSize:14, color:C.textMuted }}>🔍</span>
          <input
            ref={searchRef}
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={t("searchManual")}
            style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text,
              fontSize:13, fontFamily:FONT_BODY }}
            autoFocus
          />
          {search&&(
            <button onClick={()=>setSearch("")}
              style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}>
              <Ic n="x" s={13} c={C.textMuted}/>
            </button>
          )}
        </div>
        {q&&(
          <div style={{ fontSize:11, color:C.textMuted, marginTop:6, fontFamily:FONT_DISPLAY }}>
            {resultCountStr(filtered.reduce((acc,s)=>acc+s.items.length,0))} for "{search}"
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ flex:1, overflow:"auto", padding:"8px 0 80px" }}>
        {filtered.length===0&&(
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.textMuted }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🤷</div>
            <div style={{ fontSize:14, fontWeight:700, fontFamily:FONT_DISPLAY, marginBottom:6 }}>{t("nothingFound")}</div>
            <div style={{ fontSize:12 }}>{t("tryDifferentKeywords")}</div>
          </div>
        )}
        {filtered.map(sec=>{
          const isOpen = sectionsOpen[sec.id];
          return (
            <div key={sec.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}>
              {/* Section header */}
              <button
                onClick={()=>toggleSection(sec.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
                  textAlign:"left" }}>
                <span style={{ fontSize:18 }}>{sec.icon}</span>
                <span style={{ flex:1, fontWeight:900, fontSize:13, letterSpacing:1.5,
                  fontFamily:FONT_DISPLAY, color:C.text }}>{sec.title.replace(/^\p{Emoji}\s*/u, "")}</span>
                <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_DISPLAY,
                  marginRight:4 }}>{sec.items.length}</span>
                <Ic n={isOpen?"chevD":"chevR"} s={13} c={C.textMuted}/>
              </button>

              {/* Items */}
              {isOpen&&sec.items.map((item,i)=>(
                <div key={i} style={{ padding:"10px 16px 14px 44px",
                  background: i%2===0 ? C.surface : "transparent",
                  borderTop:`1px solid ${C.borderLight}` }}>
                  <div style={{ fontWeight:800, fontSize:13, color:C.accent,
                    fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginBottom:6 }}>
                    {highlight(item.title)}
                  </div>
                  <div style={{ fontSize:12, color:C.textSec, lineHeight:1.75,
                    whiteSpace:"pre-wrap", fontFamily:FONT_BODY }}>
                    {highlight(item.body)}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
