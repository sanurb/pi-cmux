# pi-cmux — Daily-use Pi + cmux integration

## What this repo is

The default daily-use Pi + cmux integration: status, notifications, safe workspace helpers.

Small enough to trust. Useful enough to keep installed.

## Architecture

```
cmux.ts           ← extension entrypoint (re-export from src/)
src/
  index.ts        ← bootstrap, guards, module init
  config.ts       ← env-driven config (PI_CMUX_*)
  transport.ts    ← cmux CLI wrapper (run/tryRun/isAvailable)
  status.ts       ← sidebar status (running/idle/needs-input)
  notifications.ts ← debounced, focus-aware native notifications
  workspace.ts    ← typed workspace operations (no passthrough)
  lifecycle.ts    ← Pi event → module wiring
  tools.ts        ← LLM-facing cmux tool registration
  types.ts        ← shared types
  debug.ts        ← conditional stderr logging
```

## Module boundaries

| Module | Knows about | Does not know about |
|--------|-------------|-------------------|
| transport | cmux CLI | Pi, status, notifications |
| status | transport, config | Pi, notifications |
| notifications | transport, config | Pi, status |
| workspace | transport | Pi, config, status |
| lifecycle | Pi API, status, notifications | tools, workspace |
| tools | Pi API, workspace | status, notifications |
| index | everything (wiring only) | — |

## Key patterns

### Guards (index.ts)
1. `PI_CMUX_CHILD=1` → bail (prevents subprocess recursion)
2. `transport.isAvailable()` → bail if cmux not in PATH

### State transitions, not heartbeats
Status updates happen on Pi lifecycle events, never on timers.

### Safe tool surface
The `cmux` tool uses an explicit action → handler map. No arbitrary argv passthrough.

## Explicit non-goals

- Multi-agent orchestration
- Fleet management / worker mode
- LLM-based session naming
- Turn summaries
- Browser automation
- MCP server
- Arbitrary cmux CLI passthrough
- send-key / text injection
- read-screen
