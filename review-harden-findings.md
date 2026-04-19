# Harden Audit Findings — DreamySuite
**Date:** 2026-04-19  
**Auditor:** Claude Code (Sonnet 4.6)  
**Project:** `C:\Users\Dannis Seay\builds\dreamysuite`  
**Stack:** Next.js 16 / TypeScript / Cloudflare Workers / D1

---

## Phase 1 — 20-Item Gap Report

| # | Item | Status | Reason |
|---|------|--------|--------|
| 1 | Makefile | ✗ Missing | No `Makefile` exists at project root |
| 2 | Tooling config (linter/formatter) | ⚠ Partial | ESLint configured (`eslint.config.mjs`, `eslint-config-next`); no Prettier or Biome formatter configured anywhere |
| 3 | Coverage config | ✗ Missing | `vitest.config.ts` has no `coverage` block and no threshold |
| 4 | UTC enforcement | ✓ Present | No bare `new Date()` calls in source; `Date.now()` used in telemetry route (millisecond epoch — timezone-safe) |
| 5 | Input validation (Zod) | ✓ Present | `zod` v4 in deps; 11 files import it; API routes use `parseBlockConfig` and `SettingsPatchSchema` at entry points |
| 6 | SECURITY.md | ✗ Missing | File does not exist |
| 7 | CONTRIBUTING.md | ✗ Missing | File does not exist |
| 8 | Test factories/fixtures | ⚠ Partial | `makeDbStub()` in `settings.test.ts` is a local inline stub; no shared factory module across test files |
| 9 | MSW / API mocks | ✗ Missing | No MSW, nock, or equivalent — `requireSiteOwnership` integration test explicitly skipped due to missing D1 mock |
| 10 | Audit log | ⚠ Partial | `editor_event` table stores append-only editor telemetry; no auth/mutation audit log for ownership-changing operations (site create, invite, guest RSVP) |
| 11 | Pre-commit hooks (husky / .pre-commit) | ✗ Missing | No `.pre-commit-config.yaml`, no `.husky/`, no `prepare` script in package.json |
| 12 | Dependency audit | ✗ Missing | No `npm audit` in CI (`deploy.yml` only runs `npm ci` + `npm run deploy`); no audit script in package.json |
| 13 | Separate devDependencies | ✓ Present | `package.json` cleanly separates `dependencies` and `devDependencies`; all build/type/test tools are in dev |
| 14 | Error tracking (Sentry/etc.) | ✗ Missing | No Sentry, PostHog, Datadog, or equivalent in source or dependencies |
| 15 | Bill of Materials | ✗ Missing | No BOM script; `package-lock.json` exists but no dedicated BOM generation step |
| 16 | Integration tests | ⚠ Partial | `e2e/` has 5 Playwright spec files (good); unit vitest suite has 3 files but no integration layer with a real D1/worker runtime |
| 17 | Health/status reporter | ✗ Missing | No `/api/health` or `/api/status` route; no health-check script |
| 18 | CHANGELOG | ✗ Missing | No `CHANGELOG.md` at root |
| 19 | README | ⚠ Partial | `README.md` exists but is the boilerplate `opennext-starter` template — no title+badges, no project structure tree, no contributing/license sections, no usage examples beyond `npm run dev` |
| 20 | Telemetry | ✓ Present | `src/lib/telemetry/editor.ts` + `/api/telemetry` route; hooked into editor Canvas, EditorShell, error boundary, dashboard shell |

**Score: 5 present / 9 missing / 6 partial**

---

## Phase 3 — Enforcement Audit

### Automation surface checked
- `.claude/settings.json` — **does not exist**
- `hooks/hooks.json` — **does not exist**
- `.github/workflows/deploy.yml` — exists, CI-only deploy gate

| Enforcement Item | Status | Notes |
|-----------------|--------|-------|
| Context budget + handoff | Manual | No hook; `.claude/web-ctl/sessions/` contains browser session state only |
| Project health check | Manual | No script or CI step |
| Security pattern scan | Manual | No automated scan in CI |
| CHANGELOG reminder | Manual | No hook configured |
| Hardening nudge | Manual | No hook configured |
| Code format/lint (pre-commit or CI) | Manual | ESLint available via `npm run lint` but not gated in CI or pre-commit |
| Test coverage threshold | Manual | No coverage config in vitest; no CI enforcement |
| Full security review | Manual | Expected manual; no automation exists |

**Summary: 0 of 8 enforcement items are automated.** No `.claude/settings.json` or hooks exist at the project level.

---

## Top Recommended Fixes (Priority Order)

### P1 — Security & Trust
1. **Add `SECURITY.md`** — Disclose contact email (`dannis.seay@twinrootsllc.com`), vulnerability reporting process, and response SLA. One file, zero risk.
2. **Add `npm audit --audit-level=high` to CI** — Insert a step before `npm run deploy` in `deploy.yml`. Catches CVEs before they ship.
3. **Add error tracking** — Wire a Sentry DSN (Cloudflare Workers SDK) into the Next.js `instrumentation.ts`. Currently all server errors are silent.

### P2 — Developer Experience
4. **Add vitest coverage threshold** — Add `coverage: { provider: 'v8', thresholds: { lines: 70 } }` to `vitest.config.ts`. Currently coverage is unconfigured and untested.
5. **Add pre-commit hooks via husky** — `npx husky init` + a hook that runs `npm run lint`. Prevents broken lint from reaching CI.
6. **Add a formatter** — Add Prettier with `eslint-config-prettier`; add `"format": "prettier --write ."` to scripts. ESLint alone doesn't format.

### P3 — Observability & Operations
7. **Add `/api/health` endpoint** — Simple route returning `{ ok: true, version, timestamp }`. Required for uptime monitors and Cloudflare health checks.
8. **Add `CONTRIBUTING.md`** — Branch naming convention, commit format, PR checklist. Low effort, high value for any collaborator.
9. **Upgrade README** — Replace boilerplate with: title + badges, quick start (actual commands), project structure tree from `ARCHITECTURE.md`, contributing + license sections.
10. **Add CHANGELOG.md** — Start a Keep a Changelog (`## [Unreleased]`) skeleton. Can be maintained incrementally.

### P4 — Test Infrastructure
11. **Add shared test factory module** — Extract `makeDbStub()` into `src/lib/testing/factories.ts` and add `makeSite()`, `makeBlock()`, `makeUser()` helpers to unblock skipped integration tests.
12. **Add MSW or D1 mock** — Unblock the skipped `requireSiteOwnership` test; consider `@miniflare/d1` or hand-rolled stub so auth-protected routes can be integration-tested.
13. **Add audit log for mutations** — Log ownership-changing operations (site create/delete, invite, RSVP change) to an `audit_log` table, not only editor events.

### P5 — Automation
14. **Add `.claude/settings.json` with hooks** — Wire at minimum: lint pre-tool-call, CHANGELOG reminder on stop, hardening nudge. Currently all 8 enforcement items are fully manual.
15. **Add a `Makefile`** — Wrap `make test`, `make lint`, `make fmt`, `make audit` as convenience targets for local development parity with CI.

---

## File Locations Referenced
- `C:\Users\Dannis Seay\builds\dreamysuite\package.json`
- `C:\Users\Dannis Seay\builds\dreamysuite\vitest.config.ts`
- `C:\Users\Dannis Seay\builds\dreamysuite\eslint.config.mjs`
- `C:\Users\Dannis Seay\builds\dreamysuite\.github\workflows\deploy.yml`
- `C:\Users\Dannis Seay\builds\dreamysuite\src\app\api\telemetry\route.ts`
- `C:\Users\Dannis Seay\builds\dreamysuite\src\lib\schemas\blocks.test.ts`
- `C:\Users\Dannis Seay\builds\dreamysuite\src\lib\schemas\settings.test.ts`
- `C:\Users\Dannis Seay\builds\dreamysuite\src\lib\api\site-auth.test.ts`
- `C:\Users\Dannis Seay\builds\dreamysuite\e2e\` (5 Playwright specs)
- `C:\Users\Dannis Seay\builds\dreamysuite\README.md`
- `C:\Users\Dannis Seay\builds\dreamysuite\ARCHITECTURE.md`

---

*Generated by dream-studio:harden audit — Phase 1 + Phase 3*
