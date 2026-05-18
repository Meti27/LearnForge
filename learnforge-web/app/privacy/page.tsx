export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px", fontFamily: "Inter, sans-serif", color: "#171717", lineHeight: "1.7" }}>
      <a href="/" style={{ color: "#6d28d9", fontSize: "14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>← Back to home</a>
      <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: "8px" }}>Privacy Policy</h1>
      <p style={{ fontSize: "14px", color: "#a3a3a3", marginBottom: "40px" }}>Last updated: May 2025</p>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>What we collect</h2>
        <p>When you sign in with Google, we store your Google account email address and display name to identify your account. We store the study sessions you generate — including flashcards, quiz questions, quiz results, and flashcard review ratings — in our database (Supabase, hosted in EU regions) so they can be accessed from any device.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>AI processing (Groq)</h2>
        <p>Page content is sent to Groq&apos;s API for AI-powered flashcard generation. Groq&apos;s API terms prohibit training on API request data. Your Groq API key is stored locally in the Chrome extension and is never sent to our servers.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Data access</h2>
        <p>Row Level Security is enforced on our database — you can only access your own data. We do not sell, rent, or share your data with third parties for any purpose.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Data deletion</h2>
        <p>You can delete your account and all associated data at any time by contacting us. Deleting your account permanently removes all your sessions from our database within 30 days.</p>
      </section>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Contact</h2>
        <p>For any privacy questions or deletion requests, email us at <strong>metushaga27@gmail.com</strong>.</p>
      </section>
    </main>
  );
}
