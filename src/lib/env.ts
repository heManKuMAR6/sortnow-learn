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

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  return key.length >= 20;
}
