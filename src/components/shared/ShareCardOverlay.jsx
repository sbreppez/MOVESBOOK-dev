import React, { useRef, useState, useEffect, useCallback } from "react";
import { C } from "../../constants/colors";
import { FONT_DISPLAY } from "../../constants/fonts";
import { compressImage } from "../../utils/imageUtils";

const DOMAINS = ["musicality","performance","technique","variety","creativity","personality"];
const DOMAIN_LABELS = {
  musicality: "Musicality", performance: "Performance", technique: "Technique",
  variety: "Variety", creativity: "Creativity", personality: "Personality"
};

// ── Canvas hex helper ──
const hexPt = (cx, cy, r, index, scale) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6;
  return [cx + (r * scale / 10) * Math.cos(angle), cy + (r * scale / 10) * Math.sin(angle)];
};

// ── Word wrap helper ──
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach(word => {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
};

export const ShareCardOverlay = ({ type, data, onClose, t }) => {
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Photo if available
    if (photo) {
      try {
        const img = new Image();
        img.src = photo;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        ctx.globalAlpha = 0.4;
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.globalAlpha = 1.0;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(10,10,10,0.3)");
        grad.addColorStop(0.5, "rgba(10,10,10,0.6)");
        grad.addColorStop(1, "rgba(10,10,10,0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      } catch {}
    }

    // Branding top-left
    ctx.textAlign = "start";
    ctx.font = "bold 32px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#cf0000";
    ctx.fillText("MOVES", 60, 80);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("BOOK", 60 + ctx.measureText("MOVES").width, 80);

    // Date bottom-left
    ctx.font = "500 24px 'Barlow', sans-serif";
    ctx.fillStyle = "#7a7a7a";
    ctx.fillText(new Date().toLocaleDateString(), 60, H - 50);

    // URL bottom-right
    ctx.textAlign = "end";
    ctx.fillText("movesbook.vercel.app", W - 60, H - 50);

    // ── Type-specific content ──
    if (type === "story") {
      drawStoryCard(ctx, W, H, data);
    } else if (type === "stance") {
      drawStanceCard(ctx, W, H, data);
    }

    ctx.textAlign = "start";
  }, [photo, type, data]);

  useEffect(() => { generateCard(); }, [generateCard]);

  // ── Photo handling ──
  const handlePhotoInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await compressImage(file, 1080));
  };

  // ── Share / Download ──
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = type === "story" ? "movesbook-story.png" : "movesbook-stance.png";
    const title = type === "story" ? "MovesBook Development Story" : "MovesBook MyStance";
    try {
      const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title });
          onClose();
          return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {}
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 360, maxHeight: "80vh", overflow: "auto" }}>
        <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 12, display: "block" }}/>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", maxWidth: 360 }}>
        <input ref={photoInputRef} type="file" accept="image/*" capture="camera" style={{ display: "none" }} onChange={handlePhotoInput}/>
        <button onClick={() => photoInputRef.current?.click()}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${C.border}`,
            background: C.surfaceAlt, color: C.text, cursor: "pointer",
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
          {"\uD83D\uDCF7"} {t("addPhoto")}
        </button>
        <button onClick={handleShare}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: "none",
            background: C.accent, color: "#fff", cursor: "pointer",
            fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 12, letterSpacing: 0.5 }}>
          {t("share")}
        </button>
      </div>
      <button onClick={onClose}
        style={{ marginTop: 12, padding: "10px 24px", borderRadius: 8, border: "none",
          background: "transparent", color: C.textMuted, cursor: "pointer",
          fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12 }}>
        {t("close")}
      </button>
    </div>
  );
};

// ── Story Card Drawing ──
function drawStoryCard(ctx, W, H, data) {
  const { narrative } = data;

  // Emoji
  ctx.textAlign = "center";
  ctx.font = "80px serif";
  ctx.fillText("\uD83D\uDCD6", W / 2, H * 0.15 + 40);

  // Title
  ctx.font = "900 40px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("MY DEVELOPMENT STORY", W / 2, H * 0.25);

  // Narrative text — word-wrapped
  ctx.font = "700 28px 'Barlow', sans-serif";
  ctx.fillStyle = "#b3b3b3";
  const lines = wrapText(ctx, narrative, 900);
  const startY = H * 0.38;
  const lineHeight = 40;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });
}

// ── Stance Card Drawing ──
function drawStanceCard(ctx, W, H, data) {
  const { domains, date } = data;

  // Title
  ctx.textAlign = "center";
  ctx.font = "900 40px 'Barlow Condensed', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("MY STANCE", W / 2, H * 0.15);

  // Radar chart
  const cx = W / 2, cy = H * 0.48, r = 200;
  const gridLevels = [2, 4, 6, 8, 10];

  // Grid hexagons
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  gridLevels.forEach(lv => {
    ctx.beginPath();
    DOMAINS.forEach((_, i) => {
      const [x, y] = hexPt(cx, cy, r, i, lv);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  // Spoke lines
  DOMAINS.forEach((_, i) => {
    const [x, y] = hexPt(cx, cy, r, i, 10);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Data polygon
  ctx.beginPath();
  DOMAINS.forEach((d, i) => {
    const val = domains[d] || 1;
    const [x, y] = hexPt(cx, cy, r, i, val);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(139,26,26,0.25)";
  ctx.fill();
  ctx.strokeStyle = "#8B1A1A";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Domain labels + scores
  DOMAINS.forEach((d, i) => {
    const [lx, ly] = hexPt(cx, cy, r, i, 12.5);
    const val = domains[d] || 0;

    // Label
    ctx.font = "700 22px 'Barlow', sans-serif";
    ctx.fillStyle = "#999999";
    ctx.textAlign = "center";
    ctx.fillText(DOMAIN_LABELS[d], lx, ly);

    // Score below label
    ctx.font = "900 24px 'Barlow Condensed', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(val), lx, ly + 28);
  });

  // Assessment date
  if (date) {
    ctx.font = "500 24px 'Barlow', sans-serif";
    ctx.fillStyle = "#7a7a7a";
    ctx.textAlign = "center";
    ctx.fillText(date, W / 2, H * 0.88);
  }
}
