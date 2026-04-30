# DreamySuite — Project Instructions

## READ FIRST — every session, every change
Before touching ANY code:
1. Read `.planning/CONSTITUTION.md` — architecture law and SSOT map
2. Read `.planning/GOTCHAS.md` — what has gone wrong before
3. Run `git status` + `git log --oneline -5` — understand current state
4. Grep import sites for any file you plan to modify before editing

No exceptions. Skipping this is how regressions happen.

## Active work
12-domain architecture refactor is in progress — see `.planning/NEXT-SESSION-START-HERE.md` before every session. Pattern: centralize scattered logic to `src/lib/`. Each domain = one atomic PR.

## Rules
- Never push to `main` directly — CI deploys on push to main
- Never run `wrangler deploy` locally — CI handles all deploys
- All schema changes via migrations in `migrations/` — never mutate schema directly
- Build must pass before any commit: `npm run build`
- PR size: under 120 lines unless unavoidable

## Debugging
Use `dream-studio:debug` — never debug inline. Before starting:
1. Find the SSOT for the area in `.planning/CONSTITUTION.md`
2. Read that SSOT file completely
3. Trace the full pipeline (editor → store → API → render) before touching code
