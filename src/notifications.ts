import type { CmuxConfig, NotificationLevel, WorkspaceIdentity } from "./types.js";
import * as transport from "./transport.js";
import { debug } from "./debug.js";

const MODULE = "notify";

let _level: NotificationLevel = "all";
let _debounceMs = 3_000;
let _lastNotifyAt = 0;

export function init(config: CmuxConfig): void {
  _level = config.notificationLevel;
  _debounceMs = config.debounceMs;
}

/**
 * Returns `true` if the user is focused on the surface where Pi is running.
 * Defaults to `false` (not focused) when detection fails — safer to over-notify
 * than to silently swallow an alert.
 */
export function isFocused(): boolean {
  try {
    const raw = transport.run("identify");
    const info: WorkspaceIdentity = JSON.parse(raw);
    return info.caller?.surface_ref === info.focused?.surface_ref;
  } catch {
    return false;
  }
}

export type NotifyImportance = "completion" | "needs-input";

/**
 * Sends a notification if policy allows.
 *
 * Checks in order: notification level → focus → debounce.
 * "important" level suppresses "completion" but allows "needs-input".
 */
export function notify(
  title: string,
  body: string,
  importance: NotifyImportance,
): boolean {
  if (_level === "none") {
    debug(MODULE, `suppressed (level=none): ${title}`);
    return false;
  }
  if (_level === "important" && importance === "completion") {
    debug(MODULE, `suppressed (level=important, importance=completion): ${title}`);
    return false;
  }

  if (isFocused()) {
    debug(MODULE, `suppressed (focused): ${title}`);
    return false;
  }

  const now = Date.now();
  if (now - _lastNotifyAt < _debounceMs) {
    debug(MODULE, `suppressed (debounce): ${title}`);
    return false;
  }

  _lastNotifyAt = now;
  transport.tryRun("notify", "--title", title, "--body", body);
  debug(MODULE, `sent: ${title} — ${body}`);
  return true;
}

/**
 * Marks the workspace tab as unread (visual badge).
 * Always fires regardless of {@link _level} — it's a non-interruptive hint.
 */
export function markUnread(): void {
  transport.tryRun("workspace-action", "--action", "mark-unread");
  debug(MODULE, "mark-unread");
}

export function markRead(): void {
  transport.tryRun("workspace-action", "--action", "mark-read");
  transport.tryRun("clear-notifications");
  debug(MODULE, "mark-read + clear-notifications");
}

export function clearNotifications(): void {
  transport.tryRun("clear-notifications");
}
