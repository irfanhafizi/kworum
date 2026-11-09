import type { Platform, Room } from "@kworum/core";
import { MotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { MeetingView, UserVote } from "./meeting";
import { RoundTable } from "./RoundTable";
import { Thread } from "./Thread";

const TABS = ["Table", "Chat", "Board", "Code", "Docs", "Preview"] as const;
type RoomTab = (typeof TABS)[number];

const VOTE_SUFFIX: Record<Exclude<UserVote, null> | "open", string> = {
  open: "voting now",
  yes: "approved",
  discuss: "discussing",
};

function Agenda({ items, vote }: { items: readonly string[]; vote: UserVote }) {
  return (
    <ul aria-label="Agenda" className="m-0 flex list-none flex-wrap gap-2 p-0">
      {items.map((item, index) => (
        <li
          key={item}
          className={`rounded-[14px] px-3.5 py-2 text-[13px] ${
            index === 0
              ? "bg-lime text-ink font-bold"
              : "bg-stage-soft text-[#E4E0FF]"
          }`}
        >
          {index + 1} · {item}
          {index === 0 && ` — ${VOTE_SUFFIX[vote ?? "open"]}`}
        </li>
      ))}
    </ul>
  );
}

function TabPlaceholder({ tab }: { tab: RoomTab }) {
  return (
    <section className="bg-stage text-muted flex flex-1 items-center justify-center rounded-[32px] text-base">
      The {tab} workspace isn't built yet.
    </section>
  );
}

export function RoomScreen({
  platform,
  roomId,
  meeting,
}: {
  platform: Platform;
  roomId: string;
  meeting: MeetingView;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [tab, setTab] = useState<RoomTab>("Table");
  const [vote, setVote] = useState<UserVote>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    platform.loadRoom(roomId).then(
      (loaded) => {
        if (isCurrent) {
          setRoom(loaded);
          setLoadState(loaded === null ? "missing" : "ready");
        }
      },
      () => {
        if (isCurrent) {
          setLoadState("missing");
        }
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [platform, roomId]);

  const agentNames = useMemo(
    () => new Map(room?.agents.map((agent) => [agent.id, agent.name]) ?? []),
    [room?.agents],
  );

  async function handleSpeak(text: string): Promise<boolean> {
    if (room === null) {
      return false;
    }
    const updated: Room = {
      ...room,
      messages: [
        ...room.messages,
        {
          id: crypto.randomUUID(),
          agentId: null,
          text,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    try {
      await platform.saveRoom(updated);
    } catch {
      setSaveError("Couldn't save your message. Try again.");
      return false;
    }
    setSaveError(null);
    setRoom(updated);
    return true;
  }

  if (room === null) {
    return (
      <main className="bg-lilac text-ink flex h-screen items-center justify-center">
        {loadState === "loading"
          ? "Opening room…"
          : "This room couldn't be found."}
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-lilac text-ink box-border flex h-screen min-w-[1040px] flex-col gap-[18px] overflow-hidden px-7 py-[22px] text-sm">
        <header className="flex flex-none flex-wrap items-center gap-4">
          <span className="bg-ink flex size-[46px] items-center justify-center rounded-2xl">
            <span className="border-lime box-border size-[22px] rounded-full border-4" />
          </span>
          <div className="flex-[1_1_260px]">
            <div className="text-violet text-xs font-bold tracking-[0.08em]">
              {meeting.eyebrow}
            </div>
            <h1 className="font-display mt-0.5 mb-0 text-4xl leading-none font-extrabold tracking-[-0.02em]">
              {room.name}
            </h1>
          </div>
          <nav
            aria-label="Room views"
            className="flex gap-1 rounded-2xl bg-white p-[5px]"
          >
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                aria-current={tab === name ? "page" : undefined}
                className={`min-h-10 cursor-pointer rounded-xl border-0 px-4 ${
                  tab === name
                    ? "bg-ink font-semibold text-white"
                    : "text-ink bg-transparent"
                }`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="border-ink min-h-[46px] cursor-pointer rounded-[23px] border-2 bg-transparent px-[18px] font-bold"
            onClick={() => setIsPaused((paused) => !paused)}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </header>

        {tab === "Table" ? (
          <div className="flex min-h-0 flex-1 gap-5">
            <section
              aria-label="The table"
              className="bg-stage flex min-h-0 min-w-0 flex-[3_1_640px] flex-col gap-3.5 overflow-hidden rounded-[32px] p-5"
            >
              <div className="flex flex-none items-center justify-between gap-2.5">
                <span className="bg-stage-soft flex items-center gap-2 rounded-2xl px-3.5 py-[7px] text-[13px] font-semibold text-white">
                  <span
                    className={`size-2 rounded-full ${isPaused ? "bg-[#8A82B8]" : "bg-lime"}`}
                  />
                  {isPaused ? "Paused" : "Live"} · {room.agents.length} agents
                  at the table
                </span>
                <span className="text-muted text-[13px]">
                  Meeting time {meeting.durationLabel} ·{" "}
                  {room.spentCredits.toLocaleString("en-US")} credits
                </span>
              </div>
              <RoundTable
                meeting={meeting}
                agentNames={agentNames}
                vote={vote}
              />
              <Agenda items={meeting.agenda} vote={vote} />
            </section>
            <Thread
              messages={room.messages}
              meeting={meeting}
              agentNames={agentNames}
              vote={vote}
              saveError={saveError}
              onVote={setVote}
              onSpeak={handleSpeak}
            />
          </div>
        ) : (
          <TabPlaceholder tab={tab} />
        )}
      </main>
    </MotionConfig>
  );
}
