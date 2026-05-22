"use client";
import { useEffect, useState } from "react";

type Status = "waiting" | "success" | "no-token";

export default function ExtensionLoginPage() {
  const [status, setStatus] = useState<Status>("waiting");

  useEffect(() => {
    // Check if the URL hash contains tokens (set by the callback route)
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);

    if (params.get("access_token")) {
      // Tokens are present — background.js will catch this tab, save tokens, and close it
      setStatus("success");
    } else {
      // No tokens — something went wrong upstream
      setStatus("no-token");
    }
  }, []);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>

        {status === "waiting" && (
          <>
            <h2 className="auth-title">Completing sign in...</h2>
            <div className="auth-spinner" />
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="auth-title" style={{ color: "#22c55e" }}>You&apos;re signed in!</h2>
            <p className="auth-sub">
              This tab will close automatically. Return to the LearnForge extension —
              your sessions will now sync across devices.
            </p>
            <p className="auth-sub" style={{ marginTop: "12px" }}>
              You can also visit your{" "}
              <a href="/dashboard" style={{ color: "var(--accent)" }}>web dashboard</a>.
            </p>
          </>
        )}

        {status === "no-token" && (
          <>
            <h2 className="auth-title">Something went wrong</h2>
            <p className="auth-sub">No session was found. Please try signing in again.</p>
            <a
              href="/login"
              className="btn-google"
              style={{ textDecoration: "none", display: "inline-block", marginTop: "12px" }}
            >
              Try again
            </a>
          </>
        )}
      </div>
    </main>
  );
}
