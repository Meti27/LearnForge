import FAQAccordion from "./components/FAQAccordion";
import ThemeToggle from "./components/ThemeToggle";

const INSTALL_URL = "/install";

export default function LandingPage() {
  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-icon">⚡</div>
              LearnForge
            </a>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#setup">Setup</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
            <div className="nav-actions">
              <ThemeToggle />
              <a href="/login" className="btn btn-ghost">Sign in</a>
              <a href={INSTALL_URL} className="btn btn-primary">Install free</a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Free · Groq AI · Works on any learning site
          </div>
          <h1>
            Everything you read, <span>turned into flashcards</span> — instantly
          </h1>
          <p>
            Open any lesson, doc, or article. Hit Generate. LearnForge builds a full deck of quiz
            questions and flashcards from the page in seconds — and pushes them straight to Anki.
          </p>
          <div className="hero-ctas">
            <a href={INSTALL_URL} className="btn btn-primary btn-lg">
              ⬇ Install for Chrome / Brave
            </a>
            <a href="/login" className="btn btn-ghost btn-lg">
              Sign in to Study Hub →
            </a>
          </div>
          <div className="trust-badges">
            <div className="trust-badge"><span className="trust-badge-icon">✓</span> Cards in under 10 seconds</div>
            <div className="trust-badge"><span className="trust-badge-icon">✓</span> Your key stays in your browser</div>
            <div className="trust-badge"><span className="trust-badge-icon">✓</span> Study history synced across devices</div>
            <div className="trust-badge"><span className="trust-badge-icon">✓</span> Chrome &amp; Brave</div>
          </div>
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <section className="features section-sm" id="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📄</div>
              <h3>Reads the page, skips the noise</h3>
              <p>LearnForge targets the actual content on any page — ignoring ads, navbars, and sidebars so every card contains something worth studying.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3>AI-generated in seconds</h3>
              <p>Powered by Groq — one of the fastest LLM APIs available. A complete study set: quiz questions and flashcards, in under 10 seconds.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎴</div>
              <h3>Lands straight in Anki</h3>
              <p>Cards are pushed directly to your Anki deck the moment generation finishes — ready for spaced repetition, no copy-pasting required.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Your Study Hub, everywhere</h3>
              <p>Sign in with Google to keep your full session history in sync. Revisit flashcards and retake quizzes from any device, any time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">How it works</div>
            <h2>Three taps. Zero friction.</h2>
            <p>No copy-pasting. No manually writing cards. You study — LearnForge handles the rest.</p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-num">1</div>
              <div>
                <h3>Land on a learning page</h3>
                <p>Open any lesson, article, or doc. TryHackMe, LeetCode, MDN, Coursera — if there&apos;s content on the page, LearnForge can work with it.</p>
              </div>
            </div>
            <div className="how-step">
              <div className="how-num">2</div>
              <div>
                <h3>Hit Generate Flashcards</h3>
                <p>Click the extension icon, pick your platform, name your deck, and press Generate. Groq reads the page and returns a structured study set in seconds.</p>
              </div>
            </div>
            <div className="how-step">
              <div className="how-num">3</div>
              <div>
                <h3>Review and retain</h3>
                <p>Cards drop straight into Anki. Sign in to keep your full session history in sync and revisit anything from the Study Hub on any device.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="section" style={{ paddingTop: 0 }} id="platforms">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Supported platforms</div>
            <h2>Built for where you already study</h2>
            <p>Pre-configured for the most popular learning platforms. Add any other domain in seconds from the extension popup.</p>
          </div>
          <div className="platforms-grid">
            <div className="platform-chip"><span className="platform-chip-icon">🔐</span> TryHackMe</div>
            <div className="platform-chip"><span className="platform-chip-icon">📦</span> HackTheBox</div>
            <div className="platform-chip"><span className="platform-chip-icon">🕷</span> PortSwigger</div>
            <div className="platform-chip"><span className="platform-chip-icon">🦊</span> MDN Web Docs</div>
            <div className="platform-chip"><span className="platform-chip-icon">💡</span> LeetCode</div>
            <div className="platform-chip"><span className="platform-chip-icon">🪟</span> Microsoft Learn</div>
            <div className="platform-chip"><span className="platform-chip-icon">🎓</span> Coursera</div>
            <div className="platform-chip add-any"><span className="platform-chip-icon">＋</span> Add any site</div>
          </div>
          <p style={{ marginTop: "20px", fontSize: "14px", color: "var(--gray-6)", textAlign: "center" }}>
            Type any domain (e.g. <code>udemy.com</code>) into the <strong>+Add</strong> field in the popup to add it instantly.
          </p>
        </div>
      </section>

      {/* ── SETUP GUIDE ── */}
      <section className="section" id="setup" style={{ background: "var(--gray-1)", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Setup guide</div>
            <h2>Up and running in under 5 minutes</h2>
            <p>Two apps to install and one free API key. No server, no GPU — it all runs in your browser.</p>
          </div>
          <div className="setup-grid">

            <div className="setup-card">
              <div className="setup-card-header">
                <div className="setup-num">1</div>
                <h3>Install Anki</h3>
              </div>
              <ul className="setup-steps">
                <li>
                  <span className="setup-step-num">1</span>
                  <span>Go to <strong>apps.ankiweb.net</strong> and download the installer for your operating system.</span>
                </li>
                <li>
                  <span className="setup-step-num">2</span>
                  <span>Install and open Anki. Let it finish its first-time setup before continuing.</span>
                </li>
              </ul>
              <div className="setup-note">Keep Anki open while using LearnForge — it must be running to receive cards.</div>
            </div>

            <div className="setup-card">
              <div className="setup-card-header">
                <div className="setup-num">2</div>
                <h3>Install AnkiConnect</h3>
              </div>
              <ul className="setup-steps">
                <li>
                  <span className="setup-step-num">1</span>
                  <span>In Anki: <strong>Tools → Add-ons → Get Add-ons</strong>. Enter code <code>2055492159</code> and restart.</span>
                </li>
                <li>
                  <span className="setup-step-num">2</span>
                  <span>Go to <strong>Tools → Add-ons → AnkiConnect → Config</strong> and add <code>chrome-extension://*</code> to <code>webCorsOriginList</code>.</span>
                </li>
                <li>
                  <span className="setup-step-num">3</span>
                  <span>Restart Anki one more time to apply the config change.</span>
                </li>
              </ul>
            </div>

            <div className="setup-card">
              <div className="setup-card-header">
                <div className="setup-num">3</div>
                <h3>Get a free Groq API key</h3>
              </div>
              <ul className="setup-steps">
                <li>
                  <span className="setup-step-num">1</span>
                  <span>Go to <strong>console.groq.com</strong> and create a free account.</span>
                </li>
                <li>
                  <span className="setup-step-num">2</span>
                  <span>Click <strong>API Keys → Create API Key</strong>. Copy the key starting with <code>gsk_</code>.</span>
                </li>
                <li>
                  <span className="setup-step-num">3</span>
                  <span>Install LearnForge, open the popup, and paste your key into the <strong>AI Engine</strong> field.</span>
                </li>
              </ul>
              <div className="setup-note">Groq&apos;s free tier includes hundreds of requests per day — more than enough for regular study sessions.</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">FAQ</div>
            <h2>Questions &amp; answers</h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-section">
        <div className="container">
          <h2>Everything you read, remembered.</h2>
          <p>Generate flashcards from any page. Revisit sessions anywhere. Build knowledge that actually sticks.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={INSTALL_URL} className="btn btn-primary btn-lg" style={{ fontSize: "16px", padding: "14px 28px" }}>
              ⬇ Install LearnForge
            </a>
            <a href="/login" className="btn btn-ghost btn-lg" style={{ borderColor: "rgba(255,255,255,.25)", color: "rgba(255,255,255,.8)" }}>
              Sign in →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
