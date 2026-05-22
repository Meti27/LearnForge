// dashboard.js — LearnForge Study Dashboard

let allSessions = [];
let srsData = {};       // { "sessionId:cardIdx": { nextReview, interval, reps } }
let srsSettings = {};   // user-customizable intervals in ms
let currentQuiz = null;
let currentReview = null;

// ── SRS intervals (ms) ────────────────────────────────────────────────────────
const DEFAULT_SRS = {
  again: 60 * 1000,               // 1 minute
  hard:  10 * 60 * 1000,          // 10 minutes
  good:  24 * 60 * 60 * 1000,     // 1 day
  easy:  3 * 24 * 60 * 60 * 1000, // 3 days
};

function getInterval(rating) {
  return srsSettings[rating] ?? DEFAULT_SRS[rating];
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const data = await chrome.storage.local.get(["sessions", "srsData", "srsSettings"]);
  allSessions  = data.sessions    || [];
  srsData      = data.srsData     || {};
  srsSettings  = data.srsSettings || {};
  renderAll();
  setupTabs();
  setupSearch();
  setupModals();
  setupExports();
  setupSettings();
}

function renderAll() {
  renderStats();
  renderHeatmap();
  renderDue();
  renderRecent();
  renderAllSessions();
  renderStudyList();
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("panel-" + t.dataset.tab).classList.add("active");
    });
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  const totalCards = allSessions.reduce((s, x) => s + (x.flashcards?.length || 0), 0);
  const dueCards   = getDueCards().length;

  const completedQuizzes = allSessions.filter(s => s.quizResults?.completed);
  let accuracy = "—";
  if (completedQuizzes.length > 0) {
    const totalRight = completedQuizzes.reduce((s, x) => s + x.quizResults.correct, 0);
    const totalAsked = completedQuizzes.reduce((s, x) => s + x.quizResults.total, 0);
    accuracy = totalAsked > 0 ? Math.round((totalRight / totalAsked) * 100) + "%" : "—";
  }

  document.getElementById("statSessions").textContent = allSessions.length;
  document.getElementById("statCards").textContent = totalCards;
  document.getElementById("statCardsSub").textContent = dueCards > 0 ? `${dueCards} due for review` : "All caught up ✓";
  document.getElementById("statAccuracy").textContent = accuracy;
  document.getElementById("statAccuracySub").textContent = `${completedQuizzes.length} quizzes taken`;
  document.getElementById("statStreak").textContent = calculateStreak();

  document.getElementById("totalQuizQ").textContent = `${allSessions.reduce((s, x) => s + (x.quiz?.length || 0), 0)} questions available`;
  document.getElementById("totalReviewC").textContent = `${dueCards} cards due · ${totalCards} total`;
}

function calculateStreak() {
  if (allSessions.length === 0) return 0;
  const days = new Set();
  allSessions.forEach(s => days.add(new Date(s.timestamp).toISOString().slice(0, 10)));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && cursor.toDateString() === new Date().toDateString()) {
      cursor.setDate(cursor.getDate() - 1);
    } else break;
    if (streak > 365) break;
  }
  return streak;
}

// ── SRS helpers ───────────────────────────────────────────────────────────────
function getDueCards() {
  const now = Date.now();
  const due = [];
  allSessions.forEach(session => {
    (session.flashcards || []).forEach((card, cardIdx) => {
      const key = `${session.id}:${cardIdx}`;
      const srs = srsData[key];
      if (!srs || srs.nextReview <= now) {
        due.push({ session, cardIdx, card, srs, key });
      }
    });
  });
  // Sort: never-reviewed first, then by nextReview ascending
  return due.sort((a, b) => {
    if (!a.srs && !b.srs) return 0;
    if (!a.srs) return -1;
    if (!b.srs) return 1;
    return a.srs.nextReview - b.srs.nextReview;
  });
}

function formatNextReview(srs) {
  if (!srs) return "New";
  const diff = srs.nextReview - Date.now();
  if (diff <= 0) return "Due now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(diff / 3600000);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.round(diff / 86400000)}d`;
}

// ── Due for review section ────────────────────────────────────────────────────
function renderDue() {
  const container = document.getElementById("dueSection");
  if (!container) return;
  const due = getDueCards();

  if (due.length === 0) {
    container.innerHTML = `
      <div class="due-header">
        <span class="due-title">🟢 All caught up</span>
        <span class="due-count">No cards due</span>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="due-header">
      <span class="due-title">⚡ Due for Review</span>
      <span class="due-count">${due.length} card${due.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="due-preview">
      ${due.slice(0, 3).map(d => `
        <div class="due-card-chip">
          <span class="due-chip-text">${escapeHtml(d.card.front.slice(0, 60))}${d.card.front.length > 60 ? "…" : ""}</span>
          <span class="due-chip-tag">${escapeHtml(d.session.domain)}</span>
        </div>
      `).join("")}
      ${due.length > 3 ? `<div class="due-card-chip due-more">+${due.length - 3} more</div>` : ""}
    </div>
    <button class="btn-review-due" id="startDueReviewBtn">
      Start Review (${due.length})
    </button>
  `;

  document.getElementById("startDueReviewBtn")?.addEventListener("click", () => {
    const dueNow = getDueCards();
    if (dueNow.length === 0) return;
    const fakeSession = {
      id: "due-review",
      title: `Due Review — ${dueNow.length} card${dueNow.length !== 1 ? "s" : ""}`,
      flashcards: dueNow.map(d => ({ ...d.card, _from: d.session.title, _key: d.key })),
    };
    startReview(fakeSession);
  });
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function renderHeatmap() {
  const grid = document.getElementById("heatmapGrid");
  grid.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = {};
  allSessions.forEach(s => {
    const key = new Date(s.timestamp).toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  });

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 365);

  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = counts[key] || 0;
    let lvl = "";
    if (count === 1) lvl = "l1";
    else if (count === 2) lvl = "l2";
    else if (count === 3) lvl = "l3";
    else if (count >= 4) lvl = "l4";

    const cell = document.createElement("div");
    cell.className = "heatmap-cell " + lvl;
    cell.title = `${key}: ${count} session${count !== 1 ? "s" : ""}`;
    grid.appendChild(cell);
  }

  const totalActiveDays = Object.keys(counts).length;
  document.getElementById("heatmapTotal").textContent = `${totalActiveDays} active days in last year`;
}

// ── Recent / All sessions ─────────────────────────────────────────────────────
function renderRecent() {
  const container = document.getElementById("recentSessions");
  const recent = allSessions.slice(0, 5);
  document.getElementById("recentCount").textContent = recent.length > 0 ? `Last ${recent.length}` : "";
  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-emoji">📚</div>
        <div class="empty-title">No sessions yet</div>
        <div>Open any learning page and click ⚡ Enable in the extension to generate your first set!</div>
      </div>`;
    return;
  }
  container.innerHTML = recent.map(s => renderSessionCard(s)).join("");
  attachSessionClicks();
}

function renderAllSessions(filter = "") {
  const container = document.getElementById("allSessions");
  let list = allSessions;
  if (filter) {
    const q = filter.toLowerCase();
    list = list.filter(s =>
      (s.title || "").toLowerCase().includes(q) ||
      (s.domain || "").toLowerCase().includes(q) ||
      (s.deck || "").toLowerCase().includes(q) ||
      (s.flashcards || []).some(c => (c.front + " " + c.back).toLowerCase().includes(q))
    );
  }
  document.getElementById("sessionsCount").textContent = `${list.length} of ${allSessions.length}`;
  if (list.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-emoji">🔍</div><div class="empty-title">No sessions match</div></div>`;
    return;
  }
  container.innerHTML = list.map(s => renderSessionCard(s, true)).join("");
  attachSessionClicks();
}

function renderStudyList() {
  const container = document.getElementById("studySessions");
  if (allSessions.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-emoji">⚡</div><div class="empty-title">Generate some sessions first</div></div>`;
    return;
  }
  container.innerHTML = allSessions.map(s => renderSessionCard(s, false, true)).join("");
  attachSessionClicks();
}

function renderSessionCard(s, withDelete = false, studyMode = false) {
  const date = new Date(s.timestamp);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const quizScore = s.quizResults?.completed
    ? `${Math.round((s.quizResults.correct / s.quizResults.total) * 100)}%`
    : null;

  // Count due cards for this session
  const now = Date.now();
  const sessionDue = (s.flashcards || []).filter((_, i) => {
    const srs = srsData[`${s.id}:${i}`];
    return !srs || srs.nextReview <= now;
  }).length;

  return `
    <div class="session-card" data-id="${s.id}">
      <div>
        <div class="s-title">${escapeHtml(s.title)}</div>
        <div class="s-meta">
          <div class="s-meta-item s-domain">🌐 ${escapeHtml(s.domain)}</div>
          <div class="s-meta-item">📅 ${dateStr} · ${timeStr}</div>
          <div class="s-meta-item">📝 ${s.quiz?.length || 0} Q · 🎴 ${s.flashcards?.length || 0} cards</div>
          ${sessionDue > 0 ? `<div class="s-meta-item" style="color: var(--amber)">⚡ ${sessionDue} due</div>` : `<div class="s-meta-item" style="color: var(--green)">✓ Caught up</div>`}
          ${quizScore ? `<div class="s-meta-item" style="color: var(--green)">✓ Quiz: ${quizScore}</div>` : ""}
        </div>
      </div>
      <div class="s-actions">
        <button class="s-btn primary" data-action="quiz" data-id="${s.id}">📝 Quiz</button>
        <button class="s-btn primary" data-action="review" data-id="${s.id}">🎴 Review</button>
        ${withDelete ? `<button class="s-btn" data-action="delete" data-id="${s.id}" style="color: var(--red);">⌫</button>` : ""}
      </div>
    </div>
  `;
}

function attachSessionClicks() {
  document.querySelectorAll(".s-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const session = allSessions.find(x => x.id === id);
      if (!session) return;
      if (btn.dataset.action === "quiz") startQuiz(session);
      if (btn.dataset.action === "review") startReview(session);
      if (btn.dataset.action === "delete") {
        if (confirm(`Delete session "${session.title}"?`)) {
          allSessions = allSessions.filter(x => x.id !== id);
          await chrome.storage.local.set({ sessions: allSessions });
          renderAll();
        }
      }
    });
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => renderAllSessions(input.value));
}

// ── Settings panel ────────────────────────────────────────────────────────────
function setupSettings() {
  const panel = document.getElementById("srsSettingsPanel");
  if (!panel) return;

  const fields = ["again", "hard", "good", "easy"];
  fields.forEach(f => {
    const el = document.getElementById(`srs_${f}`);
    if (!el) return;
    // Display current value in human-readable form
    const ms = srsSettings[f] ?? DEFAULT_SRS[f];
    el.value = msToInput(f, ms);
    el.addEventListener("change", async () => {
      srsSettings[f] = inputToMs(f, parseFloat(el.value) || defaultInputVal(f));
      await chrome.storage.local.set({ srsSettings });
    });
  });
}

function msToInput(rating, ms) {
  if (rating === "again" || rating === "hard") return Math.round(ms / 60000); // minutes
  return Math.round(ms / 86400000); // days
}

function inputToMs(rating, val) {
  if (rating === "again" || rating === "hard") return val * 60000;
  return val * 86400000;
}

function defaultInputVal(rating) {
  const defaults = { again: 1, hard: 10, good: 1, easy: 3 };
  return defaults[rating];
}

// ── Quiz modal ────────────────────────────────────────────────────────────────
function setupModals() {
  document.getElementById("quizClose").addEventListener("click", closeQuiz);
  document.getElementById("cardClose").addEventListener("click", closeReview);
  document.getElementById("quizModal").addEventListener("click", (e) => {
    if (e.target.id === "quizModal") closeQuiz();
  });
  document.getElementById("cardModal").addEventListener("click", (e) => {
    if (e.target.id === "cardModal") closeReview();
  });

  document.getElementById("quizNext").addEventListener("click", quizNext);
  document.getElementById("quizPrev").addEventListener("click", quizPrev);

  document.getElementById("studyAllQuizCard").addEventListener("click", () => {
    const allQuestions = allSessions.flatMap(s => (s.quiz || []).map(q => ({ ...q, _from: s.title })));
    if (allQuestions.length === 0) return alert("No quiz questions available yet.");
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
    startQuiz({ id: "mixed", title: "Mixed Quiz — All Sessions", quiz: shuffled });
  });

  document.getElementById("studyAllCardsCard").addEventListener("click", () => {
    const due = getDueCards();
    if (due.length > 0) {
      // Prioritise due cards in "review all"
      const fakeSession = {
        id: "due-review",
        title: `Due Review — ${due.length} card${due.length !== 1 ? "s" : ""}`,
        flashcards: due.map(d => ({ ...d.card, _from: d.session.title, _key: d.key })),
      };
      startReview(fakeSession);
    } else {
      const allCards = allSessions.flatMap(s => (s.flashcards || []).map(c => ({ ...c, _from: s.title })));
      if (allCards.length === 0) return alert("No flashcards available yet.");
      startReview({ id: "all-cards", title: "Review All Cards", flashcards: allCards.sort(() => Math.random() - 0.5) });
    }
  });

  document.getElementById("flashcard").addEventListener("click", flipCard);
  document.querySelectorAll(".rating-btn").forEach(b => {
    b.addEventListener("click", () => rateCard(b.dataset.rating));
  });

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("quizModal").classList.contains("active")) {
      if (e.key === "Escape") closeQuiz();
      if (e.key === "Enter") quizNext();
      if (["1","2","3","4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const opts = document.querySelectorAll("#quizBody .q-opt");
        if (opts[idx] && !opts[idx].classList.contains("locked")) opts[idx].click();
      }
    }
    if (document.getElementById("cardModal").classList.contains("active")) {
      if (e.key === "Escape") closeReview();
      if (e.key === " ") { e.preventDefault(); flipCard(); }
      if (currentReview?.flipped) {
        if (e.key === "1") rateCard("again");
        if (e.key === "2") rateCard("hard");
        if (e.key === "3") rateCard("good");
        if (e.key === "4") rateCard("easy");
      }
    }
  });
}

// ── Quiz logic ────────────────────────────────────────────────────────────────
function startQuiz(session) {
  currentQuiz = { session, idx: 0, answers: new Array(session.quiz.length).fill(null), completed: false };
  document.getElementById("quizTitle").textContent = session.title;
  document.getElementById("quizModal").classList.add("active");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { session, idx, answers } = currentQuiz;
  const total = session.quiz.length;
  document.getElementById("quizProgress").textContent = `Question ${idx + 1} of ${total}`;
  document.getElementById("quizProgressFill").style.width = ((idx + 1) / total * 100) + "%";

  const q = session.quiz[idx];
  const letters = ["A","B","C","D"];
  const chosen = answers[idx];

  document.getElementById("quizBody").innerHTML = `
    <div class="quiz-question">
      <div class="q-num">QUESTION ${idx + 1}${q._from ? " · FROM: " + escapeHtml(q._from) : ""}</div>
      <div class="q-body">${escapeHtml(q.question)}</div>
      <div class="q-opts">
        ${q.options.map((opt, i) => {
          let cls = "q-opt";
          if (chosen !== null) {
            cls += " locked";
            if (i === q.correct) cls += " correct";
            else if (i === chosen) cls += " wrong";
          }
          return `<div class="${cls}" data-idx="${i}">
            <div class="q-letter">${letters[i]}</div>
            <span>${escapeHtml(opt)}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll("#quizBody .q-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      if (opt.classList.contains("locked")) return;
      currentQuiz.answers[currentQuiz.idx] = parseInt(opt.dataset.idx);
      renderQuizQuestion();
    });
  });

  document.getElementById("quizPrev").disabled = idx === 0;
  document.getElementById("quizNext").textContent = idx === total - 1 ? "Finish ✓" : "Next →";
}

function quizNext() {
  if (!currentQuiz) return;
  if (currentQuiz.idx < currentQuiz.session.quiz.length - 1) {
    currentQuiz.idx++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function quizPrev() {
  if (!currentQuiz || currentQuiz.idx === 0) return;
  currentQuiz.idx--;
  renderQuizQuestion();
}

async function finishQuiz() {
  const { session, answers } = currentQuiz;
  const correct = answers.filter((a, i) => a === session.quiz[i].correct).length;
  const total = session.quiz.length;
  const pct = Math.round((correct / total) * 100);

  if (session.id !== "mixed") {
    const idx = allSessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      allSessions[idx].quizResults = { completed: true, correct, total, takenAt: Date.now() };
      await chrome.storage.local.set({ sessions: allSessions });
    }
  }

  document.getElementById("quizBody").innerHTML = `
    <div class="quiz-results">
      <div class="score-circle" style="--pct: ${pct}%; background: conic-gradient(${pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)"} 0%, ${pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)"} ${pct}%, var(--border) ${pct}%, var(--border) 100%);">
        <div class="score-text">${pct}%</div>
      </div>
      <div style="margin-bottom: 8px; font-size: 18px; color: var(--text); font-family: 'Syne',sans-serif;">${correct} / ${total} correct</div>
      <div class="score-label">${pct >= 80 ? "🎉 Excellent! You've mastered this." : pct >= 60 ? "👍 Solid work — review the misses." : "💪 Keep going — review and retry!"}</div>
      <button class="btn-primary" onclick="closeQuiz();renderAll();">Done</button>
    </div>
  `;
  document.getElementById("quizNext").style.display = "none";
  document.getElementById("quizPrev").style.display = "none";
}

function closeQuiz() {
  document.getElementById("quizModal").classList.remove("active");
  document.getElementById("quizNext").style.display = "";
  document.getElementById("quizPrev").style.display = "";
  currentQuiz = null;
  renderStats();
}

// ── Flashcard review with SRS ─────────────────────────────────────────────────
function startReview(session) {
  currentReview = { session, idx: 0, flipped: false, ratings: [] };
  document.getElementById("cardTitle").textContent = session.title;
  document.getElementById("cardModal").classList.add("active");
  renderCard();
}

function renderCard() {
  const { session, idx, flipped } = currentReview;
  const total = session.flashcards.length;
  const card  = session.flashcards[idx];

  document.getElementById("cardCounter").textContent = `Card ${idx + 1} of ${total}`;
  document.getElementById("cardProgressFill").style.width = ((idx + 1) / total * 100) + "%";

  // Show next review time above rating buttons
  const key = card._key || `${session.id}:${idx}`;
  const srs  = srsData[key];
  const nextEl = document.getElementById("cardNextReview");
  if (nextEl) nextEl.textContent = srs ? `Last rated: ${formatNextReview(srs)}` : "New card";

  const fc      = document.getElementById("flashcard");
  const sideLabel = document.getElementById("cardSide");
  const content   = document.getElementById("cardContent");
  const hint      = document.getElementById("cardHint");
  const actions   = document.getElementById("cardActions");

  if (!flipped) {
    fc.classList.remove("flipped");
    sideLabel.textContent = "FRONT" + (card._from ? " · " + card._from.toUpperCase() : "");
    content.className = "card-content";
    content.innerHTML = escapeHtml(card.front);
    hint.style.display = "";
    actions.style.display = "none";
  } else {
    fc.classList.add("flipped");
    sideLabel.textContent = "BACK";
    content.className = "card-content card-back";
    content.innerHTML = escapeHtml(card.back);
    hint.style.display = "none";
    actions.style.display = "flex";
  }
}

function flipCard() {
  if (!currentReview) return;
  currentReview.flipped = !currentReview.flipped;
  renderCard();
}

async function rateCard(rating) {
  if (!currentReview) return;

  const { session, idx } = currentReview;
  const card = session.flashcards[idx];

  // Determine SRS key — due-review sessions pass _key directly
  const key = card._key || `${session.id}:${idx}`;
  const interval = getInterval(rating);
  const nextReview = Date.now() + interval;
  const reps = (srsData[key]?.reps || 0) + 1;

  srsData[key] = { nextReview, interval, reps };
  await chrome.storage.local.set({ srsData });

  currentReview.ratings.push({ idx, rating });

  // Save cardsReviewed on real sessions (not virtual ones)
  if (session.id !== "due-review" && session.id !== "all-cards") {
    const si = allSessions.findIndex(s => s.id === session.id);
    if (si !== -1) {
      allSessions[si].cardsReviewed = allSessions[si].cardsReviewed || [];
      allSessions[si].cardsReviewed.push({ cardIdx: idx, rating, at: Date.now() });
      await chrome.storage.local.set({ sessions: allSessions });
    }
  }

  if (idx < session.flashcards.length - 1) {
    currentReview.idx++;
    currentReview.flipped = false;
    renderCard();
  } else {
    const total = currentReview.ratings.length;
    const easy  = currentReview.ratings.filter(r => r.rating === "easy").length;
    const good  = currentReview.ratings.filter(r => r.rating === "good").length;
    const hard  = currentReview.ratings.filter(r => r.rating === "hard").length;
    const again = currentReview.ratings.filter(r => r.rating === "again").length;
    document.getElementById("flashcard").innerHTML = `
      <div style="text-align:center; padding: 20px;">
        <div style="font-family:'Syne',sans-serif; font-size: 28px; font-weight:800; margin-bottom: 12px;">🎉 Review Complete!</div>
        <div style="color: var(--muted); margin-bottom: 24px;">You reviewed ${total} card${total !== 1 ? "s" : ""}</div>
        <div style="font-size: 14px; line-height: 2;">
          <div>😎 Easy: ${easy} &nbsp; 🙂 Good: ${good} &nbsp; 😐 Hard: ${hard} &nbsp; 😩 Again: ${again}</div>
        </div>
        <button class="btn-primary" style="margin-top: 24px;" onclick="closeReview();renderAll();">Done</button>
      </div>
    `;
    document.getElementById("cardActions").style.display = "none";
    document.getElementById("cardHint").style.display = "none";
  }
}

function closeReview() {
  document.getElementById("cardModal").classList.remove("active");
  currentReview = null;
  renderStats();
  renderDue();
}

// ── Export / Clear ────────────────────────────────────────────────────────────
function setupExports() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const data = JSON.stringify({ sessions: allSessions, srsData }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnforge-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("clearAllBtn").addEventListener("click", async () => {
    if (!confirm("Delete ALL sessions permanently? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? All your study history will be lost.")) return;
    allSessions = [];
    srsData = {};
    await chrome.storage.local.set({ sessions: [], srsData: {} });
    renderAll();
  });
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.closeQuiz   = closeQuiz;
window.closeReview = closeReview;
window.renderAll   = renderAll;

init();
