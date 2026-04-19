"use client";

import { cn } from "@/lib/utils";

interface Preset {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const PRESETS: Preset[] = [
  {
    id: "fade-slide-up",
    label: "Fade Up",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="8" y="18" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="8" y="12" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.6" />
        <rect x="8" y="6" width="16" height="3" rx="1.5" fill="currentColor" />
        <path d="M16 28 L16 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 25 L16 22 L19 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "fade-in",
    label: "Fade In",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="8" width="8" height="16" rx="1.5" fill="currentColor" opacity="0.15" />
        <rect x="12" y="8" width="8" height="16" rx="1.5" fill="currentColor" opacity="0.45" />
        <rect x="20" y="8" width="8" height="16" rx="1.5" fill="currentColor" opacity="0.85" />
      </svg>
    ),
  },
  {
    id: "spring-in",
    label: "Spring In",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="6" y="10" width="20" height="14" rx="2" fill="currentColor" />
        <path d="M10 8 L16 4 L22 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        <path d="M8 8 L24 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "blur-in",
    label: "Blur In",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <circle cx="16" cy="16" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "mask-wipe",
    label: "Mask Wipe",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="8" width="24" height="16" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="4" y="8" width="14" height="16" rx="2" fill="currentColor" opacity="0.8" />
        <line x1="18" y1="8" x2="18" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: "split-text",
    label: "Split Text",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="11" width="10" height="4" rx="1" fill="currentColor" />
        <rect x="18" y="11" width="10" height="4" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="4" y="17" width="7" height="4" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="15" y="17" width="13" height="4" rx="1" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: "letter-cascade",
    label: "Letter Cascade",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="8" width="5" height="16" rx="1" fill="currentColor" />
        <rect x="11" y="11" width="5" height="13" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="18" y="14" width="5" height="10" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="25" y="17" width="3" height="7" rx="1" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: "ken-burns",
    label: "Ken Burns",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="6" width="24" height="20" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="7" y="9" width="18" height="14" rx="1" fill="currentColor" opacity="0.5" />
        <path d="M22 10 L28 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M25 4 L28 4 L28 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "parallax-monogram",
    label: "Parallax",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="20" width="24" height="5" rx="1" fill="currentColor" />
        <rect x="6" y="14" width="20" height="5" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="8" y="8" width="16" height="5" rx="1" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "envelope-unfold",
    label: "Envelope",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="10" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 12 L16 20 L28 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10 L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: "scroll-pinned-story",
    label: "Scroll Story",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="10" y="4" width="12" height="24" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="10" r="2" fill="currentColor" />
        <path d="M16 14 L16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "sticky-date",
    label: "Sticky Date",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="8" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="8" width="24" height="8" rx="2" fill="currentColor" opacity="0.2" />
        <line x1="11" y1="4" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="21" y1="4" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="18" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="16" y="18" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
];

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function AnimationPresetPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((preset) => {
        const active = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={active}
            onClick={() => onChange(active ? null : preset.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-colors",
              "hover:border-primary/50 hover:bg-accent",
              active
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            <span className={cn("transition-colors", active ? "text-primary" : "text-muted-foreground")}>
              {preset.icon}
            </span>
            <span className="text-[10px] font-medium leading-tight">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}
