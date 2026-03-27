import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "./config.js";
import { initDebug, debug } from "./debug.js";
import * as transport from "./transport.js";
import * as status from "./status.js";
import * as notifications from "./notifications.js";
import * as lifecycle from "./lifecycle.js";
import * as tools from "./tools.js";

const MODULE = "init";

export default function cmuxExtension(pi: ExtensionAPI): void {
  if (process.env.PI_CMUX_CHILD === "1") return;

  const config = loadConfig();
  initDebug(config.debug);

  debug(MODULE, "initializing pi-cmux", {
    notificationLevel: config.notificationLevel,
    debounceMs: config.debounceMs,
    statusEnabled: config.statusEnabled,
  });

  if (!transport.isAvailable()) return;

  status.init(config);
  notifications.init(config);
  lifecycle.wire(pi);
  tools.register(pi);

  debug(MODULE, "pi-cmux ready");
}
