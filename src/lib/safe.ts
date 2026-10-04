/** Run a data read that must never take a page down. Logs the failure and returns the fallback. */
export async function safely<T>(work: Promise<T>, fallback: T, label = "read"): Promise<T> {
  try {
    return await work;
  } catch (error) {
    console.error(`[safe] ${label} failed:`, error instanceof Error ? error.message : error);
    return fallback;
  }
}
