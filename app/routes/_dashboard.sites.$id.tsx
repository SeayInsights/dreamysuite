import { redirect, useLoaderData, useSearchParams } from "react-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_dashboard.sites.$id";
import "~/lib/context";
import editorStyles from "~/styles/site-editor.css?url";
import Sortable from "sortablejs";

export function links() {
  return [{ rel: "stylesheet", href: editorStyles }];
}

// ── Domain types ──────────────────────────────────────────────────────────────

interface Site {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  eventType: string | null;
  status: string;
  previewColor: string;
  updatedAt: number;
}

interface Page {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface Block {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

interface Photo {
  id: string;
  siteId: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  createdAt: number;
}

interface MediaItem {
  id: string;
  siteId: string;
  mediaType: "video" | "music";
  url: string;
  title: string | null;
  sortOrder: number;
  createdAt: number;
}

interface Guest {
  id: string;
  siteId: string;
  firstName: string;
  lastName: string | null;
  party: string | null;
  rsvpStatus: "pending" | "yes" | "no";
  notes: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface Template {
  id: string;
  siteId: string;
  name: string;
  isPublished: number;
  createdAt: number;
}

interface SiteSettings {
  siteId: string;
  eventName: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  greeting: string | null;
  musicUrl: string | null;
  mainLanguage: string;
  secondLanguage: string | null;
  guestPassword: string | null;
  isLive: number;
  headingFont: string;
  bodyFont: string;
  accentColor: string;
  bgColor: string;
  songPages: string | null;
  songResetPages: string | null;
  headingColor: string | null;
  bodyColor: string | null;
  siteTextColor: string | null;
  siteBorderColor: string | null;
  buttonStyle: string;
  buttonBorderWidth: string;
  headingFontVi: string | null;
  bodyFontVi: string | null;
  navBg: string;
  navPosition: string;
  navBrandColor: string;
  navLinkColor: string;
  navHighlightColor: string;
  navItemsConfig: string | null;
  animation: string | null;
  bgImage: string | null;
  envelopeColor: string | null;
  sealInitials: string;
  cardColor: string;
  cardImage: string;
  navShape: string;
  navLinkPadding: string;
  navUnderline: string | null;
  popupEnabled: number;
  popupTitle: string | null;
  popupTicker: number;
  popupAfterAnimation: number;
  popupBundle: number | null;
  musicBtnBg: string | null;
  musicBtnColor: string | null;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
  bgImageLayer: string;
  bgImageOpacity: number;
  siteMaxWidth: string;
}

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail_url: string;
}

interface AnalyticsData {
  rsvp: {
    total: number;
    accepted: number;
    declined: number;
    pending: number;
  };
  pageViews: Array<{ pageSlug: string; views: number }>;
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");

  // Primary: owner check
  let result = await context.cloudflare.env.DB
    .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ? AND userId = ?")
    .bind(params.id, session.user.id)
    .first<Site>();

  // Fallback: collaborator invite check
  if (!result) {
    const invite = await context.cloudflare.env.DB
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(params.id, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (invite) {
      result = await context.cloudflare.env.DB
        .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ?")
        .bind(params.id)
        .first<Site>();
    }
  }

  if (!result) throw redirect("/");

  return { site: result, user: session.user };
}

// ── Constants ─────────────────────────────────────────────────────────────────

type Section = "website" | "media" | "guestlist" | "templates" | "site-setup" | "analytics";

const EVENT_TYPES = [
  { type: "wedding",     icon: "💍", label: "Wedding" },
  { type: "anniversary", icon: "🥂", label: "Anniversary" },
  { type: "vow-renewal", icon: "🌸", label: "Vow Renewal" },
  { type: "engagement",  icon: "💫", label: "Engagement" },
  { type: "elopement",   icon: "✈️", label: "Elopement" },
  { type: "celebration", icon: "🎉", label: "Celebration" },
];

const BLOCK_TYPES = [
  { type: "home-hero",     label: "Hero",             color: "var(--accent)" },
  { type: "text",          label: "Text",             color: "#6b7280" },
  { type: "photo-split",   label: "Photo + Content",  color: "#4F8EDB" },
  { type: "images",        label: "Images",           color: "#ec4899" },
  { type: "video",         label: "Video",            color: "#ef4444" },
  { type: "countdown",     label: "Countdown",        color: "#f59e0b" },
  { type: "header",        label: "Header",           color: "#8b5cf6" },
  { type: "multi-text",    label: "Text / List",      color: "#7c3aed" },
  { type: "rsvp",          label: "RSVP",             color: "var(--accent)" },
  { type: "spacer",        label: "Spacer",           color: "#d4cec8" },
  { type: "registry-card", label: "Registry",         color: "#e86c4a" },
  { type: "hotel-card",    label: "Hotel",            color: "#3b82f6" },
  { type: "venue-map",     label: "Venue Map",        color: "#10b981" },
  { type: "youtube",       label: "YouTube",          color: "#ef4444" },
  { type: "schedule",      label: "Schedule",         color: "#d97706" },
  { type: "faq",           label: "Q & A",            color: "#0ea5e9" },
  { type: "tidbits",       label: "Fun Facts",        color: "#a855f7" },
  { type: "travel-section",label: "Travel Card",      color: "#06b6d4" },
];

const LANG_FLAGS: Record<string, string> = {
  en: "🇺🇸", vi: "🇻🇳", es: "🇪🇸", fr: "🇫🇷",
  "zh-CN": "🇨🇳", "zh-TW": "🇹🇼", ko: "🇰🇷", ja: "🇯🇵",
  de: "🇩🇪", pt: "🇧🇷", it: "🇮🇹", th: "🇹🇭", tl: "🇵🇭", hi: "🇮🇳", ar: "🇸🇦",
};

const HEADING_FONTS = ["Georgia", "Playfair Display", "Inter", "Lato", "Merriweather", "Cormorant Garamond"];
const BODY_FONTS    = ["Inter", "Lato", "Georgia", "Source Sans 3", "Open Sans"];
const LANGUAGES     = [
  { code: "en",    label: "English" },
  { code: "vi",    label: "Vietnamese (Tiếng Việt)" },
  { code: "es",    label: "Spanish (Español)" },
  { code: "fr",    label: "French (Français)" },
  { code: "zh-CN", label: "Chinese Simplified (简体中文)" },
  { code: "zh-TW", label: "Chinese Traditional (繁體中文)" },
  { code: "ko",    label: "Korean (한국어)" },
  { code: "ja",    label: "Japanese (日本語)" },
  { code: "de",    label: "German (Deutsch)" },
  { code: "pt",    label: "Portuguese (Português)" },
  { code: "it",    label: "Italian (Italiano)" },
  { code: "th",    label: "Thai (ภาษาไทย)" },
  { code: "tl",    label: "Tagalog (Filipino)" },
  { code: "hi",    label: "Hindi (हिन्दी)" },
  { code: "ar",    label: "Arabic (العربية)" },
];

// ── Toast hook ────────────────────────────────────────────────────────────────

function useToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible]   = useState(false);
  const [isError, setIsError]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, error = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setIsError(error);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  const Toast = (
    <div
      className={`editor-toast${visible ? " show" : ""}${isError ? " err" : ""}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );

  return { show, Toast };
}

// ── ColorSwatch ───────────────────────────────────────────────────────────────

const COLOR_PRESETS = ["#ffffff","#000000","#9b8e85","#B8921A","#e75850","#f59e0b","#6366f1","#ec4899"];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').padEnd(6, '0');
  return [parseInt(h.slice(0,2),16)||0, parseInt(h.slice(2,4),16)||0, parseInt(h.slice(4,6),16)||0];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r,g,b].map(v => Math.min(255,Math.max(0,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function parseColorValue(v: string): { hex: string; opacity: number } {
  if (typeof v === 'string' && v.startsWith('rgba(')) {
    const m = v.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (m) return { hex: rgbToHex(+m[1], +m[2], +m[3]), opacity: Math.round(+m[4] * 100) };
  }
  return { hex: (v && v.startsWith('#') && v.length >= 7) ? v.slice(0,7) : (v || '#000000'), opacity: 100 };
}
function buildColorValue(hex: string, opacity: number): string {
  if (opacity >= 100) return hex;
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${(opacity/100).toFixed(2)})`;
}

function ColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parsed = useMemo(() => parseColorValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(parsed.hex);
  const [opacity, setOpacity] = useState(parsed.opacity);
  const [mode, setMode] = useState<'hex' | 'rgb'>('hex');
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseColorValue(value);
    setHex(p.hex);
    setOpacity(p.opacity);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (dropRef.current && !dropRef.current.contains(target)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function openPicker() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(o => !o);
  }

  function commit(newHex: string, newOpacity: number) {
    const v = buildColorValue(newHex, newOpacity);
    onChange(v);
  }

  function commitHex(v: string) {
    const clean = v.startsWith('#') ? v : '#' + v;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      setHex(clean);
      commit(clean, opacity);
    } else {
      setHex(hex);
    }
  }

  const [r, g, b] = hexToRgb(hex);

  const displayValue = buildColorValue(hex, opacity);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={openPicker}
        style={{
          width: 28, height: 26, borderRadius: 4, border: '1px solid #e0dbd4',
          background: displayValue || '#fff', cursor: 'pointer', padding: 0, flexShrink: 0,
          position: 'relative', overflow: 'hidden',
        }}
        aria-label={`Color picker, current: ${displayValue}`}
      >
        {opacity < 100 && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
            backgroundSize: '6px 6px',
            backgroundPosition: '0 0, 3px 3px',
            zIndex: 0,
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: displayValue, zIndex: 1 }} />
      </button>
      {open && dropPos && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            right: dropPos.right,
            zIndex: 99999,
            background: '#fff',
            border: '1px solid #e0dbd4',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            padding: '0.7rem',
            minWidth: 220,
          }}
        >
          {/* Color wheel */}
          <input
            type="color"
            value={hex.length === 7 && hex.startsWith('#') ? hex : '#000000'}
            onChange={e => { setHex(e.target.value); commit(e.target.value, opacity); }}
            style={{ width: '100%', height: 38, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 6, marginBottom: '0.5rem', display: 'block' }}
          />

          {/* HEX / RGB tabs */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '0.4rem', background: '#f5f2ee', borderRadius: 6, padding: '2px' }}>
            {(['hex','rgb'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ flex: 1, padding: '3px 0', fontSize: '0.7rem', fontWeight: mode === m ? 700 : 400, borderRadius: 4, border: 'none', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#1c1917' : '#9b8e85', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                {m}
              </button>
            ))}
          </div>

          {/* HEX input */}
          {mode === 'hex' && (
            <input
              type="text"
              value={hex}
              maxLength={7}
              onChange={e => setHex(e.target.value)}
              onBlur={e => commitHex(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitHex(hex); }}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e0dbd4', borderRadius: 5, padding: '5px 8px', fontSize: '0.8rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}
            />
          )}

          {/* RGB inputs */}
          {mode === 'rgb' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '0.5rem' }}>
              {([['R', r], ['G', g], ['B', b]] as [string, number][]).map(([label, val], idx) => (
                <div key={label}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#9b8e85', textAlign: 'center', marginBottom: '2px' }}>{label}</div>
                  <input
                    type="number"
                    min={0} max={255}
                    value={val}
                    onChange={e => {
                      const newVal = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                      const newRgb: [number,number,number] = [r, g, b];
                      newRgb[idx] = newVal;
                      const newHex = rgbToHex(...newRgb);
                      setHex(newHex);
                      commit(newHex, opacity);
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e0dbd4', borderRadius: 5, padding: '4px 4px', fontSize: '0.78rem', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Opacity */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#9b8e85', letterSpacing: '0.06em' }}>Opacity</span>
              <span style={{ fontSize: '0.72rem', color: '#6b5e56', fontFamily: 'monospace' }}>{opacity}%</span>
            </div>
            <input
              type="range"
              min={0} max={100}
              value={opacity}
              onChange={e => { const o = parseInt(e.target.value); setOpacity(o); commit(hex, o); }}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          {/* Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {COLOR_PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { setHex(p); setOpacity(100); commit(p, 100); setOpen(false); }}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 4, border: '1px solid #e0dbd4', background: p, cursor: 'pointer', padding: 0 }}
                aria-label={p}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SiteEditor() {
  const { site } = useLoaderData<typeof loader>();
  const { show: toast, Toast } = useToast();

  // Section state via URL param
  const [searchParams, setSearchParams] = useSearchParams();
  const section = (searchParams.get("s") ?? "website") as Section;
  function setSection(s: Section) {
    setSearchParams((prev) => { prev.set("s", s); return prev; });
  }

  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop");

  // Publish state
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    setPublishing(true);
    try {
      await fetch(`/api/sites/${site.id}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isLive: 1 }),
      });
      toast("Site published!");
    } catch {
      toast("Publish failed", true);
    } finally {
      setPublishing(false);
    }
  }

  // Website section state
  const [activeTab, setActiveTab]         = useState<"tiles" | "content">("tiles");
  const [pages, setPages]                 = useState<Page[]>([]);
  const [activePage, setActivePage]       = useState<Page | null>(null);
  const [blocks, setBlocks]               = useState<Block[]>([]);
  const [blockHistory, setBlockHistory]   = useState<Block[][]>([]);
  const [blockFuture, setBlockFuture]     = useState<Block[][]>([]);
  const [pagesLoading, setPagesLoading]   = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [pageDropOpen, setPageDropOpen]   = useState(false);
  const [addBlockOpen, setAddBlockOpen]   = useState(false);
  const [blockEditOpen, setBlockEditOpen]       = useState(false);
  const [editingBlock, setEditingBlock]         = useState<Block | null>(null);
  const [blockConfigFields, setBlockConfigFields] = useState<Record<string, unknown>>({});
  const [expandedBlockId, setExpandedBlockId]   = useState<string | null>(null);

  // Style tab
  const [styleHeadingFont, setStyleHeadingFont] = useState("Georgia");
  const [styleBodyFont, setStyleBodyFont]       = useState("Inter");
  const [styleAccent, setStyleAccent]           = useState(site.previewColor);

  // Photos section state
  const [photos, setPhotos]               = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploading, setUploading]         = useState(false);

  // Content tab state
  const [contentByPage, setContentByPage] = useState<Record<string, Record<string, Record<string, unknown>>>>({});
  const [contentLang, setContentLang]     = useState<"main" | "second">("main");
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving]   = useState(false);
  const [translating, setTranslating]       = useState(false);

  // Photo picker (for photo-split inline editor)
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<((url: string) => void) | null>(null);

  // Media section sub-tab
  const [mediaTab, setMediaTab] = useState<"photos" | "videos" | "music">("photos");

  // Video items state
  const [videos, setVideos]               = useState<MediaItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [newVideoUrl, setNewVideoUrl]     = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [addingVideo, setAddingVideo]     = useState(false);

  // Music tracks state
  const [musicTracks, setMusicTracks]         = useState<MediaItem[]>([]);
  const [musicLoading, setMusicLoading]       = useState(false);
  const [newMusicUrl, setNewMusicUrl]         = useState("");
  const [newMusicTitle, setNewMusicTitle]     = useState("");
  const [addingMusicTrack, setAddingMusicTrack] = useState(false);

  // Guests section state
  const [guests, setGuests]                 = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading]   = useState(false);
  const [guestFilter, setGuestFilter]       = useState("");
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ firstName: "", lastName: "", party: "", notes: "" });
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  // Templates section state
  const [templates, setTemplates]               = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [savingTemplate, setSavingTemplate]     = useState(false);

  // Site Setup / Settings
  const [eventType, setEventType]         = useState(site.eventType ?? "wedding");
  const [savingType, setSavingType]       = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const [qrDownloading, setQrDownloading]       = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState(site.customDomain ?? "");
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainTab, setDomainTab] = useState<"free" | "buy">("free");
  const [domainSearch, setDomainSearch] = useState("");
  const [domainCheckLoading, setDomainCheckLoading] = useState(false);
  const [domainResult, setDomainResult] = useState<{
    domain: string; tld: string; available: boolean; price: number | null; supported: boolean;
  } | null>(null);
  const [domainCheckError, setDomainCheckError] = useState<string | null>(null);
  const [domainPurchasing, setDomainPurchasing] = useState(false);
  const [domainPurchaseError, setDomainPurchaseError] = useState<string | null>(null);

  async function handleDomainPurchase() {
    if (!domainResult) return;
    setDomainPurchasing(true);
    setDomainPurchaseError(null);
    try {
      const res = await fetch("/api/domain/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: domainResult.domain, siteId: site.id }),
      });
      const data = await res.json() as { success?: boolean; domain?: string; error?: { message?: string } | string };
      if (!res.ok) {
        const msg =
          typeof data.error === "object"
            ? (data.error?.message ?? "Purchase failed.")
            : (data.error ?? "Purchase failed.");
        setDomainPurchaseError(msg as string);
      } else {
        // Reload the page so the loader re-fetches the updated customDomain
        window.location.reload();
      }
    } catch {
      setDomainPurchaseError("Network error. Please try again.");
    } finally {
      setDomainPurchasing(false);
    }
  }

  async function checkDomainAvailability() {
    if (!domainSearch.trim()) return;
    setDomainCheckLoading(true);
    setDomainResult(null);
    setDomainCheckError(null);
    try {
      const res = await fetch(`/api/domain/check?domain=${encodeURIComponent(domainSearch.trim())}`);
      const data = await res.json() as { error?: string; domain?: string; tld?: string; available?: boolean; price?: number | null; supported?: boolean };
      if (!res.ok) {
        setDomainCheckError(data.error ?? "Something went wrong.");
      } else {
        setDomainResult(data as { domain: string; tld: string; available: boolean; price: number | null; supported: boolean });
      }
    } catch {
      setDomainCheckError("Network error. Please try again.");
    } finally {
      setDomainCheckLoading(false);
    }
  }

  // Settings drawer
  const [settingsOpen, setSettingsOpen]           = useState(false);
  const [settingsDrawerTab, setSettingsDrawerTab] = useState<"info" | "style" | "nav" | "access" | "music" | "language" | "popup">("info");
  const [settings, setSettings]                   = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading]     = useState(false);
  const [savingSettings, setSavingSettings]       = useState(false);
  const [canvaConnected, setCanvaConnected]       = useState(false);
  const [canvaDesigns, setCanvaDesigns]           = useState<CanvaDesign[]>([]);
  const [canvaModalOpen, setCanvaModalOpen]       = useState(false);
  const [importingDesignId, setImportingDesignId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Collaborator invites
  const [invites, setInvites]           = useState<{ id: string; email: string; invitedBy: string; createdAt: number }[]>([]);
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  async function fetchInvites() {
    const res = await fetch(`/api/sites/${site.id}/invites`);
    if (res.ok) {
      const data = await res.json<{ invites: typeof invites }>();
      setInvites(data.invites);
    }
  }

  async function removeInvite(inviteId: string) {
    try {
      await fetch(`/api/sites/${site.id}/invites`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast("Collaborator removed");
    } catch {
      toast("Failed to remove collaborator", true);
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    try {
      const res = await fetch(`/api/sites/${site.id}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json<{ invite?: { id: string; email: string; invitedBy: string; createdAt: number }; error?: { message: string } }>();
      if (!res.ok) {
        toast(data.error?.message ?? "Failed to send invite", true);
      } else {
        setInvites((prev) => [data.invite!, ...prev]);
        setInviteEmail("");
        toast("Invite sent!");
      }
    } catch {
      toast("Failed to send invite", true);
    } finally {
      setInviteSending(false);
    }
  }
  const [settingsForm, setSettingsForm] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    greeting: "",
    musicUrl: "",
    mainLanguage: "en",
    secondLanguage: "",
    guestPassword: "",
    headingFont: "Georgia",
    bodyFont: "Inter",
    accentColor: "#B8921A",
    bgColor: "#ffffff",
    isLive: 0 as 0 | 1,
    songPages: "[]",
    songResetPages: "[]",
    headingColor: "#1c1917",
    bodyColor: "#1c1917",
    siteTextColor: "",
    siteBorderColor: "#e8e2da",
    buttonStyle: "filled",
    buttonBorderWidth: "1.5px",
    headingFontVi: "",
    bodyFontVi: "",
    navBg: "white",
    navPosition: "fixed",
    navBrandColor: "#1c1917",
    navLinkColor: "#6b6560",
    navHighlightColor: "#B8921A",
    navItemsConfig: "[]",
    animation: "",
    bgImage: "",
    envelopeColor: "",
    sealInitials: "",
    cardColor: "",
    cardImage: "",
    navShape: "",
    navLinkPadding: "14px",
    navUnderline: "on",
    popupEnabled: 1 as 0 | 1,
    popupTitle: "",
    popupTicker: 0 as 0 | 1,
    popupAfterAnimation: 0 as 0 | 1,
    popupBundle: 0 as 0 | 1,
    musicBtnBg: "",
    musicBtnColor: "",
    marginTop: "" as string,
    marginRight: "" as string,
    marginBottom: "" as string,
    marginLeft: "" as string,
    bgImageLayer: "behind",
    bgImageOpacity: 1,
    siteMaxWidth: "",
  });

  // CSV import state
  const csvImportRef = useRef<HTMLInputElement | null>(null);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  // Analytics section state
  const [analytics, setAnalytics]               = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Drag-to-reorder refs
  const blockListRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef<Block[]>(blocks);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  blocksRef.current = blocks;

  const previewUrl = activePage ? `/${site.slug}?_page=${activePage.id}&_t=${previewKey}` : `/${site.slug}?_t=${previewKey}`;
  const siteUrl = site.customDomain
    ? `https://${site.customDomain}`
    : `https://${site.slug}.dreamysuite.com`;

  const previewWidth = previewDevice === "mobile" ? "390px" : "100%";

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function apiFetch(path: string, options?: RequestInit) {
    const res = await fetch(`/api/sites/${site.id}${path}`, options);
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const body = await res.json() as { error?: { message?: string } };
        if (body?.error?.message) msg = body.error.message;
      } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  }

  // ── Fetch functions ─────────────────────────────────────────────────────────

  const fetchPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const data = await apiFetch("/pages") as { pages: Page[] };
      setPages(data.pages);
      if (data.pages.length > 0 && !activePage) {
        setActivePage(data.pages[0]);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load pages", true);
    } finally {
      setPagesLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBlocks = useCallback(async (pageId: string) => {
    setBlocksLoading(true);
    try {
      const data = await apiFetch(`/pages/${pageId}`) as { page: Page; blocks: Block[] };
      setBlocks(data.blocks);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load blocks", true);
    } finally {
      setBlocksLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVideos = useCallback(async () => {
    setVideosLoading(true);
    try {
      const data = await apiFetch("/media?type=video") as { items: MediaItem[] };
      setVideos(data.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load videos", true);
    } finally {
      setVideosLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMusicTracks = useCallback(async () => {
    setMusicLoading(true);
    try {
      const data = await apiFetch("/media?type=music") as { items: MediaItem[] };
      setMusicTracks(data.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load music", true);
    } finally {
      setMusicLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPhotos = useCallback(async () => {
    setPhotosLoading(true);
    try {
      const data = await apiFetch("/photos") as { photos: Photo[] };
      setPhotos(data.photos);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load photos", true);
    } finally {
      setPhotosLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGuests = useCallback(async (status?: string) => {
    setGuestsLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const data = await apiFetch(`/guests${qs}`) as { guests: Guest[] };
      setGuests(data.guests);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load guests", true);
    } finally {
      setGuestsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await apiFetch("/templates") as { templates: Template[] };
      setTemplates(data.templates);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load templates", true);
    } finally {
      setTemplatesLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await apiFetch("/settings") as { settings: SiteSettings };
      setSettings(data.settings);
      setSettingsForm({
        eventName:      data.settings.eventName      ?? "",
        eventDate:      data.settings.eventDate      ?? "",
        eventLocation:  data.settings.eventLocation  ?? "",
        greeting:       data.settings.greeting       ?? "",
        musicUrl:       data.settings.musicUrl       ?? "",
        mainLanguage:   data.settings.mainLanguage   ?? "en",
        secondLanguage: data.settings.secondLanguage ?? "",
        guestPassword:  data.settings.guestPassword  ?? "",
        headingFont:    data.settings.headingFont     ?? "Georgia",
        bodyFont:       data.settings.bodyFont        ?? "Inter",
        accentColor:    data.settings.accentColor     ?? "#B8921A",
        bgColor:            data.settings.bgColor            ?? "#ffffff",
        isLive:             (data.settings.isLive ?? 0) as 0 | 1,
        songPages:          data.settings.songPages          ?? "[]",
        songResetPages:     data.settings.songResetPages     ?? "[]",
        headingColor:       data.settings.headingColor       ?? "#1c1917",
        bodyColor:          data.settings.bodyColor          ?? "#1c1917",
        siteTextColor:      data.settings.siteTextColor      ?? "",
        siteBorderColor:    data.settings.siteBorderColor    ?? "#e8e2da",
        buttonStyle:        data.settings.buttonStyle        ?? "filled",
        buttonBorderWidth:  data.settings.buttonBorderWidth  ?? "1.5px",
        headingFontVi:      data.settings.headingFontVi      ?? "",
        bodyFontVi:         data.settings.bodyFontVi         ?? "",
        navBg:              data.settings.navBg              ?? "white",
        navPosition:        data.settings.navPosition        ?? "fixed",
        navBrandColor:      data.settings.navBrandColor      ?? "#1c1917",
        navLinkColor:       data.settings.navLinkColor       ?? "#6b6560",
        navHighlightColor:  data.settings.navHighlightColor  ?? "#B8921A",
        navItemsConfig:     data.settings.navItemsConfig     ?? "[]",
        animation:          data.settings.animation          ?? "",
        bgImage:            data.settings.bgImage            ?? "",
        envelopeColor:      data.settings.envelopeColor      ?? "",
        sealInitials:       data.settings.sealInitials       ?? "",
        cardColor:          data.settings.cardColor          ?? "",
        cardImage:          data.settings.cardImage          ?? "",
        navShape:           data.settings.navShape           ?? "",
        navLinkPadding:     (() => { const v = data.settings.navLinkPadding ?? "14px"; if (v.endsWith("rem")) return Math.round(parseFloat(v) * 16) + "px"; return v; })(),
        navUnderline:       data.settings.navUnderline       ?? "on",
        popupEnabled:       (data.settings.popupEnabled      ?? 1) as 0 | 1,
        popupTitle:         data.settings.popupTitle         ?? "",
        popupTicker:        (data.settings.popupTicker       ?? 0) as 0 | 1,
        popupAfterAnimation:(data.settings.popupAfterAnimation ?? 0) as 0 | 1,
        popupBundle:        (data.settings.popupBundle        ?? 0) as 0 | 1,
        musicBtnBg:         data.settings.musicBtnBg         ?? "",
        musicBtnColor:      data.settings.musicBtnColor      ?? "",
        marginTop:          String(data.settings.marginTop    ?? ""),
        marginRight:        String(data.settings.marginRight  ?? ""),
        marginBottom:       String(data.settings.marginBottom ?? ""),
        marginLeft:         String(data.settings.marginLeft   ?? ""),
        bgImageLayer:       data.settings.bgImageLayer        ?? "behind",
        bgImageOpacity:     data.settings.bgImageOpacity      ?? 1,
        siteMaxWidth:       String(data.settings.siteMaxWidth ?? ""),
      });
      setStyleHeadingFont(data.settings.headingFont ?? "Georgia");
      setStyleBodyFont(data.settings.bodyFont ?? "Inter");
      setStyleAccent(data.settings.accentColor ?? site.previewColor);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load settings", true);
    } finally {
      setSettingsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCanvaStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/canva/designs") as { connected: boolean; designs: CanvaDesign[] };
      setCanvaConnected(data.connected);
      if (data.connected) setCanvaDesigns(data.designs);
    } catch {
      setCanvaConnected(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const data = await apiFetch("/content") as { content: Array<{ pageSlug: string; lang: string; content: Record<string, unknown> }> };
      const byPage: Record<string, Record<string, Record<string, unknown>>> = {};
      for (const row of data.content) {
        if (!byPage[row.pageSlug]) byPage[row.pageSlug] = {};
        byPage[row.pageSlug][row.lang] = row.content;
      }
      setContentByPage(byPage);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load content", true);
    } finally {
      setContentLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveContent() {
    if (!activePage) return;
    setContentSaving(true);
    const slug = activePage.slug;
    const mainLang = settingsForm.mainLanguage || "en";
    const secondLang = settingsForm.secondLanguage;
    const toSave: Array<{ lang: string; content: Record<string, unknown> }> = [
      { lang: mainLang, content: contentByPage[slug]?.[mainLang] ?? {} },
    ];
    if (secondLang) toSave.push({ lang: secondLang, content: contentByPage[slug]?.[secondLang] ?? {} });
    try {
      await Promise.all(toSave.map(({ lang, content }) =>
        apiFetch("/content", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pageSlug: slug, lang, content }),
        })
      ));
      toast("Content saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save content", true);
    } finally {
      setContentSaving(false);
    }
  }

  async function handleTranslate() {
    if (!activePage || !settingsForm.secondLanguage) return;
    const fromLang = settingsForm.mainLanguage || "en";
    const toLang = settingsForm.secondLanguage;
    const pageSlug = activePage.slug;
    const mainContent = contentByPage[pageSlug]?.[fromLang] ?? {};
    // Collect all string fields from main language content
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(mainContent)) {
      if (typeof v === "string" && v.trim()) fields[k] = v;
    }
    if (Object.keys(fields).length === 0) {
      toast("No text content to translate on this page", true);
      return;
    }
    setTranslating(true);
    try {
      const res = await apiFetch("/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromLang, toLang, content: { page: fields } }),
      }) as { translations: Record<string, Record<string, string>> };
      const translated = res.translations?.page ?? {};
      setContentByPage((prev) => ({
        ...prev,
        [pageSlug]: {
          ...(prev[pageSlug] ?? {}),
          [toLang]: { ...((prev[pageSlug] ?? {})[toLang] ?? {}), ...translated },
        },
      }));
      toast(`Translated to ${toLang} — review then save`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Translation failed", true);
    } finally {
      setTranslating(false);
    }
  }

  function setContentField(slug: string, lang: string, key: string, value: unknown) {
    setContentByPage((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] ?? {}),
        [lang]: { ...((prev[slug] ?? {})[lang] ?? {}), [key]: value },
      },
    }));
  }

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiFetch("/analytics") as AnalyticsData;
      setAnalytics(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load analytics", true);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Section mount effects ───────────────────────────────────────────────────

  useEffect(() => {
    if (section === "website" && pages.length === 0) fetchPages();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "media") { fetchPhotos(); fetchVideos(); fetchMusicTracks(); }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "guestlist") fetchGuests(guestFilter || undefined);
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "templates") fetchTemplates();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "analytics") fetchAnalytics();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "site-setup" && !settings) fetchSettings();
    if (section === "site-setup") fetchCanvaStatus();
    if (section === "site-setup") fetchInvites();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("canva") === "connected") {
      toast("Canva connected!");
      setSearchParams((p) => { p.delete("canva"); return p; });
      fetchCanvaStatus();
    } else if (searchParams.get("canva") === "error") {
      toast("Canva connection failed. Please try again.", true);
      setSearchParams((p) => { p.delete("canva"); return p; });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "website" && activeTab === "content") {
      if (!settings) fetchSettings();
      fetchContent();
    }
  }, [section, activeTab, activePage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activePage) fetchBlocks(activePage.id);
  }, [activePage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (blockEditOpen && videos.length === 0) fetchVideos();
  }, [blockEditOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (expandedBlockId && videos.length === 0) fetchVideos();
  }, [expandedBlockId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settingsOpen && !settings) fetchSettings();
    if (settingsOpen && musicTracks.length === 0) fetchMusicTracks();
  }, [settingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync active page when user clicks a nav link in the preview iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "dreamysuite_pageChange") {
        const page = pages.find((p) => p.id === event.data.pageId);
        if (page) { setActivePage(page); setPageDropOpen(false); }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps

  // SortableJS — drag-to-reorder blocks
  // Depends on blocks.length so it re-initializes after blocks are added/removed,
  // ensuring blockListRef.current is populated when the effect runs.
  useEffect(() => {
    if (section !== "website" || activeTab !== "tiles") return;
    // Wait one frame to guarantee React has committed the block list to the DOM.
    let sortable: ReturnType<typeof Sortable.create> | null = null;
    const frame = requestAnimationFrame(() => {
      if (!blockListRef.current) return;
      const siteId = site.id;
      sortable = Sortable.create(blockListRef.current, {
        handle: ".drag-handle",
        draggable: ".bl-card-wrap",
        animation: 150,
        ghostClass: "bl-drag-ghost",
        chosenClass: "bl-sortable-chosen",
        forceFallback: false,
        onEnd(evt) {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
          setBlocks((prev) => {
            pushHistory(prev);
            const reordered = [...prev];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);
            Promise.all(
              reordered.map((b, i) =>
                fetch(`/api/sites/${siteId}/blocks/${b.id}`, {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ sortOrder: i }),
                })
              )
            )
              .then(() => toast("Tile order saved"))
              .catch(() => toast("Failed to save order", true));
            return reordered;
          });
        },
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      sortable?.destroy();
    };
  }, [section, activeTab, blocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Undo / Redo ─────────────────────────────────────────────────────────────

  function pushHistory(prev: Block[]) {
    setBlockHistory((h) => [...h.slice(-19), prev]);
    setBlockFuture([]);
  }

  function handleUndo() {
    if (blockHistory.length === 0) return;
    const restored = blockHistory[blockHistory.length - 1];
    setBlockFuture((f) => [blocks, ...f.slice(0, 19)]);
    setBlocks(restored);
    setBlockHistory((h) => h.slice(0, -1));
  }

  function handleRedo() {
    if (blockFuture.length === 0) return;
    const restored = blockFuture[0];
    setBlockHistory((h) => [...h.slice(-19), blocks]);
    setBlocks(restored);
    setBlockFuture((f) => f.slice(1));
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function handleAddBlock(type: string) {
    if (!activePage) return;
    pushHistory(blocks);
    try {
      await apiFetch("/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId: activePage.id, type, config: {}, sortOrder: blocks.length }),
      });
      await fetchBlocks(activePage.id);
      toast(`${type} tile added`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add tile", true);
    }
    setAddBlockOpen(false);
  }

  async function handleTogglePageVisibility(page: Page) {
    try {
      const updated = await apiFetch(`/pages/${page.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isVisible: page.isVisible === 0 }),
      }) as { page: Page };
      setPages((prev) => prev.map((p) => (p.id === page.id ? updated.page : p)));
      if (activePage?.id === page.id) setActivePage(updated.page);
      setPreviewKey((k) => k + 1);
      toast(updated.page.isVisible ? "Page visible" : "Page hidden");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update page", true);
    }
  }

  async function handleTogglePageLock(page: Page) {
    try {
      const updated = await apiFetch(`/pages/${page.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isLocked: page.isLocked === 0 }),
      }) as { page: Page };
      setPages((prev) => prev.map((p) => (p.id === page.id ? updated.page : p)));
      if (activePage?.id === page.id) setActivePage(updated.page);
      toast(updated.page.isLocked ? "Page locked" : "Page unlocked");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update page", true);
    }
  }

  async function handleToggleBlockVisibility(block: Block) {
    try {
      await apiFetch(`/blocks/${block.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isVisible: block.isVisible === 0 }),
      });
      if (activePage) await fetchBlocks(activePage.id);
      setPreviewKey((k) => k + 1);
      toast("Tile updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update tile", true);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    pushHistory(blocks);
    try {
      await apiFetch(`/blocks/${blockId}`, { method: "DELETE" });
      if (activePage) await fetchBlocks(activePage.id);
      toast("Tile deleted");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete tile", true);
    }
  }

  function handleEditBlock(block: Block) {
    setEditingBlock(block);
    try {
      setBlockConfigFields(JSON.parse(block.config || "{}") as Record<string, unknown>);
    } catch {
      setBlockConfigFields({});
    }
    setBlockEditOpen(true);
  }

  function toggleBlockExpand(block: Block) {
    if (expandedBlockId === block.id) {
      setExpandedBlockId(null);
    } else {
      setEditingBlock(block);
      try {
        setBlockConfigFields(JSON.parse(block.config || "{}") as Record<string, unknown>);
      } catch {
        setBlockConfigFields({});
      }
      setExpandedBlockId(block.id);
    }
  }

  async function handleSaveBlockConfig() {
    if (!editingBlock) return;
    try {
      pushHistory(blocks);

      let configToSave: Record<string, unknown> = { ...blockConfigFields };

      // Legacy migration: move inline content from config to site_content
      if (activePage) {
        const lang = settingsForm.mainLanguage || "en";
        const pageSlug = activePage.slug;

        type MigSpec = { blockType: string; cfgKey: string; contentKey: string };
        const migrations: MigSpec[] = [
          { blockType: "schedule", cfgKey: "events",  contentKey: "events"    },
          { blockType: "faq",      cfgKey: "items",   contentKey: "questions" },
          { blockType: "tidbits",  cfgKey: "items",   contentKey: "tidbits"   },
        ];

        const mig = migrations.find(m => m.blockType === editingBlock.type);

        if (mig) {
          const cfgVal = (configToSave as Record<string, unknown>)[mig.cfgKey];

          // Only write to site_content if legacy data is a non-empty array
          if (Array.isArray(cfgVal) && (cfgVal as unknown[]).length > 0) {
            const existing = contentByPage[pageSlug]?.[lang] ?? {};
            const alreadyHasData = Array.isArray((existing as Record<string, unknown>)[mig.contentKey]) &&
              ((existing as Record<string, unknown>)[mig.contentKey] as unknown[]).length > 0;

            if (!alreadyHasData) {
              const migratedContent = { ...(existing as Record<string, unknown>), [mig.contentKey]: cfgVal };
              await apiFetch(`/content`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ pageSlug, lang, content: migratedContent }),
              });
              await fetchContent();
            }
          }

          // Always strip the legacy key if it exists, even if it was empty
          if (cfgVal !== undefined) {
            const { [mig.cfgKey]: _removed, ...cleanedConfig } = configToSave as Record<string, unknown>;
            configToSave = cleanedConfig;
          }
        }
      }

      await apiFetch(`/blocks/${editingBlock.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: JSON.stringify(configToSave) }),
      });
      if (activePage) await fetchBlocks(activePage.id);
      setPreviewKey((k) => k + 1);
      setBlockEditOpen(false);
      toast("Tile config saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save tile config", true);
    }
  }

  function setField(key: string, val: unknown) {
    const updated = { ...blockConfigFields, [key]: val };
    setBlockConfigFields(updated);
    if (iframeRef.current?.contentWindow && expandedBlockId) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'block_config_update', blockId: expandedBlockId, config: updated },
        window.location.origin
      );
    }
  }

  function fireSettingsPreview(delta: Record<string, unknown>) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'site_settings_update', delta },
      window.location.origin
    );
  }

  async function handleReorderPage(pageId: string, direction: "up" | "down") {
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pages.length) return;
    const reordered = [...pages];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setPages(reordered);
    try {
      await Promise.all(
        reordered.map((p, i) =>
          fetch(`/api/sites/${site.id}/pages/${p.id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      );
      toast("Page order saved");
    } catch {
      toast("Failed to save page order", true);
    }
  }

  async function handleAddPage() {
    const raw = window.prompt("Page name:");
    if (!raw || !raw.trim()) return;
    const label = raw.trim();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
    try {
      await fetch(`/api/sites/${site.id}/pages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, slug }),
      });
      await fetchPages();
      toast("Page added");
    } catch {
      toast("Failed to add page", true);
    }
  }

  async function handleDeletePage(pageId: string) {
    if (pages.length <= 1) {
      toast("Cannot delete the last page", true);
      return;
    }
    const isActive = activePage?.id === pageId;
    if (isActive && blocks.length > 0) {
      if (!window.confirm("This page has tiles. Delete it anyway?")) return;
    }
    try {
      await fetch(`/api/sites/${site.id}/pages/${pageId}`, { method: "DELETE" });
      const remaining = pages.filter((p) => p.id !== pageId);
      setPages(remaining);
      if (isActive) {
        setActivePage(remaining[0] ?? null);
        if (remaining[0]) await fetchBlocks(remaining[0].id);
        else setBlocks([]);
      }
      toast("Page deleted");
    } catch {
      toast("Failed to delete page", true);
    }
  }

  async function handleSaveLayout() {
    try {
      await Promise.all(
        blocks.map((b, i) =>
          apiFetch(`/blocks/${b.id}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      );
      setPreviewKey((k) => k + 1);
      toast("Layout saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save layout", true);
    }
  }

  async function handleUploadPhoto(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch(`/api/sites/${site.id}/photos`, { method: "POST", body: fd })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json() as { error?: { message?: string } };
              throw new Error(body?.error?.message ?? "Upload failed");
            }
          });
      }
      await fetchPhotos();
      toast(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", true);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await apiFetch(`/photos/${photoId}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast("Photo deleted");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete photo", true);
    }
  }

  async function handleAddVideo() {
    if (!newVideoUrl.trim()) return;
    setAddingVideo(true);
    try {
      const data = await apiFetch("/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: newVideoUrl.trim(), title: newVideoTitle.trim() || null, mediaType: "video" }),
      }) as { item: MediaItem };
      setVideos((prev) => [...prev, data.item]);
      setNewVideoUrl("");
      setNewVideoTitle("");
      toast("Video added");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add video", true);
    } finally {
      setAddingVideo(false);
    }
  }

  async function handleDeleteVideo(videoId: string) {
    try {
      await apiFetch(`/media/${videoId}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      toast("Video removed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove video", true);
    }
  }

  async function handleAddMusicTrack() {
    if (!newMusicUrl.trim()) return;
    setAddingMusicTrack(true);
    try {
      const data = await apiFetch("/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: newMusicUrl.trim(), title: newMusicTitle.trim() || null, mediaType: "music" }),
      }) as { item: MediaItem };
      setMusicTracks((prev) => [...prev, data.item]);
      setNewMusicUrl("");
      setNewMusicTitle("");
      toast("Music added");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add music", true);
    } finally {
      setAddingMusicTrack(false);
    }
  }

  async function handleDeleteMusicTrack(trackId: string) {
    try {
      await apiFetch(`/media/${trackId}`, { method: "DELETE" });
      setMusicTracks((prev) => prev.filter((m) => m.id !== trackId));
      toast("Music removed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove music", true);
    }
  }

  async function handleAddGuest() {
    if (!guestForm.firstName.trim()) {
      toast("First name is required", true);
      return;
    }
    setGuestSubmitting(true);
    try {
      await apiFetch("/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(guestForm),
      });
      setGuestModalOpen(false);
      setGuestForm({ firstName: "", lastName: "", party: "", notes: "" });
      await fetchGuests(guestFilter || undefined);
      toast("Guest added");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add guest", true);
    } finally {
      setGuestSubmitting(false);
    }
  }

  async function handleDeleteGuest(guestId: string) {
    try {
      await apiFetch(`/guests/${guestId}`, { method: "DELETE" });
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
      toast("Guest removed");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete guest", true);
    }
  }

  async function handleFilterGuests(status: string) {
    setGuestFilter(status);
    await fetchGuests(status || undefined);
  }

  async function handleSaveTemplate() {
    const name = templateNameInput.trim();
    if (!name) {
      toast("Enter a snapshot name", true);
      return;
    }
    setSavingTemplate(true);
    try {
      await apiFetch("/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setTemplateNameInput("");
      await fetchTemplates();
      toast("Snapshot saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save template", true);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleApplyTemplate(templateId: string) {
    try {
      await apiFetch(`/templates/${templateId}`, { method: "POST" });
      setPages([]);
      setActivePage(null);
      setBlocks([]);
      await fetchPages();
      await fetchSettings();
      setPreviewKey((k) => k + 1);
      setSection("website");
      toast("Snapshot applied");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to apply template", true);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    try {
      await apiFetch(`/templates/${templateId}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast("Snapshot deleted");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete snapshot", true);
    }
  }

  async function handleSaveEventType() {
    setSavingType(true);
    try {
      await apiFetch("/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventType }),
      });
      toast("Event type saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save event type", true);
    } finally {
      setSavingType(false);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await apiFetch("/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      await fetchSettings();
      setPreviewKey((k) => k + 1);
      toast("Settings saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save settings", true);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleToggleLive() {
    const newVal: 0 | 1 = settingsForm.isLive ? 0 : 1;
    setSettingsForm((f) => ({ ...f, isLive: newVal }));
    try {
      await apiFetch("/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isLive: newVal }),
      });
      toast(newVal ? "Site is now live" : "Site taken offline");
    } catch (err) {
      // Roll back optimistic update on error
      setSettingsForm((f) => ({ ...f, isLive: newVal ? 0 : 1 }));
      toast(err instanceof Error ? err.message : "Failed to update site status", true);
    }
  }

  async function handleCanvaImport(designId: string) {
    setImportingDesignId(designId);
    try {
      const res = await fetch(`/api/sites/${site.id}/canva/import`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ designId }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? "Import failed");
      }
      await fetchPhotos();
      toast("Design imported");
      setCanvaModalOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed", true);
    } finally {
      setImportingDesignId(null);
    }
  }

  function handleExportCsv() {
    const header = "firstName,lastName,party,rsvpStatus,notes";
    const rows = guests.map((g) => {
      const escape = (v: string | null | undefined) => {
        const s = v ?? "";
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      return [
        escape(g.firstName),
        escape(g.lastName),
        escape(g.party),
        escape(g.rsvpStatus),
        escape(g.notes),
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests-${site.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${guests.length} guest${guests.length !== 1 ? "s" : ""}`);
  }

  async function handleImportCsv(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 2) {
      toast("CSV has no data rows", true);
      return;
    }

    // Parse header to find column indices (case-insensitive)
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const col = (name: string) => headers.indexOf(name);
    const firstNameIdx   = col("firstname");
    const lastNameIdx    = col("lastname");
    const partyIdx       = col("party");
    const notesIdx       = col("notes");

    if (firstNameIdx === -1) {
      toast("CSV must have a firstName column", true);
      return;
    }

    const dataRows = lines.slice(1);
    const total = dataRows.length;
    setImportProgress({ done: 0, total });

    let successCount = 0;
    for (let i = 0; i < dataRows.length; i++) {
      // Split respecting quoted fields
      const cells = dataRows[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const firstName = cells[firstNameIdx]?.trim();
      if (!firstName) { setImportProgress({ done: i + 1, total }); continue; }

      const body: Record<string, string> = { firstName };
      if (lastNameIdx !== -1 && cells[lastNameIdx]?.trim()) body.lastName = cells[lastNameIdx].trim();
      if (partyIdx    !== -1 && cells[partyIdx]?.trim())    body.party    = cells[partyIdx].trim();
      if (notesIdx    !== -1 && cells[notesIdx]?.trim())    body.notes    = cells[notesIdx].trim();

      try {
        await apiFetch("/guests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        successCount++;
      } catch {
        // Skip failed rows silently; report at end
      }
      setImportProgress({ done: i + 1, total });
    }

    setImportProgress(null);
    await fetchGuests(guestFilter || undefined);
    toast(`Imported ${successCount} of ${total} guest${total !== 1 ? "s" : ""}`);
  }

  async function handleSaveStyle() {
    try {
      await apiFetch("/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          headingFont: styleHeadingFont,
          bodyFont:    styleBodyFont,
          accentColor: styleAccent,
        }),
      });
      toast("Style saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save style", true);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function extractYoutubeId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] || null;
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    } catch { /* ignore */ }
    return null;
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function rsvpBadgeClass(status: string) {
    if (status === "yes") return "gl-badge gl-badge-yes";
    if (status === "no") return "gl-badge gl-badge-no";
    return "gl-badge gl-badge-pending";
  }

  function rsvpBadgeLabel(status: string) {
    if (status === "yes") return "Attending";
    if (status === "no") return "Declined";
    return "Pending";
  }

  function blockColor(type: string) {
    return BLOCK_TYPES.find((b) => b.type === type)?.color ?? "#9b8e85";
  }

  function blockLabel(type: string) {
    return BLOCK_TYPES.find((b) => b.type === type)?.label ?? type;
  }

  // ── TextStyleRow ─────────────────────────────────────────────────────────────
  function TextStyleRow({ prefix, cfg: c, setF }: {
    prefix: 'heading' | 'body' | 'title';
    cfg: Record<string,unknown>;
    setF: (k: string, v: unknown) => void;
  }) {
    const label = prefix === 'heading' ? 'Heading' : prefix === 'body' ? 'Body' : 'Title';
    const sizes = prefix === 'body'
      ? ['0.8rem','0.875rem','1rem','1.125rem','1.25rem']
      : ['0.875rem','1rem','1.125rem','1.25rem','1.5rem','1.75rem','2rem'];
    const sk = `${prefix}Size`, ak = `${prefix}Align`, bk = `${prefix}Bold`, ik = `${prefix}Italic`, uk = `${prefix}Underline`;
    return (
      <div style={{margin:'2px 0 8px',padding:'6px 8px',background:'#faf9f8',borderRadius:'6px',border:'1px solid #f0ede8'}}>
        <div style={{fontSize:'0.64rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#b0a99f',marginBottom:'5px'}}>{label} Style</div>
        <div style={{display:'flex',gap:'4px',flexWrap:'wrap',alignItems:'center'}}>
          <select className="sf-input" style={{width:'90px',fontSize:'0.73rem',padding:'3px 5px',height:'26px'}}
            value={String(c[sk]??'')} onChange={e=>setF(sk,e.target.value||null)}>
            <option value="">Default</option>
            {sizes.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {(['left','center','right'] as const).map(a=>(
            <button key={a} onClick={()=>setF(ak,c[ak]===a?null:a)}
              style={{padding:'2px 5px',borderRadius:'4px',border:'1.5px solid',height:'26px',minWidth:'28px',
                borderColor:c[ak]===a?'var(--accent)':'#e0dbd4',
                background:c[ak]===a?'var(--accent)':'#fff',
                color:c[ak]===a?'#fff':'#6b5e56',fontSize:'0.72rem',cursor:'pointer'}}>
              {a==='left'?'L':a==='center'?'C':'R'}
            </button>
          ))}
          {([['B',bk],['I',ik],['U',uk]] as [string,string][]).map(([lbl,key])=>(
            <button key={key} onClick={()=>setF(key,!c[key])}
              style={{padding:'2px 7px',borderRadius:'4px',border:'1.5px solid',height:'26px',
                borderColor:c[key]?'var(--accent)':'#e0dbd4',
                background:c[key]?'var(--accent)':'#fff',
                color:c[key]?'#fff':'#6b5e56',
                fontSize:'0.82rem',fontWeight:lbl==='B'?700:400,
                fontStyle:lbl==='I'?'italic':'normal',
                textDecoration:lbl==='U'?'underline':'none',
                cursor:'pointer'}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

      {/* ── WEBSITE EDITOR ──────────────────────────────────── */}
      {section === "website" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Website</span>
            <div className="section-topbar-spacer" />
            <button className="settings-gear-btn" onClick={() => setSettingsOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
              Settings
            </button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost" aria-label="Guest Preview" onClick={() => window.open('/' + site.slug, '_blank')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Preview
            </button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost" onClick={handleUndo} disabled={blockHistory.length === 0} title="Undo" aria-label="Undo" style={{ padding: "6px 10px", gap: "5px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
            </button>
            <button className="btn-ghost" onClick={handleRedo} disabled={blockFuture.length === 0} title="Redo" aria-label="Redo" style={{ padding: "6px 10px", gap: "5px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>
            </button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost" onClick={() => setSection("templates")}>Template</button>
            <div className="section-topbar-divider" />
            <button className="btn-primary-sm" onClick={handleSaveLayout}>Save Layout</button>
            <div className="section-topbar-divider" />
            <button className="btn-publish" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>

          <div className="builder-shell">
            {/* Left panel */}
            <div className="builder-left">
              {/* Page selector */}
              <div className="page-selector-row">
                <button
                  onClick={handleAddPage}
                  title="Add page"
                  aria-label="Add page"
                  style={{ background: "none", border: "1px solid #d4cec8", borderRadius: "4px", cursor: "pointer", color: "#6b7280", fontSize: "0.85rem", padding: "2px 7px", lineHeight: 1.6, flexShrink: 0 }}
                >+</button>
                <button
                  onClick={() => activePage && handleDeletePage(activePage.id)}
                  disabled={!activePage || pages.length <= 1}
                  title="Delete page"
                  aria-label="Delete active page"
                  style={{ background: "none", border: "1px solid #d4cec8", borderRadius: "4px", cursor: (!activePage || pages.length <= 1) ? "default" : "pointer", color: (!activePage || pages.length <= 1) ? "#d4cec8" : "#e57373", fontSize: "0.85rem", padding: "2px 7px", lineHeight: 1.6, flexShrink: 0 }}
                >×</button>
                <div className="page-selector-wrap">
                  <button
                    className={`page-selector-btn${pageDropOpen ? " open" : ""}`}
                    onClick={() => setPageDropOpen((o) => !o)}
                    aria-expanded={pageDropOpen}
                    aria-haspopup="listbox"
                  >
                    <span>
                      {pagesLoading
                        ? "Loading…"
                        : activePage?.label ?? (pages.length === 0 ? "No pages" : "Select page")}
                    </span>
                    <span style={{ color: "#9b8e85", fontSize: "0.7rem" }}>▾</span>
                  </button>
                  {pageDropOpen && pages.length > 0 && (
                    <div className="page-selector-dropdown" role="listbox">
                      {pages.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`page-sel-row${activePage?.id === p.id ? " active" : ""}`}
                          role="option"
                          aria-selected={activePage?.id === p.id}
                        >
                          <span
                            style={{ flex: 1, cursor: "pointer", padding: "2px 0" }}
                            onClick={() => { setActivePage(p); setPageDropOpen(false); setExpandedBlockId(null); }}
                          >
                            {p.label}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReorderPage(p.id, "up"); }}
                            disabled={idx === 0}
                            title="Move up"
                            aria-label={`Move ${p.label} up`}
                            style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#d4cec8" : "#6b7280", fontSize: "0.65rem", padding: "0 2px", lineHeight: 1 }}
                          >▲</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReorderPage(p.id, "down"); }}
                            disabled={idx === pages.length - 1}
                            title="Move down"
                            aria-label={`Move ${p.label} down`}
                            style={{ background: "none", border: "none", cursor: idx === pages.length - 1 ? "default" : "pointer", color: idx === pages.length - 1 ? "#d4cec8" : "#6b7280", fontSize: "0.65rem", padding: "0 2px", lineHeight: 1 }}
                          >▼</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className={`page-act-btn${activePage && activePage.isVisible !== 0 ? " vis-on" : ""}`}
                  title={activePage && activePage.isVisible !== 0 ? "Hide page" : "Show page"}
                  aria-label="Toggle page visibility"
                  onClick={() => activePage && handleTogglePageVisibility(activePage)}
                >
                  {activePage && activePage.isVisible !== 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  )}
                </button>
                <button
                  className={`page-act-btn${activePage && activePage.isLocked !== 0 ? " vis-on" : ""}`}
                  title={activePage && activePage.isLocked !== 0 ? "Unlock page" : "Lock page"}
                  aria-label="Toggle page lock"
                  onClick={() => activePage && handleTogglePageLock(activePage)}
                >
                  {activePage && activePage.isLocked !== 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Tab strip */}
              <div className="left-tab-strip">
                {(["tiles", "content"] as const).map((t) => (
                  <button
                    key={t}
                    className={`left-tab${activeTab === t ? " active" : ""}`}
                    onClick={() => setActiveTab(t)}
                    aria-selected={activeTab === t}
                  >
                    {t === "tiles" ? "Tiles" : "Content"}
                  </button>
                ))}
              </div>

              {/* Tiles tab */}
              {activeTab === "tiles" && (
                <div className="left-tab-panel" style={{ padding: "0.75rem 1rem" }}>
                  {blocksLoading ? (
                    <p style={{ fontSize: "0.75rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0.5rem" }}>
                      Loading tiles…
                    </p>
                  ) : (
                    <>
                      {blocks.length === 0 && (
                        <p style={{ fontSize: "0.7rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0.5rem", lineHeight: 1.6 }}>
                          No tiles yet.<br />Add your first tile to start building.
                        </p>
                      )}
                      <div ref={blockListRef} style={{ marginBottom: "0.5rem" }}>
                        {blocks.map((block) => {
                          const isExpanded = expandedBlockId === block.id;
                          const cfg = isExpanded ? blockConfigFields : (() => { try { return JSON.parse(block.config || "{}") as Record<string,unknown>; } catch { return {} as Record<string,unknown>; } })();

                          const bgMode     = cfg.background ? 'color' : 'none';
                          const bgColor    = ((cfg.background as Record<string,unknown>)?.value as string | undefined) ?? '#ffffff';
                          const tcMode     = cfg.textColor ? 'custom' : 'default';
                          const tcVal      = (cfg.textColor as string | undefined) ?? '#1c1917';
                          const fontVal    = (cfg.fontFamily as string | undefined) ?? '';
                          const borderMode = cfg.hideBorder ? 'none' : 'show';
                          const animVal    = (cfg.animation as string | undefined) ?? '';

                          return (
                            <div key={block.id} className="bl-card-wrap">
                              {/* Tile header */}
                              <div
                                className={`bl-card${isExpanded ? ' bl-card-open' : ''}`}
                                onClick={() => toggleBlockExpand(block)}
                                style={{ cursor: 'pointer', borderRadius: isExpanded ? '8px 8px 0 0' : undefined, borderBottom: isExpanded ? 'none' : undefined }}
                              >
                                <div className="bl-stripe" style={{ background: blockColor(block.type) }} />
                                <div className="drag-handle" aria-hidden="true" onClick={e => e.stopPropagation()}>⠿</div>
                                <div className="bl-body">
                                  <div className={`bl-name${block.isVisible === 0 ? ' off' : ''}`}>{blockLabel(block.type)}</div>
                                  <div className="bl-sub">{block.isVisible === 0 ? 'hidden' : 'default'}</div>
                                </div>
                                <div className="bl-acts" onClick={e => e.stopPropagation()}>
                                  <button className={`bact${block.isVisible !== 0 ? ' vis-on' : ''}`}
                                    title={block.isVisible !== 0 ? 'Hide' : 'Show'}
                                    aria-label={block.isVisible !== 0 ? 'Hide tile' : 'Show tile'}
                                    onClick={() => handleToggleBlockVisibility(block)}>
                                    {block.isVisible !== 0 ? '●' : '○'}
                                  </button>
                                  <button className="bact" title="Delete tile" aria-label="Delete tile"
                                    onClick={() => handleDeleteBlock(block.id)}>✕</button>
                                </div>
                              </div>

                              {/* Inline config panel */}
                              {isExpanded && (
                                <div className="bl-inline-config" onClick={e => e.stopPropagation()}>
                                  <p className="bl-config-title">{blockLabel(block.type)}</p>

                                  {/* Block-type specific fields */}
                                  {block.type === 'home-hero' && (
                                    <p style={{ fontSize: "0.72rem", color: "#9b8e85", margin: "0.25rem 0 0.5rem", lineHeight: 1.5 }}>Couple names, date &amp; location come from Site Settings.</p>
                                  )}

                                  {block.type === 'header' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Page Title</label><input className="sf-input" value={String(cfg.title??'')} onChange={e=>setField('title',e.target.value)} placeholder="Our Story"/></div>
                                    <TextStyleRow prefix="title" cfg={cfg} setF={setField} />
                                  </>)}

                                  {block.type === 'text' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Heading</label><input className="sf-input" value={String(cfg.heading??'')} onChange={e=>setField('heading',e.target.value)} placeholder="Section heading…"/></div>
                                    <TextStyleRow prefix="heading" cfg={cfg} setF={setField} />
                                    <div className="sf-group"><label className="sf-lbl">Body</label><textarea className="sf-input" rows={4} value={String(cfg.body??'')} onChange={e=>setField('body',e.target.value)} style={{resize:'vertical'}}/></div>
                                    <TextStyleRow prefix="body" cfg={cfg} setF={setField} />
                                    <div className="sf-group"><label className="sf-lbl">Content Key <span style={{fontWeight:400,color:'#b0a99f'}}>(advanced)</span></label><input className="sf-input" value={String(cfg.contentKey??'')} onChange={e=>setField('contentKey',e.target.value)} placeholder="story / home-welcome / registry…"/></div>
                                  </>)}

                                  {block.type === 'video' && (<>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Video</label>
                                      {videos.length === 0 ? (
                                        <p style={{fontSize:'0.75rem',color:'#9b8e85',margin:0}}>No videos in Media yet. <button type="button" style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'inherit',padding:0,textDecoration:'underline'}} onClick={()=>setSection("media")}>Go to Media</button></p>
                                      ) : (
                                        <select className="sf-input" value={String(cfg.url??'')} onChange={e=>setField('url',e.target.value)}>
                                          <option value="">— Select a video —</option>
                                          {videos.map(v=><option key={v.id} value={v.url}>{v.title??v.url}</option>)}
                                        </select>
                                      )}
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Block Height</label>
                                      <div className="bsel-row" style={{marginTop:'4px'}}>
                                        {(['40vh','60vh','80vh','100dvh'] as const).map((h,i)=>(
                                          <button key={h} className={`bsel-btn${((cfg.height??'100dvh')===h)?' active':''}`} onClick={()=>setField('height',h)}>{['40vh','60vh','80vh','Full'][i]}</button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="style-toggle">
                                        <input type="checkbox" checked={!!cfg.showCountdown} onChange={e=>setField('showCountdown',e.target.checked)} />
                                        Show countdown clock
                                      </label>
                                    </div>
                                    {!!cfg.showCountdown && (
                                      <div className="sf-group">
                                        <label className="sf-lbl">Countdown Position</label>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '4px' }}>
                                          <div style={{ flex: 1 }}>
                                            <label className="sf-lbl" style={{ fontSize: '0.68rem', color: '#9b8e85' }}>X Offset (px from center)</label>
                                            <input
                                              className="sf-input"
                                              type="number"
                                              value={Number(cfg.countdownX ?? 0)}
                                              onChange={e => setField('countdownX', Number(e.target.value))}
                                              style={{ marginTop: '2px' }}
                                            />
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <label className="sf-lbl" style={{ fontSize: '0.68rem', color: '#9b8e85' }}>Y Offset (px from bottom)</label>
                                            <input
                                              className="sf-input"
                                              type="number"
                                              value={Number(cfg.countdownY ?? 120)}
                                              onChange={e => setField('countdownY', Number(e.target.value))}
                                              style={{ marginTop: '2px' }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>)}

                                  {block.type === 'countdown' && (<>
                                    <p style={{ fontSize: '0.72rem', color: '#9b8e85', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                                      Countdown always uses the event date from Site Settings.
                                    </p>
                                    <div className="sf-group">
                                      <label className="style-toggle">
                                        <input type="checkbox" checked={!!cfg.showRsvpButton} onChange={e => setField('showRsvpButton', e.target.checked)} />
                                        Show RSVP button below countdown
                                      </label>
                                    </div>
                                    {!!cfg.showRsvpButton && (<>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Button Text</label>
                                        <input className="sf-input" value={cfg.rsvpButtonText ?? 'RSVP Now'} onChange={e => setField('rsvpButtonText', e.target.value)} />
                                      </div>
                                      <div className="sf-group">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <label className="sf-lbl" style={{ margin: 0 }}>Button Background <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
                                          {!!cfg.rsvpButtonColor && (
                                            <button type="button" onClick={() => setField('rsvpButtonColor', null)} style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                              Reset to global
                                            </button>
                                          )}
                                        </div>
                                        <ColorSwatch value={String(cfg.rsvpButtonColor ?? styleAccent)} onChange={v => setField('rsvpButtonColor', v)} />
                                      </div>
                                      <div className="sf-group">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <label className="sf-lbl" style={{ margin: 0 }}>Button Text <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
                                          {!!cfg.rsvpButtonTextColor && (
                                            <button type="button" onClick={() => setField('rsvpButtonTextColor', null)} style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                              Reset to global
                                            </button>
                                          )}
                                        </div>
                                        <ColorSwatch value={String(cfg.rsvpButtonTextColor ?? '#ffffff')} onChange={v => setField('rsvpButtonTextColor', v)} />
                                      </div>
                                      <div className="sf-group">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <label className="sf-lbl" style={{ margin: 0 }}>Button Border <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
                                          {!!cfg.rsvpButtonBorderColor && (
                                            <button type="button" onClick={() => setField('rsvpButtonBorderColor', null)} style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                              Reset to global
                                            </button>
                                          )}
                                        </div>
                                        <ColorSwatch value={String(cfg.rsvpButtonBorderColor ?? '#e0dbd4')} onChange={v => setField('rsvpButtonBorderColor', v)} />
                                      </div>
                                    </>)}
                                  </>)}

                                  {block.type === 'images' && (<>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Photos</label>
                                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(56px,1fr))',gap:'4px',marginBottom:'4px'}}>
                                        {(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]).map((u,i)=>(
                                          <div key={i} style={{position:'relative',aspectRatio:'1'}}>
                                            <img src={u} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'4px',display:'block'}}/>
                                            <button onClick={()=>setField('urls',(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]).filter((_,j)=>j!==i))} style={{position:'absolute',top:'2px',right:'2px',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',borderRadius:'3px',width:'16px',height:'16px',cursor:'pointer',fontSize:'0.6rem',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
                                          </div>
                                        ))}
                                      </div>
                                      <button className="btn-ghost" style={{width:'100%',fontSize:'0.74rem'}}
                                        onClick={()=>{
                                          if(photos.length===0) fetchPhotos();
                                          setPhotoPickerTarget(()=>(url:string)=>setField('urls',[...(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]),url]));
                                          setPhotoPickerOpen(true);
                                        }}>+ Add Photo from Media</button>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Layout</label>
                                      <div className="layout-tiles">
                                        {([
                                          {id:'masonry',name:'Masonry',desc:'Pinterest style'},
                                          {id:'featured-grid',name:'Featured',desc:'1 large + grid'},
                                          {id:'filmstrip',name:'Film Strip',desc:'Horizontal scroll'},
                                          {id:'full-bleed',name:'Full Bleed',desc:'Edge to edge'},
                                          {id:'grid-2',name:'2-Col Grid',desc:'Even 2 columns'},
                                          {id:'grid-3',name:'3-Col Grid',desc:'Even 3 columns'},
                                          {id:'text-beside',name:'Text+Photo',desc:'Side by side'},
                                        ]).map(l=>(
                                          <div key={l.id} className={`layout-tile${(cfg.layout??'grid-3')===l.id?' active':''}`} onClick={()=>setField('layout',l.id)}>
                                            <div className="layout-tile-name">{l.name}</div>
                                            <div className="layout-tile-desc">{l.desc}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Photo Appearance</label>
                                      <div className="appear-grid">
                                        <div className="appear-field">
                                          <div className="appear-fld-lbl">Border Radius</div>
                                          <div className="appear-ctrl">
                                            <div className="bsel-row">
                                              {(['0px','4px','8px','12px','50%'] as const).map(r=>(
                                                <button key={r} className={`bsel-btn${(cfg.photoRadius??'8px')===r?' active':''}`} onClick={()=>setField('photoRadius',r)}>{r==='50%'?'●':r}</button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="appear-field">
                                          <div className="appear-fld-lbl">Border Width</div>
                                          <div className="appear-ctrl">
                                            <div className="bsel-row">
                                              {(['0','1px','2px','3px'] as const).map(w=>(
                                                <button key={w} className={`bsel-btn${(cfg.photoBorder??'0')===w?' active':''}`} onClick={()=>setField('photoBorder',w)}>{w==='0'?'None':w}</button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="appear-field full-w">
                                          <div className="appear-fld-lbl">Border Color</div>
                                          <div className="appear-ctrl">
                                            <ColorSwatch value={String(cfg.photoBorderColor??'#e0dbd4')} onChange={v=>setField('photoBorderColor',v)} />
                                            <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>{String(cfg.photoBorderColor??'#e0dbd4')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Image Focus <span style={{fontWeight:400,color:'#b0a99f',fontSize:'0.68rem'}}>drag to set crop center</span></label>
                                      <div
                                        style={{position:'relative',width:'100%',paddingTop:'55%',background:'#f0ede8',borderRadius:'6px',overflow:'hidden',cursor:'crosshair',border:'1px solid #e0dbd4',userSelect:'none',touchAction:'none'}}
                                        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const rect=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-rect.left)/rect.width*100);const y=Math.round((e.clientY-rect.top)/rect.height*100);setField('imageCrop',`${x}% ${y}%`);}}
                                        onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const rect=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-rect.left)/rect.width*100);const y=Math.round((e.clientY-rect.top)/rect.height*100);setField('imageCrop',`${x}% ${y}%`);}}
                                      >
                                        {(Array.isArray(cfg.urls) && (cfg.urls as string[]).length > 0)
                                          ? <img src={String((cfg.urls as string[])[0])} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} alt="" />
                                          : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#b0a99f',fontSize:'0.78rem'}}>Add photos to preview</div>}
                                        {(()=>{
                                          const raw = String(cfg.imageCrop ?? '50% 50%');
                                          const pts = raw.replace(/%/g,'').trim().split(/\s+/);
                                          const fx = parseFloat(pts[0])||50;
                                          const fy = parseFloat(pts[1]??pts[0])||50;
                                          return (Array.isArray(cfg.urls) && (cfg.urls as string[]).length > 0)
                                            ? <div style={{position:'absolute',width:'16px',height:'16px',borderRadius:'50%',background:'white',border:'2.5px solid #E75850',boxShadow:'0 1px 5px rgba(0,0,0,0.35)',transform:'translate(-50%,-50%)',pointerEvents:'none',left:`${fx}%`,top:`${fy}%`}} />
                                            : null;
                                        })()}
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Photo Size (px)</label>
                                      <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                                        <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>W</span>
                                        <input type="number" className="sf-input" style={{width:'72px',textAlign:'center'}} value={String(cfg.photoWidth??'')} onChange={e=>setField('photoWidth',e.target.value?Number(e.target.value):null)} placeholder="Auto" />
                                        <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>H</span>
                                        <input type="number" className="sf-input" style={{width:'72px',textAlign:'center'}} value={String(cfg.photoHeight??'')} onChange={e=>setField('photoHeight',e.target.value?Number(e.target.value):null)} placeholder="Auto" />
                                        <span style={{fontSize:'0.65rem',color:'#b0a99f'}}>Leave blank for auto</span>
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Position on Page</label>
                                      <div style={{display:'flex',gap:'6px',marginTop:'4px',marginBottom:'6px'}}>
                                        {([{label:'Left',val:-120},{label:'Center',val:0},{label:'Right',val:120}]).map(p=>(
                                          <button key={p.label} className={`bsel-btn${(cfg.galleryOffsetX??0)===p.val?' active':''}`}
                                            onClick={()=>setField('galleryOffsetX',p.val)}>{p.label}</button>
                                        ))}
                                      </div>
                                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>Fine-tune (px)</span>
                                        <input type="number" className="sf-input" style={{width:'80px'}} value={String(cfg.galleryOffsetX??0)} onChange={e=>setField('galleryOffsetX',Number(e.target.value))} />
                                      </div>
                                    </div>
                                  </>)}

                                  {block.type === 'youtube' && (<>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Video</label>
                                      {videos.length === 0 ? (
                                        <p style={{fontSize:'0.75rem',color:'#9b8e85',margin:0}}>No videos in Media yet. <button type="button" style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'inherit',padding:0,textDecoration:'underline'}} onClick={()=>setSection("media")}>Go to Media</button></p>
                                      ) : (
                                        <select className="sf-input" value={String(cfg.url??'')}
                                          onChange={e=>{const url=e.target.value;const vid=extractYoutubeId(url);setField('url',url);if(vid)setField('videoId',vid);}}>
                                          <option value="">— Select a video —</option>
                                          {videos.map(v=><option key={v.id} value={v.url}>{v.title??v.url}</option>)}
                                        </select>
                                      )}
                                    </div>
                                    <div className="sf-group"><label className="sf-lbl">Title</label><input className="sf-input" value={String(cfg.title??'')} onChange={e=>setField('title',e.target.value)}/></div>
                                  </>)}

                                  {block.type === 'spacer' && (
                                    <div className="sf-group"><label className="sf-lbl">Height (CSS value)</label><input className="sf-input" value={String(cfg.height??'4rem')} onChange={e=>setField('height',e.target.value)} placeholder="4rem"/></div>
                                  )}

                                  {block.type === 'registry-card' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Registry Name</label><input className="sf-input" value={String(cfg.item_name??'')} onChange={e=>setField('item_name',e.target.value)} placeholder="Honeymoon Fund"/></div>
                                    <div className="sf-group"><label className="sf-lbl">Description</label><textarea className="sf-input" rows={3} value={String(cfg.item_description??'')} onChange={e=>setField('item_description',e.target.value)} style={{resize:'vertical'}}/></div>
                                    <div className="sf-group"><label className="sf-lbl">Link URL</label><input className="sf-input" type="url" value={String(cfg.link_url??'')} onChange={e=>setField('link_url',e.target.value)} placeholder="https://paypal.me/…"/></div>
                                    <div className="sf-group"><label className="sf-lbl">Button Text</label><input className="sf-input" value={String(cfg.cta??'')} onChange={e=>setField('cta',e.target.value)} placeholder="Contribute"/></div>
                                  </>)}

                                  {block.type === 'hotel-card' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Hotel / Venue Name</label><input className="sf-input" value={String(cfg.name??'')} onChange={e=>setField('name',e.target.value)}/></div>
                                    <div className="sf-group"><label className="sf-lbl">Description</label><textarea className="sf-input" rows={3} value={String(cfg.description??'')} onChange={e=>setField('description',e.target.value)} style={{resize:'vertical'}}/></div>
                                    <div className="sf-group"><label className="sf-lbl">Room Block Note</label><input className="sf-input" value={String(cfg.room_note??'')} onChange={e=>setField('room_note',e.target.value)}/></div>
                                    <div className="sf-group"><label className="sf-lbl">Google Maps URL</label><input className="sf-input" type="url" value={String(cfg.map_url??'')} onChange={e=>setField('map_url',e.target.value)}/></div>
                                  </>)}

                                  {block.type === 'venue-map' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Search Query</label><input className="sf-input" value={String(cfg.query??'')} onChange={e=>setField('query',e.target.value)} placeholder="Grand Ballroom New York"/></div>
                                    <div className="sf-group"><label className="sf-lbl">Map Height (px)</label><input className="sf-input" type="number" value={String(cfg.height??'360')} onChange={e=>setField('height',Number(e.target.value))}/></div>
                                  </>)}

                                  {block.type === 'schedule' && (
                                    <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                                      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
                                        Schedule events are edited in the <strong>Content</strong> tab above.
                                      </p>
                                    </div>
                                  )}

                                  {block.type === 'photo-split' && (() => {
                                    const photo = (cfg.photo as Record<string,unknown>|undefined) ?? {};
                                    const comps = Array.isArray(cfg.components) ? (cfg.components as Record<string,unknown>[]) : [];
                                    const photoSide = String(cfg.photoSide ?? 'left');
                                    const wPx = String(photo.widthPx ?? '');
                                    const hPx = String(photo.heightPx ?? '');
                                    const arFree = !wPx && !hPx;
                                    const setPhoto = (k: string, v: unknown) => setField('photo', {...photo, [k]: v});
                                    const [focalX, focalY] = (() => {
                                      const raw = String(photo.crop ?? 'center');
                                      if (raw === 'top') return [50, 0];
                                      if (raw === 'bottom') return [50, 100];
                                      const pts = raw.replace(/%/g,'').trim().split(/\s+/);
                                      return [parseFloat(pts[0])||50, parseFloat(pts[1]??pts[0])||50];
                                    })();
                                    return (<>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Photo</label>
                                        {photo.url && <img src={String(photo.url)} alt="" style={{width:'100%',height:'60px',objectFit:'cover',borderRadius:'5px',border:'1px solid #e0dbd4',display:'block',marginBottom:'4px'}}/>}
                                        <button className="btn-ghost" style={{width:'100%',fontSize:'0.74rem'}}
                                          onClick={()=>{
                                            if(photos.length===0) fetchPhotos();
                                            setPhotoPickerTarget(()=>(url:string)=>setPhoto('url',url));
                                            setPhotoPickerOpen(true);
                                          }}>{photo.url ? 'Change Photo (Media Library)' : 'Pick from Media Library'}</button>
                                      </div>
                                      <div className="sf-group">
                                        <label className="sf-lbl" style={{marginBottom:'4px'}}>Photo Position <span style={{fontWeight:400,color:'#b0a99f',fontSize:'0.68rem'}}>drag to reposition</span></label>
                                        <div
                                          style={{position:'relative',width:'100%',paddingTop:'60%',background:'#f0ede8',borderRadius:'6px',overflow:'hidden',cursor:'crosshair',border:'1px solid #e0dbd4',userSelect:'none',touchAction:'none'}}
                                          onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-r.left)/r.width*100);const y=Math.round((e.clientY-r.top)/r.height*100);setPhoto('crop',`${x}% ${y}%`);}}
                                          onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-r.left)/r.width*100);const y=Math.round((e.clientY-r.top)/r.height*100);setPhoto('crop',`${x}% ${y}%`);}}
                                        >
                                          {photo.url
                                            ? <img src={String(photo.url)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} alt="" />
                                            : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#b0a99f',fontSize:'0.78rem'}}>Pick a photo first</div>}
                                          <div style={{position:'absolute',width:'16px',height:'16px',borderRadius:'50%',background:'white',border:'2.5px solid #E75850',boxShadow:'0 1px 5px rgba(0,0,0,0.35)',transform:'translate(-50%,-50%)',pointerEvents:'none',left:`${focalX}%`,top:`${focalY}%`,display:photo.url?'block':'none'}} />
                                        </div>
                                      </div>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Photo Size (px)</label>
                                        <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                                          <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>W</span>
                                          <input type="number" className="sf-input" style={{width:'56px',textAlign:'center'}} value={wPx} onChange={e=>setPhoto('widthPx',e.target.value||'')} placeholder="Auto" />
                                          <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>H</span>
                                          <input type="number" className="sf-input" style={{width:'56px',textAlign:'center'}} value={hPx} onChange={e=>setPhoto('heightPx',e.target.value||'')} placeholder="Auto" />
                                          <span style={{fontSize:'0.68rem',color:'#b0a99f'}}>px</span>
                                          <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'0.75rem',color:'#6b5e56',cursor:'pointer'}}>
                                            <input type="checkbox" checked={arFree} onChange={e=>{setField('photo',{...photo,widthPx:e.target.checked?'':'250',heightPx:e.target.checked?'':'400'});}} />
                                            Auto
                                          </label>
                                        </div>
                                      </div>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Photo Position on Page</label>
                                        <div style={{display:'flex',gap:'6px',marginTop:'4px',marginBottom:'6px'}}>
                                          {([{label:'Left',val:-80},{label:'Center',val:0},{label:'Right',val:80}]).map(p=>(
                                            <button key={p.label} className={`bsel-btn${(photo.offsetX??0)===p.val?' active':''}`}
                                              onClick={()=>setPhoto('offsetX',p.val)}>{p.label}</button>
                                          ))}
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                          <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>Fine-tune (px)</span>
                                          <input type="number" className="sf-input" style={{width:'80px'}} value={String(photo.offsetX??0)} onChange={e=>setPhoto('offsetX',Number(e.target.value))} />
                                        </div>
                                      </div>
                                      <div className="sf-group">
                                        <span className="sf-lbl">Photo Side</span>
                                        <div style={{display:'flex',gap:'4px'}}>
                                          {(['left','right'] as const).map(s=>(
                                            <button key={s} onClick={()=>setField('photoSide',s)} style={{padding:'4px 14px',borderRadius:'20px',border:'1.5px solid',borderColor:photoSide===s?'var(--accent)':'#e0dbd4',background:photoSide===s?'var(--accent)':'#fff',color:photoSide===s?'#fff':'#6b5e56',fontSize:'0.75rem',cursor:'pointer',textTransform:'capitalize'}}>{s}</button>
                                          ))}
                                        </div>
                                      </div>
                                      <div style={{margin:'8px 0 6px',fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'#9b8e85'}}>Other Side</div>
                                      {comps.map((c,ci)=>(
                                        <div key={ci} style={{border:'1px solid #e0dbd4',borderRadius:'8px',padding:'0.65rem',marginBottom:'0.5rem'}}>
                                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                                            <span style={{fontSize:'0.7rem',fontWeight:600,color:'#9b8e85',textTransform:'capitalize'}}>{String(c.type??'Component')}</span>
                                            <button onClick={()=>setField('components',comps.filter((_,j)=>j!==ci))} style={{background:'none',border:'none',cursor:'pointer',color:'#ccc',fontSize:'0.8rem'}}>×</button>
                                          </div>
                                          {c.type==='text'&&(()=>{const setC=(k:string,v:unknown)=>{const n=[...comps];n[ci]={...n[ci],[k]:v};setField('components',n);};return(<>
                                            <div className="sf-group" style={{marginBottom:'0.35rem'}}><label className="sf-lbl" style={{fontSize:'0.68rem'}}>Heading (optional)</label><input className="sf-input" style={{padding:'5px 8px',fontSize:'0.78rem'}} value={String(c.heading??'')} onChange={e=>setC('heading',e.target.value)}/></div>
                                            <TextStyleRow prefix="heading" cfg={c} setF={setC} />
                                            <div className="sf-group"><label className="sf-lbl" style={{fontSize:'0.68rem'}}>Body</label><textarea className="sf-input" rows={3} style={{padding:'5px 8px',fontSize:'0.78rem',resize:'vertical'}} value={String(c.body??'')} onChange={e=>setC('body',e.target.value)}/></div>
                                            <TextStyleRow prefix="body" cfg={c} setF={setC} />
                                          </>);})()}
                                        </div>
                                      ))}
                                      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                                        <select className="sf-input" id="ps-add-type-inline" style={{flex:1,fontSize:'0.78rem'}}>
                                          <option value="text">Text</option>
                                        </select>
                                        <button className="btn-ghost" style={{whiteSpace:'nowrap',fontSize:'0.78rem'}} onClick={()=>{const sel=document.getElementById('ps-add-type-inline') as unknown as HTMLSelectElement|null;const type=sel?.value||'text';setField('components',[...comps,{type,heading:'',body:''}]);}}>+ Add</button>
                                      </div>
                                    </>);
                                  })()}

                                  {block.type === 'faq' && (
                                    <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                                      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
                                        Q&amp;A items are edited in the <strong>Content</strong> tab above.
                                      </p>
                                    </div>
                                  )}

                                  {block.type === 'tidbits' && (<>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Grid Columns</label>
                                      <div className="bsel-row" style={{marginTop:'4px'}}>
                                        {(['auto','2','3'] as const).map(c=>(
                                          <button key={c} className={`bsel-btn${(cfg.columns??'auto')===c?' active':''}`} onClick={()=>setField('columns',c)}>{c==='auto'?'Auto':c+' Col'}</button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Card Style</label>
                                      <div className="bsel-row" style={{marginTop:'4px'}}>
                                        {(['card','flat','bordered'] as const).map(s=>(
                                          <button key={s} className={`bsel-btn${(cfg.cardStyle??'card')===s?' active':''}`} onClick={()=>setField('cardStyle',s)}>{s[0].toUpperCase()+s.slice(1)}</button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="sf-group">
                                      <label className="style-toggle">
                                        <input type="checkbox" checked={cfg.showTitle !== false} onChange={e=>setField('showTitle',e.target.checked)} />
                                        Show section title
                                      </label>
                                    </div>
                                    <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                                      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
                                        Fun facts are edited in the <strong>Content</strong> tab above.
                                      </p>
                                    </div>
                                  </>)}

                                  {block.type === 'travel-section' && (<>
                                    <div className="sf-group"><label className="sf-lbl">Section Title</label><input className="sf-input" value={String(cfg.title??'')} onChange={e=>setField('title',e.target.value)} placeholder="Getting There"/></div>
                                    <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                                      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
                                        Travel items are edited in the <strong>Content</strong> tab above.
                                      </p>
                                    </div>
                                  </>)}

                                  {block.type === 'multi-text' && (<>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Section Title</label>
                                      <input className="sf-input" value={String(cfg.title??'')} onChange={e=>setField('title',e.target.value)} placeholder="Section heading"/>
                                    </div>
                                    <div className="sf-group">
                                      <label className="sf-lbl">Display Mode</label>
                                      <div className="bsel-row" style={{marginTop:'4px',flexWrap:'wrap'}}>
                                        {([
                                          {id:'text', label:'Text'},
                                          {id:'schedule', label:'Schedule'},
                                          {id:'faq', label:'Q & A'},
                                          {id:'tidbits', label:'Fun Facts'},
                                          {id:'travel', label:'Travel'},
                                        ]).map(m=>(
                                          <button key={m.id} className={`bsel-btn${(cfg.mode??'text')===m.id?' active':''}`}
                                            onClick={()=>setField('mode',m.id)}>{m.label}</button>
                                        ))}
                                      </div>
                                    </div>
                                    {(cfg.mode==='text' || !cfg.mode) && (<>
                                      <div className="sf-group"><label className="sf-lbl">Heading</label><input className="sf-input" value={String(cfg.heading??'')} onChange={e=>setField('heading',e.target.value)} placeholder="Section heading…"/></div>
                                      <TextStyleRow prefix="heading" cfg={cfg} setF={setField} />
                                      <div className="sf-group"><label className="sf-lbl">Body</label><textarea className="sf-input" rows={4} value={String(cfg.body??'')} onChange={e=>setField('body',e.target.value)} style={{resize:'vertical'}}/></div>
                                      <TextStyleRow prefix="body" cfg={cfg} setF={setField} />
                                      <div className="sf-group"><label className="sf-lbl">Content Key <span style={{fontWeight:400,color:'#b0a99f'}}>(advanced)</span></label><input className="sf-input" value={String(cfg.contentKey??'')} onChange={e=>setField('contentKey',e.target.value)} placeholder="story / welcome / registry…"/></div>
                                    </>)}
                                    {cfg.mode==='tidbits' && (<>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Grid Columns</label>
                                        <div className="bsel-row" style={{marginTop:'4px'}}>
                                          {(['auto','2','3'] as const).map(c=>(
                                            <button key={c} className={`bsel-btn${(cfg.columns??'auto')===c?' active':''}`} onClick={()=>setField('columns',c)}>{c==='auto'?'Auto':c+' Col'}</button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="sf-group">
                                        <label className="sf-lbl">Card Style</label>
                                        <div className="bsel-row" style={{marginTop:'4px'}}>
                                          {(['card','flat','bordered'] as const).map(s=>(
                                            <button key={s} className={`bsel-btn${(cfg.cardStyle??'card')===s?' active':''}`} onClick={()=>setField('cardStyle',s)}>{s[0].toUpperCase()+s.slice(1)}</button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="sf-group">
                                        <label className="style-toggle">
                                          <input type="checkbox" checked={cfg.showTitle !== false} onChange={e=>setField('showTitle',e.target.checked)} />
                                          Show section title
                                        </label>
                                      </div>
                                    </>)}
                                    <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                                      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
                                        Content (items, questions, events, etc.) is edited in the <strong>Content</strong> tab above.
                                      </p>
                                    </div>
                                  </>)}

                                  {/* APPEARANCE section */}
                                  <div className="bl-section-label">APPEARANCE</div>

                                  <div className="sf-group">
                                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                                      <label className="sf-lbl" style={{margin:0,flexShrink:0}}>BACKGROUND</label>
                                      <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                                        {(['none','color'] as const).map(opt=>(
                                          <button key={opt} onClick={()=>setField('background', opt==='none' ? null : {type:'color',value:bgColor})}
                                            style={{padding:'3px 10px',borderRadius:'20px',border:'1.5px solid',borderColor:bgMode===opt?'var(--accent)':'#e0dbd4',background:bgMode===opt?'var(--accent)':'#fff',color:bgMode===opt?'#fff':'#6b5e56',fontSize:'0.73rem',cursor:'pointer'}}>
                                            {opt==='none'?'None':'Color'}
                                          </button>
                                        ))}
                                        {bgMode==='color' && <ColorSwatch value={bgColor} onChange={v=>setField('background',{type:'color',value:v})} />}
                                      </div>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                      <label className="sf-lbl" style={{margin:0,flexShrink:0}}>TEXT COLOR</label>
                                      <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                                        {(['default','custom'] as const).map(opt=>(
                                          <button key={opt} onClick={()=>setField('textColor', opt==='default' ? null : tcVal)}
                                            style={{padding:'3px 10px',borderRadius:'20px',border:'1.5px solid',borderColor:tcMode===opt?'var(--accent)':'#e0dbd4',background:tcMode===opt?'var(--accent)':'#fff',color:tcMode===opt?'#fff':'#6b5e56',fontSize:'0.73rem',cursor:'pointer'}}>
                                            {opt==='default'?'Default':'Custom'}
                                          </button>
                                        ))}
                                        {tcMode==='custom' && <ColorSwatch value={tcVal} onChange={v=>setField('textColor',v)} />}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="sf-group">
                                    <label className="sf-lbl">BORDERS</label>
                                    <div style={{display:'flex',gap:'4px',alignItems:'center',flexWrap:'wrap'}}>
                                      {(['show','none'] as const).map(opt=>(
                                        <button key={opt} onClick={()=>setField('hideBorder', opt==='none')}
                                          style={{padding:'3px 10px',borderRadius:'20px',border:'1.5px solid',borderColor:borderMode===opt?'var(--accent)':'#e0dbd4',background:borderMode===opt?'var(--accent)':'#fff',color:borderMode===opt?'#fff':'#6b5e56',fontSize:'0.73rem',cursor:'pointer'}}>
                                          {opt==='show'?'Show':'None'}
                                        </button>
                                      ))}
                                      {borderMode === 'show' && (<>
                                        <ColorSwatch value={String(cfg.borderColor??'#e0dbd4')} onChange={v=>setField('borderColor',v)} />
                                        {cfg.borderColor && <button type="button" onClick={()=>setField('borderColor',null)} style={{fontSize:'0.68rem',color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:0}}>Reset</button>}
                                      </>)}
                                    </div>
                                  </div>

                                  <div className="sf-group">
                                    <label className="sf-lbl">FONT</label>
                                    <select className="sf-input" value={fontVal} onChange={e=>setField('fontFamily', e.target.value||null)}>
                                      <option value="">Site default</option>
                                      <option value="Georgia, serif">Georgia</option>
                                      <option value="'Playfair Display', Georgia, serif">Playfair Display</option>
                                      <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond</option>
                                      <option value="'EB Garamond', Georgia, serif">EB Garamond</option>
                                      <option value="Inter, sans-serif">Inter</option>
                                      <option value="'DM Sans', sans-serif">DM Sans</option>
                                    </select>
                                  </div>

                                  <div className="sf-group">
                                    <label className="sf-lbl">ENTRANCE ANIMATION</label>
                                    <select className="sf-input" value={animVal} onChange={e=>setField('animation', e.target.value||null)}>
                                      <option value="">None</option>
                                      <option value="fade-up">Fade Up</option>
                                      <option value="fade-down">Fade Down</option>
                                      <option value="fade-left">Fade Left</option>
                                      <option value="fade-right">Fade Right</option>
                                      <option value="zoom-in">Zoom In</option>
                                      <option value="slide-up">Slide Up</option>
                                    </select>
                                  </div>

                                  <div style={{display:'flex',gap:'8px',marginTop:'1rem',paddingTop:'0.75rem',borderTop:'1px solid #f0ede8'}}>
                                    <button className="btn-ghost" style={{flex:1}} onClick={()=>setExpandedBlockId(null)}>Cancel</button>
                                    <button className="btn-primary-sm" style={{flex:1}} onClick={()=>{handleSaveBlockConfig();setExpandedBlockId(null);}}>Save</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  <button
                    className="add-block-btn"
                    onClick={() => setAddBlockOpen(true)}
                    disabled={!activePage}
                    aria-label="Add a new tile"
                  >
                    + Add Tile
                  </button>
                </div>
              )}

              {/* Content tab — i18n editor */}
              {activeTab === "content" && (() => {
                if (!activePage) return (
                  <div className="left-tab-panel" style={{ padding: "0.75rem" }}>
                    <p style={{ fontSize: "0.78rem", color: "#9b8e85" }}>Select a page to edit content.</p>
                  </div>
                );
                const mainLang = settingsForm.mainLanguage || "en";
                const secondLang = settingsForm.secondLanguage;
                const curLangCode = contentLang === "main" ? mainLang : (secondLang || mainLang);
                const pageContent = contentByPage[activePage.slug]?.[curLangCode] ?? {} as Record<string, unknown>;
                const cf = (key: string) => String(pageContent[key] ?? "");
                const onChange = (key: string, val: unknown) => setContentField(activePage.slug, curLangCode, key, val);
                const slug = activePage.slug;

                const pageBlockTypes = new Set(
                  (blocks).map(b => b.type)
                );

                const schedEvents = Array.isArray(pageContent.events) ? (pageContent.events as Record<string, unknown>[]) : [];
                const faqQuestions = Array.isArray(pageContent.questions) ? (pageContent.questions as Record<string, unknown>[]) : [];
                const tidbits = Array.isArray(pageContent.tidbits) ? (pageContent.tidbits as Record<string,unknown>[]) : [];
                const travelItems = Array.isArray(pageContent.travelItems) ? (pageContent.travelItems as Record<string,unknown>[]) : [];

                const multiTextModes = new Set(
                  blocks
                    .filter(b => b.type === 'multi-text')
                    .map(b => { try { return String((JSON.parse(b.config || '{}') as Record<string,unknown>).mode || 'text'); } catch { return 'text'; } })
                );

                const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "4px", marginBottom: "0.75rem" };
                const lblStyle: React.CSSProperties = { fontSize: "0.72rem", color: "#6b5e56", fontWeight: 500 };
                const inputStyle: React.CSSProperties = { border: "1px solid #e0dbd4", borderRadius: "7px", padding: "7px 10px", fontSize: "0.82rem", color: "#1c1917", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" };
                const taStyle: React.CSSProperties = { ...inputStyle, minHeight: "80px", resize: "vertical" };
                const sectionHeadStyle: React.CSSProperties = { fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9b8e85", margin: "0 0 0.75rem" };

                return (
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    {/* Language switcher */}
                    <div className="cnt-lang-toggle">
                      <div className="cnt-lang-pills">
                        <button
                          className={`cnt-lang-pill${contentLang === "main" ? " active" : ""}`}
                          onClick={() => setContentLang("main")}
                        >
                          {LANG_FLAGS[mainLang] ?? "🏳️"} {LANGUAGES.find(l => l.code === mainLang)?.label ?? mainLang}
                        </button>
                        {secondLang && (
                          <button
                            className={`cnt-lang-pill${contentLang === "second" ? " active" : ""}`}
                            onClick={() => setContentLang("second")}
                          >
                            {LANG_FLAGS[secondLang] ?? "🏳️"} {LANGUAGES.find(l => l.code === secondLang)?.label ?? secondLang}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable content area */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
                      {contentLoading ? (
                        <p style={{ fontSize: "0.78rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>Loading…</p>
                      ) : (
                        <>
                          {/* HOME */}
                          {slug === "home" && (<>
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Welcome Section</p>
                              <div style={fieldStyle}><label style={lblStyle}>Welcome Title</label><input style={inputStyle} value={cf("welcome_title")} onChange={e => onChange("welcome_title", e.target.value)} placeholder="Welcome to our wedding!" /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Welcome Body</label><textarea style={taStyle} value={cf("welcome_body")} onChange={e => onChange("welcome_body", e.target.value)} /></div>
                              <div style={{borderTop:'1px solid #f0ede8',marginTop:'0.75rem',paddingTop:'0.75rem'}}>
                                <p style={sectionHeadStyle}>Hero Section (used for translation)</p>
                                <div style={fieldStyle}><label style={lblStyle}>Couple Names</label><input style={inputStyle} value={cf("couple")} onChange={e => onChange("couple", e.target.value)} placeholder="Alex &amp; Jordan" /></div>
                                <div style={fieldStyle}><label style={lblStyle}>Date Line</label><input style={inputStyle} value={cf("date")} onChange={e => onChange("date", e.target.value)} placeholder="December 31, 2025" /></div>
                                <div style={fieldStyle}><label style={lblStyle}>Location Line</label><input style={inputStyle} value={cf("location")} onChange={e => onChange("location", e.target.value)} placeholder="Grand Ballroom, New York" /></div>
                              </div>
                            </div>
                          </>)}

                          {/* STORY */}
                          {slug === "story" && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Story Text</p>
                              <div style={fieldStyle}><label style={lblStyle}>Story Body <span style={{ fontWeight: 400, color: "#b0a99f" }}>(paragraphs separated by blank lines)</span></label><textarea style={{ ...taStyle, minHeight: "140px" }} value={cf("body")} onChange={e => onChange("body", e.target.value)} /></div>
                            </div>
                          )}

                          {/* ACCOMMODATIONS */}
                          {slug === "accommodations" && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Accommodations</p>
                              <div style={fieldStyle}><label style={lblStyle}>Intro Paragraph</label><textarea style={taStyle} value={cf("intro")} onChange={e => onChange("intro", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Hotel / Resort Name</label><input style={inputStyle} value={cf("hotel_name")} onChange={e => onChange("hotel_name", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Hotel Description</label><textarea style={taStyle} value={cf("hotel_description")} onChange={e => onChange("hotel_description", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Room Block Note</label><input style={inputStyle} value={cf("room_block_note")} onChange={e => onChange("room_block_note", e.target.value)} /></div>
                            </div>
                          )}

                          {/* REGISTRY */}
                          {slug === "registry" && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Registry</p>
                              <div style={fieldStyle}><label style={lblStyle}>Intro Text</label><textarea style={taStyle} value={cf("intro")} onChange={e => onChange("intro", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Item Name</label><input style={inputStyle} value={cf("item_name")} onChange={e => onChange("item_name", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Item Description</label><textarea style={taStyle} value={cf("item_description")} onChange={e => onChange("item_description", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Button Text</label><input style={inputStyle} value={cf("cta")} onChange={e => onChange("cta", e.target.value)} placeholder="Contribute" /></div>
                            </div>
                          )}

                          {/* SCHEDULE */}
                          {(slug === "schedule" || pageBlockTypes.has("schedule") || multiTextModes.has("schedule")) && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Schedule Events</p>
                              {schedEvents.map((ev, i) => (
                                <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Event {i + 1}</span>
                                    <button onClick={() => onChange("events", schedEvents.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
                                  </div>
                                  {(["name", "date", "time", "location", "description"] as const).map(f => (
                                    <div key={f} style={{ ...fieldStyle, marginBottom: "0.4rem" }}>
                                      <label style={{ ...lblStyle, textTransform: "capitalize" }}>{f}</label>
                                      {f === "description"
                                        ? <textarea style={{ ...taStyle, minHeight: "54px" }} value={String(ev[f] ?? "")} onChange={e => { const next = [...schedEvents]; next[i] = { ...next[i], [f]: e.target.value }; onChange("events", next); }} />
                                        : <input style={inputStyle} value={String(ev[f] ?? "")} onChange={e => { const next = [...schedEvents]; next[i] = { ...next[i], [f]: e.target.value }; onChange("events", next); }} />}
                                    </div>
                                  ))}
                                </div>
                              ))}
                              <button onClick={() => onChange("events", [...schedEvents, { name: "", date: "", time: "", location: "", description: "" }])} className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Event</button>
                            </div>
                          )}

                          {/* FAQ */}
                          {(slug === "faq" || pageBlockTypes.has("faq") || multiTextModes.has("faq")) && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>FAQ</p>
                              <div style={fieldStyle}><label style={lblStyle}>Intro Text</label><input style={inputStyle} value={cf("intro")} onChange={e => onChange("intro", e.target.value)} /></div>
                              {faqQuestions.map((q, i) => (
                                <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Q {i + 1}</span>
                                    <button onClick={() => onChange("questions", faqQuestions.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
                                  </div>
                                  <div style={{ ...fieldStyle, marginBottom: "0.4rem" }}><label style={lblStyle}>Question</label><input style={inputStyle} value={String(q.q ?? "")} onChange={e => { const next = [...faqQuestions]; next[i] = { ...next[i], q: e.target.value }; onChange("questions", next); }} /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Answer</label><textarea style={{ ...taStyle, minHeight: "54px" }} value={String(q.a ?? "")} onChange={e => { const next = [...faqQuestions]; next[i] = { ...next[i], a: e.target.value }; onChange("questions", next); }} /></div>
                                </div>
                              ))}
                              <button onClick={() => onChange("questions", [...faqQuestions, { q: "", a: "" }])} className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Question</button>
                            </div>
                          )}

                          {/* TIDBITS (Fun Facts) */}
                          {(pageBlockTypes.has("tidbits") || multiTextModes.has("tidbits")) && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Fun Facts</p>
                              {tidbits.map((item, i) => (
                                <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Fact {i + 1}</span>
                                    <button onClick={() => onChange("tidbits", tidbits.filter((_, j) => j !== i))}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
                                  </div>
                                  <div style={fieldStyle}><label style={lblStyle}>Icon / Emoji</label>
                                    <input style={inputStyle} value={String(item.icon ?? "")} onChange={e => {
                                      const next = [...tidbits]; next[i] = { ...next[i], icon: e.target.value }; onChange("tidbits", next);
                                    }} placeholder="✨" /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Title</label>
                                    <input style={inputStyle} value={String(item.title ?? "")} onChange={e => {
                                      const next = [...tidbits]; next[i] = { ...next[i], title: e.target.value }; onChange("tidbits", next);
                                    }} /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Body</label>
                                    <textarea style={{ ...taStyle, minHeight: "60px" }} value={String(item.body ?? "")} onChange={e => {
                                      const next = [...tidbits]; next[i] = { ...next[i], body: e.target.value }; onChange("tidbits", next);
                                    }} /></div>
                                </div>
                              ))}
                              <button onClick={() => onChange("tidbits", [...tidbits, { icon: "✨", title: "", body: "" }])}
                                className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Fact</button>
                            </div>
                          )}

                          {/* TRAVEL */}
                          {(pageBlockTypes.has("travel-section") || multiTextModes.has("travel")) && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>Travel Details</p>
                              {travelItems.map((item, i) => (
                                <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Item {i + 1}</span>
                                    <button onClick={() => onChange("travelItems", travelItems.filter((_, j) => j !== i))}
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
                                  </div>
                                  <div style={fieldStyle}><label style={lblStyle}>Heading</label>
                                    <input style={inputStyle} value={String(item.heading ?? "")} onChange={e => {
                                      const next = [...travelItems]; next[i] = { ...next[i], heading: e.target.value }; onChange("travelItems", next);
                                    }} placeholder="Getting to the venue" /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Body</label>
                                    <textarea style={{ ...taStyle, minHeight: "80px" }} value={String(item.body ?? "")} onChange={e => {
                                      const next = [...travelItems]; next[i] = { ...next[i], body: e.target.value }; onChange("travelItems", next);
                                    }} /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Link Label (optional)</label>
                                    <input style={inputStyle} value={String(item.linkLabel ?? "")} onChange={e => {
                                      const next = [...travelItems]; next[i] = { ...next[i], linkLabel: e.target.value }; onChange("travelItems", next);
                                    }} placeholder="Get directions" /></div>
                                  <div style={fieldStyle}><label style={lblStyle}>Link URL (optional)</label>
                                    <input style={inputStyle} type="url" value={String(item.linkUrl ?? "")} onChange={e => {
                                      const next = [...travelItems]; next[i] = { ...next[i], linkUrl: e.target.value }; onChange("travelItems", next);
                                    }} placeholder="https://maps.google.com/…" /></div>
                                </div>
                              ))}
                              <button onClick={() => onChange("travelItems", [...travelItems, { heading: "", body: "", linkLabel: "", linkUrl: "" }])}
                                className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Travel Item</button>
                            </div>
                          )}

                          {/* RSVP */}
                          {slug === "rsvp" && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>RSVP</p>
                              <div style={fieldStyle}><label style={lblStyle}>Form Heading</label><input style={inputStyle} value={cf("heading")} onChange={e => onChange("heading", e.target.value)} placeholder="Join us" /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Confirmation Message</label><textarea style={taStyle} value={cf("confirm_text")} onChange={e => onChange("confirm_text", e.target.value)} placeholder="Thank you! We'll see you there." /></div>
                            </div>
                          )}

                          {/* GENERIC (travel, custom pages, etc.) */}
                          {!["home","story","accommodations","registry","schedule","faq","rsvp"].includes(slug) && (
                            <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
                              <p style={sectionHeadStyle}>{activePage.label}</p>
                              <div style={fieldStyle}><label style={lblStyle}>Page Heading</label><input style={inputStyle} value={cf("heading")} onChange={e => onChange("heading", e.target.value)} /></div>
                              <div style={fieldStyle}><label style={lblStyle}>Body Text</label><textarea style={{ ...taStyle, minHeight: "120px" }} value={cf("body")} onChange={e => onChange("body", e.target.value)} /></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Save button (sticky bottom) */}
                    <div style={{ padding: "0.75rem", flexShrink: 0, borderTop: "1px solid #f0ede8" }}>
                      <button
                        className="btn-primary-sm"
                        style={{ width: "100%", padding: "0.65rem", fontSize: "0.85rem", background: "#E75850", borderColor: "#E75850" }}
                        onClick={handleSaveContent}
                        disabled={contentSaving}
                      >
                        {contentSaving ? "Saving…" : "Save Content"}
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Right panel — preview */}
            <div className="builder-right">
              <div className="preview-toolbar">
                <div style={{ display: "flex", gap: "6px", marginRight: "auto", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#9b8e85" }}>
                    {activePage ? activePage.label : (pagesLoading ? "Loading…" : "No pages")}
                  </span>
                </div>
                <div className="device-toggle">
                  <button
                    className={`device-btn${previewDevice === "mobile" ? " active" : ""}`}
                    onClick={() => setPreviewDevice("mobile")}
                  >Mobile</button>
                  <button
                    className={`device-btn${previewDevice === "desktop" ? " active" : ""}`}
                    onClick={() => setPreviewDevice("desktop")}
                  >Desktop</button>
                </div>
              </div>
              <div className="preview-wrap">
                <iframe
                  ref={iframeRef}
                  key={`${activePage?.id ?? "no-page"}-${previewKey}`}
                  className="preview-iframe"
                  src={previewUrl}
                  title="Page preview"
                  style={{ width: previewWidth }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDIA ───────────────────────────────────────────── */}
      {section === "media" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Media</span>
            <div className="section-topbar-spacer" />
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e8e4e0", background: "#fff", flexShrink: 0, padding: "0 1.25rem" }}>
            {(["photos", "videos", "music"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMediaTab(tab)}
                style={{
                  padding: "0.6rem 1rem",
                  fontSize: "0.8rem",
                  fontWeight: mediaTab === tab ? 600 : 400,
                  color: mediaTab === tab ? "var(--accent)" : "#9b8e85",
                  background: "none",
                  border: "none",
                  borderBottom: mediaTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  marginBottom: "-1px",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Photos tab ── */}
          {mediaTab === "photos" && (
            <div className="lib-content" style={{ overflowY: "auto", flex: 1 }}>
              <label className="upload-zone" aria-label="Upload photos">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleUploadPhoto(e.target.files)}
                  disabled={uploading}
                />
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1c1917", marginBottom: "0.25rem" }}>
                  {uploading ? "Uploading…" : "Drop photos here or click to upload"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#9b8e85" }}>
                  JPG, PNG, WebP, GIF — max 10 MB each
                </div>
              </label>

              {photosLoading ? (
                <p style={{ fontSize: "0.8rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>Loading photos…</p>
              ) : (
                <div className="lib-grid">
                  {photos.length === 0 ? (
                    <div className="lib-item" style={{ height: "120px", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.7rem", color: "#9b8e85" }}>No photos yet</span>
                    </div>
                  ) : (
                    photos.map((photo) => (
                      <div key={photo.id} className="lib-item" style={{ position: "relative" }}>
                        <img
                          src={`/api/sites/${site.id}/photos/${photo.id}`}
                          alt={photo.filename}
                          title={photo.filename}
                          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", background: "#f0ede8" }}
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          aria-label={`Delete photo ${photo.filename}`}
                          style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(28,25,23,0.65)", color: "#fff", border: "none", borderRadius: "4px", width: "22px", height: "22px", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >✕</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Videos tab ── */}
          {mediaTab === "videos" && (
            <div className="lib-content" style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.75rem" }}>Add Video</div>
                <div className="sf-group">
                  <label className="sf-lbl">YouTube or Vimeo URL</label>
                  <input
                    className="sf-input"
                    type="url"
                    placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddVideo(); }}
                  />
                </div>
                <div className="sf-group">
                  <label className="sf-lbl">Title (optional)</label>
                  <input
                    className="sf-input"
                    type="text"
                    placeholder="Our highlight reel"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddVideo(); }}
                  />
                </div>
                <button
                  className="btn-primary-sm"
                  onClick={handleAddVideo}
                  disabled={addingVideo || !newVideoUrl.trim()}
                  style={{ width: "100%" }}
                >
                  {addingVideo ? "Adding…" : "Add Video"}
                </button>
              </div>

              {videosLoading ? (
                <p style={{ fontSize: "0.8rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>Loading…</p>
              ) : videos.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#9b8e85", textAlign: "center", padding: "2rem 0" }}>No videos yet. Add a YouTube or Vimeo link above.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {videos.map((v) => (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: "1px solid #e8e4e0", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{v.title ?? "Untitled"}</p>
                        <p style={{ fontSize: "0.7rem", color: "#9b8e85", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{v.url}</p>
                      </div>
                      <button onClick={() => handleDeleteVideo(v.id)} aria-label="Remove video" style={{ background: "none", border: "none", cursor: "pointer", color: "#c42a22", fontSize: "0.8rem", padding: "2px 6px" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Music tab ── */}
          {mediaTab === "music" && (
            <div className="lib-content" style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.75rem" }}>Add Music</div>
                <div className="sf-group">
                  <label className="sf-lbl">YouTube or SoundCloud URL</label>
                  <input
                    className="sf-input"
                    type="url"
                    placeholder="https://youtube.com/watch?v=… or https://soundcloud.com/…"
                    value={newMusicUrl}
                    onChange={(e) => setNewMusicUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddMusicTrack(); }}
                  />
                </div>
                <div className="sf-group">
                  <label className="sf-lbl">Title (optional)</label>
                  <input
                    className="sf-input"
                    type="text"
                    placeholder="Perfect — Ed Sheeran"
                    value={newMusicTitle}
                    onChange={(e) => setNewMusicTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddMusicTrack(); }}
                  />
                </div>
                <button
                  className="btn-primary-sm"
                  onClick={handleAddMusicTrack}
                  disabled={addingMusicTrack || !newMusicUrl.trim()}
                  style={{ width: "100%" }}
                >
                  {addingMusicTrack ? "Adding…" : "Add Music"}
                </button>
              </div>

              {musicLoading ? (
                <p style={{ fontSize: "0.8rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>Loading…</p>
              ) : musicTracks.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#9b8e85", textAlign: "center", padding: "2rem 0" }}>No music yet. Add a YouTube or SoundCloud link above.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {musicTracks.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: "1px solid #e8e4e0", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.title ?? "Untitled"}</p>
                        <p style={{ fontSize: "0.7rem", color: "#9b8e85", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.url}</p>
                      </div>
                      <button onClick={() => handleDeleteMusicTrack(m.id)} aria-label="Remove music" style={{ background: "none", border: "none", cursor: "pointer", color: "#c42a22", fontSize: "0.8rem", padding: "2px 6px" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GUEST LIST ──────────────────────────────────────── */}
      {section === "guestlist" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Guest List</span>
            <div className="section-topbar-spacer" />
          </div>
          <div className="gl-shell">
            <div className="gl-toolbar">
              <button
                className="gl-btn gl-add-btn"
                onClick={() => setGuestModalOpen(true)}
                aria-label="Add a new guest"
              >
                + Add Guest
              </button>
              <div className="gl-toolbar-sep" />
              <button
                className="gl-btn"
                onClick={() => csvImportRef.current?.click()}
                disabled={importProgress !== null}
                aria-label="Import guests from CSV"
              >
                {importProgress
                  ? `Importing ${importProgress.done}/${importProgress.total}…`
                  : "↑ Import"}
              </button>
              <input
                ref={csvImportRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                aria-hidden="true"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportCsv(file);
                  e.target.value = "";
                }}
              />
              <button
                className="gl-btn"
                onClick={handleExportCsv}
                disabled={guests.length === 0}
                aria-label="Export guests to CSV"
              >
                ↓ Export
              </button>
              <div className="gl-toolbar-sep" />
              <select
                style={{ background: "#fff", border: "1px solid #ddd", color: "#1c1917", padding: "4px 9px", fontSize: "0.75rem", borderRadius: "8px", cursor: "pointer" }}
                value={guestFilter}
                onChange={(e) => handleFilterGuests(e.target.value)}
                aria-label="Filter guests by RSVP status"
              >
                <option value="">All Guests</option>
                <option value="yes">Attending</option>
                <option value="no">Declined</option>
                <option value="pending">Pending</option>
              </select>
              <div className="gl-toolbar-spacer" />
              <span className="gl-count">
                {guestsLoading ? "…" : `${guests.length} guest${guests.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="gl-table-wrap">
              <table className="gl-table">
                <thead>
                  <tr>
                    <th className="gl-th">First Name</th>
                    <th className="gl-th">Last Name</th>
                    <th className="gl-th">Party</th>
                    <th className="gl-th">RSVP</th>
                    <th className="gl-th">Notes</th>
                    <th className="gl-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {guestsLoading ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="gl-empty">Loading guests…</div>
                      </td>
                    </tr>
                  ) : guests.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="gl-empty">
                          No guests yet — add your first guest or import a CSV file.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    guests.map((guest) => (
                      <tr key={guest.id} className="gl-row">
                        <td className="gl-td">{guest.firstName}</td>
                        <td className="gl-td">{guest.lastName ?? "—"}</td>
                        <td className="gl-td">{guest.party ?? "—"}</td>
                        <td className="gl-td">
                          <span className={rsvpBadgeClass(guest.rsvpStatus)}>
                            {rsvpBadgeLabel(guest.rsvpStatus)}
                          </span>
                        </td>
                        <td className="gl-td" style={{ color: "#9b8e85", fontSize: "0.78rem" }}>
                          {guest.notes ?? "—"}
                        </td>
                        <td className="gl-td">
                          <button
                            className="bact"
                            onClick={() => handleDeleteGuest(guest.id)}
                            aria-label={`Delete guest ${guest.firstName} ${guest.lastName ?? ""}`}
                            style={{ color: "#ccc" }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ───────────────────────────────────────── */}
      {section === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Templates</span>
            <div className="section-topbar-spacer" />
          </div>
          <div className="tmpl-shell">
            <div className="tmpl-header">
              <div>
                <p className="tmpl-heading">Saved Snapshots</p>
                <p className="tmpl-sub">
                  Save the current state of your site at any time. Apply a snapshot to restore a previous version.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  className="sf-input"
                  placeholder="Snapshot name…"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
                  style={{ minWidth: "160px" }}
                  aria-label="Snapshot name"
                />
                <button
                  className="btn-primary-sm"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate || !templateNameInput.trim()}
                >
                  {savingTemplate ? "Saving…" : "Save Current State"}
                </button>
              </div>
            </div>

            {templatesLoading ? (
              <div className="tmpl-empty">Loading snapshots…</div>
            ) : templates.length === 0 ? (
              <div className="tmpl-empty">
                No snapshots yet — save your current state to create your first one.
              </div>
            ) : (
              templates.map((tmpl) => (
                <div key={tmpl.id} className="tmpl-row">
                  <div>
                    <div className="tmpl-row-name">{tmpl.name}</div>
                    <div className="tmpl-row-date">{formatDate(tmpl.createdAt)}</div>
                  </div>
                  <div className="tmpl-row-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => handleApplyTemplate(tmpl.id)}
                      aria-label={`Apply snapshot ${tmpl.name}`}
                    >
                      Apply
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      aria-label={`Delete snapshot ${tmpl.name}`}
                      style={{ color: "#c42a22", borderColor: "#fde8e7" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── SITE SETUP ──────────────────────────────────────── */}
      {section === "site-setup" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Site Setup</span>
            <div className="section-topbar-spacer" />
          </div>
          <div className="site-setup-body">
            {/* Website Type */}
            <div className="setup-section">
              <div className="setup-section-head">
                <h2 className="setup-section-title">Website Type</h2>
                <p className="setup-section-desc">Choose the type of event this website is for.</p>
              </div>
              <div className="setup-type-grid">
                {EVENT_TYPES.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    className={`setup-type-card${eventType === type ? " active" : ""}`}
                    onClick={() => setEventType(type)}
                    aria-pressed={eventType === type}
                  >
                    <span className="setup-type-icon">{icon}</span>
                    <span className="setup-type-name">{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="btn-primary-sm"
                  onClick={handleSaveEventType}
                  disabled={savingType}
                >
                  {savingType ? "Saving…" : "Save Type"}
                </button>
              </div>
            </div>

            {/* Share & QR Code */}
            {(() => {
              const publicUrl = `https://dreamysuite.com/${site.slug}`;
              const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

              async function handleCopyLink() {
                try {
                  await navigator.clipboard.writeText(publicUrl);
                  setCopyLinkFeedback(true);
                  setTimeout(() => setCopyLinkFeedback(false), 2000);
                } catch {
                  // fallback: select a temp input
                  const el = document.createElement("input");
                  el.value = publicUrl;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand("copy");
                  document.body.removeChild(el);
                  setCopyLinkFeedback(true);
                  setTimeout(() => setCopyLinkFeedback(false), 2000);
                }
              }

              async function handleDownloadQr() {
                setQrDownloading(true);
                try {
                  const res = await fetch(qrSrc);
                  const blob = await res.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = objectUrl;
                  a.download = `qr-${site.slug}.png`;
                  a.click();
                  URL.revokeObjectURL(objectUrl);
                } catch {
                  toast("Failed to download QR code", true);
                } finally {
                  setQrDownloading(false);
                }
              }

              return (
                <div className="setup-section">
                  <div className="setup-section-head">
                    <h2 className="setup-section-title">Share &amp; QR Code</h2>
                    <p className="setup-section-desc">Share your site link or print the QR code on invitations and displays.</p>
                  </div>

                  {/* Live status notice */}
                  {!settingsForm.isLive && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "1rem", fontSize: "0.78rem", color: "#92400e", lineHeight: 1.5 }}>
                      <strong>Draft mode</strong> — only you can see this site right now. Go to Settings → Access to publish it.
                    </div>
                  )}

                  {/* URL row */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{
                      flex: 1, minWidth: 0,
                      background: "#f5f0eb", borderRadius: "8px",
                      padding: "0.55rem 0.85rem",
                      fontSize: "0.83rem", color: "#1c1917", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      border: "1.5px solid #e0dbd4",
                    }}>
                      {publicUrl}
                    </div>
                    <button
                      className="btn-primary-sm"
                      style={{ flexShrink: 0, minWidth: "88px" }}
                      onClick={handleCopyLink}
                      aria-label="Copy site link to clipboard"
                    >
                      {copyLinkFeedback ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  {/* ── Invite Collaborator ── */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9b8e85', marginBottom: '0.5rem' }}>Collaborators</div>
                    <p style={{ fontSize: '0.78rem', color: '#6b5e56', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      Invite someone by email — they'll get a link to this editor.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input
                        type="email"
                        className="sf-input"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendInvite(); }}
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <button
                        className="btn-primary-sm"
                        style={{ flexShrink: 0 }}
                        disabled={inviteSending || !inviteEmail.trim()}
                        onClick={sendInvite}
                      >
                        {inviteSending ? 'Sending…' : 'Send Invite'}
                      </button>
                    </div>
                    {invites.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {invites.map((inv) => (
                          <li key={inv.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#f5f0eb', borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            border: '1px solid #e0dbd4',
                          }}>
                            <span style={{ fontSize: '0.78rem', color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {inv.email}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#b0a99f', flexShrink: 0, marginLeft: '0.5rem' }}>
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeInvite(inv.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0a99f', fontSize: '0.75rem', flexShrink: 0, marginLeft: '0.5rem', padding: '2px 4px', lineHeight: 1 }}
                              aria-label={`Remove ${inv.email}`}
                            >✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* QR image + download */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
                    <img
                      src={qrSrc}
                      alt={`QR code for ${publicUrl}`}
                      width={160}
                      height={160}
                      style={{
                        border: "1.5px solid #e0dbd4",
                        borderRadius: "10px",
                        background: "#fff",
                        display: "block",
                      }}
                    />
                    <button
                      className="btn-ghost"
                      onClick={handleDownloadQr}
                      disabled={qrDownloading}
                      aria-label="Download QR code as PNG"
                    >
                      {qrDownloading ? "Downloading…" : "Download QR Code"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Custom Domain */}
            <div className="setup-section">
              <div className="setup-section-head">
                <h2 className="setup-section-title">Custom Domain</h2>
                <p className="setup-section-desc">
                  Connect your own domain so guests visit <em>yourdomain.com</em> instead of{" "}
                  <em>{site.slug}.dreamysuite.com</em>.
                </p>
              </div>
              {site.customDomain ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
                    ✓ {site.customDomain}
                  </span>
                  <button className="btn-ghost" style={{ fontSize: "0.78rem" }} onClick={() => setDomainModalOpen(true)}>
                    Change
                  </button>
                </div>
              ) : (
                <button className="btn-primary-sm" onClick={() => setDomainModalOpen(true)}>
                  Connect Domain
                </button>
              )}
            </div>

            {/* Domain Picker Modal */}
            {domainModalOpen && (
              <div
                style={{
                  position: "fixed", inset: 0, zIndex: 9999,
                  background: "rgba(0,0,0,0.45)", display: "flex",
                  alignItems: "center", justifyContent: "center", padding: "1rem",
                }}
                onClick={() => setDomainModalOpen(false)}
              >
                <div
                  style={{
                    background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "480px",
                    padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
                      Choose Your Website Address
                    </h3>
                    <button
                      onClick={() => setDomainModalOpen(false)}
                      className="overlay-close"
                      aria-label="Close"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {(["free", "buy"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDomainTab(tab)}
                        style={{
                          flex: 1, padding: "0.5rem", borderRadius: "8px", border: "none",
                          cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                          background: domainTab === tab ? "var(--accent)" : "#f5f0eb",
                          color: domainTab === tab ? "#fff" : "#6b5e56",
                          transition: "all 0.15s",
                        }}
                      >
                        {tab === "free" ? "Free Link" : "Buy a Domain"}
                      </button>
                    ))}
                  </div>

                  {/* Free tab */}
                  {domainTab === "free" && (
                    <div>
                      <p style={{ fontSize: "0.82rem", color: "#6b5e56", marginBottom: "1rem" }}>
                        Your site is instantly available at this free address — no setup needed.
                      </p>
                      <div style={{
                        background: "#f5f0eb", borderRadius: "10px", padding: "0.85rem 1rem",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
                      }}>
                        <span style={{ fontSize: "0.85rem", color: "#1c1917", fontWeight: 500 }}>
                          dreamysuite.com/<strong>{site.slug}</strong>
                        </span>
                        <button
                          className="btn-primary-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://dreamysuite.com/${site.slug}`);
                          }}
                          style={{ flexShrink: 0 }}
                        >
                          Copy
                        </button>
                      </div>
                      <p style={{ fontSize: "0.74rem", color: "#9b8e85", marginTop: "0.75rem" }}>
                        This is your default link. No changes needed to use it.
                      </p>
                    </div>
                  )}

                  {/* Buy tab */}
                  {domainTab === "buy" && (
                    <div>
                      <p style={{ fontSize: "0.82rem", color: "#6b5e56", marginBottom: "1rem" }}>
                        Search for a domain and purchase it directly. It will automatically connect to your site.
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          className="qr-url-input"
                          placeholder="e.g. dannis-naomi.com"
                          value={domainSearch}
                          onChange={(e) => {
                            setDomainSearch(e.target.value);
                            setDomainResult(null);
                            setDomainCheckError(null);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && checkDomainAvailability()}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn-primary-sm"
                          style={{ flexShrink: 0 }}
                          onClick={checkDomainAvailability}
                          disabled={domainCheckLoading}
                        >
                          {domainCheckLoading ? "Checking…" : "Search"}
                        </button>
                      </div>

                      {/* Results */}
                      {domainCheckError && (
                        <div style={{
                          marginTop: "0.85rem", background: "#fff0f0", border: "1px solid #fca5a5",
                          borderRadius: "10px", padding: "0.75rem 1rem",
                          fontSize: "0.8rem", color: "#b91c1c",
                        }}>
                          {domainCheckError}
                        </div>
                      )}

                      {domainResult && !domainCheckError && (
                        <div style={{
                          marginTop: "0.85rem", background: "#f5f0eb", borderRadius: "10px",
                          padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem",
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1c1917" }}>
                              {domainResult.domain}
                            </div>
                            {domainResult.available ? (
                              <div style={{ fontSize: "0.76rem", color: "var(--accent)", marginTop: "2px" }}>
                                Available
                                {domainResult.price
                                  ? ` · $${domainResult.price.toFixed(2)}/yr via Cloudflare`
                                  : " · pricing unavailable for this TLD"}
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.76rem", color: "#b91c1c", marginTop: "2px" }}>
                                Unavailable — this domain is already registered
                              </div>
                            )}
                          </div>
                          {domainResult.available && domainResult.supported && (
                            <button
                              className="btn-primary-sm"
                              style={{ flexShrink: 0 }}
                              onClick={handleDomainPurchase}
                              disabled={domainPurchasing}
                            >
                              {domainPurchasing ? "Purchasing…" : "Purchase"}
                            </button>
                          )}
                        </div>
                      )}

                      {domainPurchaseError && (
                        <div style={{
                          marginTop: "0.85rem", background: "#fff0f0", border: "1px solid #fca5a5",
                          borderRadius: "10px", padding: "0.75rem 1rem",
                          fontSize: "0.8rem", color: "#b91c1c",
                        }}>
                          {domainPurchaseError}
                        </div>
                      )}

                      {!domainResult && !domainCheckError && (
                        <div style={{
                          marginTop: "0.85rem", background: "#f5f0eb", borderRadius: "10px",
                          padding: "0.85rem 1rem", fontSize: "0.8rem", color: "#9b8e85", textAlign: "center",
                        }}>
                          Enter a domain name above to check availability and pricing.
                        </div>
                      )}

                      <p style={{ fontSize: "0.74rem", color: "#9b8e85", marginTop: "0.75rem" }}>
                        Domains are registered via Cloudflare at cost. Pricing starts at ~$9/yr for .com.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Canva */}
            <div className="setup-section">
              <div className="setup-section-head">
                <h2 className="setup-section-title">Design Import</h2>
                <p className="setup-section-desc">Connect Canva to import custom designs into your photos section.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f8f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="50" fill="#7D2AE8"/>
                    <text x="50" y="68" textAnchor="middle" fill="white" fontSize="55" fontWeight="bold" fontFamily="Arial">C</text>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1c1917" }}>Canva</div>
                  <div style={{ fontSize: "0.73rem", color: canvaConnected ? "var(--accent)" : "#9b8e85" }}>
                    {canvaConnected ? "Connected" : "Not connected"}
                  </div>
                </div>
                {canvaConnected ? (
                  <button
                    className="btn-primary-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={() => setCanvaModalOpen(true)}
                  >
                    Browse Designs
                  </button>
                ) : (
                  <a
                    href={`/api/canva/connect?siteId=${site.id}`}
                    className="btn-primary-sm"
                    style={{ marginLeft: "auto" }}
                  >
                    Connect Canva
                  </a>
                )}
              </div>
            </div>

            {/* Site Live Toggle */}
            <div className="setup-section">
              <div className="setup-section-head">
                <h2 className="setup-section-title">Site Status</h2>
                <p className="setup-section-desc">Control whether guests can view your site.</p>
              </div>
              {settingsLoading ? (
                <p style={{ fontSize: "0.82rem", color: "#b0a99f" }}>Loading…</p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "6px 14px", borderRadius: "20px",
                    background: settingsForm.isLive ? "var(--accent-light)" : "#f5f0eb",
                    border: `1.5px solid ${settingsForm.isLive ? "#99f6e4" : "#e0dbd4"}`,
                  }}>
                    <span style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: settingsForm.isLive ? "var(--accent)" : "#b0a99f",
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: "0.82rem", fontWeight: 600,
                      color: settingsForm.isLive ? "var(--accent)" : "#6b5e56",
                    }}>
                      {settingsForm.isLive ? "Site is Live" : "Site is Offline"}
                    </span>
                  </div>
                  <button
                    className="btn-primary-sm"
                    onClick={handleToggleLive}
                    style={settingsForm.isLive
                      ? { background: "#6b5e56", borderColor: "#6b5e56" }
                      : undefined}
                    aria-label={settingsForm.isLive ? "Take site offline" : "Go live"}
                  >
                    {settingsForm.isLive ? "Take Offline" : "Go Live"}
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="setup-section" style={{ gridColumn: "1 / -1" }}>
              <div className="setup-section-head">
                <h2 className="setup-section-title">Advanced Settings</h2>
                <p className="setup-section-desc">Event info, music, language, welcome overlay, guest access &amp; global styles.</p>
              </div>
              <button className="btn-ghost" onClick={() => setSettingsOpen(true)}>
                ⚙ Open Site Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ───────────────────────────────────────── */}
      {section === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="topbar-brand">DreamySuite</span>
            <span className="topbar-sep">/</span>
            <span className="section-topbar-title">Analytics</span>
            <div className="section-topbar-spacer" />
          </div>
          <div className="analytics-body">
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="analytics-section-title">RSVP Overview</div>
              {analyticsLoading ? (
                <p style={{ fontSize: "0.8rem", color: "#b0a99f", padding: "1.5rem 0" }}>Loading analytics…</p>
              ) : analytics ? (() => {
                const { total, accepted, declined, pending } = analytics.rsvp;
                const rsvped = accepted + declined;
                const rate = total > 0 ? Math.round((rsvped / total) * 100) : 0;
                return (
                  <div className="analytics-stat-grid">
                    <div className="analytics-stat-card">
                      <span className="analytics-stat-num">{total}</span>
                      <span className="analytics-stat-lbl">Total Guests</span>
                    </div>
                    <div className="analytics-stat-card">
                      <span className="analytics-stat-num">{rsvped}</span>
                      <span className="analytics-stat-lbl">RSVPed</span>
                    </div>
                    <div className="analytics-stat-card analytics-stat-green">
                      <span className="analytics-stat-num">{accepted}</span>
                      <span className="analytics-stat-lbl">Attending</span>
                    </div>
                    <div className="analytics-stat-card analytics-stat-muted">
                      <span className="analytics-stat-num">{declined}</span>
                      <span className="analytics-stat-lbl">Declined</span>
                    </div>
                    <div className="analytics-stat-card analytics-stat-amber">
                      <span className="analytics-stat-num">{pending}</span>
                      <span className="analytics-stat-lbl">Awaiting</span>
                    </div>
                    <div className="analytics-stat-card">
                      <span className="analytics-stat-num">{rate}%</span>
                      <span className="analytics-stat-lbl">Response Rate</span>
                    </div>
                  </div>
                );
              })() : (
                <div className="analytics-stat-grid">
                  {(["Total Guests", "RSVPed", "Attending", "Declined", "Awaiting", "Response Rate"] as const).map((lbl) => (
                    <div key={lbl} className="analytics-stat-card">
                      <span className="analytics-stat-num">—</span>
                      <span className="analytics-stat-lbl">{lbl}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="analytics-section-title">Page Views</div>
              {analyticsLoading ? (
                <p style={{ fontSize: "0.8rem", color: "#b0a99f", padding: "1.5rem 0", textAlign: "center" }}>
                  Loading page views…
                </p>
              ) : analytics && analytics.pageViews.length > 0 ? (
                analytics.pageViews.map((pv) => (
                  <div key={pv.pageSlug} className="analytics-views-row">
                    <div className="analytics-views-url">/{pv.pageSlug}</div>
                    <div className="analytics-views-count">{pv.views.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#b0a99f", fontSize: "0.82rem", padding: "1.5rem 0", textAlign: "center" }}>
                  No page view data yet. Analytics will appear once your site is live.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Guest modal ──────────────────────────────────── */}
      {guestModalOpen && (
        <div
          className="gl-modal-bg"
          onClick={() => setGuestModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add guest"
        >
          <div className="gl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gl-modal-head">
              Add Guest
              <button
                className="gl-modal-close"
                onClick={() => setGuestModalOpen(false)}
                aria-label="Close dialog"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="gl-modal-body">
              <div className="sf-group">
                <label className="sf-lbl" htmlFor="g-first">First Name</label>
                <input
                  id="g-first"
                  type="text"
                  className="sf-input"
                  placeholder="Jane"
                  value={guestForm.firstName}
                  onChange={(e) => setGuestForm((f) => ({ ...f, firstName: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="sf-group">
                <label className="sf-lbl" htmlFor="g-last">Last Name</label>
                <input
                  id="g-last"
                  type="text"
                  className="sf-input"
                  placeholder="Smith"
                  value={guestForm.lastName}
                  onChange={(e) => setGuestForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <div className="sf-group">
                <label className="sf-lbl" htmlFor="g-party">Party / Group</label>
                <input
                  id="g-party"
                  type="text"
                  className="sf-input"
                  placeholder="Smith Family"
                  value={guestForm.party}
                  onChange={(e) => setGuestForm((f) => ({ ...f, party: e.target.value }))}
                />
              </div>
              <div className="sf-group">
                <label className="sf-lbl" htmlFor="g-notes">Notes</label>
                <input
                  id="g-notes"
                  type="text"
                  className="sf-input"
                  placeholder="Dietary restrictions, etc."
                  value={guestForm.notes}
                  onChange={(e) => setGuestForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="gl-modal-foot">
              <button className="btn-ghost" onClick={() => setGuestModalOpen(false)}>Cancel</button>
              <button
                className="btn-primary-sm"
                onClick={handleAddGuest}
                disabled={guestSubmitting || !guestForm.firstName.trim()}
              >
                {guestSubmitting ? "Adding…" : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Canva designs modal ─────────────────────────────── */}
      {canvaModalOpen && (
        <div
          className="overlay-bg"
          style={{ zIndex: 500 }}
          onClick={() => setCanvaModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Browse Canva designs"
        >
          <div className="overlay-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="overlay-box-header">
              <h2>Canva Designs</h2>
              <button className="overlay-close" onClick={() => setCanvaModalOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {canvaDesigns.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#9b8e85", textAlign: "center", padding: "2rem" }}>
                No designs found. Create a design in Canva and it will appear here.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", padding: "1rem", overflowY: "auto", flex: 1 }}>
                {canvaDesigns.map((d) => (
                  <div key={d.id} style={{ border: "1.5px solid #e8e2da", borderRadius: "8px", overflow: "hidden" }}>
                    {d.thumbnail_url && (
                      <img src={d.thumbnail_url} alt={d.title} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ padding: "0.5rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                      <button
                        className="btn-primary-sm"
                        style={{ width: "100%", marginTop: "0.4rem", fontSize: "0.72rem" }}
                        disabled={importingDesignId === d.id}
                        onClick={() => handleCanvaImport(d.id)}
                      >
                        {importingDesignId === d.id ? "Importing…" : "Import"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Photo picker modal ──────────────────────────────── */}
      {photoPickerOpen && (
        <div className="overlay-bg" style={{ zIndex: 500 }} onClick={() => setPhotoPickerOpen(false)} role="dialog" aria-modal="true" aria-label="Pick a photo">
          <div className="overlay-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="overlay-box-header">
              <h2>Photo Library</h2>
              <button className="overlay-close" onClick={() => setPhotoPickerOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {photosLoading ? (
              <p style={{ fontSize: "0.82rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>Loading…</p>
            ) : photos.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#9b8e85" }}>No photos yet. Upload photos in Media → Photos first.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", overflowY: "auto", flex: 1 }}>
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      if (photoPickerTarget) {
                        photoPickerTarget(`/api/sites/${site.id}/photos/${photo.id}`);
                      }
                      setPhotoPickerOpen(false);
                      setPhotoPickerTarget(null);
                    }}
                    style={{ border: "2px solid #e0dbd4", borderRadius: "8px", overflow: "hidden", padding: 0, cursor: "pointer", background: "none", aspectRatio: "1" }}
                    aria-label={`Select ${photo.filename}`}
                  >
                    <img
                      src={`/api/sites/${site.id}/photos/${photo.id}`}
                      alt={photo.filename}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Block modal ──────────────────────────────────── */}
      {addBlockOpen && (
        <div
          className="overlay-bg"
          onClick={() => setAddBlockOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add tile"
        >
          <div className="overlay-box" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-box-header">
              <h2>Add Tile</h2>
              <button className="overlay-close" onClick={() => setAddBlockOpen(false)} aria-label="Close dialog">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="block-type-grid">
              {BLOCK_TYPES.map(({ type, label, color }) => (
                <button
                  key={type}
                  className="block-type-tile"
                  onClick={() => handleAddBlock(type)}
                  aria-label={`Add ${label} tile`}
                >
                  <div className="block-type-stripe" style={{ background: color }} />
                  <div className="block-type-name">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Block Config Editor ─────────────────────────────── */}
      {blockEditOpen && editingBlock && (() => {
        const cfg = blockConfigFields;
        const t = editingBlock.type;
        const scheduleEvents = Array.isArray(cfg.events) ? (cfg.events as {name:string;date:string;time:string;location:string;description:string}[]) : [];
        const faqItems = Array.isArray(cfg.items) ? (cfg.items as {q:string;a:string}[]) : [];
        return (
          <div className="overlay-bg" onClick={() => setBlockEditOpen(false)} role="dialog" aria-modal="true" aria-label="Edit block">
            <div className="overlay-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", maxHeight: "85vh", overflowY: "auto" }}>
              <div className="overlay-box-header">
                <h2>Edit {blockLabel(t)}</h2>
                <button className="overlay-close" onClick={() => setBlockEditOpen(false)} aria-label="Close">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* home-hero */}
              {t === "home-hero" && (
                <p style={{ fontSize: "0.72rem", color: "#9b8e85", margin: "0.25rem 0 0.5rem", lineHeight: 1.5 }}>Couple names, date &amp; location are pulled from Site Settings.</p>
              )}

              {/* header */}
              {t === "header" && (<>
                <div className="sf-group"><label className="sf-lbl">Page Title</label><input className="sf-input" value={String(cfg.title ?? "")} onChange={e => setField("title", e.target.value)} placeholder="Our Story" /></div>
                <TextStyleRow prefix="title" cfg={cfg} setF={setField} />
              </>)}

              {/* text */}
              {t === "text" && (<>
                <div className="sf-group"><label className="sf-lbl">Heading</label><input className="sf-input" value={String(cfg.heading ?? "")} onChange={e => setField("heading", e.target.value)} placeholder="Section heading…" /></div>
                <TextStyleRow prefix="heading" cfg={cfg} setF={setField} />
                <div className="sf-group"><label className="sf-lbl">Body</label><textarea className="sf-input" rows={5} value={String(cfg.body ?? "")} onChange={e => setField("body", e.target.value)} placeholder="Your text here…" style={{ resize: "vertical" }} /></div>
                <TextStyleRow prefix="body" cfg={cfg} setF={setField} />
                <div className="sf-group"><label className="sf-lbl">Content Key <span style={{ fontWeight: 400, color: "#b0a99f" }}>(advanced)</span></label><input className="sf-input" value={String(cfg.contentKey ?? "")} onChange={e => setField("contentKey", e.target.value)} placeholder="story / home-welcome / accommodations / registry" /></div>
              </>)}

              {/* video */}
              {t === "video" && (<>
                <div className="sf-group">
                  <label className="sf-lbl">Video</label>
                  {videos.length === 0 ? (
                    <p style={{fontSize:'0.75rem',color:'#9b8e85',margin:0}}>No videos in Media yet. <button type="button" style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'inherit',padding:0,textDecoration:'underline'}} onClick={()=>{setBlockEditOpen(false);setSection("media");}}>Go to Media</button></p>
                  ) : (
                    <select className="sf-input" value={String(cfg.url??"")} onChange={e=>setField("url",e.target.value)}>
                      <option value="">— Select a video —</option>
                      {videos.map(v=><option key={v.id} value={v.url}>{v.title??v.url}</option>)}
                    </select>
                  )}
                </div>
                <div className="sf-group"><label className="sf-lbl">Height (CSS)</label><input className="sf-input" value={String(cfg.height ?? "100dvh")} onChange={e => setField("height", e.target.value)} placeholder="100dvh" /></div>
              </>)}

              {/* countdown */}
              {t === "countdown" && (<>
                <p style={{ fontSize: "0.72rem", color: "#9b8e85", margin: "0.25rem 0 0.5rem", lineHeight: 1.5 }}>Countdown date is set in Site Settings → Event Date.</p>
                <div className="sf-group">
                  <label className="style-toggle">
                    <input type="checkbox" checked={!!cfg.showRsvpButton} onChange={e => setField("showRsvpButton", e.target.checked)} />
                    Show RSVP button below countdown
                  </label>
                </div>
              </>)}

              {/* images */}
              {t === "images" && (<>
                <div className="sf-group">
                  <label className="sf-lbl">Photos</label>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(64px,1fr))',gap:'5px',marginBottom:'6px'}}>
                    {(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]).map((u,i)=>(
                      <div key={i} style={{position:'relative',aspectRatio:'1'}}>
                        <img src={u} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'5px',display:'block'}}/>
                        <button onClick={()=>setField('urls',(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]).filter((_,j)=>j!==i))} style={{position:'absolute',top:'2px',right:'2px',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',borderRadius:'3px',width:'16px',height:'16px',cursor:'pointer',fontSize:'0.6rem',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>✕</button>
                      </div>
                    ))}
                  </div>
                  <button className="btn-ghost" style={{width:'100%',fontSize:'0.74rem'}}
                    onClick={()=>{
                      if(photos.length===0) fetchPhotos();
                      setPhotoPickerTarget(()=>(url:string)=>setField('urls',[...(Array.isArray(cfg.urls)?(cfg.urls as string[]):[]),url]));
                      setPhotoPickerOpen(true);
                    }}>+ Add Photo from Media</button>
                </div>
                <div className="sf-group">
                  <label className="sf-lbl">Image Focus Area</label>
                  <div style={{fontSize:'0.68rem',color:'#9b8e85',marginBottom:'5px'}}>Where photos crop when space is limited</div>
                  <div style={{display:'flex',gap:'3px',marginBottom:'4px'}}>
                    {(['top','center','bottom'] as const).map(v=>(
                      <button key={v} onClick={()=>setField('imageFocusY',cfg.imageFocusY===v?null:v)}
                        style={{flex:1,padding:'3px 0',borderRadius:'4px',border:'1.5px solid',fontSize:'0.72rem',cursor:'pointer',textTransform:'capitalize',
                          borderColor:(cfg.imageFocusY??'center')===v?'var(--accent)':'#e0dbd4',
                          background:(cfg.imageFocusY??'center')===v?'var(--accent)':'#fff',
                          color:(cfg.imageFocusY??'center')===v?'#fff':'#6b5e56'}}>{v}</button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'3px'}}>
                    {(['left','center','right'] as const).map(h=>(
                      <button key={h} onClick={()=>setField('imageFocusX',cfg.imageFocusX===h?null:h)}
                        style={{flex:1,padding:'3px 0',borderRadius:'4px',border:'1.5px solid',fontSize:'0.72rem',cursor:'pointer',textTransform:'capitalize',
                          borderColor:(cfg.imageFocusX??'center')===h?'var(--accent)':'#e0dbd4',
                          background:(cfg.imageFocusX??'center')===h?'var(--accent)':'#fff',
                          color:(cfg.imageFocusX??'center')===h?'#fff':'#6b5e56'}}>{h}</button>
                    ))}
                  </div>
                </div>
                <div className="sf-group">
                  <label className="sf-lbl">Photo Height (px)</label>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="number" className="sf-input" style={{width:'80px'}} value={String(cfg.photoHeight??'')} onChange={e=>setField('photoHeight',e.target.value?Number(e.target.value):null)} placeholder="Auto" />
                    <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>Leave blank for auto</span>
                  </div>
                </div>
                <div className="sf-group">
                  <label className="sf-lbl">Horizontal Offset (px)</label>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="number" className="sf-input" style={{width:'80px'}} value={String(cfg.galleryOffsetX??0)} onChange={e=>setField('galleryOffsetX',Number(e.target.value))} />
                    <span style={{fontSize:'0.72rem',color:'#9b8e85'}}>+ right, − left</span>
                  </div>
                </div>
              </>)}

              {/* youtube */}
              {t === "youtube" && (<>
                <div className="sf-group">
                  <label className="sf-lbl">Video</label>
                  {videos.length === 0 ? (
                    <p style={{fontSize:'0.75rem',color:'#9b8e85',margin:0}}>No videos in Media yet. <button type="button" style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'inherit',padding:0,textDecoration:'underline'}} onClick={()=>{setBlockEditOpen(false);setSection("media");}}>Go to Media</button></p>
                  ) : (
                    <select className="sf-input" value={String(cfg.url??"")}
                      onChange={e=>{const url=e.target.value;const vid=extractYoutubeId(url);setField("url",url);if(vid)setField("videoId",vid);}}>
                      <option value="">— Select a video —</option>
                      {videos.map(v=><option key={v.id} value={v.url}>{v.title??v.url}</option>)}
                    </select>
                  )}
                </div>
                <div className="sf-group"><label className="sf-lbl">Title</label><input className="sf-input" value={String(cfg.title ?? "")} onChange={e => setField("title", e.target.value)} placeholder="Our highlight reel" /></div>
              </>)}

              {/* spacer */}
              {t === "spacer" && (
                <div className="sf-group"><label className="sf-lbl">Height (CSS value)</label><input className="sf-input" value={String(cfg.height ?? "4rem")} onChange={e => setField("height", e.target.value)} placeholder="4rem" /></div>
              )}

              {/* registry-card */}
              {t === "registry-card" && (<>
                <div className="sf-group"><label className="sf-lbl">Registry Name</label><input className="sf-input" value={String(cfg.item_name ?? "")} onChange={e => setField("item_name", e.target.value)} placeholder="Honeymoon Fund" /></div>
                <div className="sf-group"><label className="sf-lbl">Description</label><textarea className="sf-input" rows={3} value={String(cfg.item_description ?? "")} onChange={e => setField("item_description", e.target.value)} style={{ resize: "vertical" }} /></div>
                <div className="sf-group"><label className="sf-lbl">Link URL</label><input className="sf-input" type="url" value={String(cfg.link_url ?? "")} onChange={e => setField("link_url", e.target.value)} placeholder="https://paypal.me/…" /></div>
                <div className="sf-group"><label className="sf-lbl">Button Text</label><input className="sf-input" value={String(cfg.cta ?? "")} onChange={e => setField("cta", e.target.value)} placeholder="Contribute" /></div>
              </>)}

              {/* hotel-card */}
              {t === "hotel-card" && (<>
                <div className="sf-group"><label className="sf-lbl">Hotel / Venue Name</label><input className="sf-input" value={String(cfg.name ?? "")} onChange={e => setField("name", e.target.value)} placeholder="Grand Resort & Spa" /></div>
                <div className="sf-group"><label className="sf-lbl">Description</label><textarea className="sf-input" rows={3} value={String(cfg.description ?? "")} onChange={e => setField("description", e.target.value)} style={{ resize: "vertical" }} /></div>
                <div className="sf-group"><label className="sf-lbl">Room Block Note</label><input className="sf-input" value={String(cfg.room_note ?? "")} onChange={e => setField("room_note", e.target.value)} placeholder="Use code WEDDING for 15% off" /></div>
                <div className="sf-group"><label className="sf-lbl">Google Maps URL</label><input className="sf-input" type="url" value={String(cfg.map_url ?? "")} onChange={e => setField("map_url", e.target.value)} /></div>
              </>)}

              {/* venue-map */}
              {t === "venue-map" && (<>
                <div className="sf-group"><label className="sf-lbl">Search Query</label><input className="sf-input" value={String(cfg.query ?? "")} onChange={e => setField("query", e.target.value)} placeholder="Grand Ballroom New York" /></div>
                <div className="sf-group"><label className="sf-lbl">Map Height (px)</label><input className="sf-input" type="number" value={String(cfg.height ?? "360")} onChange={e => setField("height", Number(e.target.value))} placeholder="360" /></div>
              </>)}

              {/* schedule */}
              {t === "schedule" && (<>
                {scheduleEvents.map((evt, i) => (
                  <div key={i} style={{ border: "1px solid #e0dbd4", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Event {i + 1}</span>
                      <button onClick={() => setField("events", scheduleEvents.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>✕</button>
                    </div>
                    {(["name", "date", "time", "location", "description"] as const).map((f) => (
                      <div key={f} className="sf-group" style={{ marginBottom: "0.35rem" }}>
                        <label className="sf-lbl" style={{ textTransform: "capitalize", fontSize: "0.68rem" }}>{f}</label>
                        <input className="sf-input" style={{ padding: "5px 8px", fontSize: "0.78rem" }} value={String((evt as Record<string,unknown>)[f] ?? "")} onChange={(e) => { const next = [...scheduleEvents]; (next[i] as Record<string,unknown>)[f] = e.target.value; setField("events", next); }} />
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={() => setField("events", [...scheduleEvents, { name: "", date: "", time: "", location: "", description: "" }])} className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Event</button>
              </>)}

              {/* faq */}
              {t === "faq" && (<>
                <div className="sf-group"><label className="sf-lbl">Intro Text <span style={{ fontWeight: 400, color: "#b0a99f" }}>(optional)</span></label><input className="sf-input" value={String(cfg.intro ?? "")} onChange={e => setField("intro", e.target.value)} placeholder="Answers to common questions…" /></div>
                {faqItems.map((item, i) => (
                  <div key={i} style={{ border: "1px solid #e0dbd4", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Q&A {i + 1}</span>
                      <button onClick={() => setField("items", faqItems.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>✕</button>
                    </div>
                    <div className="sf-group" style={{ marginBottom: "0.35rem" }}>
                      <label className="sf-lbl" style={{ fontSize: "0.68rem" }}>Question</label>
                      <input className="sf-input" style={{ padding: "5px 8px", fontSize: "0.78rem" }} value={item.q ?? ""} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], q: e.target.value }; setField("items", next); }} />
                    </div>
                    <div className="sf-group">
                      <label className="sf-lbl" style={{ fontSize: "0.68rem" }}>Answer</label>
                      <textarea className="sf-input" rows={2} style={{ padding: "5px 8px", fontSize: "0.78rem", resize: "vertical" }} value={item.a ?? ""} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], a: e.target.value }; setField("items", next); }} />
                    </div>
                  </div>
                ))}
                <button onClick={() => setField("items", [...faqItems, { q: "", a: "" }])} className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Q&A</button>
              </>)}

              {/* photo-split */}
              {t === "photo-split" && (() => {
                const photo = (cfg.photo as Record<string,unknown>|undefined) ?? {};
                const comps = Array.isArray(cfg.components) ? (cfg.components as Record<string,unknown>[]) : [];
                const photoSide = String(cfg.photoSide ?? "left");
                const setPhoto = (k: string, v: unknown) => setField("photo", { ...photo, [k]: v });
                const [focalX, focalY] = (() => {
                  const raw = String(photo.crop ?? "center");
                  if (raw === "top") return [50, 0];
                  if (raw === "bottom") return [50, 100];
                  const pts = raw.replace(/%/g,"").trim().split(/\s+/);
                  return [parseFloat(pts[0])||50, parseFloat(pts[1]??pts[0])||50];
                })();
                const arFree = !photo.widthPx && !photo.heightPx;
                return (<>
                  <div className="sf-group">
                    <label className="sf-lbl">Photo</label>
                    {photo.url && <img src={String(photo.url)} alt="" style={{width:"100%",height:"64px",objectFit:"cover",borderRadius:"5px",border:"1px solid #e0dbd4",display:"block",marginBottom:"4px"}}/>}
                    <button className="btn-ghost" style={{width:"100%",fontSize:"0.74rem"}}
                      onClick={()=>{
                        if(photos.length===0) fetchPhotos();
                        setPhotoPickerTarget(()=>(url:string)=>setPhoto("url",url));
                        setPhotoPickerOpen(true);
                      }}>{photo.url ? "Change Photo (Media Library)" : "Pick from Media Library"}</button>
                  </div>
                  <div className="sf-group">
                    <label className="sf-lbl" style={{marginBottom:"4px"}}>Photo Position <span style={{fontWeight:400,color:"#b0a99f",fontSize:"0.68rem"}}>drag to reposition</span></label>
                    <div style={{position:"relative",width:"100%",paddingTop:"56%",background:"#f0ede8",borderRadius:"6px",overflow:"hidden",cursor:"crosshair",border:"1px solid #e0dbd4",userSelect:"none",touchAction:"none"}}
                      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-r.left)/r.width*100);const y=Math.round((e.clientY-r.top)/r.height*100);setPhoto("crop",`${x}% ${y}%`);}}
                      onPointerMove={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();const x=Math.round((e.clientX-r.left)/r.width*100);const y=Math.round((e.clientY-r.top)/r.height*100);setPhoto("crop",`${x}% ${y}%`);}}>
                      {photo.url
                        ? <img src={String(photo.url)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",pointerEvents:"none"}} alt="" />
                        : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#b0a99f",fontSize:"0.78rem"}}>Pick a photo first</div>}
                      <div style={{position:"absolute",width:"16px",height:"16px",borderRadius:"50%",background:"white",border:"2.5px solid #E75850",boxShadow:"0 1px 5px rgba(0,0,0,0.35)",transform:"translate(-50%,-50%)",pointerEvents:"none",left:`${focalX}%`,top:`${focalY}%`,display:photo.url?"block":"none"}} />
                    </div>
                  </div>
                  <div className="sf-group">
                    <label className="sf-lbl">Photo Size (px)</label>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"0.72rem",color:"#9b8e85"}}>W</span>
                      <input type="number" className="sf-input" style={{width:"60px",textAlign:"center"}} value={arFree?"":String(photo.widthPx??"")} disabled={arFree} onChange={e=>setPhoto("widthPx",e.target.value||"")} />
                      <span style={{fontSize:"0.72rem",color:"#9b8e85"}}>H</span>
                      <input type="number" className="sf-input" style={{width:"60px",textAlign:"center"}} value={arFree?"":String(photo.heightPx??"")} disabled={arFree} onChange={e=>setPhoto("heightPx",e.target.value||"")} />
                      <span style={{fontSize:"0.68rem",color:"#b0a99f"}}>px</span>
                      <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"0.75rem",color:"#6b5e56",cursor:"pointer"}}>
                        <input type="checkbox" checked={arFree} onChange={e=>{if(e.target.checked){setField("photo",{...photo,widthPx:"",heightPx:""});}else{setField("photo",{...photo,widthPx:"250",heightPx:"400"});}}} />
                        Free
                      </label>
                    </div>
                  </div>
                  <div className="sf-group">
                    <label className="sf-lbl">Photo X Offset (px)</label>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <input type="number" className="sf-input" style={{width:"80px"}} value={String(photo.offsetX??0)} onChange={e=>setPhoto("offsetX",Number(e.target.value))} />
                      <span style={{fontSize:"0.72rem",color:"#9b8e85"}}>+ right, − left</span>
                    </div>
                  </div>
                  <div className="sf-group">
                    <span className="sf-lbl">Photo Side</span>
                    <div style={{display:"flex",gap:"4px"}}>
                      {(["left","right"] as const).map(s=>(
                        <button key={s} onClick={()=>setField("photoSide",s)} style={{padding:"4px 16px",borderRadius:"20px",border:"1.5px solid",borderColor:photoSide===s?"var(--accent)":"#e0dbd4",background:photoSide===s?"var(--accent)":"#fff",color:photoSide===s?"#fff":"#6b5e56",fontSize:"0.75rem",cursor:"pointer",textTransform:"capitalize"}}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{margin:"12px 0 8px",fontSize:"0.7rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#9b8e85"}}>Other Side</div>
                  {comps.map((c,ci)=>(
                    <div key={ci} style={{border:"1px solid #e0dbd4",borderRadius:"8px",padding:"0.75rem",marginBottom:"0.6rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
                        <span style={{fontSize:"0.72rem",fontWeight:600,color:"#9b8e85",textTransform:"capitalize"}}>{String(c.type??"Component")}</span>
                        <button onClick={()=>setField("components",comps.filter((_,j)=>j!==ci))} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:"0.8rem"}}>×</button>
                      </div>
                      {c.type==="text"&&(()=>{const setC=(k:string,v:unknown)=>{const n=[...comps];n[ci]={...n[ci],[k]:v};setField("components",n);};return(<>
                        <div className="sf-group" style={{marginBottom:"0.35rem"}}><label className="sf-lbl" style={{fontSize:"0.68rem"}}>Heading (optional)</label><input className="sf-input" value={String(c.heading??"")} onChange={e=>setC("heading",e.target.value)}/></div>
                        <TextStyleRow prefix="heading" cfg={c} setF={setC} />
                        <div className="sf-group"><label className="sf-lbl" style={{fontSize:"0.68rem"}}>Body</label><textarea className="sf-input" rows={4} style={{resize:"vertical"}} value={String(c.body??"")} onChange={e=>setC("body",e.target.value)}/></div>
                        <TextStyleRow prefix="body" cfg={c} setF={setC} />
                      </>);})()}
                    </div>
                  ))}
                  <div style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"0.5rem"}}>
                    <select className="sf-input" id="ps-add-type-modal" style={{flex:1,fontSize:"0.78rem"}}>
                      <option value="text">Text</option>
                    </select>
                    <button className="btn-ghost" style={{whiteSpace:"nowrap",fontSize:"0.78rem"}} onClick={()=>{const sel=document.getElementById("ps-add-type-modal") as unknown as HTMLSelectElement|null;const type=sel?.value||"text";setField("components",[...comps,{type,heading:"",body:""}]);}}>+ Add</button>
                  </div>
                </>);
              })()}

              {/* fallback: raw JSON for unknown types */}
              {!["home-hero","header","text","video","countdown","images","youtube","spacer","registry-card","hotel-card","venue-map","schedule","faq","photo-split"].includes(t) && (
                <textarea
                  style={{ width: "100%", minHeight: "200px", fontFamily: "monospace", fontSize: "0.78rem", border: "1px solid #e0dbd4", borderRadius: "8px", padding: "0.75rem", background: "#fafaf9", color: "#1c1917", resize: "vertical", boxSizing: "border-box" }}
                  value={JSON.stringify(cfg, null, 2)}
                  onChange={(e) => { try { setBlockConfigFields(JSON.parse(e.target.value) as Record<string,unknown>); } catch { /* keep editing */ } }}
                  spellCheck={false}
                />
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button className="btn-ghost" onClick={() => setBlockEditOpen(false)}>Cancel</button>
                <button className="btn-primary-sm" onClick={handleSaveBlockConfig}>Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Settings drawer ──────────────────────────────────── */}
      {settingsOpen && (
        <>
          <div
            onClick={() => setSettingsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(28,25,23,0.35)",
              zIndex: 300,
            }}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Site settings"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(600px, 95vw)",
              background: "#fff",
              borderLeft: "1px solid #eae5df",
              zIndex: 400,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1.5px solid #eae5df", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1c1917" }}>Site Settings</span>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="overlay-close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #eae5df", flexShrink: 0, overflowX: "auto" }}>
              {(["info", "style", "nav", "music", "language", "popup", "access"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSettingsDrawerTab(tab)}
                  style={{
                    padding: "0.6rem 0.9rem",
                    fontSize: "0.73rem",
                    fontWeight: settingsDrawerTab === tab ? 600 : 400,
                    color: settingsDrawerTab === tab ? "var(--accent)" : "#9b8e85",
                    background: "none",
                    border: "none",
                    borderBottom: settingsDrawerTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "info" ? "Event Info" : tab === "nav" ? "Navigation" : tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              {settingsLoading ? (
                <p style={{ color: "#b0a99f", fontSize: "0.82rem" }}>Loading settings…</p>
              ) : (
                <>
                  {settingsDrawerTab === "info" && (
                    <>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-event-name">Event Name</label>
                        <input id="s-event-name" type="text" className="sf-input" placeholder="Jane & John's Wedding" value={settingsForm.eventName} onChange={(e) => setSettingsForm((f) => ({ ...f, eventName: e.target.value }))} />
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-event-date">Event Date &amp; Time</label>
                        <input id="s-event-date" type="datetime-local" className="sf-input" value={settingsForm.eventDate} onChange={(e) => setSettingsForm((f) => ({ ...f, eventDate: e.target.value }))} />
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-event-location">Event Location</label>
                        <input id="s-event-location" type="text" className="sf-input" placeholder="Grand Ballroom, New York" value={settingsForm.eventLocation} onChange={(e) => setSettingsForm((f) => ({ ...f, eventLocation: e.target.value }))} />
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "style" && (
                    <>
                      {/* Typography */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.6rem" }}>Typography</div>
                      <div className="sf-group">
                        <label className="sf-lbl">Heading Font</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <select className="sf-input" style={{ flex: 1 }} value={settingsForm.headingFont} onChange={(e) => setSettingsForm((f) => ({ ...f, headingFont: e.target.value }))}>
                            {HEADING_FONTS.map((fn) => <option key={fn}>{fn}</option>)}
                          </select>
                          <ColorSwatch value={settingsForm.headingColor} onChange={v => { setSettingsForm((f) => ({ ...f, headingColor: v })); fireSettingsPreview({ headingColor: v }); }} />
                        </div>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl">Body Font</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <select className="sf-input" style={{ flex: 1 }} value={settingsForm.bodyFont} onChange={(e) => setSettingsForm((f) => ({ ...f, bodyFont: e.target.value }))}>
                            {BODY_FONTS.map((fn) => <option key={fn}>{fn}</option>)}
                          </select>
                          <ColorSwatch value={settingsForm.bodyColor} onChange={v => { setSettingsForm((f) => ({ ...f, bodyColor: v })); fireSettingsPreview({ bodyColor: v }); }} />
                        </div>
                      </div>
                      <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #f0ede8" }}>
                        <div style={{ fontSize: "0.7rem", color: "#c4956a", fontWeight: 500, marginBottom: "0.4rem" }}>Vietnamese overrides</div>
                        <div className="sf-group" style={{ marginBottom: "0.4rem" }}>
                          <label className="sf-lbl" style={{ fontSize: "0.7rem" }}>Heading (VI)</label>
                          <select className="sf-input" style={{ padding: "5px 8px", fontSize: "0.78rem" }} value={settingsForm.headingFontVi} onChange={(e) => setSettingsForm((f) => ({ ...f, headingFontVi: e.target.value }))}>
                            <option value="">Same as English</option>
                            {HEADING_FONTS.map((fn) => <option key={fn}>{fn}</option>)}
                          </select>
                        </div>
                        <div className="sf-group">
                          <label className="sf-lbl" style={{ fontSize: "0.7rem" }}>Body (VI)</label>
                          <select className="sf-input" style={{ padding: "5px 8px", fontSize: "0.78rem" }} value={settingsForm.bodyFontVi} onChange={(e) => setSettingsForm((f) => ({ ...f, bodyFontVi: e.target.value }))}>
                            <option value="">Same as English</option>
                            {BODY_FONTS.map((fn) => <option key={fn}>{fn}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Button */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.6rem" }}>Button</div>
                      <div className="sf-group">
                        <label className="sf-lbl">Accent Color</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <ColorSwatch value={settingsForm.accentColor} onChange={v => { setSettingsForm((f) => ({ ...f, accentColor: v })); fireSettingsPreview({ accentColor: v }); }} />
                          <div style={{ flex: 1, padding: "6px 14px", borderRadius: "4px", fontSize: "0.78rem", textAlign: "center", background: settingsForm.buttonStyle === "filled" ? settingsForm.accentColor : "transparent", color: settingsForm.buttonStyle === "filled" ? "#fff" : settingsForm.accentColor, border: `${settingsForm.buttonBorderWidth || "1.5px"} solid ${settingsForm.accentColor}` }}>Preview</div>
                        </div>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl">Style</label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["filled", "outline"] as const).map((s) => (
                            <button key={s} onClick={() => setSettingsForm((f) => ({ ...f, buttonStyle: s }))} style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.buttonStyle === s ? "var(--accent)" : "#e0dbd4", background: settingsForm.buttonStyle === s ? "var(--accent-light)" : "#fff", color: settingsForm.buttonStyle === s ? "var(--accent)" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.buttonStyle === s ? 600 : 400 }}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl">Border Width</label>
                        <select className="sf-input" value={settingsForm.buttonBorderWidth} onChange={(e) => setSettingsForm((f) => ({ ...f, buttonBorderWidth: e.target.value }))}>
                          <option value="none">None</option>
                          <option value="1px">Thin 1px</option>
                          <option value="1.5px">Default 1.5px</option>
                          <option value="2px">Bold 2px</option>
                        </select>
                      </div>

                      {/* Site Colors */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.4rem" }}>Site Colors</div>
                      {[
                        { label: "Background", key: "bgColor" as const, def: "#ffffff" },
                        { label: "Text", key: "siteTextColor" as const, def: "#1c1917" },
                        { label: "Borders / Dividers", key: "siteBorderColor" as const, def: "#e8e2da" },
                      ].map(({ label, key, def }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #f5f2ee" }}>
                          <ColorSwatch value={settingsForm[key] || def} onChange={v => { setSettingsForm((f) => ({ ...f, [key]: v })); fireSettingsPreview({ [key]: v }); }} />
                          <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>{label}</span>
                          <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm[key] || def).toUpperCase()}</code>
                        </div>
                      ))}

                      {/* Entrance Animation */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.6rem" }}>Entrance Animation</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {([
                          {
                            value: "",
                            label: "None",
                            diagram: (
                              <svg viewBox="0 0 48 32" width="48" height="32" style={{ display: "block" }}>
                                <rect x="0" y="0" width="48" height="32" rx="3" fill="#f0ece8" />
                                <line x1="8" y1="10" x2="40" y2="10" stroke="#c8c0b8" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="16" x2="36" y2="16" stroke="#c8c0b8" strokeWidth="2" strokeLinecap="round" />
                                <line x1="16" y1="22" x2="32" y2="22" stroke="#c8c0b8" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            ),
                          },
                          {
                            value: "envelope",
                            label: "Envelope",
                            diagram: (
                              <svg viewBox="0 0 48 32" width="48" height="32" style={{ display: "block" }}>
                                <rect x="0" y="0" width="48" height="32" rx="3" fill="#faf6f0" />
                                <rect x="0" y="0" width="48" height="14" rx="3" fill="#e8e0d4" />
                                <rect x="0" y="18" width="48" height="14" rx="3" fill="#e8e0d4" style={{ transform: "translateY(0)" }} />
                                <circle cx="24" cy="16" r="4" fill="var(--accent)" />
                              </svg>
                            ),
                          },
                          {
                            value: "storybook",
                            label: "Storybook",
                            diagram: (
                              <svg viewBox="0 0 48 32" width="48" height="32" style={{ display: "block" }}>
                                <rect x="0" y="0" width="48" height="32" rx="3" fill="#fdf8f4" />
                                <rect x="0" y="0" width="22" height="32" rx="3" fill="#ede6d9" />
                                <rect x="26" y="0" width="22" height="32" rx="3" fill="#ede6d9" />
                                <line x1="24" y1="0" x2="24" y2="32" stroke="#c8bfb2" strokeWidth="1" />
                                <text x="24" y="20" textAnchor="middle" fontSize="10" fill="#9b8e85">✦</text>
                              </svg>
                            ),
                          },
                          {
                            value: "doors",
                            label: "Doors",
                            diagram: (
                              <svg viewBox="0 0 48 32" width="48" height="32" style={{ display: "block" }}>
                                <rect x="0" y="0" width="22" height="32" rx="3" fill="var(--accent)" opacity="0.85" />
                                <rect x="26" y="0" width="22" height="32" rx="3" fill="var(--accent)" opacity="0.85" />
                                <line x1="24" y1="0" x2="24" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                <text x="24" y="20" textAnchor="middle" fontSize="8" fill="white" opacity="0.9">✦</text>
                              </svg>
                            ),
                          },
                        ] as { value: string; label: string; diagram: React.ReactNode }[]).map(({ value, label, diagram }) => {
                          const isSelected = (settingsForm.animation ?? "") === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSettingsForm((f) => ({ ...f, animation: value }))}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                                padding: "10px 6px 8px",
                                border: `2px solid ${isSelected ? "var(--accent)" : "#e0dbd4"}`,
                                borderRadius: "8px",
                                background: isSelected ? "var(--accent-light)" : "#fff",
                                cursor: "pointer",
                                transition: "border-color 0.15s, background 0.15s",
                              }}
                              aria-pressed={isSelected}
                              aria-label={label}
                            >
                              {diagram}
                              <span style={{ fontSize: "0.7rem", fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--accent)" : "#6b5e56" }}>{label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Envelope color — shown only when envelope animation is selected */}
                      {settingsForm.animation === "envelope" && (
                        <>
                          <div style={{ margin: "0.75rem 0 0.5rem", padding: "0.6rem 0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "0.73rem", color: "#166534", lineHeight: 1.5 }}>
                            <strong>Invitation card uses your Popup settings.</strong> Go to the <strong>Popup</strong> tab to set the card title and welcome message. If left blank, your event name and date appear instead.
                          </div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.5rem" }}>Envelope Colors</div>
                          {[
                            { label: "Envelope paper", key: "envelopeColor" as const, def: "#f5ede0" },
                            { label: "Wax seal", key: "accentColor" as const, def: "#B8921A" },
                          ].map(({ label, key, def }) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #f5f2ee" }}>
                              <ColorSwatch value={settingsForm[key] || def} onChange={v => setSettingsForm((f) => ({ ...f, [key]: v }))} />
                              <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>{label}</span>
                              <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm[key] || def).toUpperCase()}</code>
                            </div>
                          ))}
                          <div style={{ marginTop: "0.9rem" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.5rem" }}>Invitation Card</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #f5f2ee" }}>
                              <ColorSwatch value={settingsForm.cardColor || "#fffef9"} onChange={v => setSettingsForm((f) => ({ ...f, cardColor: v }))} />
                              <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>Card background</span>
                              <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm.cardColor || "#fffef9").toUpperCase()}</code>
                            </div>
                            {/* Card image upload */}
                            <div className="sf-group" style={{ marginTop: "0.75rem" }}>
                              <label className="sf-lbl">Card Photo</label>
                              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                <button
                                  type="button"
                                  onClick={() => { if (photos.length === 0) fetchPhotos(); setPhotoPickerTarget(() => (url: string) => setSettingsForm((f) => ({ ...f, cardImage: url }))); setPhotoPickerOpen(true); }}
                                  style={{ flexShrink: 0, width: "72px", height: "72px", border: settingsForm.cardImage ? "2px solid var(--accent)" : "1.5px dashed #c4bdb6", borderRadius: "8px", overflow: "hidden", cursor: "pointer", background: "#f7f5f0", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, position: "relative" }}
                                  aria-label="Pick card photo"
                                >
                                  {settingsForm.cardImage
                                    ? <img src={settingsForm.cardImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0a99f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                  }
                                </button>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center" }}>
                                  <span style={{ fontSize: "0.76rem", color: "#6b5e56" }}>{settingsForm.cardImage ? "Photo selected" : "No photo"}</span>
                                  <button type="button" className="btn-ghost" style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                                    onClick={() => { if (photos.length === 0) fetchPhotos(); setPhotoPickerTarget(() => (url: string) => setSettingsForm((f) => ({ ...f, cardImage: url }))); setPhotoPickerOpen(true); }}>
                                    {settingsForm.cardImage ? "Replace" : "Choose photo"}
                                  </button>
                                  {settingsForm.cardImage && (
                                    <button type="button" className="btn-ghost" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "#c42a22", borderColor: "#fde8e7" }}
                                      onClick={() => setSettingsForm((f) => ({ ...f, cardImage: "" }))}>Remove</button>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#b0a99f", marginTop: "4px" }}>Upload photos in Media first. Color fill used if no photo.</div>
                            </div>
                            <div className="sf-group" style={{ marginTop: "0.75rem" }}>
                              <label className="sf-lbl">Wax Seal Initials</label>
                              <input
                                className="sf-input"
                                type="text"
                                maxLength={6}
                                placeholder="D · N  (auto from names if blank)"
                                value={settingsForm.sealInitials}
                                onChange={(e) => setSettingsForm((f) => ({ ...f, sealInitials: e.target.value }))}
                              />
                              <div style={{ fontSize: "0.68rem", color: "#b0a99f", marginTop: "3px" }}>Leave blank to auto-extract from event name</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Background Image */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.6rem" }}>Background Image</div>
                      <div className="sf-group">
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            onClick={() => { if (photos.length === 0) fetchPhotos(); setPhotoPickerTarget(() => (url: string) => setSettingsForm((f) => ({ ...f, bgImage: url }))); setPhotoPickerOpen(true); }}
                            style={{ flexShrink: 0, width: "80px", height: "56px", border: settingsForm.bgImage ? "2px solid var(--accent)" : "1.5px dashed #c4bdb6", borderRadius: "8px", overflow: "hidden", cursor: "pointer", background: "#f7f5f0", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                            aria-label="Pick background image"
                          >
                            {settingsForm.bgImage
                              ? <img src={settingsForm.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0a99f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            }
                          </button>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", justifyContent: "center" }}>
                            <span style={{ fontSize: "0.76rem", color: "#6b5e56" }}>{settingsForm.bgImage ? "Image selected" : "No image"}</span>
                            <button type="button" className="btn-ghost" style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                              onClick={() => { if (photos.length === 0) fetchPhotos(); setPhotoPickerTarget(() => (url: string) => setSettingsForm((f) => ({ ...f, bgImage: url }))); setPhotoPickerOpen(true); }}>
                              {settingsForm.bgImage ? "Replace" : "Choose image"}
                            </button>
                            {settingsForm.bgImage && (
                              <button type="button" className="btn-ghost" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "#c42a22", borderColor: "#fde8e7" }}
                                onClick={() => setSettingsForm((f) => ({ ...f, bgImage: "" }))}>Remove</button>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#b0a99f", marginTop: "4px" }}>Upload images in Media first, then pick here.</div>
                        {settingsForm.bgImage && (
                          <div style={{ marginTop: "10px", borderTop: "1px solid #f5f2ee", paddingTop: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.78rem", color: "#6b5e56", fontWeight: 500 }}>Layer</span>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {(["behind", "overlay"] as const).map((opt) => (
                                  <button key={opt} type="button"
                                    onClick={() => { setSettingsForm((f) => ({ ...f, bgImageLayer: opt })); fireSettingsPreview({ bgImageLayer: opt }); }}
                                    style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.bgImageLayer === opt ? "var(--accent)" : "#e0dbd4", background: settingsForm.bgImageLayer === opt ? "var(--accent-light)" : "#fff", color: settingsForm.bgImageLayer === opt ? "var(--accent)" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.bgImageLayer === opt ? 600 : 400 }}>
                                    {opt === "behind" ? "Behind content" : "Over content"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {settingsForm.bgImageLayer === "overlay" && (
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                                <span style={{ fontSize: "0.75rem", color: "#6b5e56", flexShrink: 0 }}>Opacity</span>
                                <input type="range" min={0.1} max={1} step={0.05} value={settingsForm.bgImageOpacity}
                                  onChange={(e) => { const v = parseFloat(e.target.value); setSettingsForm((f) => ({ ...f, bgImageOpacity: v })); fireSettingsPreview({ bgImageOpacity: v }); }}
                                  style={{ flex: 1, accentColor: "var(--accent)" }} />
                                <span style={{ fontSize: "0.75rem", color: "#9b8e85", minWidth: "32px", textAlign: "right" }}>{Math.round(settingsForm.bgImageOpacity * 100)}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "nav" && (
                    <>
                      {/* Position */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.5rem" }}>Position</div>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "1rem" }}>
                        {(["fixed", "scroll-away"] as const).map((opt) => (
                          <button key={opt} onClick={() => setSettingsForm((f) => ({ ...f, navPosition: opt }))}
                            style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.navPosition === opt ? "var(--accent)" : "#e0dbd4", background: settingsForm.navPosition === opt ? "var(--accent-light)" : "#fff", color: settingsForm.navPosition === opt ? "var(--accent)" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.navPosition === opt ? 600 : 400 }}>
                            {opt === "fixed" ? "Fixed" : "Scroll Away"}
                          </button>
                        ))}
                      </div>

                      {/* Shape — only for scroll-away */}
                      {settingsForm.navPosition === "scroll-away" && (
                        <>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.5rem" }}>Shape</div>
                          <div style={{ display: "flex", gap: "6px", marginBottom: "0.75rem" }}>
                            {([
                              { value: "bar", label: "Bar" },
                              { value: "pill", label: "Pill" },
                              { value: "floating", label: "Floating" },
                            ] as const).map(({ value, label }) => (
                              <button key={value} onClick={() => setSettingsForm((f) => ({ ...f, navShape: value }))}
                                style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.navShape === value ? "var(--accent)" : "#e0dbd4", background: settingsForm.navShape === value ? "var(--accent-light)" : "#fff", color: settingsForm.navShape === value ? "var(--accent)" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.navShape === value ? 600 : 400 }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Size (nav height via link padding) */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.4rem", marginTop: "0.75rem" }}>Size</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
                        <input
                          type="number" min="4" max="48" step="1"
                          className="sf-input"
                          style={{ width: "72px", textAlign: "center" }}
                          value={parseInt(settingsForm.navLinkPadding) || 14}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, navLinkPadding: e.target.value + "px" }))}
                        />
                        <span style={{ fontSize: "0.78rem", color: "#9b8e85" }}>px — controls how tall or short the nav bar is</span>
                      </div>

                      {/* Background */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.5rem" }}>Background</div>
                      <div style={{ display: "flex", gap: "6px", marginBottom: settingsForm.navBg !== "white" && settingsForm.navBg !== "glass" ? "0.5rem" : "1rem" }}>
                        {(["white", "glass", "custom"] as const).map((opt) => {
                          const isActive = opt === "custom"
                            ? (settingsForm.navBg !== "white" && settingsForm.navBg !== "glass")
                            : settingsForm.navBg === opt;
                          return (
                            <button key={opt} onClick={() => {
                                const newVal = opt === "custom" ? "#f7f5f0" : opt;
                                setSettingsForm((f) => ({ ...f, navBg: newVal }));
                                const resolved = newVal === "white" ? "rgba(255,255,255,0.96)" : newVal === "glass" ? "rgba(255,255,255,0.65)" : newVal;
                                fireSettingsPreview({ navBg: resolved });
                              }}
                              style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: isActive ? "var(--accent)" : "#e0dbd4", background: isActive ? "var(--accent-light)" : "#fff", color: isActive ? "var(--accent)" : "#6b5e56", cursor: "pointer", fontWeight: isActive ? 600 : 400, textTransform: "capitalize" }}>
                              {opt === "glass" ? "Glass" : opt === "custom" ? "Custom" : "White"}
                            </button>
                          );
                        })}
                      </div>
                      {settingsForm.navBg !== "white" && settingsForm.navBg !== "glass" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", marginBottom: "1rem", borderBottom: "1px solid #f5f2ee" }}>
                          <ColorSwatch value={settingsForm.navBg || "#f7f5f0"} onChange={v => { setSettingsForm((f) => ({ ...f, navBg: v })); fireSettingsPreview({ navBg: v }); }} />
                          <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>Custom color</span>
                          <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm.navBg || "#f7f5f0").toUpperCase()}</code>
                        </div>
                      )}

                      {/* Nav Colors */}
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.4rem" }}>Nav Colors</div>
                      {[
                        { label: "Couple name", key: "navBrandColor" as const, def: "#1c1917" },
                        { label: "Nav links", key: "navLinkColor" as const, def: "#6b6560" },
                        { label: "Highlight / Active", key: "navHighlightColor" as const, def: "#B8921A" },
                      ].map(({ label, key, def }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #f5f2ee" }}>
                          <ColorSwatch value={settingsForm[key] || def} onChange={v => { setSettingsForm((f) => ({ ...f, [key]: v })); fireSettingsPreview({ [key]: v }); }} />
                          <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>{label}</span>
                          <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm[key] || def).toUpperCase()}</code>
                        </div>
                      ))}

                      {/* Underline toggle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderTop: "1px solid #f5f2ee", marginTop: "0.5rem" }}>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917" }}>Active page underline</div>
                          <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginTop: "2px" }}>Shows underline directly below the link text</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsForm((f) => ({ ...f, navUnderline: f.navUnderline === "off" ? "on" : "off" }))}
                          style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: settingsForm.navUnderline !== "off" ? "var(--accent)" : "#e0dbd4", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                          aria-pressed={settingsForm.navUnderline !== "off"}
                          aria-label="Toggle active page underline"
                        >
                          <span style={{ position: "absolute", top: "3px", left: settingsForm.navUnderline !== "off" ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                        </button>
                      </div>

                      {/* Content margins */}
                      <div style={{ borderTop: "1px solid #f5f2ee", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917", marginBottom: "4px" }}>Content Margins</div>
                        <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginBottom: "0.75rem" }}>Extra spacing around site content (px). Does not affect the nav bar.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                          {([["Top", "marginTop"], ["Right", "marginRight"], ["Bottom", "marginBottom"], ["Left", "marginLeft"]] as const).map(([label, key]) => (
                            <div key={key}>
                              <label style={{ display: "block", fontSize: "0.68rem", color: "#9b8e85", marginBottom: "3px", textAlign: "center" }}>{label}</label>
                              <input
                                type="number"
                                min={0}
                                className="sf-input"
                                style={{ textAlign: "center", padding: "5px 4px" }}
                                value={settingsForm[key]}
                                placeholder="0"
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setSettingsForm((f) => {
                                    const updated = { ...f, [key]: newVal };
                                    fireSettingsPreview({
                                      marginTop:    updated.marginTop,
                                      marginRight:  updated.marginRight,
                                      marginBottom: updated.marginBottom,
                                      marginLeft:   updated.marginLeft,
                                    });
                                    return updated;
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid #f5f2ee", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917", marginBottom: "4px" }}>Content Max Width</div>
                        <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginBottom: "0.75rem" }}>Limit content width. Helps match editor preview to guest view.</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="number"
                            min={320}
                            className="sf-input"
                            style={{ flex: 1 }}
                            value={settingsForm.siteMaxWidth}
                            placeholder="Full width"
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettingsForm((f) => ({ ...f, siteMaxWidth: val }));
                              fireSettingsPreview({ siteMaxWidth: val });
                            }}
                          />
                          <span style={{ fontSize: "0.78rem", color: "#9b8e85" }}>px</span>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "music" && (
                    <>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginBottom: "1rem", lineHeight: 1.6 }}>
                        Select a track from your Media library. The music will play softly in the background when guests visit your site.
                      </p>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-music">Music Track</label>
                        {musicLoading ? (
                          <p style={{ fontSize: "0.78rem", color: "#b0a99f" }}>Loading music library…</p>
                        ) : musicTracks.length === 0 ? (
                          <p style={{ fontSize: "0.78rem", color: "#9b8e85", lineHeight: 1.5 }}>
                            No music in your library yet.{" "}
                            <button type="button" style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" }}
                              onClick={() => { setSettingsOpen(false); setSection("media"); setMediaTab("music"); }}>
                              Add music in Media
                            </button>
                          </p>
                        ) : (
                          <>
                            <select
                              id="s-music"
                              className="sf-input"
                              value={settingsForm.musicUrl}
                              onChange={(e) => setSettingsForm((f) => ({ ...f, musicUrl: e.target.value }))}
                            >
                              <option value="">— No music —</option>
                              {musicTracks.map((m) => (
                                <option key={m.id} value={m.url}>{m.title ?? m.url}</option>
                              ))}
                            </select>
                            {settingsForm.musicUrl && (
                              <div style={{ display: "none" }}>{settingsForm.musicUrl}</div>
                            )}
                          </>
                        )}
                      </div>
                      {pages.length > 0 && (() => {
                        const songArr: string[] = (() => { try { return JSON.parse(settingsForm.songPages || "[]"); } catch { return []; } })();
                        const resetArr: string[] = (() => { try { return JSON.parse(settingsForm.songResetPages || "[]"); } catch { return []; } })();
                        return (
                          <div style={{ marginTop: "1.25rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", gap: "4px 0", alignItems: "center", paddingBottom: "4px", borderBottom: "1px solid #f0ede8", marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#9b8e85" }}>Page</span>
                              <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#9b8e85", textAlign: "center", display: "block" }}>Show Player</span>
                              <span style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#9b8e85", textAlign: "center", display: "block" }}>Restart Song</span>
                            </div>
                            {pages.map((p) => {
                              const showChecked = songArr.includes(p.id);
                              const resetChecked = resetArr.includes(p.id);
                              return (
                                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f9f6f2" }}>
                                  <span style={{ fontSize: "0.8rem", color: "#1c1917" }}>{p.label}</span>
                                  <div style={{ textAlign: "center" }}>
                                    <label style={{ display: "inline-flex", cursor: "pointer" }}>
                                      <input type="checkbox" checked={showChecked}
                                        onChange={() => { const next = showChecked ? songArr.filter(id => id !== p.id) : [...songArr, p.id]; setSettingsForm(f => ({ ...f, songPages: JSON.stringify(next) })); }}
                                        style={{ display: "none" }} />
                                      <span style={{ display: "block", width: "30px", height: "17px", borderRadius: "9px", background: showChecked ? "var(--accent)" : "#d1cdc7", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                        <span style={{ position: "absolute", top: "2px", left: showChecked ? "13px" : "2px", width: "13px", height: "13px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                      </span>
                                    </label>
                                  </div>
                                  <div style={{ textAlign: "center" }}>
                                    <label style={{ display: "inline-flex", cursor: "pointer" }}>
                                      <input type="checkbox" checked={resetChecked}
                                        onChange={() => { const next = resetChecked ? resetArr.filter(id => id !== p.id) : [...resetArr, p.id]; setSettingsForm(f => ({ ...f, songResetPages: JSON.stringify(next) })); }}
                                        style={{ display: "none" }} />
                                      <span style={{ display: "block", width: "30px", height: "17px", borderRadius: "9px", background: resetChecked ? "var(--accent)" : "#d1cdc7", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                        <span style={{ position: "absolute", top: "2px", left: resetChecked ? "13px" : "2px", width: "13px", height: "13px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                            <p style={{ fontSize: "0.68rem", color: "#b0a99f", marginTop: "8px", lineHeight: 1.5 }}>
                              Leave all unchecked to play on every page. Restart replays from the beginning on entry.
                            </p>
                          </div>
                        );
                      })()}

                      {/* Music Button Colors */}
                      <div style={{ marginTop: "1.25rem" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.5rem" }}>Music Button Style</div>
                        {[
                          { label: "Button background", key: "musicBtnBg" as const, def: settingsForm.accentColor || "#B8921A" },
                          { label: "Icon color", key: "musicBtnColor" as const, def: "#ffffff" },
                        ].map(({ label, key, def }) => (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid #f5f2ee" }}>
                            <ColorSwatch value={settingsForm[key] || def} onChange={v => { setSettingsForm(f => ({ ...f, [key]: v })); fireSettingsPreview({ [key]: v }); }} />
                            <span style={{ fontSize: "0.8rem", color: "#6b5e56", flex: 1 }}>{label}</span>
                            <code style={{ fontSize: "0.72rem", color: "#a09690", fontFamily: "monospace" }}>{(settingsForm[key] || def).toUpperCase()}</code>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "language" && (
                    <>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginBottom: "1rem", lineHeight: 1.6 }}>
                        Set a main language and an optional second language. Guests can switch between them on your site.
                      </p>
                      {settingsForm.secondLanguage && (
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "0.75rem 0.875rem", marginBottom: "1rem" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400e", marginBottom: "3px" }}>Action required</div>
                          <div style={{ fontSize: "0.73rem", color: "#78350f", lineHeight: 1.55 }}>
                            To translate your site, go to the <strong>Website</strong> section, open each content block, and enter the translated text in the second language fields. The language toggle will appear on your site once translated content is saved.
                          </div>
                        </div>
                      )}
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-main-lang">Main Language</label>
                        <select id="s-main-lang" className="sf-input" value={settingsForm.mainLanguage} onChange={(e) => setSettingsForm((f) => ({ ...f, mainLanguage: e.target.value }))}>
                          {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
                        </select>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-second-lang">Second Language <span style={{ fontWeight: 400, color: "#b0a99f" }}>(optional)</span></label>
                        <select id="s-second-lang" className="sf-input" value={settingsForm.secondLanguage} onChange={(e) => setSettingsForm((f) => ({ ...f, secondLanguage: e.target.value }))}>
                          <option value="">None</option>
                          {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
                        </select>
                      </div>
                      {settingsForm.secondLanguage && activePage && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            disabled={translating}
                            onClick={handleTranslate}
                            style={{ width: "100%", padding: "9px 0", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--accent)", background: translating ? "#f5f2ee" : "var(--accent)", color: translating ? "#9b8e85" : "#fff", cursor: translating ? "default" : "pointer", transition: "background 0.15s" }}
                          >
                            {translating ? "Translating…" : `Translate to ${LANGUAGES.find((l) => l.code === settingsForm.secondLanguage)?.label ?? settingsForm.secondLanguage}`}
                          </button>
                          <div style={{ fontSize: "0.68rem", color: "#9b8e85", marginTop: "4px", lineHeight: 1.5 }}>
                            AI-translates all text on the current page. Review and save when done.
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {settingsDrawerTab === "popup" && (
                    <>
                      {/* Enabled toggle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0 1rem" }}>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917" }}>Welcome Popup</div>
                          <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginTop: "2px" }}>Show a popup when guests first arrive</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsForm((f) => ({ ...f, popupEnabled: f.popupEnabled ? 0 : 1 }))}
                          style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: settingsForm.popupEnabled ? "var(--accent)" : "#e0dbd4", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                          aria-pressed={!!settingsForm.popupEnabled}
                          aria-label="Toggle welcome popup"
                        >
                          <span style={{ position: "absolute", top: "3px", left: settingsForm.popupEnabled ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                        </button>
                      </div>

                      {!!settingsForm.popupEnabled && (
                        <>
                          {/* Title */}
                          <div className="sf-group">
                            <label className="sf-lbl" htmlFor="s-popup-title">Popup Title <span style={{ fontWeight: 400, color: "#b0a99f" }}>(optional)</span></label>
                            <input id="s-popup-title" type="text" className="sf-input" placeholder="You're Invited!" value={settingsForm.popupTitle} onChange={(e) => setSettingsForm((f) => ({ ...f, popupTitle: e.target.value }))} />
                          </div>

                          {/* Message */}
                          <div className="sf-group">
                            <label className="sf-lbl" htmlFor="s-greeting">Welcome Message</label>
                            <input id="s-greeting" type="text" className="sf-input" placeholder="We're getting married! Join us on our special day." value={settingsForm.greeting} onChange={(e) => setSettingsForm((f) => ({ ...f, greeting: e.target.value }))} />
                          </div>

                          {/* Ticker toggle */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderTop: "1px solid #f5f2ee" }}>
                            <div>
                              <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1c1917" }}>Scrolling ticker</div>
                              <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginTop: "2px" }}>Adds a scrolling event name bar</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSettingsForm((f) => ({ ...f, popupTicker: f.popupTicker ? 0 : 1 }))}
                              style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: settingsForm.popupTicker ? "var(--accent)" : "#e0dbd4", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                              aria-pressed={!!settingsForm.popupTicker}
                              aria-label="Toggle scrolling ticker"
                            >
                              <span style={{ position: "absolute", top: "3px", left: settingsForm.popupTicker ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                            </button>
                          </div>

                          {/* Envelope note — shown when envelope animation is active */}
                          {settingsForm.animation === "envelope" && (
                            <div style={{ margin: "0.5rem 0 0.25rem", padding: "0.6rem 0.75rem", background: "#fdf8f0", border: "1px solid #e8d9c0", borderRadius: "6px", fontSize: "0.73rem", color: "#7a5c2e", lineHeight: 1.5 }}>
                              <strong style={{ display: "block", marginBottom: "2px" }}>Envelope card uses this popup</strong>
                              The invitation card inside your envelope pulls its content from the Title and Welcome Message fields above. Set them here to customize what guests read when the envelope opens. If left blank, your event name and date are shown instead.
                            </div>
                          )}

                          {/* Bundle with entrance animation toggle — only for non-envelope animations */}
                          {settingsForm.animation && settingsForm.animation !== "envelope" && settingsForm.animation !== "none" && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderTop: "1px solid #f5f2ee" }}>
                              <div>
                                <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1c1917" }}>Bundle popup inside entrance animation</div>
                                <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginTop: "2px" }}>Shows a popup card as part of the animation, before guests see the site</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSettingsForm((f) => ({ ...f, popupBundle: f.popupBundle ? 0 : 1 }))}
                                style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: settingsForm.popupBundle ? "var(--accent)" : "#e0dbd4", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                                aria-pressed={!!settingsForm.popupBundle}
                                aria-label="Toggle bundle popup with entrance animation"
                              >
                                <span style={{ position: "absolute", top: "3px", left: settingsForm.popupBundle ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                              </button>
                            </div>
                          )}

                          {/* Show after animation toggle */}
                          {(!settingsForm.animation || settingsForm.animation === "none" || settingsForm.animation === "envelope" || !settingsForm.popupBundle) && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0", borderTop: "1px solid #f5f2ee" }}>
                              <div>
                                <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1c1917" }}>Show after entrance animation</div>
                                <div style={{ fontSize: "0.7rem", color: "#9b8e85", marginTop: "2px" }}>Popup appears after the animation completes</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSettingsForm((f) => ({ ...f, popupAfterAnimation: f.popupAfterAnimation ? 0 : 1 }))}
                                style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: settingsForm.popupAfterAnimation ? "var(--accent)" : "#e0dbd4", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                                aria-pressed={!!settingsForm.popupAfterAnimation}
                                aria-label="Toggle show after animation"
                              >
                                <span style={{ position: "absolute", top: "3px", left: settingsForm.popupAfterAnimation ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {settingsDrawerTab === "access" && (
                    <>
                      <div className="sf-group">
                        <label className="sf-lbl">Site Visibility</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                          <button
                            type="button"
                            onClick={() => setSettingsForm((f) => ({ ...f, isLive: f.isLive ? 0 : 1 }))}
                            style={{
                              position: "relative", width: "44px", height: "24px", borderRadius: "12px",
                              background: settingsForm.isLive ? "var(--accent)" : "#e0dbd4",
                              border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
                            }}
                            aria-pressed={!!settingsForm.isLive}
                            aria-label="Toggle site live"
                          >
                            <span style={{
                              position: "absolute", top: "3px",
                              left: settingsForm.isLive ? "23px" : "3px",
                              width: "18px", height: "18px",
                              borderRadius: "50%", background: "#fff",
                              transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            }} />
                          </button>
                          <span style={{ fontSize: "0.8rem", color: settingsForm.isLive ? "var(--accent)" : "#9b8e85", fontWeight: 500 }}>
                            {settingsForm.isLive ? "Published — visible to guests" : "Draft — only you can see this"}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", margin: "1.25rem 0 1rem", lineHeight: 1.6 }}>
                        Add a password to restrict who can view your site. Leave blank to keep it public.
                      </p>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-password">Guest Password</label>
                        <input id="s-password" type="text" className="sf-input" placeholder="Leave blank for no password" value={settingsForm.guestPassword} onChange={(e) => setSettingsForm((f) => ({ ...f, guestPassword: e.target.value }))} />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="floating-save">
              <button
                className="btn-primary-sm"
                style={{ flex: 1 }}
                onClick={handleSaveSettings}
                disabled={savingSettings || settingsLoading}
              >
                {savingSettings ? "Saving…" : "Save Settings"}
              </button>
              <button className="btn-ghost" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
            </div>
          </aside>
        </>
      )}

      {Toast}
    </div>
  );
}
