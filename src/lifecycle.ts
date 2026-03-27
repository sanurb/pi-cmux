import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as status from "./status.js";
import * as notifications from "./notifications.js";
import { debug } from "./debug.js";

const MODULE = "lifecycle";

function describeToolUse(toolName: string, args: any): string {
  switch (toolName) {
    case "read":
      return `Reading ${shortenPath(args.path || "")}`;
    case "edit":
      return `Editing ${shortenPath(args.path || "")}`;
    case "write":
      return `Writing ${shortenPath(args.path || "")}`;
    case "bash": {
      const cmd = args.command || "";
      const first = cmd.split(/\s/)[0] || cmd;
      return `Running ${first.slice(0, 30)}`;
    }
    case "grep":
      return `Searching ${(args.pattern || "").slice(0, 30)}`;
    default:
      return `Using ${toolName}`;
  }
}

function shortenPath(p: string): string {
  const home = process.env.HOME || "";
  if (home && p.startsWith(home)) p = "~" + p.slice(home.length);
  const parts = p.split("/");
  if (parts.length > 3) return "…/" + parts.slice(-2).join("/");
  return p;
}

/** Tools that block on human input — treated like agent_end for attention purposes. */
const HUMAN_BLOCKING_TOOLS = new Set(["mcq"]);

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
      status.setState("needs-input");
      notifications.markUnread();

      if (!notifications.isFocused()) {
        notifications.notify(
          "Pi",
          `Needs input (${event.toolName})`,
          "needs-input",
        );
      }
      debug(MODULE, `tool_execution_start(${event.toolName}) → needs-input`);
    } else {
      const desc = describeToolUse(event.toolName, event.args);
      status.setActivity(desc);
    }
  });

  pi.on("agent_end", async () => {
    status.setState("needs-input");

    if (!notifications.isFocused()) {
      notifications.markUnread();

      const sessionName = pi.getSessionName();
      const body = sessionName
        ? `${sessionName} — waiting for input`
        : "Waiting for input";

      notifications.notify("Pi", body, "needs-input");
    }

    debug(MODULE, "agent_end → needs-input");
  });

  pi.on("session_shutdown", async () => {
    status.clear();
    notifications.clearNotifications();
    debug(MODULE, "session_shutdown → cleared");
  });
}
