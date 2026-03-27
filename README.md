# pi-cmux

Daily-use [Pi](https://github.com/mariozechner/pi-coding-agent) + [cmux](https://cmux.dev) integration: **status, notifications, and safe workspace helpers.**

## Install

```bash
pi install git:github.com/sanurb/pi-cmux
```

## What it does

### Status

Compact sidebar status that reflects Pi's state:

| State | Icon | When |
|-------|------|------|
| **Running** | ⚡ bolt.fill (blue) | Agent is working |
| **Idle** | ⏸ pause.circle (gray) | Waiting, no task |
| **Needs input** | 🔔 bell.fill (blue) | Agent finished, your turn |

Live tool activity shows what Pi is doing ("Reading ~/.zshrc", "Running grep") — visible from other workspaces.

### Notifications

Smart native macOS notifications:

- **Focus-aware** — suppressed when you're already looking at the workspace
- **Debounced** — no rapid-fire spam (3s default)
- **Configurable** — `all` / `important` / `none`
- **Mark-unread/read** — workspace tab lights up when Pi needs attention, clears when you interact

### Safe workspace helpers

A single `cmux` tool with an explicit allowlist. All discovery actions return JSON.

| Action | What | Documented CLI command |
|--------|------|----------------------|
| `ping` | Check if cmux is responsive | `cmux ping` |
| `capabilities` | List available methods + access mode | `cmux capabilities --json` |
| `tree` | Full window/workspace/pane/surface hierarchy | `cmux tree --json` |
| `identify` | Which workspace/surface Pi is in | `cmux identify --json` |
| `list-workspaces` | List all workspaces | `cmux list-workspaces --json` |
| `current-workspace` | Current workspace info | `cmux current-workspace --json` |
| `list-surfaces` | Surfaces in a workspace | `cmux list-surfaces --json` |
| `create-workspace` | Create a new workspace | `cmux new-workspace` |
| `select-workspace` | Switch to a workspace | `cmux select-workspace` |
| `open-split` | Split current pane | `cmux new-split <direction>` |
| `focus-surface` | Focus an existing surface | `cmux focus-surface` |

No `send`, `send-key`, `read-screen`, `close-*`, or arbitrary passthrough.

## Configuration

Environment variables (all optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `PI_CMUX_NOTIFY_LEVEL` | `all` | `all` / `important` / `none` |
| `PI_CMUX_DEBOUNCE_MS` | `3000` | Min ms between notifications |
| `PI_CMUX_DEBUG` | — | `1` to enable debug logging (stderr) |
| `PI_CMUX_STATUS` | — | `0` to disable sidebar status |

## Architecture

```
cmux.ts           ← entrypoint (re-export)
src/
  index.ts        ← bootstrap + guards
  config.ts       ← env-driven configuration
  transport.ts    ← cmux CLI abstraction (uses `cmux ping` for readiness)
  status.ts       ← sidebar status management
  notifications.ts ← debounced, focus-aware notifications
  workspace.ts    ← safe workspace operations (documented commands only)
  lifecycle.ts    ← event handler wiring
  tools.ts        ← LLM tool registration
  types.ts        ← shared types
  debug.ts        ← conditional debug logging
```

### Design principles

- **Documented commands only** — every action maps to a command in the [cmux API reference](https://www.cmux.dev/docs/api)
- **JSON-first** — all discovery actions pass `--json` for structured, parseable output
- **Graceful degradation** — `cmux ping` at startup; silent no-op if unreachable
- **State transitions, not heartbeats** — no polling, no timers
- **Safe by default** — explicit allowlist, no destructive commands, no passthrough

## What this is not

This is not a multi-agent runtime, orchestration framework, browser automation tool, or platform. It's the smallest coherent product that gives Pi clean cmux integration for everyday use.

## License

MIT
