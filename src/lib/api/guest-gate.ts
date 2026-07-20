/**
 * Guest-password gate for public data endpoints.
 *
 * The SSR `[slug]` route gates password-protected sites with a 401 page; the
 * public JSON endpoints (site content, guestbook) gate equivalently via
 * `isGuestUnlocked`.
 *
 * Unlock model: after a correct password is submitted, the `ds_pw_<slug>`
 * cookie stores the site's stored PBKDF2 hash (`guestUnlockToken`). Later
 * requests prove they unlocked by presenting it back, compared constant-time
 * against the stored hash. (Earlier the cookie stored a *fresh* hash of the
 * password, which could never re-verify against the stored hash — the gate
 * failed closed and protected sites never unlocked.)
 */

/** Constant-time compare. Length differs → early false; the stored hash is a
 *  fixed-length string, so the length branch leaks nothing sensitive. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Cookie name carrying the unlocked-proof for a slug. */
export function guestPwCookieName(slug: string): string {
  return `ds_pw_${slug}`;
}

/** Value to store in the unlock cookie after a correct password submission. */
export function guestUnlockToken(storedGuestPassword: string): string {
  return storedGuestPassword;
}

/** True when the cookie value proves the guest password (constant-time). */
export function guestCookieMatches(
  pwCookie: string | null,
  storedGuestPassword: string,
): boolean {
  if (!pwCookie) return false;
  return timingSafeEqual(pwCookie, storedGuestPassword);
}

/**
 * Returns true when the site is not password-protected, or when `pwCookie`
 * (the `ds_pw_<slug>` cookie value) matches the stored hash.
 */
export async function isGuestUnlocked(
  db: D1Database,
  siteId: string,
  pwCookie: string | null,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT guestPassword FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first<{ guestPassword: string | null }>();

  if (!row?.guestPassword) return true; // not protected
  return guestCookieMatches(pwCookie, row.guestPassword);
}
