"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import type { Block } from "@/app/stores/editorStore";

// ---------------------------------------------------------------------------
// Override detection helper
// ---------------------------------------------------------------------------

function isPropertyOverridden(
  block: Block | undefined,
  breakpoint: "desktop" | "tablet" | "mobile" | undefined,
  propertyName: string | undefined
): boolean {
  if (!block || !breakpoint || !propertyName) return false;
  if (breakpoint === "desktop") return false;
  return propertyName in (block.overrides?.[breakpoint] || {});
}

function OverrideIndicator() {
  return (
    <span
      className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-500"
      title="Overridden from desktop value"
    />
  );
}

// ---------------------------------------------------------------------------
// Panel Input Components
// ---------------------------------------------------------------------------

export function PanelTextInput({
  label,
  value,
  onChange,
  placeholder,
  block,
  breakpoint,
  propertyName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
}) {
  const [draft, setDraft] = useState(value);
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator />}
      </label>
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

export function PanelTextArea({
  label,
  value,
  onChange,
  placeholder,
  block,
  breakpoint,
  propertyName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
}) {
  const [draft, setDraft] = useState(value);
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator />}
      </label>
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

export function PanelDateInput({
  label,
  value,
  onChange,
  block,
  breakpoint,
  propertyName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator />}
      </label>
      <DatePicker
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function PanelSelectInput({
  label,
  value,
  onChange,
  options,
  block,
  breakpoint,
  propertyName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator />}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function PanelTimeInput({
  label,
  value,
  onChange,
  block,
  breakpoint,
  propertyName,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator />}
      </label>
      <TimePicker
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
