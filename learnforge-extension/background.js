// background.js — LearnForge Service Worker

const ALARM_NAME = "learnforge-review-reminder";
let isGenerating = false;

// ── Supabase config (public anon key — safe to include in extension) ──────────
const SUPABASE_URL = "https://jkiredgrbecwdunglmko.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXJlZGdyYmVjd2R1bmdsbWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjg1MTUsImV4cCI6MjA5NDYwNDUxNX0.lfxJUoaJbtiRvzL5gNL2uZl0dsOjG5_9FaU02JE-Zsg";

// ── Auth: catch the OAuth redirect tab instead of relying on sendMessage ───────
// Works for any installed extension regardless of ID — no externally_connectable needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url?.includes("/auth/extension-login")) return;

  try {
    const hash = new URL(tab.url).hash.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    // Fetch user profile using the access token
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${accessToken}`, "apikey": SUPABASE_ANON_KEY },
    });
    if (!userRes.ok) return;
    const user = await userRes.json();

    await chrome.storage.local.set({
      authToken: { accessToken, refreshToken, savedAt: Date.now() },
      authUser:  { id: user.id, email: user.email, name: user.user_metadata?.full_name || "" },
    });

    chrome.tabs.remove(tabId);
    syncPendingSessions().catch(() => {});
    console.log("[LearnForge] Signed in as:", user.email);
  } catch (e) {
    console.warn("[LearnForge] Auth tab catch failed:", e.message);
  }
});

// ── Message listener ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SET_ALARM") {
    setReviewAlarm(msg.deckName || "LearnForge");
    sendResponse({ ok: true });
  }

  if (msg.type === "GENERATE") {
    if (isGenerating) {
      sendResponse({ ok: false, error: "Already generating" });
      return true;
    }
    isGenerating = true;
    handleGenerate(msg)
      .catch(async (e) => {
        await chrome.storage.local.set({ lastRun: { status: "error", error: e.message } });
        notifyPopup({ type: "GENERATE_ERROR", error: e.message });
      })
      .finally(() => { isGenerating = false; });
    sendResponse({ ok: true });
  }

  if (msg.type === "SIGN_OUT") {
    chrome.storage.local.remove(["authToken", "authUser"]);
    sendResponse({ ok: true });
  }

  if (msg.type === "GET_AUTH_STATE") {
    chrome.storage.local.get(["authToken", "authUser"]).then(data => {
      sendResponse({
        accessToken: data.authToken?.accessToken || null,
        user: data.authUser || null,
      });
    });
    return true;
  }

  return true;
});

// ── Send a message to the popup (silently fails if popup is closed) ───────────
async function notifyPopup(data) {
  try { await chrome.runtime.sendMessage(data); } catch (_) {}
}

const SYSTEM_PROMPT = "You are an expert study material creator. When given educational content, you extract comprehensive flashcards and quiz questions covering EVERY distinct concept, definition, technique, comparison, and process present in the text. You always err on the side of MORE cards — if a concept is mentioned and explained, it gets a card. You never skip things because they seem basic. Dense technical content should produce 20+ cards. Your output is always valid JSON.";

// ── Groq (OpenAI-compatible, streaming) ───────────────────────────────────────
async function callGroq(apiKey, userPrompt) {
  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        stream: true,
        temperature: 0.4,
        max_tokens: 8192,
      }),
    });
  } catch (e) {
    throw new Error("Cannot reach Groq API. Check your internet connection.");
  }
  if (response.status === 401) throw new Error("Invalid Groq API key. Update it in the popup.");
  if (response.status === 429) throw new Error("Groq rate limit hit. Wait a moment and try again.");
  if (!response.ok) throw new Error(`Groq API error ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let rawText = "", tokenCount = 0, buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break;
      try {
        const chunk = JSON.parse(payload);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          rawText += content;
          tokenCount++;
          if (tokenCount % 10 === 0) notifyPopup({ type: "GENERATE_PROGRESS", tokenCount });
        }
      } catch (_) {}
    }
  }
  notifyPopup({ type: "GENERATE_PROGRESS", tokenCount, done: true });
  return rawText;
}

// ── Gemini (streaming SSE) ────────────────────────────────────────────────────
async function callGemini(apiKey, userPrompt) {
  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
        }),
      }
    );
  } catch (e) {
    throw new Error("Cannot reach Gemini API. Check your internet connection.");
  }
  if (response.status === 400) throw new Error("Gemini API error: bad request. Check your API key.");
  if (response.status === 403) throw new Error("Invalid Gemini API key. Update it in the popup.");
  if (response.status === 429) throw new Error("Gemini rate limit hit. Wait a moment and try again.");
  if (!response.ok) throw new Error(`Gemini API error ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let rawText = "", tokenCount = 0, buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      try {
        const chunk = JSON.parse(payload);
        const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          rawText += content;
          tokenCount++;
          if (tokenCount % 10 === 0) notifyPopup({ type: "GENERATE_PROGRESS", tokenCount });
        }
      } catch (_) {}
    }
  }
  notifyPopup({ type: "GENERATE_PROGRESS", tokenCount, done: true });
  return rawText;
}

// ── Main generate flow ────────────────────────────────────────────────────────
async function handleGenerate(msg) {
  const { text, title, url, domain, deckName } = msg;

  await chrome.storage.local.set({ lastRun: { status: "running" } });

  const stored = await chrome.storage.local.get(["aiProvider", "groqApiKey", "geminiApiKey"]);
  const provider = stored.aiProvider || "gemini";

  let rawText;
  if (provider === "gemini") {
    if (!stored.geminiApiKey) throw new Error("No Gemini API key saved. Enter it in the popup.");
    rawText = await callGemini(stored.geminiApiKey, buildPrompt(text, title));
  } else {
    if (!stored.groqApiKey) throw new Error("No Groq API key saved. Enter it in the popup.");
    rawText = await callGroq(stored.groqApiKey, buildPrompt(text, title));
  }

  // ── Parse + filter ────────────────────────────────────────────────────────
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch (e) { throw new Error("Failed to parse AI response as JSON: " + e.message); }

  if (!parsed.quiz || !parsed.flashcards) throw new Error("AI response missing quiz or flashcards fields");

  parsed.flashcards = (parsed.flashcards || []).filter(card => {
    if (!card.front || !card.back) return false;
    const front = card.front.trim();
    const back  = card.back.trim();
    if (front.length < 8) return false;
    if (back.length < 25) return false;
    if (front.split(/\s+/).length < 3 && !front.includes("?")) return false;
    return true;
  });

  parsed.quiz = (parsed.quiz || []).filter(q => {
    if (!q.question || !Array.isArray(q.options)) return false;
    if (q.options.length !== 4) return false;
    if (typeof q.correct !== "number" || q.correct < 0 || q.correct > 3) return false;
    if (q.question.trim().length < 10) return false;
    if (q.options.some(opt => !opt || opt.trim().length < 1)) return false;
    return true;
  });

  if (parsed.flashcards.length === 0 && parsed.quiz.length === 0) {
    throw new Error("AI generated no valid cards. Try again or check the page content.");
  }

  // ── Try Anki (optional — never blocks card saving) ────────────────────────
  const ankiResult = await pushToAnki(parsed.flashcards, deckName);

  // ── Save session ──────────────────────────────────────────────────────────
  const session = {
    id: "s_" + Date.now(),
    title: title || "Untitled",
    url,
    domain,
    deck: deckName,
    timestamp: Date.now(),
    quiz: parsed.quiz,
    flashcards: parsed.flashcards,
    quizResults: null,
    cardsReviewed: [],
    addedToAnki: ankiResult.added,
  };

  const storageData = await chrome.storage.local.get(["sessions"]);
  const sessions = storageData.sessions || [];
  sessions.unshift(session);
  if (sessions.length > 100) sessions.length = 100;

  await chrome.storage.local.set({
    sessions,
    lastRun: {
      status: "done",
      lastResult: parsed,
      lastSessionId: session.id,
      ankiAdded: ankiResult.added,
      ankiResult,
    },
  });

  setReviewAlarm(deckName);
  syncSessionToSupabase(session).catch(e => console.warn("[LearnForge] Sync failed:", e.message));
  notifyPopup({ type: "GENERATE_DONE", aiResult: parsed, ankiResult, deckName });
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(text, title) {
  const truncated = text.slice(0, 12000);
  return `STEP 1 — CATALOG (think, do not output this step):
Before writing any JSON, mentally list every distinct item in the content:
• Definitions and terminology
• How things work (mechanisms, algorithms, processes, steps)
• Comparisons or differences (X vs Y, when to use X over Y)
• Rules, constraints, requirements, limitations
• Common mistakes, pitfalls, gotchas
• Formulas, thresholds, numbers that matter
• Examples that illustrate a principle

Every item you catalog becomes exactly one flashcard AND one quiz question. Do not merge similar items — keep them separate. Do not skip anything the author explained — if it was worth explaining, it is worth a card.

STEP 2 — GENERATE OUTPUT:

FLASHCARD RULES:
- "front": A specific question ("How does X work?", "What is the difference between X and Y?", "When should you use X?") or fill-in-the-blank. NEVER a bare term.
- "back": 2-4 sentences. Concrete. Self-contained — no "as mentioned above" or "see the article". Includes the key detail that makes it actually useful to know.

GOOD flashcard example:
{ "front": "What is Stored XSS and how does it differ from Reflected XSS?", "back": "Stored XSS permanently saves the malicious script on the server (e.g. in a comment field) so every visitor gets hit. Reflected XSS requires the victim to click a crafted URL — the payload is echoed back in the immediate response and never persisted. The key distinction is persistence: stored attacks are automatic and long-lasting; reflected attacks require user interaction each time." }

QUIZ RULES:
- One question per item in your catalog (same set as flashcards)
- Exactly 4 options. Distractors must be plausible, same domain, similar length — not obviously wrong.
- "correct" is the 0-indexed position (0–3). Vary correct position across questions.
- Test understanding, not trivia.

GOOD quiz example:
{ "question": "Which HTTP header restricts which scripts can execute on a page, helping mitigate XSS?", "options": ["X-Frame-Options", "Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options"], "correct": 1 }

PAGE TITLE: ${title}

PAGE CONTENT:
${truncated}

Output ONLY valid JSON — no markdown, no code fences, no commentary:
{
  "quiz": [{ "question": "...", "options": ["...", "...", "...", "..."], "correct": 0 }],
  "flashcards": [{ "front": "...", "back": "..." }]
}`;
}

// ── AnkiConnect (optional — failure is non-blocking) ──────────────────────────
async function pushToAnki(flashcards, deckName) {
  try {
    await ankiRequest("createDeck", { deck: deckName });
  } catch (e) {
    return { success: false, added: 0, notRunning: true, error: "Anki not running" };
  }

  const notes = flashcards.map(card => ({
    deckName,
    modelName: "Basic",
    fields: { Front: card.front, Back: card.back },
    options: { allowDuplicate: false, duplicateScope: "deck" },
    tags: ["learnforge"],
  }));

  try {
    const result = await ankiRequest("addNotes", { notes });
    const added = result.filter(id => id !== null).length;
    return { success: true, added };
  } catch (e) {
    return { success: false, added: 0, error: "AnkiConnect error: " + e.message };
  }
}

async function ankiRequest(action, params = {}) {
  const response = await fetch("http://localhost:8765", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params }),
  });
  if (!response.ok) throw new Error(`AnkiConnect HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// ── Supabase sync ─────────────────────────────────────────────────────────────
async function syncSessionToSupabase(session) {
  const stored = await chrome.storage.local.get(["authToken", "authUser"]);
  if (!stored.authToken?.accessToken || !stored.authUser?.id) return;

  const row = {
    id:             session.id,
    user_id:        stored.authUser.id,
    title:          session.title,
    url:            session.url,
    domain:         session.domain,
    deck:           session.deck,
    timestamp:      session.timestamp,
    quiz:           session.quiz,
    flashcards:     session.flashcards,
    quiz_results:   session.quizResults,
    cards_reviewed: session.cardsReviewed,
    added_to_anki:  session.addedToAnki,
    synced_at:      new Date().toISOString(),
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${stored.authToken.accessToken}`,
      "apikey": SUPABASE_ANON_KEY,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return;
    await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${newToken}`,
        "apikey": SUPABASE_ANON_KEY,
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ ...row, synced_at: new Date().toISOString() }),
    });
    return;
  }

  if (!res.ok) throw new Error(`Supabase sync ${res.status}`);
}

async function refreshAccessToken() {
  const stored = await chrome.storage.local.get("authToken");
  if (!stored.authToken?.refreshToken) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: stored.authToken.refreshToken }),
  });

  if (!res.ok) {
    await chrome.storage.local.remove(["authToken", "authUser"]);
    return null;
  }

  const data = await res.json();
  await chrome.storage.local.set({
    authToken: { accessToken: data.access_token, refreshToken: data.refresh_token, savedAt: Date.now() },
  });
  return data.access_token;
}

async function syncPendingSessions() {
  const stored = await chrome.storage.local.get(["authToken", "authUser", "sessions"]);
  if (!stored.authToken?.accessToken || !stored.sessions?.length) return;

  const uid = stored.authUser.id;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sessions?select=id&user_id=eq.${uid}&limit=500`,
    { headers: { "Authorization": `Bearer ${stored.authToken.accessToken}`, "apikey": SUPABASE_ANON_KEY } }
  );
  if (!res.ok) return;

  const synced = await res.json();
  const syncedIds = new Set(synced.map(r => r.id));
  for (const session of stored.sessions) {
    if (!syncedIds.has(session.id)) await syncSessionToSupabase(session).catch(() => {});
  }
}

// ── Alarm helpers ─────────────────────────────────────────────────────────────
async function setReviewAlarm(deckName) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({ lastDeckName: deckName, lastAddedAt: Date.now() });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 24 * 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const stored = await chrome.storage.local.get(["lastDeckName", "srsData", "sessions"]);

  // Count cards actually due
  let dueCount = 0;
  if (stored.srsData && stored.sessions) {
    const now = Date.now();
    stored.sessions.forEach(s => {
      (s.flashcards || []).forEach((_, i) => {
        const srs = stored.srsData[`${s.id}:${i}`];
        if (!srs || srs.nextReview <= now) dueCount++;
      });
    });
  }

  const msg = dueCount > 0
    ? `${dueCount} flashcard${dueCount !== 1 ? "s" : ""} due for review. Open the dashboard to study!`
    : "Time for your daily review. Open the dashboard to keep your streak going!";

  chrome.notifications.create(`learnforge-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "⚡ LearnForge — Review Time",
    message: msg,
    priority: 2,
  });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 24 * 60 });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[LearnForge] Extension installed.");
  syncPendingSessions().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  syncPendingSessions().catch(() => {});
});
