// popup.js — LearnForge Extension

const DEFAULT_SITES = [
  { name: "TryHackMe", domain: "tryhackme.com", icon: "🔐" },
  { name: "HackTheBox", domain: "hackthebox.com", icon: "📦" },
  { name: "PortSwigger", domain: "portswigger.net", icon: "🕷" },
  { name: "MDN Web Docs", domain: "developer.mozilla.org", icon: "🦊" },
  { name: "LeetCode", domain: "leetcode.com", icon: "💡" },
  { name: "MS Learn", domain: "learn.microsoft.com", icon: "🪟" },
];

let state = {
  status: "idle",    // idle | running | done | error
  lastResult: null,
  quizVisible: false,
};

let allSites = [];
let activeSiteDomain = null;
let liveTokenEl = null;   // reference to the live-updating log line

// ── DOM refs ─────────────────────────────────────────────────────────────────
const $sitesGrid   = document.getElementById("sitesGrid");
const $customInput = document.getElementById("customSiteInput");
const $addSiteBtn  = document.getElementById("addSiteBtn");
const $deckName    = document.getElementById("deckName");
const $logArea     = document.getElementById("logArea");
const $progressBar = document.getElementById("progressBar");
const $ankiStatus  = document.getElementById("ankiStatus");
const $resultsGrid = document.getElementById("resultsGrid");
const $mainBtn     = document.getElementById("mainBtn");
const $quizToggle  = document.getElementById("quizToggle");
const $quizArea    = document.getElementById("quizArea");
const $quizArrow   = document.getElementById("quizArrow");
const $groqKey        = document.getElementById("groqApiKey");
const $saveApiKey     = document.getElementById("saveApiKey");
const $keyStatus      = document.getElementById("keyStatus");
const $authLoggedOut  = document.getElementById("authLoggedOut");
const $authLoggedIn   = document.getElementById("authLoggedIn");
const $authEmail      = document.getElementById("authEmail");
const $syncDot        = document.getElementById("syncDot");
const $syncLabel      = document.getElementById("syncLabel");
const $signInBtn      = document.getElementById("signInBtn");
const $signOutBtn     = document.getElementById("signOutBtn");

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const stored = await chrome.storage.local.get(["customSites", "deckName", "activeSite", "lastRun"]);

  if (stored.deckName) $deckName.value = stored.deckName;

  const customSites = stored.customSites || [];
  allSites = [...DEFAULT_SITES, ...customSites];
  activeSiteDomain = stored.activeSite || "tryhackme.com";

  renderSites();
  detectCurrentTab();
  loadKeyStatus();
  loadAuthState();

  const lastRun = stored.lastRun;
  if (lastRun?.status === "running") {
    // A run is in progress in the background — restore processing UI
    setButtonState("running");
    setProgress("indeterminate");
    log("AI is analyzing content in the background...", "info");
    log("Results will appear here when ready.", "info");
    liveTokenEl = logLive("Generating flashcards... (waiting for progress)");
  } else if (lastRun?.status === "done" && lastRun.lastResult) {
    // Restore last successful run
    state.status = "done";
    state.lastResult = lastRun.lastResult;
    state.lastSessionId = lastRun.lastSessionId;
    setButtonState("done");
    document.getElementById("rQuiz").textContent = lastRun.lastResult.quiz.length;
    document.getElementById("rCards").textContent = lastRun.lastResult.flashcards.length;
    document.getElementById("rAnki").textContent = lastRun.ankiAdded ?? 0;
    $resultsGrid.className = "results-grid";
    renderQuiz(lastRun.lastResult.quiz);
    $quizToggle.className = "quiz-toggle";
    log("Last session restored — hit Generate Again for fresh cards.", "info");
  }
}

// ── Groq API key management ───────────────────────────────────────────────────
async function loadKeyStatus() {
  const stored = await chrome.storage.local.get("groqApiKey");
  if (stored.groqApiKey) {
    $keyStatus.textContent = "Key saved ✓";
    $keyStatus.className = "key-status saved";
    $groqKey.placeholder = "gsk_••••••••••••••••••••";
  } else {
    $keyStatus.textContent = "No API key saved";
    $keyStatus.className = "key-status missing";
  }
}

$saveApiKey.addEventListener("click", async () => {
  const key = $groqKey.value.trim();
  if (!key) return;
  await chrome.storage.local.set({ groqApiKey: key });
  $groqKey.value = "";
  $groqKey.placeholder = "gsk_••••••••••••••••••••";
  $keyStatus.textContent = "Key saved ✓";
  $keyStatus.className = "key-status saved";
  log("Groq API key saved.", "ok");
});

// ── Auth state ────────────────────────────────────────────────────────────────
function loadAuthState() {
  chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
    if (chrome.runtime.lastError || !response) return showLoggedOut();
    response.accessToken && response.user ? showLoggedIn(response.user) : showLoggedOut();
  });
}

function showLoggedIn(user) {
  $authLoggedOut.classList.add("hidden");
  $authLoggedIn.classList.remove("hidden");
  $authEmail.textContent = user.email;
  const avatarEl = document.getElementById("authAvatar");
  if (avatarEl && user.email) avatarEl.textContent = user.email[0].toUpperCase();
  setSyncStatus("synced");
}

function showLoggedOut() {
  $authLoggedIn.classList.add("hidden");
  $authLoggedOut.classList.remove("hidden");
}

function setSyncStatus(status) {
  $syncDot.className = "sync-dot " + status;
  $syncLabel.textContent = { synced: "Synced", pending: "Syncing...", offline: "Offline" }[status] ?? "Synced";
}

$signInBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://learn-forge-rho.vercel.app/login?source=extension" });
});

$signOutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
  showLoggedOut();
  log("Signed out. Local data remains on this device.", "info");
});

// ── Background message listener ───────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "GENERATE_PROGRESS") {
    if (state.status !== "running") return;
    const label = msg.done
      ? `Generation complete — ${msg.tokenCount} tokens`
      : `Generating... (${msg.tokenCount} tokens)`;
    if (!liveTokenEl) {
      liveTokenEl = logLive(label);
    } else {
      liveTokenEl.textContent = label;
      $logArea.scrollTop = $logArea.scrollHeight;
    }
  }

  if (msg.type === "GENERATE_DONE") {
    liveTokenEl = null;
    const { aiResult, ankiResult, deckName } = msg;

    log(`Created ${aiResult.quiz.length} quiz questions.`, "ok");
    log(`Created ${aiResult.flashcards.length} flashcards.`, "ok");
    setProgress(100);

    document.getElementById("rQuiz").textContent = aiResult.quiz.length;
    document.getElementById("rCards").textContent = aiResult.flashcards.length;
    document.getElementById("rAnki").textContent = ankiResult.added;
    $resultsGrid.className = "results-grid";

    if (ankiResult.success) {
      showAnkiStatus("ok", `✓ ${ankiResult.added} cards added to Anki deck "${deckName}"`);
      log("Cards synced to Anki successfully.", "ok");
      log("Review reminder scheduled for 24 hours.", "ok");
    } else {
      showAnkiStatus("err", `✗ ${ankiResult.error}`);
      log(ankiResult.error, "err");
      if (ankiResult.notRunning) {
        showAnkiStatus("err", "Make sure Anki is open with AnkiConnect installed (port 8765)");
      }
    }

    renderQuiz(aiResult.quiz);
    state.lastResult = aiResult;
    setButtonState("done");
    log("Session complete — your cards are ready.", "ok");
    log("Head to the Study Hub to review & track progress.", "info");
    // Optimistic sync indicator
    setSyncStatus("pending");
    setTimeout(() => setSyncStatus("synced"), 3000);
  }

  if (msg.type === "GENERATE_ERROR") {
    liveTokenEl = null;
    log("Error: " + msg.error, "err");
    setButtonState("error");
    setProgress(0);
  }
});


// ── Sites ─────────────────────────────────────────────────────────────────────
function renderSites() {
  $sitesGrid.innerHTML = "";
  allSites.forEach(site => {
    const chip = document.createElement("div");
    chip.className = "site-chip" + (site.domain === activeSiteDomain ? " active" : "");
    chip.innerHTML = `
      <div class="site-dot"></div>
      <span>${site.icon || "🌐"} ${site.name}</span>
    `;
    chip.addEventListener("click", () => selectSite(site.domain));
    $sitesGrid.appendChild(chip);
  });
}

function selectSite(domain) {
  activeSiteDomain = domain;
  chrome.storage.local.set({ activeSite: domain });
  renderSites();
  log(`Platform: ${domain}`, "info");
}

$addSiteBtn.addEventListener("click", async () => {
  let val = $customInput.value.trim().toLowerCase();
  if (!val) return;
  val = val.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (allSites.find(s => s.domain === val)) {
    log(`${val} already exists.`, "warn");
    return;
  }
  const newSite = { name: val, domain: val, icon: "🌐" };
  const stored = await chrome.storage.local.get("customSites");
  const customSites = stored.customSites || [];
  customSites.push(newSite);
  await chrome.storage.local.set({ customSites });
  allSites.push(newSite);
  $customInput.value = "";
  renderSites();
  log(`Added site: ${val}`, "ok");
});

$deckName.addEventListener("change", () => {
  chrome.storage.local.set({ deckName: $deckName.value.trim() || "LearnForge" });
});

// ── Tab detection ─────────────────────────────────────────────────────────────
async function detectCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  try {
    const url = new URL(tab.url);
    const hostname = url.hostname.replace(/^www\./, "");
    const match = allSites.find(s => hostname === s.domain || hostname.endsWith("." + s.domain));
    if (match && match.domain !== activeSiteDomain) {
      selectSite(match.domain);
      log(`Auto-detected: ${match.name}`, "info");
    }
  } catch (_) {}
}

// ── Logging ───────────────────────────────────────────────────────────────────
function log(msg, type = "info") {
  const prefixes = { info: "›", ok: "✓", err: "✗", warn: "!" };
  const prefix = prefixes[type] || "$";
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span class="log-prefix ${type}">${prefix}</span><span class="log-text">${escapeHtml(msg)}</span>`;
  $logArea.appendChild(line);
  $logArea.scrollTop = $logArea.scrollHeight;
}

function clearLog() {
  $logArea.innerHTML = "";
}

function logLive(initialMsg) {
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span class="log-prefix">$</span><span>${escapeHtml(initialMsg)}</span>`;
  $logArea.appendChild(line);
  $logArea.scrollTop = $logArea.scrollHeight;
  return line.querySelector("span:last-child");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Progress ──────────────────────────────────────────────────────────────────
function setProgress(pct) {
  if (pct === "indeterminate") {
    $progressBar.className = "progress-bar indeterminate";
    $progressBar.style.width = "";
  } else {
    $progressBar.className = "progress-bar";
    $progressBar.style.width = pct + "%";
  }
}

// ── Button state ──────────────────────────────────────────────────────────────
function setButtonState(s) {
  state.status = s;
  $mainBtn.className = "btn-main " + s;
  const labels = {
    idle:    "⚡ Generate Flashcards",
    running: "⏳ Analyzing Page...",
    done:    "✓ Complete · Generate Again",
    error:   "⚠ Something went wrong · Retry",
  };
  $mainBtn.textContent = labels[s] || "⚡ Generate Flashcards";
  $mainBtn.disabled = (s === "running");
}

// ── Main action ───────────────────────────────────────────────────────────────
$mainBtn.addEventListener("click", async () => {
  if (state.status === "running") return;

  const stored = await chrome.storage.local.get(["deckName", "groqApiKey"]);

  if (!stored.groqApiKey) {
    log("No Groq API key saved. Enter your key above and click Save.", "err");
    return;
  }

  clearLog();
  liveTokenEl = null;
  $ankiStatus.className = "hidden";
  $resultsGrid.className = "results-grid hidden";
  $quizToggle.className = "quiz-toggle hidden";
  $quizArea.innerHTML = "";
  $quizArea.className = "quiz-area";

  setButtonState("running");
  setProgress("indeterminate");
  log("Reading page content...");

  // Get current tab
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab found");
  } catch (e) {
    log("Could not access current tab: " + e.message, "err");
    setButtonState("error");
    return;
  }

  // Scrape content
  let scrapeResult;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    scrapeResult = result?.result;
  } catch (e) {
    log("Script injection failed: " + e.message, "err");
    log("Make sure you're on a supported page.", "warn");
    setButtonState("error");
    setProgress(0);
    return;
  }

  if (!scrapeResult || !scrapeResult.text || scrapeResult.text.length < 100) {
    log("Not enough content scraped from this page.", "err");
    setButtonState("error");
    setProgress(0);
    return;
  }

  log(`Scraped ${scrapeResult.wordCount} words from page.`, "ok");
  log("Sending to AI — feel free to close this and come back.", "info");
  setProgress(35);

  const deckNameVal = $deckName.value.trim() || stored.deckName || "LearnForge";

  // Hand off to background service worker (survives popup close)
  chrome.runtime.sendMessage({
    type: "GENERATE",
    text: scrapeResult.text,
    title: scrapeResult.title,
    url: tab.url,
    domain: (new URL(tab.url)).hostname,
    deckName: deckNameVal,
  });
});

// ── Anki status display ───────────────────────────────────────────────────────
function showAnkiStatus(type, msg) {
  $ankiStatus.className = "anki-status " + type;
  $ankiStatus.textContent = msg;
}

// ── Quiz render ───────────────────────────────────────────────────────────────
function renderQuiz(questions) {
  if (!questions || questions.length === 0) return;

  $quizToggle.className = "quiz-toggle";
  $quizArea.innerHTML = "";

  questions.forEach((q, qi) => {
    const el = document.createElement("div");
    el.className = "quiz-q";
    const letters = ["A", "B", "C", "D"];
    const optionsHtml = (q.options || []).map((opt, oi) => `
      <div class="q-option" data-qi="${qi}" data-oi="${oi}" data-correct="${q.correct}">
        <div class="q-letter">${letters[oi]}</div>
        <span>${escapeHtml(opt)}</span>
      </div>
    `).join("");

    el.innerHTML = `
      <div class="q-text">${qi + 1}. ${escapeHtml(q.question)}</div>
      ${optionsHtml}
    `;
    $quizArea.appendChild(el);
  });

  $quizArea.addEventListener("click", e => {
    const opt = e.target.closest(".q-option");
    if (!opt) return;
    const qi = opt.dataset.qi;
    const correct = parseInt(opt.dataset.correct);
    const siblings = $quizArea.querySelectorAll(`.q-option[data-qi="${qi}"]`);
    siblings.forEach((s, i) => {
      s.style.pointerEvents = "none";
      if (i === correct) s.className += " correct";
    });
    const chosen = parseInt(opt.dataset.oi);
    if (chosen !== correct) opt.className += " wrong";
  });
}

$quizToggle.addEventListener("click", () => {
  state.quizVisible = !state.quizVisible;
  $quizArea.className = "quiz-area" + (state.quizVisible ? " visible" : "");
  $quizArrow.textContent = state.quizVisible ? "▲" : "▼";
});

// ── Open dashboard ────────────────────────────────────────────────────────────
document.getElementById("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

// ── Start ─────────────────────────────────────────────────────────────────────
init();
