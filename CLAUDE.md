# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LearnForge is a Manifest V3 Chrome/Brave extension. There is no build step, no package manager, and no test suite — all files are plain JavaScript loaded directly by the browser. The extension folder to load unpacked is `learnforge-extension/`.

## Loading / testing the extension

1. Open `chrome://extensions` with **Developer mode** on.
2. Click **Load unpacked** → select `learnforge-extension/`.
3. After any JS change, click the reload icon on the extension card (no rebuild needed).
4. Popup changes: re-open the popup. Dashboard changes: close and reopen the dashboard tab.

## External runtime dependencies

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Groq API | `https://api.groq.com` | AI generation — model `llama-3.3-70b-versatile`. User provides their own API key stored in `chrome.storage.local` as `groqApiKey`. |
| AnkiConnect | `http://localhost:8765` | Pushing flashcards into Anki desktop (optional) — add-on code `2055492159` |

Ollama was the original AI backend and is **no longer used**. All references to Ollama in `index.html` are stale and need updating.

## Architecture

### Entry points

- **`popup.html` / `popup.js`** — the main extension UI (380px wide). Orchestrates the generate flow: tab detection → PDF or webpage scraping → sends `GENERATE` message to background.js → receives result → session storage.
- **`dashboard.html` / `dashboard.js`** — full-page study dashboard opened in a new tab. Reads sessions from `chrome.storage.local` and provides quiz + flashcard review modals with full SRS.
- **`background.js`** — service worker. Handles the Groq API call (`handleGenerate`), `buildPrompt`, `pushToAnki`, `chrome.alarms` (24-hour review reminders), and `chrome.notifications`. Receives `{ type: "GENERATE", text, title, url, domain, deckName }` from popup.
- **`content.js`** — injected into the active tab via `chrome.scripting.executeScript`. Scrapes meaningful text using a priority list of CSS selectors (`CONTENT_SELECTORS`) while skipping navigation noise (`SKIP_SELECTORS`). Returns `{ title, url, text, wordCount }` as the script result (not via `sendMessage`).
- **`lib/pdf.min.js`** + **`lib/pdf.worker.min.js`** — PDF.js 3.11.174 bundled for PDF text extraction. Loaded in popup.html only.

### Data flow

```
popup.js
  → isPdfUrl(tab.url)?
      YES → extractPdfText(url)          # fetch + PDF.js parse in popup context
      NO  → executeScript(content.js)    # scrape active tab HTML
  → chrome.runtime.sendMessage(GENERATE, { text, title, url, domain, deckName })

background.js (handleGenerate)
  → buildPrompt(text, title)             # two-phase catalog prompt
  → fetch Groq API (llama-3.3-70b-versatile, streaming, max_tokens 8192)
  → pushToAnki(flashcards, deckName)     # POST to AnkiConnect localhost:8765 (optional)
  → chrome.storage.local.set(sessions)  # persist session object
  → notifyPopup(GENERATE_DONE)
  → chrome.runtime.sendMessage(SET_ALARM)
```

### Session storage schema

Sessions are stored as an array in `chrome.storage.local` under the key `sessions` (max 100, newest first):

```js
{
  id: "s_<timestamp>",
  title, url, domain, deck,
  timestamp,           // ms since epoch
  quiz: [{ question, options: [4], correct: 0-3 }],
  flashcards: [{ front, back }],
  quizResults: null | { completed, correct, total, takenAt },
  cardsReviewed: [{ cardIdx, rating, at }],
  addedToAnki: number,
}
```

### AI prompt

`buildPrompt()` in `background.js` sends a two-phase prompt (catalog → generate) capped at 12,000 characters of page text. Uses Groq's `response_format: { type: "json_object" }` to force valid JSON output of `{ quiz, flashcards }`. A system message instructs the model to always err on the side of more cards. Temperature is 0.4. The response is filtered for weak cards (front < 8 chars, back < 25 chars, bare single-word fronts).

### PDF support

`isPdfUrl(url)` in `popup.js` detects PDF tabs by checking the URL pathname for `.pdf`. `extractPdfText(url)` fetches the PDF bytes and uses PDF.js (bundled in `lib/`) to extract all text up to 60 pages. The extracted text flows into the same `GENERATE` message as a normal scrape result. Edge cases handled with explicit error messages: password-protected PDFs, image-only (scanned) PDFs, and local `file://` PDFs.

### Adding a new supported platform

1. Add the domain to `host_permissions` in `manifest.json`.
2. Add platform-specific CSS selectors to `CONTENT_SELECTORS` in `content.js`.
3. Optionally add a default site entry to `DEFAULT_SITES` in `popup.js`.

## Key constraints

- **No `sendMessage` from content.js** — `content.js` returns its result directly as the script execution result (`result?.result`), not via messaging.
- **`chrome.storage.local` only** — no IndexedDB, no remote sync. All state lives here.
- **MV3 service worker** — `background.js` has no persistent state between events; store anything that must survive in `chrome.storage.local`.
- **CSP** — inline event handlers (`onclick=`) are present in dashboard.html and work because there is no restrictive CSP declared in the manifest for extension pages.
- **PDF.js in popup context** — PDF.js runs in `popup.html` (a regular extension page), not in the service worker. The worker is referenced via `chrome.runtime.getURL('lib/pdf.worker.min.js')` and exposed via `web_accessible_resources` in the manifest.

## Changelog

All notable changes made across sessions. Newest first.

### 2026-05-25 (session 2)
- **Multi-provider AI** — popup now has Gemini / Groq tab selector. Keys stored separately as `geminiApiKey` and `groqApiKey`. `aiProvider` in `chrome.storage.local` tracks active choice. `background.js` routes to `callGemini()` or `callGroq()` accordingly. Gemini 2.0 Flash is the new default (free via aistudio.google.com). Both use streaming SSE. Groq kept for existing users. Anthropic intentionally not added yet — to be added when user has budget.

### 2026-05-25 (session 1)
- **PDF support** — `isPdfUrl` + `extractPdfText` added to `popup.js`. Detects `.pdf` URLs and uses PDF.js 3.11.174 (bundled in `lib/`) to extract text before handing off to the same Groq pipeline. Handles password-protected, image-only, and `file://` PDFs with specific error messages. `manifest.json` updated with `web_accessible_resources` for the PDF.js worker. `popup.html` loads `lib/pdf.min.js` before `popup.js`.
- **AI prompt overhaul** — `buildPrompt` in `background.js` rewritten to use a two-phase catalog approach. Added system message pushing the model to generate more cards. Removed conservative "skip trivial" language. Temperature raised 0.3 → 0.4.
- **Quiz letter color** — `.q-letter` in `popup.html` now has explicit `color: var(--text)` so A/B/C/D are readable on the dark purple background.
- **Architecture docs** — CLAUDE.md updated to reflect Groq (not Ollama), actual data flow, PDF support, and this changelog.
