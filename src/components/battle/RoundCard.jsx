import React, { useState } from "react";
import { C } from "../../constants/colors";
import { CAT_COLORS } from "../../constants/categories";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { inp } from "../../constants/styles";
import { Ic } from "../shared/Ic";
import { JudgeVoteButton } from "./JudgeVoteButton";

const STRIPE_CYCLE = ["Toprocks","Godowns","Footworks","Power Moves","Freezes","Transitions","Burns","Blowups"];
const ROUND_NAME_PRESETS = ["Prelims","Top 32","Top 16","Top 8","Quarter-Finals","Semi-Finals","Finals","Round 1","Round 2","Round 3"];

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

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export const RoundCard = ({ round, index, battleJudges, onChange, moves = [] }) => {
  const stripeColor = CAT_COLORS[STRIPE_CYCLE[(index - 1) % STRIPE_CYCLE.length]];
  const isCustomRoundName = round.roundName && !ROUND_NAME_PRESETS.includes(round.roundName);
  const [customMode, setCustomMode] = useState(isCustomRoundName);

  const update = (patch) => onChange({ ...round, ...patch });

  const handleRoundNameSelect = (val) => {
    if (val === "__custom__") {
      setCustomMode(true);
      update({ roundName: "" });
    } else {
      setCustomMode(false);
      update({ roundName: val });
    }
  };

  const toggleOutcome = (val) => update({ outcome: round.outcome === val ? null : val });

  const addVideo = () => update({ videos: [...round.videos, ""] });
  const setVideo = (i, v) => update({ videos: round.videos.map((u, k) => (k === i ? v : u)) });

  const addEntry = () => update({ entries: [...round.entries, { id: newId(), text: "" }] });
  const setEntryText = (i, v) =>
    update({ entries: round.entries.map((e, k) => (k === i ? { ...e, text: v } : e)) });

  const setOpponentName = (v) =>
    update({ opponent: { name: v, rivalId: round.opponent?.rivalId ?? null } });
  const clearRival = () =>
    update({ opponent: round.opponent ? { name: round.opponent.name, rivalId: null } : null });

  const setVote = (i, v) =>
    update({ judgeVotes: { ...(round.judgeVotes || {}), [i]: v } });

  const dropdownValue = customMode ? "__custom__" : (round.roundName || "");

  return (
    <div style={{
      background: C.surface,
      borderRadius: 8,
      borderLeft: `4px solid ${stripeColor}`,
      padding: "14px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
        <span style={{
          fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 800, letterSpacing: 1.2,
          color: C.text, textTransform: "uppercase",
        }}>
          Round {index}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {/* Round name */}
        <div>
          <FormLabel>Round name</FormLabel>
          <select
            value={dropdownValue}
            onChange={(e) => handleRoundNameSelect(e.target.value)}
            style={inp()}
          >
            <option value="" disabled>Pick a round name</option>
            {ROUND_NAME_PRESETS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="__custom__">Custom...</option>
          </select>
          {customMode && (
            <input
              type="text"
              value={round.roundName}
              onChange={(e) => update({ roundName: e.target.value })}
              placeholder="Custom round name"
              style={{ ...inp(), marginTop: 6 }}
            />
          )}
        </div>

        {/* Outcome */}
        <div>
          <FormLabel>Outcome</FormLabel>
          <div style={{ display: "flex", gap: 6 }}>
            <Chip label="Won"  active={round.outcome === "won"}  onClick={() => toggleOutcome("won")} />
            <Chip label="Lost" active={round.outcome === "lost"} onClick={() => toggleOutcome("lost")} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <FormLabel>Notes</FormLabel>
          <textarea
            value={round.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="What happened this round..."
            rows={2}
            style={{ ...inp(), resize: "vertical" }}
          />
        </div>

        {/* Videos */}
        <div>
          <FormLabel>Videos</FormLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {round.videos.map((url, i) => (
              <input
                key={i}
                type="text"
                value={url}
                onChange={(e) => setVideo(i, e.target.value)}
                placeholder="Video URL"
                style={inp()}
              />
            ))}
            <DashedButton onClick={addVideo}>
              <Ic n="plus" s={14} c={C.accent}/>
              <span>Video</span>
            </DashedButton>
          </div>
        </div>

        {/* Opponent */}
        <div>
          <FormLabel>Opponent</FormLabel>
          {round.opponent && round.opponent.rivalId && (
            <div style={{ marginBottom: 6 }}>
              <span style={{
                background: C.surfaceAlt,
                borderRadius: 20,
                padding: "5px 10px 5px 8px",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Ic n="user" s={13} c={C.textSec}/>
                <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: C.text }}>
                  {round.opponent.name}
                </span>
                <button
                  type="button"
                  onClick={clearRival}
                  style={{ background: "none", border: "none", padding: 0, display: "inline-flex", cursor: "pointer" }}
                  aria-label="Remove linked rival"
                >
                  <Ic n="x" s={13} c={C.textMuted}/>
                </button>
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={round.opponent?.name || ""}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Type a name (crew, unknown)..."
                style={inp()}
              />
            </div>
            <button
              type="button"
              title="Pick from rivals"
              onClick={() => alert("TODO: rivals picker")}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "0 14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Ic n="plus" s={18} c={C.accent}/>
            </button>
          </div>
        </div>

        {/* Entries */}
        <div>
          <FormLabel>Entries</FormLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {round.entries.map((e, i) => (
              <div key={e.id}>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                  color: C.textMuted, textTransform: "uppercase", marginBottom: 4,
                }}>
                  Entry {i + 1}
                </div>
                <input
                  type="text"
                  value={e.text}
                  onChange={(ev) => setEntryText(i, ev.target.value)}
                  placeholder={`What you did in entry ${i + 1}...`}
                  style={inp()}
                />
              </div>
            ))}
            <DashedButton onClick={addEntry}>
              <Ic n="plus" s={14} c={C.accent}/>
              <span>Entry</span>
            </DashedButton>
          </div>
        </div>

        {/* Moves used */}
        <div>
          <FormLabel>Moves used</FormLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            {round.moves.map((moveId) => {
              const move = moves.find(m => m.id === moveId);
              const catCol = move?.category ? CAT_COLORS[move.category] : null;
              const chipCol = catCol || C.accent;
              return (
                <span
                  key={moveId}
                  style={{
                    background: chipCol + "18",
                    border: `1.5px solid ${chipCol}`,
                    borderRadius: 20, padding: "5px 11px",
                    fontSize: 11, fontWeight: 700, fontFamily: FONT_DISPLAY, letterSpacing: 0.5,
                    color: chipCol, textTransform: "uppercase",
                  }}
                >
                  {moveId}
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => alert("TODO: moves picker")}
              style={{
                background: "transparent",
                border: `1.5px dashed ${C.border}`,
                borderRadius: 20, padding: "4px 10px",
                display: "inline-flex", alignItems: "center", gap: 4,
                color: C.accent, fontFamily: FONT_DISPLAY,
                fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                textTransform: "uppercase", cursor: "pointer",
              }}
            >
              <Ic n="plus" s={12} c={C.accent}/>
              Add
            </button>
          </div>
        </div>

        {/* Judge votes — only when battle judges are set */}
        {battleJudges != null && (
          <div>
            <FormLabel>Judge votes</FormLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: battleJudges.count }).map((_, i) => {
                const name = (battleJudges.names && battleJudges.names[i]) || `Judge ${i + 1}`;
                const vote = (round.judgeVotes && round.judgeVotes[i]) || null;
                return (
                  <JudgeVoteButton
                    key={i}
                    name={name}
                    vote={vote}
                    onChange={(v) => setVote(i, v)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
