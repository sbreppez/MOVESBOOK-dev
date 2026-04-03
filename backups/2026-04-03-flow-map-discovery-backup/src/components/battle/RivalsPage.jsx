import { useState, useEffect, useRef, Fragment } from 'react';
import { FONT_DISPLAY, FONT_BODY } from '../../constants/fonts';
import { lbl, inp } from '../../constants/styles';
import { Ic } from '../shared/Ic';
import { Btn } from '../shared/Btn';
import { Modal } from '../shared/Modal';
import { useT } from '../../hooks/useTranslation';
import { useSettings } from '../../hooks/useSettings';

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

const today = () => new Date().toISOString().split("T")[0];

export const RivalsPage = ({ rivals=[], onRivalsChange, addToast, onAddTrigger, addCalendarEvent }) => {
  const t = useT();
  const { C } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [editingRival, setEditingRival] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showConfPrompt, setShowConfPrompt] = useState(false);
  const [pendingConf, setPendingConf] = useState(null);

  // Ensure all fields exist on a rival (handles data from before new fields were added)
  const normalizeRival = (r) => r ? ({
    signatureMoves:"", gamePlan:"", targetWhen:"", targetWhere:"", battles:[], videoRefs:[], strongDomains:[], ...r,
  }) : null;

  useEffect(() => {
    if (!onAddTrigger) return;
    setEditingRival(null);
    setShowModal(true);
  }, [onAddTrigger]);

  const addRival = (data) => {
    const now = new Date().toISOString();
    onRivalsChange(prev => [...prev, { ...data, id: Date.now(), battles:[], createdDate: now, updatedDate: now }]);
  };
  const updateRival = (id, data) => {
    onRivalsChange(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedDate: new Date().toISOString() } : r));
  };
  const deleteRival = (id) => {
    onRivalsChange(prev => prev.filter(r => r.id !== id));
    setConfirmDelete(null);
    if (addToast) addToast({ emoji:"\ud83d\uddd1\ufe0f", title: t("deleteRival") });
  };

  // ── Rival Card ──
  const RivalCard = ({ rival }) => {
    const initials = rival.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    const conf = CONF_OPTIONS.find(c => c.val === rival.confidence);
    const lastBattle = (rival.battles||[]).length > 0 ? [...rival.battles].sort((a,b) => b.date.localeCompare(a.date))[0] : null;
    const lastResult = lastBattle ? RESULT_OPTIONS.find(r => r.val === lastBattle.result) : null;
    const whenWhere = [
      rival.targetWhen ? `\ud83d\udcc5 ${rival.targetWhen}` : null,
      rival.targetWhere ? `\ud83d\udccd ${rival.targetWhere}` : null,
    ].filter(Boolean).join(" \u00b7 ");
    return (
      <div onClick={() => { setEditingRival(normalizeRival(rival)); setShowModal(true); }}
        style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:16,
          cursor:"pointer", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", flexShrink:0, overflow:"hidden",
          background: rival.photo ? "none" : C.surfaceAlt, display:"flex", alignItems:"center", justifyContent:"center",
          border:`2px solid ${C.border}` }}>
          {rival.photo
            ? <img src={rival.photo} alt="" style={{ width:48, height:48, objectFit:"cover" }}/>
            : <span style={{ fontSize:16, fontWeight:800, color:C.textMuted, fontFamily:FONT_DISPLAY }}>{initials}</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontWeight:800, fontSize:14, color:C.text, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>{rival.name}</span>
            {conf && <span style={{ fontSize:14 }}>{conf.emoji}</span>}
          </div>
          {rival.strongDomains?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
              {rival.strongDomains.map(d => (
                <span key={d} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                  background:`${C.accent}15`, color:C.accent, border:`1px solid ${C.accent}33`,
                  fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>{t(DOMAIN_KEYS[d]||d)}</span>
              ))}
            </div>
          )}
          {whenWhere && (
            <div style={{ fontSize:11, color:C.textMuted, marginTop:4, fontFamily:FONT_BODY }}>{whenWhere}</div>
          )}
          {lastBattle && lastResult && (
            <div style={{ fontSize:11, color:C.textMuted, marginTop:2, fontFamily:FONT_BODY }}>
              {t("lastBattle")}: {lastBattle.date} \u00b7 {lastResult.emoji}
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
  const RivalModal = ({ rival, onClose, onSave }) => {
    const isEdit = !!rival;
    const [f, setF] = useState({
      name: rival?.name ?? "",
      photo: rival?.photo ?? null,
      strongDomains: rival?.strongDomains ?? [],
      signatureMoves: rival?.signatureMoves ?? "",
      gamePlan: rival?.gamePlan ?? "",
      confidence: rival?.confidence ?? null,
      videoRefs: rival?.videoRefs ?? [],
      targetWhen: rival?.targetWhen ?? "",
      targetWhere: rival?.targetWhere ?? "",
    });
    const photoRef = useRef(null);

    // Battle log state
    const [showBattleLog, setShowBattleLog] = useState(false);
    const [battleForm, setBattleForm] = useState({ date: today(), result: null, event: rival?.targetWhere ?? "", howDidItGo:"", whatSurprised:"", trainingNext:"" });

    // Battle history expand state
    const [expandedBattle, setExpandedBattle] = useState(null);

    const toggleDomain = (d) => {
      setF(prev => ({
        ...prev,
        strongDomains: prev.strongDomains.includes(d)
          ? prev.strongDomains.filter(x => x !== d)
          : [...prev.strongDomains, d],
      }));
    };

    const handlePhoto = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const size = 200;
          const c = document.createElement("canvas");
          c.width = size; c.height = size;
          const ctx = c.getContext("2d");
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          setF(prev => ({ ...prev, photo: c.toDataURL("image/jpeg", 0.8) }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
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
        targetWhen: f.targetWhen.trim() || null,
        targetWhere: f.targetWhere.trim() || null,
        videoRefs: f.videoRefs.filter(v => v.url.trim()),
      };
      onSave(clean);
    };

    // Battle log save
    const handleSaveBattle = () => {
      if (!battleForm.result) return;
      const entry = {
        id: String(Date.now()),
        date: battleForm.date,
        result: battleForm.result,
        event: battleForm.event.trim() || null,
        howDidItGo: battleForm.howDidItGo.trim() || null,
        whatSurprised: battleForm.whatSurprised.trim() || null,
        trainingNext: battleForm.trainingNext.trim() || null,
      };
      const updatedBattles = [...(rival.battles||[]), entry];
      updateRival(rival.id, { battles: updatedBattles });
      // Update the local rival ref for the modal
      if (rival) rival.battles = updatedBattles;

      // Calendar event
      const resultLabel = RESULT_OPTIONS.find(r => r.val === entry.result);
      if (addCalendarEvent) {
        addCalendarEvent({
          date: entry.date,
          type: "battle",
          title: `Battle vs ${rival.name}`,
          notes: `Result: ${resultLabel ? resultLabel.val.charAt(0).toUpperCase()+resultLabel.val.slice(1) : entry.result}${entry.event ? ` \u2014 ${entry.event}` : ""}`,
          source: "rivals",
          rivalId: rival.id,
        }, { silent: true });
      }
      if (addToast) addToast({ emoji:"\u2694\ufe0f", title: t("battleLogged") });

      setShowBattleLog(false);
      // Trigger confidence prompt at parent level (survives re-render)
      setPendingConf(rival.confidence || null);
      setShowConfPrompt(true);
    };

    const battles = [...(rival?.battles||[])].sort((a,b) => b.date.localeCompare(a.date));

    // ── Battle Log form screen ──
    if (showBattleLog) {
      return (
        <Modal title={t("battleLog")} onClose={() => setShowBattleLog(false)} wide>
          {/* Date */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>DATE</label>
            <input type="date" value={battleForm.date} onChange={e => setBattleForm(p => ({...p, date: e.target.value}))}
              style={inp()}/>
          </div>

          {/* Result */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>{t("resultLabel")}</label>
            <div style={{ display:"flex", gap:6 }}>
              {RESULT_OPTIONS.map(opt => {
                const active = battleForm.result === opt.val;
                return (
                  <button key={opt.val} onClick={() => setBattleForm(p => ({...p, result: active ? null : opt.val}))}
                    style={{ flex:1, borderRadius:10, padding:"10px 4px", fontSize:12, fontWeight:700, fontFamily:FONT_DISPLAY,
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

          {/* Event */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>{t("eventName")}</label>
            <input value={battleForm.event} onChange={e => setBattleForm(p => ({...p, event: e.target.value}))}
              placeholder={t("eventPlaceholder")} style={inp()}/>
          </div>

          {/* How did it go */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>{t("howDidItGo")}</label>
            <textarea value={battleForm.howDidItGo} onChange={e => setBattleForm(p => ({...p, howDidItGo: e.target.value}))}
              placeholder={t("howDidItGoPlaceholder")} rows={3}
              style={{ ...inp(), resize:"vertical" }}/>
          </div>

          {/* What surprised you */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>{t("whatSurprised")}</label>
            <textarea value={battleForm.whatSurprised} onChange={e => setBattleForm(p => ({...p, whatSurprised: e.target.value}))}
              placeholder={t("whatSurprisedPlaceholder")} rows={2}
              style={{ ...inp(), resize:"vertical" }}/>
          </div>

          {/* Training next */}
          <div style={{ marginBottom:14 }}>
            <label style={lbl()}>{t("trainingNext")}</label>
            <textarea value={battleForm.trainingNext} onChange={e => setBattleForm(p => ({...p, trainingNext: e.target.value}))}
              placeholder={t("trainingNextPlaceholder")} rows={2}
              style={{ ...inp(), resize:"vertical" }}/>
          </div>

          {/* Buttons */}
          <button onClick={handleSaveBattle} disabled={!battleForm.result}
            style={{ width:"100%", padding:"12px 0", borderRadius:8, border:"none",
              background: battleForm.result ? C.accent : C.surfaceAlt,
              color: battleForm.result ? C.bg : C.textMuted,
              fontSize:14, fontWeight:900, fontFamily:FONT_DISPLAY, letterSpacing:1, cursor: battleForm.result ? "pointer" : "not-allowed",
              opacity: battleForm.result ? 1 : 0.5, marginBottom:8 }}>
            {t("saveBattleLog")}
          </button>
          <button onClick={() => setShowBattleLog(false)}
            style={{ width:"100%", padding:"8px 0", background:"none", border:"none", color:C.textSec, fontSize:12,
              fontWeight:700, fontFamily:FONT_DISPLAY, cursor:"pointer", letterSpacing:0.5 }}>
            {t("cancel")}
          </button>
        </Modal>
      );
    }

    // ── Main rival edit/add modal ──
    return (
      <Modal title={isEdit ? t("editRival") : t("addRival")} onClose={onClose} wide>
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
          <input value={f.name} onChange={e => setF(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Name..." autoFocus
            style={inp()}/>
        </div>

        {/* Their Strengths */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("theirStrengths")}</label>
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontFamily:FONT_BODY }}>{t("theirStrengthsSub")}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {DOMAINS.map(d => {
              const active = f.strongDomains.includes(d);
              return (
                <button key={d} onClick={() => toggleDomain(d)}
                  style={{ borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700, fontFamily:FONT_DISPLAY,
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
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("signatureMovesLabel")}</label>
          <textarea value={f.signatureMoves} onChange={e => setF(prev => ({ ...prev, signatureMoves: e.target.value }))}
            placeholder={t("signatureMovesPlaceholder")} rows={3}
            style={{ ...inp(), resize:"vertical" }}/>
        </div>

        {/* Game Plan */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("gamePlanLabel")}</label>
          <textarea value={f.gamePlan} onChange={e => setF(prev => ({ ...prev, gamePlan: e.target.value }))}
            placeholder={t("gamePlanPlaceholder")} rows={3}
            style={{ ...inp(), resize:"vertical" }}/>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("confidenceLabel")}</label>
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, fontFamily:FONT_BODY }}>{t("confidenceSub")}</div>
          <div style={{ display:"flex", gap:6 }}>
            {CONF_OPTIONS.map(opt => {
              const active = f.confidence === opt.val;
              return (
                <button key={opt.val} onClick={() => setF(prev => ({ ...prev, confidence: active ? null : opt.val }))}
                  style={{ flex:1, borderRadius:10, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
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
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontFamily:FONT_BODY }}>{t("rivalWhenHint")}</div>
          <input value={f.targetWhen} onChange={e => setF(prev => ({ ...prev, targetWhen: e.target.value }))}
            placeholder={t("rivalWhenPlaceholder")} style={inp()}/>
        </div>

        {/* Where */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl()}>{t("rivalWhere")}</label>
          <div style={{ fontSize:12, color:C.textMuted, marginBottom:6, fontFamily:FONT_BODY }}>{t("rivalWhereHint")}</div>
          <input value={f.targetWhere} onChange={e => setF(prev => ({ ...prev, targetWhere: e.target.value }))}
            placeholder={t("rivalWherePlaceholder")} style={inp()}/>
        </div>

        {/* Video References */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("videoReference")}</div>
          {f.videoRefs.map((vr, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"flex-start" }}>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                <input value={vr.url} onChange={e => updateVideoRef(i, "url", e.target.value)}
                  placeholder={t("pasteLink")} style={{ ...inp(), marginBottom:0 }}/>
                <input value={vr.label} onChange={e => updateVideoRef(i, "label", e.target.value)}
                  placeholder={t("labelOptional")} style={{ ...inp(), marginBottom:0, fontSize:12 }}/>
              </div>
              <button onClick={() => removeVideoRef(i)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:6, marginTop:6 }}>
                <Ic n="x" s={14} c={C.textMuted}/>
              </button>
            </div>
          ))}
          <button onClick={addVideoRef}
            style={{ fontSize:12, fontWeight:700, color:C.accent, background:"none", border:"none", cursor:"pointer",
              padding:"4px 0", fontFamily:FONT_DISPLAY, letterSpacing:0.5 }}>
            {t("addVideoRef")}
          </button>
        </div>

        {/* Battle History */}
        {isEdit && battles.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.textMuted, fontFamily:FONT_DISPLAY, marginBottom:8 }}>{t("battleHistory")}</div>
            {battles.map(b => {
              const res = RESULT_OPTIONS.find(r => r.val === b.result);
              const isExpanded = expandedBattle === b.id;
              const hasDetail = b.howDidItGo || b.whatSurprised || b.trainingNext;
              return (
                <div key={b.id} onClick={() => hasDetail && setExpandedBattle(isExpanded ? null : b.id)}
                  style={{ background:C.surfaceAlt, borderRadius:10, padding:"10px 12px", marginBottom:6,
                    border:`1px solid ${C.border}`, cursor: hasDetail ? "pointer" : "default" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:FONT_DISPLAY }}>{b.date}</span>
                    {res && <span style={{ fontSize:12 }}>{t(res.key)}</span>}
                    {b.event && <span style={{ fontSize:11, color:C.textMuted, fontFamily:FONT_BODY }}>\u2014 {b.event}</span>}
                    {hasDetail && <span style={{ marginLeft:"auto", fontSize:10, color:C.textMuted }}>{isExpanded ? "\u25b2" : "\u25bc"}</span>}
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                      {b.howDidItGo && (
                        <div style={{ marginBottom:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:0.8, marginBottom:2 }}>{t("howDidItGo")}</div>
                          <div style={{ fontSize:12, color:C.textSec, lineHeight:1.5, fontFamily:FONT_BODY }}>{b.howDidItGo}</div>
                        </div>
                      )}
                      {b.whatSurprised && (
                        <div style={{ marginBottom:6 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:0.8, marginBottom:2 }}>{t("whatSurprised")}</div>
                          <div style={{ fontSize:12, color:C.textSec, lineHeight:1.5, fontFamily:FONT_BODY }}>{b.whatSurprised}</div>
                        </div>
                      )}
                      {b.trainingNext && (
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, fontFamily:FONT_DISPLAY, letterSpacing:0.8, marginBottom:2 }}>{t("trainingNext")}</div>
                          <div style={{ fontSize:12, color:C.textSec, lineHeight:1.5, fontFamily:FONT_BODY }}>{b.trainingNext}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Log a Battle button */}
        {isEdit && (
          <button onClick={() => { setBattleForm({ date: today(), result: null, event: rival?.targetWhere ?? "", howDidItGo:"", whatSurprised:"", trainingNext:"" }); setShowBattleLog(true); }}
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
              style={{ fontSize:12, color:C.red || C.accent, background:"none", border:"none", cursor:"pointer",
                fontWeight:700, fontFamily:FONT_DISPLAY, letterSpacing:0.5, padding:"10px 0" }}>
              {t("deleteRival")}
            </button>
          )}
          <div style={{ flex:1 }}/>
          <Btn variant="secondary" onClick={onClose}>{t("cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!canSave}>{t("save")}</Btn>
        </div>
      </Modal>
    );
  };

  // ── Main render ──
  return (
    <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
      {rivals.length === 0 ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", textAlign:"center" }}>
          <p style={{ fontSize:14, color:C.textSec, lineHeight:1.7, maxWidth:320, fontFamily:FONT_BODY, margin:0 }}>{t("rivalsIntro")}</p>
        </div>
      ) : (
        <div style={{ padding:"12px 14px" }}>
          {rivals.map(r => <RivalCard key={r.id} rival={r}/>)}
        </div>
      )}

      {showModal && (
        <RivalModal
          rival={editingRival}
          onClose={() => { setShowModal(false); setEditingRival(null); }}
          onSave={(data) => {
            if (editingRival) updateRival(editingRival.id, data);
            else addRival(data);
            setShowModal(false);
            setEditingRival(null);
          }}/>
      )}

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900,
            display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, maxWidth:320, padding:20, width:"100%",
              boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:FONT_DISPLAY, color:C.text, marginBottom:8 }}>
              {t("deleteRival")}
            </div>
            <p style={{ fontSize:13, color:C.textSec, marginBottom:16, lineHeight:1.6, fontFamily:FONT_BODY }}>
              {t("deleteRivalConfirm")}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>{t("cancel")}</Btn>
              <Btn variant="danger" onClick={() => deleteRival(confirmDelete.id)}>{t("delete")}</Btn>
            </div>
          </div>
        </div>
      )}

      {showConfPrompt && editingRival && (
        <div onClick={() => setShowConfPrompt(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000,
            display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 12px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:14, width:"100%", maxWidth:420,
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
                    style={{ flex:1, borderRadius:10, padding:"8px 4px", fontSize:11, fontWeight:700, fontFamily:FONT_DISPLAY,
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
                color:C.textSec, fontSize:12, fontWeight:700, fontFamily:FONT_DISPLAY, cursor:"pointer", letterSpacing:1 }}>
              {t("skip")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
