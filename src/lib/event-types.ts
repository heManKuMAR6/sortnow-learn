export type EventType = "scroll" | "click" | "view";

export type EventInput = {
  type: EventType;
  path: string;
  target: string | null;
  depth: number | null;
  createdAt: string;
};

export type StoredEvent = EventInput & {
  id: string;
  userId: string;
};
