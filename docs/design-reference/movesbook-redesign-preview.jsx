import { useState } from "react";

const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const FONT_BODY = "'Barlow', sans-serif";

const C = {
  dark: {
    bg: "#0A0A0A", surface: "#1C1C1E", surfaceAlt: "#2C2C2E", surfaceHigh: "#3A3A3C",
    border: "#3A3A3C", text: "#E8E8E8", textSec: "#9E9E9E", textMuted: "#6E6E6E",
    header: "#0A0A0A", headerText: "#E8E8E8", accent: "#e53935",
    green: "#1db954", yellow: "#ffa726", blue: "#42a5f5",
  },
  light: {
    bg: "#F2F2F7", surface: "#FFFFFF", surfaceAlt: "#F2F2F7", surfaceHigh: "#E5E5EA",
    border: "#D1D1D6", text: "#1C1C1E", textSec: "#48484A", textMuted: "#8E8E93",
    header: "#FFFFFF", headerText: "#1C1C1E", accent: "#cf0000",
    green: "#2e7d32", yellow: "#f57f17", blue: "#1565c0",
  },
};

const CATS = {
  Toprocks: "#C4453E", Godowns: "#8B6AAE", Footworks: "#4A90C4",
  "Power Moves": "#D4943A", Freezes: "#3D9E72", Transitions: "#D46A52",
  Burns: "#8A6B54", Blowups: "#3A9E9E",
};
const MOVE_COUNTS = { Toprocks: 4, Godowns: 3, Footworks: 18, "Power Moves": 1, Freezes: 1, Transitions: 1, Burns: 0, Blowups: 1 };

// ─── Shared Components ───

function Phone({ children }) {
  return (
    <div style={{ width: 260, height: 520, borderRadius: 22, overflow: "hidden", border: "2px solid #333", margin: "0 auto" }}>
      <div style={{ width: "100%", height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

function Header({ c }) {
  return (
    <div style={{ background: c.header, padding: "8px 12px 6px", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, letterSpacing: 3 }}>
          <span style={{ color: c.accent, fontWeight: 700 }}>MOVES</span>
          <span style={{ color: c.headerText, fontWeight: 700 }}>BOOK</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: c.surfaceHigh }} />
          <div style={{ width: 20, height: 20, borderRadius: 10, background: c.surfaceAlt }} />
        </div>
      </div>
    </div>
  );
}

function SubTabs({ c, tabs, active }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "0 12px 6px", background: c.header }}>
      {tabs.map(t => (
        <span key={t} style={{
          fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
          color: t === active ? c.text : c.textMuted,
          borderBottom: t === active ? `2px solid ${c.accent}` : "2px solid transparent",
          paddingBottom: 4,
        }}>{t}</span>
      ))}
    </div>
  );
}

function SectionBrief({ c, desc, stat }) {
  return (
    <div style={{ padding: "8px 12px 4px" }}>
      <div style={{ fontSize: 11, color: c.textSec, lineHeight: 1.5, fontFamily: FONT_BODY }}>{desc}</div>
      {stat && <div style={{ fontSize: 9, color: c.textMuted, fontStyle: "italic", marginTop: 2, fontFamily: FONT_BODY }}>{stat}</div>}
    </div>
  );
}

function BottomBar({ c, active }) {
  const tabs = [
    { id: "home", label: "HOME" },
    { id: "moves", label: "MOVES" },
    { id: "+", label: "+" },
    { id: "battle", label: "BATTLE" },
    { id: "reflect", label: "REFLECT" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "6px 0 8px", background: c.header,
      position: "sticky", bottom: 0, zIndex: 10,
    }}>
      {tabs.map(t => t.id === "+" ? (
        <div key="+" style={{
          width: 36, height: 36, borderRadius: 18, background: c.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1,
          marginTop: -8,
        }}>+</div>
      ) : (
        <div key={t.id} style={{
          fontFamily: FONT_DISPLAY, fontSize: 8, letterSpacing: 1.2, fontWeight: 600,
          color: active === t.id ? c.text : c.textMuted,
          textAlign: "center",
          borderBottom: active === t.id ? `2px solid ${c.accent}` : "2px solid transparent",
          paddingBottom: 2,
        }}>{t.label}</div>
      ))}
    </div>
  );
}

// ─── Overlay: BottomSheet ───
function BottomSheet({ c, children, onClose }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, top: 0, zIndex: 50,
      background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div style={{
        background: c.surface, borderRadius: "12px 12px 0 0", padding: "16px 12px 20px",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: c.border, margin: "0 auto 12px" }} />
        {children}
      </div>
    </div>
  );
}

// ─── Overlay: Create Modal ───
function CreateModal({ c, onClose }) {
  const tools = [
    { title: "EXPLORE", desc: "Constraints breed invention — the weirder the combo, the more original the result.", color: CATS.Footworks },
    { title: "R/R/R", desc: "Three ways to evolve your existing vocabulary. Pick a move and choose your path.", color: CATS["Power Moves"] },
    { title: "COMBINE", desc: "Spin random combinations from your move library.", color: CATS.Toprocks },
    { title: "MAP", desc: "Map how your moves connect. Every explored pairing reveals your vocabulary.", color: CATS.Freezes },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, top: 0, zIndex: 50,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: c.surface, borderRadius: 8, padding: "14px 12px", margin: "0 16px",
        width: "100%",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 2, fontWeight: 700, color: c.text }}>CREATE</div>
          <div style={{ fontSize: 14, color: c.textMuted, cursor: "pointer", padding: "0 4px" }} onClick={onClose}>✕</div>
        </div>
        <SectionBrief c={c} desc="Creative tools to grow and explore your movement vocabulary." stat="4 modes available" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {tools.map(tool => (
            <div key={tool.title} style={{
              background: c.bg, borderRadius: 4, padding: "10px 12px",
              borderLeft: `4px solid ${tool.color}`,
            }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: tool.color }}>{tool.title}</div>
              <div style={{ fontSize: 8, color: c.textSec, marginTop: 2, lineHeight: 1.4 }}>{tool.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG Icons (tiny inline) ───
function FilterIcon({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function ViewIcon({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function SearchIcon({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── LIBRARY SCREEN (NEW DESIGN) ───
function LibraryScreen({ c, onPlusTap }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <Header c={c} />
      <div style={{ background: c.header, padding: "0 12px 2px" }}>
        <SubTabs c={c} tabs={["LIBRARY", "SETS", "GAP"]} active="LIBRARY" />
      </div>
      <SectionBrief c={c}
        desc="All your moves in one place, organised and ready to grow."
        stat="29 moves across 8 categories"
      />

      {/* Icon row: filter, view, search — right aligned */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, padding: "4px 14px 6px" }}>
        <FilterIcon color={c.textMuted} />
        <ViewIcon color={c.textMuted} />
        <SearchIcon color={c.textMuted} />
      </div>

      {/* Category tiles */}
      <div style={{ padding: "2px 12px 80px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {Object.entries(CATS).map(([name, color]) => (
          <div key={name} style={{
            background: c.surface, borderRadius: 4, padding: "10px 12px",
            borderLeft: `4px solid ${color}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>{name.toUpperCase()}</span>
              <span style={{ fontSize: 8, color: c.textMuted }}>{MOVE_COUNTS[name]} {MOVE_COUNTS[name] === 1 ? "move" : "moves"}</span>
            </div>
          </div>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── HOME SCREEN ───
function HomeScreen({ c }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <div style={{ padding: "6px 12px 2px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: 1, color: c.text, fontWeight: 700 }}>April 2026</div>
        <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 7,
              color: i === 2 ? "#fff" : c.textMuted,
              background: i === 2 ? c.accent : "transparent", borderRadius: 5, padding: "3px 0",
            }}>
              <div>{d}</div>
              <div style={{ fontSize: 9, fontWeight: 600 }}>{6 + i}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div style={{ background: c.surface, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>MORNING ROUTINE</div>
            <div style={{ fontSize: 7, color: c.textMuted }}>2/4</div>
          </div>
          <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 3 }}>
            {["Stretch 10min", "Toprock drill", "Footwork basics", "Freeze holds"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  border: `1.5px solid ${i < 2 ? c.green : c.border}`,
                  background: i < 2 ? c.green + "20" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, color: c.green,
                }}>{i < 2 ? "✓" : ""}</div>
                <span style={{ fontSize: 8, color: i < 2 ? c.textMuted : c.textSec, textDecoration: i < 2 ? "line-through" : "none" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: c.surface, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>LEARN AIR FLARE</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 2 }}>Master the entry first, then work on rotation.</div>
          <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: c.surfaceAlt }}>
            <div style={{ height: "100%", width: "35%", borderRadius: 2, background: c.accent }} />
          </div>
          <div style={{ fontSize: 7, color: c.textMuted, marginTop: 2 }}>35% · Due Dec 2026</div>
        </div>

        <div style={{ background: c.surface, borderRadius: 4, padding: "10px 12px" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>QUICK IDEA</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 2, fontStyle: "italic" }}>Try combining windmill exit into a knee drop transition.</div>
        </div>
      </div>
      <BottomBar c={c} active="home" />
    </div>
  );
}

// ─── EXPLORE SCREEN ───
function ExploreScreen({ c }) {
  const items = [
    { title: "TECHNICAL", desc: "Pick a move and stack physical modifiers", color: CATS.Footworks },
    { title: "CONCEPTUAL", desc: "Draw inspiration from nature, animals, emotions", color: CATS["Power Moves"] },
    { title: "COLLIDE", desc: "Smash a technical modifier with a conceptual prompt", color: CATS.Toprocks },
    { title: "GROW FROM A MOVE", desc: "Pick a move and explore what it could become", color: CATS.Freezes },
  ];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <div style={{ background: c.header, padding: "0 12px 6px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>EXPLORE</div>
      </div>
      <SectionBrief c={c}
        desc="Constraints breed invention — the weirder the combo, the more original the result."
        stat="4 creative modes to spark new movement ideas"
      />
      <div style={{ padding: "6px 12px 20px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map(item => (
          <div key={item.title} style={{
            background: c.surface, borderRadius: 4, padding: "10px 12px",
            borderLeft: `4px solid ${item.color}`,
          }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: item.color }}>{item.title}</div>
            <div style={{ fontSize: 8, color: c.textSec, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
          </div>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── BATTLE PLAN SCREEN ───
function BattlePlanScreen({ c }) {
  const rounds = ["Prelims", "Top 32", "Top 16", "Top 8", "Semi-Finals", "Finals"];
  const colors = [CATS.Toprocks, CATS.Footworks, CATS.Freezes, CATS["Power Moves"], CATS.Godowns, CATS.Toprocks];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <SubTabs c={c} tabs={["PLAN", "PREP", "FREESTYLE", "RIVALS"]} active="PLAN" />
      <SectionBrief c={c}
        desc="Build your battle strategy round by round. Organise entries and simulate competition pressure."
        stat="6 rounds configured"
      />
      <div style={{ padding: "6px 12px", flex: 1 }}>
        {/* Ghost button */}
        <div style={{
          background: "transparent", border: `1px solid ${c.accent}`, borderRadius: 4,
          padding: "10px", textAlign: "center",
          fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2, color: c.accent, fontWeight: 700,
          marginBottom: 8,
        }}>SIMULATE COMPETITION</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rounds.map((r, i) => (
            <div key={r} style={{
              background: c.surface, borderRadius: 4, padding: "10px 12px",
              borderLeft: `4px solid ${colors[i]}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>{r.toUpperCase()}</span>
                <span style={{ fontSize: 7, color: c.textMuted }}>{i < 3 ? `${i + 1} entries` : "2 entries"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomBar c={c} active="battle" />
    </div>
  );
}

// ─── SETTINGS SCREEN ───
function SettingsScreen({ c }) {
  const Toggle = ({ on }) => (
    <div style={{
      width: 28, height: 16, borderRadius: 8, background: on ? c.accent : c.surfaceHigh,
      position: "relative",
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: 6, background: "#fff",
        position: "absolute", top: 2, left: on ? 14 : 2,
      }} />
    </div>
  );
  const Row = ({ label, sub, toggle, on }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: `1px solid ${c.border}22`,
    }}>
      <div>
        <div style={{ fontSize: 10, color: c.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 7, color: c.textMuted, marginTop: 1 }}>{sub}</div>}
      </div>
      {toggle && <Toggle on={on} />}
    </div>
  );
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <div style={{ background: c.header, padding: "0 12px 6px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>SETTINGS</div>
      </div>
      <div style={{ padding: "4px 12px 20px", flex: 1 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 8, marginBottom: 2 }}>APPEARANCE</div>
        <div style={{ background: c.surface, borderRadius: 4, padding: "2px 12px" }}>
          <Row label="Theme" sub="Dark" />
          <Row label="Text size" sub="Medium" />
          <Row label="Language" sub="English" />
        </div>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>FEATURES</div>
        <div style={{ background: c.surface, borderRadius: 4, padding: "2px 12px" }}>
          <Row label="Show mastery level" toggle on={true} />
          <Row label="Confirm before delete" toggle on={true} />
          <Row label="Show section descriptions" toggle on={true} />
          <Row label="Trust Mode (Freestyle)" toggle on={false} />
        </div>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>DATA</div>
        <div style={{ background: c.surface, borderRadius: 4, padding: "2px 12px" }}>
          <Row label="Backup" sub="Save or restore your data" />
          <Row label="Sign out" />
        </div>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>LEGAL</div>
        <div style={{ background: c.surface, borderRadius: 4, padding: "2px 12px" }}>
          <Row label="Privacy Policy" />
          <Row label="Terms of Service" />
          <Row label="Disclaimers" />
        </div>
      </div>
      <BottomBar c={c} active="home" />
    </div>
  );
}

// ─── SCREENS CONFIG ───
const SCREENS = {
  library: { label: "Library", component: LibraryScreen },
  home: { label: "Home", component: HomeScreen },
  explore: { label: "Explore", component: ExploreScreen },
  plan: { label: "Battle Plan", component: BattlePlanScreen },
  settings: { label: "Settings", component: SettingsScreen },
};

// ─── MAIN APP ───
export default function App() {
  const [mode, setMode] = useState("dark");
  const [screen, setScreen] = useState("library");
  const [showPlus, setShowPlus] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const c = C[mode];
  const ScreenComp = SCREENS[screen].component;

  const handlePlusTap = () => {
    if (screen === "library" || screen === "home") setShowPlus(true);
  };

  const handleCreateTap = () => {
    setShowPlus(false);
    setShowCreate(true);
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", padding: "12px 8px", fontFamily: FONT_BODY }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: 3, margin: 0, color: "#E8E8E8" }}>
          <span style={{ color: "#e53935" }}>MOVES</span>BOOK — Redesign Preview
        </h2>
        <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>Tap the + button to see the new menu flow</div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {["dark", "light"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? "#e53935" : "#1a1a1a", color: mode === m ? "#fff" : "#888",
            border: `1px solid ${mode === m ? "#e53935" : "#333"}`, borderRadius: 6,
            padding: "4px 14px", fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5,
            cursor: "pointer", fontWeight: 600, textTransform: "uppercase",
          }}>{m}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 12, flexWrap: "wrap", maxWidth: 400, margin: "0 auto 12px" }}>
        {Object.entries(SCREENS).map(([id, { label }]) => (
          <button key={id} onClick={() => { setScreen(id); setShowPlus(false); setShowCreate(false); }} style={{
            background: screen === id ? "#e53935" : "#1a1a1a", color: screen === id ? "#fff" : "#888",
            border: `1px solid ${screen === id ? "#e53935" : "#333"}`, borderRadius: 6,
            padding: "4px 10px", fontFamily: FONT_DISPLAY, fontSize: 8, letterSpacing: 1,
            cursor: "pointer", fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {/* Phone mockup */}
      <Phone>
        <div style={{ position: "relative", minHeight: "100%" }}>
          <ScreenComp c={c} onPlusTap={handlePlusTap} />

          {/* + BottomSheet */}
          {showPlus && (
            <BottomSheet c={c} onClose={() => setShowPlus(false)}>
              {[
                { label: "Add a Move", icon: "+" },
                { label: "Add Moves in Bulk", icon: "⇈" },
                { label: "Add Category", icon: "▦" },
                { label: "Create", icon: "✦", accent: true },
              ].map((item, i) => (
                <div key={i}
                  onClick={item.accent ? handleCreateTap : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 4px",
                    borderBottom: i < 3 ? `1px solid ${c.border}22` : "none",
                    cursor: item.accent ? "pointer" : "default",
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: item.accent ? c.accent + "15" : c.surfaceAlt,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, color: item.accent ? c.accent : c.textSec,
                  }}>{item.icon}</div>
                  <span style={{
                    fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 1, fontWeight: 600,
                    color: item.accent ? c.accent : c.text,
                  }}>{item.label}</span>
                </div>
              ))}
            </BottomSheet>
          )}

          {/* Create Modal */}
          {showCreate && <CreateModal c={c} onClose={() => setShowCreate(false)} />}
        </div>
      </Phone>

      {/* Design notes */}
      <div style={{
        maxWidth: 460, margin: "16px auto 0", padding: 14,
        background: "#111", borderRadius: 10,
      }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 2, color: "#E8E8E8", marginBottom: 8 }}>DESIGN CHANGES</div>
        {[
          "Library: zero tool tiles — Explore/R-R-R/Combine/Map moved into + → Create",
          "Bottom bar: text only, no icons, 36px + button",
          "Filter / View / Search: 3 icons, right-aligned, no tiles",
          "Save/Load buttons removed (already in Settings backup)",
          "Bulk import moved into + menu",
          "+ menu: Add Move, Add Bulk, Add Category, Create",
          "Create modal: SectionBrief + 4 tool tiles with color stripes",
        ].map((t, i) => (
          <div key={i} style={{ fontSize: 9, color: "#888", marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid #e53935` }}>{t}</div>
        ))}
      </div>
    </div>
  );
}
