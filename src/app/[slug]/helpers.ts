// ── HTML helpers ──────────────────────────────────────────────────────────────

export function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type MusicSource =
  | { type: "youtube"; id: string }
  | { type: "spotify"; kind: string; id: string }
  | { type: "soundcloud" }
  | { type: "audio" };

export function parseMusicSource(url: string): MusicSource | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];
      if (id) return { type: "youtube", id };
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return { type: "youtube", id };
    }
    if (u.hostname.includes("spotify.com")) {
      const match = u.pathname.match(
        /\/(track|album|playlist)\/([a-zA-Z0-9]+)/,
      );
      if (match) return { type: "spotify", kind: match[1], id: match[2] };
    }
    if (u.hostname.includes("soundcloud.com")) {
      return { type: "soundcloud" };
    }
    const ext = u.pathname.split(".").pop()?.toLowerCase();
    if (ext && ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      return { type: "audio" };
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

/** Convert newlines to <br> so user-typed paragraph breaks survive HTML rendering. */
export function nl2br(text: string): string {
  return escHtml(text).replace(/\n/g, "<br>");
}

/**
 * Sanitize an owner-provided URL before it is rendered into an href/src/CSS
 * url(). Uses a positive scheme allowlist rather than a prefix denylist, which
 * is bypassable via control characters (e.g. "java\tscript:" — browsers strip
 * the tab and execute it, but a startsWith("javascript:") check misses it).
 *
 * Allowed: relative URLs (path/query/fragment) and http / https / mailto.
 * Anything else (javascript:, data:, vbscript:, tel:, file:, …) returns "#".
 */
export function safeUrl(raw: string): string {
  if (!raw) return "#";
  // Drop ASCII control chars (incl. tab/newline/CR) that browsers ignore but
  // which can smuggle a disallowed scheme past a naive check.
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!cleaned) return "#";
  // Relative URLs carry no scheme and are safe.
  if (
    cleaned.startsWith("/") ||
    cleaned.startsWith("#") ||
    cleaned.startsWith("?")
  ) {
    return cleaned;
  }
  try {
    const url = new URL(cleaned, "https://relative.invalid");
    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return cleaned;
    }
  } catch {
    /* unparseable → reject */
  }
  return "#";
}

export function placeholder(text: string): string {
  return `<p class="placeholder-text">${escHtml(text)}</p>`;
}

export function mediaPlaceholder(label: string): string {
  return `<div class="media-placeholder" aria-label="${escHtml(label)} placeholder">
    <span class="media-placeholder-icon" aria-hidden="true">&#9654;</span>
    <p>${escHtml(label)} will appear here once added.</p>
  </div>`;
}
