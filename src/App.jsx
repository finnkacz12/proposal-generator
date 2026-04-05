import { useState, useRef, useEffect, useCallback } from "react";

/* ── Metadata ── */
const CAT = {
  GEO: { icon: "🌍", c: "#c45454", l: "Geopolitical" },
  FED: { icon: "🏛", c: "#c9a55c", l: "Fed / Rates" },
  ENERGY: { icon: "⛽", c: "#e08a3a", l: "Energy" },
  DATA: { icon: "📊", c: "#d46a6a", l: "Economic Data" },
  TRADE: { icon: "📦", c: "#9a6ad4", l: "Trade" },
  EARNINGS: { icon: "💼", c: "#4ca868", l: "Earnings" },
  SENTIMENT: { icon: "📈", c: "#5484c4", l: "Sentiment" },
  INFLATION: { icon: "📊", c: "#d46a6a", l: "Inflation" },
  JOBS: { icon: "👷", c: "#6a8fd4", l: "Labor" },
};
const SEV = { high: "#c45454", med: "#c9a55c", medium: "#c9a55c", low: "#5484c4" };
const DIR = {
  up: { sym: "▲", c: "#4ca868", bg: "rgba(76,168,104,0.12)" },
  down: { sym: "▼", c: "#c45454", bg: "rgba(196,84,84,0.12)" },
  flat: { sym: "—", c: "#7a8199", bg: "rgba(122,129,153,0.08)" },
  mixed: { sym: "◆", c: "#c9a55c", bg: "rgba(201,165,92,0.12)" },
};
const MOOD = {
  "risk-off": { c: "#c45454", l: "RISK-OFF" },
  "risk-on": { c: "#4ca868", l: "RISK-ON" },
  mixed: { c: "#c9a55c", l: "MIXED" },
  cautious: { c: "#e08a3a", l: "CAUTIOUS" },
  volatile: { c: "#d46a6a", l: "VOLATILE" },
};
const PLAY_TYPE = {
  long: { c: "#4ca868", l: "LONG", icon: "📈" },
  short: { c: "#c45454", l: "SHORT", icon: "📉" },
  hedge: { c: "#c9a55c", l: "HEDGE", icon: "🛡" },
  avoid: { c: "#7a8199", l: "AVOID", icon: "⚠️" },
};
const DIR_LEVEL = {
  support: "#4ca868", resistance: "#c45454",
  breakout: "#c9a55c", breakdown: "#d46a6a",
};

const mono = "'JetBrains Mono', monospace";
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

/* ── JSON repair ── */
function repairJSON(raw) {
  let s = raw.indexOf("{");
  if (s === -1) return null;
  let txt = raw.slice(s);
  try { return JSON.parse(txt); } catch (e) { /* repair */ }
  txt = txt.replace(/,\s*\{[^}]*$/, "").replace(/,\s*"[^"]*$/, "");
  let ob = 0, os = 0, inStr = false, esc = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "[") os++; if (c === "]") os--;
    if (c === "{") ob++; if (c === "}") ob--;
  }
  if (inStr) txt += '"';
  txt = txt.replace(/,\s*$/, "");
  while (os > 0) { txt += "]"; os--; }
  while (ob > 0) { txt += "}"; ob--; }
  try { return JSON.parse(txt); } catch (e) { return null; }
}

/* ── Play Card ── */
function PlayCard({ play }) {
  const pt = PLAY_TYPE[play.type] || PLAY_TYPE.long;
  return (
    <div style={{
      background: "#0c0e12", border: `1px solid ${pt.c}33`,
      borderRadius: 6, padding: "12px 14px", marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{pt.icon}</span>
        <span style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 1.5,
          textTransform: "uppercase", color: pt.c,
          background: `${pt.c}18`, padding: "2px 6px", borderRadius: 3,
        }}>{pt.l}</span>
        <span style={{
          fontFamily: mono, fontSize: 13, fontWeight: 700,
          color: "#eef0f6", letterSpacing: 0.5,
        }}>{play.instrument}</span>
      </div>
      <p style={{ fontSize: 12, color: "#d4d8e4", lineHeight: 1.5, margin: "0 0 8px" }}>{play.thesis}</p>
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 6,
        background: "rgba(196,84,84,0.06)", borderRadius: 4, padding: "6px 10px",
      }}>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: "#c45454", flexShrink: 0, marginTop: 2 }}>EXIT IF:</span>
        <span style={{ fontSize: 11, color: "#a0a6b8", lineHeight: 1.4 }}>{play.exit_condition}</span>
      </div>
    </div>
  );
}

/* ── Trigger Card ── */
function Trigger({ t, startOpen }) {
  const [open, setOpen] = useState(startOpen);
  const cat = CAT[t.cat] || CAT.GEO;
  const sev = SEV[t.sev] || SEV.med;
  return (
    <div style={{
      background: "#141720", border: "1px solid #252a38", borderRadius: 8,
      marginBottom: 14, borderLeft: `3px solid ${sev}`, overflow: "hidden",
    }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "16px 20px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cat.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: cat.c, background: `${cat.c}18`, padding: "2px 6px", borderRadius: 3 }}>{cat.l}</span>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: sev }}>{t.sev}</span>
            {t.source && <span style={{ fontFamily: mono, fontSize: 9, color: "#4a5068" }}>via {t.source}</span>}
          </div>
          <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: "#eef0f6", lineHeight: 1.3 }}>{t.title}</div>
        </div>
        <span style={{ color: "#7a8199", fontSize: 16, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px 50px" }}>
          <p style={{ fontSize: 13, color: "#d4d8e4", lineHeight: 1.65, marginBottom: 14 }}>{t.detail}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 7, marginBottom: 14 }}>
            {(t.impacts || []).map((imp, i) => {
              const d = DIR[imp.dir] || DIR.flat;
              return (
                <div key={i} style={{ background: d.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${d.c}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#eef0f6" }}>{imp.asset}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: d.c, fontWeight: 700 }}>{d.sym} {imp.dir.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#a0a6b8", lineHeight: 1.45, margin: 0 }}>{imp.why}</p>
                </div>
              );
            })}
          </div>
          {t.cascade && (
            <div style={{ background: "#1a1e2a", borderLeft: "2px solid #c9a55c", padding: "10px 14px", borderRadius: "0 6px 6px 0", marginBottom: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "#c9a55c", display: "block", marginBottom: 3 }}>CASCADE EFFECTS</span>
              <p style={{ fontSize: 12, color: "#d4d8e4", lineHeight: 1.55, margin: 0 }}>{t.cascade}</p>
            </div>
          )}
          {t.plays && t.plays.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#5484c4", display: "block", marginBottom: 8 }}>INVESTMENT IMPLICATIONS</span>
              {t.plays.map((play, i) => <PlayCard key={i} play={play} />)}
            </div>
          )}
          {t.duration && (
            <span style={{ fontFamily: mono, fontSize: 10, color: "#7a8199" }}>
              Duration: <span style={{ color: "#d4d8e4" }}>{t.duration}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Chat Bot ── */
function ChatBot({ briefing }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing,
          messages: newMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}. Try again.` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, messages, loading, briefing]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const starters = [
    "What's the highest conviction trade right now?",
    "How should I position if the war ends this week?",
    "Explain the oil-to-inflation cascade in more detail",
    "What sectors should I avoid and why?",
  ];

  return (
    <div style={{
      background: "#141720", border: "1px solid #252a38",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #252a38",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: "#eef0f6" }}>
            Ask about this briefing
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: "#4a5068", letterSpacing: 0.5 }}>
            Claude has full context of the analysis above
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: "16px 20px", minHeight: 80,
        maxHeight: 400, overflowY: "auto",
      }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: 13, color: "#4a5068", marginBottom: 12 }}>
              Ask follow-up questions about triggers, plays, exit conditions, or anything in the briefing.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {starters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    fontFamily: sans, fontSize: 12,
                    background: "#1a1e2a", color: "#7a8199",
                    border: "1px solid #252a38", borderRadius: 20,
                    padding: "6px 14px", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.color = "#c9a55c"; e.target.style.borderColor = "#c9a55c44"; }}
                  onMouseLeave={e => { e.target.style.color = "#7a8199"; e.target.style.borderColor = "#252a38"; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              background: m.role === "user" ? "#c9a55c18" : "#1a1e2a",
              border: `1px solid ${m.role === "user" ? "#c9a55c33" : "#252a38"}`,
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 16px",
            }}>
              <p style={{
                fontSize: 13, color: "#d4d8e4", lineHeight: 1.6,
                margin: 0, whiteSpace: "pre-wrap",
              }}>{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
            <div style={{
              background: "#1a1e2a", border: "1px solid #252a38",
              borderRadius: "16px 16px 16px 4px", padding: "12px 16px",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#c9a55c",
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid #252a38",
        display: "flex", gap: 10,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a question about the briefing..."
          rows={1}
          style={{
            flex: 1, fontFamily: sans, fontSize: 14,
            background: "#0c0e12", color: "#eef0f6",
            border: "1px solid #252a38", borderRadius: 8,
            padding: "10px 14px", resize: "none",
            outline: "none", lineHeight: 1.5,
          }}
          onFocus={e => e.target.style.borderColor = "#c9a55c44"}
          onBlur={e => e.target.style.borderColor = "#252a38"}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            fontFamily: mono, fontSize: 12,
            background: input.trim() && !loading ? "#c9a55c" : "#252a38",
            color: input.trim() && !loading ? "#0c0e12" : "#4a5068",
            border: "none", borderRadius: 8,
            padding: "10px 18px", cursor: input.trim() && !loading ? "pointer" : "default",
            fontWeight: 600, flexShrink: 0, transition: "all 0.2s",
          }}
        >Send</button>
      </div>

      <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [phase, setPhase] = useState("idle");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef(null);
  const elapsedRef = useRef(null);

  useEffect(() => {
    if (phase === "loading") {
      elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else { clearInterval(elapsedRef.current); }
    return () => clearInterval(elapsedRef.current);
  }, [phase]);

  const cancel = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setPhase(data ? "done" : "idle");
  }, [data]);

  const generate = useCallback(async () => {
    setPhase("loading");
    setElapsed(0);
    setErr("");

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `API returned ${res.status}`);
      }
      const parsed = await res.json();
      if (!parsed.triggers?.length) throw new Error("Empty briefing — try again");
      setData(parsed);
      setPhase("done");
    } catch (ex) {
      clearTimeout(timeout);
      setErr(ex.name === "AbortError" ? "Timed out. Try again." : (ex.message || "Unknown error"));
      setPhase("error");
    }
  }, []);

  const mood = data ? (MOOD[data.mood] || MOOD.mixed) : null;
  const bl = data?.bottom_line;
  const blIsObj = bl && typeof bl === "object";

  return (
    <div style={{
      background: "#0c0e12", minHeight: "100vh", color: "#d4d8e4",
      fontFamily: sans, fontSize: 14, lineHeight: 1.7,
      WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>

        {/* HEADER */}
        <header style={{ padding: "40px 0 32px", borderBottom: "1px solid #252a38" }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#c9a55c", marginBottom: 12 }}>Daily Macro Intelligence Briefing</div>
          <h1 style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, color: "#eef0f6", lineHeight: 1.15, marginBottom: 8 }}>
            {data ? data.headline : "Market Trigger Analysis"}
          </h1>
          <p style={{ fontSize: 14, color: "#7a8199", maxWidth: 620 }}>
            {data ? data.mood_note : "AI-powered briefing with live web search. Maps today's market triggers to specific investment implications, asset plays, and exit conditions."}
          </p>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {data && mood && (
              <>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#7a8199" }}>{data.date}</span>
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: mood.c, background: `${mood.c}18`, padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>{mood.l}</span>
              </>
            )}
            {phase !== "loading" && (
              <button onClick={generate} style={{
                fontFamily: mono, fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
                background: "#c9a55c", color: "#0c0e12", border: "none", borderRadius: 6,
                padding: "10px 18px", cursor: "pointer", fontWeight: 600,
              }}>{data ? "↻ Generate Fresh" : "Generate Live Briefing"}</button>
            )}
            {phase === "loading" && (
              <button onClick={cancel} style={{
                fontFamily: mono, fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
                background: "#252a38", color: "#c45454", border: "1px solid #c4545444",
                borderRadius: 6, padding: "9px 16px", cursor: "pointer",
              }}>Cancel</button>
            )}
          </div>
        </header>

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 16px", border: "2px solid #252a38", borderTopColor: "#c9a55c", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ fontFamily: serif, fontSize: 18, color: "#eef0f6", marginBottom: 6 }}>
              {elapsed < 10 ? "Searching live market sources..." : elapsed < 30 ? "Reading financial news and data..." : elapsed < 60 ? "Analyzing triggers and mapping asset impacts..." : elapsed < 90 ? "Building investment thesis and exit conditions..." : "Finalizing briefing..."}
            </p>
            <p style={{ fontFamily: mono, fontSize: 11, color: "#4a5068" }}>{elapsed}s — live search typically takes 45-90s</p>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ background: "rgba(196,84,84,0.08)", border: "1px solid #c4545433", borderRadius: 8, padding: 24, margin: "32px 0", textAlign: "center" }}>
            <p style={{ color: "#c45454", fontWeight: 600, marginBottom: 6 }}>Briefing generation failed</p>
            <p style={{ color: "#7a8199", fontSize: 13, marginBottom: 16, maxWidth: 500, margin: "0 auto 16px", lineHeight: 1.5, wordBreak: "break-word" }}>{err}</p>
            <button onClick={generate} style={{ fontFamily: mono, fontSize: 11, background: "#c45454", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}>Try Again</button>
          </div>
        )}

        {/* IDLE */}
        {phase === "idle" && !data && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontFamily: serif, fontSize: 56, color: "#1a1e2a", marginBottom: 14 }}>⬡</div>
            <p style={{ fontFamily: serif, fontSize: 20, color: "#7a8199", marginBottom: 6 }}>Ready to generate today's briefing</p>
            <p style={{ fontSize: 13, color: "#4a5068", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
              Uses Claude + live web search to find today's market triggers, map them to asset classes,
              and generate specific investment plays with entry rationale and exit conditions. Takes 45-90 seconds.
            </p>
          </div>
        )}

        {/* BRIEFING */}
        {phase === "done" && data && (
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {/* Triggers */}
            <section style={{ padding: "32px 0" }}>
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: "#eef0f6", marginBottom: 4 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#c9a55c", marginRight: 8, verticalAlign: 2 }}>01</span>
                Triggers & Investment Plays
              </h2>
              <p style={{ fontFamily: mono, fontSize: 11, color: "#4a5068", marginBottom: 16 }}>
                Each trigger includes asset impacts, specific instruments, and exit conditions
              </p>
              {(data.triggers || []).map((t, i) => <Trigger key={i} t={t} startOpen={i < 3} />)}
            </section>

            {/* Key Levels */}
            {data.levels?.length > 0 && (
              <section style={{ padding: "28px 0", borderTop: "1px solid #252a38" }}>
                <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: "#eef0f6", marginBottom: 14 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: "#c9a55c", marginRight: 8, verticalAlign: 2 }}>02</span>
                  Key Levels
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                  {data.levels.map((lv, i) => {
                    const dc = DIR_LEVEL[lv.direction] || "#7a8199";
                    return (
                      <div key={i} style={{ background: "#141720", border: "1px solid #252a38", borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#c9a55c" }}>{lv.asset}</span>
                          {lv.direction && <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: dc, background: `${dc}18`, padding: "2px 6px", borderRadius: 3 }}>{lv.direction}</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                          {lv.current && <span style={{ fontFamily: mono, fontSize: 12, color: "#7a8199" }}>{lv.current}</span>}
                          <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#eef0f6" }}>{lv.level}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#7a8199", lineHeight: 1.4, margin: 0 }}>{lv.note}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sector Snapshot */}
            {data.sector_snapshot && (
              <section style={{ padding: "28px 0", borderTop: "1px solid #252a38" }}>
                <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: "#eef0f6", marginBottom: 14 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: "#c9a55c", marginRight: 8, verticalAlign: 2 }}>03</span>
                  Sector Rotation
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ background: "#141720", border: "1px solid #252a38", borderRadius: 8, padding: "14px 16px" }}>
                    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#4ca868", display: "block", marginBottom: 8 }}>Outperforming</span>
                    {(data.sector_snapshot.winners || []).map((w, i) => (
                      <div key={i} style={{ fontFamily: mono, fontSize: 12, color: "#4ca868", marginBottom: 4 }}>▲ {w}</div>
                    ))}
                  </div>
                  <div style={{ background: "#141720", border: "1px solid #252a38", borderRadius: 8, padding: "14px 16px" }}>
                    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#c45454", display: "block", marginBottom: 8 }}>Underperforming</span>
                    {(data.sector_snapshot.losers || []).map((l, i) => (
                      <div key={i} style={{ fontFamily: mono, fontSize: 12, color: "#c45454", marginBottom: 4 }}>▼ {l}</div>
                    ))}
                  </div>
                </div>
                {data.sector_snapshot.rotation_summary && (
                  <p style={{ fontSize: 13, color: "#d4d8e4", lineHeight: 1.6 }}>{data.sector_snapshot.rotation_summary}</p>
                )}
              </section>
            )}

            {/* Bottom Line */}
            {bl && (
              <section style={{ padding: "28px 0", borderTop: "1px solid #252a38" }}>
                <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: "#eef0f6", marginBottom: 14 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: "#c9a55c", marginRight: 8, verticalAlign: 2 }}>04</span>
                  The Bottom Line
                </h2>
                <div style={{ background: "#1a1e2a", borderLeft: "3px solid #c9a55c", padding: "20px 24px", borderRadius: "0 8px 8px 0", marginBottom: 14 }}>
                  <p style={{ fontFamily: serif, fontSize: 18, lineHeight: 1.55, color: "#eef0f6", margin: 0, fontStyle: "italic" }}>{blIsObj ? bl.summary : bl}</p>
                </div>
                {blIsObj && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {bl.highest_conviction && (
                      <div style={{ background: "#141720", border: "1px solid #4ca86833", borderRadius: 8, padding: "14px 16px" }}>
                        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "#4ca868", display: "block", marginBottom: 6 }}>Highest Conviction</span>
                        <p style={{ fontSize: 12, color: "#d4d8e4", lineHeight: 1.5, margin: 0 }}>{bl.highest_conviction}</p>
                      </div>
                    )}
                    {bl.biggest_risk && (
                      <div style={{ background: "#141720", border: "1px solid #c4545433", borderRadius: 8, padding: "14px 16px" }}>
                        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "#c45454", display: "block", marginBottom: 6 }}>Biggest Risk</span>
                        <p style={{ fontSize: 12, color: "#d4d8e4", lineHeight: 1.5, margin: 0 }}>{bl.biggest_risk}</p>
                      </div>
                    )}
                    {bl.watch_next && (
                      <div style={{ background: "#141720", border: "1px solid #5484c433", borderRadius: 8, padding: "14px 16px" }}>
                        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "#5484c4", display: "block", marginBottom: 6 }}>Watch Next</span>
                        <p style={{ fontSize: 12, color: "#d4d8e4", lineHeight: 1.5, margin: 0 }}>{bl.watch_next}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* CHAT BOT */}
            <section style={{ padding: "28px 0", borderTop: "1px solid #252a38" }}>
              <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: "#eef0f6", marginBottom: 14 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#c9a55c", marginRight: 8, verticalAlign: 2 }}>05</span>
                Ask Follow-Up Questions
              </h2>
              <ChatBot briefing={data} />
            </section>

            {/* Disclaimer */}
            <section style={{ padding: "20px 0 36px", borderTop: "1px solid #252a38" }}>
              <div style={{ background: "#141720", border: "1px solid #c9a55c33", borderRadius: 8, padding: "14px 18px" }}>
                <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: "#c45454", display: "block", marginBottom: 4 }}>Disclaimer</span>
                <p style={{ fontSize: 11, color: "#7a8199", lineHeight: 1.45, margin: 0 }}>
                  AI-generated research for educational purposes only. This is NOT financial advice and does NOT
                  recommend any specific securities, strategies, or courses of action. Investment plays and exit
                  conditions are analytical frameworks, not recommendations. All investments carry risk including
                  loss of principal. Consult a qualified financial advisor before making any investment decisions.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
