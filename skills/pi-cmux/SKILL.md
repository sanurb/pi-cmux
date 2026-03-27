---
name: pi-cmux
description: "Safe cmux workspace helpers for Pi — discover layout, create workspaces, select workspaces, open splits, focus surfaces, identify current context. All discovery returns JSON. Manages sidebar status and notifications automatically. Use when asked to: list or show workspaces, create a workspace, switch workspaces, split the view, check workspace layout, identify which workspace Pi is in, focus a surface, or interact with cmux layout. Triggers on: 'cmux', 'workspace', 'workspaces', 'split pane', 'new surface', 'open split', 'layout', 'which workspace', 'focus surface'. Does NOT support: sending text or keystrokes to terminals, reading terminal output, closing workspaces or surfaces, browser automation, or arbitrary cmux CLI passthrough."
---

# pi-cmux — Safe Workspace Helpers

A single `cmux` tool for **safe, discovery-and-create-only workspace operations**. All discovery actions return JSON. Sidebar status and notifications are fully automatic.

## Readiness

The extension uses `cmux ping` at startup — the documented readiness check. If cmux is not running or the socket is unreachable, the extension becomes a silent no-op.

Before any workspace operation, prefer this sequence:

```
cmux action="ping"                  # is cmux responsive?
cmux action="identify"              # where am I? (workspace, pane, surface, focused state)
cmux action="capabilities"          # which methods are available + access mode?
```

Environment variables cmux auto-sets inside its terminals:

| Variable | Purpose |
|----------|---------|
| `CMUX_WORKSPACE_ID` | UUID of the current workspace |
| `CMUX_SURFACE_ID` | UUID of the current surface |
| `CMUX_SOCKET_PATH` | Unix socket path (default `/tmp/cmux.sock`) |

These are helpful context but not the only way to operate — the CLI also accepts explicit `--socket`, `--workspace`, and `--surface` flags.

## cmux Hierarchy

Five levels. Refs like `workspace:1`, `pane:2`, `surface:3` identify objects in the CLI/API.

```
Window          — macOS window
  └─ Workspace  — sidebar entry, the unit you switch between
       └─ Pane  — split region within a workspace
            └─ Surface — tab within a pane
                 └─ Panel — content type: terminal or browser (internal, not targeted directly)
```

| Level | What it is | Env variable | Ref format |
|-------|-----------|--------------|------------|
| Workspace | Sidebar entry, groups panes | `CMUX_WORKSPACE_ID` | `workspace:N` |
| Pane | Split region inside a workspace | — | `pane:N` |
| Surface | Tab within a pane (terminal or browser) | `CMUX_SURFACE_ID` | `surface:N` |
| Panel | Rendered content inside a surface | — | not targeted directly |

A workspace is the outermost container you switch between. A surface is an individual terminal. Panes sit between them as the split geometry. Panel is internal — you interact with surfaces, not panels.

## Discovery First

Refs are ephemeral. Never hardcode or cache them across turns — always discover.

```
cmux action="identify"                              # current context (JSON)
cmux action="tree"                                  # full hierarchy (JSON)
cmux action="list-workspaces"                       # all workspaces (JSON)
cmux action="current-workspace"                     # active workspace (JSON)
cmux action="list-surfaces"                         # surfaces in current workspace (JSON)
cmux action="list-surfaces" args=["workspace:2"]    # surfaces in a specific workspace (JSON)
```

## When to Use What

| Need | Action | Why |
|------|--------|-----|
| Side-by-side view | `open-split` with direction | Splits the current pane |
| Focus an existing tab | `focus-surface` with ref | Navigate without creating |
| Full isolation (different project) | `create-workspace` with cwd | Separate sidebar entry |
| Navigate to existing workspace | `select-workspace` with ref | Switch without creating |

**Default preference:** Prefer `focus-surface` (navigate to existing) over `open-split` (create alongside) over `create-workspace` (full isolation). Escalate only when you need more separation.

## Mutating Actions

```
cmux action="create-workspace"                              # new workspace
cmux action="create-workspace" args=["/path/to/project"]    # with working directory
cmux action="select-workspace" args=["workspace:3"]         # switch workspace
cmux action="open-split" args=["right"]                     # split: left/right/up/down
cmux action="focus-surface" args=["surface:5"]              # focus an existing surface
```

## Complete Allowlist

`ping`, `capabilities`, `tree`, `identify`, `list-workspaces`, `current-workspace`, `list-surfaces`, `create-workspace`, `select-workspace`, `open-split`, `focus-surface`

Every action maps to a documented cmux CLI command. No passthrough.

## Automatic Behavior

The extension manages these via Pi lifecycle hooks — no tool calls needed.

| Pi Event | Sidebar | Notification | Workspace Tab |
|----------|---------|-------------|---------------|
| Session start | Idle (gray) | cleared | — |
| User input | Idle | cleared | mark-read |
| Agent working | Running (blue ⚡) | cleared | — |
| Tool execution | Live activity label | — | — |
| Agent done | Needs input (blue 🔔) | sent (if not focused) | mark-unread |
| Session shutdown | cleared | cleared | — |

Notifications are focus-aware (suppressed when you're looking at this workspace), debounced (3s default), and configurable via `PI_CMUX_NOTIFY_LEVEL` (`all`/`important`/`none`).

## Limits

This extension deliberately excludes operations not in its safety scope:

- **`send` / `send-surface`** — no injecting text into other terminals
- **`send-key` / `send-key-surface`** — no injecting keystrokes
- **`read-screen`** — no reading other terminal output
- **`close-workspace` / `close-surface`** — non-destructive by default
- **Browser panels** — no `--type browser` or URL automation
- **Arbitrary CLI** — no passthrough; every action is an explicit handler

If you need terminal orchestration (send commands, read output, close surfaces), use direct `bash` access to the cmux CLI — not this tool.
