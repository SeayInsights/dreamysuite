# DreamySuite — Constitution

**Last updated:** 2026-04-29
**Status:** Active — update this file when adding new SSoTs or making architectural decisions

This is the single authoritative reference for DreamySuite's architecture. Before making any change, find the relevant SSOT in the map below and read it first. If an area has no SSOT, create one before building.

---

## Product

Event invitation SaaS. Users build wedding/event sites in a visual editor. Guests RSVP through the published public site.

---

## Stack

Next.js 16 / Cloudflare Workers (opennextjs) / D1 (SQLite) / better-auth / R2 / Resend / Tailwind v4 / Zustand + zundo / GSAP (public only) / SortableJS

---

## SSOT Map — where logic lives

| Concern | SSOT file | Status |
|---|---|---|
| Overall architecture + data flow | `ARCHITECTURE.md` (root) | Active |
| Block positioning (wrapper, desktop) | `src/lib/blockPositioning.ts` → `getBlockStyle()` | ✅ Active |
| Block section styling (tablet/mobile transforms) | `src/lib/editableField.ts` → `blockSectionStyle()` | ✅ Active |
| Validation | `src/lib/validation.ts` | ✅ Done (Domain 1) |
| Library utils | `src/lib/index.ts` + barrel | ✅ Done (Domain 2) |
| Config parsing | `src/lib/config.ts` (target) | ✅ Done (Domain 3) |
| Database queries | `src/lib/db/queries.ts` | ✅ Done (Domain 4) |
| API client | `src/lib/api/client.ts` | ✅ Done (Domain 5) |
| Error handling | `src/lib/errors.ts` | ✅ Done (Domain 6) |
| Event handlers | `src/lib/` (target) | 🔄 Domain 7 — next |
| Animation logic | `.planning/ANIMATION-ARCHITECTURE.md` → `src/lib/animation.ts` | ⏳ Domain 8 |
| State management | `.planning/STATE-MANAGEMENT-ARCHITECTURE.md` → editorStore | ⏳ Domain 9 |
| Data transformation | `src/lib/` (target) | ⏳ Domain 10 |
| Type definitions | `.planning/TYPE-ORGANIZATION.md` | ⏳ Domain 11 |
| Styling logic | `.planning/STYLING-ARCHITECTURE.md` | ⏳ Domain 12 |
| Site CSS variables | `src/styles/site-blocks.css` → `[data-breakpoint]` defaults | ✅ Active |
| Theme variable chain | `BreakpointFrame.tsx` → `siteThemeVars()` → inline styles | ✅ Active |
| Focus management | `hooks/useLastFocus.ts` + `InspectorV2.onMouseDown` | ✅ Active |
| Editor store | `src/app/(dashboard)/stores/editorStore.ts` | Partial — Zustand, blocks only |
| Public render pipeline | `src/app/[slug]/route.ts` → `components/blocks/*` | Active |
| Auth | `src/lib/` auth helpers + better-auth | Active |
| Effects registry | `src/lib/effects/` | Active — CircularGallery, BorderGlow, etc. |
| Block components | `src/app/components/blocks/` | Active |

---

## Key architectural decisions

### 1. Incremental domain refactor — not big-bang
Centralize one domain of logic per cycle. Template: `src/lib/validation.ts`. Big-bang was rejected (150+ file changes = high regression risk).

### 2. Server Actions are disabled
Workers runtime doesn't support Next.js Server Actions. All mutations go through `src/app/api/` routes only.

### 3. editor.tsx is deferred until Phase 3
5400 lines, 600+ useState calls, 3 fragmented state layers. Do not refactor until all 12 `src/lib/` domains are complete. Touching it now compounds the problem.

### 4. D1 migrations are append-only
Never squash or edit existing migrations — production D1 state would desync. Add new migrations only (next sequential number).

### 5. Editor preview ≠ public render
Editor uses iframe + delta postMessage. Public `[slug]` uses SSR → client render. They are different code paths. Changes to block rendering must be tested in both.

### 6. All new state goes through editorStore — never new useState in editor.tsx
Every new piece of editor state must go through `editorStore.ts` (Zustand). Adding useState to the monolith makes it worse.

---

## Active refactor status

**Architecture refactor:** ✅ Complete (all 12 domains)  
**Commit:** `caae730` (PR #140, merged 2026-04-27)

| Domain | Status |
|---|---|
| 1. Validation | ✅ Complete |
| 2. Library Utils | ✅ Complete |
| 3. Config Parsing | ✅ Complete |
| 4. Database Queries | ✅ Complete |
| 5. API Client | ✅ Complete |
| 6. Error Handling | ✅ Complete |
| 7. Event Handlers | ✅ Complete |
| 8. Animation Logic | ✅ Complete |
| 9. State Management | ✅ Complete |
| 10. Data Transformation | ✅ Complete |
| 11. Type Definitions | ✅ Complete |
| 12. Styling Logic | ✅ Complete |

**Next:** `.planning/NEXT-SESSION-START-HERE.md` for remaining cleanup tasks

---

## Forbidden patterns

1. Logic in 2+ components doing the same thing → belongs in `src/lib/`
2. Direct DB schema mutation → always use migrations
3. `wrangler deploy` locally → push to GitHub only
4. `useState` added to `editor.tsx` → use `editorStore`
5. Hardcoded hex colors in block components → use `--site-muted`, `--body-color`, `--site-border`, `--bg`
6. Block render changes tested only in editor → must test `[slug]` route too
7. Touching editor.tsx without a plan → it's 5400 lines, requires dedicated PR with full scope
8. `var(--accent)`, `var(--muted)`, `var(--border)`, `var(--radius)` in block/site code → use `--site-*` prefix. Bare names are shadcn-only.
9. `closest("[data-something]")` exemptions in blur handlers → use `useLastFocus` hook + `restoreFocus()` pattern
10. `--theme-*` intermediary CSS variables → output final names directly from `siteThemeVars()`
