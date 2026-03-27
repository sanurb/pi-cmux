import { execFileSync } from "node:child_process";
import { debug } from "./debug.js";

const MODULE = "transport";
const CMD_TIMEOUT_MS = 5_000;

let _available: boolean | null = null;

/**
 * Uses `cmux ping` — the documented readiness check — rather than `which cmux`,
 * because presence in PATH doesn't guarantee a running socket.
 * Result is cached for the session lifetime.
 */
export function isAvailable(): boolean {
  if (_available !== null) return _available;
  try {
    execFileSync("cmux", ["ping"], {
      encoding: "utf-8",
      timeout: 2_000,
      stdio: "pipe",
    });
    _available = true;
    debug(MODULE, "cmux ping → ok");
  } catch {
    _available = false;
    debug(MODULE, "cmux ping failed — extension will no-op");
  }
  return _available;
}

export function resetAvailability(): void {
  _available = null;
}

/** Executes a cmux CLI command. Throws on failure. */
export function run(...args: string[]): string {
  try {
    const result = execFileSync("cmux", args, {
      encoding: "utf-8",
      timeout: CMD_TIMEOUT_MS,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    debug(MODULE, `cmux ${args[0]} → ok`, args.length > 1 ? args.slice(1) : undefined);
    return result;
  } catch (e: any) {
    const msg = e.stderr?.toString().trim() || e.message;
    debug(MODULE, `cmux ${args[0]} → error: ${msg}`);
    throw new Error(`cmux ${args[0]} failed: ${msg}`);
  }
}

/** Like {@link run} but returns `null` on failure instead of throwing. */
export function tryRun(...args: string[]): string | null {
  try {
    return run(...args);
  } catch {
    return null;
  }
}
