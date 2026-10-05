export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  } catch {
    return false;
  }
  return key.length >= 20;
}

/**
 * The local demo login is for development and previews. In production it is off unless
 * ALLOW_DEMO_MODE=1, so a deployment with missing keys can never fall back to a login
 * anyone can fake.
 */
export function isDemoEnabled(): boolean {
  if (isSupabaseConfigured()) return false;
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_MODE === "1";
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  return key.length >= 20;
}
