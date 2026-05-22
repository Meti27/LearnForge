import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code   = url.searchParams.get("code");
  const source = url.searchParams.get("source");

  if (code) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (source === "extension" && data.session) {
      // Pass tokens in URL hash — hash is never sent to the server, only read client-side
      // background.js catches this tab via chrome.tabs.onUpdated and extracts the tokens
      const { access_token, refresh_token } = data.session;
      const dest = new URL("/auth/extension-login", url.origin);
      dest.hash = `access_token=${access_token}&refresh_token=${refresh_token}`;
      return NextResponse.redirect(dest.toString());
    }
  }

  if (source === "extension") {
    return NextResponse.redirect(new URL("/auth/extension-login", url.origin));
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
