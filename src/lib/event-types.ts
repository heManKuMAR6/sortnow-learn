export type EventType = "scroll" | "click" | "view" | "dwell" | "session";

export type EventInput = {
  type: EventType;
  path: string;
  target: string | null;
  depth: number | null;
  createdAt: string;
  /** One random id per browser tab session, so a visit can be followed page to page. */
  sessionId?: string | null;
  /** Where the person came from (the previous page, or the referring site on arrival). */
  referrer?: string | null;
  /** Seconds spent on the page (dwell events). */
  seconds?: number | null;
};

export type StoredEvent = EventInput & {
  id: string;
  userId: string;
};
