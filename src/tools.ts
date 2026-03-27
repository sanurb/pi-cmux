import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import * as workspace from "./workspace.js";
import { debug } from "./debug.js";

const MODULE = "tools";

type ActionHandler = (args: string[]) => string;

const ACTIONS: Record<string, ActionHandler> = {
  "ping": () => workspace.ping(),
  "capabilities": () => workspace.capabilities(),
  "tree": () => workspace.tree(),
  "identify": () => workspace.identify(),
  "list-workspaces": () => workspace.listWorkspaces(),
  "current-workspace": () => workspace.currentWorkspace(),
  "list-surfaces": (args) => workspace.listSurfaces(args[0]),
  "create-workspace": (args) => workspace.createWorkspace(args[0]),
  "select-workspace": (args) => {
    if (!args[0]) throw new Error("select-workspace requires a workspace ref (e.g. workspace:1)");
    return workspace.selectWorkspace(args[0]);
  },
  "open-split": (args) => {
    const dir = args[0] as "left" | "right" | "up" | "down";
    if (!["left", "right", "up", "down"].includes(dir)) {
      throw new Error("open-split requires direction: left, right, up, or down");
    }
    return workspace.openSplit(dir);
  },
  "focus-surface": (args) => {
    if (!args[0]) throw new Error("focus-surface requires a surface ref (e.g. surface:1)");
    return workspace.focusSurface(args[0]);
  },
};

const ALLOWED = Object.keys(ACTIONS);

export function register(pi: ExtensionAPI): void {
  debug(MODULE, "registering cmux tool");

  pi.registerTool({
    name: "cmux",
    label: "cmux",
    description: [
      "Interact with cmux workspaces. All discovery commands return JSON.",
      "",
      "Readiness:",
      "• ping — check if cmux is responsive",
      "• capabilities — list available methods and access mode",
      "",
      "Discovery (always do this before mutating):",
      "• tree — full window/workspace/pane/surface hierarchy",
      "• identify — which workspace/surface Pi is running in",
      "• list-workspaces — all workspaces",
      "• current-workspace — active workspace info",
      "• list-surfaces — surfaces in current workspace (optional: workspace ref as first arg)",
      "",
      "Mutating:",
      "• create-workspace — new workspace (optional: cwd path as first arg)",
      "• select-workspace — switch workspace (required: workspace ref as first arg)",
      "• open-split — split current pane (required: direction: left/right/up/down)",
      "• focus-surface — focus an existing surface (required: surface ref as first arg)",
    ].join("\n"),
    promptSnippet: "cmux: list, create, select workspaces; open splits; inspect layout (JSON output)",
    parameters: Type.Object({
      action: Type.String({
        description: `Action: ${ALLOWED.join(", ")}`,
      }),
      args: Type.Optional(Type.Array(Type.String(), {
        description: "Arguments for the action (see action descriptions)",
      })),
    }),

    async execute(_id, params) {
      const handler = ACTIONS[params.action];
      if (!handler) {
        return {
          content: [{
            type: "text" as const,
            text: `Unknown action: "${params.action}"\nAllowed: ${ALLOWED.join(", ")}`,
          }],
          details: { error: true },
        };
      }

      try {
        const result = handler(params.args || []);
        return {
          content: [{ type: "text" as const, text: result || "OK" }],
          details: { error: false },
        };
      } catch (e: any) {
        return {
          content: [{ type: "text" as const, text: e.message }],
          details: { error: true },
        };
      }
    },

    renderCall(args, theme) {
      const suffix = args.args?.length ? " " + args.args.join(" ") : "";
      return new Text(
        theme.fg("toolTitle", theme.bold("cmux")) +
          " " +
          theme.fg("accent", args.action) +
          theme.fg("dim", suffix),
        0,
        0,
      );
    },

    renderResult(result, _opts, theme) {
      const txt = result.content[0];
      const text = txt?.type === "text" ? txt.text : "";
      const isError = (result.details as any)?.error === true;
      const icon = isError ? theme.fg("error", "✗") : theme.fg("success", "✓");
      const lines = text.split("\n");
      const preview = lines.slice(0, 8).join("\n");
      const more = lines.length > 8 ? theme.fg("dim", `\n… ${lines.length - 8} more lines`) : "";
      return new Text(`${icon} ${preview}${more}`, 0, 0);
    },
  });
}
