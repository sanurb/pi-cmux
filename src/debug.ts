let _enabled = false;

export function initDebug(enabled: boolean): void {
  _enabled = enabled;
}

export function debug(module: string, message: string, data?: unknown): void {
  if (!_enabled) return;
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `[pi-cmux:${module}] ${ts}`;
  if (data !== undefined) {
    console.error(`${prefix} ${message}`, data);
  } else {
    console.error(`${prefix} ${message}`);
  }
}
