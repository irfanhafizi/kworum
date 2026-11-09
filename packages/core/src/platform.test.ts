import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createMemoryPlatform,
  isPlatformUnavailable,
  PlatformUnavailableError,
  type LLMEvent,
  type LLMRequest,
  type Platform,
  type Room,
} from "./index";

const room: Room = {
  id: "room-1",
  name: "Launch",
  projectFolder: "launch",
  agents: [],
  budgetCredits: 100,
  spentCredits: 0,
  messages: [],
};

const llmRequest: LLMRequest = {
  roomId: "room-1",
  modelTier: "fast",
  system: "You are the Lead.",
  messages: [],
};

async function collect(events: AsyncIterable<LLMEvent>): Promise<LLMEvent[]> {
  const collected: LLMEvent[] = [];
  for await (const event of events) {
    collected.push(event);
  }
  return collected;
}

describe("isPlatformUnavailable", () => {
  it("recognises the error and exposes its capability", () => {
    const error: unknown = new PlatformUnavailableError("runCommand");

    expect(isPlatformUnavailable(error)).toBe(true);
    if (isPlatformUnavailable(error)) {
      expect(error.capability).toBe("runCommand");
    }
  });

  it.each([new Error("other"), "runCommand", null, undefined])(
    "rejects %s",
    (value) => {
      expect(isPlatformUnavailable(value)).toBe(false);
    },
  );
});

describe("createMemoryPlatform", () => {
  it("implements Platform", () => {
    expectTypeOf(createMemoryPlatform()).toExtend<Platform>();
    expect(createMemoryPlatform().kind).toBe("memory");
  });

  describe("files", () => {
    it("reads back what was written", async () => {
      const platform = createMemoryPlatform();

      await platform.writeFile("room-1", "src/a.ts", "hello");

      await expect(platform.readFile("room-1", "src/a.ts")).resolves.toBe(
        "hello",
      );
    });

    it("rejects a missing file", async () => {
      await expect(
        createMemoryPlatform().readFile("room-1", "missing.ts"),
      ).rejects.toThrow("File not found");
    });

    it("keeps each room's files separate", async () => {
      const platform = createMemoryPlatform();

      await platform.writeFile("room-1", "a.ts", "hello");

      await expect(platform.readFile("room-2", "a.ts")).rejects.toThrow(
        "File not found",
      );
    });

    it.each(["../secret", "src/../../secret", "/etc/passwd", "C:\\secret"])(
      "rejects the path %s",
      async (path) => {
        const platform = createMemoryPlatform();

        await expect(platform.readFile("room-1", path)).rejects.toThrow(
          "outside the project",
        );
        await expect(platform.writeFile("room-1", path, "x")).rejects.toThrow(
          "outside the project",
        );
      },
    );
  });

  describe("rooms", () => {
    it("saves, loads and lists rooms", async () => {
      const platform = createMemoryPlatform();

      await platform.saveRoom(room);

      await expect(platform.loadRoom("room-1")).resolves.toEqual(room);
      await expect(platform.listRooms()).resolves.toEqual([room]);
    });

    it("returns null for an unknown room", async () => {
      await expect(createMemoryPlatform().loadRoom("nope")).resolves.toBeNull();
    });

    it("does not share state with callers", async () => {
      const platform = createMemoryPlatform();
      await platform.saveRoom(room);

      const loaded = await platform.loadRoom("room-1");
      if (loaded === null) {
        throw new Error("room was not saved");
      }
      loaded.name = "Changed";

      await expect(platform.loadRoom("room-1")).resolves.toEqual(room);
    });
  });

  describe("askLLM", () => {
    const events: LLMEvent[] = [
      { type: "text", text: "Hi" },
      { type: "tool_call", id: "1", name: "readFile", input: { path: "a" } },
      {
        type: "done",
        usage: { inputTokens: 1, outputTokens: 2 },
        credits: 3,
      },
    ];

    it("yields the scripted events in order", async () => {
      const platform = createMemoryPlatform({ llmEvents: events });

      await expect(collect(platform.askLLM(llmRequest))).resolves.toEqual(
        events,
      );
    });

    it("stops when aborted", async () => {
      const platform = createMemoryPlatform({ llmEvents: events });
      const controller = new AbortController();
      controller.abort();

      await expect(
        collect(platform.askLLM({ ...llmRequest, signal: controller.signal })),
      ).rejects.toThrow();
    });
  });

  describe("runCommand", () => {
    const commandResult = { exitCode: 1, stdout: "out", stderr: "err" };
    const request = { roomId: "room-1", command: "npm", args: ["test"] };

    it("returns the scripted result and streams its output", async () => {
      const platform = createMemoryPlatform({ commandResult });
      const chunks: string[] = [];

      const result = await platform.runCommand({
        ...request,
        onOutput: (chunk) => chunks.push(chunk),
      });

      expect(result).toEqual(commandResult);
      expect(chunks).toEqual(["out"]);
    });

    it("rejects a cwd outside the project", async () => {
      await expect(
        createMemoryPlatform().runCommand({ ...request, cwd: "../other" }),
      ).rejects.toThrow("outside the project");
    });
  });

  it("records notifications", async () => {
    const platform = createMemoryPlatform();
    const notification = { title: "Waiting on you", body: "Approve the plan" };

    await platform.notify(notification);

    expect(platform.notifications).toEqual([notification]);
  });
});
