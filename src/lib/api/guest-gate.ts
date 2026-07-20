import { verifyGuestPassword } from "@/lib/crypto/guestPassword";

/**
 * Guest-password gate for public data endpoints.
 *
 * The SSR `[slug]` route gates password-protected sites by returning a 401
 * password page, but the public JSON endpoints (site content, guestbook) only
 * *omitted* the guestPassword field while still returning all data. This helper
 * mirrors the SSR gate so those endpoints can deny locked sites too.
 *
 * Returns true when the site is not password-protected, or when `pwCookie`
 * (the `ds_pw_<slug>` cookie value) verifies against the stored hash.
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
  if (!pwCookie) return false;
  return verifyGuestPassword(pwCookie, row.guestPassword);
}

/** Cookie name carrying the unlocked guest-password proof for a slug. */
export function guestPwCookieName(slug: string): string {
  return `ds_pw_${slug}`;
}
