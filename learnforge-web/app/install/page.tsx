import ThemeToggle from "@/app/components/ThemeToggle";

export default function InstallPage() {
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-icon">⚡</div>
              LearnForge
            </a>
            <div className="nav-actions" style={{ marginLeft: "auto" }}>
              <ThemeToggle />
              <a href="/login" className="btn btn-ghost">Sign in</a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "72px 0 48px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="eyebrow" style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px" }}>
            Get started
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: "16px" }}>
            Install LearnForge
          </h1>
          <p style={{ fontSize: "18px", color: "var(--gray-6)", maxWidth: "480px", margin: "0 auto 36px" }}>
            Four quick steps. No GPU, no server — just a free API key and two apps.
          </p>
          <a
            href="/learnforge-extension.zip"
            download
            className="btn btn-primary btn-lg"
            style={{ fontSize: "16px", padding: "14px 32px" }}
          >
            ⬇ Download Extension (.zip)
          </a>
          <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--gray-6)" }}>
            Chrome &amp; Brave · Free · No account required
          </p>
        </div>
      </section>

      {/* STEPS */}
      <section className="section">
        <div className="container" style={{ maxWidth: "720px" }}>

          {/* STEP 1 */}
          <div className="install-step">
            <div className="install-step-header">
              <div className="setup-num">1</div>
              <h2>Install Anki</h2>
            </div>
            <div className="install-step-body">
              <p>Anki is the flashcard app where your cards land. LearnForge pushes cards directly into it.</p>
              <ol className="install-list">
                <li>Go to <strong>apps.ankiweb.net</strong> and download Anki for your operating system.</li>
                <li>Install and open Anki. Let it finish first-time setup before continuing.</li>
              </ol>
              <div className="setup-note">Keep Anki open while using LearnForge — it must be running to receive cards.</div>
            </div>
          </div>

          <div className="install-divider" />

          {/* STEP 2 */}
          <div className="install-step">
            <div className="install-step-header">
              <div className="setup-num">2</div>
              <h2>Install AnkiConnect</h2>
            </div>
            <div className="install-step-body">
              <p>AnkiConnect is an Anki plugin that lets LearnForge push cards into your deck automatically.</p>
              <ol className="install-list">
                <li>Inside Anki: <strong>Tools → Add-ons → Get Add-ons</strong>. Enter code <code>2055492159</code> and restart Anki.</li>
                <li>
                  Go to <strong>Tools → Add-ons → AnkiConnect → Config</strong>.
                  Make sure <code>webCorsOriginList</code> includes <code>chrome-extension://*</code>:
                  <pre className="install-code">{`{
  "webCorsOriginList": [
    "chrome-extension://*",
    "http://localhost"
  ]
}`}</pre>
                </li>
                <li>Restart Anki one more time to apply the config change.</li>
              </ol>
            </div>
          </div>

          <div className="install-divider" />

          {/* STEP 3 */}
          <div className="install-step">
            <div className="install-step-header">
              <div className="setup-num">3</div>
              <h2>Get a free Groq API key</h2>
            </div>
            <div className="install-step-body">
              <p>Groq provides the AI that generates your flashcards. It&apos;s free and takes under a minute to set up.</p>
              <ol className="install-list">
                <li>Go to <strong>console.groq.com</strong> and create a free account.</li>
                <li>Click <strong>API Keys → Create API Key</strong>. Copy the key — it starts with <code>gsk_</code>.</li>
              </ol>
              <div className="setup-note">Groq&apos;s free tier gives you hundreds of requests per day — more than enough for regular study sessions. Your key stays in your browser only.</div>
            </div>
          </div>

          <div className="install-divider" />

          {/* STEP 4 */}
          <div className="install-step">
            <div className="install-step-header">
              <div className="setup-num">4</div>
              <h2>Load the extension</h2>
            </div>
            <div className="install-step-body">
              <ol className="install-list">
                <li>
                  <a href="/learnforge-extension.zip" download style={{ color: "var(--accent)", fontWeight: 600 }}>
                    Download the extension ZIP
                  </a>{" "}
                  and unzip it anywhere on your computer.
                </li>
                <li>Open Chrome or Brave and go to <code>chrome://extensions</code>.</li>
                <li>Toggle on <strong>Developer mode</strong> in the top-right corner.</li>
                <li>Click <strong>Load unpacked</strong> and select the unzipped <code>learnforge-extension</code> folder.</li>
                <li>Click the puzzle-piece icon in your toolbar and pin LearnForge so the ⚡ icon stays visible.</li>
                <li>Click the ⚡ icon → paste your Groq key into the <strong>AI Engine</strong> field → click <strong>Save</strong>.</li>
              </ol>
              <div className="setup-note" style={{ marginTop: "16px" }}>
                That&apos;s it — LearnForge is ready. Open any learning page, click the icon, and hit Generate.
              </div>
            </div>
          </div>

          <div className="install-divider" />

          {/* OPTIONAL: SIGN IN */}
          <div className="install-step">
            <div className="install-step-header">
              <div className="setup-num" style={{ background: "var(--gray-2)", color: "var(--gray-6)" }}>✦</div>
              <h2 style={{ color: "var(--gray-6)" }}>Optional — Sign in for cloud sync</h2>
            </div>
            <div className="install-step-body">
              <p style={{ color: "var(--gray-6)" }}>
                Click <strong>Sign in</strong> in the extension popup to connect your Google account.
                Your sessions will sync to the{" "}
                <a href="/dashboard" style={{ color: "var(--accent)" }}>web dashboard</a>{" "}
                so you can review flashcards and quiz results from any device.
                The extension works fully offline without an account.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* TROUBLESHOOTING */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: "720px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px" }}>Troubleshooting</h2>
          <div className="install-faq-list">
            {[
              { q: '"No API key saved"', a: 'Open the popup, paste your Groq key into the AI Engine field, and click Save.' },
              { q: '"AnkiConnect unreachable"', a: 'Make sure Anki is open. Check AnkiConnect is installed (code 2055492159). Make sure the config includes chrome-extension://*.' },
              { q: '"Not enough content scraped"', a: 'Scroll down the page to fully load it, then click Enable again.' },
              { q: 'Cards not appearing in Anki', a: 'Check the deck name matches exactly. Make sure you restarted Anki after installing AnkiConnect.' },
              { q: 'Extension icon not visible', a: 'Click the puzzle-piece icon in the Chrome toolbar and pin LearnForge.' },
              { q: 'Site not working', a: 'Add the domain manually via the +Add field in the popup — it works on any site.' },
            ].map(({ q, a }) => (
              <div key={q} className="install-faq-item">
                <div className="install-faq-q">{q}</div>
                <div className="install-faq-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-inner">
            <div className="footer-logo">
              <div className="nav-logo-icon" style={{ width: "26px", height: "26px", fontSize: "13px" }}>⚡</div>
              LearnForge
            </div>
            <div className="footer-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/login">Sign in</a>
            </div>
            <div className="footer-copy">© 2025 LearnForge</div>
          </div>
        </div>
      </footer>
    </>
  );
}
