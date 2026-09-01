import { getSharedMockPhase3Client } from "./mock-client.ts";
import { HttpPhase3Client } from "./http-client.ts";
import type { Phase3Client } from "./types.ts";

export function getBridgeApiBase(): string | null {
  const value = process.env.NEXT_PUBLIC_BRIDGE_API_BASE?.trim();
  return value ? value : null;
}

export function getPhase3Client(): Phase3Client {
  const base = getBridgeApiBase();
  if (base) return new HttpPhase3Client(base);
  return getSharedMockPhase3Client();
}

export function isPhase3LiveApi(): boolean {
  return getBridgeApiBase() !== null;
}
