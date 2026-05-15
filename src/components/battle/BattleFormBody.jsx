import React, { useEffect, useRef, useState } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY } from "../../constants/fonts";
import { inp } from "../../constants/styles";
import { useT } from "../../hooks/useTranslation";
import { Ic } from "../shared/Ic";
import { RoundCard } from "./RoundCard";

const FORMAT_PRESETS = [
  { value: "1v1", labelKey: "format1v1" },
  { value: "2v2", labelKey: "format2v2" },
  { value: "Crew", labelKey: "crew" },
  { value: "Cypher", labelKey: "cypher" },
];

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export const emptyRound = () => ({
  id: newId(),
  roundName: "",
  opponent: null,
  outcome: null,
  entries: [{ id: newId(), text: "" }],
  moves: [],
  videos: [],
  judgeVotes: null,
  notes: "",
});

export const emptyBattle = (date) => ({
  id: newId(),
  date: date || new Date().toISOString().slice(0, 10),
  eventName: "",
  format: null,
  battleNotes: "",
  judges: null,
  rounds: [],
});

const FormLabel = ({ children }) => (
  <div style={{
    fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
    color: C.textMuted, textTransform: "uppercase", marginBottom: 6,
  }}>
    {children}
  </div>
);

const Chip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center",
      border: `1.5px solid ${active ? C.accent : C.border}`,
      background: active ? C.accent + "18" : "transparent",
      borderRadius: 20, padding: "5px 13px",
      fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY, letterSpacing: 0.5,
      color: active ? C.accent : C.text, textTransform: "uppercase", cursor: "pointer",
    }}
  >
    {label}
  </button>
);

const DashedButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: "transparent",
      border: `1.5px dashed ${C.border}`,
      color: C.accent,
      borderRadius: 8,
      fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: 1,
      textTransform: "uppercase",
      padding: "11px 16px",
      fontSize: 13,
      width: "100%",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}
  >
    {children}
  </button>
);

const AccordionSection = ({ label, open, onToggle, children }) => (
  <div>
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 0", cursor: "pointer",
        borderBottom: open ? "none" : `1px solid ${C.borderLight}`,
      }}
    >
      <span style={{
        fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, letterSpacing: 1.2,
        color: C.text, textTransform: "uppercase",
      }}>
        {label}
      </span>
      <Ic n={open ? "chevD" : "chevR"} s={18} c={C.textSec}/>
    </div>
    {open && (
      <div style={{ marginTop: 8, marginBottom: 8, display: "flex", flexDirection: "column", gap: 13 }}>
        {children}
      </div>
    )}
  </div>
);

const FormatRow = ({ value, onChange, customs, onAddCustom }) => {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const commit = () => {
    const v = draft.trim();
    setDraft("");
    setAdding(false);
    if (!v) return;
    onAddCustom(v);
    onChange(`custom:${v}`);
  };

  const cancel = () => { setDraft(""); setAdding(false); };

  return (
    <div>
      <FormLabel>{t("format")}</FormLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {FORMAT_PRESETS.map((f) => (
          <Chip
            key={f.value}
            label={t(f.labelKey)}
            active={value === f.value}
            onClick={() => onChange(value === f.value ? null : f.value)}
          />
        ))}
        {customs.map((label) => {
          const key = `custom:${label}`;
          return (
            <Chip
              key={key}
              label={label}
              active={value === key}
              onClick={() => onChange(value === key ? null : key)}
            />
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            background: "transparent",
            border: `1.5px dashed ${C.border}`,
            borderRadius: 20, padding: "4px 11px",
            display: "inline-flex", alignItems: "center", gap: 4,
            color: C.accent, fontFamily: FONT_DISPLAY,
            fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
            textTransform: "uppercase", cursor: "pointer",
          }}
        >
          <Ic n="plus" s={12} c={C.accent}/>
          {t("add")}
        </button>
      </div>
      {adding && (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            else if (e.key === "Escape") { e.preventDefault(); cancel(); }
          }}
          placeholder={t("newFormatPlaceholder")}
          style={{ ...inp(), marginTop: 6 }}
        />
      )}
    </div>
  );
};

const JudgesSection = ({ judges, onChange }) => {
  const t = useT();
  const count = judges?.count ?? 3;
  const names = judges?.names ?? Array.from({ length: count }, () => "");

  const setCount = (raw) => {
    const n = Math.max(1, Math.min(9, parseInt(raw, 10) || 1));
    const nextNames = Array.from({ length: n }, (_, i) => names[i] ?? "");
    onChange({ count: n, names: nextNames });
  };

  const setName = (i, v) =>
    onChange({ count, names: names.map((nm, k) => (k === i ? v : nm)) });

  return (
    <>
      <div>
        <FormLabel>{t("judgeCount")}</FormLabel>
        <input
          type="number"
          min={1}
          max={9}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          style={{ ...inp(), width: 64, textAlign: "center" }}
        />
      </div>
      <div>
        <FormLabel>{t("judgeNamesOptional")}</FormLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {names.map((nm, i) => (
            <div key={i}>
              <div style={{
                fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                color: C.textMuted, textTransform: "uppercase", marginBottom: 4,
              }}>
                {t("judgeN").replace("{n}", i + 1)}
              </div>
              <input
                type="text"
                value={nm}
                onChange={(e) => setName(i, e.target.value)}
                style={inp()}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// Shared form body for BattleFormModal (overlay use from RivalsPage) and
// LogTodayBattle (inline use from Log Today's Battle sub-tab). Parent owns
// the `battle` state; the body emits patches via onChange and manages only
// its own UI state (accordion open flags + custom-format input).
export const BattleFormBody = ({
  battle,
  onChange,
  moves = [],
  battleFormats = [],
  setBattleFormats,
}) => {
  const t = useT();
  const [judgesOpen, setJudgesOpen] = useState(() => battle?.judges != null);
  const [roundsOpen, setRoundsOpen] = useState(() => (battle?.rounds?.length ?? 0) > 0);

  const update = (patch) => onChange(patch);

  const handleAddCustomFormat = (label) => {
    if (setBattleFormats) {
      setBattleFormats(prev => (prev || []).includes(label) ? prev : [...(prev || []), label]);
    }
  };

  const handleSetJudges = (judges) => update({ judges });

  const handleAddRound = () => update({ rounds: [...battle.rounds, emptyRound()] });

  const handleRoundChange = (idx, nextRound) =>
    update({ rounds: battle.rounds.map((r, k) => (k === idx ? nextRound : r)) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Event name */}
      <div>
        <FormLabel>{t("eventName")}</FormLabel>
        <input
          type="text"
          value={battle.eventName}
          onChange={(e) => update({ eventName: e.target.value })}
          placeholder={t("eventPlaceholder")}
          style={inp()}
        />
      </div>

      {/* Date */}
      <div>
        <FormLabel>{t("battleDate")}</FormLabel>
        <input
          type="date"
          value={battle.date}
          onChange={(e) => update({ date: e.target.value })}
          style={inp()}
        />
      </div>

      {/* Format */}
      <FormatRow
        value={battle.format}
        onChange={(v) => update({ format: v })}
        customs={battleFormats}
        onAddCustom={handleAddCustomFormat}
      />

      {/* Judges accordion */}
      <AccordionSection
        label={t("judges")}
        open={judgesOpen}
        onToggle={() => {
          setJudgesOpen((v) => !v);
          if (!judgesOpen && battle.judges == null) {
            update({ judges: { count: 3, names: ["", "", ""] } });
          }
        }}
      >
        <JudgesSection judges={battle.judges} onChange={handleSetJudges}/>
      </AccordionSection>

      {/* Rounds accordion */}
      <AccordionSection
        label={t("rounds")}
        open={roundsOpen}
        onToggle={() => setRoundsOpen((v) => !v)}
      >
        {battle.rounds.map((round, i) => (
          <RoundCard
            key={round.id}
            round={round}
            index={i + 1}
            battleJudges={battle.judges}
            moves={moves}
            onChange={(next) => handleRoundChange(i, next)}
            onRemove={() => update({ rounds: battle.rounds.filter((_, k) => k !== i) })}
          />
        ))}
        <DashedButton onClick={handleAddRound}>
          <Ic n="plus" s={14} c={C.accent}/>
          <span>{t("addRound")}</span>
        </DashedButton>
      </AccordionSection>

      {/* Battle thoughts */}
      <div>
        <FormLabel>{t("battleThoughts")}</FormLabel>
        <textarea
          value={battle.battleNotes}
          onChange={(e) => update({ battleNotes: e.target.value })}
          placeholder={t("battleThoughtsPlaceholder")}
          rows={3}
          style={{ ...inp(), resize: "vertical" }}
        />
      </div>
    </div>
  );
};

export default BattleFormBody;
