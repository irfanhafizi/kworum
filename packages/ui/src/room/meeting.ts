import type { Room } from "@kworum/core";

export type AgentVote = "yes" | "abstain" | null;
export type UserVote = "yes" | "discuss" | null;
export type SeatProp = "sketchpad" | "laptop" | "clipboard";

export interface Seat {
  agentId: string;
  status: string;
  vote: AgentVote;
  left: number;
  top: number;
  width: number;
  headColor: string;
  shirtColor: string;
  headRadius: string;
  headRotate: number;
  prop?: SeatProp;
  isTyping?: boolean;
}

export interface Speech {
  agentId: string;
  text: string;
  tags: string[];
  /** Where the bubble and its tail sit on the table's 760x600 layout. */
  bubble: { left: number; top: number };
  tail: { left: number; top: number };
}

export type MessageAttachment =
  | { type: "design-options"; options: { label: string; picked: boolean }[] }
  | {
      type: "test-run";
      steps: string[];
      passed: number;
      total: number;
    };

/** Meeting state the `Room` record does not hold yet. */
export interface MeetingView {
  eyebrow: string;
  durationLabel: string;
  speech: Speech;
  seats: Seat[];
  decision: { title: string; shortTitle: string };
  agenda: string[];
  attachments: Record<string, MessageAttachment>;
}

function minutesBefore(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

export const FAKE_ROOM_ID = "fake-mobile-app-mvp";

export function createFakeRoom(now: Date): Room {
  const agent = (id: string, name: string): Room["agents"][number] => ({
    id,
    name,
    rolePrompt: `You are the ${name} in this room.`,
    modelTier: "balanced",
    tools: [],
    approvalRules: [],
    autonomy: "ask_when_risky",
  });

  return {
    id: FAKE_ROOM_ID,
    name: "Mobile app MVP",
    projectFolder: "habit-app",
    agents: [
      agent("lead", "Lead"),
      agent("designer", "Designer"),
      agent("programmer", "Programmer"),
      agent("qa", "QA tester"),
    ],
    budgetCredits: 5000,
    spentCredits: 1240,
    messages: [
      {
        id: "m1",
        agentId: "designer",
        text: "Streak screen: I prefer B, the number reads faster.",
        createdAt: minutesBefore(now, 2),
      },
      {
        id: "m2",
        agentId: "programmer",
        text: "Scaffold is up, one test left to fix.",
        createdAt: minutesBefore(now, 1),
      },
    ],
  };
}

export const FAKE_MEETING: MeetingView = {
  eyebrow: "ROOM · WEEK 1 OF 6",
  durationLabel: "14 min",
  speech: {
    agentId: "programmer",
    text: "One codebase for iOS and Android, and it's free until 50k users.",
    tags: ["Expo", "Supabase"],
    bubble: { left: 426, top: 40 },
    tail: { left: 610, top: 150 },
  },
  seats: [
    {
      agentId: "lead",
      status: "running the meeting",
      vote: "yes",
      left: 330,
      top: 10,
      width: 100,
      headColor: "#8B7BFF",
      shirtColor: "#6A55F0",
      headRadius: "50%",
      headRotate: 0,
    },
    {
      agentId: "designer",
      status: "sketching option C",
      vote: "abstain",
      left: 56,
      top: 236,
      width: 110,
      headColor: "#FF5C8A",
      shirtColor: "#D93F70",
      headRadius: "18px",
      headRotate: -8,
      prop: "sketchpad",
      isTyping: true,
    },
    {
      agentId: "programmer",
      status: "speaking",
      vote: "yes",
      left: 596,
      top: 214,
      width: 130,
      headColor: "#00C29A",
      shirtColor: "#00977A",
      headRadius: "26px",
      headRotate: 0,
      prop: "laptop",
    },
    {
      agentId: "qa",
      status: "voted yes",
      vote: "yes",
      left: 500,
      top: 440,
      width: 110,
      headColor: "#FFB020",
      shirtColor: "#D98A00",
      headRadius: "12px",
      headRotate: 10,
      prop: "clipboard",
    },
  ],
  decision: {
    title: "Build with Expo + Supabase?",
    shortTitle: "Expo + Supabase?",
  },
  agenda: ["Tech stack", "Streak screen A or B", "Test plan review"],
  attachments: {
    m1: {
      type: "design-options",
      options: [
        { label: "A", picked: false },
        { label: "B", picked: true },
      ],
    },
    m2: {
      type: "test-run",
      steps: ["expo init habit-app", "supabase: auth + habits table"],
      passed: 11,
      total: 12,
    },
  },
};
