import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { C, buildPalette, FONT_SIZES } from './constants/colors';
import { FONT_DISPLAY, FONT_BODY } from './constants/fonts';
import { CATS, CAT_COLORS, INIT_ROUNDS } from './constants/categories';
import { SettingsCtx } from './hooks/useSettings';
import { TrainModalCtx } from './hooks/useTrainContext';
import { TRANSLATIONS } from './constants/translations';
import { SCHEMA_VERSION, migrateMove, loadLocal, saveLocal, debounce, unwrapPhoto } from './utils/storage';
import { todayLocal } from './utils/dateUtils';
import { migrateOldAttributes } from './utils/attributeHelpers';
import { Ic } from './components/shared/Ic';
import { ProfileAvatar } from './components/shared/ProfileAvatar';
import { Toast } from './components/shared/Toast';
import { NoteModal } from './components/train/NoteModal';
import { GoalModal } from './components/train/GoalModal';
import { TargetGoalModal } from './components/train/TargetGoalModal';
import { WIPPage } from './components/moves/WIPPage';
import { ReadyPage } from './components/battle/ReadyPage';
import { HomePage } from './components/home/HomePage';
import { ReflectPage } from './components/reflect/ReflectPage';
import { ProfileModal } from './components/modals/ProfileModal';
import { ManualModal } from './components/modals/ManualModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Walkthrough } from './components/modals/Walkthrough';
import { RepCounter } from './components/train/RepCounter';
import { Sparring } from './components/train/Sparring';
import { ComboMachine } from './components/train/ComboMachine';
import { MusicFlow } from './components/train/MusicFlow';
import { Lab } from './components/moves/Lab';
import { RestoreRemixRebuild } from './components/moves/RestoreRemixRebuild';
import { ManageReminders } from './components/moves/ManageReminders';
import { FlashCards } from './components/moves/FlashCards';
import { MyStanceAssessment } from './components/stance/MyStanceAssessment';
import { CompetitionSimulator } from './components/battle/CompetitionSimulator';
import { FlowMap } from './components/battle/FlowMap';
import { PostSessionPrompt } from './components/home/PostSessionPrompt';
import { CreateOverlay } from './components/moves/CreateOverlay';
import { usePremium } from './hooks/usePremium';
import { PremiumGate } from './components/shared/PremiumGate';
import { detectMilestones } from './utils/reportEngine';
import { runHomeMigration } from './utils/homeMigration';

// ── Firebase stubs for preview ──
if (typeof window !== "undefined") {
  window.__MB_USER__ = window.__MB_USER__ || null;
  window.__MB_DB__   = window.__MB_DB__   || null;
}

function migrateBattlePrep(bp) {
  if (!bp || typeof bp !== "object") return { plans: [], history: [] };
  if (Array.isArray(bp.plans)) return bp;
  if (bp.activePlan) return { plans: [bp.activePlan], history: bp.history || [] };
  return { plans: [], history: bp.history || [] };
}

export default function App() {
  const initLang = (() => { try { return JSON.parse(localStorage.getItem("mb_settings"))?.language || "en"; } catch { return "en"; } })();
  const [tab,setTab]=useState(()=>{ try { const st=localStorage.getItem("mb_settings"); if(st){ const p=JSON.parse(st); if(p.defaultTab){ const m={"wip":"moves","ideas":"home","ready":"battle","train":"home","vocab":"moves"}; const mapped=m[p.defaultTab]||p.defaultTab; const valid=["home","moves","battle","reflect"]; return valid.includes(mapped)?mapped:"home"; } } } catch {} return "home"; });

  // ── Data state ─────────────────────────────────────────────────────────────
  const [moves,  setMoves]  = useState(() => {
    try {
      const s = localStorage.getItem("mb_moves");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map(migrateMove); }
    } catch {}
    return [];
  });
  const [cats, setCats] = useState(() => {
    try {
      const s = localStorage.getItem("mb_cats");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return [...CATS];
  });
  const [catColors, setCatColors] = useState(() => {
    try {
      const s = localStorage.getItem("mb_cat_colors");
      if (s) { const p = JSON.parse(s); if (p && typeof p === "object") return p; }
    } catch {}
    return {...CAT_COLORS};
  });
  const [catDomains, setCatDomains] = useState(() => {
    try {
      const s = localStorage.getItem("mb_cat_domains");
      if (s) { const p = JSON.parse(s); if (p && typeof p === "object") return p; }
    } catch {}
    return {};
  });
  const [sets, setSets] = useState(() => {
    try {
      const s = localStorage.getItem("mb_sets");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return [];
  });
  const [rounds, setRounds] = useState(() => {
    try {
      const s = localStorage.getItem("mb_rounds");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return [];
  });
  const [habits, setHabits] = useState(() => {
    try {
      const s = localStorage.getItem("mb_habits");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return [];
  });
  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem("mb_profile");
      if (s) { const p = JSON.parse(s); if (p && Object.values(p).some(v=>v)) return p; }
    } catch {}
    return { nickname:"", age:"", gender:"", goals:"", years:"", startYear:"", startMonth:"", startDay:"", why:"" };
  });
  const [ideas, setIdeas] = useState(() => {
    try {
      const s = localStorage.getItem("mb_ideas");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return [];
  });
  const [customAttrs, setCustomAttrs] = useState(() => {
    try { const s=localStorage.getItem("mb_custom_attrs"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{} return [];
  });
  const [reps, setReps] = useState(() => {
    try { const s=localStorage.getItem("mb_reps"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{} return [];
  });
  const [sparring, setSparring] = useState(() => {
    try { const s=localStorage.getItem("mb_sparring"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { sessions:[], records:{} };
  });
  const DEFAULT_TRANSITIONS = ["Thread","Jump","Counter Spin","Slide","Sweep","Touch Foot","Kick","Hop","Roll","Twist","Drop","Spin Through"];
  const [combos, setCombos] = useState(() => {
    try { const s=localStorage.getItem("mb_combos"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { transitions:[...DEFAULT_TRANSITIONS], selectedMoveIds:null };
  });
  const [lab, setLab] = useState(() => {
    try { const s=localStorage.getItem("mb_lab"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { customChips:{ technical:{}, conceptual:{} } };
  });
  const [rrr, setRRR] = useState(() => {
    try { const s=localStorage.getItem("mb_rrr"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { lastUsed:{ mode:null, moveId:null, moveName:null, date:null } };
  });
  const [flashcards, setFlashcards] = useState(() => {
    try { const s=localStorage.getItem("mb_flashcards"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { bestScore:null };
  });
  const [profilePhoto, setProfilePhoto] = useState(() => {
    try { return unwrapPhoto(localStorage.getItem("mb_profile_photo")); } catch{} return null;
  });
  const [reminders, setReminders] = useState(() => {
    try { const s=localStorage.getItem("mb_reminders"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { items:[] };
  });
  const [calendar, setCalendar] = useState(() => {
    try { const s=localStorage.getItem("mb_calendar"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { events:[] };
  });
  const [stance, setStance] = useState(() => {
    try { const s=localStorage.getItem("mb_stance"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { assessments:[] };
  });
  const [musicflow, setMusicflow] = useState(() => {
    try { const s=localStorage.getItem("mb_musicflow"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { sessions:[] };
  });
  const [freestyle, setFreestyle] = useState(() => {
    try { const s=localStorage.getItem("mb_freestyle"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { trustMode:false };
  });
  const [reflections, setReflections] = useState(() => {
    try { const s=localStorage.getItem("mb_reflections"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { lastCategory:-1, lastDate:null };
  });
  const [rivals, setRivals] = useState(() => {
    try { const s=localStorage.getItem("mb_rivals"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{} return [];
  });
  const [battleprep, setBattleprep] = useState(() => {
    try { const s=localStorage.getItem("mb_battleprep"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return migrateBattlePrep(p);} } catch{} return { plans:[], history:[] };
  });
  const [flowmap, setFlowmap] = useState(() => {
    try {
      const s=localStorage.getItem("mb_flowmap");
      if(s){
        const p=JSON.parse(s);
        if(p&&typeof p==="object"){
          // Migrate pairing keys: fix any literal backslash-u sequences and ensure → character
          if(p.pairings){
            const fixed={};
            let changed=false;
            Object.entries(p.pairings).forEach(([k,v])=>{
              const nk=k.replace(/\\u2192/g,"→").replace(/\\u00b7/g,"·");
              if(nk!==k) changed=true;
              // Migrate single transition string to array
              if(v&&v.transition&&!v.transitions){
                v={...v, transitions:[v.transition]};
                changed=true;
              }
              fixed[nk]=v;
            });
            if(changed) p.pairings=fixed;
          }
          return p;
        }
      }
    } catch{}
    return { pairings:{} };
  });
  const [reports, setReports] = useState(() => {
    try { const s=localStorage.getItem("mb_reports"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{} return { milestones:[], weeklyDismissed:null };
  });
  const [milestonesShown, setMilestonesShown] = useState(() => {
    try { const s=localStorage.getItem("mb_milestones_shown"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{} return [];
  });
  const milestonesInitRef = useRef(false);
  const [presession, setPresession] = useState(() => {
    try { const s=localStorage.getItem("mb_presession"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{}
    return { fromLastSession:null, fromFootage:null, wantToTry:[] };
  });
  const [injuries, setInjuries] = useState(() => {
    try { const s=localStorage.getItem("mb_injuries"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{}
    return [];
  });
  const [homeStack, setHomeStack] = useState(() => {
    try { const s=localStorage.getItem("mb_home_stack"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{}
    return { defaultStack:[], overrides:{} };
  });
  const [homeIdeas, setHomeIdeas] = useState(() => {
    try { const s=localStorage.getItem("mb_home_ideas"); if(s){const p=JSON.parse(s); if(Array.isArray(p)) return p;} } catch{}
    return [];
  });
  const [homeChecks, setHomeChecks] = useState(() => {
    try { const s=localStorage.getItem("mb_home_checks"); if(s){const p=JSON.parse(s); if(p&&typeof p==="object") return p;} } catch{}
    return {};
  });
  const [showFlowMap, setShowFlowMap] = useState(false);
  const [showPostSessionPrompt, setShowPostSessionPrompt] = useState(false);
  // showPlusSheet removed — each page handles + via onAddTrigger
  const [showCreate, setShowCreate] = useState(false);
  const [bulkTrigger, setBulkTrigger] = useState(0);
  const lastSessionSaved = useRef(false);

  // ── Persist to localStorage on every change ────────────────────────────────
  useEffect(()=>{ saveLocal("mb_moves",   moves);   },[moves]);
  useEffect(()=>{ saveLocal("mb_cats",      cats);      },[cats]);
  useEffect(()=>{ saveLocal("mb_cat_colors",catColors); },[catColors]);
  useEffect(()=>{ saveLocal("mb_cat_domains",catDomains); },[catDomains]);
  useEffect(()=>{ saveLocal("mb_sets",    sets);    },[sets]);
  useEffect(()=>{ saveLocal("mb_rounds",  rounds);  },[rounds]);
  useEffect(()=>{
    try { localStorage.setItem("mb_habits", JSON.stringify(habits)); } catch {}
    const timer = setTimeout(()=>{ if(window.__MB_USER__?.uid && window.__MB_DB__) window.__MB_DB__.save(window.__MB_USER__.uid,"habits",habits); }, 1500);
    return ()=>clearTimeout(timer);
  },[habits]);
  useEffect(()=>{ if(Object.values(profile).some(v=>v)) saveLocal("mb_profile", profile); },[profile]);
  useEffect(()=>{ saveLocal("mb_custom_attrs", customAttrs); },[customAttrs]);
  useEffect(()=>{ saveLocal("mb_reps", reps); },[reps]);
  useEffect(()=>{ saveLocal("mb_sparring", sparring); },[sparring]);
  useEffect(()=>{ saveLocal("mb_combos", combos); },[combos]);
  useEffect(()=>{ saveLocal("mb_lab", lab); },[lab]);
  useEffect(()=>{ saveLocal("mb_rrr", rrr); },[rrr]);
  useEffect(()=>{ saveLocal("mb_flashcards", flashcards); },[flashcards]);
  useEffect(()=>{ saveLocal("mb_reminders", reminders); },[reminders]);
  useEffect(()=>{ saveLocal("mb_calendar", calendar); },[calendar]);
  useEffect(()=>{ saveLocal("mb_stance", stance); },[stance]);
  useEffect(()=>{ saveLocal("mb_musicflow", musicflow); },[musicflow]);
  useEffect(()=>{ saveLocal("mb_freestyle", freestyle); },[freestyle]);
  useEffect(()=>{ saveLocal("mb_reflections", reflections); },[reflections]);
  useEffect(()=>{ saveLocal("mb_rivals", rivals); },[rivals]);
  useEffect(()=>{
    if(profilePhoto && typeof profilePhoto === 'string' && profilePhoto.startsWith('data:')) {
      try { localStorage.setItem("mb_profile_photo", profilePhoto); } catch{}
    } else localStorage.removeItem("mb_profile_photo");
  },[profilePhoto]);
  useEffect(()=>{ saveLocal("mb_battleprep", battleprep); },[battleprep]);
  useEffect(()=>{ saveLocal("mb_flowmap", flowmap); },[flowmap]);
  useEffect(()=>{ saveLocal("mb_reports", reports); },[reports]);
  useEffect(()=>{ saveLocal("mb_milestones_shown", milestonesShown); },[milestonesShown]);
  useEffect(()=>{ saveLocal("mb_presession", presession); },[presession]);
  useEffect(()=>{ saveLocal("mb_injuries", injuries); },[injuries]);
  useEffect(()=>{ saveLocal("mb_home_stack", homeStack); },[homeStack]);
  useEffect(()=>{ saveLocal("mb_home_ideas", homeIdeas); },[homeIdeas]);
  useEffect(()=>{ saveLocal("mb_home_checks", homeChecks); },[homeChecks]);
  useEffect(()=>{ saveLocal("mb_ideas",   ideas);
    const timer = setTimeout(() => {
      if (window.__MB_USER__?.uid && window.__MB_DB__) {
        window.__MB_DB__.save(window.__MB_USER__.uid, 'ideas', ideas);
      }
    }, 1500);
    return () => clearTimeout(timer);
  },[ideas]);

  // ── Firestore sync ─────────────────────────────────────────────────────────
  const [fbUser, setFbUser] = useState(null);
  const { isPremium } = usePremium(fbUser);
  const [gatedFeature, setGatedFeature] = useState(null);
  const dbSave = useRef({});

  useEffect(() => {
    const save = (key, ms=1500) => debounce(
      (uid, val) => window.__MB_DB__?.save(uid, key, val), ms
    );
    dbSave.current = {
      moves:     save("moves"),
      sets:      save("sets"),
      rounds:    save("rounds"),
      profile:   save("profile"),
      ideas:     save("ideas"),
      settings:  save("settings"),
      cats:      save("cats"),
      catColors: save("catColors"),
      catDomains: save("catDomains"),
      customAttrs: save("customAttrs"),
      reps:        save("reps"),
      sparring:    save("sparring"),
      combos:      save("combos"),
      lab:         save("lab"),
      rrr:         save("rrr"),
      flashcards:  save("flashcards"),
      reminders:   save("reminders"),
      calendar:    save("calendar"),
      stance:      save("stance"),
      musicflow:   save("musicflow"),
      freestyle:   save("freestyle"),
      reflections: save("reflections"),
      rivals:      save("rivals"),
      battleprep:  save("battleprep"),
      flowmap:     save("flowmap"),
      reports:     save("reports"),
      milestonesShown: save("milestonesShown"),
      presession:  save("presession"),
      injuries:    save("injuries"),
      homeStack:   save("homeStack"),
      homeIdeas:   save("homeIdeas"),
      homeChecks:  save("homeChecks"),
      profilePhoto: save("profilePhoto"),
    };
  }, []);

  useEffect(()=>{ if(fbUser?.uid) dbSave.current.moves?.(fbUser.uid,   moves);   },[moves,   fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.ideas?.(fbUser.uid,   ideas);   },[ideas,   fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.sets?.(fbUser.uid,    sets);    },[sets,    fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.rounds?.(fbUser.uid,  rounds);  },[rounds,  fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.profile?.(fbUser.uid, profile); },[profile, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.cats?.(fbUser.uid,      cats);      },[cats,      fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.catColors?.(fbUser.uid, catColors); },[catColors, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.catDomains?.(fbUser.uid, catDomains); },[catDomains, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.customAttrs?.(fbUser.uid, customAttrs); },[customAttrs, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.reps?.(fbUser.uid, reps); },[reps, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.sparring?.(fbUser.uid, sparring); },[sparring, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.combos?.(fbUser.uid, combos); },[combos, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.lab?.(fbUser.uid, lab); },[lab, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.rrr?.(fbUser.uid, rrr); },[rrr, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.flashcards?.(fbUser.uid, flashcards); },[flashcards, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.reminders?.(fbUser.uid, reminders); },[reminders, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.calendar?.(fbUser.uid, calendar); },[calendar, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.stance?.(fbUser.uid, stance); },[stance, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.musicflow?.(fbUser.uid, musicflow); },[musicflow, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.freestyle?.(fbUser.uid, freestyle); },[freestyle, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.reflections?.(fbUser.uid, reflections); },[reflections, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.rivals?.(fbUser.uid, rivals); },[rivals, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.battleprep?.(fbUser.uid, battleprep); },[battleprep, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.flowmap?.(fbUser.uid, flowmap); },[flowmap, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.reports?.(fbUser.uid, reports); },[reports, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.milestonesShown?.(fbUser.uid, milestonesShown); },[milestonesShown, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.presession?.(fbUser.uid, presession); },[presession, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.injuries?.(fbUser.uid, injuries); },[injuries, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.homeStack?.(fbUser.uid, homeStack); },[homeStack, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.homeIdeas?.(fbUser.uid, homeIdeas); },[homeIdeas, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.homeChecks?.(fbUser.uid, homeChecks); },[homeChecks, fbUser]);
  useEffect(()=>{ if(fbUser?.uid && profilePhoto && profilePhoto.startsWith('data:')) dbSave.current.profilePhoto?.(fbUser.uid, profilePhoto); },[profilePhoto, fbUser]);

  // ── Flush profilePhoto on page close (debounced save may not have fired) ──
  const profilePhotoRef = useRef(profilePhoto);
  const fbUserRef = useRef(fbUser);
  useEffect(()=>{ profilePhotoRef.current = profilePhoto; },[profilePhoto]);
  useEffect(()=>{ fbUserRef.current = fbUser; },[fbUser]);
  useEffect(()=>{
    const flush = () => {
      const ph = profilePhotoRef.current;
      const u = fbUserRef.current;
      if(u?.uid && ph && ph.startsWith('data:')) window.__MB_DB__?.save(u.uid, "profilePhoto", ph);
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  },[]);

  // ── Auth resolution ────────────────────────────────────────────────────────
  useEffect(()=>{
    function handleAuthResolved() {
      if (window.__MB_USER__) {
        setFbUser(window.__MB_USER__);
        try {
          const m = localStorage.getItem("mb_moves");
          const s = localStorage.getItem("mb_sets");
          const r = localStorage.getItem("mb_rounds");
          const p = localStorage.getItem("mb_profile");
          if (m) { try { const p=JSON.parse(m); if(Array.isArray(p)&&p.length>0) setMoves(p.map(migrateMove)); } catch {} }
          const ct = localStorage.getItem("mb_cats"); if (ct) { try { const p=JSON.parse(ct); if(Array.isArray(p)&&p.length>0) setCats(p); } catch {} }
          const cc = localStorage.getItem("mb_cat_colors"); if (cc) { try { setCatColors(JSON.parse(cc)); } catch {} }
          const cd = localStorage.getItem("mb_cat_domains"); if (cd) { try { setCatDomains(JSON.parse(cd)); } catch {} }
          if (s) { try { const p=JSON.parse(s); if(Array.isArray(p)&&p.length>0) setSets(p); } catch {} }
          if (r) { try { const p=JSON.parse(r); if(Array.isArray(p)&&p.length>0) setRounds(p); } catch {} }
          const id = localStorage.getItem("mb_ideas");
          if (id) { try { const p=JSON.parse(id); if(Array.isArray(p)&&p.length>0) setIdeas(p); } catch {} }
          const hb = localStorage.getItem("mb_habits");
          if (hb) { try { const p=JSON.parse(hb); if(Array.isArray(p)&&p.length>0) setHabits(p); } catch {} }
          const ca = localStorage.getItem("mb_custom_attrs");
          if (ca) { try { const p=JSON.parse(ca); if(Array.isArray(p)) setCustomAttrs(p); } catch {} }
          const rp = localStorage.getItem("mb_reps");
          if (rp) { try { const p=JSON.parse(rp); if(Array.isArray(p)) setReps(p); } catch {} }
          const sp = localStorage.getItem("mb_sparring");
          if (sp) { try { const p=JSON.parse(sp); if(p&&typeof p==="object") setSparring(p); } catch {} }
          const cb = localStorage.getItem("mb_combos");
          if (cb) { try { const p=JSON.parse(cb); if(p&&typeof p==="object") setCombos(p); } catch {} }
          const lb = localStorage.getItem("mb_lab");
          if (lb) { try { const p=JSON.parse(lb); if(p&&typeof p==="object") setLab(p); } catch {} }
          const rr = localStorage.getItem("mb_rrr");
          if (rr) { try { const p=JSON.parse(rr); if(p&&typeof p==="object") setRRR(p); } catch {} }
          const rm = localStorage.getItem("mb_reminders");
          if (rm) { try { const p=JSON.parse(rm); if(p&&typeof p==="object") setReminders(p); } catch {} }
          const cal = localStorage.getItem("mb_calendar");
          if (cal) { try { const p=JSON.parse(cal); if(p&&typeof p==="object") setCalendar(p); } catch {} }
          const stn = localStorage.getItem("mb_stance");
          if (stn) { try { const p=JSON.parse(stn); if(p&&typeof p==="object") setStance(p); } catch {} }
          const mf = localStorage.getItem("mb_musicflow");
          if (mf) { try { const p=JSON.parse(mf); if(p&&typeof p==="object") setMusicflow(p); } catch {} }
          const fsl = localStorage.getItem("mb_freestyle");
          if (fsl) { try { const p=JSON.parse(fsl); if(p&&typeof p==="object") setFreestyle(p); } catch {} }
          const ref = localStorage.getItem("mb_reflections");
          if (ref) { try { const p=JSON.parse(ref); if(p&&typeof p==="object") setReflections(p); } catch {} }
          const rv = localStorage.getItem("mb_rivals");
          if (rv) { try { const p=JSON.parse(rv); if(Array.isArray(p)) setRivals(p); } catch {} }
          const bpp = localStorage.getItem("mb_battleprep");
          if (bpp) { try { const p=JSON.parse(bpp); if(p&&typeof p==="object") setBattleprep(migrateBattlePrep(p)); } catch {} }
          const fm = localStorage.getItem("mb_flowmap");
          if (fm) { try { const p=JSON.parse(fm); if(p&&typeof p==="object") setFlowmap(p); } catch {} }
          const rpt = localStorage.getItem("mb_reports");
          if (rpt) { try { const p=JSON.parse(rpt); if(p&&typeof p==="object") setReports(p); } catch {} }
          const msShown = localStorage.getItem("mb_milestones_shown");
          if (msShown) { try { const p=JSON.parse(msShown); if(Array.isArray(p)) setMilestonesShown(p); } catch {} }
          // One-time HOME migration: blocks → routine tiles, habits → goalhabit tiles
          {
            let migBlocks = [];
            try { const raw = localStorage.getItem("mb_blocks"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) migBlocks = p; } } catch {}
            let migHabits = [];
            try { const raw = localStorage.getItem("mb_habits"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) migHabits = p; } } catch {}
            let migIdeas = [];
            try { const raw = localStorage.getItem("mb_ideas"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) migIdeas = p; } } catch {}
            let migHS = { defaultStack: [], overrides: {} };
            try { const raw = localStorage.getItem("mb_home_stack"); if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") migHS = p; } } catch {}
            runHomeMigration(migBlocks, migHabits, migIdeas, migHS, setHomeStack);
          }
          const prs = localStorage.getItem("mb_presession");
          if (prs) { try { const p=JSON.parse(prs); if(p&&typeof p==="object") setPresession(p); } catch {} }
          const inj = localStorage.getItem("mb_injuries");
          if (inj) { try { const p=JSON.parse(inj); if(Array.isArray(p)) setInjuries(p); } catch {} }
          const hs = localStorage.getItem("mb_home_stack");
          if (hs) { try { const p=JSON.parse(hs); if(p&&typeof p==="object") setHomeStack(p); } catch {} }
          const hi = localStorage.getItem("mb_home_ideas");
          if (hi) { try { const p=JSON.parse(hi); if(Array.isArray(p)) setHomeIdeas(p); } catch {} }
          const hc = localStorage.getItem("mb_home_checks");
          if (hc) { try { const p=JSON.parse(hc); if(p&&typeof p==="object") setHomeChecks(p); } catch {} }
          const ppho = unwrapPhoto(localStorage.getItem("mb_profile_photo"));
          if (ppho) setProfilePhoto(ppho);
          if (p) { try { const pp=JSON.parse(p); if(pp&&Object.values(pp).some(v=>v)) setProfile(pp); } catch{} }
          const st = localStorage.getItem("mb_settings");
          if (st) {
            const parsed = JSON.parse(st);
            setAppSettings(prev=>({...prev,...parsed}));
            if (parsed.defaultTab) { const dtm={"wip":"moves","ideas":"home","ready":"battle","train":"home","vocab":"moves"}; const dtv=dtm[parsed.defaultTab]||parsed.defaultTab; const validTabs=["home","moves","battle","reflect"]; setTab(validTabs.includes(dtv)?dtv:"home"); }
            if (parsed.zoom) setZoom(parsed.zoom);
          }
          localStorage.setItem("mb_data_version", SCHEMA_VERSION);
          // Show tour for first-time users (no tour record for this uid)
          const uid = window.__MB_USER__.uid;
          if (!localStorage.getItem('mb_toured_' + uid)) setShowTour(true);
          // One-time migration: push existing rival photos to Firestore
          if (!localStorage.getItem("mb_rivals_photo_migrated")) {
            const rvMig = localStorage.getItem("mb_rivals");
            if (rvMig) {
              try { const p=JSON.parse(rvMig); if(Array.isArray(p)&&p.some(r=>r.photo)) { window.__MB_DB__?.save(uid,"rivals",p); } } catch{}
            }
            localStorage.setItem("mb_rivals_photo_migrated","1");
          }
        } catch {}
      } else {
        setFbUser(null);
        setMoves([]);
        setCats([...CATS]);
        setCatColors({...CAT_COLORS});
        setCatDomains({});
        setSets([]);
        setRounds(INIT_ROUNDS);
        setIdeas([]);
        setHabits([]);
        setProfile({ nickname:"", age:"", gender:"", goals:"", years:"",
          startYear:"", startMonth:"", startDay:"", why:"" });
        setCustomAttrs([]);
        setReps([]);
        setSparring({ sessions:[], records:{} });
        setCombos({ transitions:[...DEFAULT_TRANSITIONS], selectedMoveIds:null });
        setLab({ customChips:{ technical:{}, conceptual:{} } });
        setRRR({ lastUsed:{ mode:null, moveId:null, moveName:null, date:null } });
        setReminders({ items:[] });
        setCalendar({ events:[] });
        setStance({ assessments:[] });
        setMusicflow({ sessions:[] });
        setReflections({ lastCategory:-1, lastDate:null });
        setRivals([]);
        setProfilePhoto(null);
        setBattleprep({ plans:[], history:[] });
        setReports({ milestones:[], weeklyDismissed:null });
        setMilestonesShown([]);
        milestonesInitRef.current = false;
        setHomeStack({ defaultStack:[], overrides:{} });
        setHomeIdeas([]);
        setHomeChecks({});
      }
    }
    window.addEventListener("mb-auth-resolved", handleAuthResolved);
    if (window.__MB_USER__) handleAuthResolved();
    return () => window.removeEventListener("mb-auth-resolved", handleAuthResolved);
  },[]);

  // ── Migrate HOME tiles for non-auth users (one-time) ──
  const homeMigRef = useRef(false);
  useEffect(() => {
    if (homeMigRef.current) return;
    homeMigRef.current = true;
    // Read blocks from localStorage (state no longer exists)
    let migBlocks = [];
    try { const raw = localStorage.getItem("mb_blocks"); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) migBlocks = p; } } catch {}
    runHomeMigration(migBlocks, habits, ideas, homeStack, setHomeStack);
  }, []);

  // ── Migrate old rotation/travelling to custom attributes (one-time) ──
  useEffect(()=>{
    if(customAttrs.length===0 && moves.some(m=>m.rotation===true||m.travelling===true)){
      const result = migrateOldAttributes(moves, customAttrs);
      if(result.customAttrs.length>0){ setCustomAttrs(result.customAttrs); setMoves(result.moves); }
    }
  },[]);

  const [toasts,setToasts]=useState([]);
  const [showProfile,setShowProfile]=useState(false);

  const [zoom, setZoom] = useState(()=>{ try { const s=localStorage.getItem("mb_settings"); if(s){ const p=JSON.parse(s); if(p.zoom) return p.zoom; } } catch{} return 1; });
  const handleZoomChange = (val) => { setZoom(val); setAppSettings(p=>({...p, zoom:val})); };
  const zoomMin=0.6, zoomMax=1.4, zoomStep=0.1;
  const [addTick, setAddTick] = useState(0);
  const [subTab, setSubTab] = useState("moves"); // tracks active sub-tab across pages
  const [battlePrepSeed, setBattlePrepSeed] = useState(null); // { date, eventName } seed from Calendar
  const [calendarInitialMonth, setCalendarInitialMonth] = useState(null); // { year, month } for shared calendar
  const [calendarInitialDay,setCalendarInitialDay]=useState(null);
  const [trainModal,  setTrainModal]  = useState({});
  const [showManual,   setShowManual]   =useState(false);
  const [showSettings, setShowSettings] =useState(false);
  const [showTour,setShowTour]=useState(false);
  const [showRepCounter,setShowRepCounter]=useState(false);
  const [repCounterPreselect,setRepCounterPreselect]=useState(null);
  const [showSparring,setShowSparring]=useState(false);
  const [showComboMachine,setShowComboMachine]=useState(false);
  const [showManageReminders,setShowManageReminders]=useState(false);
  const [showLab,setShowLab]=useState(false);
  const [showRRR,setShowRRR]=useState(false);
  const [showFlashCards,setShowFlashCards]=useState(false);
  const [showStanceAssessment,setShowStanceAssessment]=useState(false);
  const [showCompSim,setShowCompSim]=useState(false);
  const [showMusicFlow,setShowMusicFlow]=useState(false);
  const [appSettings,setAppSettings]=useState(()=>({
    ...{
      theme:"light", defaultTab:"home", showMastery:true, decaySensitivity:"normal",
      compactCards:false, sortMoves:"custom", fontSize:"medium",
      showMoveCount:false, confirmDelete:true, practiceReminders:false,
      reminderTime:"18:00", streakTracking:true, showDeadlineIndicator:true,
      categorySort:"manual", defaultView:"list", language:"en", linkOnCard:"inside", targetAutoLink:false, trackMovesInSparring:true, showSectionDescriptions:true,
    },
    ...loadLocal("mb_settings", {}),
  }));
  useEffect(()=>{ saveLocal("mb_settings", appSettings); },[appSettings]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.settings?.(fbUser.uid, appSettings); },[appSettings, fbUser]);


  // ── Local translation function (App is above SettingsCtx.Provider, can't use useT) ──
  const _lang = appSettings.language || "en";
  const _dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  const tr = (key) => _dict[key] ?? TRANSLATIONS.en[key] ?? key;

  // ── Apply theme: mutate the shared C object so all components re-read it ──
  const newPalette = buildPalette(appSettings.theme);
  Object.assign(C, newPalette);

  // Font scale — inject into document root so all px-based sizes scale via CSS zoom
  const fontScale = FONT_SIZES[appSettings.fontSize] || 1;
  // Card padding scale
  const cardPad = appSettings.compactCards ? "6px 8px" : "10px 12px";
  const cardFontSize = appSettings.compactCards ? 11 : 13;

  const addToast=useCallback(t=>{ const id=Date.now(); setToasts(prev=>[...prev,{...t,id}]); setTimeout(()=>setToasts(prev=>prev.filter(x=>x.id!==id)),5500); },[]);
  const removeToast=id=>setToasts(prev=>prev.filter(t=>t.id!==id));

  // ── Milestone detection ──
  const milestoneT = useCallback((key) => (TRANSLATIONS[appSettings.language||"en"]||TRANSLATIONS.en)[key] || TRANSLATIONS.en[key] || key, [appSettings.language]);
  useEffect(() => {
    if (!fbUser) return; // Don't run before auth/data load
    const newMs = detectMilestones(
      { moves, sparring, battleprep, reps, musicflow, cats, calendar },
      milestonesShown.map(id => ({ id }))
    );
    if (newMs.length > 0) {
      const newIds = newMs.map(m => m.id);
      if (milestonesInitRef.current) {
        // Live detection — show toasts for newly-earned milestones
        newMs.forEach(m => {
          const label = m.val
            ? `${m.val} ${milestoneT("movesInVocab")}`
            : milestoneT(m.label);
          addToast({ icon:"check", title:milestoneT("milestoneReached"), msg:label });
        });
      }
      // Silent or live — always persist
      setMilestonesShown(prev => [...prev, ...newIds]);
      setReports(prev => ({ ...prev, milestones:[...prev.milestones, ...newMs] }));
    }
    milestonesInitRef.current = true;
  }, [moves.length, sparring?.sessions?.length, battleprep?.history?.length, reps.length, musicflow?.sessions?.length, fbUser]);

  const addCalendarEvent = useCallback((eventData, { silent = false } = {}) => {
    setCalendar(prev => {
      const isDup = (prev.events || []).some(e =>
        e.source === eventData.source && e.date === eventData.date && e.title === eventData.title
      );
      if (isDup) return prev;
      return { ...prev, events: [...(prev.events || []), { id: Date.now(), ...eventData }] };
    });
    if (!silent) addToast({ icon: "check", title: tr("sessionLogged") });
  }, [setCalendar, addToast, tr]);

  const removeCalendarEvent = useCallback((eventId) => {
    setCalendar(prev => ({ ...prev, events: (prev.events || []).filter(e => e.id !== eventId) }));
  }, [setCalendar]);

  const onUpdateRepSession = useCallback((sessionId, updates) => {
    setReps(prev => prev.map(s => s.id === sessionId ? {...s, ...updates} : s));
  }, []);
  const onUpdateMusicflowSession = useCallback((sessionId, updates) => {
    setMusicflow(prev => ({
      ...prev,
      sessions: (prev.sessions || []).map(s => s.id === sessionId ? {...s, ...updates} : s),
    }));
  }, []);

  const setMovesGrad = useCallback(updater => {
    setMoves(prev => typeof updater==="function" ? updater(prev) : updater);
  }, []);

  // Secondary add trigger — used for "Add Category" and "Create Round" from bottom menu
  const [addTick2, setAddTick2] = useState(0);

  // + button: contextual — each page handles addTick via onAddTrigger
  const handlePlusPress = () => { setAddTick(t=>t+1); };
  const handleTourDone = () => {
    setShowTour(false);
    if (fbUser?.uid) localStorage.setItem('mb_toured_' + fbUser.uid, '1');
  };

  const vocabMoves = moves;

  // GAP badge: count stale moves (default 14-day threshold with difficulty adjustment)
  const staleCount = useMemo(() => {
    const todayMs = new Date(todayLocal()).getTime();
    return moves.filter(m => {
      const lastMs = m.date ? new Date(m.date).getTime() : 0;
      const days = Math.floor((todayMs - lastMs) / 86400000);
      const mult = m.difficulty === "easy" ? 0.7 : m.difficulty === "advanced" ? 1.5 : 1;
      return days >= Math.round(14 * mult);
    }).length;
  }, [moves]);

  const effectiveZoom = fontScale * zoom;
  const rootHeight = effectiveZoom < 1 ? `${(100 / effectiveZoom).toFixed(2)}vh` : "100vh";

  return (
    <SettingsCtx.Provider value={{ settings:appSettings, C, cardPad, cardFontSize }}>
      <style>{`
        #movesbook-root { zoom: ${effectiveZoom.toFixed(3)}; }
        #movesbook-root * { box-sizing: border-box; }
      `}</style>
      <div id="movesbook-root" style={{ fontFamily:FONT_BODY, background:C.bg, color:C.text,
        height: rootHeight, width:"100%", display:"flex", flexDirection:"column", position:"relative",
        boxShadow:"0 0 60px rgba(0,0,0,0.35)", overflow:"hidden", transition:"background 0.3s, color 0.3s" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 16px", background:C.header, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:21, letterSpacing:4 }}>
              <span style={{ color:"#cf0000" }}>MOVES</span><span style={{ color:C.headerText }}>BOOK</span>
            </span>
            {profile.nickname&&(
              <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, marginLeft:7, fontWeight:500, letterSpacing:0.3 }}>
                of {profile.nickname}
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <ProfileAvatar profilePhoto={profilePhoto} fbUser={fbUser} nickname={profile.nickname}
              size={26} C={C} onClick={()=>setShowProfile(true)} id="tour-profile" />
            <button onClick={()=>setShowSettings(true)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:5 }}
              title="Settings">
              <Ic n="cog" s={18} c={C.brownLight}/>
            </button>
          </div>
        </div>

        {/* Top TabBar removed — navigation is now in the bottom bar */}

        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>
          {/* Train modals + menu — inside position:relative so absolute children are scoped to app width */}
          {(trainModal.type==="note"||trainModal.type==="goal"||trainModal.type==="target")&&(
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:10 }}>
              {trainModal.type==="note"&&<NoteModal
                idea={trainModal.idea}
                onClose={()=>setTrainModal({})}
                onSave={fields=>{ trainModal.onSave(fields); setTrainModal({}); }}/>}
              {trainModal.type==="goal"&&<GoalModal
                idea={trainModal.idea}
                onClose={()=>setTrainModal({})}
                onSave={fields=>{ trainModal.onSave(fields); setTrainModal({}); }}/>}
              {trainModal.type==="target"&&<TargetGoalModal
                idea={trainModal.idea}
                moves={moves}
                onClose={()=>setTrainModal({})}
                onSave={fields=>{ trainModal.onSave(fields); setTrainModal({}); }}/>}
            </div>
          )}
          <TrainModalCtx.Provider value={{ openModal:(type,idea,onSave)=>{ setTrainModal({type,idea,onSave}); } }}>
            {tab==="home" && !showCreate && <HomePage habits={habits} setHabits={setHabits} injuries={injuries} setInjuries={setInjuries} presession={presession} setPresession={setPresession} ideas={ideas} setIdeas={setIdeas} settings={appSettings} onSettingsChange={setAppSettings} homeStack={homeStack} setHomeStack={setHomeStack} homeIdeas={homeIdeas} setHomeIdeas={setHomeIdeas} homeChecks={homeChecks} setHomeChecks={setHomeChecks} onAddTrigger={addTick} addCalendarEvent={addCalendarEvent} removeCalendarEvent={removeCalendarEvent} calendar={calendar} moves={moves} setMoves={setMovesGrad} cats={cats} catColors={catColors} customAttrs={customAttrs} setCustomAttrs={setCustomAttrs} isPremium={isPremium}/>}
            {tab==="moves" && !showCreate && <WIPPage moves={vocabMoves} setMoves={setMovesGrad} cats={cats} setCats={setCats} catColors={catColors} setCatColors={setCatColors} catDomains={catDomains} setCatDomains={setCatDomains} sets={sets} setSets={setSets} addToast={addToast} settings={appSettings} onSettingsChange={setAppSettings} onAddTrigger={addTick} onAddTrigger2={addTick2} onSubTabChange={setSubTab} parentSubTab={subTab} onSortChange={(key,val)=>setAppSettings(p=>({...p,[key]:val}))} customAttrs={customAttrs} setCustomAttrs={setCustomAttrs} reminders={reminders} onRemindersChange={setReminders} onDrill={(move)=>{setRepCounterPreselect(move);setShowRepCounter(true);}} onOpenManageReminders={()=>setShowManageReminders(true)} isPremium={isPremium} staleCount={staleCount} onOpenExplore={()=>{if(!isPremium){setGatedFeature("explore");return;}setShowLab(true);}} onOpenRRR={()=>{if(!isPremium){setGatedFeature("rrr");return;}setShowRRR(true);}} onOpenCombine={()=>{if(!isPremium){setGatedFeature("combine");return;}setShowComboMachine(true);}} onOpenMap={()=>{if(!isPremium){setGatedFeature("map");return;}setShowFlowMap(true);}} onOpenFlashCards={()=>{if(!isPremium){setGatedFeature("flashCards");return;}setShowFlashCards(true);}} onOpenTools={()=>setShowCreate(true)} onOpenFlow={()=>{if(!isPremium){setGatedFeature("flow");return;}setShowMusicFlow(true);}} onBulkTrigger={bulkTrigger}/>}
            {tab==="battle" && !showCreate && <ReadyPage moves={moves} sets={sets} setSets={setSets} rounds={rounds} setRounds={setRounds} settings={appSettings} onAddTrigger={addTick} onAddTrigger2={addTick2} onSubTabChange={setSubTab} addToast={addToast} freestyle={freestyle} onFreestyleChange={setFreestyle} rivals={rivals} onRivalsChange={setRivals} addCalendarEvent={addCalendarEvent} removeCalendarEvent={removeCalendarEvent} isPremium={isPremium} onSimulate={()=>{if(!isPremium){setGatedFeature("compSim");return;}setShowCompSim(true);}} battleprep={battleprep} setBattleprep={setBattleprep} calendar={calendar} battlePrepSeed={battlePrepSeed} onBattlePrepSeedUsed={()=>setBattlePrepSeed(null)} onOpenSharedCalendar={(im)=>{setCalendarInitialMonth(im||null);}}/>}
            {tab==="reflect" && !showCreate && <ReflectPage isPremium={isPremium} ideas={ideas} setIdeas={setIdeas} moves={moves} setMoves={setMovesGrad} reps={reps} sparring={sparring} musicflow={musicflow} habits={habits} calendar={calendar} setCalendar={setCalendar} cats={cats} catColors={catColors} settings={appSettings} onSettingsChange={setAppSettings} addToast={addToast} stance={stance} battleprep={battleprep} onToggleBattlePrepTask={(planId,dateStr,taskIdx)=>{setBattleprep(prev=>{const plans=(prev.plans||[]).map(p=>{if(p.id!==planId) return p;const key=dateStr+"-"+taskIdx;return {...p, completedTasks:{...(p.completedTasks||{}), [key]:!(p.completedTasks||{})[key]}};});return {...prev, plans};});}} onOpenStanceAssessment={()=>setShowStanceAssessment(true)} addCalendarEvent={addCalendarEvent} removeCalendarEvent={removeCalendarEvent} onSubTabChange={setSubTab} onGoToPrep={(seed)=>{setBattlePrepSeed(seed);setTab("battle");}} initialDay={calendarInitialDay} initialMonth={calendarInitialMonth} sets={sets} onAddTrigger={addTick} parentSubTab={subTab} reports={reports} injuries={injuries}/>}
          </TrainModalCtx.Provider>
          {showRepCounter&&<RepCounter moves={moves} catColors={catColors} reps={reps}
            preselectedMove={repCounterPreselect}
            onSaveSession={(session)=>{
              setReps(prev=>[session,...prev]);
              setMoves(prev=>prev.map(m=>m.id===session.moveId?{...m,date:todayLocal()}:m));
              lastSessionSaved.current=true;
            }}
            onUpdateSession={onUpdateRepSession}
            reflections={reflections} onReflectionsChange={setReflections}
            addCalendarEvent={addCalendarEvent}
            onClose={()=>{setShowRepCounter(false);setRepCounterPreselect(null);if(lastSessionSaved.current){lastSessionSaved.current=false;if(isPremium)setShowPostSessionPrompt(true);}}}/>}
          {showSparring&&<Sparring moves={moves} catColors={catColors} sparring={sparring} settings={appSettings}
            onSaveSession={(session, updatedSparring)=>{
              setSparring(updatedSparring);
              if(session.movesTrained?.length){
                setMoves(prev=>prev.map(m=>session.movesTrained.includes(m.id)?{...m,date:todayLocal()}:m));
              }
              lastSessionSaved.current=true;
            }}
            reflections={reflections} onReflectionsChange={setReflections}
            onSettingsChange={setAppSettings}
            addCalendarEvent={addCalendarEvent}
            rivals={rivals} onRivalsChange={setRivals} addToast={addToast}
            onClose={()=>{setShowSparring(false);if(lastSessionSaved.current){lastSessionSaved.current=false;if(isPremium)setShowPostSessionPrompt(true);}}}/>}
          {showCompSim&&<CompetitionSimulator rounds={rounds} moves={moves} catColors={catColors}
            sparring={sparring} settings={appSettings}
            onSaveSession={(session, updatedSparring)=>{ setSparring(updatedSparring); }}
            reflections={reflections} onReflectionsChange={setReflections}
            onSettingsChange={setAppSettings}
            addCalendarEvent={addCalendarEvent}
            onClose={()=>setShowCompSim(false)}/>}
          {showComboMachine&&<ComboMachine moves={moves} catColors={catColors} combos={combos}
            onCombosChange={setCombos}
            onSaveSet={(fields)=>{ setSets(p=>[...p,{id:Date.now(),...fields}]); }}
            addToast={addToast} addCalendarEvent={addCalendarEvent}
            onClose={()=>setShowComboMachine(false)}/>}
          {showManageReminders&&<ManageReminders
            reminders={reminders} onRemindersChange={setReminders}
            addToast={addToast} settings={appSettings}
            onClose={()=>setShowManageReminders(false)}/>}
          {showLab&&<Lab moves={moves} cats={cats} catColors={catColors} lab={lab}
            onLabChange={setLab}
            onSaveMove={(moveData)=>{ setMoves(prev=>[...prev,{...moveData, id:Date.now()}]); }}
            addToast={addToast} addCalendarEvent={addCalendarEvent}
            onClose={()=>setShowLab(false)}/>}
          {showRRR&&<RestoreRemixRebuild moves={moves} catColors={catColors} rrr={rrr}
            onRRRChange={setRRR} addToast={addToast} addCalendarEvent={addCalendarEvent}
            onClose={()=>setShowRRR(false)}/>}
          {showFlashCards&&<FlashCards sets={sets} moves={moves} flashcards={flashcards}
            onFlashcardsChange={setFlashcards} addCalendarEvent={addCalendarEvent} addToast={addToast}
            onClose={()=>setShowFlashCards(false)}/>}
          {showFlowMap&&<FlowMap moves={moves} cats={cats} catColors={catColors}
            flowmap={flowmap} onFlowmapChange={setFlowmap}
            combos={combos}
            onSaveMove={(moveData)=>{ setMoves(prev=>[...prev,{...moveData, id:Date.now()}]); }}
            onSaveSet={(fields)=>{ setSets(p=>[...p,{id:Date.now(),...fields}]); }}
            addToast={addToast}
            onClose={()=>setShowFlowMap(false)}/>}
          {showMusicFlow&&<MusicFlow musicflow={musicflow} onMusicflowChange={(updater)=>{lastSessionSaved.current=true;setMusicflow(updater);}}
            onUpdateSession={onUpdateMusicflowSession}
            reflections={reflections} onReflectionsChange={setReflections}
            addToast={addToast} addCalendarEvent={addCalendarEvent}
            onClose={()=>{setShowMusicFlow(false);if(lastSessionSaved.current){lastSessionSaved.current=false;if(isPremium)setShowPostSessionPrompt(true);}}}/>}
          {showPostSessionPrompt&&<PostSessionPrompt presession={presession} setPresession={setPresession} onClose={()=>setShowPostSessionPrompt(false)}/>}
          {showStanceAssessment&&<MyStanceAssessment stance={stance} onStanceChange={setStance}
            addToast={addToast} onClose={()=>{ setShowStanceAssessment(false); setTab("reflect"); setSubTab("stance"); }}/>}
          {showProfile&&<ProfileModal onClose={()=>setShowProfile(false)} profile={profile} onSave={setProfile}
            reminders={reminders} onRemindersChange={setReminders} addToast={addToast}
            onOpenManageReminders={()=>{ setShowProfile(false); setShowManageReminders(true); }}
            onNavigateToStance={()=>{ setShowProfile(false); setTab("reflect"); setSubTab("stance"); }}
            settings={appSettings} onSettingsChange={setAppSettings} onClearMoves={()=>setMoves([])} onRestoreRounds={()=>setRounds(INIT_ROUNDS)} onRestartTour={()=>{setShowProfile(false);setShowTour(true);}} zoom={zoom} onZoomChange={handleZoomChange} customAttrs={customAttrs} setCustomAttrs={setCustomAttrs}
            onOpenManual={()=>{setShowProfile(false);setShowManual(true);}}
            profilePhoto={profilePhoto} onProfilePhotoChange={setProfilePhoto} fbUser={fbUser}/>}
          {showManual&&<ManualModal onClose={()=>setShowManual(false)}/>}
          {showSettings&&<SettingsModal
            onClose={()=>setShowSettings(false)}
            settings={appSettings} onSave={setAppSettings}
            onClearMoves={()=>setMoves([])}
            onRestoreRounds={()=>setRounds(INIT_ROUNDS)}
            onRestartTour={()=>{setShowSettings(false);setShowTour(true);}}
            zoom={zoom} onZoomChange={handleZoomChange}
            customAttrs={customAttrs} setCustomAttrs={setCustomAttrs}
            onOpenManual={()=>{setShowSettings(false);setShowManual(true);}}
          />}
          {showCreate&&<CreateOverlay
            onOpenExplore={()=>{setShowCreate(false);if(!isPremium){setGatedFeature("explore");return;}setShowLab(true);}}
            onOpenRRR={()=>{setShowCreate(false);if(!isPremium){setGatedFeature("rrr");return;}setShowRRR(true);}}
            onOpenCombine={()=>{setShowCreate(false);if(!isPremium){setGatedFeature("combine");return;}setShowComboMachine(true);}}
            onOpenMap={()=>{setShowCreate(false);if(!isPremium){setGatedFeature("map");return;}setShowFlowMap(true);}}
            onOpenFlow={()=>{setShowCreate(false);if(!isPremium){setGatedFeature("flow");return;}setShowMusicFlow(true);}}
            onClose={()=>setShowCreate(false)}
          />}
        </div>

        {gatedFeature&&<div onClick={()=>setGatedFeature(null)} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:400,width:"100%"}}><PremiumGate feature={gatedFeature} addToast={addToast}/></div>
        </div>}
        <Toast toasts={toasts} remove={removeToast}/>
        {showTour&&<Walkthrough onDone={handleTourDone}/>}

        {/* Plus BottomSheet removed — each page handles + via onAddTrigger */}

        {/* ── Bottom Bar — 4 tabs + centre Add ── */}
        {!showTour&&(()=>{
          const anyOverlay = showRepCounter||showSparring||showComboMachine||showManageReminders||showRRR||showFlashCards||showLab||showProfile||showManual||showSettings||showStanceAssessment||showMusicFlow||showCompSim||showPostSessionPrompt||showCreate;
          const tabs = [{id:"home",icon:"home",label:tr("home")},{id:"moves",icon:"book",label:tr("vocab")},null,{id:"battle",icon:"sword",label:tr("battle")},{id:"reflect",icon:"barChart",label:tr("reflect")}];
          const handleTabChange = (t) => { setTab(t); setAddTick(0); setAddTick2(0); setSubTab(t==="moves"?"moves":t==="battle"?"plan":t==="reflect"?"calendar":""); };
          return (
          <div style={{ display:"flex", alignItems:"stretch",
            background:C.header, flexShrink:0, height:50, zIndex:100 }}>
            {tabs.map((tb,i)=>{
              if(!tb) return (
                <div key="plus" style={{ flex:"0 0 64px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  <button id="tour-add-btn" onClick={handlePlusPress}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center",
                      justifyContent:"center", background:"none", border:"none", cursor:"pointer" }}>
                    <div style={{ width:36, height:36, borderRadius:18, background:C.accent,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Ic n="plus" s={18} c="#fff"/>
                    </div>
                  </button>
                </div>
              );
              const on = tab===tb.id && !anyOverlay;
              return (
                <button key={tb.id} onClick={()=>handleTabChange(tb.id)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", gap:3, background:"none",
                    border:"none",
                    cursor:"pointer", color:on?C.text:C.textMuted, transition:"all 0.15s", position:"relative", overflow:"visible" }}>
                  <span style={{ fontSize:12, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:1.2, borderBottom:`2px solid ${on?C.accent:"transparent"}`, paddingBottom:3 }}>{tb.label}</span>
                </button>
              );
            })}
          </div>
          );
        })()}
      </div>
    </SettingsCtx.Provider>
  );
}
