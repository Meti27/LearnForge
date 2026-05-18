# LearnForge — AI Setup Assistant Prompt

**What is this?**
This file contains a prompt you can paste into any free AI assistant (Claude, ChatGPT, Gemini, Copilot). The AI will guide you through the full LearnForge setup — one step at a time, in plain language — and help you fix any errors you run into.

**Before you copy:** fill in the two blanks marked `[FILL IN: ...]` — your operating system, and optionally your preferred language.

---

## Free AI assistants you can use

| Assistant | Where to find it | Notes |
|-----------|-----------------|-------|
| **Claude** | claude.ai | Free tier available |
| **ChatGPT** | chat.openai.com | Free tier available |
| **Gemini** | gemini.google.com | Free, sign in with Google |
| **Copilot** | copilot.microsoft.com | Free, sign in with Microsoft |

---

## Tips before you start

- Fill in `[FILL IN: Windows / Mac / Linux]` with your operating system before copying
- Copy the entire prompt — from "I need help" all the way to the last line
- Paste any error messages you get directly into the chat — the AI can help interpret them
- You can ask the AI to slow down, re-explain, or repeat any step

---

## The prompt — copy everything below this line

```
I need help setting up a Chrome extension called LearnForge. My operating system is: [FILL IN: Windows / Mac / Linux].

Please act as my personal setup guide. Walk me through the setup one step at a time. Do not give me all the steps at once — give me step 1, wait for me to confirm it is done, then give me step 2, and so on. Use friendly, simple language — I am not a programmer and I may have never opened a terminal before. If a step involves typing a command, show me exactly what to type, nothing more.

Here is what I need to set up:

STEP 1 — Install Anki
Anki is the flashcard app. I need to download and install it from apps.ankiweb.net. Guide me through opening the site, downloading the right version for my operating system, and installing it like a normal app.

STEP 2 — Install AnkiConnect inside Anki
AnkiConnect is a plugin that lets LearnForge talk to Anki. I need to:
- Open Anki and go to Tools → Add-ons → Get Add-ons
- Enter this code: 2055492159
- Restart Anki when it asks me to
- Open the AnkiConnect config (Tools → Add-ons → select AnkiConnect → Config)
- Add "chrome-extension://*" to the webCorsOriginList so it looks like this:
  {
    "webCorsOriginList": [
      "chrome-extension://*",
      "http://localhost"
    ]
  }
- Restart Anki again

The config file is also stored on disk. The paths are:
- Windows: C:\Users\[username]\AppData\Roaming\Anki2\addons21\2055492159\config.json
- Mac: ~/Library/Application Support/Anki2/addons21/2055492159/config.json
- Linux: ~/.local/share/Anki2/addons21/2055492159/config.json

STEP 3 — Install Ollama
Ollama is a free tool that runs the AI on my own computer. I need to:
- Go to ollama.com and download the installer for my operating system
- Install it like a normal app
- Open a terminal and run this command to download the AI model (it is about 5 GB):
  ollama pull qwen2.5:7b

STEP 4 — Start the Ollama AI server
Ollama needs to be running whenever I use LearnForge. I need to start it with a special setting that lets the browser extension talk to it:

On Mac or Linux, I run this in the terminal:
  OLLAMA_ORIGINS="*" ollama serve

On Windows, I need to set an environment variable first:
- Open System Properties → Environment Variables
- Under "User variables", click New
- Variable name: OLLAMA_ORIGINS
- Variable value: *
- Click OK, then open Command Prompt and run: ollama serve

Help me understand how to keep it running in the background while I use the browser.

STEP 5 — Load the LearnForge extension in Chrome or Brave
I need to:
- Download the LearnForge ZIP file from the GitHub releases page and unzip it
- Open Chrome or Brave and go to: chrome://extensions
- Turn on "Developer mode" (toggle switch in the top-right corner)
- Click "Load unpacked" and select the folder called "learnforge-extension" from inside the unzipped folder
- Pin the extension to the toolbar by clicking the puzzle-piece icon and pinning LearnForge

---

After I have finished all 5 steps, tell me how to do a quick test to confirm everything is working: open Anki, make sure Ollama is running, go to any webpage, click the LearnForge icon, and click Enable.

If at any point I paste an error message, please:
1. Explain what the error means in plain language
2. Tell me exactly what to do to fix it
3. Confirm I should try the step again

If I ask, please respond in [FILL IN: your preferred language, e.g. Spanish, French, Arabic — or delete this line to keep English].

Please start by asking me which step I would like to begin with.
```

---

## After setup — quick test checklist

Once the AI has walked you through all five steps, use this checklist to confirm everything is working:

- [ ] Anki is open and you can see the main Anki window
- [ ] AnkiConnect is installed (you can see it listed under Tools → Add-ons)
- [ ] Ollama is running (the LearnForge popup shows a green dot next to "Ollama · qwen2.5:7b")
- [ ] The ⚡ LearnForge icon is visible in your browser toolbar
- [ ] You can open a learning page, click Enable, and see cards appear in Anki

If any of these don't work, paste the error into the AI chat and it will help you fix it.
