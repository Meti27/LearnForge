// dashboard.js — LearnForge Study Dashboard

let allSessions = [];
let currentQuiz = null;
let currentReview = null;

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const data = await chrome.storage.local.get(["sessions"]);
  allSessions = data.sessions || [];
  renderAll();
  setupTabs();
  setupSearch();
  setupModals();
  setupExports();
}

function renderAll() {
  renderStats();
  renderHeatmap();
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
  const totalAnki = allSessions.reduce((s, x) => s + (x.addedToAnki || 0), 0);

  // Quiz accuracy
  const completedQuizzes = allSessions.filter(s => s.quizResults?.completed);
  let accuracy = "—";
  if (completedQuizzes.length > 0) {
    const totalRight = completedQuizzes.reduce((s, x) => s + x.quizResults.correct, 0);
    const totalAsked = completedQuizzes.reduce((s, x) => s + x.quizResults.total, 0);
    accuracy = totalAsked > 0 ? Math.round((totalRight / totalAsked) * 100) + "%" : "—";
  }

  // Streak
  const streak = calculateStreak();

  document.getElementById("statSessions").textContent = allSessions.length;
  document.getElementById("statCards").textContent = totalCards;
  document.getElementById("statCardsSub").textContent = `${totalAnki} pushed to Anki`;
  document.getElementById("statAccuracy").textContent = accuracy;
  document.getElementById("statAccuracySub").textContent = `${completedQuizzes.length} quizzes taken`;
  document.getElementById("statStreak").textContent = streak;

  document.getElementById("totalQuizQ").textContent = `${allSessions.reduce((s, x) => s + (x.quiz?.length || 0), 0)} questions available`;
  document.getElementById("totalReviewC").textContent = `${totalCards} cards in pool`;
}

function calculateStreak() {
  if (allSessions.length === 0) return 0;
  const days = new Set();
  allSessions.forEach(s => {
    const d = new Date(s.timestamp);
    days.add(d.toISOString().slice(0, 10));
  });
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && cursor.toDateString() === new Date().toDateString()) {
      // No activity today — check yesterday
      cursor.setDate(cursor.getDate() - 1);
    } else break;
    if (streak > 365) break;
  }
  return streak;
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function renderHeatmap() {
  const grid = document.getElementById("heatmapGrid");
  grid.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build count map
  const counts = {};
  allSessions.forEach(s => {
    const d = new Date(s.timestamp);
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  });

  // 365 days = 53 weeks of 7 days
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

  return `
    <div class="session-card" data-id="${s.id}">
      <div>
        <div class="s-title">${escapeHtml(s.title)}</div>
        <div class="s-meta">
          <div class="s-meta-item s-domain">🌐 ${escapeHtml(s.domain)}</div>
          <div class="s-meta-item">📅 ${dateStr} · ${timeStr}</div>
          <div class="s-meta-item">📝 ${s.quiz?.length || 0} Q · 🎴 ${s.flashcards?.length || 0} cards</div>
          ${quizScore ? `<div class="s-meta-item" style="color: var(--green)">✓ Last score: ${quizScore}</div>` : ""}
          ${s.addedToAnki ? `<div class="s-meta-item">→ Anki: ${s.addedToAnki}</div>` : ""}
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

  // Mixed quiz mode
  document.getElementById("studyAllQuizCard").addEventListener("click", () => {
    const allQuestions = allSessions.flatMap(s => (s.quiz || []).map(q => ({ ...q, _from: s.title })));
    if (allQuestions.length === 0) return alert("No quiz questions available yet.");
    // Shuffle and take up to 20
    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
    startQuiz({ id: "mixed", title: "Mixed Quiz — All Sessions", quiz: shuffled });
  });

  // Review all
  document.getElementById("studyAllCardsCard").addEventListener("click", () => {
    const allCards = allSessions.flatMap(s => (s.flashcards || []).map(c => ({ ...c, _from: s.title })));
    if (allCards.length === 0) return alert("No flashcards available yet.");
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    startReview({ id: "all-cards", title: "Review All Cards", flashcards: shuffled });
  });

  // Flashcard flip
  document.getElementById("flashcard").addEventListener("click", flipCard);
  document.querySelectorAll(".rating-btn").forEach(b => {
    b.addEventListener("click", () => rateCard(b.dataset.rating));
  });

  // Keyboard shortcuts inside quiz
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
  currentQuiz = {
    session,
    idx: 0,
    answers: new Array(session.quiz.length).fill(null),
    completed: false,
  };
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
      const i = parseInt(opt.dataset.idx);
      currentQuiz.answers[currentQuiz.idx] = i;
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

  // Save results (only for real sessions, not mixed mode)
  if (session.id !== "mixed") {
    const idx = allSessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      allSessions[idx].quizResults = { completed: true, correct, total, takenAt: Date.now() };
      await chrome.storage.local.set({ sessions: allSessions });
    }
  }

  document.getElementById("quizBody").innerHTML = `
    <div class="quiz-results">
      <div class="score-circle" style="--pct: ${pct}%; background: conic-gradient(${pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'} 0%, ${pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'} ${pct}%, var(--border) ${pct}%, var(--border) 100%);">
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

// ── Flashcard review ──────────────────────────────────────────────────────────
function startReview(session) {
  currentReview = {
    session,
    idx: 0,
    flipped: false,
    ratings: [],
  };
  document.getElementById("cardTitle").textContent = session.title;
  document.getElementById("cardModal").classList.add("active");
  renderCard();
}

function renderCard() {
  const { session, idx, flipped } = currentReview;
  const total = session.flashcards.length;
  const card = session.flashcards[idx];

  document.getElementById("cardCounter").textContent = `Card ${idx + 1} of ${total}`;
  document.getElementById("cardProgressFill").style.width = ((idx + 1) / total * 100) + "%";

  const fc = document.getElementById("flashcard");
  const sideLabel = document.getElementById("cardSide");
  const content = document.getElementById("cardContent");
  const hint = document.getElementById("cardHint");
  const actions = document.getElementById("cardActions");

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
  currentReview.ratings.push({ idx: currentReview.idx, rating });

  // Save ratings to session (for real session, not "all cards")
  if (currentReview.session.id !== "all-cards") {
    const idx = allSessions.findIndex(s => s.id === currentReview.session.id);
    if (idx !== -1) {
      allSessions[idx].cardsReviewed = allSessions[idx].cardsReviewed || [];
      allSessions[idx].cardsReviewed.push({
        cardIdx: currentReview.idx,
        rating,
        at: Date.now(),
      });
      await chrome.storage.local.set({ sessions: allSessions });
    }
  }

  if (currentReview.idx < currentReview.session.flashcards.length - 1) {
    currentReview.idx++;
    currentReview.flipped = false;
    renderCard();
  } else {
    // Done
    const total = currentReview.ratings.length;
    const easy = currentReview.ratings.filter(r => r.rating === "easy").length;
    const good = currentReview.ratings.filter(r => r.rating === "good").length;
    document.getElementById("flashcard").innerHTML = `
      <div style="text-align:center; padding: 20px;">
        <div style="font-family:'Syne',sans-serif; font-size: 28px; font-weight:800; margin-bottom: 12px;">🎉 Review Complete!</div>
        <div style="color: var(--muted); margin-bottom: 24px;">You reviewed ${total} cards</div>
        <div style="font-size: 14px; line-height: 1.8;">
          <div>😎 Easy: ${easy}</div>
          <div>🙂 Good: ${good}</div>
          <div>😐 Hard: ${currentReview.ratings.filter(r => r.rating === "hard").length}</div>
          <div>😩 Again: ${currentReview.ratings.filter(r => r.rating === "again").length}</div>
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
}

// ── Export / Clear ────────────────────────────────────────────────────────────
function setupExports() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const data = JSON.stringify(allSessions, null, 2);
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
    await chrome.storage.local.set({ sessions: [] });
    renderAll();
  });
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Expose functions used in inline onclick handlers
window.closeQuiz = closeQuiz;
window.closeReview = closeReview;
window.renderAll = renderAll;

init();
