# ⚡ LearnForge

![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-Compatible-FB542B?logo=brave&logoColor=white)
![Free](https://img.shields.io/badge/Cost-100%25%20Free-22c55e)
![Local AI](https://img.shields.io/badge/AI-Runs%20Locally-8E75B2)
![License](https://img.shields.io/badge/License-MIT-22c55e)

**Turn any learning page into Anki flashcards and quiz questions — automatically, using AI that runs on your own computer.**

You open a lesson. You click the ⚡ icon. LearnForge reads the page, generates 10–15 flashcards and 5–10 quiz questions, and pushes the cards directly into Anki. Nothing leaves your computer. Nothing costs money.

---

## Who is this for?

LearnForge works for any text-based learning — not just computer science. Students have used it for:

- Cybersecurity and ethical hacking (TryHackMe, HackTheBox, PortSwigger)
- Web development and programming (MDN, LeetCode, documentation sites)
- Cloud and Microsoft certifications (Microsoft Learn)
- University courses, online courses, textbook sites
- Medicine, law, biology, languages, history — anything with readable content

If the page has paragraphs, headings, and explanations, LearnForge can turn it into flashcards.

---

## What you need to install

| Dependency | What it does | Where to get it |
|------------|-------------|-----------------|
| **Anki** | Flashcard app — where your cards are stored and reviewed | [apps.ankiweb.net](https://apps.ankiweb.net) |
| **AnkiConnect** | Plugin that lets LearnForge talk to Anki | Installed inside Anki — code `2055492159` |
| **Ollama** | Runs the AI model on your computer | [ollama.com](https://ollama.com) |
| **LearnForge** | The browser extension itself | [Releases page](https://github.com/YOUR_USERNAME/learnforge/releases/latest) |

> **New to terminals?** Use the [AI Setup Prompt](./SETUP_PROMPT.md) — paste it into any free AI (Claude, ChatGPT, Gemini) and it will walk you through everything one step at a time.

---

## Installation

### Step 1 — Install Anki

Download Anki from **[apps.ankiweb.net](https://apps.ankiweb.net)** and install it like a normal app. Launch it and complete the first-time setup.

---

### Step 2 — Install AnkiConnect

Inside Anki:

1. Go to **Tools → Add-ons → Get Add-ons**
2. Enter code: **`2055492159`**
3. Click OK and restart Anki

Then edit the AnkiConnect config to allow the extension to connect. Open the config file for your system:

**Windows:**
```
C:\Users\YOUR_NAME\AppData\Roaming\Anki2\addons21\2055492159\config.json
```

**Mac:**
```
~/Library/Application Support/Anki2/addons21/2055492159/config.json
```

**Linux:**
```
~/.local/share/Anki2/addons21/2055492159/config.json
```

Edit the file so it contains:

```json
{
  "webCorsOriginList": [
    "chrome-extension://*",
    "http://localhost"
  ]
}
```

Restart Anki after saving.

Alternatively, edit the config from inside Anki: **Tools → Add-ons → select AnkiConnect → Config**.

---

### Step 3 — Install Ollama and download the AI model

Download Ollama from **[ollama.com](https://ollama.com)** and install it. Then open a terminal and run:

```
ollama pull qwen2.5:7b
```

This downloads the AI model (~5 GB). It only needs to run once.

---

### Step 4 — Start the Ollama server

LearnForge talks to Ollama over a local connection. You need to start Ollama with browser access enabled.

**Mac / Linux:**
```
OLLAMA_ORIGINS="*" ollama serve
```

**Windows (Command Prompt):**

First, set the environment variable:
```
set OLLAMA_ORIGINS=*
```

Then start the server:
```
ollama serve
```

> Keep this terminal window open while you use LearnForge. Ollama must be running.

---

### Step 5 — Load the extension

1. Download the latest release ZIP from the [releases page](https://github.com/YOUR_USERNAME/learnforge/releases/latest) and unzip it
2. Open Chrome or Brave and go to `chrome://extensions`
3. Toggle on **Developer mode** (top-right corner)
4. Click **Load unpacked**
5. Select the `learnforge-extension` folder from inside the unzipped folder
6. Click the puzzle-piece icon in your toolbar → pin LearnForge so the ⚡ icon stays visible

---

## How to use

1. Open Anki and make sure Ollama is running (the LearnForge popup shows a green dot)
2. Navigate to any learning page and scroll through it to load the content
3. Click the ⚡ LearnForge icon in your toolbar
4. Select your platform from the grid (it auto-detects most sites)
5. Set your Anki deck name (default: `LearnForge`)
6. Click **⚡ Enable**
7. Watch the console as it scrapes → generates → pushes cards to Anki

After it finishes, you can answer the inline quiz questions right in the popup. Open the **Study Dashboard** to review flashcards, track your accuracy, and see your activity history.

---

## Supported platforms

| Platform | Use case |
|----------|----------|
| 🔐 TryHackMe | Cybersecurity rooms and tasks |
| 📦 HackTheBox | CTF challenges |
| 🕷 PortSwigger Web Academy | Web security labs |
| 🦊 MDN Web Docs | Web development reference |
| 💡 LeetCode | Algorithm problems |
| 🪟 Microsoft Learn | Cloud and dev certifications |
| 🎓 Coursera | Online courses |
| 🌐 Any site | Type a domain in the +Add field in the popup |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Red dot — "Ollama not running" | Open a terminal and run `OLLAMA_ORIGINS="*" ollama serve` (Mac/Linux) or set OLLAMA_ORIGINS=* then `ollama serve` (Windows) |
| Amber dot — "qwen2.5:7b not found" | Run `ollama pull qwen2.5:7b` in a terminal and wait for the download to finish |
| "AnkiConnect unreachable" | Make sure Anki is open. Check AnkiConnect is installed (code `2055492159`). Check the config includes `chrome-extension://*` |
| "Not enough content scraped" | Scroll down the page to fully load it, then click Enable again |
| Cards not appearing in Anki | Check the deck name matches exactly. Look for it in the Anki deck list. Make sure you restarted Anki after installing AnkiConnect |
| Extension icon not visible | Click the puzzle-piece icon in the toolbar and pin LearnForge |
| Site not working | Add the domain manually via the **+Add** field in the popup |

Still stuck? [Open an issue](https://github.com/YOUR_USERNAME/learnforge/issues) and describe what happened.

---

## Adding a custom platform

To use LearnForge on any site not in the default list:

1. Click the ⚡ icon in your toolbar
2. Find the **+Add** input at the bottom of the platform grid
3. Type the domain name (e.g. `udemy.com`)
4. Click **+Add**

It saves permanently and auto-detects that domain from that point on.

---

## Dashboard features

The built-in study dashboard (click **Open Study Dashboard** in the popup) includes:

- **Stats** — total sessions, flashcards generated, quiz accuracy, daily study streak
- **Activity heatmap** — 365-day view like a GitHub contributions graph
- **Session history** — searchable list of every page you've studied
- **Quiz mode** — full quiz with keyboard shortcuts (1/2/3/4 to answer, Enter to advance)
- **Flashcard review** — flip cards, rate Again / Hard / Good / Easy
- **Mixed mode** — quiz or review cards from all sessions shuffled together
- **JSON export** — download all your sessions as a file

---

## Contributing

Pull requests are welcome. Good areas to contribute:

- Adding content selectors for new platforms in `content.js`
- Improving the AI prompt in `popup.js`
- Dashboard features or UI improvements
- Bug fixes and error handling

Please open an issue first if you're planning something large.

---

## License

MIT — free to use, modify, and share. See [LICENSE](./LICENSE).
