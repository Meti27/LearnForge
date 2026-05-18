# ⚡ LearnForge Extension

**Automatically turn any learning page into Anki flashcards and quiz questions.**

Open a lesson. Click Enable. Cards appear in Anki.

---

## What it does

1. **Reads the page** — extracts the meaningful content (headings, explanations, code blocks) and filters out menus, footers, and ads
2. **Generates flashcards** — uses a local AI (Ollama) to create 10–15 Anki-ready flashcards with full question-and-answer format
3. **Generates quiz questions** — 5–10 multiple choice questions you can answer right inside the popup
4. **Pushes to Anki** — adds the cards directly to your chosen Anki deck via AnkiConnect
5. **Sets a reminder** — sends a browser notification 24 hours later so you don't forget to review

The AI runs on your own computer — nothing is sent to the internet.

---

## Full setup guide

**→ [learnforge setup guide](https://YOUR_USERNAME.github.io/learnforge/#setup)**

The setup takes about 10 minutes and involves four things: Anki, AnkiConnect, Ollama, and loading this extension. The guide above walks through each step in plain language.

If you prefer, use the [AI Setup Prompt](https://github.com/YOUR_USERNAME/learnforge/blob/main/SETUP_PROMPT.md) — paste it into any free AI assistant (Claude, ChatGPT, Gemini) and it will guide you through everything one step at a time.

---

## Quick reference — what needs to be running

Before you click Enable, make sure these are all active:

| What | How to check |
|------|-------------|
| **Anki** is open | You can see the Anki window |
| **Ollama** is running | Green dot in the LearnForge popup |
| **The AI model** is downloaded | Run `ollama pull qwen2.5:7b` once if you haven't |

---

## Supported platforms

Works on any website. These are pre-configured out of the box:

| Platform | Use case |
|----------|----------|
| 🔐 TryHackMe | Cybersecurity rooms |
| 📦 HackTheBox | CTF challenges |
| 🕷 PortSwigger Web Academy | Web security labs |
| 🦊 MDN Web Docs | Web development reference |
| 💡 LeetCode | Algorithm problems |
| 🪟 Microsoft Learn | Cloud certifications |

**Any other site:** type the domain (e.g. `coursera.org`) into the **+Add** field in the popup.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Red dot — Ollama not running | Run `OLLAMA_ORIGINS="*" ollama serve` in a terminal |
| Amber dot — model not found | Run `ollama pull qwen2.5:7b` |
| AnkiConnect unreachable | Open Anki and check AnkiConnect is installed (code `2055492159`) |
| Not enough content scraped | Scroll the page to fully load it, then click Enable again |
| Site not supported | Add the domain via the +Add field |

---

## License

MIT — free to use and modify.
