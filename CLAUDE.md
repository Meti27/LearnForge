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

The extension makes two local HTTP calls at runtime — both must be running:

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Ollama | `http://localhost:11434` | AI generation — requires model `qwen2.5:14b` pulled (`ollama pull qwen2.5:14b`) |
| AnkiConnect | `http://localhost:8765` | Pushing flashcards into Anki desktop — add-on code `2055492159` |

The popup's `checkOllamaStatus()` function pings `http://localhost:11434/api/tags` on open and checks specifically for `qwen2.5:14b` in the model list.

## Architecture

### Entry points

- **`popup.html` / `popup.js`** — the main extension UI (380px wide). Orchestrates the entire generate flow: tab detection → content scraping → Ollama call → AnkiConnect push → session storage.
- **`dashboard.html` / `dashboard.js`** — full-page study dashboard opened in a new tab. Reads sessions from `chrome.storage.local` and provides quiz + flashcard review modals.
- **`background.js`** — service worker. Only handles `chrome.alarms` (24-hour review reminders) and `chrome.notifications`. Receives `{ type: "SET_ALARM", deckName }` messages from the popup.
- **`content.js`** — injected into the active tab via `chrome.scripting.executeScript`. Scrapes meaningful text using a priority list of CSS selectors (`CONTENT_SELECTORS`) while skipping navigation noise (`SKIP_SELECTORS`). Returns `{ title, url, text, wordCount }` as the script result (not via `sendMessage`).

### Data flow

```
popup.js
  → executeScript(content.js)          # scrape active tab
  → callClaudeAPI(text, title)          # POST to Ollama /api/generate
  → pushToAnki(flashcards, deckName)    # POST to AnkiConnect localhost:8765
  → chrome.storage.local.set(sessions) # persist session object
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

`callClaudeAPI()` in `popup.js` (despite the name, it calls Ollama) sends a structured prompt capped at 12,000 characters of page text. It uses Ollama's `format: "json"` mode to force valid JSON output of `{ quiz, flashcards }`. The function then filters weak cards (front < 8 chars, back < 25 chars, bare single-word fronts).

### Adding a new supported platform

1. Add the domain to `host_permissions` in `manifest.json`.
2. Add platform-specific CSS selectors to `CONTENT_SELECTORS` in `content.js`.
3. Optionally add a default site entry to `DEFAULT_SITES` in `popup.js`.

## Key constraints

- **No `sendMessage` from content.js** — `content.js` returns its result directly as the script execution result (`result?.result`), not via messaging.
- **`chrome.storage.local` only** — no IndexedDB, no remote sync. All state lives here.
- **MV3 service worker** — `background.js` has no persistent state between events; store anything that must survive in `chrome.storage.local`.
- **CSP** — inline event handlers (`onclick=`) are present in dashboard.html and work because there is no restrictive CSP declared in the manifest for extension pages.
