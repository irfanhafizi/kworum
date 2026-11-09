export const APP_NAME = "Kworum";

export { createMemoryPlatform } from "./memoryPlatform";
export type { MemoryPlatform, MemoryPlatformOptions } from "./memoryPlatform";
export { isPlatformUnavailable, PlatformUnavailableError } from "./platform";
export type {
  CommandRequest,
  CommandResult,
  LLMEvent,
  LLMMessage,
  LLMRequest,
  LLMTool,
  Platform,
  PlatformKind,
  PlatformNotification,
} from "./platform";
export type { Agent, AutonomyLevel, Message, ModelTier, Room } from "./types";
