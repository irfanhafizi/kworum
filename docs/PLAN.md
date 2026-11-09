# Kworum — product and technical plan

## Product
Users put several AI agents (Lead, Designer, Programmer, QA tester, Growth, …) into one "room". The agents discuss, split up work, do it in shared workspaces, and ask the user to approve key decisions.

### Core screens
1. **Home** — start a room from a goal or a team template; active rooms with status; "waiting on you"; credit usage.
2. **Room** — the "round table": agents sit around a table as characters; the speaker is highlighted with a speech bubble; the decision being voted on sits in the middle; agenda chips below. Next to it, a thread with rich messages (design previews, code diffs, test results) and decision cards. Tabs: Table, Chat, Board, Code, Docs, Preview.
3. **Code workspace** — file tree, editor, terminal, activity feed, Programmer → QA handoff card, guardrails.
4. **Task board** — Backlog, In progress, In review (QA), Waiting on you, Done.
5. **Approvals & decision log** — pending decisions across rooms, Lead's summary, each agent's position, Approve / Approve with changes / Reject; permanent log.
6. **Team builder** — agents with role prompt, model tier, allowed workspaces, autonomy level, "always ask me before" rules.

Design reference: https://claude.ai/artifact/6pXzE6DoAE7XRfZY84d6AK ("Round table · detailed" is the chosen direction).

## Platform decisions
- Desktop app first (Electron), **Windows first**; code stays cross-platform for macOS/Linux later.
- Web demo: same UI, replays a recorded meeting; real actions show "Available in the desktop app".
- AI-written code runs on the user's computer, inside the room's project folder. No cloud sandbox.
- LLM calls go through our server (protects the API key, meters credits).

## Architecture
- **Platform interface** (packages/core): `runCommand`, `readFile`, `writeFile`, `askLLM`, `saveRoom`, `notify`… Desktop and web demo each implement it.
- **Agent** = row of data: name, role prompt, model tier, tools, approval rules, autonomy.
- **Orchestrator loop** (desktop background process):
  1. Stop if the room's budget is used up.
  2. Pick the next speaker (Lead decides; or round-robin / only-when-mentioned).
  3. Build context: role prompt + room memory + rolling summary + last ~20 messages + current task.
  4. Call the LLM via the server; stream the reply.
  5. For each tool call: if it needs approval → create an approval and pause; else run it.
  6. Save and broadcast events to the UI.
  - Max turns per topic; Lead summarizes every N messages.
- **Realtime UI events**: `agent.status`, `agent.speaking` (streamed), `vote.cast`, `task.moved`, `runner.output`.
- **Memory**: recent messages, rolling summary, pinned room facts, decision log, searchable docs (pgvector later).
- **Workspaces = tools + a UI panel**: chat, board, docs, code/terminal, preview; later design canvas and web research.

## Tech stack
Electron · React + TypeScript + Tailwind · Framer Motion · Vitest · ESLint · pnpm workspaces · Node server · Postgres (Supabase free tier or own server) · Claude API via Console · Stripe · Sentry · electron-builder · GitHub Actions (Windows, macOS, Ubuntu).

## Safety
- Agents restricted to the project folder; safe commands auto-allowed (e.g. `npm test`, `npm run dev`); others need approval.
- Room budgets with auto-pause; spend limit in the Claude Console.
- Treat web pages and files as untrusted (prompt injection); approvals are the safety net.

## Easy to miss
- Detect missing Node/Git on Windows; offer setup.
- Windows code signing (SmartScreen); auto-update from the first beta.
- Privacy policy + terms (user files are sent to the AI provider).
- Website: landing page, web demo, downloads.
- Onboarding: sample room, starter credits. Clear offline state.

## Build order
1. Monorepo, `Platform` interface, Electron shell, Room screen with fake data.
2. Server LLM proxy, one real agent, then the orchestrator with 3 agents.
3. Approvals, room memory, decision log, credit metering.
4. Round-table UI, task board, web demo with a recorded meeting.
5. Local code workspace: folder, terminal, tests, preview, Programmer → QA handoff.
6. Windows installer, auto-update, signing, payments, beta. macOS/Linux when confirmed.
