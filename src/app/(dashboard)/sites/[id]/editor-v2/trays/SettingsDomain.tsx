"use client";

import { useState, useEffect } from "react";
import { Globe, Check, Copy } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useClipboard } from "@/lib/hooks";
import { SitePhotoPicker } from "../SitePhotoPicker";
import { FormInput } from "../inspector/FormInput";
import { PanelHeader } from "./SettingsPanelHeader";

export function DomainPanel({ onBack }: { onBack: () => void }) {
  const slug = useEditorStore((s) => s.siteSlug);
  const siteId = useEditorStore((s) => s.siteId);
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const subdomain = slug ? `${slug}.dreamysuite.com` : null;
  const { copied, copy } = useClipboard({ resetDelay: 1500 });

  return (
    <div className="flex h-full flex-col">
      <PanelHeader label="Domain" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-3 py-1">
        <div className="flex flex-col gap-3">
          {subdomain && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
                Subdomain
              </label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{subdomain}</span>
                <button
                  type="button"
                  onClick={() => copy(`https://${subdomain}`)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <CustomDomainSection siteId={siteId} />

          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
              SEO & Social
            </label>

            <FormInput
              mode="page"
              type="text"
              label="Page Title"
              value={settings.seoTitle ?? ""}
              onChange={(v) => updateSettings({ seoTitle: v || null })}
              placeholder="Custom page title"
              maxLength={60}
              helpText="Appears in browser tabs and search results (60 characters max)"
            />

            <FormInput
              mode="page"
              type="textarea"
              label="Meta Description"
              value={settings.seoDescription ?? ""}
              onChange={(v) => updateSettings({ seoDescription: v || null })}
              placeholder="A brief description for search engines"
              maxLength={160}
              helpText="Brief description for search engines and social shares (160 characters max)"
            />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
                Social Image (OG)
              </label>
              <SitePhotoPicker
                value={settings.ogImage ?? null}
                onChange={(v) => updateSettings({ ogImage: v })}
              />
              <p className="text-xs leading-normal text-muted-foreground">
                Image shown when your site is shared on social media (1200x630px
                recommended)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DomainConn = {
  domain: string;
  status?: string;
  sslStatus?: string;
  cnameTarget?: string;
  verificationErrors?: string[];
};

type DomainApiResp = {
  domain?: string | null;
  status?: string;
  sslStatus?: string;
  cnameTarget?: string;
  verificationErrors?: string[];
  error?: { message?: string };
};

function toConn(d: DomainApiResp): DomainConn | null {
  return d.domain
    ? {
        domain: d.domain,
        status: d.status,
        sslStatus: d.sslStatus,
        cnameTarget: d.cnameTarget,
        verificationErrors: d.verificationErrors,
      }
    : null;
}

function CustomDomainSection({ siteId }: { siteId: string | null }) {
  const [input, setInput] = useState("");
  const [conn, setConn] = useState<DomainConn | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { copied, copy } = useClipboard({ resetDelay: 1500 });

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    fetch(`/api/sites/${siteId}/domain`, { credentials: "include" })
      .then((r) => r.json() as Promise<DomainApiResp>)
      .then((d) => {
        const c = toConn(d);
        if (!cancelled && c) setConn(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  async function connect() {
    if (!siteId) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ domain: input.trim() }),
      });
      const d = (await r.json()) as DomainApiResp;
      const c = toConn(d);
      if (r.ok && c) {
        setConn(c);
        setInput("");
      } else {
        setErr(d?.error?.message ?? "Couldn’t connect that domain.");
      }
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (!siteId) return;
    setBusy(true);
    try {
      const d = (await fetch(`/api/sites/${siteId}/domain`, {
        credentials: "include",
      }).then((r) => r.json())) as DomainApiResp;
      const c = toConn(d);
      if (c) setConn(c);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!siteId) return;
    setBusy(true);
    setErr(null);
    try {
      await fetch(`/api/sites/${siteId}/domain`, {
        method: "DELETE",
        credentials: "include",
      });
      setConn(null);
    } catch {
      setErr("Couldn’t disconnect.");
    } finally {
      setBusy(false);
    }
  }

  const target = conn?.cnameTarget ?? "fallback.dreamysuite.com";
  const active = conn?.status === "active" && conn?.sslStatus === "active";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
        Custom domain
      </label>

      {conn ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">{conn.domain}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {active ? "Active" : "Pending"}
            </span>
          </div>

          {!active && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <p className="mb-1.5">
                Add this DNS record at your domain registrar, then check back:
              </p>
              <div className="flex items-center gap-2 rounded bg-background px-2 py-1 font-mono text-[11px]">
                <span className="text-muted-foreground">CNAME</span>
                <span className="truncate">{conn.domain}</span>
                <span className="text-muted-foreground">→</span>
                <span className="flex-1 truncate">{target}</span>
                <button
                  type="button"
                  onClick={() => copy(target)}
                  className="shrink-0 rounded p-0.5 hover:bg-accent/50"
                  title="Copy target"
                >
                  {copied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[10px]">
                Apex domains (no “www”) may need CNAME flattening or an ALIAS
                record — your registrar’s docs cover this.
              </p>
              {conn.verificationErrors &&
                conn.verificationErrors.length > 0 && (
                  <p className="mt-1 text-[10px] text-red-600">
                    {conn.verificationErrors[0]}
                  </p>
                )}
            </div>
          )}

          <div className="flex gap-2">
            {!active && (
              <button
                type="button"
                onClick={refresh}
                disabled={busy}
                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent/30 disabled:opacity-50"
              >
                {busy ? "Checking…" : "Check status"}
              </button>
            )}
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="yourname.com"
              className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
            />
            <button
              type="button"
              onClick={connect}
              disabled={busy || !input.trim() || !siteId}
              className="rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "…" : "Connect"}
            </button>
          </div>
          {err && <p className="text-[11px] text-red-600">{err}</p>}
          <p className="text-[10px] text-muted-foreground">
            Connect a domain you own. You’ll add one DNS record and Cloudflare
            issues the SSL certificate automatically.
          </p>
        </div>
      )}
    </div>
  );
}
