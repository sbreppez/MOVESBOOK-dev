import { useState } from "react";

const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const FONT_BODY = "'Barlow', sans-serif";

const THEME = {
  dark: {
    bg: "#0A0A0A", surface: "#1C1C1E", surfaceAlt: "#2C2C2E", surfaceHigh: "#3A3A3C",
    border: "#3A3A3C", borderLight: "#2C2C2E",
    text: "#E8E8E8", textSec: "#9E9E9E", textMuted: "#6E6E6E",
    header: "#0A0A0A", headerText: "#E8E8E8", accent: "#e53935",
    green: "#1db954", yellow: "#ffa726", blue: "#42a5f5", red: "#e53935",
  },
  light: {
    bg: "#F2F2F7", surface: "#FFFFFF", surfaceAlt: "#F2F2F7", surfaceHigh: "#E5E5EA",
    border: "#D1D1D6", borderLight: "#E5E5EA",
    text: "#1C1C1E", textSec: "#48484A", textMuted: "#8E8E93",
    header: "#FFFFFF", headerText: "#1C1C1E", accent: "#cf0000",
    green: "#2e7d32", yellow: "#f57f17", blue: "#1565c0", red: "#cf0000",
  },
};

const CATS = {
  Toprocks: "#C4453E", Godowns: "#8B6AAE", Footworks: "#4A90C4",
  "Power Moves": "#D4943A", Freezes: "#3D9E72", Transitions: "#D46A52",
  Burns: "#8A6B54", Blowups: "#3A9E9E",
};
const MOVE_COUNTS = { Toprocks: 4, Godowns: 3, Footworks: 18, "Power Moves": 1, Freezes: 1, Transitions: 1, Burns: 0, Blowups: 1 };

const DOMAINS = {
  musicality: "#3A9E9E", performance: "#C4453E", technique: "#4A90C4",
  variety: "#D4943A", creativity: "#8B6AAE", personality: "#3D9E72",
};

function Phone({ children, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {label && <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase" }}>{label}</span>}
      <div style={{ width: 240, height: 480, borderRadius: 22, overflow: "hidden", border: "2px solid #333", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Header({ c, title }) {
  return (
    <div style={{ background: c.header, padding: "8px 12px 6px", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: 3 }}>
          <span style={{ color: c.accent, fontWeight: 700 }}>MOVES</span>
          <span style={{ color: c.headerText, fontWeight: 700 }}>BOOK</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: c.surfaceHigh }} />
          <div style={{ width: 20, height: 20, borderRadius: 8, background: c.surfaceAlt, border: `1px solid ${c.border}` }} />
        </div>
      </div>
      {title && <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text, marginTop: 4 }}>{title}</div>}
    </div>
  );
}

function SubTabs({ c, tabs, active }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "0 12px 6px", background: c.header }}>
      {tabs.map(t => (
        <span key={t} style={{
          fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
          color: t === active ? c.text : c.textMuted,
          borderBottom: t === active ? `2px solid ${c.accent}` : "2px solid transparent",
          paddingBottom: 3,
        }}>{t}</span>
      ))}
    </div>
  );
}

function BottomBar({ c, active }) {
  const tabs = [
    { id: "home", label: "HOME" }, { id: "moves", label: "MOVES" },
    { id: "+", label: "+" },
    { id: "battle", label: "BATTLE" }, { id: "reflect", label: "REFLECT" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "6px 0 8px", background: c.header,
      position: "sticky", bottom: 0, zIndex: 10,
    }}>
      {tabs.map(t => t.id === "+" ? (
        <div key="+" style={{
          width: 28, height: 28, borderRadius: 14, background: c.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1,
        }}>+</div>
      ) : (
        <div key={t.id} style={{
          fontFamily: FONT_DISPLAY, fontSize: 7, letterSpacing: 1, color: active === t.id ? c.text : c.textMuted,
          textAlign: "center",
          borderBottom: active === t.id ? `2px solid ${c.accent}` : "2px solid transparent",
          paddingBottom: 2,
        }}>{t.label}</div>
      ))}
    </div>
  );
}

function Card({ c, children, stripe, style: s }) {
  return (
    <div style={{
      background: c.surface, borderRadius: 4, padding: "10px 12px",
      borderLeft: stripe ? `4px solid ${stripe}` : undefined,
      ...s,
    }}>{children}</div>
  );
}

function SectionBrief({ c, desc, stat, show }) {
  if (!show) return null;
  return (
    <div style={{ padding: "8px 12px 4px" }}>
      <div style={{ fontSize: 8, color: c.textSec, lineHeight: 1.5 }}>{desc}</div>
      {stat && <div style={{ fontSize: 7, color: c.textMuted, fontStyle: "italic", marginTop: 3 }}>{stat}</div>}
    </div>
  );
}

// ─── HOME ───
function HomeScreen({ c }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <div style={{ padding: "8px 12px 2px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: 1, color: c.text, fontWeight: 700 }}>April 2026</div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 8, color: i === 2 ? "#fff" : c.textMuted,
              background: i === 2 ? c.accent : "transparent", borderRadius: 6, padding: "4px 0",
            }}>
              <div>{d}</div>
              <div style={{ fontSize: 10, fontWeight: 600 }}>{6 + i}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <Card c={c}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>MORNING ROUTINE</div>
            <div style={{ fontSize: 8, color: c.textMuted }}>2/4</div>
          </div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {["Stretch 10min", "Toprock drill", "Footwork basics", "Freeze holds"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px solid ${i < 2 ? c.green : c.border}`, background: i < 2 ? c.green + "20" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, lineHeight: 1, color: c.green }}>{i < 2 ? "✓" : ""}</div>
                <span style={{ fontSize: 9, color: i < 2 ? c.textMuted : c.textSec, textDecoration: i < 2 ? "line-through" : "none" }}>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card c={c}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>LEARN AIR FLARE BY DECEMBER</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 3 }}>Master the entry first, then work on rotation speed.</div>
          <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: c.surfaceAlt }}>
            <div style={{ height: "100%", width: "35%", borderRadius: 2, background: c.accent }} />
          </div>
          <div style={{ fontSize: 7, color: c.textMuted, marginTop: 3 }}>35% · Due Dec 2026</div>
        </Card>

        <Card c={c}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>DAILY STRETCHING</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 3 }}>15 min minimum, focus on hip flexors</div>
          <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
            {[1,1,1,0,1,0,0].map((d, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: d ? c.green : c.surfaceAlt }} />
            ))}
          </div>
        </Card>

        <Card c={c}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>QUICK IDEA</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 3, fontStyle: "italic" }}>Try combining windmill exit into a knee drop transition — could work as a signature combo.</div>
        </Card>
      </div>
      <BottomBar c={c} active="home" />
    </div>
  );
}

// ─── MOVES > LIBRARY ───
function LibraryScreen({ c, showDesc }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <div style={{ background: c.header, padding: "0 12px 2px" }}>
        <SubTabs c={c} tabs={["LIBRARY", "SETS", "GAP"]} active="LIBRARY" />
      </div>
      <SectionBrief c={c} show={showDesc}
        desc="All your moves in one place, organised and ready to grow."
        stat="29 moves across 8 categories"
      />

      <div style={{ display: "flex", gap: 6, padding: "8px 12px" }}>
        {["EXPLORE", "R/R/R", "COMBINE", "MAP"].map(t => (
          <div key={t} style={{
            background: c.surface, borderRadius: 4, padding: "6px 8px",
            fontFamily: FONT_DISPLAY, fontSize: 7, letterSpacing: 1, color: c.textSec,
            textAlign: "center", flex: 1,
          }}>{t}</div>
        ))}
      </div>

      <div style={{ padding: "6px 12px 20px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {Object.entries(CATS).map(([name, color]) => (
          <Card key={name} c={c} stripe={color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>{name.toUpperCase()}</span>
              <span style={{ fontSize: 8, color: c.textMuted }}>{MOVE_COUNTS[name]} {MOVE_COUNTS[name] === 1 ? "move" : "moves"}</span>
            </div>
          </Card>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── MOVES > EXPLORE ───
function ExploreScreen({ c, showDesc }) {
  const items = [
    { title: "TECHNICAL", desc: "Pick a move and stack physical modifiers", color: CATS.Footworks },
    { title: "CONCEPTUAL", desc: "Draw inspiration from nature, animals, emotions", color: CATS["Power Moves"] },
    { title: "COLLIDE", desc: "Smash a technical modifier with a conceptual prompt", color: CATS.Toprocks },
    { title: "GROW FROM A MOVE", desc: "Pick a move and explore what it could become", color: CATS.Freezes },
  ];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} title="EXPLORE" />
      <SectionBrief c={c} show={showDesc}
        desc="Constraints breed invention — the weirder the combo, the more original the result."
        stat="4 creative modes to spark new movement ideas"
      />
      <div style={{ padding: "6px 12px 20px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map(item => (
          <Card key={item.title} c={c} stripe={item.color}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: item.color }}>{item.title}</div>
            <div style={{ fontSize: 8, color: c.textSec, marginTop: 3, lineHeight: 1.4 }}>{item.desc}</div>
          </Card>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── MOVES > R/R/R ───
function RRRScreen({ c, showDesc }) {
  const items = [
    { title: "RESTORE", desc: "Polish, recover, rebuild your foundation.", color: CATS.Footworks },
    { title: "REMIX", desc: "Modify what you know. New speed, direction, entry or exit.", color: CATS["Power Moves"] },
    { title: "REBUILD", desc: "Create something new. Reconfigure elements into fresh vocabulary.", color: CATS.Toprocks },
  ];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} title="RESTORE / REMIX / REBUILD" />
      <SectionBrief c={c} show={showDesc}
        desc="Three ways to evolve your existing vocabulary. Pick a move and choose your path."
        stat="Select a move to begin"
      />
      <div style={{ padding: "6px 12px 20px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map(item => (
          <Card key={item.title} c={c} stripe={item.color}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: item.color }}>{item.title}</div>
            <div style={{ fontSize: 9, color: c.textSec, marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
          </Card>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── MOVES > COMBINE ───
function CombineScreen({ c, showDesc }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} title="COMBINE" />
      <SectionBrief c={c} show={showDesc}
        desc="Spin random move combinations from your vocabulary. Discover unexpected connections."
        stat="29 moves available"
      />
      <div style={{ padding: "12px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: 1.5, fontWeight: 700, color: CATS["Power Moves"],
          }}>CYPHER CAT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: c.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: c.textSec }}>−</div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: c.text, fontWeight: 700 }}>5</span>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: c.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: c.textSec }}>+</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${c.accent}`, textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1, color: c.accent }}>Random</div>
          <div style={{ flex: 1, padding: "8px", borderRadius: 8, background: c.surfaceAlt, textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1, color: c.textSec }}>Branch Drill</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: c.surfaceAlt, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, color: c.textMuted }}>⚄</span>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 2, color: c.text, fontWeight: 700 }}>SPIN</div>
          <div style={{ fontSize: 8, color: c.textMuted, marginTop: 2 }}>29 moves</div>
        </div>
      </div>

      <div style={{ padding: "12px" }}>
        <div style={{
          background: CATS["Power Moves"], borderRadius: 8, padding: "12px",
          textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 2,
          color: "#fff", fontWeight: 700,
        }}>SPIN</div>
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── MOVES > MAP ───
function MapScreen({ c, showDesc }) {
  const items = [
    { title: "WITHIN A CATEGORY", desc: "Pair moves from the same category", sub: "How do your moves flow into each other?", color: CATS.Footworks },
    { title: "BETWEEN CATEGORIES", desc: "Rows from one category, columns from another", sub: "Where do your categories connect?", color: CATS["Power Moves"] },
    { title: "CUSTOM PICK", desc: "Hand-select 2-8 moves from any category", sub: "Test specific combinations you're curious about", color: CATS.Godowns },
  ];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} title="MAP" />
      <SectionBrief c={c} show={showDesc}
        desc="Map how your moves connect. Every explored pairing reveals your personal movement vocabulary."
        stat="0 of 812 connections explored (0%) · Tap for a random unexplored pairing"
      />
      <div style={{ padding: "6px 12px 20px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map(item => (
          <Card key={item.title} c={c} stripe={item.color}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>{item.title}</div>
            <div style={{ fontSize: 8, color: c.textSec, marginTop: 2 }}>{item.desc}</div>
            <div style={{ fontSize: 7, color: c.textMuted, marginTop: 2, fontStyle: "italic" }}>{item.sub}</div>
          </Card>
        ))}
      </div>
      <BottomBar c={c} active="moves" />
    </div>
  );
}

// ─── BATTLE > PLAN ───
function BattlePlanScreen({ c, showDesc }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <SubTabs c={c} tabs={["PLAN", "PREP", "FREESTYLE", "RIVALS"]} active="PLAN" />
      <SectionBrief c={c} show={showDesc}
        desc="Build your battle strategy round by round. Organise entries and simulate competition pressure."
        stat="6 rounds configured"
      />
      <div style={{ padding: "6px 12px", flex: 1 }}>
        <div style={{
          background: "transparent", border: `1px solid ${c.accent}`, borderRadius: 8, padding: "10px", textAlign: "center",
          fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 2, color: c.accent, fontWeight: 700, marginBottom: 12,
        }}>SIMULATE COMPETITION</div>

        {["Prelims", "Top 32", "Top 16", "Top 8", "Semi-Finals", "Finals"].map((r, i) => {
          const colors = [CATS.Toprocks, CATS.Footworks, CATS.Freezes, CATS["Power Moves"], CATS.Godowns, CATS.Toprocks];
          return (
            <Card key={r} c={c} stripe={colors[i]} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>{r.toUpperCase()}</span>
                <span style={{ fontSize: 7, color: c.textMuted }}>{i < 3 ? `${i + 1} entries` : "2 entries"}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <BottomBar c={c} active="battle" />
    </div>
  );
}

// ─── BATTLE > PREP ───
function BattlePrepScreen({ c, showDesc }) {
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <SubTabs c={c} tabs={["PLAN", "PREP", "FREESTYLE", "RIVALS"]} active="PREP" />
      <SectionBrief c={c} show={showDesc}
        desc="Track upcoming battles, set countdowns, and review your battle history."
        stat="2 upcoming events"
      />
      <div style={{ padding: "6px 12px", flex: 1 }}>
        <Card c={c} style={{ marginBottom: 5 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>KING OF THE FLOOR</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 2 }}>Melbourne · May 15, 2026</div>
          <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ background: c.accent + "30", borderRadius: 4, padding: "2px 6px", fontSize: 7, color: c.accent, fontWeight: 600 }}>37 DAYS</div>
            <span style={{ fontSize: 7, color: c.textMuted }}>until event</span>
          </div>
        </Card>
        <Card c={c} style={{ marginBottom: 5 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, color: c.text }}>OUTBREAK</div>
          <div style={{ fontSize: 8, color: c.textSec, marginTop: 2 }}>Sydney · July 20, 2026</div>
          <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ background: c.surfaceAlt, borderRadius: 4, padding: "2px 6px", fontSize: 7, color: c.textMuted, fontWeight: 600 }}>103 DAYS</div>
            <span style={{ fontSize: 7, color: c.textMuted }}>until event</span>
          </div>
        </Card>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 6 }}>BATTLE HISTORY</div>
        <Card c={c}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: c.text, fontWeight: 600 }}>Floor Wars 2025</span>
            <span style={{ fontSize: 7, color: c.textMuted }}>Dec 2025</span>
          </div>
          <div style={{ fontSize: 7, color: c.textSec, marginTop: 2 }}>Top 16 · Lost to B-Boy Storm</div>
        </Card>
      </div>
      <BottomBar c={c} active="battle" />
    </div>
  );
}

// ─── REFLECT > CALENDAR ───
function CalendarScreen({ c, showDesc }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const activeDays = [1,3,5,6,7,8,12,14,15,19,21,22,26,28];
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <SubTabs c={c} tabs={["CALENDAR", "STANCE", "GOALS", "NOTES"]} active="CALENDAR" />
      <SectionBrief c={c} show={showDesc}
        desc="Your training timeline. Tap any day to see sessions, journal entries, and body logs."
        stat="14 active days this month"
      />
      <div style={{ padding: "10px 12px", flex: 1 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 1, color: c.text, fontWeight: 700, marginBottom: 8 }}>April 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={d+i} style={{ textAlign: "center", fontSize: 7, color: c.textMuted, paddingBottom: 3 }}>{d}</div>
          ))}
          {/* offset for April 2026 starting Wednesday */}
          {[null, null].map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => (
            <div key={d} style={{
              textAlign: "center", fontSize: 8, padding: "4px 0", borderRadius: 4,
              color: d === 8 ? "#fff" : activeDays.includes(d) ? c.text : c.textMuted,
              background: d === 8 ? c.accent : activeDays.includes(d) ? c.surfaceAlt : "transparent",
              fontWeight: activeDays.includes(d) ? 600 : 400,
            }}>{d}</div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginBottom: 6 }}>TODAY</div>
          <Card c={c} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: c.text, fontWeight: 600 }}>Footwork session</span>
              <span style={{ fontSize: 7, color: c.textMuted }}>45 min</span>
            </div>
            <div style={{ fontSize: 7, color: c.textSec, marginTop: 2 }}>Focused on 6-step variations and flow transitions</div>
          </Card>
          <Card c={c}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: c.text, fontWeight: 600 }}>Flash Cards</span>
              <span style={{ fontSize: 7, color: c.textMuted }}>12 min</span>
            </div>
            <div style={{ fontSize: 7, color: c.textSec, marginTop: 2 }}>Power Moves set · 8/10 correct</div>
          </Card>
        </div>
      </div>
      <BottomBar c={c} active="reflect" />
    </div>
  );
}

// ─── REFLECT > STANCE ───
function StanceScreen({ c, showDesc }) {
  const domains = Object.entries(DOMAINS);
  return (
    <div style={{ background: c.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Header c={c} />
      <SubTabs c={c} tabs={["CALENDAR", "STANCE", "GOALS", "NOTES"]} active="STANCE" />
      <SectionBrief c={c} show={showDesc}
        desc="Your breaking DNA across six domains. Update periodically to track your evolution."
        stat="Last updated: 3 days ago"
      />
      <div style={{ padding: "10px 12px", flex: 1 }}>
        {/* Radar placeholder */}
        <div style={{
          width: 120, height: 120, borderRadius: 60, margin: "0 auto 12px",
          border: `1px solid ${c.border}`, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <polygon points="50,15 80,35 75,70 25,70 20,35" fill={c.accent + "20"} stroke={c.accent} strokeWidth="1.5" />
            <polygon points="50,25 70,38 67,62 33,62 30,38" fill="none" stroke={c.border} strokeWidth="0.5" />
          </svg>
        </div>

        {/* Domain rows */}
        {domains.map(([name, color]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1, color: c.text, textTransform: "uppercase", flex: 1 }}>{name}</span>
            <div style={{ width: 60, height: 4, borderRadius: 2, background: c.surfaceAlt }}>
              <div style={{ height: "100%", borderRadius: 2, background: color, width: `${30 + Math.random() * 50}%` }} />
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <div style={{
            background: c.accent, borderRadius: 8, padding: "8px", textAlign: "center",
            fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 2, color: "#fff", fontWeight: 700,
          }}>UPDATE MY STANCE</div>
        </div>
      </div>
      <BottomBar c={c} active="reflect" />
    </div>
  );
}

// ─── SETTINGS ───
function SettingsScreen({ c, showDesc }) {
  const Toggle = ({ on }) => (
    <div style={{
      width: 28, height: 16, borderRadius: 8, background: on ? c.accent : c.surfaceHigh,
      position: "relative", transition: "background 0.2s",
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: 6, background: "#fff", position: "absolute",
        top: 2, left: on ? 14 : 2, transition: "left 0.2s",
      }} />
    </div>
  );

  const Row = ({ label, sub, toggle, on }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: `1px solid ${c.borderLight}`,
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
      <Header c={c} title="SETTINGS" />
      <div style={{ padding: "6px 12px 20px", flex: 1 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 8, marginBottom: 2 }}>APPEARANCE</div>
        <Card c={c} style={{ padding: "2px 12px" }}>
          <Row label="Theme" sub="Dark" />
          <Row label="Text size" sub="Medium" />
          <Row label="Language" sub="English" />
        </Card>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>FEATURES</div>
        <Card c={c} style={{ padding: "2px 12px" }}>
          <Row label="Show mastery level" toggle on={true} />
          <Row label="Confirm before delete" toggle on={true} />
          <Row label="Show section descriptions" toggle on={showDesc} />
          <Row label="Trust Mode (Freestyle)" toggle on={false} />
        </Card>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>DATA</div>
        <Card c={c} style={{ padding: "2px 12px" }}>
          <Row label="Backup" sub="Save or restore your data" />
          <Row label="Sign out" sub="" />
        </Card>

        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: c.textMuted, marginTop: 12, marginBottom: 2 }}>LEGAL</div>
        <Card c={c} style={{ padding: "2px 12px" }}>
          <Row label="Privacy Policy" />
          <Row label="Terms of Service" />
          <Row label="Disclaimers" />
        </Card>
      </div>
      <BottomBar c={c} active="home" />
    </div>
  );
}

// ─── MAIN ───
const SCREENS = {
  home: { label: "Home", component: HomeScreen },
  library: { label: "Library", component: LibraryScreen },
  explore: { label: "Explore", component: ExploreScreen },
  rrr: { label: "R/R/R", component: RRRScreen },
  combine: { label: "Combine", component: CombineScreen },
  map: { label: "Map", component: MapScreen },
  plan: { label: "Battle Plan", component: BattlePlanScreen },
  prep: { label: "Battle Prep", component: BattlePrepScreen },
  calendar: { label: "Calendar", component: CalendarScreen },
  stance: { label: "Stance", component: StanceScreen },
  settings: { label: "Settings", component: SettingsScreen },
};

export default function App() {
  const [mode, setMode] = useState("dark");
  const [screen, setScreen] = useState("home");
  const [showDesc, setShowDesc] = useState(true);
  const c = THEME[mode];
  const Screen = SCREENS[screen].component;
  const containerBg = mode === "dark" ? "#000" : "#D8D8D8";

  return (
    <div style={{ background: containerBg, minHeight: "100vh", padding: "12px 8px", fontFamily: FONT_BODY }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, letterSpacing: 3, margin: 0, color: mode === "dark" ? "#E8E8E8" : "#1C1C1E" }}>
          <span style={{ color: "#e53935" }}>MOVES</span>BOOK — Theme Preview
        </h2>
      </div>

      {/* Theme toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
        {["dark", "light"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: mode === m ? "#e53935" : (mode === "dark" ? "#1a1a1a" : "#fff"),
            color: mode === m ? "#fff" : (mode === "dark" ? "#ccc" : "#333"),
            border: `1px solid ${mode === m ? "#e53935" : (mode === "dark" ? "#333" : "#ccc")}`,
            borderRadius: 8, padding: "5px 16px", fontFamily: FONT_DISPLAY, fontSize: 10,
            letterSpacing: 1.5, cursor: "pointer", fontWeight: 600, textTransform: "uppercase",
          }}>{m}</button>
        ))}
        <button onClick={() => setShowDesc(!showDesc)} style={{
          background: showDesc ? "#e53935" : (mode === "dark" ? "#1a1a1a" : "#fff"),
          color: showDesc ? "#fff" : (mode === "dark" ? "#ccc" : "#333"),
          border: `1px solid ${showDesc ? "#e53935" : (mode === "dark" ? "#333" : "#ccc")}`,
          borderRadius: 8, padding: "5px 16px", fontFamily: FONT_DISPLAY, fontSize: 10,
          letterSpacing: 1.5, cursor: "pointer", fontWeight: 600,
        }}>{showDesc ? "DESCS ON" : "DESCS OFF"}</button>
      </div>

      {/* Screen nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 12, flexWrap: "wrap", maxWidth: 500, margin: "0 auto 12px" }}>
        {Object.entries(SCREENS).map(([id, { label }]) => (
          <button key={id} onClick={() => setScreen(id)} style={{
            background: screen === id ? "#e53935" : (mode === "dark" ? "#1a1a1a" : "#fff"),
            color: screen === id ? "#fff" : (mode === "dark" ? "#888" : "#666"),
            border: `1px solid ${screen === id ? "#e53935" : (mode === "dark" ? "#333" : "#ccc")}`,
            borderRadius: 6, padding: "4px 10px", fontFamily: FONT_DISPLAY, fontSize: 8,
            letterSpacing: 1, cursor: "pointer", fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {/* Phone */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Phone>
          <Screen c={c} showDesc={showDesc} />
        </Phone>
      </div>

      {/* Color reference */}
      <div style={{ maxWidth: 460, margin: "16px auto 0", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: "#888", marginBottom: 4 }}>SURFACES</div>
          <div style={{ display: "flex", gap: 3 }}>
            {[c.bg, c.surface, c.surfaceAlt, c.surfaceHigh].map((col, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: col, border: "1px solid #333" }} />
                <span style={{ fontSize: 6, color: "#888", fontFamily: "monospace" }}>{col}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: "#888", marginBottom: 4 }}>TEXT</div>
          <div style={{ display: "flex", gap: 3 }}>
            {[c.text, c.textSec, c.textMuted].map((col, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: col, border: "1px solid #333" }} />
                <span style={{ fontSize: 6, color: "#888", fontFamily: "monospace" }}>{col}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 9, letterSpacing: 1.5, color: "#888", marginBottom: 4 }}>CATEGORIES</div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", maxWidth: 180 }}>
            {Object.entries(CATS).map(([name, col]) => (
              <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: col }} />
                <span style={{ fontSize: 5, color: "#888" }}>{name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
