import "@kworum/ui/styles.css";

import { createMemoryPlatform } from "@kworum/core";
import {
  createFakeRoom,
  FAKE_MEETING,
  FAKE_ROOM_ID,
  RoomScreen,
} from "@kworum/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Fake data until the real desktop Platform exists (build order step 2).
const platform = createMemoryPlatform();
await platform.saveRoom(createFakeRoom(new Date()));

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Missing #root element");
}

createRoot(container).render(
  <StrictMode>
    <RoomScreen
      platform={platform}
      roomId={FAKE_ROOM_ID}
      meeting={FAKE_MEETING}
    />
  </StrictMode>,
);
