# DreamySuite — Final Audit Report
Date: 2026-04-19
Auditor: dream-studio:project-audit workflow

---

## Executive Summary

| Phase | Verdict | Fixed This Session |
|-------|---------|-------------------|
| Harden | PARTIAL — structural gaps addressed | 9 of 15 actionable items fixed (SECURITY.md, CONTRIBUTING.md, CHANGELOG.md, Makefile, health endpoint, test factories, README upgrade, vitest coverage config, npm audit in CI) |
| Security | PARTIAL — critical/high resolved | 5 of 12 findings fixed (1 Critical XSS + 4 High: telemetry auth, RSVP draft-site check, DB error leak, security headers) |
| Code Review | BLOCKED — new findings introduced | 0 fixed (all findings are new — not previously reported) |
| Overall | **BLOCKED** | Critical XSS and 4 High security findings resolved; code review introduced 1 new Critical and 3 new High findings that remain open |

---

## Remaining Issues (by severity)

### Critical

**[CRITICAL / CODE REVIEW] C1 — Unauthenticated RSVP endpoint inserts arbitrary guest rows**
- File: `src/app/api/sites/[id]/rsvp/route.ts` lines 8–74
- Finding: The route is completely public — no auth, no ownership check. Any anonymous caller who knows or guesses a siteId can insert arbitrary guest rows into any published site's guest table, permanently inflating RSVP counts and injecting data visible to the owner's dashboard. Additionally, `rsvpStatus` is accepted from the caller and can be set directly to `"yes"` or `"no"` on insertion, bypassing the intended pending-then-respond flow.
- Fix: Remove this route entirely (the canonical flow is `/api/public/[siteSlug]/rsvp` which matches against an owner-pre-seeded guest list), or add rate-limiting and enforce `rsvpStatus = "pending"` on creation regardless of caller input.

---

### High

**[HIGH / CODE REVIEW] H1 — Guestbook accepts entries for unpublished (draft) sites**
- File: `src/app/api/sites/[id]/guestbook/route.ts` lines 33–38
- Finding: The POST existence check (`SELECT id FROM site WHERE id = ?`) has no `status = 'published'` filter. Guests can submit entries to sites taken offline or never published. The GET also returns all entries to any unauthenticated caller without checking publish status, leaking private draft site data.
- Fix: Add `AND status = 'published'` to both the POST and GET site existence checks.

**[HIGH / CODE REVIEW] H2 — `useBlockSync.flushNow` does not await the flush before marking state clean**
- File: `src/app/(dashboard)/sites/[id]/editor-v2/hooks/useBlockSync.ts` lines 87–95
- Finding: `flushOps(...)` is called without `await`, then `state.markClean()` runs immediately. On page close or unmount, `keepalive: true` is the only protection keeping those requests alive. If the flush fails, `markClean()` has already discarded pending ops — the lost changes cannot be retried. The debounced timer path correctly awaits before marking clean.
- Fix: Do not call `markClean()` in `flushNow`. Let the debounce path handle cleanup on normal navigation; accept data loss on hard closes and document the known risk.

**[HIGH / CODE REVIEW] H3 — Ad-hoc ownership checks across 8 routes instead of `requireSiteOwnership`; `/domain/check` has no ownership check at all**
- File: `src/app/api/sites/[id]/translate/route.ts` lines 13–25; also `/canva/designs`, `/canva/import`, `/media/[mediaId]`, `/domain/check`, `/domain/purchase`
- Finding: Eight routes roll their own auth instead of delegating to the tested `requireSiteOwnership` helper. The `/domain/check` route (line 34–35) only checks authentication — it never verifies site ownership. Any authenticated user can invoke this endpoint against any site. The pattern creates a maintenance hazard: any change to invite semantics must be replicated across all copies.
- Fix: Migrate all `sites/[id]/*` routes to use `requireSiteOwnership` (or `requireSiteOwner` for owner-only actions). Document `/domain/check` and `/domain/purchase` if they intentionally differ.

**[HIGH / CODE REVIEW] H4 — `settings/route.ts` GET has no try/catch; DB errors return unhandled 500s**
- File: `src/app/api/sites/[id]/settings/route.ts` lines 22–43
- Finding: The GET handler has no error wrapper. Any D1 failure propagates as an uncaught exception — a stack trace in development or a generic Workers error in production. The PUT handler (line 49) correctly wraps in try/catch.
- Fix: Wrap the GET handler in the same try/catch pattern as PUT, returning `apiError("DB_ERROR", "An internal error occurred.", 500)`.

---

### Medium

**[MEDIUM / SECURITY] SEC-M1 — `requireEmailVerification: false` allows account takeover via unverified email**
- File: `src/app/lib/auth.server.ts` line 21
- Finding: Any user who registers with an email they don't own gains immediate collaborator access to any site that has invited that address.
- Fix: Set `requireEmailVerification: true` and configure a Resend-based email verification flow via better-auth's `sendVerificationEmail` callback.

**[MEDIUM / SECURITY] SEC-M2 — No rate limiting on login, signup, or auth endpoints**
- Files: `src/app/api/auth/[...all]/route.ts`, `src/app/lib/auth.server.ts`
- Finding: Unlimited password guesses against any known email via `POST /api/auth/sign-in/email`.
- Fix: Enable better-auth's `rateLimit` plugin (`plugins: [rateLimit({ window: 60, max: 10 })]`) or add a Cloudflare dashboard rate-limiting rule on `/api/auth/*`.

**[MEDIUM / SECURITY] SEC-M3 — Guest site password cookie missing `Secure` flag**
- File: `src/app/[slug]/route.ts` line 149
- Finding: The `Set-Cookie` header omits the `Secure` flag. Over HTTP connections the plaintext password value is transmitted unencrypted.
- Fix: Append `; Secure` to the Set-Cookie value.

**[MEDIUM / SECURITY] SEC-M4 — Free-text input fields stored without length limits**
- Files: `src/app/api/public/[siteSlug]/route.ts`, `src/app/api/sites/[id]/guestbook/route.ts`, `src/app/api/sites/[id]/content/route.ts`
- Finding: No maximum length validated on `notes`, `firstName`, `lastName`, `name`, `message`, `pageSlug`, `lang`, or `content` before DB insert.
- Fix: Add length guards before insert (firstName/lastName ≤ 100, notes/message ≤ 2000, pageSlug/lang ≤ 64, content JSON ≤ 500 KB). Return 400 on violation.

**[MEDIUM / SECURITY] SEC-M5 — Translation route does not verify blockIds belong to the target site**
- File: `src/app/api/sites/[id]/translations/route.ts` lines 55–65
- Finding: An authenticated user on site A can write translation rows for block IDs belonging to site B, corrupting cross-site data.
- Fix: Validate each `r.blockId` against `SELECT id FROM block WHERE id IN (?, ...) AND siteId = ?` before bulk insert.

**[MEDIUM / SECURITY] SEC-M6 — Guestbook and RSVP accept submissions to draft sites (second instance)**
- Files: `src/app/api/sites/[id]/guestbook/route.ts`, `src/app/api/sites/[id]/rsvp/route.ts`
- Finding: Neither POST handler filters by `status = 'published'`. The guestbook GET also returns entries for any siteId without auth.
- Fix: Add `AND status = 'published'` to all site existence checks; require auth or published status for guestbook GET.

**[MEDIUM / SECURITY] SEC-M7 — Sensitive resource IDs in `wrangler.jsonc` committed to version control**
- File: `wrangler.jsonc` lines 49, 53
- Finding: D1 database ID and KV namespace ID are committed. If the repo is public, these reduce attacker reconnaissance effort.
- Fix: If the repo is or becomes public, add a comment clarifying these are non-secret binding identifiers. Ensure the `CLOUDFLARE_API_TOKEN` in CI has minimum required permissions only.

**[MEDIUM / SECURITY] SEC-M8 — No audit log for publish, invite, domain-purchase, and site-delete events**
- Files: multiple API routes
- Finding: No forensic trail for state-changing ownership operations.
- Fix: Insert rows into a new `audit_log` table (fields: `id`, `siteId`, `userId`, `action`, `payload`, `createdAt`) on these events.

**[MEDIUM / SECURITY] SEC-M9 — No payload size limit on JSON body endpoints**
- Files: All `parseJsonBody` / `req.json()` callers across `src/app/api/`
- Finding: Cloudflare Workers allow up to 100 MB request bodies. Unbounded arrays (`rows` in translations) could cause Worker CPU timeout or memory exhaustion.
- Fix: Add a `Content-Length` check before parsing (`> 1_048_576` → 400). Cap the translations `rows` array at 200 items.

**[MEDIUM / SECURITY] SEC-M10 — No `middleware.ts` / Edge middleware for authentication gates**
- Finding: All auth checks happen inside individual route handlers. A route accidentally added without an auth check has no fallback layer.
- Fix: Create `src/middleware.ts` intercepting `/api/sites/:id/*`, calling `auth.api.getSession`, returning 401 if no session — before the route handler runs. Exclude the public guestbook and public RSVP endpoints from this middleware.

**[MEDIUM / CODE REVIEW] CR-M1 — Page slug not validated on `POST /api/sites/[id]/pages`**
- File: `src/app/api/sites/[id]/pages/route.ts` lines 43–46
- Finding: `slug` accepts any string including slashes, spaces, and Unicode, inserted directly with only a DB UNIQUE constraint as guard.
- Fix: Add regex validation: `if (!/^[a-z0-9-]+$/.test(slug)) return 400`.

**[MEDIUM / CODE REVIEW] CR-M2 — `guestPassword` hashed with SHA-256 (unsalted, rainbow-table vulnerable)**
- File: `src/app/api/sites/[id]/settings/route.ts` lines 16–19
- Finding: SHA-256 is not a password-hashing function. Provides no real security if D1 is compromised.
- Fix: Use PBKDF2 with a random salt via `crypto.subtle`, or explicitly document that guest page passwords are low-security.

**[MEDIUM / CODE REVIEW] CR-M3 — `CustomCssPanel` injects CSS into editor `<head>`, not the preview iframe**
- File: `src/app/(dashboard)/sites/[id]/editor-v2/inspector/CustomCssPanel.tsx` lines 37–42
- Finding: Injected CSS can affect editor UI itself. The sanitizer blocks `@import` and `expression()` but not `position:fixed` or high `z-index` values that could obscure editor controls.
- Fix: Target the canvas iframe's document instead of `document.head`, or scope injection to a shadow DOM.

**[MEDIUM / CODE REVIEW] CR-M4 — `useSettingsSync.flushNow` fires PUT without awaiting or error-handling**
- File: `src/app/(dashboard)/sites/[id]/editor-v2/hooks/useSettingsSync.ts` lines 25–30
- Finding: Settings changes made in the last 1.5 seconds before unmount can be silently lost with no user feedback.
- Fix: Either document as best-effort or implement flush-before-unmount via `navigator.sendBeacon` for the settings payload.

**[MEDIUM / CODE REVIEW] CR-M5 — Invite email sent before DB record written; Resend success + D1 failure leaves orphaned invite**
- File: `src/app/api/sites/[id]/invites/route.ts` lines 58–98
- Finding: If the DB INSERT fails after Resend succeeds, an email is sent for an invite that does not exist in the system.
- Fix: Write the DB record first, then send the email. On email failure, surface the error without a 502 — the invite record exists and the email can be re-sent.

**[MEDIUM / CODE REVIEW] CR-M6 — `blocks/route.ts` POST does not validate `sortOrder` as a non-negative integer**
- File: `src/app/api/sites/[id]/blocks/route.ts` lines 29, 60–65
- Finding: Negative values or non-integer floats write unchecked to the DB and disrupt ordering logic.
- Fix: Guard: `typeof sortOrder === "number" && Number.isInteger(sortOrder) && sortOrder >= 0`.

---

### Low

**[LOW / SECURITY] SEC-L1 — Health endpoint returns app version (assists CVE targeting)**
- File: `src/app/api/health/route.ts` line 6
- Fix: Remove the `version` field from the public response or gate it behind authentication.

**[LOW / SECURITY] SEC-L2 — Photo upload uses raw `file.name` in R2 key without sanitization**
- File: `src/app/api/sites/[id]/photos/route.ts` line 64
- Fix: Sanitize filename: strip path separators, limit to `[a-zA-Z0-9._-]`, enforce max 128 chars.

**[LOW / SECURITY] SEC-L3 — Canva callback logs full third-party error response body**
- File: `src/app/api/canva/callback/route.ts` line 40
- Fix: Log only the HTTP status code, not `await tokenRes.text()`.

**[LOW / SECURITY] SEC-L4 — Invite `invitedBy` stored as mutable display name, not userId**
- File: `src/app/api/sites/[id]/invites/route.ts` line 98
- Fix: Store `check.userId`; join to `user` table on read for display name.

**[LOW / SECURITY] SEC-L5 — `better-auth` baseURL hardcoded to `APP_URL` in plaintext vars**
- File: `src/app/lib/auth.server.ts` line 23, `wrangler.jsonc` line 43
- Fix: No code change needed. Document that `APP_URL` must be updated in wrangler.jsonc when the primary domain changes.

**[LOW / HARDEN] HAR-L1 — No pre-commit hooks (husky / .pre-commit)**
- Finding: ESLint is available via `npm run lint` but not gated pre-commit or in CI.
- Fix: `npx husky init` + hook that runs `npm run lint`.

**[LOW / HARDEN] HAR-L2 — No Prettier / code formatter**
- Finding: ESLint alone does not format. No Prettier or Biome configured.
- Fix: Add Prettier with `eslint-config-prettier`; add `"format": "prettier --write ."` to scripts.

**[LOW / HARDEN] HAR-L3 — No MSW / D1 mock for integration tests**
- Finding: The skipped `requireSiteOwnership` integration test cannot run without a D1 mock.
- Fix: Add `@miniflare/d1` or a hand-rolled stub to unblock skipped auth-protected route tests.

**[LOW / HARDEN] HAR-L4 — No audit log for mutations (also noted at MEDIUM in Security — same root issue)**
- Finding: No `audit_log` table for ownership-changing operations.
- Fix: Addressed under SEC-M8.

**[LOW / HARDEN] HAR-L5 — No `.claude/settings.json` enforcement hooks**
- Finding: 0 of 8 enforcement items (lint gate, CHANGELOG reminder, hardening nudge, etc.) are automated.
- Fix: Add `.claude/settings.json` with at minimum lint pre-tool-call and CHANGELOG reminder on stop.

**[LOW / HARDEN] HAR-L6 — Error tracking absent (Sentry or equivalent)**
- Finding: All server errors are currently silent. No Sentry, PostHog, or Datadog in deps or source.
- Fix: Wire a Sentry DSN (Cloudflare Workers SDK) into `instrumentation.ts`.

**[LOW / HARDEN] HAR-L7 — No bill of materials (BOM) generation step**
- Finding: `package-lock.json` exists but no dedicated BOM script.
- Fix: Add a BOM generation step (e.g., `npm sbom` or `cyclonedx-npm`) to CI.

**[LOW / HARDEN] HAR-L8 — `eslint-config-next` version mismatch (15.x config with Next 16)**
- Finding: Minor version mismatch may mask security-relevant lint rules.
- Fix: Align `eslint-config-next` to version 16.x when available.

**[LOW / CODE REVIEW] CR-L1 — `translate/route.ts` translates fields sequentially instead of concurrently**
- File: `src/app/api/sites/[id]/translate/route.ts` lines 54–69
- Fix: Use `Promise.allSettled` with a concurrency cap (`p-limit`) for parallel MyMemory calls.

**[LOW / CODE REVIEW] CR-L2 — Error response shapes inconsistent across routes**
- Finding: Some routes return `{ error: { code, message } }` (standard `apiError`); others return bare strings (`{ error: "Unauthorized" }`).
- Fix: Use `apiError()` uniformly. Bare-string variants are concentrated in the inline-auth routes identified under H3.

**[LOW / CODE REVIEW] CR-L3 — `cssSanitize.ts` regex uses stateful `gi` flag objects**
- File: `src/lib/cssSanitize.ts` lines 1–3
- Finding: Calling `.test()` twice consecutively on the same `gi` RegExp without a `.replace()` in between will mis-report due to `lastIndex` advancing.
- Fix: Construct fresh RegExp objects or use non-stateful patterns for presence checks.

**[LOW / CODE REVIEW] CR-L4 — Playwright install path is fragile (monorepo-relative)**
- File: `ARCHITECTURE.md` line 83
- Finding: E2E tests are non-reproducible on a fresh clone.
- Fix: Add `@playwright/test` as a local `devDependency` and update `package.json` scripts.

---

## Resolved This Session

The following issues were fixed during this audit run and are **not** counted as remaining issues:

### Security Phase — Resolved
1. **[CRITICAL] XSS via unsanitized user input in RSVP notification email HTML** — `escEmail()` helper created and applied to all user-supplied fields in `src/app/api/public/[siteSlug]/route.ts`.
2. **[HIGH] Telemetry endpoint accepted unauthenticated writes with no siteId ownership check** — Auth + ownership check added to `POST /api/telemetry`.
3. **[HIGH] Public RSVP endpoint accepted submissions to draft/unpublished sites** — `AND status = 'published'` added to the site existence check.
4. **[HIGH] Internal DB error messages returned verbatim in HTTP 500 response body** — Generic error message returned; raw exception logged to `console.error` only.
5. **[HIGH] No security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)** — `headers()` function added to `next.config.ts` with all required headers.

### Harden Phase — Resolved
6. **SECURITY.md missing** — Created with contact email, vulnerability reporting process, and response SLA.
7. **CONTRIBUTING.md missing** — Created with branch naming convention, commit format, and PR checklist.
8. **CHANGELOG.md missing** — Created with Keep a Changelog `## [Unreleased]` skeleton.
9. **Makefile missing** — Created with `make test`, `make lint`, `make fmt`, `make audit` targets.
10. **Health/status endpoint missing** — `/api/health` route created returning `{ ok: true, timestamp }`.
11. **Shared test factory module missing** — `src/lib/testing/factories.ts` created with `makeDbStub()`, `makeSite()`, `makeBlock()`, `makeUser()` helpers.
12. **README was boilerplate opennext-starter template** — Upgraded with title + badges, quick start, project structure tree, contributing and license sections.
13. **Vitest coverage config missing** — `coverage: { provider: 'v8', thresholds: { lines: 70 } }` added to `vitest.config.ts`.
14. **No `npm audit` in CI** — `npm audit --audit-level=high` step added to `.github/workflows/deploy.yml` before deploy.

---

## Recommended Fix Order

Numbered by priority — highest severity first. All Critical and High items must be resolved before the next deploy.

1. **[CRITICAL] Remove or secure `src/app/api/sites/[id]/rsvp/route.ts`** — Remove the duplicate unauthenticated RSVP endpoint entirely, or enforce `rsvpStatus = "pending"` and add rate-limiting. This is a data-integrity issue that allows anonymous actors to inject arbitrary guest rows.

2. **[HIGH] Add `status = 'published'` guard to guestbook POST and GET** (`guestbook/route.ts`) — Prevent submissions to and exposure of draft site data. Require auth or published-status for guestbook GET.

3. **[HIGH] Fix `useBlockSync.flushNow` — remove `markClean()` from the unload path** (`useBlockSync.ts`) — Prevents silent data loss on editor navigation. Document that hard-close is best-effort.

4. **[HIGH] Migrate all `sites/[id]/*` routes to `requireSiteOwnership`; add ownership check to `/domain/check`** — Eliminates maintenance hazard from 8 ad-hoc auth copies and closes the ownership gap on the domain check route.

5. **[HIGH] Wrap `settings/route.ts` GET in try/catch** — Prevents unhandled 500s on D1 errors from the settings GET handler.

6. **[MEDIUM] Enable email verification in better-auth** (`auth.server.ts`) — Closes the account-takeover-via-invite spoofing vector.

7. **[MEDIUM] Add rate limiting to auth endpoints** — Enable the better-auth `rateLimit` plugin or add Cloudflare dashboard rules on `/api/auth/*`.

8. **[MEDIUM] Add `Secure` flag to guest password cookie** (`[slug]/route.ts`) — One-line fix; eliminates plaintext transmission risk.

9. **[MEDIUM] Add input length limits across all free-text fields** — Guards against storage exhaustion and oversized payloads.

10. **[MEDIUM] Validate blockIds belong to the target site in `/translations` route** — Closes cross-site data corruption vector.

11. **[MEDIUM] Add payload size check to all `req.json()` callers** — Prevents Worker CPU/memory exhaustion from oversized POST bodies.

12. **[MEDIUM] Create `src/middleware.ts` as an authentication gate for `/api/sites/*`** — Defense-in-depth layer; catches any future route added without an explicit auth check.

13. **[MEDIUM] Fix invite flow — write DB record before sending email** (`invites/route.ts`) — Prevents orphaned invites on transient D1 failures.

14. **[MEDIUM] Validate page slug format** (`pages/route.ts`) — Blocks slash-injection and Unicode slugs.

15. **[MEDIUM] Replace SHA-256 with PBKDF2 + salt for guest password hashing** — Proper password-hashing function; or document the deliberate low-security trade-off.

16. **[MEDIUM] Fix `CustomCssPanel` to inject CSS into iframe, not editor `<head>`** — Prevents user CSS from overlaying editor controls.

17. **[MEDIUM] Fix `useSettingsSync.flushNow` — fire-and-forget settings flush** — Mirror H2 fix; document or resolve best-effort risk.

18. **[MEDIUM] Add `audit_log` table for publish, invite, domain-purchase, and site-delete events** — Forensic trail for ownership-changing operations.

19. **[MEDIUM] Validate `sortOrder` as non-negative integer in blocks POST** — One-line guard; prevents ordering corruption.

20. **[LOW] Remove app version from public health endpoint** — Reduces CVE-targeting surface.

21. **[LOW] Sanitize `file.name` before embedding in R2 key** — Strip path separators, limit charset, enforce max length.

22. **[LOW] Log only Canva token exchange status code, not full response body** — Prevents potential credential leakage to Workers logs.

23. **[LOW] Store invite `invitedBy` as userId, not display name** — Data integrity; join for display on read.

24. **[LOW] Add pre-commit hooks via husky** — Gates lint before commit; prevents broken lint from reaching CI.

25. **[LOW] Add Prettier / formatter** — ESLint alone does not format; add `eslint-config-prettier` and `format` script.

26. **[LOW] Add MSW or `@miniflare/d1` mock** — Unblocks skipped auth-protected integration tests.

27. **[LOW] Wire error tracking (Sentry Cloudflare Workers SDK)** — Currently all server errors are silent.

28. **[LOW] Add `.claude/settings.json` enforcement hooks** — Automate lint gate, CHANGELOG reminder, and hardening nudge.

29. **[LOW] Parallelize MyMemory API calls in translate route** — Reduces latency for multi-block translation jobs.

30. **[LOW] Standardize error response shapes** — Use `apiError()` uniformly; eliminate bare-string error variants.

31. **[LOW] Fix stateful `gi` RegExp in `cssSanitize.ts`** — Use fresh RegExp objects for presence checks.

32. **[LOW] Add `@playwright/test` as local devDependency** — Makes E2E reproducible on fresh clone.

33. **[LOW] Align `eslint-config-next` to version 16.x** — Eliminates version mismatch with Next.js 16.

34. **[LOW] Add BOM generation step to CI** — Track all third-party dependencies for supply chain visibility.

---

*Generated by dream-studio:project-audit workflow — 2026-04-19*
