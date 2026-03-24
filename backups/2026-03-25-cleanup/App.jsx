import React, { useState, useRef, useEffect, useCallback, useMemo, Fragment } from 'react';
import { C, buildPalette, FONT_SIZES, PRESET_COLORS } from './constants/colors';
import { FONT_DISPLAY, FONT_BODY } from './constants/fonts';
import { CATS, CAT_COLORS, INIT_MOVES, INIT_IDEAS, INIT_HABITS, INIT_SETS, INIT_ROUNDS, getInitIdeas, getInitHabits, getInitSets } from './constants/categories';
import { SettingsCtx } from './hooks/useSettings';
import { TrainModalCtx, TrainMenuCtx } from './hooks/useTrainContext';
import { TRANSLATIONS } from './constants/translations';
import { SCHEMA_VERSION, migrateMove, loadLocal, saveLocal, debounce } from './utils/storage';
import { Ic } from './components/shared/Ic';
import { Toast } from './components/shared/Toast';
import { TabBar } from './components/shared/TabBar';
import { NoteModal } from './components/train/NoteModal';
import { GoalModal } from './components/train/GoalModal';
import { TargetGoalModal } from './components/train/TargetGoalModal';
import { IdeaMenu } from './components/train/IdeaMenu';
import { IdeasPage } from './components/train/IdeasPage';
import { WIPPage } from './components/moves/WIPPage';
import { ReadyPage } from './components/battle/ReadyPage';
import { ProfileModal } from './components/modals/ProfileModal';
import { ManualModal } from './components/modals/ManualModal';
import { FeedbackModal } from './components/modals/FeedbackModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Walkthrough } from './components/modals/Walkthrough';
import { BackupModal } from './components/modals/BackupModal';

// ── Firebase stubs for preview ──
if (typeof window !== "undefined") {
  window.__MB_USER__ = window.__MB_USER__ || null;
  window.__MB_DB__   = window.__MB_DB__   || null;
}

export default function App() {
  const initLang = (() => { try { return JSON.parse(localStorage.getItem("mb_settings"))?.language || "en"; } catch { return "en"; } })();
  const [tab,setTab]=useState(()=>{ try { const st=localStorage.getItem("mb_settings"); if(st){ const p=JSON.parse(st); if(p.defaultTab) return p.defaultTab; } } catch {} return "wip"; });

  // ── Data state ─────────────────────────────────────────────────────────────
  const [moves,  setMoves]  = useState(() => {
    try {
      const s = localStorage.getItem("mb_moves");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map(migrateMove); }
    } catch {}
    return INIT_MOVES;
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
  const [sets, setSets] = useState(() => {
    try {
      const s = localStorage.getItem("mb_sets");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return getInitSets(initLang);
  });
  const [rounds, setRounds] = useState(() => {
    try {
      const s = localStorage.getItem("mb_rounds");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return INIT_ROUNDS;
  });
  const [habits, setHabits] = useState(() => {
    try {
      const s = localStorage.getItem("mb_habits");
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p; }
    } catch {}
    return getInitHabits(initLang);
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
    return getInitIdeas(initLang);
  });

  // ── Persist to localStorage on every change ────────────────────────────────
  useEffect(()=>{ saveLocal("mb_moves",   moves);   },[moves]);
  useEffect(()=>{ saveLocal("mb_cats",      cats);      },[cats]);
  useEffect(()=>{ saveLocal("mb_cat_colors",catColors); },[catColors]);
  useEffect(()=>{ saveLocal("mb_sets",    sets);    },[sets]);
  useEffect(()=>{ saveLocal("mb_rounds",  rounds);  },[rounds]);
  useEffect(()=>{
    try { localStorage.setItem("mb_habits", JSON.stringify(habits)); } catch {}
    const timer = setTimeout(()=>{ if(window.__MB_USER__?.uid && window.__MB_DB__) window.__MB_DB__.save(window.__MB_USER__.uid,"habits",habits); }, 1500);
    return ()=>clearTimeout(timer);
  },[habits]);
  useEffect(()=>{ if(Object.values(profile).some(v=>v)) saveLocal("mb_profile", profile); },[profile]);
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
    };
  }, []);

  useEffect(()=>{ if(fbUser?.uid) dbSave.current.moves?.(fbUser.uid,   moves);   },[moves,   fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.ideas?.(fbUser.uid,   ideas);   },[ideas,   fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.sets?.(fbUser.uid,    sets);    },[sets,    fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.rounds?.(fbUser.uid,  rounds);  },[rounds,  fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.profile?.(fbUser.uid, profile); },[profile, fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.cats?.(fbUser.uid,      cats);      },[cats,      fbUser]);
  useEffect(()=>{ if(fbUser?.uid) dbSave.current.catColors?.(fbUser.uid, catColors); },[catColors, fbUser]);

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
          if (s) { try { const p=JSON.parse(s); if(Array.isArray(p)&&p.length>0) setSets(p); } catch {} }
          if (r) { try { const p=JSON.parse(r); if(Array.isArray(p)&&p.length>0) setRounds(p); } catch {} }
          const id = localStorage.getItem("mb_ideas");
          if (id) { try { const p=JSON.parse(id); if(Array.isArray(p)&&p.length>0) setIdeas(p); } catch {} }
          const hb = localStorage.getItem("mb_habits");
          if (hb) { try { const p=JSON.parse(hb); if(Array.isArray(p)&&p.length>0) setHabits(p); } catch {} }
          if (p) { try { const pp=JSON.parse(p); if(pp&&Object.values(pp).some(v=>v)) setProfile(pp); } catch{} }
          const st = localStorage.getItem("mb_settings");
          if (st) {
            const parsed = JSON.parse(st);
            setAppSettings(prev=>({...prev,...parsed}));
            if (parsed.defaultTab) setTab(parsed.defaultTab);
            if (parsed.zoom) setZoom(parsed.zoom);
          }
          localStorage.setItem("mb_data_version", SCHEMA_VERSION);
          // Show tour for first-time users (no tour record for this uid)
          const uid = window.__MB_USER__.uid;
          if (!localStorage.getItem('mb_toured_' + uid)) setShowTour(true);
        } catch {}
      } else {
        setFbUser(null);
        setMoves(INIT_MOVES);
        setCats([...CATS]);
        setCatColors({...CAT_COLORS});
        setSets(INIT_SETS);
        setRounds(INIT_ROUNDS);
        setIdeas(INIT_IDEAS);
        setHabits(INIT_HABITS);
        setProfile({ nickname:"", age:"", gender:"", goals:"", years:"",
          startYear:"", startMonth:"", startDay:"", why:"" });
      }
    }
    window.addEventListener("mb-auth-resolved", handleAuthResolved);
    if (window.__MB_USER__) handleAuthResolved();
    return () => window.removeEventListener("mb-auth-resolved", handleAuthResolved);
  },[]);

  const [toasts,setToasts]=useState([]);
  const [ideaToMove,setIdeaToMove]=useState(null);
  const [showProfile,setShowProfile]=useState(false);

  const [zoom, setZoom] = useState(()=>{ try { const s=localStorage.getItem("mb_settings"); if(s){ const p=JSON.parse(s); if(p.zoom) return p.zoom; } } catch{} return 1; });
  const handleZoomChange = (val) => { setZoom(val); setAppSettings(p=>({...p, zoom:val})); };
  const zoomMin=0.6, zoomMax=1.4, zoomStep=0.1;
  const [addTick, setAddTick] = useState(0);
  const [subTab, setSubTab] = useState("moves"); // tracks active sub-tab across pages
  const [addMenu, setAddMenu] = useState(false); // contextual + menu
  const [trainModal,  setTrainModal]  = useState({});
  const [trainMenu,   setTrainMenu]   = useState(null);
  const [showFeedback,setShowFeedback]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showManual,   setShowManual]   =useState(false);
  const [showTour,setShowTour]=useState(false);
  const [showBackup,setShowBackup]=useState(false);
  const [appSettings,setAppSettings]=useState(()=>({
    ...{
      theme:"light", defaultTab:"wip", showMastery:false,
      compactCards:false, sortMoves:"custom", fontSize:"medium",
      showMoveCount:false, confirmDelete:true, practiceReminders:false,
      reminderTime:"18:00", streakTracking:true, showDeadlineIndicator:true,
      categorySort:"manual", defaultView:"list", language:"en", linkOnCard:"inside", targetAutoLink:false, trainTabOrder:["goals","habits","notes"],
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

  const setMovesGrad = useCallback(updater => {
    setMoves(prev => typeof updater==="function" ? updater(prev) : updater);
  }, []);

  const handleAddMoveFromIdea = (text) => { setIdeaToMove(text); setTab("wip"); };

  // Secondary add trigger — used for "Add Category" and "Create Round" from bottom menu
  const [addTick2, setAddTick2] = useState(0);

  // Contextual + menu: null = no menu needed (Train handles its own), array = show menu
  const getAddMenuOptions = () => {
    if (tab === "ideas") return null;
    if (tab === "wip" && subTab === "moves") return [
      { label:tr("addMoveMenu"),     emoji:"🕺", action:()=>{ setAddMenu(false); setAddTick(t=>t+1); } },
      { label:tr("addCategoryMenu"), emoji:"📂", action:()=>{ setAddMenu(false); setAddTick2(t=>t+1); } },
    ];
    if (tab === "wip" && subTab === "sets") return null; // fires Add Set directly
    if (tab === "ready" && subTab === "freestyle") return null; // fires picker directly
    if (tab === "ready") return null; // fires Create Round directly
    return null;
  };

  const handlePlusPress = () => {
    const opts = getAddMenuOptions();
    if (!opts) {
      // Sets sub-tab: fire Add Set (addTick2), everything else fires addTick
      if (tab === "wip" && subTab === "sets") setAddTick2(t=>t+1);
      else setAddTick(t=>t+1);
    }
    else { setAddMenu(m=>!m); }
  };

  // Close addMenu on outside click
  useEffect(() => {
    if (!addMenu) return;
    const h = (e) => {
      const el = e.target;
      const inBtn = el.closest && el.closest('#tour-add-btn');
      const inMenu = el.closest && el.closest('#add-menu-popup');
      if (!inBtn && !inMenu) setAddMenu(false);
    };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [addMenu]);
  const handleTourDone = () => {
    setShowTour(false);
    if (fbUser?.uid) localStorage.setItem('mb_toured_' + fbUser.uid, '1');
  };

  const vocabMoves = moves;

  const effectiveZoom = fontScale * zoom;
  const rootHeight = effectiveZoom < 1 ? `${(100 / effectiveZoom).toFixed(2)}vh` : "100vh";

  return (
    <SettingsCtx.Provider value={{ settings:appSettings, C, cardPad, cardFontSize }}>
      <style>{`
        #movesbook-root { zoom: ${effectiveZoom.toFixed(3)}; }
        #movesbook-root * { box-sizing: border-box; }
      `}</style>
      <div id="movesbook-root" style={{ fontFamily:FONT_BODY, background:C.bg, color:C.text,
        height: rootHeight, width:"100%", display:"flex", flexDirection:"column",
        boxShadow:"0 0 60px rgba(0,0,0,0.35)", overflow:"hidden", transition:"background 0.3s, color 0.3s" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 16px", background:C.header, borderBottom:`2px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:0 }}>
            <span style={{ fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:24, letterSpacing:4 }}>
              <span style={{ color:"#cf0000" }}>MOVES</span><span style={{ color:C.headerText }}>BOOK</span>
            </span>
            {profile.nickname&&(
              <span style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, marginLeft:7, fontWeight:500, letterSpacing:0.3 }}>
                of {profile.nickname}
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <button onClick={()=>setShowBackup(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:5, display:"flex" }} title="Backup">
              <Ic n="download" s={17} c={C.brownLight}/>
            </button>
            {fbUser?.photo
              ? <button id="tour-profile" onClick={()=>setShowProfile(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", borderRadius:"50%", overflow:"hidden" }}>
                  <img src={fbUser.photo} alt={fbUser.name} style={{ width:26, height:26, borderRadius:"50%", objectFit:"cover", border:`1.5px solid ${C.border}` }}/>
                </button>
              : <button id="tour-profile" onClick={()=>setShowProfile(true)} style={{ background:"none", border:"none", cursor:"pointer", color:C.brownLight, padding:5 }}><Ic n="user" s={17} c={C.brownLight}/></button>
            }
            <button onClick={()=>setShowManual(true)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"3px 5px",
                borderRadius:6, color:C.brownLight, fontWeight:900, fontSize:16,
                fontFamily:FONT_DISPLAY, lineHeight:1 }}
              id="tour-manual-btn" title="User Manual">?</button>

          </div>
        </div>

        <TabBar active={tab} onChange={t=>{ setTrainMenu(null); setTab(t); setAddTick(0); setAddTick2(0); setAddMenu(false); setSubTab("moves"); }}/>

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
          <IdeaMenu menu={trainMenu} onClose={()=>setTrainMenu(null)}/>
          <TrainModalCtx.Provider value={{ openModal:(type,idea,onSave)=>{ setTrainMenu(null); setTrainModal({type,idea,onSave}); } }}>
          <TrainMenuCtx.Provider value={{ openMenu:(m)=>setTrainMenu(m), closeMenu:()=>setTrainMenu(null) }}>
            {tab==="ideas" && <IdeasPage onAddMove={handleAddMoveFromIdea} onAddTrigger={addTick} ideas={ideas} setIdeas={setIdeas} habits={habits} setHabits={setHabits}/>}
          </TrainMenuCtx.Provider>
          </TrainModalCtx.Provider>
          {tab==="wip"   && <WIPPage moves={vocabMoves} setMoves={setMovesGrad} cats={cats} setCats={setCats} catColors={catColors} setCatColors={setCatColors} sets={sets} setSets={setSets} addToast={addToast} pendingDesc={ideaToMove} clearPendingDesc={()=>setIdeaToMove(null)} settings={appSettings} onAddTrigger={addTick} onAddTrigger2={addTick2} onSubTabChange={setSubTab} onSortChange={(key,val)=>setAppSettings(p=>({...p,[key]:val}))}/>}
          {tab==="ready" && <ReadyPage moves={moves} sets={sets} setSets={setSets} rounds={rounds} setRounds={setRounds} settings={appSettings} onAddTrigger={addTick} onAddTrigger2={addTick2} onSubTabChange={setSubTab}/>}
        </div>

        <Toast toasts={toasts} remove={removeToast}/>
        {showProfile&&<ProfileModal onClose={()=>setShowProfile(false)} profile={profile} onSave={setProfile}/>}
        {showManual&&<ManualModal onClose={()=>setShowManual(false)}/>}
      {showFeedback&&<FeedbackModal onClose={()=>setShowFeedback(false)}/>}
      {showSettings&&<SettingsModal onClose={()=>setShowSettings(false)} settings={appSettings} onSave={setAppSettings} onClearMoves={()=>setMoves([])} onRestoreRounds={()=>setRounds(INIT_ROUNDS)} onRestartTour={()=>setShowTour(true)} zoom={zoom} onZoomChange={handleZoomChange}/>}
        {showBackup&&<BackupModal onClose={()=>setShowBackup(false)}/>}
        {showTour&&<Walkthrough onDone={handleTourDone}/>}

        {/* ── Bottom Bar ── */}
        {!showTour&&(
          <div style={{ display:"flex", alignItems:"stretch", borderTop:`2px solid ${C.border}`,
            background:C.bg, flexShrink:0, height:58, zIndex:100 }}>

            {/* Feedback */}
            <button onClick={()=>setShowFeedback(true)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer",
                color: showFeedback ? C.accent : C.textMuted, transition:"color 0.15s" }}>
              <span style={{ fontSize:20, lineHeight:1 }}>{"💬"}</span>
              <span style={{ fontSize:9, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:1.2 }}>{tr("feedbackLabel")}</span>
            </button>

            {/* ADD — centre, contextual menu */}
            <div style={{ flex:"0 0 64px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
              {addMenu&&(
                <div id="add-menu-popup" style={{ position:"absolute", bottom:62, left:"50%", transform:"translateX(-50%)",
                  background:C.bg, border:`2px solid ${C.border}`, borderRadius:12,
                  overflow:"hidden", zIndex:9999, minWidth:180,
                  boxShadow:"0 -8px 32px rgba(0,0,0,0.25)" }}>
                  {(getAddMenuOptions()||[]).map((opt,i)=>(
                    <button key={i} onClick={opt.action}
                      style={{ width:"100%", padding:"13px 16px", background:"none",
                        border:"none", borderTop: i>0?`1px solid ${C.borderLight}`:"none",
                        cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                        color:C.text, fontSize:13, fontFamily:FONT_DISPLAY, fontWeight:700,
                        letterSpacing:0.5, textAlign:"left" }}>
                      <span style={{ fontSize:16 }}>{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button id="tour-add-btn" onClick={handlePlusPress}
                style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", background:"none", border:"none", cursor:"pointer" }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:C.accent,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:`0 4px 16px rgba(139,26,26,0.4)`,
                  transform:"translateY(-10px)", transition:"transform 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-13px) scale(1.07)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(-10px) scale(1)"}>
                  <Ic n="plus" s={22} c={C.bg}/>
                </div>
              </button>
            </div>

            {/* Settings */}
            <button onClick={()=>setShowSettings(true)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer",
                color: showSettings ? C.accent : C.textMuted, transition:"color 0.15s" }}>
              <Ic n="cog" s={20} c={showSettings ? C.accent : C.textMuted}/>
              <span style={{ fontSize:9, fontFamily:FONT_DISPLAY, fontWeight:800, letterSpacing:1.2 }}>{tr("settingsLabel")}</span>
            </button>

          </div>
        )}
      </div>
    </SettingsCtx.Provider>
  );
}
