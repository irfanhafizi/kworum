import type { ModelTier, Room } from "./types";

export type PlatformKind = "desktop" | "demo" | "memory";

export interface CommandRequest {
  roomId: string;
  command: string;
  args: string[];
  /** Relative to the room's project folder. Defaults to the folder itself. */
  cwd?: string;
  /** Called with output as it arrives, before the command finishes. */
  onOutput?: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's input. */
  inputSchema: Record<string, unknown>;
}

/** Deliberately has no API key: LLM calls go app -> our server -> Claude API. */
export interface LLMRequest {
  roomId: string;
  modelTier: ModelTier;
  system: string;
  messages: LLMMessage[];
  tools?: LLMTool[];
  signal?: AbortSignal;
}

export type LLMEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | {
      type: "done";
      usage: { inputTokens: number; outputTokens: number };
      credits: number;
    };

export interface PlatformNotification {
  title: string;
  body: string;
  roomId?: string;
}

/**
 * Everything the UI and orchestrator may do to the outside world.
 *
 * Paths are always relative to the room's project folder, so callers stay
 * OS-agnostic. Implementations must reject any path or `cwd` that is absolute
 * or resolves outside that folder.
 *
 * Whether a command needs user approval is decided by the orchestrator before
 * it calls `runCommand`.
 */
export interface Platform {
  readonly kind: PlatformKind;
  runCommand(request: CommandRequest): Promise<CommandResult>;
  readFile(roomId: string, relativePath: string): Promise<string>;
  writeFile(
    roomId: string,
    relativePath: string,
    contents: string,
  ): Promise<void>;
  askLLM(request: LLMRequest): AsyncIterable<LLMEvent>;
  saveRoom(room: Room): Promise<void>;
  loadRoom(roomId: string): Promise<Room | null>;
  listRooms(): Promise<Room[]>;
  notify(notification: PlatformNotification): Promise<void>;
}

/**
 * Thrown when a platform cannot perform an action, such as the web demo being
 * asked to run a command. The UI shows "Available in the desktop app".
 */
export class PlatformUnavailableError extends Error {
  readonly capability: string;

  constructor(capability: string) {
    super(`"${capability}" is not available on this platform`);
    this.name = "PlatformUnavailableError";
    this.capability = capability;
  }
}

export function isPlatformUnavailable(
  error: unknown,
): error is PlatformUnavailableError {
  return error instanceof PlatformUnavailableError;
}
