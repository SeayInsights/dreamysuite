## Review: DreamySuite Code Quality
Date: 2026-04-19

---

### Stage 1: Architectural Compliance

**App Router structure** — Clean. Route groups `(auth)`, `(dashboard)`, and direct API routes follow App Router conventions throughout. All routes use `async params` (Promise-based), which is correct for Next.js 16. No pages directories or mixed-router confusion detected.

**Cloudflare Workers integration** — Correct. Every API route uses `getCloudflareContext({ async: true })` to obtain bindings. The `Env` interface in `src/app/lib/auth.server.ts` covers DB, KV, R2, and all required secrets. `open-next.config.ts` and `wrangler.jsonc` are present.

**Editor V2 structure** — Coherent. `editor-v2/` is decomposed into:
- `EditorShell.tsx` — top-level mount
- `Canvas.tsx`, `Inspector.tsx`, `TopBar.tsx`, `IconRail.tsx`, `SlideTray.tsx` — panel layout
- `hooks/` — sync hooks (block, settings, translations, shortcuts, selection, gestures, drag)
- `trays/` — per-panel feature trays (Navigation, Layers, Effects, Language, Media, Music, Pages, Settings, Theme)
- `inspector/` — block-specific panels
- `editing/` — inline editing components
- `commands/` — keyboard command registry

V2 is substantially complete and well-decomposed. Legacy `editor.tsx` (5400-line monolith) is still present at `src/app/(dashboard)/sites/[id]/editor.tsx` alongside V2, but ARCHITECTURE.md documents this as a planned Phase 3 deprecation — not an error.

**Gaps found:**

1. `index.tsx` imports `EditorShell` from `./EditorShell` but `EditorShell.tsx` is not visible in the Glob output (it is present via direct `ls`). Glob path truncation in tooling masked it — file exists, no structural gap.

2. `src/app/api/sites/[id]/rsvp/route.ts` — duplicate RSVP insertion endpoint. This accepts `POST /api/sites/:id/rsvp` keyed by numeric siteId (not slug), bypassing the published-site check that the correct `POST /api/public/[siteSlug]/rsvp` enforces. It inserts a guest without verifying `status = 'published'`. See Critical finding #1.

3. `src/app/api/sites/[id]/guestbook/route.ts` — public GET is not protected by the site's publish status. Anyone can read or write guestbook entries for any siteId. See High finding #1.

4. `src/app/animations/presets/` exists but no corresponding public-site renderer or editor preview wires it. ARCHITECTURE.md notes GSAP is CDN-loaded on the public site; the presets directory under `src/app/` is disconnected from any import visible in the reviewed files. Likely orphaned or incomplete.

5. No `src/components/editor/` directory — all editor code lives under `src/app/(dashboard)/sites/[id]/editor-v2/`. ARCHITECTURE.md does not reference a `src/components/editor/` path; this is a non-issue.

**Verdict: COMPLIANT** with two unresolved gaps (items 2 and 3 above tracked as Critical/High in Stage 2).

---

### Stage 2: Code Quality

---

#### Critical (blocks ship)

**C1 — Unauthenticated RSVP insertion bypasses published-site check**
`src/app/api/sites/[id]/rsvp/route.ts:8–74`

This route is completely public — no auth, no ownership check. It only verifies `status = 'published'` before inserting, which is correct. However, the insertion schema differs from the public slug-based RSVP flow: it creates a *new* guest record rather than matching an existing guest-list entry. This means any anonymous caller who knows (or guesses) a siteId can insert arbitrary guest rows into any published site's guest table, permanently inflating RSVP counts and injecting data visible to the site owner's dashboard.

Additionally `rsvpStatus` is accepted from the caller with only a soft fallback:
```ts
const status = VALID_STATUSES.includes(rsvpStatus ?? "") ? rsvpStatus! : "pending";
```
A caller can directly insert `rsvpStatus = "yes"` or `"no"` on creation, skipping the intended pending-then-respond flow.

**Fix:** Either remove this route entirely (the canonical flow is via `/api/public/[siteSlug]/rsvp` which matches against an owner-pre-seeded guest list), or add rate-limiting and enforce `rsvpStatus = "pending"` on insertion regardless of caller input.

---

#### High (blocks ship)

**H1 — Guestbook POST accepts entries for unpublished (draft) sites**
`src/app/api/sites/[id]/guestbook/route.ts:33–38`

The existence check for POST is:
```ts
const site = await env.DB.prepare("SELECT id FROM site WHERE id = ?").bind(siteId).first();
```
No `status = 'published'` filter. Guests can submit guestbook entries to sites the owner has taken offline or has never published. The GET also returns all entries to any caller without checking publish status.

**Fix:**
```ts
// POST check
"SELECT id FROM site WHERE id = ? AND status = 'published'"
// GET — same change, or require auth for unlisted sites
```

**H2 — `useBlockSync.flushNow` calls `flushOps` without awaiting, then immediately marks clean**
`src/app/(dashboard)/sites/[id]/editor-v2/hooks/useBlockSync.ts:87–95`

In the `beforeunload`/unmount path `flushNow` is:
```ts
flushOps(siteIdRef.current, pageId, state.pendingOps, state.blocks); // not awaited
state.markClean(); // state cleared immediately
```
`flushOps` is not awaited. On page close, the Worker's `keepalive: true` on the fetch calls is the only protection keeping those requests alive after the page exits. In the unmount case (user navigating away without a page reload), keepalive is unreliable for multiple concurrent requests >64 KB aggregate payload. If the flush fails, `markClean()` has already discarded the pending ops — the lost changes cannot be retried.

The debounced timer path (line 105–106) correctly awaits `flushOps` before calling `markClean()`.

**Fix:** Either accept `keepalive`-only as "best effort" for unload (document the known loss risk), or mark clean only after the promise settles — which can't reliably be done in `beforeunload`. A safer approach: don't call `markClean()` in `flushNow` at all; let the debounce path handle cleanup on normal navigation, and accept data loss only on hard closes.

**H3 — `translate/route.ts` duplicates the ownership check inline instead of using `requireSiteOwnership`**
`src/app/api/sites/[id]/translate/route.ts:13–25`

Eight other API files that ship different ownership semantics (`/canva/designs`, `/canva/import`, `/media/[mediaId]`, `/domain/check`, `/domain/purchase`) all roll their own `createAuth` + raw DB check instead of delegating to `requireSiteOwnership`. This matters because `requireSiteOwnership` checks both ownership AND the invite table in one tested unit. The inline copies at `/translate` and `/canva/designs` check the invite table correctly, but `/domain/check` (line 34–35) only checks auth — it never verifies site ownership at all. `domain/check` is a read-only operation, making this a medium issue there, but the pattern of ad-hoc auth creates a maintenance hazard: any future change to invite semantics must be replicated across 8 files.

**Fix:** Migrate all routes under `sites/[id]/*` to use `requireSiteOwnership` (or `requireSiteOwner` for owner-only operations). The `domain/check` and `domain/purchase` routes that are not scoped to a specific site should keep their `createAuth` call but document the intentional difference.

**H4 — `settings/route.ts` GET has no try/catch; DB errors return 500 stack traces**
`src/app/api/sites/[id]/settings/route.ts:22–43`

The GET handler has no error wrapper. Any D1 failure (connection timeout, schema mismatch) will propagate as an uncaught Next.js 500 with a stack trace in the response body in development, or a generic Workers error in production. The PUT handler (line 49) correctly wraps in try/catch with `apiError("DB_ERROR", ...)`.

**Fix:** Wrap GET in the same try/catch pattern as PUT.

---

#### Medium (fix before next release)

**M1 — `page slug` not validated on `POST /api/sites/[id]/pages`**
`src/app/api/sites/[id]/pages/route.ts:43–46`

`slug` is accepted as any string (including slashes, spaces, Unicode) and inserted directly. The only guard is the DB UNIQUE constraint (caught line 67). A slug like `../settings` or `__proto__` will insert successfully and become part of the public URL structure.

**Fix:** Add regex validation: `if (!/^[a-z0-9-]+$/.test(slug))` before insertion.

**M2 — `guestPassword` is SHA-256 hashed, not bcrypt/argon2**
`src/app/api/sites/[id]/settings/route.ts:16–19`

```ts
async function hashGuestPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", ...);
  return `$sha256$${hex}`;
}
```

SHA-256 is not a password-hashing function: it is fast, unsalted, and rainbow-table vulnerable. Guest passwords are low-stakes (they gate page access, not accounts), but the current implementation provides no real security if D1 is compromised.

**Fix:** Use `crypto.subtle` PBKDF2 with a random salt, or accept that guest page passwords are low-security and document that clearly so it isn't confused with account password hashing (which better-auth handles correctly).

**M3 — `CustomCssPanel` applies CSS to live document head while editor is open**
`src/app/(dashboard)/sites/[id]/editor-v2/inspector/CustomCssPanel.tsx:37–42`

```ts
if (!styleRef.current) {
  styleRef.current = document.createElement("style");
  document.head.appendChild(styleRef.current);
}
styleRef.current.textContent = scoped;
```

The CSS is injected into the editor's own `<head>`, not into the preview iframe. This means the sanitized-but-still-applied CSS can affect the editor UI itself. The `sanitizeCss` regex-based sanitizer blocks `@import` and `expression()` but does not block `position:fixed`, `z-index`, or CSS that could overlay or obscure editor controls.

**Fix:** Target the canvas iframe's document instead of `document.head`, or scope the style injection to a shadow DOM within the canvas area.

**M4 — `useSettingsSync.flushNow` fires the settings PUT without awaiting or error-handling**
`src/app/(dashboard)/sites/[id]/editor-v2/hooks/useSettingsSync.ts:25–30`

```ts
fetch(`/api/sites/${siteIdRef.current}/settings`, {
  method: "PUT",
  ...
  keepalive: true,
});
// return value not captured, no .catch()
```

Same pattern as H2 but for settings. On unmount, a settings change made in the last 1.5 seconds can be silently lost with no user feedback.

**Fix:** Mirror H2 fix recommendation — either document as best-effort or implement the flush before unmount via a `beforeunload` with `navigator.sendBeacon` for the settings payload.

**M5 — `invites/route.ts` POST records the invite AFTER sending the email**
`src/app/api/sites/[id]/invites/route.ts:58–98`

The Resend call fires (line 58), and only if it succeeds does the DB record get written (line 95). If Resend succeeds but the `INSERT` fails (transient D1 error), the email has been sent but the invite is not in the database. On retry, the user gets a 502 (not a duplicate check), and the invited person has received an email for an invite that doesn't exist in the system.

**Fix:** Write the DB record first, then send the email. On email failure, either delete the DB record or surface the email error without a 502 (the invite exists; the email can be re-sent).

**M6 — `blocks/route.ts` (POST) does not validate `sortOrder` as a non-negative integer**
`src/app/api/sites/[id]/blocks/route.ts:29, 60–65`

`sortOrder` is passed from the client as `number | undefined` and inserted directly. A negative value or non-integer float will write to the DB unchecked and disrupt ordering logic.

**Fix:** Add `typeof sortOrder === "number" && Number.isInteger(sortOrder) && sortOrder >= 0` guard.

---

#### Low (improve when convenient)

**L1 — `translate/route.ts` uses a sequential loop to call MyMemory API**
`src/app/api/sites/[id]/translate/route.ts:54–69`

Each field is translated sequentially. For a page with 10+ text blocks, this multiplies latency. The MyMemory API is stateless per call.

**Fix:** Use `Promise.all` / `Promise.allSettled` with a concurrency cap (e.g., `p-limit`) or batch the calls where the API allows multiple segments.

**L2 — Error response shapes are inconsistent across routes**
Some routes return `{ error: { code, message } }` (standard pattern from `apiError`); others return `{ error: "Unauthorized" }` or `{ error: "Invalid JSON" }` bare strings (`/domain/check` line 35, `/translate` line 15). Frontend error handling would need to detect both shapes.

**Fix:** Use `apiError()` from `site-auth.ts` uniformly. The bare-string variants are concentrated in the inline-auth routes identified in H3.

**L3 — `cssSanitize.ts` regex uses `.test()` then `.replace()` on stateful RegExp objects with `gi` flag**
`src/lib/cssSanitize.ts:1–3`

The `gi` flag makes JavaScript RegExp objects stateful (via `lastIndex`). Calling `.test()` followed by `.replace()` on the same object is safe here because `.replace()` resets `lastIndex`, but the pattern is fragile — if a future refactor calls `.test()` twice consecutively without a `.replace()` in between, alternate calls will mis-report due to `lastIndex` advancing.

**Fix:** Use `RegExp.test()` only on freshly constructed or non-stateful (no `g` flag) patterns, or call `.reset()` / use string `.match()` instead of `.test()` for presence checks.

**L4 — `auth.server.ts` has no email verification and no rate limiting**
`src/app/lib/auth.server.ts:20–24`

`requireEmailVerification: false` is set explicitly. For a wedding SaaS this is likely intentional (simplicity), but it means anyone can sign up with a fake email and immediately access the dashboard. No brute-force protection is present either.

**Fix (low-priority):** If email verification is intentionally skipped, document the decision. Consider adding better-auth's `rateLimit` plugin to the auth config for the login endpoint.

**L5 — ARCHITECTURE.md item #5 (Playwright fragile install path) is still unresolved**
`ARCHITECTURE.md:83`

The known issue references `../../node_modules/@playwright/test/cli.js` from a studio monorepo install. This makes E2E non-reproducible on a fresh clone.

**Fix:** Add `@playwright/test` as a local `devDependency` and update the scripts in `package.json`.

---

### Summary

Spec: COMPLIANT
Critical: 1 | High: 4 | Medium: 6 | Low: 5
Ship: BLOCKED — C1 (unauthenticated RSVP inserts arbitrary guest rows into published sites) and H1 (guestbook accepts entries to unpublished sites) are data-integrity issues that can silently corrupt the guest list and inflate RSVP counts. H2 and H4 risk silent data loss and unhandled 500s on a core user path.
