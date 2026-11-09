import type {
  CommandResult,
  LLMEvent,
  Platform,
  PlatformNotification,
} from "./platform";
import type { Room } from "./types";

export interface MemoryPlatformOptions {
  /** Events every `askLLM` call yields, in order. */
  llmEvents?: LLMEvent[];
  /** Result every `runCommand` call returns. */
  commandResult?: CommandResult;
}

export interface MemoryPlatform extends Platform {
  readonly kind: "memory";
  readonly notifications: readonly PlatformNotification[];
}

const EMPTY_COMMAND_RESULT: CommandResult = {
  exitCode: 0,
  stdout: "",
  stderr: "",
};

function assertInsideProject(relativePath: string): void {
  const isAbsolute = /^([\\/]|[a-zA-Z]:)/.test(relativePath);
  const escapes = relativePath.split(/[\\/]/).includes("..");
  if (isAbsolute || escapes) {
    throw new Error(`Path is outside the project folder: ${relativePath}`);
  }
}

/** A `Platform` held entirely in memory, for tests and fake-data screens. */
export function createMemoryPlatform(
  options: MemoryPlatformOptions = {},
): MemoryPlatform {
  const { llmEvents = [], commandResult = EMPTY_COMMAND_RESULT } = options;
  const files = new Map<string, string>();
  const rooms = new Map<string, Room>();
  const notifications: PlatformNotification[] = [];
  const fileKey = (roomId: string, relativePath: string) =>
    JSON.stringify([roomId, relativePath]);

  return {
    kind: "memory",
    notifications,

    async runCommand(request) {
      request.signal?.throwIfAborted();
      if (request.cwd !== undefined) {
        assertInsideProject(request.cwd);
      }
      if (commandResult.stdout !== "") {
        request.onOutput?.(commandResult.stdout);
      }
      return { ...commandResult };
    },

    async readFile(roomId, relativePath) {
      assertInsideProject(relativePath);
      const contents = files.get(fileKey(roomId, relativePath));
      if (contents === undefined) {
        throw new Error(`File not found: ${relativePath}`);
      }
      return contents;
    },

    async writeFile(roomId, relativePath, contents) {
      assertInsideProject(relativePath);
      files.set(fileKey(roomId, relativePath), contents);
    },

    async *askLLM(request) {
      for (const event of llmEvents) {
        request.signal?.throwIfAborted();
        yield event;
      }
    },

    // Rooms are cloned in and out so callers cannot mutate what is "stored".
    async saveRoom(room) {
      rooms.set(room.id, structuredClone(room));
    },

    async loadRoom(roomId) {
      const room = rooms.get(roomId);
      return room === undefined ? null : structuredClone(room);
    },

    async listRooms() {
      return [...rooms.values()].map((room) => structuredClone(room));
    },

    async notify(notification) {
      notifications.push(notification);
    },
  };
}
