import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { MeetingView, Seat, UserVote } from "./meeting";

const LAYOUT_WIDTH = 760;
const LAYOUT_HEIGHT = 600;
const MAX_SCALE = 1.3;
const STAGE_COLOR = "#1F1852";

const DISC_LABEL: Record<Exclude<UserVote, null> | "open", string> = {
  open: "VOTING",
  yes: "APPROVED",
  discuss: "DISCUSSING",
};

/** Scales the fixed table layout to whatever space the window leaves it. */
function useFitScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      setScale(
        Math.min(
          container.clientWidth / LAYOUT_WIDTH,
          container.clientHeight / LAYOUT_HEIGHT,
          MAX_SCALE,
        ),
      );
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

function Eyes({ size, gap }: { size: number; gap: number }) {
  const eye = (
    <span
      className="bg-ink rounded-full"
      style={{ width: size, height: size }}
    />
  );
  return (
    <span className="flex items-center justify-center" style={{ gap }}>
      {eye}
      {eye}
    </span>
  );
}

function SeatProp({ seat }: { seat: Seat }) {
  if (seat.prop === "sketchpad") {
    return (
      <div
        className="absolute rounded bg-white"
        style={{ left: 62, top: 66, width: 40, height: 30, rotate: "14deg" }}
      >
        <span className="m-1.5 block h-[3px] rounded-sm bg-[#FF5C8A]" />
        <span className="mx-1.5 block h-[3px] w-1/2 rounded-sm bg-[#FF5C8A]" />
      </div>
    );
  }
  if (seat.prop === "laptop") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-t-md rounded-b-xs bg-[#D9D4EE]"
        style={{ left: 2, top: 98, width: 62, height: 38, rotate: "-6deg" }}
      >
        <span className="bg-lime size-2 rounded-full" />
      </div>
    );
  }
  if (seat.prop === "clipboard") {
    return (
      <div
        className="absolute box-border rounded border-t-[6px] border-[#8A82B8] bg-white"
        style={{ left: 4, top: 62, width: 30, height: 40, rotate: "-10deg" }}
      />
    );
  }
  return null;
}

function AgentSeat({
  seat,
  name,
  isSpeaking,
}: {
  seat: Seat;
  name: string;
  isSpeaking: boolean;
}) {
  const headSize = isSpeaking ? 76 : 56;
  const chairHeight = isSpeaking ? 110 : 96;
  const chairTop = isSpeaking ? 34 : 26;
  const labelTop = isSpeaking ? 146 : 112;

  return (
    <div
      className="absolute"
      style={{ left: seat.left, top: seat.top, width: seat.width, height: 170 }}
      data-testid={`seat-${seat.agentId}`}
      data-speaking={isSpeaking}
    >
      <div
        className="absolute rounded-t-[26px] rounded-b-[14px] bg-[#3B3290]"
        style={{
          left: 6,
          top: chairTop,
          width: seat.width - 12,
          height: chairHeight,
        }}
      />
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: (seat.width - headSize) / 2,
          top: 0,
          width: headSize,
          height: headSize,
          borderRadius: seat.headRadius,
          rotate: seat.headRotate,
          background: seat.headColor,
          boxShadow: isSpeaking
            ? `0 0 0 5px ${STAGE_COLOR}, 0 0 0 9px #C6FF4D`
            : undefined,
        }}
        animate={isSpeaking ? { scale: [1, 1.05, 1] } : undefined}
        transition={
          isSpeaking
            ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <Eyes size={isSpeaking ? 11 : 9} gap={isSpeaking ? 16 : 12} />
      </motion.div>
      <div
        className="absolute rounded-t-[30px] rounded-b-[10px]"
        style={{
          left: (seat.width - (isSpeaking ? 86 : 72)) / 2,
          top: headSize + (isSpeaking ? 4 : 2),
          width: isSpeaking ? 86 : 72,
          height: isSpeaking ? 50 : 44,
          background: seat.shirtColor,
        }}
      />
      <SeatProp seat={seat} />
      {seat.isTyping === true && (
        <div
          className="absolute flex gap-1 rounded-[14px] rounded-bl-[4px] bg-white px-2.5 py-1.5"
          style={{ left: 70, top: -26 }}
        >
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="bg-ink size-1.5 rounded-full"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
            />
          ))}
        </div>
      )}
      <div
        className="absolute -inset-x-10 text-center whitespace-nowrap"
        style={{ top: labelTop }}
      >
        <span
          className={`rounded-[10px] px-2.5 py-1 text-xs ${isSpeaking ? "bg-lime font-extrabold" : "bg-white font-bold"}`}
        >
          {name}
        </span>
        <div
          className={`mt-1.5 text-[11px] ${isSpeaking ? "font-semibold text-[#E6FFB8]" : "text-muted"}`}
        >
          {seat.status}
        </div>
      </div>
    </div>
  );
}

function YourSeat({ vote }: { vote: UserVote }) {
  const status =
    vote === "yes"
      ? "voted yes"
      : vote === "discuss"
        ? "wants to discuss"
        : "1 vote needed";

  return (
    <div
      className="absolute"
      style={{ left: 150, top: 440, width: 120, height: 160 }}
    >
      <div
        className="bg-lime absolute rounded-t-[26px] rounded-b-[14px]"
        style={{ left: 10, top: 26, width: 100, height: 96 }}
      />
      <div
        className="border-ink absolute box-border flex items-center justify-center rounded-full border-4 bg-white text-[13px] font-extrabold"
        style={{ left: 30, top: 0, width: 60, height: 60 }}
      >
        YOU
      </div>
      <div className="absolute w-full text-center" style={{ top: 108 }}>
        <span className="bg-lime rounded-[10px] px-2.5 py-1 text-xs font-extrabold">
          Your seat
        </span>
        <div className="mt-1.5 text-[11px] text-[#E6FFB8]">{status}</div>
      </div>
    </div>
  );
}

function TableTop() {
  return (
    <>
      <div
        className="absolute rounded-full bg-[#2A2268]"
        style={{ left: 40, top: 40, width: 680, height: 520 }}
      />
      <div
        className="absolute rounded-full border-2 border-dashed border-[#3D3490]"
        style={{ left: 100, top: 90, width: 560, height: 420 }}
      />
      <div
        className="absolute rounded-full bg-[#C98F55]"
        style={{ left: 186, top: 168, width: 388, height: 296 }}
      />
      <div
        className="absolute rounded-full bg-[#F2C38A]"
        style={{ left: 196, top: 172, width: 368, height: 280 }}
      />
      <div
        className="absolute rounded-full border-2 border-[#E7AF70]"
        style={{ left: 236, top: 200, width: 288, height: 210 }}
      />
      <div
        className="absolute box-border flex flex-col gap-[5px] rounded-md bg-white p-2"
        style={{ left: 242, top: 220, width: 66, height: 84, rotate: "-14deg" }}
      >
        <span className="bg-ink h-1.5 w-[70%] rounded-sm" />
        <span className="h-1 rounded-xs bg-[#D9D4EE]" />
        <span className="h-1 rounded-xs bg-[#D9D4EE]" />
        <span className="h-1 w-[60%] rounded-xs bg-[#D9D4EE]" />
        <span className="mt-auto text-[9px] font-bold">BRIEF</span>
      </div>
      <div
        className="bg-ink absolute box-border flex flex-col gap-1 rounded-xl p-1.5"
        style={{ left: 470, top: 214, width: 50, height: 92, rotate: "12deg" }}
      >
        <span className="text-sm leading-none font-extrabold text-[#FF5C8A]">
          12
        </span>
        <span className="h-1 rounded-xs bg-[#FF5C8A]" />
        <span className="h-1 w-[60%] rounded-xs bg-[#FF5C8A]" />
        <span className="mt-auto h-3.5 rounded bg-[#3A3160]" />
      </div>
      <div
        className="bg-ink absolute box-border flex flex-col gap-[5px] rounded-lg p-2"
        style={{ left: 290, top: 372, width: 104, height: 58, rotate: "5deg" }}
      >
        <span className="h-1 w-[80%] rounded-xs bg-[#00C29A]" />
        <span className="h-1 w-[55%] rounded-xs bg-[#00C29A]" />
        <span className="h-1 w-[70%] rounded-xs bg-[#8A82B8]" />
        <span className="h-1 w-[40%] rounded-xs bg-[#FF7A8A]" />
      </div>
    </>
  );
}

function VoteDisc({ meeting, vote }: { meeting: MeetingView; vote: UserVote }) {
  return (
    <div
      className="bg-ink absolute box-border flex flex-col items-center justify-center gap-1.5 rounded-full border-[5px] border-white text-center text-white"
      style={{ left: 318, top: 252, width: 124, height: 124 }}
    >
      <span
        className="text-lime text-[10px] font-bold tracking-[0.08em]"
        data-testid="vote-disc-label"
      >
        {DISC_LABEL[vote ?? "open"]}
      </span>
      <span className="font-display text-[15px] leading-[1.1] font-bold">
        {meeting.decision.shortTitle}
      </span>
      <span className="flex gap-1">
        {meeting.seats.map((seat) => (
          <span
            key={seat.agentId}
            className="box-border size-2.5 rounded-full"
            style={
              seat.vote === "yes"
                ? { background: seat.headColor }
                : { border: `2px solid ${seat.headColor}` }
            }
          />
        ))}
      </span>
    </div>
  );
}

export function RoundTable({
  meeting,
  agentNames,
  vote,
}: {
  meeting: MeetingView;
  agentNames: ReadonlyMap<string, string>;
  vote: UserVote;
}) {
  const { containerRef, scale } = useFitScale();
  const { speech } = meeting;

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: LAYOUT_WIDTH,
          height: LAYOUT_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <TableTop />
        <VoteDisc meeting={meeting} vote={vote} />
        {meeting.seats.map((seat) => (
          <AgentSeat
            key={seat.agentId}
            seat={seat}
            name={agentNames.get(seat.agentId) ?? seat.agentId}
            isSpeaking={seat.agentId === speech.agentId}
          />
        ))}
        <YourSeat vote={vote} />
        <motion.div
          className="absolute flex flex-col gap-2.5 rounded-[20px] rounded-br-[4px] bg-white p-3.5"
          style={{
            left: speech.bubble.left,
            top: speech.bubble.top,
            width: 230,
          }}
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <span className="text-[13px] leading-[1.4]">{speech.text}</span>
          <span className="flex items-center gap-1.5">
            {speech.tags.map((tag, index) => (
              <span key={tag} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-[#8A82B8]">+</span>}
                <span className="rounded-lg bg-[#E3FAF4] px-2 py-1 text-xs font-bold text-[#00634F]">
                  {tag}
                </span>
              </span>
            ))}
          </span>
        </motion.div>
        <div
          className="absolute size-0 border-x-12 border-t-[18px] border-x-transparent border-t-white"
          style={{
            left: speech.tail.left,
            top: speech.tail.top,
            rotate: "-20deg",
          }}
        />
      </div>
    </div>
  );
}
