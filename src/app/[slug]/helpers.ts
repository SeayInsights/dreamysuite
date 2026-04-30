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
      const match = u.pathname.match(/\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      if (match) return { type: "spotify", kind: match[1], id: match[2] };
    }
    if (u.hostname.includes("soundcloud.com")) {
      return { type: "soundcloud" };
    }
    const ext = u.pathname.split(".").pop()?.toLowerCase();
    if (ext && ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      return { type: "audio" };
    }
  } catch { /* invalid URL */ }
  return null;
}

/** Convert newlines to <br> so user-typed paragraph breaks survive HTML rendering. */
export function nl2br(text: string): string {
  return escHtml(text).replace(/\n/g, "<br>");
}

export function safeUrl(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) return "#";
  return raw;
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
