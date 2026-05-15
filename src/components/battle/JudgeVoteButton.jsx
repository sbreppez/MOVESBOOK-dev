import React from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY } from "../../constants/fonts";
import { useT } from "../../hooks/useTranslation";
import { Ic } from "../shared/Ic";

const NEXT = { null: "up", up: "down", down: "tie", tie: null };

export const JudgeVoteButton = ({ name, vote, onChange }) => {
  const t = useT();
  const active = vote != null;
  const cycle = () => onChange(NEXT[vote == null ? "null" : vote]);

  let iconNode = null;
  let label = t("tapToVote");
  if (vote === "up")   { iconNode = <Ic n="thumbsUp"   s={16} c={C.accent}/>; label = t("won"); }
  if (vote === "down") { iconNode = <Ic n="thumbsDown" s={16} c={C.accent}/>; label = t("lost"); }
  if (vote === "tie")  { iconNode = <Ic n="x"          s={16} c={C.accent}/>; label = t("judgeVoteTie"); }

  return (
    <button
      type="button"
      onClick={cycle}
      style={{
        background: active ? C.accent + "18" : C.bg,
        border: `1.5px solid ${active ? C.accent : C.border}`,
        borderRadius: 8,
        padding: "10px 13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        width: "100%",
      }}
    >
      <span style={{
        fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
        color: C.text, textTransform: "uppercase",
      }}>
        {name}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {iconNode}
        <span style={{
          fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: 1,
          color: active ? C.accent : C.textMuted, textTransform: "uppercase",
          minWidth: 28, textAlign: "right",
        }}>
          {label}
        </span>
      </div>
    </button>
  );
};
