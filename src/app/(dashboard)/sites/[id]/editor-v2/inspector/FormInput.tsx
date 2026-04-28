"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import type { Block } from "@/app/stores/editorStore";

// ---------------------------------------------------------------------------
// Unified Form Input Component (Build Philosophy)
// ---------------------------------------------------------------------------

/**
 * FormInput — Unified input component for DreamySuite inspector panels.
 *
 * Supports two modes:
 * - **block mode**: Edits block-specific properties with cascading breakpoint support
 * - **page mode**: Edits page-level settings (no cascading)
 *
 * Design Philosophy: Build (Contemporary Minimalism)
 * - Generous spacing (40-50% whitespace)
 * - Clear typography hierarchy
 * - Subtle interactions
 * - Premium feel without ostentation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormInputType = "text" | "textarea" | "select" | "date" | "time" | "number" | "color";

interface BaseFormInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  helpText?: string;
  maxLength?: number;
  unit?: string;  // For numeric inputs (px, %, rem, etc.)
}

interface BlockModeProps extends BaseFormInputProps {
  mode: "block";
  type: FormInputType;

  // Required for cascading support (but may be undefined if editor doesn't receive them)
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  propertyName?: string;
  updateBlock?: (id: string, updates: Partial<Block>) => void;

  // Optional for select
  options?: { value: string; label: string }[];
}

interface PageModeProps extends BaseFormInputProps {
  mode: "page";
  type: FormInputType;

  // Optional for select
  options?: { value: string; label: string }[];
}

type FormInputProps = BlockModeProps | PageModeProps;

// ---------------------------------------------------------------------------
// Cascading Detection & Controls
// ---------------------------------------------------------------------------

function isPropertyOverridden(
  block: Block,
  breakpoint: "desktop" | "tablet" | "mobile",
  propertyName: string
): boolean {
  if (breakpoint === "desktop") return false;
  return propertyName in (block.overrides?.[breakpoint] || {});
}

function OverrideIndicator({ sourceBreakpoint }: { sourceBreakpoint: string }) {
  return (
    <span
      className="ml-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] text-white"
      title={`Overridden from ${sourceBreakpoint} value`}
      data-testid="override-indicator"
    >
      !
    </span>
  );
}

function ResetButton({
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
    const currentOverrides = block.overrides?.[breakpoint] || {};
    const { [propertyName]: _removed, ...remainingOverrides } = currentOverrides;

    const newOverrides = {
      ...block.overrides,
      [breakpoint]:
        Object.keys(remainingOverrides).length > 0 ? remainingOverrides : undefined,
    };

    updateBlock(block.id, { overrides: newOverrides });
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title="Reset to cascaded value"
      data-testid="reset-cascade-button"
    >
      ⟲
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FormInput(props: FormInputProps) {
  const {
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
    helpText,
    maxLength,
    unit,
    type,
  } = props;

  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Cascading indicator logic (only for block mode with all required props)
  const showCascadeIndicator =
    props.mode === "block" &&
    props.block !== undefined &&
    props.breakpoint !== undefined &&
    props.propertyName !== undefined &&
    props.updateBlock !== undefined;

  const isOverridden = showCascadeIndicator
    ? isPropertyOverridden(props.block!, props.breakpoint!, props.propertyName!)
    : false;
  const sourceBreakpoint =
    showCascadeIndicator && props.breakpoint === "mobile"
      ? "tablet/desktop"
      : "desktop";

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed);
  }

  // ---------------------------------------------------------------------------
  // Label with Cascade Indicators
  // ---------------------------------------------------------------------------

  const labelElement = (
    <div className="mb-2 flex items-center justify-between">
      <label className="flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {isOverridden && <OverrideIndicator sourceBreakpoint={sourceBreakpoint} />}
        {isOverridden &&
          showCascadeIndicator &&
          props.breakpoint !== "desktop" &&
          props.block &&
          props.breakpoint &&
          props.propertyName &&
          props.updateBlock && (
            <ResetButton
              block={props.block}
              breakpoint={props.breakpoint as "tablet" | "mobile"}
              propertyName={props.propertyName}
              updateBlock={props.updateBlock}
            />
          )}
      </label>
      {maxLength && type === "textarea" && (
        <span
          className={`text-xs tabular-nums ${
            draft.length > maxLength ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {draft.length}/{maxLength}
        </span>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Input Rendering by Type
  // ---------------------------------------------------------------------------

  let inputElement: React.ReactNode;

  switch (type) {
    case "text":
    case "number":
      inputElement = (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={draft}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              e.stopPropagation();
            }}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm leading-normal focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            data-testid={`form-input-${label.toLowerCase().replace(/\s+/g, "-")}`}
          />
          {unit && (
            <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      );
      break;

    case "textarea":
      inputElement = (
        <textarea
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          data-testid={`form-input-${label.toLowerCase().replace(/\s+/g, "-")}`}
        />
      );
      break;

    case "select":
      const options = props.options || [];
      inputElement = (
        <select
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          data-testid={`form-input-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;

    case "date":
      inputElement = (
        <DatePicker
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
      break;

    case "time":
      inputElement = (
        <TimePicker
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
      break;

    default:
      inputElement = <div className="text-xs text-destructive">Unsupported input type</div>;
  }

  // ---------------------------------------------------------------------------
  // Final Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-1">
      {labelElement}
      {inputElement}
      {helpText && (
        <p className="text-xs leading-normal text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
