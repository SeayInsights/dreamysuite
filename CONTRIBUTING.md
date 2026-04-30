# Contributing to DreamySuite

## Branch Naming

- `feat/<topic>` — new features
- `fix/<topic>` — bug fixes
- `chore/<topic>` — maintenance, deps, cleanup

## Commit Format

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

## Workflow

1. Create a feature branch from `main`
2. Make changes, ensure `npm run build` passes
3. Open a PR — keep under 120 lines of changes
4. CI runs: lint, typecheck, audit, deploy
5. Merge to `main` triggers Cloudflare deploy

## Rules

- Never push directly to `main`
- Never run `wrangler deploy` locally — CI handles deploys
- All schema changes via migrations in `migrations/`
- No new `useState` in `editor.tsx` — use `editorStore.ts`
- Block styles use CSS variables only (`--muted`, `--body-color`, `--border`, `--bg`)
