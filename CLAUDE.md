# CalendarMaker — Claude Code Instructions

## Project Overview
Browser-only calendar builder: the user creates 13 pages (a cover picture + one page per month, each with a
picture and a day grid that highlights Saturdays and Sundays) with customizable colors, image position/zoom,
fonts and font colors, start month, and language (English or Czech). Runs entirely in the browser — data is
stored in the browser's IndexedDB, there is no auth and no backend, images are user-uploaded, and the final
output is a print-ready PDF. Desktop-first. Maturity: **prototype/MVP**.

## Tech Stack
| Layer | Choice |
|---|---|
| Language/Runtime | TypeScript |
| Framework | React + Vite |
| UI framework | React |
| UI components | Material UI (MUI) — https://mui.com |
| Rendering/Export | react-konva (canvas editor) + jsPDF (print-ready PDF) |
| Database + ORM | IndexedDB via Dexie.js (client-side only) |
| Validation | Zod |
| Auth | None (all data local in IndexedDB) |
| Testing | Vitest + React Testing Library (unit/component) · Playwright (e2e) |
| Container | None — static build (deploy to any static host) |
| i18n | English + Czech |

## Repository Structure
```
CalendarMaker2/
├─ index.html
├─ vite.config.ts            # Vite + Vitest (jsdom) config
├─ playwright.config.ts
├─ package.json
├─ public/
├─ src/
│  ├─ main.tsx · App.tsx
│  ├─ app/                   # MUI theme (light/dark), providers, i18n bootstrap
│  ├─ features/
│  │  ├─ editor/             # react-konva canvas, page stage, image transform (zoom/position)
│  │  ├─ calendar/           # 13-page model (cover + 12 months), month grid, weekend highlight, start-month logic
│  │  ├─ controls/           # MUI side panels: colors, fonts/font-color, image, start month, language
│  │  ├─ export/             # jsPDF multi-page print-ready export
│  │  └─ storage/            # Dexie DB + saved-project persistence
│  ├─ components/            # shared UI pieces
│  ├─ lib/                   # calendar/date math, helpers
│  ├─ schemas/               # Zod schemas (project, page, config)
│  ├─ i18n/                  # en + cs locale files
│  ├─ types/
│  └─ test/                  # Vitest setup
├─ e2e/                      # Playwright specs (unit *.test.ts colocated in src/)
└─ docs/                     # guidelines + development records
```

## Change Protocol
- Build: `npm run build`  ·  Typecheck: `npm run typecheck`  ·  Test: `npm run test:run` (watch: `npm run test`)
  ·  E2E: `npm run e2e`  ·  Lint: `npm run lint`
- **Never commit if build, lint, or tests fail.**
- Definition of done: unit/component tests + lint + build all green (Playwright e2e for key flows).

## Git Workflow
- Conventional Commits: `feat|fix|docs|refactor|test|chore|perf(scope): subject`.
- Branch prefixes: `feature/ fix/ chore/ docs/ test/ refactor/`.
- **Committing is the user's job.** Agents never run `git commit` or `git push` — stage changes (`git add`),
  summarize what changed, and leave the commit to the user. (Enforced in `.claude/settings.local.json`.)

## How to Work With This Project
- Autonomy: **Balanced** — auto-run safe read/build/test commands; ask before installing deps, deleting files,
  or any destructive operation. Never commit/push (that is the user's).
- Model policy: strong model for logic/architecture and the teaching explanations; a lighter model is fine for
  mechanical sub-tasks.

## Technical Level & Decision Policy
Each contributor sets their own **technical level** (how technical I am + when I ask vs. decide). It is
personal and **not shared via git** — the active level and auto-resolved choices live in
`.claude/tech-level.local.md` (git-ignored). Level definitions: `docs/guidelines/technical-levels.md`.
- **Start of each session:** read `.claude/tech-level.local.md` and follow the active level and its
  auto-resolved decisions. If it is absent (e.g. a new contributor just cloned the repo), no level is set —
  run `/project-architect-tech-level` to have the user pick one; do not assume a level.
- **Change level:** only via `/project-architect-tech-level` (menu + confirm) — never from chat phrasing.
- **Remember a choice:** every decision I present ends with "Let me choose, and next time use the same
  choice"; picking it saves that choice (applied silently next time unless you ask to re-decide). Manage
  saved choices with `/project-architect-autoresolve`.

## Development Workflow
Every development cycle (one user assignment) MUST follow `docs/guidelines/development-workflow.md`. **The main
agent is the MANAGER, not the worker** — it plans, dispatches implement/test/validate assignments to
**subagents**, and reviews; it does **not** write or fix code itself. Cycle: clarify requirements (Use
`requirements-clarity`) → plan a non-technical **assignment + plan** (tech detail scaled to the technical
level), decomposed into tasks via `writing-plans`, saved to `.claude/assignments.local/` and **confirmed with
the user** → **implement by delegating (REQUIRED SUB-SKILL: Use `subagent-driven-development`; use
`dispatching-parallel-agents` for independent fan-out) — never inline** → verify with separate reviewer
subagents (assignment fidelity, simplification/reuse, and `requesting-code-review`) → validate (Use
`systematic-debugging` when useful) → iterate by dispatching a fix subagent, **max 5 iterations**, then
escalate to the user. **Agent-to-agent messages (manager↔subagent) use the `caveman` skill (full level)** to
cut tokens; user-facing messages and all files/docs stay normal English.

## Critical Guidelines
- **ALWAYS** verify a claim before asserting it; check for an existing util/component before writing a new one
  (Rule of Three before abstracting; see `docs/components.md`).
- **ALWAYS** use Material UI (see Tech Stack) before hand-building UI.
- **ALWAYS** keep all user data client-side — IndexedDB only; never send images or project data to any server
  or external service.
- **NEVER** commit or push — the user commits. Stage and summarize instead.
- **NEVER** commit secrets; use env vars only, and keep `.env*` git-ignored.
- **NEVER** deploy or change production/hosting config without explicit human approval.
- **DO NOT** add a dependency published less than 14 days ago without approval (supply-chain safety).
- **DO NOT** land a change larger than ~400 lines of logic diff in one slice — split into stacked slices.
- **PREFER** vendoring a critical library's source into the repo for reference when correctness is high-stakes.

## Guidelines
- Architecture Decisions → `See docs/guidelines/adr/README.md`
- Design proposals → `See docs/guidelines/design-proposals.md`
- Testing conventions → `See docs/guidelines/testing.md`
- PR review → `See docs/guidelines/pr-review.md`
- Technical levels → `See docs/guidelines/technical-levels.md`
- Development workflow → `See docs/guidelines/development-workflow.md`
- Reusable components → `See docs/components.md` (advisory index — confirm against source before reuse)
- UI / design direction → `See .design/calendar-maker/DESIGN_BRIEF.md` (use the `design-brief` skill for new UI)
- Development history → `See docs/development/records/` (point-in-time records of substantial work)

## Guards (installed hooks)
See `.claude/hooks/` (wired in `.claude/settings.json`):
- `validate-bash` — blocks `rm -rf`, force-push, hard-reset, `git clean -f` (names a safe alternative).
- `protect-files` — blocks edits to `.env*`, `*.key/*.pem`, `secrets.*`, and writes outside the project.
- `alignment-gate` — blocks the first code edit of a session until the user has been interviewed.
- `scan-secrets` — warns on hardcoded keys/tokens/JWT in a just-written file.
- `auto-format` — runs the formatter for the file's language after edits.
- `session-check` — on session start, verifies CLAUDE.md + hooks are present.
- (`build-check` is installed for manual/pre-commit use — auto-detects stack, runs build+test — not auto-wired.)
