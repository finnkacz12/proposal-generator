import { useState, useRef, useCallback, useEffect } from "react";

const SYSTEM_PROMPT = `You are a senior solutions architect at a software development agency. Your job is to analyze sales call transcripts and supplementary materials (PRDs, wireframe descriptions, presentations) and produce a structured proposal framework with hour estimates.

OUTPUT FORMAT — follow this EXACTLY:

1. Start with a "User Types" section: List each user type with a short parenthetical description as bullet points.

2. A "Login" section: List login fields/flows as bullet points. Be specific about the auth method discussed (e.g., Discord OAuth, email/password, SSO) and include what happens on failure or if the user isn't authorized.

3. A "Signup & Onboarding" section: List signup fields and the full onboarding flow as bullet points. Include where payment happens, what triggers access, and any external systems involved in the signup chain.

4. For EACH user type, first output the user type as a GROUP HEADER on its own line using this exact format:
   ==[User Type Name] ([short description])==
   
   Then underneath that group header, list each feature area as a SUBSECTION TITLE on its own line (do NOT repeat the user type name in subsection titles), followed by bullet points.
   
   IMPORTANT: Always end each user type's sections with "Account Management" as the last subsection.
   Order features logically: feed/dashboard first, then core features, then account management last.

5. End with a group header:
   ==Additional Capabilities & Integrations==
   Then list cross-cutting concerns (backend architecture, chat, payments, notifications, analytics, etc.) as subsections with bullets.

DETAIL & DEPTH GUIDANCE:
- Break features into granular subsections. Each subsection should have 2-5 bullet points.
- For each feature, think about: what does the user SEE, what can they DO, what are the RULES/CONSTRAINTS, and what EDGE CASES matter.
- Call out specific integrations, APIs, or third-party tools mentioned in the transcript.
- When content has access tiers or role-based visibility, spell out what each tier can and cannot see.
- For admin features, be specific about what they can configure, toggle, or override.
- Include data relationships where relevant.
- If the transcript mentions migration from an existing platform, include a subsection about what gets migrated.

SUBPOINT RULE — CRITICAL:
When a feature area requires more than 5 bullet points to explain properly, you MUST split it. Keep the main subsection title with the 2-3 most important/core bullets. Then create exactly ONE sub-section underneath with a meaningful descriptive title that covers the remaining detail bullets. The sub-section title should be indented with two spaces and NOT be a generic name like "Additional Details" — it should describe what those bullets cover specifically.

Example of CORRECT splitting:
Checkpoint Management [EST:10:14:20]
- Admins can create, edit, and deactivate checkpoints from a management interface
- Checkpoint creation form captures GPS coordinates, region/state, description, difficulty level, and associated sponsor
- Admins can bulk-upload checkpoints via CSV or similar format (assumed)

  Checkpoint Visibility & Preview [EST:4:6:10]
  - Checkpoints can be toggled active or inactive without deletion, preserving historical data
  - Admins can preview exactly what the end user will see for a given checkpoint before publishing
  - Map view within the admin panel shows all checkpoints plotted geographically with status indicators

Rules:
- Never more than 1 sub-section per feature area
- Only create sub-sections when a feature genuinely needs 6+ bullets
- The sub-section gets its own [EST] tag
- Features with 5 or fewer bullets should NOT be split

WRITING STYLE FOR BULLET POINTS:
- Write bullets as if they ARE the presentation, not notes you'd explain during a presentation
- Use complete, conversational phrasing — not terse shorthand
- Start bullets with natural language: "Users can...", "Displays the...", "Provides a...", "Allows the user to...", "Includes the ability to...", "Enables..."
- The tone should feel like someone is walking you through the platform, explaining what each piece does
- Still keep it concise — one line per bullet when possible.

V1 OPTIONAL FLAGGING:
For each subsection, decide whether it is ESSENTIAL for v1 or OPTIONAL.
- ESSENTIAL: the app cannot launch or get its first paying client without this.
- OPTIONAL: nice-to-have that can be added after launch.
- If optional, append " [OPTIONAL]" to the subsection title line.
- Typically 20-40% of features will be optional.

HOUR ESTIMATES:
For EVERY subsection title (feature area), you must append an hour estimate tag in this exact format:
[EST:lean:balanced:complex]

Where lean, balanced, and complex are integer hour estimates for that specific line item.

Use this HISTORICAL REFERENCE TABLE from 15 past agency proposals at $70/hr to guide your estimates. Match each subsection to the closest category and use the ranges as a baseline. Adjust up or down based on the specific complexity described in the bullets underneath.

REFERENCE TABLE (Category: lean / balanced / complex hours):
- Login (email/password/forgot): 1 / 2 / 3
- Login (OAuth/SSO like Discord, Google): 3 / 5 / 8
- Signup & Onboarding: 2 / 5 / 8
- Dashboard / Homepage: 8 / 12 / 18
- Search & Filter: 4 / 8 / 14
- User Profile / Account Management: 3 / 4 / 8
- Listings / Feed / Catalog View: 8 / 12 / 20
- Detail Page (single item view): 6 / 10 / 15
- Content Management (CRUD for a data type): 8 / 14 / 20
- Form-heavy Feature (multi-field with logic): 6 / 10 / 15
- In-app Messaging / Chat: 10 / 15 / 25
- Reviews & Ratings: 4 / 8 / 15
- Notifications (email triggers): 4 / 8 / 12
- Payment Integration (Stripe): 8 / 12 / 25
- Order / Booking Management: 6 / 10 / 20
- Commission / Payout Logic: 6 / 10 / 15
- Admin Dashboard: 8 / 12 / 20
- Admin CMS / Content Management: 10 / 18 / 30
- User / Role Management (admin): 6 / 10 / 15
- Moderation Tools: 6 / 8 / 15
- Supabase / Xano Backend Architecture: DO NOT ESTIMATE (excluded from line items)
- Database Structure Design: 6 / 8 / 15
- Security Review: 5 / 8 / 12
- API / Third-party Integration (per integration): 6 / 12 / 25
- Reporting / Analytics: 8 / 12 / 20
- Responsivity (desktop + mobile web): DO NOT ESTIMATE (excluded from line items)
- Native App / Mobile Infrastructure: DO NOT ESTIMATE (excluded from line items)
- Animations & UI Polish: 15 / 25 / 40
- File Upload / Document Management: 6 / 12 / 20
- Calendar Integration: 5 / 8 / 14
- Video Hosting / Player: 8 / 15 / 25
- Gamification / Rewards: 5 / 10 / 18
- Content Migration: 6 / 10 / 18

ESTIMATE RULES:
- The tag goes on the SAME LINE as the subsection title, AFTER the title text and after any [OPTIONAL] tag
- Example: Dashboard / Homepage [EST:8:12:18]
- Example: Advanced Search Filters [OPTIONAL] [EST:4:8:14]
- Do NOT put estimates on group headers (==Title==), only on subsection titles
- Do NOT put estimates on User Types, Login, or Signup sections (those are standard)
- NEVER put [EST] tags on these sections — they are scoped separately and should have NO hour estimates: Backend Architecture, Supabase/Xano Backend, Responsivity, Responsive Design, Native App, Mobile Application Infrastructure, Mobile App Wrapping. These sections should still appear in the proposal with their bullet points, just without any [EST] tag.
- For features that don't clearly map to a reference category, use your best judgment based on the bullet complexity
- If a feature is simple (1-3 bullets, straightforward), lean toward the lower end
- If a feature is complex (5+ bullets, integrations, edge cases), lean toward the higher end

OTHER RULES:
- Include specifics mentioned in the transcript (e.g., specific tech like Stripe, Supabase, SendGrid)
- If something is unclear, make reasonable assumptions noted with "(assumed)"
- Do NOT use markdown formatting — just plain text with dashes for bullets and == for group headers
- Indent sub-bullets with two spaces before the dash

OPEN PRODUCT QUESTIONS:
After the full proposal framework, output:
===OPEN_QUESTIONS===

Then list 5-12 open product questions ranked by scope impact. These are for the CLIENT — product/business decisions that affect scope.

RULES FOR QUESTIONS:
- Only product decisions, business logic, and UX questions
- Do NOT include technical implementation questions the dev team can answer
- Format: question on its own line, then a bullet with "Suggested lean answer: ..."

OUTPUT ONLY the structured proposal text followed by ===OPEN_QUESTIONS=== and the questions. No preamble, no explanations.

CRITICAL — NEVER REFUSE:
You must ALWAYS generate the full proposal framework structure, no matter what. Even if the transcript is vague, incomplete, about marketing instead of software, or missing key details — you MUST still produce the complete output. Extract whatever product details you can find (even if mentioned in passing), make reasonable assumptions for everything else, and mark assumptions with "(assumed)". If the transcript barely mentions the product, use context clues about the industry and product type to infer a reasonable feature set. Your job is to give the sales rep a starting point they can edit — a blank or refused output is never acceptable. Never explain why you can't do it. Never ask for more information. Just generate the framework.`;

const PLACEHOLDER_TRANSCRIPT = `Paste your sales call transcript here...

The AI will analyze the transcript and any uploaded resources to generate a structured proposal framework matching your format.`;

function FileChip({ file, onRemove }) {
  const ext = file.name.split(".").pop().toLowerCase();
  const colors = {
    pdf: { bg: "#fee2e2", text: "#991b1b", icon: "PDF" },
    pptx: { bg: "#fef3c7", text: "#92400e", icon: "PPT" },
    ppt: { bg: "#fef3c7", text: "#92400e", icon: "PPT" },
    fig: { bg: "#ede9fe", text: "#5b21b6", icon: "FIG" },
    png: { bg: "#dbeafe", text: "#1e40af", icon: "IMG" },
    jpg: { bg: "#dbeafe", text: "#1e40af", icon: "IMG" },
    jpeg: { bg: "#dbeafe", text: "#1e40af", icon: "IMG" },
    doc: { bg: "#dbeafe", text: "#1e3a8a", icon: "DOC" },
    docx: { bg: "#dbeafe", text: "#1e3a8a", icon: "DOC" },
    txt: { bg: "#f3f4f6", text: "#374151", icon: "TXT" },
  };
  const c = colors[ext] || { bg: "#f3f4f6", text: "#374151", icon: ext.toUpperCase().slice(0, 3) };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 8,
      background: c.bg, color: c.text,
      fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
    }}>
      <span style={{
        background: c.text, color: c.bg,
        padding: "2px 6px", borderRadius: 4,
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      }}>{c.icon}</span>
      <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file.name}
      </span>
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: c.text, opacity: 0.6, fontSize: 16, lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  );
}

function copyRichText(plainText, htmlText) {
  // Use a hidden contenteditable div to copy rich text (bold, etc.)
  const div = document.createElement("div");
  div.contentEditable = "true";
  div.innerHTML = htmlText;
  div.style.position = "fixed";
  div.style.left = "-9999px";
  div.style.top = "-9999px";
  div.style.opacity = "0";
  document.body.appendChild(div);
  
  // Select the div content
  const range = document.createRange();
  range.selectNodeContents(div);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  try { document.execCommand("copy"); } catch (e) { /* ignore */ }
  
  sel.removeAllRanges();
  document.body.removeChild(div);
  return Promise.resolve();
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  fallbackCopy(text);
  return Promise.resolve();
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try { document.execCommand("copy"); } catch (e) { /* ignore */ }
  document.body.removeChild(textarea);
}

// Build plain + HTML copy text for a section (title + bullets)
function buildSectionCopy(title, lines) {
  const bullets = lines.filter(l => l.trim());
  // Plain text: title, then first bullet on next line (no gap), then double-spaced after
  const plainParts = [title];
  bullets.forEach((b, i) => {
    if (i === 0) plainParts.push(b.trim());
    else plainParts.push("", b.trim());
  });
  const plain = plainParts.join("\n");

  // HTML: bold title, first bullet right after, then <br><br> between rest
  const htmlParts = [`<b>${title}</b>`];
  bullets.forEach((b, i) => {
    const clean = b.trim().replace(/^[-•]\s*/, "");
    if (i === 0) htmlParts.push(`<br>– ${clean}`);
    else htmlParts.push(`<br><br>– ${clean}`);
  });
  const html = htmlParts.join("");

  return { plain, html };
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{
      position: "sticky", top: 12, float: "right",
      background: copied ? "#059669" : "#18181b",
      color: "#fff", border: "none", borderRadius: 8,
      padding: "8px 16px", fontSize: 13, fontWeight: 600,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.2s ease",
      zIndex: 10,
    }}>
      {copied ? "✓ Copied!" : "Copy All"}
    </button>
  );
}

function SectionCopyButton({ text, html }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (html) {
      await copyRichText(text, html);
    } else {
      await copyToClipboard(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} title="Copy this line item" style={{
      background: copied ? "#ecfdf5" : "#f4f4f5",
      border: copied ? "1px solid #a7f3d0" : "1px solid #e4e4e7",
      cursor: "pointer",
      color: copied ? "#059669" : "#71717a",
      fontSize: 11, fontWeight: 600,
      padding: "3px 8px", borderRadius: 6,
      transition: "all 0.15s ease",
      fontFamily: "'DM Sans', sans-serif",
      display: "inline-flex", alignItems: "center", gap: 3,
      userSelect: "none", WebkitUserSelect: "none",
      flexShrink: 0,
    }}>
      {copied ? "✓" : "⎘"}<span style={{ fontSize: 10 }}>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function ProposalGenerator() {
  const [transcript, setTranscript] = useState("");
  const [budget, setBudget] = useState("");
  const [files, setFiles] = useState([]);
  const [output, setOutput] = useState("");
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileInputRef = useRef(null);
  const outputRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const loadingMessages = [
    "Reading through the transcript...",
    "Identifying user types & flows...",
    "Mapping functional requirements...",
    "Structuring the proposal framework...",
    "Polishing the output...",
  ];

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadingMsg(loadingMessages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[i]);
    }, 3500);
    return () => clearInterval(interval);
  }, [loading]);

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });

  const handleFiles = (newFiles) => {
    const allowed = ["pdf", "pptx", "ppt", "png", "jpg", "jpeg", "doc", "docx", "txt", "fig"];
    const valid = Array.from(newFiles).filter(f => {
      const ext = f.name.split(".").pop().toLowerCase();
      return allowed.includes(ext);
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Please paste a transcript to analyze.");
      return;
    }
    setError("");
    setLoading(true);
    setOutput("");

    try {
      const contentBlocks = [];

      // Process uploaded files
      for (const file of files) {
        const ext = file.name.split(".").pop().toLowerCase();
        if (["png", "jpg", "jpeg"].includes(ext)) {
          const base64 = await readFileAsBase64(file);
          const mediaType = ext === "png" ? "image/png" : "image/jpeg";
          contentBlocks.push({
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          });
          contentBlocks.push({
            type: "text",
            text: `[Above is an uploaded image: ${file.name} — this may be a wireframe, mockup, or design reference]`,
          });
        } else if (ext === "pdf") {
          const base64 = await readFileAsBase64(file);
          contentBlocks.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          });
          contentBlocks.push({
            type: "text",
            text: `[Above is an uploaded PDF: ${file.name}]`,
          });
        } else if (["txt", "doc", "docx"].includes(ext)) {
          try {
            const text = await readFileAsText(file);
            contentBlocks.push({
              type: "text",
              text: `[Content from uploaded file "${file.name}"]:\n${text}`,
            });
          } catch {
            contentBlocks.push({
              type: "text",
              text: `[File "${file.name}" was uploaded but could not be read as text]`,
            });
          }
        } else {
          contentBlocks.push({
            type: "text",
            text: `[File "${file.name}" was uploaded as supplementary reference (${ext} format)]`,
          });
        }
      }

      // Add the main transcript
      contentBlocks.push({
        type: "text",
        text: `Here is the sales call transcript to analyze:\n\n---\n${transcript}\n---\n\nPlease generate the structured proposal framework based on this transcript and any uploaded supplementary materials.`,
      });

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: SYSTEM_PROMPT + (budget ? `\n\nBUDGET CONTEXT — CRITICAL FOR V2 FLAGGING:
The client's budget is ${budget === "5-10k" ? "$5,000–$10,000" : budget === "10-20k" ? "$10,000–$20,000" : budget === "20-40k" ? "$20,000–$40,000" : "$40,000+"}.

Adjust your [OPTIONAL] flagging aggressively based on this budget:
${budget === "5-10k" ? `- At this budget, only the absolute bare minimum should be v1. Flag 50-70% of features as [OPTIONAL]. Strip the scope down to: core auth, the single most important user flow, basic account management, and the simplest possible admin. Everything else — secondary user types, advanced search, analytics, notifications, chat, complex admin tools, reporting — should all be [OPTIONAL]. The goal is a functional MVP that proves the concept in ~70-140 dev hours.` : ""}${budget === "10-20k" ? `- At this budget, be selective. Flag 35-50% of features as [OPTIONAL]. Keep the core user flows, auth, primary value prop, basic admin, and one key integration. Defer advanced features, secondary user type enhancements, analytics, complex admin tools, and nice-to-have integrations. Target ~140-280 dev hours for v1.` : ""}${budget === "20-40k" ? `- At this budget, include most core features. Flag 15-30% of features as [OPTIONAL]. Only defer genuinely secondary features like advanced analytics, complex reporting, recommendation engines, or features the client themselves described as "nice to have." Target ~280-560 dev hours.` : ""}${budget === "40k+" ? `- At this budget, include everything discussed. Only flag features as [OPTIONAL] if the transcript itself indicates they should be deferred or they are genuinely phase 2 items the client mentioned. Flag 0-15% at most.` : ""}
The budget context should ONLY affect which features get [OPTIONAL] tags. It should NOT affect the quality, detail, or completeness of the proposal itself — still list every feature, still write detailed bullets, still provide estimates. The client needs to see the full picture even if many items are flagged V2.` : ""),
          messages: [{ role: "user", content: contentBlocks }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n");

      // Split proposal from questions
      const separator = "===OPEN_QUESTIONS===";
      const sepIdx = text.indexOf(separator);
      if (sepIdx !== -1) {
        setOutput(text.substring(0, sepIdx).trim());
        setQuestions(text.substring(sepIdx + separator.length).trim());
      } else {
        setOutput(text);
        setQuestions("");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const chatSystemPrompt = `You are a senior solutions architect assistant helping a sales rep refine a software proposal. You have full context of the sales call transcript, the generated proposal framework, and open product questions.

Here is the original sales call transcript:
---
${transcript}
---

Here is the generated proposal framework:
---
${output}
---

${questions ? `Here are the open product questions that were identified:\n---\n${questions}\n---` : ""}

RULES:
- Answer questions about the proposal, transcript, or product scope
- If the user asks to adjust, add, or remove a feature, explain clearly what should change and where in the proposal
- If asked about something not covered in the transcript, say so honestly and suggest what to clarify with the client
- Keep responses concise and actionable — you're talking to a busy sales rep
- Do not generate a full new proposal — just answer the specific question or suggest specific edits
- Use plain language, no markdown formatting`;

      // Build API messages from chat history
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: chatSystemPrompt,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n");

      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Parse output into groups (big headers) and sections (subsections)
  const parseOutput = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const groups = [];
    let currentGroup = null;
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentSection) currentSection.lines.push("");
        continue;
      }

      // Check for group header: ==Title==
      const groupMatch = trimmed.match(/^==\s*(.+?)\s*==$/);
      if (groupMatch) {
        if (currentSection && currentGroup) currentGroup.sections.push(currentSection);
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { title: groupMatch[1], sections: [] };
        currentSection = null;
        continue;
      }

      const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•");
      const isIndented = line.startsWith("  ") && isBullet;

      if (!isBullet) {
        // This is a section title (subsection) or a standalone line
        if (currentSection && currentGroup) currentGroup.sections.push(currentSection);
        if (!currentGroup) currentGroup = { title: null, sections: [] };
        currentSection = { title: trimmed, lines: [] };
      } else {
        if (!currentSection) {
          if (!currentGroup) currentGroup = { title: null, sections: [] };
          currentSection = { title: "", lines: [] };
        }
        currentSection.lines.push(line);
      }
    }
    if (currentSection && currentGroup) currentGroup.sections.push(currentSection);
    else if (currentSection) {
      if (!currentGroup) currentGroup = { title: null, sections: [] };
      currentGroup.sections.push(currentSection);
    }
    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  // Build plain text for copy (preserving the clean format)
  const buildCopyText = (groups) => {
    return groups.map(g => {
      const parts = [];
      if (g.title) parts.push(g.title);
      g.sections.forEach(s => {
        if (s.title) parts.push(s.title);
        s.lines.forEach(l => { if (l.trim()) parts.push(l); });
        parts.push("");
      });
      return parts.join("\n");
    }).join("\n\n");
  };

  const groups = parseOutput(output);
  // Build copy text: title then first bullet (no gap), double-spaced between rest
  const copyText = (() => {
    if (!output) return "";
    const clean = output.replace(/\s*\[OPTIONAL\]/g, "").replace(/\s*\[EST:\d+:\d+:\d+\]/g, "").replace(/==\s*(.+?)\s*==/g, "$1");
    const lines = clean.split("\n");
    const result = [];
    let lastWasTitle = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;
      const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•");
      if (isBullet) {
        if (lastWasTitle) {
          // First bullet after title — no blank line
          result.push(trimmed);
        } else {
          // Subsequent bullet — blank line before
          if (result.length > 0) result.push("");
          result.push(trimmed);
        }
        lastWasTitle = false;
      } else {
        // Title line
        if (result.length > 0) result.push("", "");
        result.push(trimmed);
        lastWasTitle = true;
      }
    }
    return result.join("\n");
  })();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafaf9",
      fontFamily: "'DM Sans', sans-serif",
      color: "#18181b",
    }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #e4e4e7",
        background: "#fff",
        padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="data:image/jpeg;base64,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" alt="Rapid Dev" style={{
            width: 36, height: 36, borderRadius: 10, objectFit: "contain",
          }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Proposal Framework</div>
            <div style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Sales Call → Structured Scope</div>
          </div>
        </div>
        {output && (
          <button onClick={() => { setOutput(""); setQuestions(""); setChatMessages([]); setChatInput(""); setTranscript(""); setBudget(""); setFiles([]); setError(""); }} style={{
            background: "none", border: "1px solid #d4d4d8", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: "#52525b", fontFamily: "'DM Sans', sans-serif",
          }}>
            New Proposal
          </button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Input Area */}
        {!output && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Transcript Input */}
            <div>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#3f3f46", marginBottom: 8, letterSpacing: 0.2,
              }}>
                Sales Call Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={PLACEHOLDER_TRANSCRIPT}
                style={{
                  width: "100%", minHeight: 320, padding: 20,
                  border: "1px solid #d4d4d8", borderRadius: 12,
                  fontSize: 14, lineHeight: 1.7, color: "#27272a",
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#fff", resize: "vertical",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#18181b"}
                onBlur={(e) => e.target.style.borderColor = "#d4d4d8"}
              />
            </div>

            {/* Budget Dropdown */}
            <div>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#3f3f46", marginBottom: 8, letterSpacing: 0.2,
              }}>
                Client's Budget
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px",
                  border: "1px solid #d4d4d8", borderRadius: 12,
                  fontSize: 14, color: budget ? "#27272a" : "#a1a1aa",
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#18181b"}
                onBlur={(e) => e.target.style.borderColor = "#d4d4d8"}
              >
                <option value="" disabled>Select budget range</option>
                <option value="5-10k">$5k – $10k</option>
                <option value="10-20k">$10k – $20k</option>
                <option value="20-40k">$20k – $40k</option>
                <option value="40k+">$40k+</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#3f3f46", marginBottom: 8, letterSpacing: 0.2,
              }}>
                Supplementary Resources <span style={{ fontWeight: 400, color: "#a1a1aa" }}>(optional)</span>
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #d4d4d8", borderRadius: 12,
                  padding: "28px 24px", textAlign: "center",
                  cursor: "pointer", background: "#fafafa",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a1a1aa"; e.currentTarget.style.background = "#f4f4f5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d4d4d8"; e.currentTarget.style.background = "#fafafa"; }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
                <div style={{ fontSize: 14, color: "#52525b", fontWeight: 500 }}>
                  Drop files here or click to browse
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
                  PDF, PPTX, PNG, JPG, DOCX, TXT
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                  style={{ display: "none" }}
                />
              </div>

              {files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {files.map((f, i) => (
                    <FileChip key={i} file={f} onRemove={() => setFiles(prev => prev.filter((_, j) => j !== i))} />
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                padding: "12px 16px", fontSize: 13, color: "#991b1b", fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%", padding: "16px 24px",
                background: loading ? "#52525b" : "#18181b",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.2,
                transition: "background 0.2s",
                position: "relative", overflow: "hidden",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{
                    width: 16, height: 16, border: "2px solid #a1a1aa",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  {loadingMsg}
                </span>
              ) : (
                "Generate Proposal Framework"
              )}
            </button>
          </div>
        )}

        {/* Output Area */}
        {output && (
          <>
          <div ref={outputRef} style={{
            background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16,
            padding: "28px 32px", position: "relative",
          }}>
            <CopyButton text={copyText} />

            {/* Legend */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              marginBottom: 20, paddingBottom: 14,
              borderBottom: "1px solid #f4f4f5",
              userSelect: "none", WebkitUserSelect: "none",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 8px", borderRadius: 6,
                  background: "#fef3c7", border: "1px solid #fde68a",
                  color: "#92400e", fontSize: 10, fontWeight: 700,
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>V2</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Optional for v1</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 0,
                  borderRadius: 6, overflow: "hidden", border: "1px solid #d4d4d8",
                  fontSize: 10, fontWeight: 600, lineHeight: 1,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  <span style={{ padding: "2px 5px", background: "#ecfdf5", color: "#065f46" }}>L</span>
                  <span style={{ padding: "2px 5px", background: "#eff6ff", color: "#1e40af", borderLeft: "1px solid #d4d4d8", borderRight: "1px solid #d4d4d8" }}>B</span>
                  <span style={{ padding: "2px 5px", background: "#fef2f2", color: "#991b1b" }}>C</span>
                </span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Lean / Balanced / Complex hours</span>
              </div>
            </div>

            <div style={{ paddingRight: 0 }}>
              {groups.map((group, gIdx) => (
                <div key={gIdx} style={{
                  marginBottom: 32,
                }}>
                  {/* Big group header */}
                  {group.title && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
                      paddingBottom: 10,
                      borderBottom: "2px solid #18181b",
                    }}>
                      <span style={{
                        fontSize: 20, fontWeight: 800, color: "#18181b",
                        letterSpacing: -0.4,
                        textTransform: "uppercase",
                      }}>
                        {group.title}
                      </span>
                      <SectionCopyButton text={
                        [group.title, "", ...group.sections.flatMap(s => {
                          const t = s.title ? s.title.replace(/\s*\[OPTIONAL\]/g, "").replace(/\s*\[EST:\d+:\d+:\d+\]/g, "").trim() : "";
                          const bullets = s.lines.filter(l => l.trim());
                          const spaced = [t];
                          bullets.forEach((b, i) => {
                            if (i === 0) spaced.push(b.trim());
                            else spaced.push("", b.trim());
                          });
                          spaced.push("", "");
                          return spaced;
                        })].join("\n")
                      } />
                    </div>
                  )}

                  {/* Subsections under this group */}
                  {group.sections.map((section, sIdx) => {
                    const isOptional = section.title && section.title.includes("[OPTIONAL]");
                    // Parse estimate tag [EST:lean:balanced:complex]
                    const estMatch = section.title && section.title.match(/\[EST:(\d+):(\d+):(\d+)\]/);
                    const estimate = estMatch ? { lean: parseInt(estMatch[1]), balanced: parseInt(estMatch[2]), complex: parseInt(estMatch[3]) } : null;
                    const cleanTitle = section.title
                      ? section.title.replace(/\s*\[OPTIONAL\]\s*/g, "").replace(/\s*\[EST:\d+:\d+:\d+\]\s*/g, "").trim()
                      : "";
                    // Build copy text with bold title, no gap before first bullet, double-spaced after
                    const { plain: sectionCopyPlain, html: sectionCopyHtml } = buildSectionCopy(cleanTitle, section.lines);

                    return (
                    <div key={sIdx} style={{
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: sIdx < group.sections.length - 1 ? "1px solid #f4f4f5" : "none",
                      paddingLeft: group.title ? 4 : 0,
                      position: "relative",
                    }}>
                      {cleanTitle && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                          flexWrap: "wrap",
                        }}>
                          <span style={{
                            fontSize: 15, fontWeight: 700, color: group.title ? "#3f3f46" : "#18181b",
                            letterSpacing: -0.2,
                          }}>
                            {cleanTitle}
                          </span>
                          <SectionCopyButton text={sectionCopyPlain} html={sectionCopyHtml} />
                          {isOptional && (
                            <span style={{
                              userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none",
                              display: "inline-flex", alignItems: "center",
                              padding: "2px 8px", borderRadius: 6,
                              background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e",
                              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                              lineHeight: 1.4, pointerEvents: "none",
                            }}>V2</span>
                          )}
                          {estimate && (
                            <span style={{
                              userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none",
                              display: "inline-flex", alignItems: "center", gap: 0,
                              marginLeft: 2, borderRadius: 6, overflow: "hidden",
                              border: "1px solid #d4d4d8",
                              fontSize: 11, fontWeight: 600, lineHeight: 1,
                              pointerEvents: "none",
                              fontFamily: "'Space Mono', monospace",
                            }}>
                              <span style={{
                                padding: "3px 6px", background: "#ecfdf5", color: "#065f46",
                                borderRight: "1px solid #d4d4d8",
                              }}>{estimate.lean}h</span>
                              <span style={{
                                padding: "3px 6px", background: "#eff6ff", color: "#1e40af",
                                borderRight: "1px solid #d4d4d8",
                              }}>{estimate.balanced}h</span>
                              <span style={{
                                padding: "3px 6px", background: "#fef2f2", color: "#991b1b",
                              }}>{estimate.complex}h</span>
                            </span>
                          )}
                        </div>
                      )}
                      {section.lines.map((line, li) => {
                        if (!line.trim()) return <div key={li} style={{ height: 6 }} />;
                        const indent = line.match(/^(\s*)/)[1].length;
                        const isSubBullet = indent >= 2;
                        const cleanLine = line.trim().replace(/^[-•]\s*/, "");
                        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");

                        if (!isBullet) {
                          return (
                            <div key={li} style={{
                              fontSize: 14, color: "#3f3f46", lineHeight: 1.7,
                              marginTop: 4,
                              paddingLeft: isSubBullet ? 28 : 0,
                            }}>
                              {line.trim()}
                            </div>
                          );
                        }

                        return (
                          <div key={li} style={{
                            fontSize: 14, color: "#52525b", lineHeight: 1.7,
                            paddingLeft: isSubBullet ? 28 : 12,
                            display: "flex", gap: 8,
                          }}>
                            <span style={{ color: "#a1a1aa", flexShrink: 0 }}>–</span>
                            <span>{cleanLine}</span>
                          </div>
                        );
                      })}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            {(() => {
              let totalLean = 0, totalBalanced = 0, totalComplex = 0;
              let optLean = 0, optBalanced = 0, optComplex = 0;
              groups.forEach(g => g.sections.forEach(s => {
                const em = s.title && s.title.match(/\[EST:(\d+):(\d+):(\d+)\]/);
                if (em) {
                  const l = parseInt(em[1]), b = parseInt(em[2]), c = parseInt(em[3]);
                  totalLean += l; totalBalanced += b; totalComplex += c;
                  if (s.title.includes("[OPTIONAL]")) {
                    optLean += l; optBalanced += b; optComplex += c;
                  }
                }
              }));
              const pmLean = Math.round(totalLean * 0.2);
              const pmBal = Math.round(totalBalanced * 0.2);
              const pmComp = Math.round(totalComplex * 0.2);
              const qaLean = Math.round(totalLean * 0.15);
              const qaBal = Math.round(totalBalanced * 0.15);
              const qaComp = Math.round(totalComplex * 0.15);
              const grandDevLean = totalLean + pmLean;
              const grandDevBal = totalBalanced + pmBal;
              const grandDevComp = totalComplex + pmComp;

              if (totalLean === 0) return null;

              const estBadge = (lean, bal, comp, size) => (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 0,
                  borderRadius: 6, overflow: "hidden", border: "1px solid #d4d4d8",
                  fontSize: size || 12, fontWeight: 700, lineHeight: 1,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  <span style={{ padding: "4px 7px", background: "#ecfdf5", color: "#065f46", borderRight: "1px solid #d4d4d8" }}>{lean}h</span>
                  <span style={{ padding: "4px 7px", background: "#eff6ff", color: "#1e40af", borderRight: "1px solid #d4d4d8" }}>{bal}h</span>
                  <span style={{ padding: "4px 7px", background: "#fef2f2", color: "#991b1b" }}>{comp}h</span>
                </span>
              );

              // Pricing: dev + PM at $70, QA at $30
              const priceLean = (grandDevLean * 70) + (qaLean * 30);
              const priceComp = (grandDevComp * 70) + (qaComp * 30);

              return (
                <div style={{
                  marginTop: 24, padding: "16px 20px",
                  background: "#fafaf9", borderRadius: 12,
                  border: "1px solid #e4e4e7",
                  userSelect: "none", WebkitUserSelect: "none",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#18181b", marginBottom: 14, letterSpacing: -0.2 }}>
                    Estimate Summary
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#52525b" }}>Feature Development <span style={{ color: "#a1a1aa", fontSize: 11 }}>@ $70/hr</span></span>
                      {estBadge(totalLean, totalBalanced, totalComplex)}
                    </div>
                    {optLean > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 12 }}>
                        <span style={{ fontSize: 12, color: "#a1a1aa", fontStyle: "italic" }}>of which V2 (optional)</span>
                        {estBadge(optLean, optBalanced, optComplex, 11)}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#52525b" }}>PM Efforts (~20%) <span style={{ color: "#a1a1aa", fontSize: 11 }}>@ $70/hr</span></span>
                      {estBadge(pmLean, pmBal, pmComp)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#52525b" }}>QA & Testing (15%) <span style={{ color: "#a1a1aa", fontSize: 11 }}>@ $30/hr</span></span>
                      {estBadge(qaLean, qaBal, qaComp)}
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderTop: "2px solid #18181b", paddingTop: 10, marginTop: 4,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#18181b" }}>Total Hours</span>
                      {estBadge(grandDevLean + qaLean, grandDevBal + qaBal, grandDevComp + qaComp, 13)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: "#a1a1aa" }}>Estimated Price Range</span>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: "#18181b",
                        fontFamily: "'Space Mono', monospace",
                      }}>
                        ${priceLean.toLocaleString()} – ${priceComp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Re-generate */}
            <div style={{
              marginTop: 24, paddingTop: 20, borderTop: "1px solid #e4e4e7",
              display: "flex", gap: 12,
            }}>
              <button onClick={handleGenerate} style={{
                flex: 1, padding: "12px 20px",
                background: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                color: "#3f3f46", fontFamily: "'DM Sans', sans-serif",
              }}>
                ↻ Regenerate
              </button>
              <button onClick={() => {
                const blob = new Blob([copyText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "proposal-framework.txt"; a.click();
                URL.revokeObjectURL(url);
              }} style={{
                flex: 1, padding: "12px 20px",
                background: "#18181b", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                color: "#fff", fontFamily: "'DM Sans', sans-serif",
              }}>
                ↓ Download .txt
              </button>
            </div>
          </div>

          {/* Open Questions Card */}
          {questions && (
            <div style={{
              marginTop: 24,
              background: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: 16,
              padding: "24px 28px",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                paddingBottom: 12, borderBottom: "1px solid #fde68a",
                userSelect: "none", WebkitUserSelect: "none",
              }}>
                <span style={{
                  fontSize: 18, fontWeight: 800, color: "#92400e",
                  letterSpacing: -0.3,
                }}>
                  Open Product Questions
                </span>
                <span style={{
                  fontSize: 11, color: "#a16207", fontWeight: 500,
                  background: "#fef3c7", padding: "3px 8px", borderRadius: 6,
                }}>
                  For the client — ranked by scope impact
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#a16207", marginBottom: 16, lineHeight: 1.5,
                userSelect: "none", WebkitUserSelect: "none",
              }}>
                These questions surfaced from the transcript. The answers will materially affect scope and cost. 
                Bring them up in your next call or follow-up email.
              </div>
              {(() => {
                // Parse questions into structured items
                const qLines = questions.split("\n");
                const qItems = [];
                let current = null;
                for (const line of qLines) {
                  const trimmed = line.trim();
                  if (!trimmed) continue;
                  const isBullet = trimmed.startsWith("-") || trimmed.startsWith("•");
                  if (!isBullet) {
                    if (current) qItems.push(current);
                    current = { question: trimmed, answer: "" };
                  } else if (current) {
                    current.answer = trimmed.replace(/^[-•]\s*/, "");
                  }
                }
                if (current) qItems.push(current);

                return qItems.map((q, i) => (
                  <div key={i} style={{
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: i < qItems.length - 1 ? "1px solid #fde68a" : "none",
                    display: "flex", gap: 12,
                  }}>
                    <span style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: 8,
                      background: "#fde68a", color: "#92400e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, marginTop: 1,
                      userSelect: "none", WebkitUserSelect: "none",
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: "#78350f",
                        lineHeight: 1.5, marginBottom: 4,
                      }}>
                        {q.question}
                      </div>
                      {q.answer && (
                        <div style={{
                          fontSize: 13, color: "#a16207", lineHeight: 1.5,
                          fontStyle: "italic",
                        }}>
                          {q.answer}
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Contextual Chat */}
          <div style={{
            marginTop: 24,
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: 16,
            overflow: "hidden",
          }}>
            {/* Chat header */}
            <div style={{
              padding: "14px 24px",
              borderBottom: "1px solid #e4e4e7",
              display: "flex", alignItems: "center", gap: 10,
              background: "#fafaf9",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
              }}>?</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>Ask about this proposal</div>
                <div style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500 }}>
                  Has full context of the transcript, proposal, and open questions
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div style={{
              maxHeight: 400, overflowY: "auto",
              padding: chatMessages.length > 0 ? "16px 24px" : "0 24px",
            }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 12,
                }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user" ? "#18181b" : "#f4f4f5",
                    color: msg.role === "user" ? "#fff" : "#27272a",
                    fontSize: 14, lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{
                  display: "flex", justifyContent: "flex-start", marginBottom: 12,
                }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                    background: "#f4f4f5", color: "#a1a1aa",
                    fontSize: 14, display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{
                      display: "inline-flex", gap: 4,
                    }}>
                      <span style={{ animation: "dotPulse 1.4s infinite", animationDelay: "0s" }}>.</span>
                      <span style={{ animation: "dotPulse 1.4s infinite", animationDelay: "0.2s" }}>.</span>
                      <span style={{ animation: "dotPulse 1.4s infinite", animationDelay: "0.4s" }}>.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div style={{
              padding: "12px 16px",
              borderTop: chatMessages.length > 0 ? "1px solid #f4f4f5" : "none",
              display: "flex", gap: 8,
            }}>
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="Ask a question about the proposal, transcript, or scope..."
                style={{
                  flex: 1, padding: "10px 14px",
                  border: "1px solid #d4d4d8", borderRadius: 10,
                  fontSize: 14, color: "#27272a",
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#fafaf9",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#18181b"}
                onBlur={(e) => e.target.style.borderColor = "#d4d4d8"}
              />
              <button
                onClick={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: "10px 18px",
                  background: chatLoading || !chatInput.trim() ? "#d4d4d8" : "#18181b",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: chatLoading ? "default" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>
          </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        textarea::placeholder {
          color: #a1a1aa;
        }
        input::placeholder {
          color: #a1a1aa;
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
