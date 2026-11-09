// @vitest-environment jsdom
import { createMemoryPlatform, type Platform } from "@kworum/core";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createFakeRoom, FAKE_MEETING, FAKE_ROOM_ID } from "./meeting";
import { RoomScreen } from "./RoomScreen";

async function renderRoom(platform: Platform = createMemoryPlatform()) {
  await platform.saveRoom(createFakeRoom(new Date()));
  render(
    <RoomScreen
      platform={platform}
      roomId={FAKE_ROOM_ID}
      meeting={FAKE_MEETING}
    />,
  );
  await screen.findByRole("heading", { name: "Mobile app MVP" });
  return platform;
}

function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText("Say something to the table"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Speak" }));
}

afterEach(cleanup);

describe("RoomScreen", () => {
  it("shows the room's agents, messages and agenda", async () => {
    await renderRoom();

    expect(screen.getByText("Live · 4 agents at the table")).toBeTruthy();
    expect(screen.getByText(/I prefer B/)).toBeTruthy();
    expect(screen.getByText("11/12 tests", { exact: false })).toBeTruthy();
    expect(screen.getByText(/Tech stack — voting now/)).toBeTruthy();
    expect(screen.getByText("3 of 4 agents agree")).toBeTruthy();
  });

  it("highlights only the current speaker", async () => {
    await renderRoom();

    expect(
      screen.getByTestId("seat-programmer").getAttribute("data-speaking"),
    ).toBe("true");
    expect(screen.getByTestId("seat-lead").getAttribute("data-speaking")).toBe(
      "false",
    );
  });

  it("reports a room that does not exist", async () => {
    render(
      <RoomScreen
        platform={createMemoryPlatform()}
        roomId="nope"
        meeting={FAKE_MEETING}
      />,
    );

    expect(
      await screen.findByText("This room couldn't be found."),
    ).toBeTruthy();
  });

  it("approves the decision and can undo the vote", async () => {
    await renderRoom();

    fireEvent.click(screen.getByRole("button", { name: "Yes, ship it" }));

    expect(screen.getByTestId("vote-disc-label").textContent).toBe("APPROVED");
    // The QA seat already says "voted yes"; your seat is the second one.
    expect(screen.getAllByText("voted yes", { selector: "div" })).toHaveLength(
      2,
    );
    expect(screen.getByText(/Tech stack — approved/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Change my vote" }));

    expect(screen.getByTestId("vote-disc-label").textContent).toBe("VOTING");
  });

  it("sends the decision back for discussion", async () => {
    await renderRoom();

    fireEvent.click(screen.getByRole("button", { name: "Discuss more" }));

    expect(screen.getByTestId("vote-disc-label").textContent).toBe(
      "DISCUSSING",
    );
    expect(screen.getByText("BACK ON THE TABLE")).toBeTruthy();
  });

  it("adds a spoken message to the thread and saves the room", async () => {
    const platform = await renderRoom();

    sendMessage("Let's ship it");

    expect(await screen.findByText("Let's ship it")).toBeTruthy();
    await waitFor(async () => {
      const saved = await platform.loadRoom(FAKE_ROOM_ID);
      expect(saved?.messages.at(-1)).toMatchObject({
        agentId: null,
        text: "Let's ship it",
      });
    });
  });

  it("ignores a blank message", async () => {
    const platform = await renderRoom();
    const saveRoom = vi.spyOn(platform, "saveRoom");

    sendMessage("   ");

    expect(saveRoom).not.toHaveBeenCalled();
  });

  it("keeps the draft and shows an error when saving fails", async () => {
    const platform = await renderRoom();
    vi.spyOn(platform, "saveRoom").mockRejectedValue(new Error("disk full"));

    sendMessage("Keep me");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn't save",
    );
    expect(
      screen.getByLabelText<HTMLInputElement>("Say something to the table")
        .value,
    ).toBe("Keep me");
  });

  it("toggles pause", async () => {
    await renderRoom();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    expect(screen.getByText("Paused · 4 agents at the table")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
  });

  it("says when a workspace tab is not built yet", async () => {
    await renderRoom();

    fireEvent.click(screen.getByRole("button", { name: "Board" }));

    expect(
      screen.getByText("The Board workspace isn't built yet."),
    ).toBeTruthy();
  });
});
