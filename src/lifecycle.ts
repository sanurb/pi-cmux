import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as status from "./status.js";
import * as notifications from "./notifications.js";
import { debug } from "./debug.js";

const MODULE = "lifecycle";
const HUMAN_BLOCKING_TOOLS = new Set(["mcq"]);

function getString(value: any, key: string): string | undefined {
  return typeof value?.[key] === "string" ? value[key] : undefined;
}

function shortenPath(path: string): string {
  const home = process.env.HOME;
  const normalized = home && path.startsWith(home)
    ? `~${path.slice(home.length)}`
    : path;

  const parts = normalized.split("/");
  return parts.length > 3 ? `…/${parts.slice(-2).join("/")}` : normalized;
}

function describeRead(args: unknown): string {
  return `Reading ${shortenPath(getString(args, "path") ?? "")}`;
}

function describeEdit(args: unknown): string {
  return `Editing ${shortenPath(getString(args, "path") ?? "")}`;
}

function describeWrite(args: unknown): string {
  return `Writing ${shortenPath(getString(args, "path") ?? "")}`;
}

function describeBash(args: unknown): string {
  const command = getString(args, "command") ?? "";
  const firstToken = command.split(/\s+/)[0] ?? "";
  return `Running ${firstToken.slice(0, 30)}`;
}

function describeGrep(args: unknown): string {
  const pattern = getString(args, "pattern") ?? "";
  return `Searching ${pattern.slice(0, 30)}`;
}

const TOOL_DESCRIPTIONS = {
  read: describeRead,
  edit: describeEdit,
  write: describeWrite,
  bash: describeBash,
  grep: describeGrep,
} as const;

type KnownToolName = keyof typeof TOOL_DESCRIPTIONS;

function isKnownToolName(toolName: string): toolName is KnownToolName {
  return Object.hasOwn(TOOL_DESCRIPTIONS, toolName);
}

function describeToolUse(toolName: string, args: unknown): string {
  return isKnownToolName(toolName)
    ? TOOL_DESCRIPTIONS[toolName](args)
    : `Using ${toolName}`;
}

function notifyNeedsInput(pi: ExtensionAPI, reason?: string): void {
  status.setState("needs-input");
  notifications.markUnread();

  if (notifications.isFocused()) return;

  const sessionName = pi.getSessionName();
  const body = reason
    ? reason
    : sessionName
      ? `${sessionName} — waiting for input`
      : "Waiting for input";

  notifications.notify("Pi", body, "needs-input");
}

export function wire(pi: ExtensionAPI): void {
  debug(MODULE, "wiring lifecycle events");

  pi.on("session_start", async () => {
    notifications.clearNotifications();
    status.setState("idle");
    debug(MODULE, "session_start → idle");
  });

  pi.on("input", async () => {
    status.setState("idle");
    notifications.markRead();
    debug(MODULE, "input → idle, mark-read");
  });

  pi.on("agent_start", async () => {
    notifications.clearNotifications();
    status.setState("running");
    debug(MODULE, "agent_start → running");
  });

  pi.on("tool_execution_start", async (event) => {
    if (HUMAN_BLOCKING_TOOLS.has(event.toolName)) {
      notifyNeedsInput(pi, `Needs input (${event.toolName})`);
      debug(MODULE, `tool_execution_start(${event.toolName}) → needs-input`);
      return;
    }

    status.setActivity(describeToolUse(event.toolName, event.args));
  });

  pi.on("agent_end", async () => {
    notifyNeedsInput(pi);
    debug(MODULE, "agent_end → needs-input");
  });

  pi.on("session_shutdown", async () => {
    status.clear();
    notifications.clearNotifications();
    debug(MODULE, "session_shutdown → cleared");
  });
}