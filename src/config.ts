import type { CmuxConfig, NotificationLevel } from "./types.js";

const VALID_LEVELS: ReadonlySet<string> = new Set(["all", "important", "none"]);

function parseNotificationLevel(raw: string | undefined): NotificationLevel {
  if (raw && VALID_LEVELS.has(raw)) return raw as NotificationLevel;
  return "all";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(raw: string | undefined): boolean {
  return raw === "1" || raw === "true";
}

/**
 * Reads `PI_CMUX_NOTIFY_LEVEL`, `PI_CMUX_DEBOUNCE_MS`,
 * `PI_CMUX_DEBUG`, and `PI_CMUX_STATUS` from the environment.
 */
export function loadConfig(): CmuxConfig {
  return {
    notificationLevel: parseNotificationLevel(process.env.PI_CMUX_NOTIFY_LEVEL),
    debounceMs: parsePositiveInt(process.env.PI_CMUX_DEBOUNCE_MS, 3000),
    debug: parseBool(process.env.PI_CMUX_DEBUG),
    statusEnabled: process.env.PI_CMUX_STATUS !== "0",
  };
}
