"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { SitePhotoPicker } from "../SitePhotoPicker";

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

function DateTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const dateVal = value?.slice(0, 10) ?? "";
  const timeVal = value?.slice(11, 16) ?? "";

  function update(date: string, time: string) {
    if (!date) { onChange(null); return; }
    onChange(time ? `${date}T${time}` : date);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-1.5">
        <input
          type="date"
          value={dateVal}
          onChange={(e) => update(e.target.value, timeVal)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          type="time"
          value={timeVal}
          onChange={(e) => update(dateVal, e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Time"
        />
      </div>
      {dateVal && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[10px] text-muted-foreground hover:text-destructive"
        >
          Clear date
        </button>
      )}
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

      <DateTimeInput
        label="Event Date & Time"
        value={settings.eventDate}
        onChange={(v) => updateSettings({ eventDate: v })}
      />

      <TextInput
        label="Location"
        value={settings.eventLocation}
        onChange={(v) => updateSettings({ eventLocation: v })}
        placeholder="Grand Ballroom, New York"
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

          <SitePhotoPicker
            label="Social Image (OG)"
            value={settings.ogImage ?? null}
            onChange={(v) => updateSettings({ ogImage: v })}
          />
        </div>
      </div>
    </div>
  );
}
