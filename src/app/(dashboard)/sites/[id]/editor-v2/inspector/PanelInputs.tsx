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

function ResetOverrideButton({
  block,
  breakpoint,
  propertyName,
  updateBlock,
}: {
  block: Block;
  breakpoint: "tablet" | "mobile";
  propertyName: string;
  updateBlock: (id: string, updates: Partial<Block>) => void;
}) {
  function handleReset() {
    // Get current overrides for this breakpoint
    const currentOverrides = block.overrides?.[breakpoint] || {};

    // Create new overrides object without this property
    const { [propertyName]: _omit, ...remainingOverrides } = currentOverrides;

    // Update block with new overrides
    const newOverrides = {
      ...block.overrides,
      [breakpoint]: Object.keys(remainingOverrides).length > 0
        ? remainingOverrides
        : undefined, // Remove breakpoint key if empty
    };

    updateBlock(block.id, { overrides: newOverrides });
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-accent"
      title="Reset to cascaded value"
    >
      ⟲
    </button>
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
  updateBlock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const [draft, setDraft] = useState(value);
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((prev) => (prev !== value ? value : prev));
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && (
          <>
            <OverrideIndicator />
            {block && breakpoint && breakpoint !== "desktop" && propertyName && updateBlock && (
              <ResetOverrideButton
                block={block}
                breakpoint={breakpoint}
                propertyName={propertyName}
                updateBlock={updateBlock}
              />
            )}
          </>
        )}
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
  updateBlock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const [draft, setDraft] = useState(value);
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((prev) => (prev !== value ? value : prev));
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && (
          <>
            <OverrideIndicator />
            {block && breakpoint && breakpoint !== "desktop" && propertyName && updateBlock && (
              <ResetOverrideButton
                block={block}
                breakpoint={breakpoint}
                propertyName={propertyName}
                updateBlock={updateBlock}
              />
            )}
          </>
        )}
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
  updateBlock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && (
          <>
            <OverrideIndicator />
            {block && breakpoint && breakpoint !== "desktop" && propertyName && updateBlock && (
              <ResetOverrideButton
                block={block}
                breakpoint={breakpoint}
                propertyName={propertyName}
                updateBlock={updateBlock}
              />
            )}
          </>
        )}
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
  updateBlock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && (
          <>
            <OverrideIndicator />
            {block && breakpoint && breakpoint !== "desktop" && propertyName && updateBlock && (
              <ResetOverrideButton
                block={block}
                breakpoint={breakpoint}
                propertyName={propertyName}
                updateBlock={updateBlock}
              />
            )}
          </>
        )}
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
  updateBlock,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const isOverridden = isPropertyOverridden(block, breakpoint, propertyName);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {isOverridden && (
          <>
            <OverrideIndicator />
            {block && breakpoint && breakpoint !== "desktop" && propertyName && updateBlock && (
              <ResetOverrideButton
                block={block}
                breakpoint={breakpoint}
                propertyName={propertyName}
                updateBlock={updateBlock}
              />
            )}
          </>
        )}
      </label>
      <TimePicker
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
