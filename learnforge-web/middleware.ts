import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/account"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: object) { response.cookies.set({ name, value, ...options } as any); },
        remove(name: string, options: object) { response.cookies.set({ name, value: "", ...options } as any); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isProtected = PROTECTED.some(p => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
