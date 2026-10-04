export function initialsFrom(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = displayName?.trim() ?? "";
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = firstLetter(parts[0]);
      const last = firstLetter(parts[parts.length - 1]);
      if (first && last) return `${first}${last}`;
    }
    const letter = firstLetter(name);
    if (letter) return letter;
  }

  const local = (email ?? "").split("@")[0] ?? "";
  const letter = firstLetter(local);
  return letter || "?";
}

function firstLetter(value: string): string {
  const match = value.match(/\p{L}/u);
  return match ? match[0].toUpperCase() : "";
}
