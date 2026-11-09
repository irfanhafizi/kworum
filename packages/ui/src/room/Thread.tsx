import type { Message } from "@kworum/core";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { MeetingView, MessageAttachment, Seat, UserVote } from "./meeting";

function formatAge(createdAt: string, now: Date): string {
  const minutes = Math.floor(
    (now.getTime() - new Date(createdAt).getTime()) / 60_000,
  );
  return minutes < 1 ? "now" : `${minutes} min`;
}

function Attachment({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.type === "design-options") {
    return (
      <div className="mt-2.5 flex gap-2">
        {attachment.options.map((option) =>
          option.picked ? (
            <div
              key={option.label}
              className="bg-ink box-border flex h-16 w-24 flex-col gap-1 rounded-xl border-2 border-[#FF5C8A] p-2"
            >
              <span className="text-xl leading-none font-extrabold text-[#FF5C8A]">
                12
              </span>
              <span className="h-[5px] rounded-sm bg-[#FF5C8A]" />
              <span className="text-[10px] text-[#FFB3CB]">
                {option.label} · pick
              </span>
            </div>
          ) : (
            <div
              key={option.label}
              className="box-border flex h-16 w-24 flex-col gap-[5px] rounded-xl border border-[#DDD6FF] bg-[#F3F0FF] p-2"
            >
              <span className="bg-muted h-[5px] w-[60%] rounded-sm" />
              <span className="flex-1 rounded-md bg-[#DDD6FF]" />
              <span className="text-[10px] text-[#6A6488]">{option.label}</span>
            </div>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="bg-ink mt-2 rounded-xl px-3 py-2.5 font-mono text-xs leading-[1.7] text-[#D9D4EE]">
      {attachment.steps.map((step) => (
        <div key={step}>
          <span className="text-lime">✓</span> {step}
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2">
        <span className="flex h-1.5 flex-1 rounded-sm bg-[#3A3160]">
          <span
            className="rounded-sm bg-[#00C29A]"
            style={{
              width: `${(attachment.passed / attachment.total) * 100}%`,
            }}
          />
        </span>
        {attachment.passed}/{attachment.total} tests
      </div>
    </div>
  );
}

function MessageCard({
  message,
  seat,
  name,
  attachment,
  now,
}: {
  message: Message;
  seat: Seat | undefined;
  name: string;
  attachment: MessageAttachment | undefined;
  now: Date;
}) {
  return (
    <motion.article
      className="flex gap-3 rounded-[22px] bg-white p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span
        className="size-9 flex-none"
        style={{
          background: seat?.headColor ?? "#C6FF4D",
          borderRadius: seat?.headRadius ?? "50%",
          rotate: `${seat?.headRotate ?? 0}deg`,
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold">
          {name}{" "}
          <span className="text-xs font-normal text-[#6A6488]">
            · {formatAge(message.createdAt, now)}
          </span>
        </div>
        <p className="mt-1 mb-0 leading-[1.45] break-words">{message.text}</p>
        {attachment !== undefined && <Attachment attachment={attachment} />}
      </div>
    </motion.article>
  );
}

function DecisionCard({
  meeting,
  agentNames,
  vote,
  onVote,
}: {
  meeting: MeetingView;
  agentNames: ReadonlyMap<string, string>;
  vote: UserVote;
  onVote: (vote: UserVote) => void;
}) {
  const yesSeats = meeting.seats.filter((seat) => seat.vote === "yes");
  const abstained = meeting.seats
    .filter((seat) => seat.vote === "abstain")
    .map((seat) => agentNames.get(seat.agentId) ?? seat.agentId);
  const eyebrow =
    vote === "yes"
      ? "APPROVED BY YOU"
      : vote === "discuss"
        ? "BACK ON THE TABLE"
        : "YOUR VOTE DECIDES";

  return (
    <motion.div
      layout
      className="bg-ink flex flex-none flex-col gap-3 rounded-[26px] p-5 text-white"
    >
      <div className="flex items-center justify-between">
        <span className="text-lime text-xs font-bold tracking-[0.08em]">
          {eyebrow}
        </span>
        <span className="text-muted text-xs">
          {yesSeats.length} of {meeting.seats.length} agents agree
        </span>
      </div>
      <div className="font-display text-[28px] leading-[1.05] font-extrabold">
        {meeting.decision.title}
      </div>
      <div className="flex items-center gap-1.5">
        {yesSeats.map((seat, index) => (
          <span
            key={seat.agentId}
            className="border-ink box-border size-7 border-2"
            style={{
              background: seat.headColor,
              borderRadius: seat.headRadius === "50%" ? "50%" : 9,
              marginLeft: index === 0 ? 0 : -8,
            }}
          />
        ))}
        <span className="ml-1.5 text-[13px] text-[#D9D4EE]">
          voted yes
          {abstained.length > 0 && ` · ${abstained.join(", ")} abstained`}
        </span>
      </div>
      {vote === null ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bg-lime text-ink min-h-[50px] cursor-pointer rounded-[25px] border-0 px-6 text-[15px] font-extrabold"
            onClick={() => onVote("yes")}
          >
            Yes, ship it
          </button>
          <button
            type="button"
            className="min-h-[50px] cursor-pointer rounded-[25px] border-2 border-white bg-transparent px-[22px] font-semibold text-white"
            onClick={() => onVote("discuss")}
          >
            Discuss more
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="min-h-[46px] cursor-pointer rounded-[23px] border-2 border-white bg-transparent px-[22px] font-semibold text-white"
            onClick={() => onVote(null)}
          >
            Change my vote
          </button>
        </div>
      )}
    </motion.div>
  );
}

function Composer({
  onSpeak,
}: {
  onSpeak: (text: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text === "" || isSending) {
      return;
    }
    setIsSending(true);
    const saved = await onSpeak(text);
    setIsSending(false);
    if (saved) {
      setDraft("");
    }
  }

  return (
    <form
      className="flex flex-none items-center gap-2 rounded-[28px] bg-white py-1.5 pr-1.5 pl-[18px]"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label htmlFor="room-composer" className="sr-only">
        Say something to the table
      </label>
      <input
        id="room-composer"
        className="min-h-[46px] min-w-0 flex-1 border-0 text-[15px] outline-none"
        placeholder="Say something to the table"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        type="submit"
        className="bg-ink min-h-[46px] cursor-pointer rounded-[23px] border-0 px-5 font-bold text-white"
      >
        Speak
      </button>
    </form>
  );
}

export function Thread({
  messages,
  meeting,
  agentNames,
  vote,
  saveError,
  onVote,
  onSpeak,
}: {
  messages: Message[];
  meeting: MeetingView;
  agentNames: ReadonlyMap<string, string>;
  vote: UserVote;
  saveError: string | null;
  onVote: (vote: UserVote) => void;
  onSpeak: (text: string) => Promise<boolean>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    const element = scrollRef.current;
    if (element !== null) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length]);

  return (
    <aside
      aria-label="Thread"
      className="flex min-h-0 min-w-0 flex-[2_1_380px] flex-col gap-3"
    >
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              seat={meeting.seats.find(
                (seat) => seat.agentId === message.agentId,
              )}
              name={
                message.agentId === null
                  ? "You"
                  : (agentNames.get(message.agentId) ?? message.agentId)
              }
              attachment={meeting.attachments[message.id]}
              now={now}
            />
          ))}
        </AnimatePresence>
      </div>
      <DecisionCard
        meeting={meeting}
        agentNames={agentNames}
        vote={vote}
        onVote={onVote}
      />
      {saveError !== null && (
        <p role="alert" className="m-0 px-4 text-[13px] text-[#B3123F]">
          {saveError}
        </p>
      )}
      <Composer onSpeak={onSpeak} />
    </aside>
  );
}
