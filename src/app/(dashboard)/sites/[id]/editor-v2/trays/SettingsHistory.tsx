"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, Trash2, Save } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { PanelHeader } from "./SettingsPanelHeader";

type Version = { id: string; name: string; createdAt: number };

export function HistoryPanel({ onBack }: { onBack: () => void }) {
  const siteId = useEditorStore((s) => s.siteId);
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!siteId) return;
    try {
      const d = (await fetch(`/api/sites/${siteId}/templates`, {
        credentials: "include",
      }).then((r) => r.json())) as { templates?: Version[] };
      setVersions(d.templates ?? []);
    } catch {
      /* ignore */
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!siteId) return;
    setBusy(true);
    setMsg(null);
    try {
      const name = `Version — ${new Date().toLocaleString()}`;
      const r = await fetch(`/api/sites/${siteId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (r.ok) {
        setMsg("Version saved.");
        await load();
      } else {
        setMsg("Couldn’t save a version.");
      }
    } catch {
      setMsg("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(id: string) {
    if (!siteId) return;
    if (
      !window.confirm(
        "Restore this version? Your current pages, blocks, and theme will be replaced with this snapshot.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/sites/${siteId}/templates/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        window.location.reload();
      } else {
        setMsg("Couldn’t restore that version.");
        setBusy(false);
      }
    } catch {
      setMsg("Network error — try again.");
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!siteId) return;
    if (!window.confirm("Delete this saved version?")) return;
    setBusy(true);
    try {
      await fetch(`/api/sites/${siteId}/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader label="Version history" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Save className="size-4" />
          {busy ? "Working…" : "Save current version"}
        </button>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

        {versions.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No saved versions yet. Save one to create a restore point before big
            changes.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
              >
                <History className="size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{v.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restore(v.id)}
                  disabled={busy}
                  title="Restore this version"
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50 disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => del(v.id)}
                  disabled={busy}
                  title="Delete this version"
                  className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] leading-normal text-muted-foreground">
          A version is a snapshot of your pages, blocks, and theme. Restoring
          replaces your current content with that snapshot.
        </p>
      </div>
    </div>
  );
}
