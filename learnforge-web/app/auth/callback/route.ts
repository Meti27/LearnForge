import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code   = url.searchParams.get("code");
  const source = url.searchParams.get("source"); // "extension" when coming from popup

  if (code) {
    const supabase = getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (source === "extension") {
    return NextResponse.redirect(new URL("/auth/extension-login", url.origin));
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
