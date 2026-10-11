import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/demo-session";
import { IDLE_COOKIE, IDLE_REFRESH_MS, idleCookieOptions, isIdle, isOpenPath, readActive, signActive } from "@/lib/idle";

const SB_COOKIE = /^sb-/;

/** Every request: keep the Supabase session fresh, and sign people out after a long idle spell. */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  let configured = false;
  try {
    const parsed = new URL(url);
    configured = (parsed.protocol === "https:" || parsed.protocol === "http:") && key.length >= 20;
  } catch {
    configured = false;
  }

  let response = NextResponse.next({ request });
  let signedIn: boolean;
  let supabase: ReturnType<typeof createServerClient> | null = null;

  if (configured) {
    supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    // Preview mode: the demo login cookie stands in for the Supabase session.
    signedIn = Boolean(request.cookies.get(DEMO_COOKIE)?.value);
  }

  const raw = request.cookies.get(IDLE_COOKIE)?.value;

  if (!signedIn) {
    // Nobody is signed in, so a leftover activity stamp must not count against the next sign-in.
    if (raw) response.cookies.delete(IDLE_COOKIE);
    return response;
  }

  const now = Date.now();
  const last = await readActive(raw);

  if (last !== null && isIdle(last, now)) {
    // Quiet for too long: end the session on the server, whatever the browser is doing.
    if (supabase) await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    for (const c of request.cookies.getAll()) {
      if (SB_COOKIE.test(c.name)) {
        request.cookies.delete(c.name);
        response.cookies.delete(c.name);
      }
    }
    request.cookies.delete(DEMO_COOKIE);
    request.cookies.delete(IDLE_COOKIE);

    const { pathname, search } = request.nextUrl;
    let out: NextResponse;
    if (pathname.startsWith("/api/")) {
      out = NextResponse.json({ error: "You were signed out after a long time away. Please sign in again.", idle: true }, { status: 401 });
    } else if (isOpenPath(pathname)) {
      out = NextResponse.next({ request });
    } else {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.search = `?reason=idle&next=${encodeURIComponent(pathname + search)}`;
      out = NextResponse.redirect(to);
    }
    // Carry over every cookie the sign-out cleared, and drop our own.
    response.cookies.getAll().forEach((c) => out.cookies.set(c));
    for (const c of request.cookies.getAll()) if (SB_COOKIE.test(c.name)) out.cookies.delete(c.name);
    out.cookies.delete(DEMO_COOKIE);
    out.cookies.delete(IDLE_COOKIE);
    return out;
  }

  // Still active. A first request after signing in stamps the cookie; a full page load refreshes it.
  const isPageLoad = request.headers.get("sec-fetch-dest") === "document" || (request.headers.get("accept") ?? "").includes("text/html");
  if (last === null || (isPageLoad && now - last > IDLE_REFRESH_MS)) {
    response.cookies.set(IDLE_COOKIE, await signActive(now), idleCookieOptions());
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
