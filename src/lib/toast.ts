import type { IconName } from "@/lib/challenges";

export type ToastInput = {
  title: string;
  body?: string;
  icon?: IconName;
  /** A big number badge such as "+1". */
  badge?: string;
  tone?: "points" | "info";
};

export function toast(input: ToastInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastInput>("sn:toast", { detail: input }));
}

/** Local calendar day (YYYY-MM-DD) in the visitor's own timezone. */
export function localDay(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
