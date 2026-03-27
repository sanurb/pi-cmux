export type AgentState = "running" | "idle" | "needs-input";

export interface StatusDisplay {
  readonly value: string;
  readonly icon: string;
  readonly color: string;
}

export type NotificationLevel = "all" | "important" | "none";

/** Shape returned by `cmux identify`. */
export interface WorkspaceIdentity {
  readonly caller?: { surface_ref?: string };
  readonly focused?: { surface_ref?: string };
}

export interface CmuxConfig {
  readonly notificationLevel: NotificationLevel;
  readonly debounceMs: number;
  readonly debug: boolean;
  readonly statusEnabled: boolean;
}
