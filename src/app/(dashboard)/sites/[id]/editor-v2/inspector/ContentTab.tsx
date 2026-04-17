"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/app/stores/editorStore";

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[10px] tabular-nums ${draft.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[10px] tabular-nums ${draft.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={draft}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full resize-none rounded border border-input bg-background px-2.5 py-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

export function ContentTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-4 p-4">
      <TextInput
        label="Event Name"
        value={settings.eventName}
        onChange={(v) => updateSettings({ eventName: v })}
        placeholder="Our Wedding"
      />

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          SEO & Social
        </p>
        <div className="space-y-3">
          <TextInput
            label="Page Title"
            value={settings.seoTitle}
            onChange={(v) => updateSettings({ seoTitle: v })}
            placeholder="Custom page title"
            maxLength={60}
          />

          <TextArea
            label="Meta Description"
            value={settings.seoDescription}
            onChange={(v) => updateSettings({ seoDescription: v })}
            placeholder="A brief description for search engines"
            maxLength={160}
          />

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Social Image (OG)
            </label>
            <input
              type="url"
              value={settings.ogImage ?? ""}
              placeholder="https://..."
              onChange={(e) => updateSettings({ ogImage: e.target.value || null })}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {settings.ogImage && (
              <div className="mt-1.5 overflow-hidden rounded border border-border">
                <img
                  src={settings.ogImage}
                  alt="OG preview"
                  className="h-20 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
