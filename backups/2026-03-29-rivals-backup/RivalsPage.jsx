import { useState, useEffect, useRef } from 'react';
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

export const RivalsPage = ({ rivals=[], onRivalsChange, addToast, onAddTrigger }) => {
  const t = useT();
  const { C } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [editingRival, setEditingRival] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!onAddTrigger) return;
    setEditingRival(null);
    setShowModal(true);
  }, [onAddTrigger]);

  const addRival = (data) => {
    const now = new Date().toISOString();
    onRivalsChange(prev => [...prev, { ...data, id: Date.now(), createdDate: now, updatedDate: now }]);
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
    return (
      <div onClick={() => { setEditingRival(rival); setShowModal(true); }}
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
      name: rival?.name || "",
      photo: rival?.photo || null,
      strongDomains: rival?.strongDomains || [],
      signatureMoves: rival?.signatureMoves || "",
      gamePlan: rival?.gamePlan || "",
      confidence: rival?.confidence || null,
      videoRefs: rival?.videoRefs || [],
    });
    const photoRef = useRef(null);

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
        videoRefs: f.videoRefs.filter(v => v.url.trim()),
      };
      onSave(clean);
    };

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

        {/* Action buttons */}
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
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
    </div>
  );
};
