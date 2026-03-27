import * as transport from "./transport.js";
import { debug } from "./debug.js";

const MODULE = "workspace";

export function ping(): string {
  debug(MODULE, "ping");
  return transport.run("ping");
}

export function capabilities(): string {
  debug(MODULE, "capabilities");
  return transport.run("capabilities", "--json");
}

export function tree(): string {
  debug(MODULE, "tree");
  return transport.run("tree", "--json");
}

export function identify(): string {
  debug(MODULE, "identify");
  return transport.run("identify", "--json");
}

export function listWorkspaces(): string {
  debug(MODULE, "list-workspaces");
  return transport.run("list-workspaces", "--json");
}

export function currentWorkspace(): string {
  debug(MODULE, "current-workspace");
  return transport.run("current-workspace", "--json");
}

/** Uses the documented `list-surfaces` command (not `list-panes`). */
export function listSurfaces(workspace?: string): string {
  debug(MODULE, "list-surfaces", workspace);
  const args = ["list-surfaces", "--json"];
  if (workspace) args.push("--workspace", workspace);
  return transport.run(...args);
}

export function createWorkspace(cwd?: string): string {
  debug(MODULE, "new-workspace", cwd);
  const args = ["new-workspace"];
  if (cwd) args.push("--cwd", cwd);
  return transport.run(...args);
}

export function selectWorkspace(workspace: string): string {
  debug(MODULE, "select-workspace", workspace);
  return transport.run("select-workspace", "--workspace", workspace);
}

export function openSplit(direction: "left" | "right" | "up" | "down"): string {
  debug(MODULE, "new-split", direction);
  return transport.run("new-split", direction);
}

/**
 * Focuses an existing surface by ref.
 * Uses the documented `focus-surface` command.
 */
export function focusSurface(surface: string): string {
  debug(MODULE, "focus-surface", surface);
  return transport.run("focus-surface", "--surface", surface);
}

export const ALLOWED_ACTIONS = new Set([
  "ping",
  "capabilities",
  "tree",
  "identify",
  "list-workspaces",
  "current-workspace",
  "list-surfaces",
  "create-workspace",
  "select-workspace",
  "open-split",
  "focus-surface",
] as const);

export type WorkspaceAction = typeof ALLOWED_ACTIONS extends Set<infer T> ? T : never;
