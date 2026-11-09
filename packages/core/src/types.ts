export type ModelTier = "fast" | "balanced" | "best";

export type AutonomyLevel = "always_ask" | "ask_when_risky" | "autonomous";

/** An agent is plain data: everything that makes it distinct lives in these fields. */
export interface Agent {
  id: string;
  name: string;
  rolePrompt: string;
  modelTier: ModelTier;
  tools: string[];
  /** The "always ask me before" rules set in the team builder. */
  approvalRules: string[];
  autonomy: AutonomyLevel;
}

export interface Message {
  id: string;
  /** The agent that wrote this message, or `null` when the user wrote it. */
  agentId: string | null;
  text: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Must stay JSON-serializable: rooms cross IPC and are written to storage. */
export interface Room {
  id: string;
  name: string;
  projectFolder: string;
  agents: Agent[];
  budgetCredits: number;
  spentCredits: number;
  messages: Message[];
}
