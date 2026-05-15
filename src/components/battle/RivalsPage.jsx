import { useState, useEffect, useRef } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl, inp } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { Modal } from '../shared/Modal';
import { Txtarea } from '../shared/Txtarea';
import { BottomSheet } from '../shared/BottomSheet';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';
import { compressImage } from '../../utils/imageUtils';
import { todayLocal } from '../../utils/dateUtils';
import { BattleFormModal } from './BattleFormModal';

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

// Derive a single won/lost/draw label from per-round outcomes. Used in the
// battle-history row to keep the visual close to the old single-result render.
const deriveBattleResult = (rounds = []) => {
  const wins = rounds.filter(r => r.outcome === "won").length;
  const losses = rounds.filter(r => r.outcome === "lost").length;
  if (wins === 0 && losses === 0) return null;
  if (losses === 0) return "won";
  if (wins === 0) return "lost";
  return "draw";
};

const DOMAINS = ["Musicality","Performance","Technique","Variety","Creativity","Personality"];
const DOMAIN_KEYS = { Musicality:"musicality", Performance:"performance", Technique:"technique", Variety:"variety", Creativity:"creativity", Personality:"personality" };

const CONF_OPTIONS = [
  { val:1, emoji:"\ud83d\ude24", key:"theyWin" },
  { val:2, emoji:"\ud83e\udd1d", key:"couldGoEitherWay" },
  { val:3, emoji:"\ud83d\udd25", key:"idFeelGood" },
];

const RESULT_OPTIONS = [
  { val:"won", emoji:"\ud83c\udfc6", key:"won" },
  { val:"draw", emoji:"\ud83e\udd1d", key:"draw" },
  { val:"lost", emoji:"\ud83d\udcaa", key:"lost" },
];

const PEOPLE_TABS = [
  { id:"rivals", key:"rivals" },
  { id:"sparringMate", key:"sparringMate" },
  { id:"crew", key:"crew" },
];

const TYPE_OPTIONS = [
  { val:"rival", key:"typeRival" },
  { val:"sparringMate", key:"typeSparringMate" },
  { val:"crew", key:"typeCrew" },
];

const STANCE_OPTIONS = [
  { val:"left", key:"stanceLeft" },
  { val:"right", key:"stanceRight" },
  { val:"unknown", key:"stanceUnknown" },
];

const cleanIG = (val) => {
  let h = (val || "").trim();
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  h = h.replace(/\?.*$/, "");
  h = h.replace(/^@/, "");
  h = h.replace(/\/$/, "");
  return h;
};

const normalizeRival = (r) => r ? ({
  type:"rival", crew:"", city:"", instagram:"", stance:"unknown",
  sparHistory:[], sparringJournal:"",
  signatureMoves:"", gamePlan:"", targetWhen:"", targetWhere:"",
  videoRefs:[], strongDomains:[], ...r,
}) : null;

export const RivalsPage = ({ rivals=[], onRivalsChange, battles=[], setBattles, battleFormats=[], setBattleFormats, moves=[], addToast, onAddTrigger, addCalendarEvent, onOpenSparring, rivalsSeed, onRivalsSeedUsed }) => {
  const t = useT();
  const { C } = useSettings();
  const [peopleTab, setPeopleTab] = useState("rivals");
  const [showModal, setShowModal] = useState(false);
  const [editingRival, setEditingRival] = useState(null);
  const [battleScrollId, setBattleScrollId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showConfPrompt, setShowConfPrompt] = useState(false);
  const [pendingConf, setPendingConf] = useState(null);
  const [blurred, setBlurred] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showImportPicker, setShowImportPicker] = useState(false);
  const [importTarget, setImportTarget] = useState(null);
  const importRef = useRef(null);
  // Hoisted to RivalsPage scope so the inline RivalModal's remount-per-render
  // doesn't lose this state (same reason the battle-scroll effect lives here).
  const [battleFormRival, setBattleFormRival] = useState(null);
  const [battleFormInitial, setBattleFormInitial] = useState(null);

  // Normalize all rivals
  const allPeople = rivals.map(normalizeRival);
  const rivalsList = allPeople.filter(r => (r.type || "rival") === "rival");
  const sparringMates = allPeople.filter(r => r.type === "sparringMate");
  const crewList = allPeople.filter(r => r.type === "crew");
  const activeList = peopleTab === "rivals" ? rivalsList : peopleTab === "sparringMate" ? sparringMates : crewList;

  useEffect(() => {
    if (!onAddTrigger) return;
    setShowAddMenu(true);
  }, [onAddTrigger]);

  // TEXTSTREAM-SEARCH-2A — jump-to-source: open the rival modal for the
  // seeded rival. The rival's `type` (rival / sparringMate / crew) determines
  // which people sub-tab to switch to so the user sees the modal in context.
  // battleId is forwarded to the modal but no scroll happens in Cap 2a.
  useEffect(() => {
    if (!rivalsSeed?.rivalId) return;
    const rival = rivals?.find(r => String(r.id) === String(rivalsSeed.rivalId));
    if (rival) {
      const t = rival.type || "rival";
      setPeopleTab(t === "sparringMate" ? "sparringMate" : t === "crew" ? "crew" : "rivals");
      setEditingRival(normalizeRival(rival));
      setShowModal(true);
      setBattleScrollId(rivalsSeed.battleId || null);
    }
    if (onRivalsSeedUsed) onRivalsSeedUsed();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed-only by intent
  }, [rivalsSeed]);

  // TEXTSTREAM-SEARCH-2B — battle scroll. Lives in parent scope (not inside
  // the inline RivalModal) because the inline-component definition is
  // recreated on every render of RivalsPage, causing the modal to unmount/
  // remount and any timer inside its useEffect to be cleared before firing.
  // 250ms is conservative — waits for modal mount + battle history render.
  useEffect(() => {
    if (!battleScrollId) return;
    const id = battleScrollId;
    const timer = setTimeout(() => {
      const el = document.getElementById(`battle-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    return () => clearTimeout(timer);
  }, [battleScrollId]);

  const addRival = (data) => {
    const now = new Date().toISOString();
    onRivalsChange(prev => [...prev, { ...data, id: Date.now(), sparHistory:[], createdDate: now, updatedDate: now }]);
  };
  const updateRival = (id, data) => {
    onRivalsChange(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedDate: new Date().toISOString() } : r));
  };
  const deleteRival = (id) => {
    onRivalsChange(prev => prev.filter(r => r.id !== id));
    setConfirmDelete(null);
    if (addToast) addToast({ icon:"trash", title: t("deleteRival") });
  };

  const openBattleForm = (rival) => {
    setBattleFormRival(rival);
    setBattleFormInitial({
      id: newId(),
      date: todayLocal(),
      eventName: "",
      format: null,
      battleNotes: "",
      judges: null,
      rounds: [{
        id: newId(),
        roundName: "",
        opponent: { name: rival.name, rivalId: rival.id },
        outcome: null,
        entries: [{ id: newId(), text: "" }],
        moves: [],
        videos: [],
        judgeVotes: null,
        notes: "",
      }],
    });
  };

  const handleSaveBattle = (battle) => {
    const rival = battleFormRival;
    if (!rival) return;
    if (setBattles) setBattles(prev => [...prev, battle]);
    if (addCalendarEvent) {
      addCalendarEvent({
        date: battle.date,
        type: "battle",
        title: `Battle vs ${rival.name}`,
        notes: battle.eventName ? battle.eventName : "",
        source: "rivals",
        rivalId: rival.id,
      }, { silent: true });
    }
    if (addToast) addToast({ icon: "swords", title: t("battleLogged") });
    setPendingConf(rival.confidence || null);
    setShowConfPrompt(true);
  };

  // Import spar session
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data._format !== "movesbook-spar-v1" || !data.session) {
          if (addToast) addToast({ icon:"x", title: t("invalidSparFile") });
          return;
        }
        const tagged = { ...data.session, perspective:"opponent", importedAt: new Date().toISOString(), importedFrom:"file" };
        const targetId = importTarget;
        if (!targetId) return;
        const person = allPeople.find(p => p.id === targetId);
        if (!person) return;
        updateRival(targetId, { sparHistory: [...(person.sparHistory || []), tagged] });
        if (addToast) addToast({ icon:"check", title: t("sparImported") });
      } catch {
        if (addToast) addToast({ icon:"x", title: t("invalidSparFile") });
      }
      setImportTarget(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const triggerImportFor = (personId) => {
    setImportTarget(personId);
    setTimeout(() => importRef.current?.click(), 50);
  };

  // ── Helper: type-aware labels ──
  const getEditTitle = (type) => type === "sparringMate" ? t("editSparringMate") : type === "crew" ? t("editCrew") : t("editRival");
  const getAddTitle = (type) => type === "sparringMate" ? t("addSparringMate") : type === "crew" ? t("addCrew") : t("addRival");
  const getDeleteTitle = (type) => type === "sparringMate" ? t("deleteSparringMate") : type === "crew" ? t("deleteCrew") : t("deleteRival");
  const getDeleteConfirmMsg = (type) => type === "sparringMate" ? t("deleteSparringMateConfirm") : type === "crew" ? t("deleteCrewConfirm") : t("deleteRivalConfirm");

  // ── Rival Card ──
  const RivalCard = ({ rival }) => {
    const initials = rival.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    const conf = CONF_OPTIONS.find(c => c.val === rival.confidence);
    const rivalBattlesForCard = (battles || []).filter(b => (b.rounds || []).some(r => r.opponent?.rivalId === rival.id));
    const lastBattle = rivalBattlesForCard.length > 0
      ? [...rivalBattlesForCard].sort((a,b) => (b.date || "").localeCompare(a.date || ""))[0]
      : null;
    const lastResultKey = lastBattle ? deriveBattleResult(lastBattle.rounds) : null;
    const lastResult = lastResultKey ? RESULT_OPTIONS.find(r => r.val === lastResultKey) : null;
    const stanceBadge = rival.stance === "left" ? "(L)" : rival.stance === "right" ? "(R)" : null;
    const metaParts = [
      rival.targetWhen ? `\ud83d\udcc5 ${rival.targetWhen}` : null,
      rival.targetWhere ? `\ud83d\udccd ${rival.targetWhere}` : null,
      rival.city ? `\ud83c\udfe0 ${rival.city}` : null,
    ].filter(Boolean).join(" \u00b7 ");
    const sparCount = (rival.sparHistory || []).length;

    return (
      <div onClick={() => { setEditingRival(normalizeRival(rival)); setShowModal(true); }}
        style={{ background:C.surface, borderRadius:8, padding:"14px 16px",
          cursor:"pointer", marginBottom:6, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", flexShrink:0, overflow:"hidden",
          background: rival.photo ? "none" : C.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center",
          border:`2px solid ${C.border}` }}>
          {rival.photo
            ? <img src={rival.photo} alt="" style={{ width:48, height:48, objectFit:"cover" }}/>
            : <span style={{ fontSize:16, fontWeight:800, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{initials}</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontWeight:800, fontSize:16, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>{rival.name}</span>
            {stanceBadge && <span style={{ fontSize:10, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{stanceBadge}</span>}
            {conf && <span style={{ fontSize:14 }}>{conf.emoji}</span>}
          </div>
          {rival.crew && (
            <div style={{ fontSize:13, color:C.textMuted, fontFamily:FONT_BODY, marginTop:2 }}>{rival.crew}</div>
          )}
          {rival.strongDomains?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
              {rival.strongDomains.map(d => (
                <span key={d} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                  background:`${C.accent}15`, color:C.accent, border:`1px solid ${C.accent}33`,
                  fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>{t(DOMAIN_KEYS[d]||d)}</span>
              ))}
            </div>
          )}
          {rival.instagram && (
            <button onClick={e => { e.stopPropagation(); window.open(`https://instagram.com/${rival.instagram}`, "_blank"); }}
              style={{ fontSize:10, padding:"2px 8px", borderRadius:20, marginTop:4,
                background:`${C.blue}15`, color:C.blue, border:`1px solid ${C.blue}33`,
                fontWeight:700, fontFamily:FONT_DISPLAY, cursor:"pointer" }}>
              @{rival.instagram}
            </button>
          )}
          {metaParts && (
            <div style={{ fontSize:11, color:C.textMuted, marginTop:4, fontFamily:FONT_BODY }}>{metaParts}</div>
          )}
          {lastBattle && lastResult && (
            <div style={{ fontSize:11, color:C.textMuted, marginTop:2, fontFamily:FONT_BODY }}>
              {t("lastBattle")}: {lastBattle.date} \u00b7 {lastResult.emoji}
            </div>
          )}
          {sparCount > 0 && (
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2, fontFamily:FONT_BODY }}>
              {sparCount} {t("nSpars")}
            </div>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); setConfirmDelete(rival); }}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
          <Ic n="trash" s={14} c={C.textMuted}/>
        </button>
      </div>
    );
  };

  // ── Rival Modal ──
  const RivalModal = ({ rival, onClose, onSave, battleScrollId }) => {
    const isEdit = !!rival?.id;
    const [f, setF] = useState({
      name: rival?.name ?? "",
      photo: rival?.photo ?? null,
      type: rival?.type ?? "rival",
      crew: rival?.crew ?? "",
      city: rival?.city ?? "",
      instagram: rival?.instagram ?? "",
      stance: rival?.stance ?? "unknown",
      strongDomains: rival?.strongDomains ?? [],
      signatureMoves: rival?.signatureMoves ?? "",
      gamePlan: rival?.gamePlan ?? "",
      confidence: rival?.confidence ?? null,
      videoRefs: rival?.videoRefs ?? [],
      targetWhen: rival?.targetWhen ?? "",
      targetWhere: rival?.targetWhere ?? "",
      sparringJournal: rival?.sparringJournal ?? "",
    });
    const photoRef = useRef(null);

    // Battle/spar history expand state. expandedBattle initializes from
    // battleScrollId so a seed-driven mount/remount preserves the auto-
    // expansion of the target battle. The scroll itself is handled in the
    // parent RivalsPage scope to survive inline-component remounts.
    const [expandedBattle, setExpandedBattle] = useState(battleScrollId || null);
    const [expandedSpar, setExpandedSpar] = useState(null);

    const toggleDomain = (d) => {
      setF(prev => ({
        ...prev,
        strongDomains: prev.strongDomains.includes(d)
          ? prev.strongDomains.filter(x => x !== d)
          : [...prev.strongDomains, d],
      }));
    };

    const handlePhoto = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await compressImage(file, 200, { crop: true, quality: 0.8 });
      setF(prev => ({ ...prev, photo: dataUrl }));
      e.target.value = "";
    };

    const addVideoRef = () => setF(prev => ({ ...prev, videoRefs: [...prev.videoRefs, { url:"", label:"" }] }));
    const updateVideoRef = (idx, field, val) => setF(prev => ({
      ...prev, videoRefs: prev.videoRefs.map((v, i) => i === idx ? { ...v, [field]: val } : v),
    }));
    const removeVideoRef = (idx) => setF(prev => ({ ...prev, videoRefs: prev.videoRefs.filter((_, i) => i !== idx) }));

    const canSave = f.name.trim().length > 0;

    const handleSave = () => {
      if (!canSave) return;
      const clean = {
        ...f,
        name: f.name.trim(),
        instagram: cleanIG(f.instagram),
        crew: f.crew.trim(),
        city: f.city.trim(),
        sparringJournal: f.sparringJournal.trim(),
        targetWhen: f.targetWhen.trim() || null,
        targetWhere: f.targetWhere.trim() || null,
        videoRefs: f.videoRefs.filter(v => v.url.trim()),
      };
      onSave(clean);
    };

    const rivalBattles = (battles || [])
      .filter(b => (b.rounds || []).some(r => r.opponent?.rivalId === rival?.id))
      .sort((a,b) => (b.date || "").localeCompare(a.date || ""));
    const sparSessions = [...(rival?.sparHistory||[])].sort((a,b) => (b.date||"").localeCompare(a.date||""));

    // ── Main rival edit/add modal ──
    return (
      <Modal title={isEdit ? getEditTitle(f.type) : getAddTitle(f.type)} onClose={onClose}>
        {/* Photo */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <div onClick={() => photoRef.current?.click()}
            style={{ width:64, height:64, borderRadius:"50%", overflow:"hidden", cursor:"pointer",
              background: f.photo ? "none" : C.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center",
              border:`2px dashed ${C.border}`, flexShrink:0 }}>
            {f.photo
              ? <img src={f.photo} alt="" style={{ width:64, height:64, objectFit:"cover" }}/>
              : <Ic n="user" s={24} c={C.textMuted}/>}
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:4 }}>{t("rivalPhoto")}</div>
            {f.photo ? (
              <button onClick={() => setF(prev => ({ ...prev, photo: null }))}
                style={{ fontSize:11, color:C.accent, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:FONT_BODY }}>
                {t("removePhoto")}
              </button>
            ) : (
              <button onClick={() => photoRef.current?.click()}
                style={{ fontSize:11, color:C.textSec, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:FONT_BODY }}>
                Tap to add
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>NAME</label>
          <input value={f.name} onChange={e => setF(prev => ({ ...prev, name: e.target.value }))} placeholder="Name..." autoFocus style={inp()}/>
        </div>

        {/* Type selector */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("typeLabel")}</label>
          <div style={{ display:"flex", gap:6 }}>
            {TYPE_OPTIONS.map(opt => {
              const active = f.type === opt.val;
              return (
                <button key={opt.val} onClick={() => setF(prev => ({ ...prev, type: opt.val }))}
                  style={{ flex:1, borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                    letterSpacing:0.3, cursor:"pointer", transition:"all 0.15s", textAlign:"center",
                    background: active ? `${C.accent}18` : C.surface,
                    color: active ? C.accent : C.textSec,
                    border: `1.5px solid ${active ? C.accent : C.border}` }}>
                  {t(opt.key)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Crew */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("crewLabel")}</label>
          <input value={f.crew} onChange={e => setF(prev => ({ ...prev, crew: e.target.value }))} placeholder={t("crewPlaceholder")} style={inp()}/>
        </div>

        {/* City */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("cityLabel")}</label>
          <input value={f.city} onChange={e => setF(prev => ({ ...prev, city: e.target.value }))} placeholder={t("cityPlaceholder")} style={inp()}/>
        </div>

        {/* Instagram */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("instagramLabel")}</label>
          <input value={f.instagram} onChange={e => setF(prev => ({ ...prev, instagram: e.target.value }))} placeholder={t("instagramPlaceholder")} style={inp()}/>
        </div>

        {/* Stance */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("stanceLabel")}</label>
          <div style={{ display:"flex", gap:6 }}>
            {STANCE_OPTIONS.map(opt => {
              const active = f.stance === opt.val;
              return (
                <button key={opt.val} onClick={() => setF(prev => ({ ...prev, stance: opt.val }))}
                  style={{ flex:1, borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                    letterSpacing:0.3, cursor:"pointer", transition:"all 0.15s", textAlign:"center",
                    background: active ? `${C.accent}18` : C.surface,
                    color: active ? C.accent : C.textSec,
                    border: `1.5px solid ${active ? C.accent : C.border}` }}>
                  {t(opt.key)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Their Strengths */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("theirStrengths")}</label>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:8, fontFamily:FONT_BODY }}>{t("theirStrengthsSub")}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {DOMAINS.map(d => {
              const active = f.strongDomains.includes(d);
              return (
                <button key={d} onClick={() => toggleDomain(d)}
                  style={{ borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                    letterSpacing:0.3, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
                    background: active ? C.accent : C.surface,
                    color: active ? C.bg : C.textSec,
                    border: `1.5px solid ${active ? C.accent : C.border}` }}>
                  {t(DOMAIN_KEYS[d])}
                </button>
              );
            })}
          </div>
        </div>

        {/* Signature Moves */}
        <Txtarea
          label={t("signatureMovesLabel")}
          value={f.signatureMoves}
          onChange={v => setF(prev => ({ ...prev, signatureMoves: v }))}
          placeholder={t("signatureMovesPlaceholder")}
          rows={3}
          autoExpand
        />

        {/* Game Plan */}
        <Txtarea
          label={t("gamePlanLabel")}
          value={f.gamePlan}
          onChange={v => setF(prev => ({ ...prev, gamePlan: v }))}
          placeholder={t("gamePlanPlaceholder")}
          rows={3}
          autoExpand
        />

        {/* Confidence */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("confidenceLabel")}</label>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:8, fontFamily:FONT_BODY }}>{t("confidenceSub")}</div>
          <div style={{ display:"flex", gap:6 }}>
            {CONF_OPTIONS.map(opt => {
              const active = f.confidence === opt.val;
              return (
                <button key={opt.val} onClick={() => setF(prev => ({ ...prev, confidence: active ? null : opt.val }))}
                  style={{ flex:1, borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                    letterSpacing:0.3, cursor:"pointer", transition:"all 0.15s", textAlign:"center",
                    background: active ? `${C.accent}18` : C.surface,
                    color: active ? C.accent : C.textSec,
                    border: `1.5px solid ${active ? C.accent : C.border}` }}>
                  <div style={{ fontSize:20, marginBottom:2 }}>{opt.emoji}</div>
                  {t(opt.key)}
                </button>
              );
            })}
          </div>
        </div>

        {/* When */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("rivalWhen")}</label>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:6, fontFamily:FONT_BODY }}>{t("rivalWhenHint")}</div>
          <input value={f.targetWhen} onChange={e => setF(prev => ({ ...prev, targetWhen: e.target.value }))} placeholder={t("rivalWhenPlaceholder")} style={inp()}/>
        </div>

        {/* Where */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("rivalWhere")}</label>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:6, fontFamily:FONT_BODY }}>{t("rivalWhereHint")}</div>
          <input value={f.targetWhere} onChange={e => setF(prev => ({ ...prev, targetWhere: e.target.value }))} placeholder={t("rivalWherePlaceholder")} style={inp()}/>
        </div>

        {/* Sparring Journal */}
        <Txtarea
          label={t("sparringJournalLabel")}
          value={f.sparringJournal}
          onChange={v => setF(prev => ({ ...prev, sparringJournal: v }))}
          placeholder={t("sparringJournalPlaceholder")}
          rows={3}
          autoExpand
        />

        {/* Video References */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("videoReference")}</div>
          {f.videoRefs.map((vr, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"flex-start" }}>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                <input value={vr.url} onChange={e => updateVideoRef(i, "url", e.target.value)} placeholder={t("pasteLink")} style={{ ...inp(), marginBottom:0 }}/>
                <input value={vr.label} onChange={e => updateVideoRef(i, "label", e.target.value)} placeholder={t("labelOptional")} style={{ ...inp(), marginBottom:0, fontSize:14 }}/>
              </div>
              <button onClick={() => removeVideoRef(i)} style={{ background:"none", border:"none", cursor:"pointer", padding:6, marginTop:6 }}>
                <Ic n="x" s={14} c={C.textMuted}/>
              </button>
            </div>
          ))}
          <button onClick={addVideoRef}
            style={{ fontSize:11, fontWeight:700, color:C.accent, background:"none", border:"none", cursor:"pointer",
              padding:"4px 0", fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>
            {t("addVideoRef")}
          </button>
        </div>

        {/* Battle History \u2014 sourced from mb_battles, filtered by rivalId */}
        {isEdit && rivalBattles.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("battleHistory")}</div>
            {rivalBattles.map(b => {
              const resultKey = deriveBattleResult(b.rounds);
              const res = resultKey ? RESULT_OPTIONS.find(r => r.val === resultKey) : null;
              const isExpanded = expandedBattle === b.id;
              const hasDetail = !!(b.battleNotes && b.battleNotes.trim());
              return (
                <div key={b.id} id={`battle-${b.id}`} onClick={() => hasDetail && setExpandedBattle(isExpanded ? null : b.id)}
                  style={{ background:C.surfaceAlt, borderRadius:8, padding:"10px 12px", marginBottom:6,
                    cursor: hasDetail ? "pointer" : "default" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>{b.date}</span>
                    {res && <span style={{ fontSize:11 }}>{t(res.key)}</span>}
                    {b.eventName && <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>\u2014 {b.eventName}</span>}
                    {hasDetail && <span style={{ marginLeft:"auto", fontSize:10, color:C.textMuted }}>{isExpanded ? "\u25b2" : "\u25bc"}</span>}
                  </div>
                  {isExpanded && hasDetail && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:13, color:C.textSec, lineHeight:1.5, fontFamily:FONT_BODY }}>{b.battleNotes}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Spar History */}
        {isEdit && sparSessions.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("sparHistoryLabel")}</div>
            {sparSessions.map((s, i) => {
              const isExp = expandedSpar === i;
              const dur = s.totalDuration ? Math.round(s.totalDuration / 1000) : null;
              return (
                <div key={i} onClick={() => setExpandedSpar(isExp ? null : i)}
                  style={{ background:C.surfaceAlt, borderRadius:8, padding:"10px 12px", marginBottom:6,
                    cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>{s.date?.split("T")[0] || "?"}</span>
                    <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>{s.rounds || "?"} rounds</span>
                    {dur && <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>{Math.floor(dur/60)}m{dur%60}s</span>}
                    <span style={{ fontSize:10, color:C.accent, fontWeight:700, fontFamily:FONT_DISPLAY, marginLeft:"auto" }}>IMPORTED</span>
                  </div>
                  {isExp && s.roundLog && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                      {s.roundLog.map((rl, ri) => (
                        <div key={ri} style={{ fontSize:11, color:C.textSec, fontFamily:FONT_BODY }}>
                          R{rl.round}: {rl.workSecs || Math.round((rl.workMs||0)/1000)}s
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Import Spar button (in modal) */}
        {isEdit && (
          <button onClick={() => triggerImportFor(rival.id)}
            style={{ fontSize:11, fontWeight:700, color:C.accent, background:"none", border:"none", cursor:"pointer",
              padding:"4px 0", fontFamily:FONT_DISPLAY, letterSpacing:0.5, marginBottom:14, display:"block" }}>
            {t("importSpar")}
          </button>
        )}

        {/* Log a Battle button */}
        {isEdit && (
          <button onClick={() => openBattleForm(rival)}
            style={{ width:"100%", padding:"12px 0", borderRadius:8, border:"none",
              background:C.accent, color:C.bg,
              fontSize:14, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1, cursor:"pointer", marginBottom:14 }}>
            {t("logABattle")}
          </button>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {isEdit && (
            <button onClick={() => { onClose(); setTimeout(() => setConfirmDelete(rival), 100); }}
              style={{ fontSize:11, color:C.red || C.accent, background:"none", border:"none", cursor:"pointer",
                fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, padding:"10px 0" }}>
              {getDeleteTitle(f.type)}
            </button>
          )}
          <div style={{ flex:1 }}/>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!canSave}>{t("save")}</Btn>
        </div>
      </Modal>
    );
  };

  // ── Empty state ──
  const EmptyState = () => {
    const cfg = {
      rivals: { icon:"sword", intro:"rivalsIntro", none:"noRivalsYet", tap:"tapToAddRival" },
      sparringMate: { icon:"users", intro:"sparringMateIntro", none:"noSparringMatesYet", tap:"tapToAddSparringMate" },
      crew: { icon:"users", intro:"crewIntro", none:"noCrewYet", tap:"tapToAddCrew" },
    }[peopleTab];
    return (
      <div style={{ textAlign:"center", padding:"48px 20px" }}>
        <Ic n={cfg.icon} s={32} c={C.textMuted}/>
        <p style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, margin:"12px 0 4px", lineHeight:1.5, maxWidth:320, marginLeft:"auto", marginRight:"auto" }}>
          {t(cfg.intro)}
        </p>
        <p style={{ fontFamily:FONT_BODY, fontSize:13, color:C.textMuted, margin:0 }}>
          {t(cfg.tap)}
        </p>
      </div>
    );
  };

  // ── Main render ──
  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      {/* Inner sub-tab bar */}
      <div style={{ display:"flex", gap:0, flexShrink:0 }}>
        {PEOPLE_TABS.map(tab => {
          const active = peopleTab === tab.id;
          const count = tab.id === "rivals" ? rivalsList.length : tab.id === "sparringMate" ? sparringMates.length : crewList.length;
          return (
            <button key={tab.id} onClick={() => setPeopleTab(tab.id)}
              style={{ padding:"4px 10px", background:"none", border:"none", cursor:"pointer",
                fontSize:14, fontWeight:800, letterSpacing:1.5, fontFamily:FONT_DISPLAY, textTransform:"uppercase",
                color: active ? C.text : C.textMuted }}>
              <span style={{ borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom:3 }}>{t(tab.key)}{count > 0 ? ` (${count})` : ""}</span>
            </button>
          );
        })}
      </div>

      {/* Section header: count + eye toggle + import */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 16px 3px", flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:800, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, textTransform:"uppercase" }}>
          {activeList.length} {t(PEOPLE_TABS.find(t2 => t2.id === peopleTab)?.key || "rivals")}
        </span>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={() => { setShowImportPicker(true); }}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
            title={t("importSpar")}>
            <Ic n="upload" s={16} c={C.textSec}/>
          </button>
          <button onClick={() => setBlurred(b => !b)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
            title={blurred ? t("showProfiles") : t("hideProfiles")}>
            <Ic n={blurred ? "eyeOff" : "eye"} s={16} c={C.textSec}/>
          </button>
        </div>
      </div>

      {/* Start Sparring — ghost button, rivals tab only */}
      {peopleTab === "rivals" && onOpenSparring && (
        <div style={{ padding:"8px 16px 0", flexShrink:0 }}>
          <button onClick={onOpenSparring}
            style={{
              width:"100%", padding:14, borderRadius:8,
              border:`1px solid ${C.accent}`, background:"transparent",
              color:C.accent, cursor:"pointer",
              fontFamily:FONT_DISPLAY, fontWeight:900, fontSize:13,
              letterSpacing:1, textTransform:"uppercase",
              display:"flex", alignItems:"center", justifyContent:"center",
              gap:8, minHeight:44,
            }}>
            {t("startSparring")}
          </button>
        </div>
      )}

      {/* Card list */}
      <div style={{ flex:1, overflow:"auto" }}>
        {activeList.length === 0 ? (
          <EmptyState/>
        ) : (
          <div style={{ padding:"0 16px 12px", filter: blurred ? "blur(8px)" : "none", transition:"filter 0.2s",
            pointerEvents: blurred ? "none" : "auto" }}>
            {activeList.map(r => <RivalCard key={r.id} rival={r}/>)}
          </div>
        )}
      </div>

      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleImportFile}/>

      {/* Add menu BottomSheet */}
      <BottomSheet open={showAddMenu} onClose={() => setShowAddMenu(false)} title={t("addPerson")}>
        <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"8px 0" }}>
          {[
            { type:"rival", icon:"sword", key:"addRival" },
            { type:"sparringMate", icon:"users", key:"addSparringMate" },
            { type:"crew", icon:"users", key:"addCrew" },
          ].map(opt => (
            <button key={opt.type} onClick={() => {
              setShowAddMenu(false);
              setEditingRival({ type: opt.type });
              setShowModal(true);
            }}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:8,
                background:C.surfaceAlt, cursor:"pointer", textAlign:"left" }}>
              <Ic n={opt.icon} s={20} c={C.textSec}/>
              <span style={{ fontSize:13, fontWeight:800, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.5, textTransform:"uppercase" }}>
                {t(opt.key)}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Import person picker BottomSheet */}
      <BottomSheet open={showImportPicker} onClose={() => setShowImportPicker(false)} title={t("selectPerson")}>
        <div style={{ display:"flex", flexDirection:"column", gap:4, padding:"8px 0", maxHeight:300, overflow:"auto" }}>
          {allPeople.length === 0 ? (
            <div style={{ textAlign:"center", padding:20, color:C.textMuted, fontSize:13, fontFamily:FONT_BODY }}>
              {t("noRivalsYet")}
            </div>
          ) : allPeople.map(p => (
            <button key={p.id} onClick={() => { setShowImportPicker(false); triggerImportFor(p.id); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8,
                background:C.surfaceAlt, cursor:"pointer", textAlign:"left" }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>{p.name}</span>
              <span style={{ fontSize:10, color:C.textMuted, fontFamily:FONT_DISPLAY, textTransform:"uppercase" }}>
                {t(TYPE_OPTIONS.find(to => to.val === (p.type || "rival"))?.key || "typeRival")}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Edit/Add modal */}
      {showModal && (
        <RivalModal
          rival={editingRival}
          battleScrollId={battleScrollId}
          onClose={() => { setShowModal(false); setEditingRival(null); setBattleScrollId(null); }}
          onSave={(data) => {
            if (editingRival?.id) updateRival(editingRival.id, data);
            else addRival(data);
            setShowModal(false);
            setEditingRival(null);
            setBattleScrollId(null);
            // Switch to the tab matching the saved type
            if (data.type && data.type !== peopleTab) setPeopleTab(data.type === "rival" ? "rivals" : data.type);
          }}/>
      )}

      {/* Battle form modal */}
      <BattleFormModal
        open={!!battleFormRival}
        onClose={() => { setBattleFormRival(null); setBattleFormInitial(null); }}
        onSave={handleSaveBattle}
        initialValue={battleFormInitial}
        moves={moves}
        battleFormats={battleFormats}
        setBattleFormats={setBattleFormats}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900,
            display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.bg, borderRadius:16, maxWidth:320, padding:20, width:"100%",
              boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.text, marginBottom:8 }}>
              {getDeleteTitle(normalizeRival(confirmDelete).type)}
            </div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6, fontFamily:FONT_BODY }}>
              {getDeleteConfirmMsg(normalizeRival(confirmDelete).type)}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={() => deleteRival(confirmDelete.id)}>{t("delete")}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Confidence prompt after battle log */}
      {showConfPrompt && editingRival && (
        <div onClick={() => setShowConfPrompt(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000,
            display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 12px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.bg, borderRadius:16, width:"100%", maxWidth:420,
              padding:20, boxShadow:"0 24px 80px rgba(0,0,0,0.4)" }}>
            <p style={{ fontSize:13, color:C.textSec, lineHeight:1.6, fontFamily:FONT_BODY, marginBottom:16, textAlign:"center" }}>
              {t("stillFeelTheSame")}
            </p>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {CONF_OPTIONS.map(opt => {
                const active = pendingConf === opt.val;
                return (
                  <button key={opt.val} onClick={() => {
                    updateRival(editingRival.id, { confidence: opt.val });
                    setShowConfPrompt(false);
                  }}
                    style={{ flex:1, borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
                      letterSpacing:0.3, cursor:"pointer", transition:"all 0.15s", textAlign:"center",
                      background: active ? `${C.accent}18` : C.surface,
                      color: active ? C.accent : C.textSec,
                      border: `1.5px solid ${active ? C.accent : C.border}` }}>
                    <div style={{ fontSize:20, marginBottom:2 }}>{opt.emoji}</div>
                    {t(opt.key)}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowConfPrompt(false)}
              style={{ width:"100%", padding:"10px 0", background:"none", border:`1.5px solid ${C.border}`, borderRadius:8,
                color:C.textSec, fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY, cursor:"pointer", letterSpacing:1 }}>
              {t("skip")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
