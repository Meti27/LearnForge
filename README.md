# ⚡ LearnForge

![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-Compatible-FB542B?logo=brave&logoColor=white)
![Free](https://img.shields.io/badge/Cost-100%25%20Free-22c55e)
![Groq AI](https://img.shields.io/badge/AI-Groq-f55036)
![License](https://img.shields.io/badge/License-MIT-22c55e)

**Turn any learning page into Anki flashcards and quiz questions — automatically, in seconds, using Groq AI.**

Open a lesson. Click the ⚡ icon. LearnForge reads the page, generates flashcards and quiz questions, and pushes the cards directly into Anki. Sign in to sync your full study history to the web dashboard at [learn-forge-rho.vercel.app](https://learn-forge-rho.vercel.app).

---

## Who is this for?

LearnForge works for any text-based learning — not just computer science. It's been used for:

- Cybersecurity and ethical hacking (TryHackMe, HackTheBox, PortSwigger)
- Web development and programming (MDN, LeetCode, documentation sites)
- Cloud and Microsoft certifications (Microsoft Learn)
- University courses, online courses, textbook sites
- Medicine, law, biology, languages — anything with readable content

If the page has paragraphs, headings, and explanations, LearnForge can turn it into flashcards.

---

## What you need

| Dependency | What it does | Where to get it |
|------------|-------------|-----------------|
| **Anki** | Flashcard app — where your cards land | [apps.ankiweb.net](https://apps.ankiweb.net) |
| **AnkiConnect** | Plugin that lets LearnForge talk to Anki | Installed inside Anki — code `2055492159` |
| **Groq API key** | Free AI key — runs generation in the cloud | [console.groq.com](https://console.groq.com) |
| **LearnForge** | The browser extension itself | [Releases page](https://github.com/Meti27/LearnForge/releases/latest) |

---

## Installation

### Step 1 — Install Anki

Download Anki from **[apps.ankiweb.net](https://apps.ankiweb.net)** and install it. Launch it and complete the first-time setup.

> Keep Anki open while using LearnForge — it must be running to receive cards.

---

### Step 2 — Install AnkiConnect

Inside Anki:

1. Go to **Tools → Add-ons → Get Add-ons**
2. Enter code: **`2055492159`**
3. Click OK and restart Anki

Then add the extension to the AnkiConnect allowlist. Open the config from inside Anki: **Tools → Add-ons → select AnkiConnect → Config**, and make sure it includes:

```json
{
  "webCorsOriginList": [
    "chrome-extension://*",
    "http://localhost"
  ]
}
```

Restart Anki after saving.

---

### Step 3 — Get a free Groq API key

1. Go to **[console.groq.com](https://console.groq.com)** and create a free account
2. Click **API Keys → Create API Key**
3. Copy the key — it starts with `gsk_`

Groq's free tier includes hundreds of requests per day, more than enough for regular study sessions. Your key is stored only in your browser — it never leaves your device.

---

### Step 4 — Load the extension

1. Download the latest release ZIP from the [releases page](https://github.com/Meti27/LearnForge/releases/latest) and unzip it
2. Open Chrome or Brave and go to `chrome://extensions`
3. Toggle on **Developer mode** (top-right corner)
4. Click **Load unpacked**
5. Select the unzipped `learnforge-extension` folder
6. Click the puzzle-piece icon in your toolbar → pin LearnForge so the ⚡ icon stays visible

---

### Step 5 — Add your Groq API key

1. Click the ⚡ LearnForge icon in your toolbar
2. Paste your Groq key into the **AI Engine** field at the top of the popup
3. Click **Save** — the status shows "Key saved ✓"

---

## How to use

1. Open Anki (it must be running to receive cards)
2. Navigate to any learning page and scroll through it to fully load the content
3. Click the ⚡ LearnForge icon in your toolbar
4. Select your platform from the grid (it auto-detects most sites)
5. Set your Anki deck name (default: `LearnForge`)
6. Click **⚡ Enable**

Generation takes under 10 seconds. Cards drop straight into Anki when it finishes. You can answer the inline quiz right in the popup, or open the full **Study Dashboard** to review flashcards and track your history.

---

## Cloud sync (optional)

Sign in with Google to sync your full session history to the web dashboard:

1. Click **Sign in** in the extension popup
2. Authenticate with Google
3. Your future sessions sync automatically — access them at [learn-forge-rho.vercel.app/dashboard](https://learn-forge-rho.vercel.app/dashboard)

The extension always saves locally first and works offline without an account.

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
| "No API key saved" | Open the popup, paste your Groq key into the AI Engine field, and click Save |
| "AnkiConnect unreachable" | Make sure Anki is open. Check AnkiConnect is installed (code `2055492159`). Check the config includes `chrome-extension://*` |
| "Not enough content scraped" | Scroll down the page to fully load it, then click Enable again |
| Cards not appearing in Anki | Check the deck name matches exactly. Make sure you restarted Anki after installing AnkiConnect |
| Extension icon not visible | Click the puzzle-piece icon in the toolbar and pin LearnForge |
| Site not working | Add the domain manually via the **+Add** field in the popup |
| Sign in not working | Make sure you're using Chrome or Brave — the extension messaging API isn't available in other browsers |

Still stuck? [Open an issue](https://github.com/Meti27/LearnForge/issues) and describe what happened.

---

## Dashboard features

The built-in study dashboard (click **Open Study Dashboard** in the popup, or visit the web at [learn-forge-rho.vercel.app/dashboard](https://learn-forge-rho.vercel.app/dashboard)) includes:

- **Stats** — total sessions, flashcards generated, quiz accuracy, daily study streak
- **Activity heatmap** — 365-day view like a GitHub contributions graph
- **Session history** — searchable list of every page you've studied
- **Quiz mode** — full quiz with keyboard shortcuts (1/2/3/4 to answer, Enter to advance)
- **Flashcard review** — flip cards, rate Again / Hard / Good / Easy
- **Mixed mode** — quiz or review cards from all sessions shuffled together

---

## Adding a custom platform

To use LearnForge on any site not in the default list:

1. Click the ⚡ icon in your toolbar
2. Find the **+Add** input at the bottom of the platform grid
3. Type the domain name (e.g. `udemy.com`)
4. Click **+Add**

It saves permanently and auto-detects that domain from then on.

---

## Contributing

Pull requests are welcome. Good areas to contribute:

- Adding content selectors for new platforms in `content.js`
- Improving the AI prompt in `background.js`
- Dashboard features or UI improvements
- Bug fixes and error handling

Please open an issue first if you're planning something large.

---

## License

MIT — free to use, modify, and share.
