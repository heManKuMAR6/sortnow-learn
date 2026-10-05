// Client-safe constants. The signing and parsing live in demo-session-server.ts.
export const DEMO_COOKIE = "sortnow_learn_demo";
export const DEMO_STORAGE_KEY = "sortnow-learn-demo-session";

export type DemoSession = {
  id: string;
  email: string;
  name?: string;
};
