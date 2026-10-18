import { createClient } from "@/lib/supabase/client";

// Show a social button only when it has been switched on in Supabase AND listed here,
// so nobody clicks a button that cannot work. Example: NEXT_PUBLIC_AUTH_PROVIDERS=google,github
export const AUTH_PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

/** Turn raw auth errors into something a person can act on. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "That sign-in option is not switched on yet. Please use email for now.";
  if (m.includes("rate limit")) return "Too many emails were sent just now. Wait a few minutes and try again.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("invalid login")) return "That email and password do not match.";
  if (m.includes("already registered")) return "That email already has an account. Try signing in.";
  if (m.includes("password should be")) return "Choose a password with at least 6 characters.";
  return message;
}

/**
 * Send the browser to the provider. It comes back through /auth/callback, then to `next`.
 * `extra` adds query values to the callback (e.g. lead=1 for a reel-drop unlock).
 * Returns a message to show when it could not start, or null.
 */
export async function startOAuth(
  provider: "google" | "github",
  next: string,
  extra: Record<string, string> = {},
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ next, ...extra });
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?${params.toString()}` },
    });
    return error ? friendlyAuthError(error.message) : null;
  } catch (caught) {
    return caught instanceof Error ? friendlyAuthError(caught.message) : "Could not start sign-in.";
  }
}
