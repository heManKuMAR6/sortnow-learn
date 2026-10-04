import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { EventInput, EventType } from "@/lib/event-types";
import { appendLocalEvent } from "@/lib/events-store";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function asEvent(body: unknown): EventInput | null {
  if (!body || typeof body !== "object") return null;
  const row = body as Record<string, unknown>;
  const type = row.type;
  if (type !== "scroll" && type !== "click" && type !== "view") return null;
  if (typeof row.path !== "string" || !row.path.startsWith("/") || row.path.length > 300) {
    return null;
  }
  let target: string | null = null;
  if (typeof row.target === "string") {
    target = row.target.slice(0, 200);
  } else if (row.target !== null && row.target !== undefined) {
    return null;
  }
  let depth: number | null = null;
  if (typeof row.depth === "number" && Number.isFinite(row.depth)) {
    depth = Math.max(0, Math.min(100, Math.round(row.depth)));
  } else if (row.depth !== null && row.depth !== undefined) {
    return null;
  }
  let createdAt = new Date().toISOString();
  if (typeof row.createdAt === "string" && !Number.isNaN(Date.parse(row.createdAt))) {
    createdAt = new Date(row.createdAt).toISOString();
  }
  const eventType: EventType = type;
  return { type: eventType, path: row.path, target, depth, createdAt };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const event = asEvent(json);
  if (!event) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const igVisit =
    event.path.startsWith("/ig") && (event.type === "view" || event.type === "scroll");
  if (!user && !igVisit) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (user?.mode === "supabase") {
    const supabase = await createClient();
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      type: event.type,
      path: event.path,
      target: event.target,
      depth: event.depth,
      created_at: event.createdAt,
    });
    if (error) {
      return NextResponse.json({ error: "Could not save that." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!user && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("events").insert({
        user_id: null,
        type: event.type,
        path: event.path,
        target: event.target,
        depth: event.depth,
        created_at: event.createdAt,
      });
      if (!error) return NextResponse.json({ ok: true });
    } catch {
      // Fall through to the file store.
    }
  }

  await appendLocalEvent(user?.id ?? "visitor", event);
  return NextResponse.json({ ok: true });
}
