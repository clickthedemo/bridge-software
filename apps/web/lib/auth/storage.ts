import type { AuthSession } from "./types";

const KEY = "bridge_session";

export const authStorage = {
  get(): AuthSession | null {
    try {
      const value = sessionStorage.getItem(KEY);
      return value ? JSON.parse(value) as AuthSession : null;
    } catch { return null; }
  },
  set(session: AuthSession) { sessionStorage.setItem(KEY, JSON.stringify(session)); },
  clear() { sessionStorage.removeItem(KEY); },
};

