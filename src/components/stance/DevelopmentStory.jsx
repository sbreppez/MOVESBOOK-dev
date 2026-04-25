import React, { useState } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY, FONT_BODY } from "../../constants/fonts";
import { Ic } from "../shared/Ic";
import { useT } from "../../hooks/useTranslation";
import { ShareCardOverlay } from "../shared/ShareCardOverlay";

export const DevelopmentStory = ({ moves, sparring: _sparring, calendar: _calendar }) => {
  const t = useT();
  const [showShare, setShowShare] = useState(false);

  // ── 90-day gate ──
  if (!moves || !moves.length) return null;

  let earliest = Infinity;
  moves.forEach(m => {
    const d = m.createdAt || m.date;
    if (d) {
      const ts = new Date(d).getTime();
      if (ts < earliest) earliest = ts;
    }
  });
  if (earliest === Infinity) return null;

  const now = Date.now();
  const daysSinceFirst = Math.floor((now - earliest) / (1000 * 60 * 60 * 24));
  if (daysSinceFirst < 90) return null;

  // ── Compute stats ──
  const totalMoves = moves.length;
  const months = Math.floor(daysSinceFirst / 30);
  const originals = moves.filter(m => m.origin === "creation").length;
  const withParent = moves.filter(m => m.parentId).length;
  const battleReady = moves.filter(m => (m.mastery || 0) >= 80).length;

  // Deepest lineage branch
  const depthOf = (id, depth = 0) => {
    const children = moves.filter(m => m.parentId === id);
    if (!children.length) return depth;
    return Math.max(...children.map(c => depthOf(c.id, depth + 1)));
  };
  const roots = moves.filter(m => !m.parentId && moves.some(c => c.parentId === m.id));
  const deepestRoot = roots.length ? roots.reduce((best, r) => {
    const d = depthOf(r.id, 1);
    return d > best.depth ? { name: r.name, depth: d } : best;
  }, { name: "", depth: 0 }) : null;

  // Power moves standalone check
  const powerMoves = moves.filter(m => {
    const cat = (m.category || "").toLowerCase();
    return cat.includes("power");
  });
  const standalonePower = powerMoves.filter(m => !m.parentId && !moves.some(c => c.parentId === m.id));

  // ── Build narrative ──
  const lines = [];

  lines.push(`In the last ${months} month${months !== 1 ? "s" : ""}, you've added ${totalMoves} moves.`);

  if (withParent > 0) {
    lines.push(`${withParent} branched from existing vocabulary \u2014 that's strong creative depth.`);
  }

  if (deepestRoot && deepestRoot.depth >= 2) {
    lines.push(`Your deepest branch is your ${deepestRoot.name} family (${deepestRoot.depth} generations).`);
  }

  if (originals > 0) {
    lines.push(`${originals} ${originals === 1 ? "is" : "are"} marked as your own creations.`);
  }

  if (battleReady > 0) {
    lines.push(`${battleReady} moves are battle ready.`);
  }

  if (standalonePower.length > 0 && standalonePower.length === powerMoves.length && powerMoves.length > 1) {
    lines.push(`Your power moves are all standalone \u2014 none have children yet.`);
  }

  const narrative = lines.join(" ");

  return (
    <div style={{
      background: C.surface, borderRadius: 8,
      padding: 20, margin: "20px 0 8px"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14,
        paddingBottom: 6, borderBottom: `1px solid ${C.borderLight}` }}>
        <Ic n="book" s={14} c={C.accent}/>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: C.brown, fontFamily: FONT_DISPLAY }}>
          {t("developmentStory")}
        </span>
      </div>

      {/* Narrative */}
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSec, lineHeight: 1.7 }}>
        {narrative}
      </div>

      {/* Share button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={() => setShowShare(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: "pointer", padding: 0, fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 11, color: C.textMuted }}>
          <Ic n="share2" s={14} c={C.textMuted}/>
          {t("shareCard")}
        </button>
      </div>

      {/* Share overlay */}
      {showShare && (
        <ShareCardOverlay
          type="story"
          data={{ narrative }}
          onClose={() => setShowShare(false)}
          t={t}
        />
      )}
    </div>
  );
};
