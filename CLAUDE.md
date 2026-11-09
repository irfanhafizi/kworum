# Kworum

A desktop app where users put several AI agents (Lead, Designer, Programmer, QA tester, Growth…) into one "room". The agents discuss, split up work, do it in workspaces (chat, task board, docs, code, preview), and ask the user to approve key decisions. Full plan: `docs/PLAN.md` — read it before planning any feature.

## Structure (pnpm monorepo)
- `packages/ui` — React screens and components. **Never** touches files, processes, network or the OS directly; only calls the `Platform` interface.
- `packages/core` — agent + orchestrator logic, shared types, and the `Platform` interface.
- `apps/desktop` — Electron. Real `Platform` implementation (files, processes, server API).
- `apps/web-demo` — same UI; demo `Platform` that replays a recorded meeting. No real API calls.
- `apps/server` — auth, LLM proxy + credit metering, sync, Stripe webhooks.

## Rules
- TypeScript strict everywhere. No `any` without a comment explaining why.
- Cross-platform (Windows first, macOS/Linux later):
  - Build paths with `path.join` / Electron `app.getPath()`. Never hard-code `C:\` or `/`.
  - Run every external command through `apps/desktop/src/runner/spawn.ts` (cross-spawn); stop processes with tree-kill.
  - The shell is a setting: PowerShell on Windows, bash/zsh elsewhere.
- Never put API keys in the desktop app or web demo. LLM calls go: app → our server → Claude API.
- Secrets live in `.env` (gitignored). Never commit them.
- Agent-run commands stay inside the room's project folder; anything outside the safe list needs a user approval.

## Workflow
- Plan first for any feature; wait for approval before writing code.
- Every feature ships with tests. Run typecheck + tests and fix until green before saying you're done.
- Keep changes small; one feature per session.

## Commands
(Fill in once the repo is set up.)
- Install: `pnpm install`
- Desktop dev: `pnpm --filter desktop dev`
- Web demo dev: `pnpm --filter web-demo dev`
- Tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
