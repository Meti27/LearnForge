"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID!;

type Status = "loading" | "sending" | "success" | "no-extension" | "error";

export default function ExtensionLoginPage() {
  const [status, setStatus]     = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function sendTokenToExtension() {
      const supabase = getSupabaseBrowserClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setStatus("error");
        setErrorMsg("No session found. Please try signing in again.");
        return;
      }

      setStatus("sending");

      // Check Chrome extension API is available (only in Chrome with extension installed)
      if (!window.chrome?.runtime?.sendMessage) {
        setStatus("no-extension");
        return;
      }

      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type:         "AUTH_TOKEN",
          accessToken:  session.access_token,
          refreshToken: session.refresh_token,
          user:         session.user,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            setStatus("no-extension");
            setErrorMsg(chrome.runtime.lastError.message || "Extension not detected.");
            return;
          }
          if (response?.ok) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMsg(response?.error || "Unknown error from extension.");
          }
        }
      );
    }

    sendTokenToExtension();
  }, []);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>

        {status === "loading" && (
          <>
            <h2 className="auth-title">Completing sign in...</h2>
            <div className="auth-spinner" />
          </>
        )}

        {status === "sending" && (
          <>
            <h2 className="auth-title">Connecting to extension...</h2>
            <div className="auth-spinner" />
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="auth-title" style={{ color: "#22c55e" }}>You&apos;re signed in!</h2>
            <p className="auth-sub">
              You can close this tab and return to the LearnForge extension.
              Your future sessions will sync automatically.
            </p>
          </>
        )}

        {status === "no-extension" && (
          <>
            <h2 className="auth-title">Extension not found</h2>
            <p className="auth-sub">
              Make sure the LearnForge extension is installed and enabled in Chrome.
            </p>
            {errorMsg && <p className="auth-error">{errorMsg}</p>}
            <p className="auth-sub" style={{ marginTop: "12px" }}>
              You are still signed in on this website — visit your{" "}
              <a href="/dashboard">dashboard</a>.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="auth-title">Something went wrong</h2>
            <p className="auth-error">{errorMsg}</p>
            <a href="/login" className="btn-google" style={{ textDecoration: "none", display: "inline-block", marginTop: "12px" }}>
              Try again
            </a>
          </>
        )}
      </div>
    </main>
  );
}
