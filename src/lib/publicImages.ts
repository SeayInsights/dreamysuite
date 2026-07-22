/**
 * Rewrite owner-gated photo URLs (/api/sites/<siteId>/photos/<photoId>) to the
 * public, WebP-optimized image route (/api/img/<photoId>). Used on the published
 * `[slug]` HTML so guest browsers — which aren't the site owner — can load
 * gallery images, background images, etc.
 */
export function rewritePhotoUrlsToPublic(html: string): string {
  return html.replace(
    /\/api\/sites\/[A-Za-z0-9_-]+\/photos\/([A-Za-z0-9_-]+)/g,
    "/api/img/$1",
  );
}
