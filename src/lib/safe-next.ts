/**
 * A post-login return path. Only same-site paths are accepted: no other host, no
 * protocol-relative `//host`, no backslashes (browsers treat `/\host` as `//host`),
 * no control characters, and no dot-segment tricks that normalise into `//host`.
 * Arrays (repeated `?next=a&next=b`) use the first value.
 */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string" || v.length === 0 || v.length > 300) return fallback;
  if (!v.startsWith("/") || v.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(v)) return fallback;
  try {
    const url = new URL(v, "http://placeholder.invalid");
    if (url.origin !== "http://placeholder.invalid") return fallback;
    const normalised = url.pathname + url.search + url.hash;
    if (normalised.startsWith("//")) return fallback;
    return normalised;
  } catch {
    return fallback;
  }
}
