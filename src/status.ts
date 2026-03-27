import type { AgentState, CmuxConfig, StatusDisplay } from "./types.js";
import * as transport from "./transport.js";
import { debug } from "./debug.js";

const MODULE = "status";
const STATUS_KEY = "pi_agent";

const DISPLAYS: Record<AgentState, StatusDisplay> = {
  running: { value: "Running", icon: "bolt.fill", color: "#4C8DFF" },
  idle: { value: "Idle", icon: "pause.circle.fill", color: "#8E8E93" },
  "needs-input": { value: "Needs input", icon: "bell.fill", color: "#4C8DFF" },
} as const;

let _current: AgentState = "idle";
let _enabled = true;

export function init(config: CmuxConfig): void {
  _enabled = config.statusEnabled;
}

export function currentState(): AgentState {
  return _current;
}

export function setState(state: AgentState): void {
  if (!_enabled) return;
  _current = state;
  const display = DISPLAYS[state];
  transport.tryRun(
    "set-status", STATUS_KEY, display.value,
    "--icon", display.icon,
    "--color", display.color,
  );
  clearBuiltinStatus();
  debug(MODULE, `state → ${state}`);
}

/** Sets a freeform activity label (e.g. "Reading ~/.zshrc") while keeping the running state. */
export function setActivity(description: string): void {
  if (!_enabled) return;
  transport.tryRun(
    "set-status", STATUS_KEY, description,
    "--icon", "bolt.fill",
    "--color", "#4C8DFF",
  );
  clearBuiltinStatus();
}

export function clear(): void {
  transport.tryRun("clear-status", STATUS_KEY);
  clearBuiltinStatus();
  _current = "idle";
  debug(MODULE, "status cleared");
}

/**
 * cmux ships a built-in `claude_code` status key that conflicts with ours.
 * Always clear it when we set our own to avoid duplicate sidebar entries.
 */
function clearBuiltinStatus(): void {
  transport.tryRun("clear-status", "claude_code");
}
