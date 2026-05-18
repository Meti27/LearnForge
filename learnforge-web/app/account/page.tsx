"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID!;

type ExtStatus = "checking" | "connected" | "not-installed";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail]           = useState<string | null>(null);
  const [name, setName]             = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [extStatus, setExtStatus]   = useState<ExtStatus>("checking");

  useEffect(() => {
    async function load() {
      const { data } = await getSupabaseBrowserClient().auth.getUser();
      setEmail(data.user?.email ?? null);
      setName(data.user?.user_metadata?.full_name ?? null);
    }
    load();
  }, []);

  useEffect(() => {
    if (!window.chrome?.runtime?.sendMessage) {
      setExtStatus("not-installed");
      return;
    }
    chrome.runtime.sendMessage(EXTENSION_ID, { type: "GET_AUTH_STATE" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setExtStatus("not-installed");
      } else {
        setExtStatus("connected");
      }
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/login");
  }

  return (
    <div className="account-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Account</h1>
          <p className="dash-subtitle">Your profile and settings</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="account-card">
        <div className="account-avatar">{name ? name[0].toUpperCase() : "?"}</div>
        <div className="account-info">
          {name  && <div className="account-name">{name}</div>}
          {email && <div className="account-email">{email}</div>}
        </div>
      </div>

      {/* Extension status */}
      <div className="account-section" style={{ marginBottom: "16px" }}>
        <h2 className="account-section-title">Chrome Extension</h2>
        {extStatus === "checking" && (
          <p className="account-section-desc">Checking for extension…</p>
        )}
        {extStatus === "connected" && (
          <div className="ext-status-row">
            <span className="ext-status-dot connected" />
            <span className="ext-status-text">Extension detected and connected</span>
          </div>
        )}
        {extStatus === "not-installed" && (
          <>
            <p className="account-section-desc">
              The LearnForge extension isn&apos;t detected in this browser. Install it to generate
              flashcards and sync your sessions here.
            </p>
            <div className="ext-install-steps">
              <div className="ext-install-step">
                <span className="ext-install-num">1</span>
                <span>Go to <code>chrome://extensions</code> in Chrome or Brave</span>
              </div>
              <div className="ext-install-step">
                <span className="ext-install-num">2</span>
                <span>Enable <strong>Developer mode</strong> (top-right toggle)</span>
              </div>
              <div className="ext-install-step">
                <span className="ext-install-num">3</span>
                <span>Click <strong>Load unpacked</strong> → select the <code>learnforge-extension</code> folder</span>
              </div>
              <div className="ext-install-step">
                <span className="ext-install-num">4</span>
                <span>Pin the ⚡ icon to your toolbar, then click <strong>Sign in with Google</strong> in the popup</span>
              </div>
            </div>
            <button className="btn-refresh-ext" onClick={() => window.location.reload()}>
              I installed it — check again
            </button>
          </>
        )}
      </div>

      {/* Sign out */}
      <div className="account-section">
        <h2 className="account-section-title">Sign out</h2>
        <p className="account-section-desc">
          Signs you out of the web dashboard. Your extension session stays active
          until you sign out from the popup.
        </p>
        <button className="btn-signout-web" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
