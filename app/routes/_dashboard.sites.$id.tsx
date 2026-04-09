import { redirect, useLoaderData, useSearchParams } from "react-router";
import { useState, useEffect, useCallback, useRef } from "react";
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

  const result = await context.cloudflare.env.DB
    .prepare("SELECT id, name, slug, customDomain, eventType, status, previewColor, updatedAt FROM site WHERE id = ? AND userId = ?")
    .bind(params.id, session.user.id)
    .first<Site>();

  if (!result) throw redirect("/");

  return { site: result, user: session.user };
}

// ── Constants ─────────────────────────────────────────────────────────────────

type Section = "website" | "photos" | "guestlist" | "templates" | "site-setup" | "analytics";

const EVENT_TYPES = [
  { type: "wedding",     icon: "💍", label: "Wedding" },
  { type: "anniversary", icon: "🥂", label: "Anniversary" },
  { type: "vow-renewal", icon: "🌸", label: "Vow Renewal" },
  { type: "engagement",  icon: "💫", label: "Engagement" },
  { type: "elopement",   icon: "✈️", label: "Elopement" },
  { type: "celebration", icon: "🎉", label: "Celebration" },
];

const BLOCK_TYPES = [
  { type: "home-hero",     label: "Hero",          color: "#0d9488" },
  { type: "text",          label: "Text",          color: "#6b7280" },
  { type: "images",        label: "Images",        color: "#ec4899" },
  { type: "video",         label: "Video",         color: "#ef4444" },
  { type: "countdown",     label: "Countdown",     color: "#f59e0b" },
  { type: "header",        label: "Header",        color: "#8b5cf6" },
  { type: "schedule",      label: "Schedule",      color: "#d97706" },
  { type: "faq",           label: "Q & A",         color: "#0ea5e9" },
  { type: "rsvp",          label: "RSVP",          color: "#0d9488" },
  { type: "spacer",        label: "Spacer",        color: "#d4cec8" },
  { type: "registry-card", label: "Registry",      color: "#e86c4a" },
  { type: "hotel-card",    label: "Hotel",         color: "#3b82f6" },
  { type: "venue-map",     label: "Venue Map",     color: "#10b981" },
  { type: "youtube",       label: "YouTube",       color: "#ef4444" },
];

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

  // Website section state
  const [activeTab, setActiveTab]         = useState<"tiles" | "content">("tiles");
  const [pages, setPages]                 = useState<Page[]>([]);
  const [activePage, setActivePage]       = useState<Page | null>(null);
  const [blocks, setBlocks]               = useState<Block[]>([]);
  const [pagesLoading, setPagesLoading]   = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [pageDropOpen, setPageDropOpen]   = useState(false);
  const [addBlockOpen, setAddBlockOpen]   = useState(false);
  const [blockEditOpen, setBlockEditOpen]       = useState(false);
  const [editingBlock, setEditingBlock]         = useState<Block | null>(null);
  const [blockConfigFields, setBlockConfigFields] = useState<Record<string, unknown>>({});

  // Style tab
  const [styleHeadingFont, setStyleHeadingFont] = useState("Georgia");
  const [styleBodyFont, setStyleBodyFont]       = useState("Inter");
  const [styleAccent, setStyleAccent]           = useState(site.previewColor);

  // Photos section state
  const [photos, setPhotos]               = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploading, setUploading]         = useState(false);

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
    accentColor: "#0d9488",
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
    navHighlightColor: "#0d9488",
  });

  // Analytics section state
  const [analytics, setAnalytics]               = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Drag-to-reorder refs
  const blockListRef = useRef<HTMLDivElement | null>(null);
  const blocksRef = useRef<Block[]>(blocks);
  blocksRef.current = blocks;

  const previewUrl = `/${site.slug}`;
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
        accentColor:    data.settings.accentColor     ?? "#0d9488",
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
        navHighlightColor:  data.settings.navHighlightColor  ?? "#0d9488",
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
    if (section === "photos") fetchPhotos();
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
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activePage) fetchBlocks(activePage.id);
  }, [activePage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (settingsOpen && !settings) fetchSettings();
  }, [settingsOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // SortableJS — drag-to-reorder blocks
  useEffect(() => {
    if (section !== "website" || activeTab !== "tiles") return;
    if (!blockListRef.current) return;
    const siteId = site.id;
    const sortable = Sortable.create(blockListRef.current, {
      handle: ".drag-handle",
      animation: 150,
      ghostClass: "bl-drag-ghost",
      onEnd(evt) {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
        setBlocks((prev) => {
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
            .then(() => toast("Block order saved"))
            .catch(() => toast("Failed to save order", true));
          return reordered;
        });
      },
    });
    return () => sortable.destroy();
  }, [section, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function handleAddBlock(type: string) {
    if (!activePage) return;
    try {
      await apiFetch("/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageId: activePage.id, type, config: {}, sortOrder: blocks.length }),
      });
      await fetchBlocks(activePage.id);
      toast(`${type} block added`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add block", true);
    }
    setAddBlockOpen(false);
  }

  async function handleToggleBlockVisibility(block: Block) {
    try {
      await apiFetch(`/blocks/${block.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isVisible: block.isVisible === 0 }),
      });
      if (activePage) await fetchBlocks(activePage.id);
      toast("Block updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update block", true);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    try {
      await apiFetch(`/blocks/${blockId}`, { method: "DELETE" });
      if (activePage) await fetchBlocks(activePage.id);
      toast("Block deleted");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete block", true);
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

  async function handleSaveBlockConfig() {
    if (!editingBlock) return;
    try {
      await apiFetch(`/blocks/${editingBlock.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: JSON.stringify(blockConfigFields) }),
      });
      if (activePage) await fetchBlocks(activePage.id);
      setBlockEditOpen(false);
      toast("Block config saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save block config", true);
    }
  }

  function setField(key: string, val: unknown) {
    setBlockConfigFields((f) => ({ ...f, [key]: val }));
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
      if (section === "website") await fetchPages();
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
      toast("Settings saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save settings", true);
    } finally {
      setSavingSettings(false);
    }
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

      {/* ── WEBSITE EDITOR ──────────────────────────────────── */}
      {section === "website" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="section-topbar-title">Website</span>
            <div className="section-topbar-spacer" />
            <button className="settings-gear-btn" onClick={() => setSettingsOpen(true)}>
              ⚙ Settings
            </button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost">👁 Guest Preview</button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost" disabled>↩</button>
            <button className="btn-ghost" disabled>↪</button>
            <div className="section-topbar-divider" />
            <button className="btn-ghost" onClick={() => setSection("templates")}>Save Template</button>
            <div className="section-topbar-divider" />
            <button className="btn-primary-sm" onClick={handleSaveLayout}>Save Layout</button>
          </div>

          <div className="builder-shell">
            {/* Left panel */}
            <div className="builder-left">
              {/* Page selector */}
              <div className="page-selector-row">
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
                            onClick={() => { setActivePage(p); setPageDropOpen(false); }}
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
                <button className="page-act-btn vis-on" title="Visible" aria-label="Toggle page visibility">👁</button>
                <button className="page-act-btn" title="Lock" aria-label="Toggle page lock">🔒</button>
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
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tiles tab */}
              {activeTab === "tiles" && (
                <div className="left-tab-panel" style={{ padding: "0.75rem 1rem" }}>
                  {blocksLoading ? (
                    <p style={{ fontSize: "0.75rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0.5rem" }}>
                      Loading blocks…
                    </p>
                  ) : (
                    <>
                      {blocks.length === 0 && (
                        <p style={{ fontSize: "0.7rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0.5rem", lineHeight: 1.6 }}>
                          No blocks yet.<br />Add your first block to start building.
                        </p>
                      )}
                      <div ref={blockListRef} style={{ marginBottom: "0.5rem" }}>
                        {blocks.map((block) => (
                          <div key={block.id} className="bl-card-wrap">
                            <div className="bl-card">
                              <div className="drag-handle" aria-hidden="true">⠿</div>
                              <div className="bl-stripe" style={{ background: blockColor(block.type) }} />
                              <div className="bl-body">
                                <div className={`bl-name${block.isVisible === 0 ? " off" : ""}`}>
                                  {blockLabel(block.type)}
                                </div>
                                <div className="bl-sub">{block.type}</div>
                              </div>
                              <div className="bl-acts">
                                <button
                                  className={`bact${block.isVisible !== 0 ? " vis-on" : ""}`}
                                  title={block.isVisible !== 0 ? "Hide block" : "Show block"}
                                  aria-label={block.isVisible !== 0 ? "Hide block" : "Show block"}
                                  onClick={() => handleToggleBlockVisibility(block)}
                                >
                                  {block.isVisible !== 0 ? "👁" : "🙈"}
                                </button>
                                <button
                                  className="bact"
                                  title="Edit block config"
                                  aria-label="Edit block config"
                                  onClick={() => handleEditBlock(block)}
                                >
                                  ✎
                                </button>
                                <button
                                  className="bact"
                                  title="Delete block"
                                  aria-label="Delete block"
                                  onClick={() => handleDeleteBlock(block.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    className="add-block-btn"
                    onClick={() => setAddBlockOpen(true)}
                    disabled={!activePage}
                    aria-label="Add a new block"
                  >
                    + Add Block
                  </button>
                </div>
              )}

              {/* Content tab */}
              {activeTab === "content" && (
                <div className="left-tab-panel" style={{ padding: "1rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "#9b8e85", lineHeight: 1.6 }}>
                    Content editing for <strong>{activePage?.label ?? "…"}</strong> will appear here once blocks are added.
                  </p>
                </div>
              )}

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

      {/* ── PHOTOS ──────────────────────────────────────────── */}
      {section === "photos" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
            <span className="section-topbar-title">Photos</span>
            <div className="section-topbar-spacer" />
            <button className="btn-ghost" onClick={() => setSection("templates")}>Save Template</button>
          </div>
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
                JPG, PNG, WebP — max 10 MB each
              </div>
            </label>

            {photosLoading ? (
              <p style={{ fontSize: "0.8rem", color: "#b0a99f", textAlign: "center", padding: "2rem 0" }}>
                Loading photos…
              </p>
            ) : (
              <div className="lib-grid">
                {photos.length === 0 ? (
                  <div
                    className="lib-item"
                    style={{ height: "120px", background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "#9b8e85" }}>No photos yet</span>
                  </div>
                ) : (
                  photos.map((photo) => (
                    <div key={photo.id} className="lib-item" style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          background: "#f0ede8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          color: "#b0a99f",
                          overflow: "hidden",
                        }}
                        title={photo.filename}
                      >
                        {photo.filename}
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        aria-label={`Delete photo ${photo.filename}`}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(28,25,23,0.65)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          width: "22px",
                          height: "22px",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GUEST LIST ──────────────────────────────────────── */}
      {section === "guestlist" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="section-topbar">
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
              <button className="gl-btn">↑ Import</button>
              <button className="gl-btn">↓ Export</button>
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

            {/* QR Code */}
            <div className="setup-section">
              <div className="setup-section-head">
                <h2 className="setup-section-title">Share QR Code</h2>
                <p className="setup-section-desc">Generate a QR code to print on invitations or displays.</p>
              </div>
              <div className="qr-section">
                <div className="qr-input-row">
                  <input
                    type="url"
                    className="qr-url-input"
                    defaultValue={siteUrl}
                    aria-label="Site URL for QR code"
                  />
                  <button className="btn-primary-sm">Generate</button>
                </div>
              </div>
            </div>

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
                  <span style={{ fontSize: "0.82rem", color: "#0d9488", fontWeight: 600 }}>
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
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9b8e85" }}
                      aria-label="Close"
                    >
                      ×
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
                          background: domainTab === tab ? "#0d9488" : "#f5f0eb",
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
                              <div style={{ fontSize: "0.76rem", color: "#0d9488", marginTop: "2px" }}>
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
                  <div style={{ fontSize: "0.73rem", color: "#9b8e85" }}>Not connected</div>
                </div>
                <button className="btn-primary-sm" style={{ marginLeft: "auto" }}>Connect Canva</button>
              </div>
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
            <span className="section-topbar-title">Analytics</span>
            <div className="section-topbar-spacer" />
            <button className="btn-ghost" onClick={fetchAnalytics} aria-label="Refresh analytics">
              ↻ Refresh
            </button>
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
                ×
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

      {/* ── Add Block modal ──────────────────────────────────── */}
      {addBlockOpen && (
        <div
          className="overlay-bg"
          onClick={() => setAddBlockOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Add block"
        >
          <div className="overlay-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="overlay-close"
              onClick={() => setAddBlockOpen(false)}
              aria-label="Close dialog"
            >
              ×
            </button>
            <h2>Add Block</h2>
            <div className="block-type-grid">
              {BLOCK_TYPES.map(({ type, label, color }) => (
                <button
                  key={type}
                  className="block-type-tile"
                  onClick={() => handleAddBlock(type)}
                  aria-label={`Add ${label} block`}
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
              <button className="overlay-close" onClick={() => setBlockEditOpen(false)} aria-label="Close">×</button>
              <h2 style={{ marginBottom: "0.25rem" }}>Edit {blockLabel(t)}</h2>

              {/* home-hero */}
              {t === "home-hero" && (<>
                <div className="sf-group"><label className="sf-lbl">Couple Names</label><input className="sf-input" value={String(cfg.coupleNames ?? "")} onChange={e => setField("coupleNames", e.target.value)} placeholder="Jane & John" /></div>
                <div className="sf-group"><label className="sf-lbl">Date Text</label><input className="sf-input" value={String(cfg.dateText ?? "")} onChange={e => setField("dateText", e.target.value)} placeholder="October 12, 2025" /></div>
                <div className="sf-group"><label className="sf-lbl">Location Text</label><input className="sf-input" value={String(cfg.locationText ?? "")} onChange={e => setField("locationText", e.target.value)} placeholder="Grand Ballroom, New York" /></div>
                <div className="sf-group"><label className="sf-lbl">RSVP Button Text</label><input className="sf-input" value={String(cfg.cta ?? "")} onChange={e => setField("cta", e.target.value)} placeholder="RSVP Now" /></div>
              </>)}

              {/* header */}
              {t === "header" && (
                <div className="sf-group"><label className="sf-lbl">Page Title</label><input className="sf-input" value={String(cfg.title ?? "")} onChange={e => setField("title", e.target.value)} placeholder="Our Story" /></div>
              )}

              {/* text */}
              {t === "text" && (<>
                <div className="sf-group"><label className="sf-lbl">Heading</label><input className="sf-input" value={String(cfg.heading ?? "")} onChange={e => setField("heading", e.target.value)} placeholder="Section heading…" /></div>
                <div className="sf-group"><label className="sf-lbl">Body</label><textarea className="sf-input" rows={5} value={String(cfg.body ?? "")} onChange={e => setField("body", e.target.value)} placeholder="Your text here…" style={{ resize: "vertical" }} /></div>
                <div className="sf-group"><label className="sf-lbl">Content Key <span style={{ fontWeight: 400, color: "#b0a99f" }}>(advanced)</span></label><input className="sf-input" value={String(cfg.contentKey ?? "")} onChange={e => setField("contentKey", e.target.value)} placeholder="story / home-welcome / accommodations / registry" /></div>
              </>)}

              {/* video */}
              {t === "video" && (<>
                <div className="sf-group"><label className="sf-lbl">Video URL (YouTube / Vimeo)</label><input className="sf-input" type="url" value={String(cfg.url ?? "")} onChange={e => setField("url", e.target.value)} placeholder="https://youtube.com/watch?v=…" /></div>
                <div className="sf-group"><label className="sf-lbl">Height (CSS)</label><input className="sf-input" value={String(cfg.height ?? "100dvh")} onChange={e => setField("height", e.target.value)} placeholder="100dvh" /></div>
              </>)}

              {/* countdown */}
              {t === "countdown" && (
                <div className="sf-group"><label className="sf-lbl">Countdown To</label><input className="sf-input" type="datetime-local" value={String(cfg.countdownDate ?? "")} onChange={e => setField("countdownDate", e.target.value)} /></div>
              )}

              {/* images */}
              {t === "images" && (
                <div className="sf-group"><label className="sf-lbl">Image Slot Name</label><input className="sf-input" value={String(cfg.imageSlot ?? "")} onChange={e => setField("imageSlot", e.target.value)} placeholder="home" /></div>
              )}

              {/* youtube */}
              {t === "youtube" && (<>
                <div className="sf-group"><label className="sf-lbl">YouTube URL or Video ID</label><input className="sf-input" value={String(cfg.url ?? "")} onChange={e => setField("url", e.target.value)} placeholder="https://youtube.com/watch?v=…" /></div>
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

              {/* fallback: raw JSON for unknown types */}
              {!["home-hero","header","text","video","countdown","images","youtube","spacer","registry-card","hotel-card","venue-map","schedule","faq"].includes(t) && (
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
              width: "min(420px, 95vw)",
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
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#b0a99f" }}
              >
                ×
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
                    color: settingsDrawerTab === tab ? "#0d9488" : "#9b8e85",
                    background: "none",
                    border: "none",
                    borderBottom: settingsDrawerTab === tab ? "2px solid #0d9488" : "2px solid transparent",
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
                        <label className="sf-lbl" htmlFor="s-event-date">Event Date</label>
                        <input id="s-event-date" type="date" className="sf-input" value={settingsForm.eventDate} onChange={(e) => setSettingsForm((f) => ({ ...f, eventDate: e.target.value }))} />
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
                          <input type="color" value={settingsForm.headingColor} onChange={(e) => setSettingsForm((f) => ({ ...f, headingColor: e.target.value }))} style={{ width: "36px", height: "36px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer", flexShrink: 0 }} title="Heading color" />
                        </div>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl">Body Font</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <select className="sf-input" style={{ flex: 1 }} value={settingsForm.bodyFont} onChange={(e) => setSettingsForm((f) => ({ ...f, bodyFont: e.target.value }))}>
                            {BODY_FONTS.map((fn) => <option key={fn}>{fn}</option>)}
                          </select>
                          <input type="color" value={settingsForm.bodyColor} onChange={(e) => setSettingsForm((f) => ({ ...f, bodyColor: e.target.value }))} style={{ width: "36px", height: "36px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer", flexShrink: 0 }} title="Body text color" />
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
                          <input type="color" value={settingsForm.accentColor} onChange={(e) => setSettingsForm((f) => ({ ...f, accentColor: e.target.value }))} style={{ width: "36px", height: "36px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                          <div style={{ flex: 1, padding: "6px 14px", borderRadius: "4px", fontSize: "0.78rem", textAlign: "center", background: settingsForm.buttonStyle === "filled" ? settingsForm.accentColor : "transparent", color: settingsForm.buttonStyle === "filled" ? "#fff" : settingsForm.accentColor, border: `${settingsForm.buttonBorderWidth || "1.5px"} solid ${settingsForm.accentColor}` }}>Preview</div>
                        </div>
                      </div>
                      <div className="sf-group">
                        <label className="sf-lbl">Style</label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["filled", "outline"] as const).map((s) => (
                            <button key={s} onClick={() => setSettingsForm((f) => ({ ...f, buttonStyle: s }))} style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.buttonStyle === s ? "#0d9488" : "#e0dbd4", background: settingsForm.buttonStyle === s ? "#f0fdfa" : "#fff", color: settingsForm.buttonStyle === s ? "#0d9488" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.buttonStyle === s ? 600 : 400 }}>
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
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", margin: "1.1rem 0 0.6rem" }}>Site Colors</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Background</div>
                          <input type="color" value={settingsForm.bgColor} onChange={(e) => setSettingsForm((f) => ({ ...f, bgColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Text</div>
                          <input type="color" value={settingsForm.siteTextColor || "#1c1917"} onChange={(e) => setSettingsForm((f) => ({ ...f, siteTextColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Borders / Dividers</div>
                          <input type="color" value={settingsForm.siteBorderColor || "#e8e2da"} onChange={(e) => setSettingsForm((f) => ({ ...f, siteBorderColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "nav" && (
                    <>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.6rem" }}>Background</div>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "1rem" }}>
                        {(["white", "transparent", "custom"] as const).map((opt) => (
                          <button key={opt} onClick={() => setSettingsForm((f) => ({ ...f, navBg: opt }))} style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.navBg === opt ? "#0d9488" : "#e0dbd4", background: settingsForm.navBg === opt ? "#f0fdfa" : "#fff", color: settingsForm.navBg === opt ? "#0d9488" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.navBg === opt ? 600 : 400, textTransform: "capitalize" }}>
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.6rem" }}>Position</div>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "1rem" }}>
                        {(["fixed", "scroll-away"] as const).map((opt) => (
                          <button key={opt} onClick={() => setSettingsForm((f) => ({ ...f, navPosition: opt }))} style={{ flex: 1, padding: "5px 0", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid", borderColor: settingsForm.navPosition === opt ? "#0d9488" : "#e0dbd4", background: settingsForm.navPosition === opt ? "#f0fdfa" : "#fff", color: settingsForm.navPosition === opt ? "#0d9488" : "#6b5e56", cursor: "pointer", fontWeight: settingsForm.navPosition === opt ? 600 : 400 }}>
                            {opt === "fixed" ? "Fixed" : "Scroll Away"}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8e85", marginBottom: "0.6rem" }}>Nav Colors</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Couple Name</div>
                          <input type="color" value={settingsForm.navBrandColor} onChange={(e) => setSettingsForm((f) => ({ ...f, navBrandColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Nav Links</div>
                          <input type="color" value={settingsForm.navLinkColor} onChange={(e) => setSettingsForm((f) => ({ ...f, navLinkColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "0.72rem", color: "#9b8e85", marginBottom: "4px" }}>Highlight / Active</div>
                          <input type="color" value={settingsForm.navHighlightColor} onChange={(e) => setSettingsForm((f) => ({ ...f, navHighlightColor: e.target.value }))} style={{ width: "100%", height: "34px", border: "1px solid #e0dbd4", borderRadius: "6px", cursor: "pointer" }} />
                        </div>
                      </div>
                    </>
                  )}

                  {settingsDrawerTab === "music" && (
                    <>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginBottom: "1rem", lineHeight: 1.6 }}>
                        Add a YouTube or SoundCloud link. The music will play softly in the background when guests visit your site.
                      </p>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-music">Music URL</label>
                        <input id="s-music" type="url" className="sf-input" placeholder="https://youtube.com/watch?v=…" value={settingsForm.musicUrl} onChange={(e) => setSettingsForm((f) => ({ ...f, musicUrl: e.target.value }))} />
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
                                    <input type="checkbox" checked={showChecked}
                                      onChange={() => { const next = showChecked ? songArr.filter(id => id !== p.id) : [...songArr, p.id]; setSettingsForm(f => ({ ...f, songPages: JSON.stringify(next) })); }}
                                      style={{ width: "14px", height: "14px", accentColor: "#0d9488", cursor: "pointer" }} />
                                  </div>
                                  <div style={{ textAlign: "center" }}>
                                    <input type="checkbox" checked={resetChecked}
                                      onChange={() => { const next = resetChecked ? resetArr.filter(id => id !== p.id) : [...resetArr, p.id]; setSettingsForm(f => ({ ...f, songResetPages: JSON.stringify(next) })); }}
                                      style={{ width: "14px", height: "14px", accentColor: "#0d9488", cursor: "pointer" }} />
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
                    </>
                  )}

                  {settingsDrawerTab === "language" && (
                    <>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginBottom: "1rem", lineHeight: 1.6 }}>
                        Set a main language and an optional second language. Guests can switch between them on your site.
                      </p>
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
                    </>
                  )}

                  {settingsDrawerTab === "popup" && (
                    <>
                      <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginBottom: "1rem", lineHeight: 1.6 }}>
                        A welcome overlay pops up the first time a guest visits. Set the message below — leave it blank to disable the popup.
                      </p>
                      <div className="sf-group">
                        <label className="sf-lbl" htmlFor="s-greeting">Welcome Message</label>
                        <input id="s-greeting" type="text" className="sf-input" placeholder="We're getting married! Join us on our special day." value={settingsForm.greeting} onChange={(e) => setSettingsForm((f) => ({ ...f, greeting: e.target.value }))} />
                      </div>
                      {settingsForm.greeting && (
                        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "10px" }}>
                          <div style={{ fontSize: "0.7rem", color: "#0d9488", fontWeight: 600, marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</div>
                          <div style={{ fontSize: "0.85rem", color: "#1c1917", fontStyle: "italic" }}>"{settingsForm.greeting}"</div>
                        </div>
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
                              background: settingsForm.isLive ? "#0d9488" : "#e0dbd4",
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
                          <span style={{ fontSize: "0.8rem", color: settingsForm.isLive ? "#0d9488" : "#9b8e85", fontWeight: 500 }}>
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
