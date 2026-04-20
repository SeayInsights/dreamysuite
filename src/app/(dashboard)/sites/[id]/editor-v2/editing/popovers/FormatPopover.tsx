"use client";

import { cn } from "@/lib/utils";

export interface FormatOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const FAQ_FORMATS: FormatOption[] = [
  {
    id: "list",
    label: "List",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="7" width="24" height="3" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="4" y="13" width="18" height="2" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="4" y="19" width="24" height="3" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="4" y="25" width="18" height="2" rx="1" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: "accordion",
    label: "Accordion",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="6" width="24" height="7" rx="2" fill="currentColor" opacity="0.8" />
        <path d="M22 10 L25 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4" y="15" width="24" height="4" rx="2" fill="currentColor" opacity="0.3" />
        <rect x="4" y="21" width="24" height="4" rx="2" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
];

const SCHEDULE_FORMATS: FormatOption[] = [
  {
    id: "timeline",
    label: "Timeline",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <line x1="12" y1="4" x2="12" y2="28" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <circle cx="12" cy="10" r="3" fill="currentColor" />
        <circle cx="12" cy="19" r="3" fill="currentColor" opacity="0.5" />
        <rect x="17" y="8" width="11" height="2.5" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="17" y="17" width="11" height="2.5" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "cards",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="6" width="11" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="6" width="11" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="9" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
        <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
        <rect x="19" y="9" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
        <rect x="19" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
];

const TRAVEL_FORMATS: FormatOption[] = [
  {
    id: "cards",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="6" width="11" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="6" width="11" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="9" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
        <rect x="6" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
        <rect x="19" y="9" width="7" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
        <rect x="19" y="12" width="5" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "list",
    label: "List",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="7" width="24" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="4" y="15" width="24" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <rect x="4" y="23" width="24" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      </svg>
    ),
  },
];

const TIDBITS_FORMATS: FormatOption[] = [
  {
    id: "card",
    label: "Cards",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="3" y="6" width="12" height="12" rx="2" fill="currentColor" opacity="0.8" />
        <rect x="17" y="6" width="12" height="12" rx="2" fill="currentColor" opacity="0.4" />
        <rect x="3" y="20" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="17" y="20" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
  {
    id: "bordered",
    label: "Bordered",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="3" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="20" width="12" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="17" y="20" width="12" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "flat",
    label: "Flat",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <rect x="4" y="8" width="24" height="2" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="4" y="14" width="18" height="1.5" rx="0.75" fill="currentColor" opacity="0.4" />
        <rect x="4" y="20" width="24" height="2" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="4" y="26" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "numbered",
    label: "Numbered",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="size-6">
        <text x="3" y="15" fontSize="12" fontWeight="700" fill="currentColor" opacity="0.8">01</text>
        <rect x="17" y="7" width="11" height="2" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="17" y="11" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
        <text x="3" y="27" fontSize="12" fontWeight="700" fill="currentColor" opacity="0.4">02</text>
        <rect x="17" y="19" width="11" height="2" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="17" y="23" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.2" />
      </svg>
    ),
  },
];

export const FORMAT_OPTIONS: Record<string, FormatOption[]> = {
  faq: FAQ_FORMATS,
  schedule: SCHEDULE_FORMATS,
  travel: TRAVEL_FORMATS,
  tidbits: TIDBITS_FORMATS,
};

export const FORMAT_DEFAULTS: Record<string, string> = {
  faq: "list",
  schedule: "timeline",
  travel: "cards",
  tidbits: "card",
};

interface Props {
  blockType: string;
  value: string | null;
  onChange: (id: string) => void;
}

export function FormatPopover({ blockType, value, onChange }: Props) {
  const options = FORMAT_OPTIONS[blockType] ?? [];
  const defaultId = FORMAT_DEFAULTS[blockType] ?? options[0]?.id;
  const active = value ?? defaultId;

  return (
    <div className="w-56">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Layout Format
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-label={opt.label}
            aria-pressed={active === opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-colors",
              "hover:border-primary/50 hover:bg-accent",
              active === opt.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            <span className={cn("transition-colors", active === opt.id ? "text-primary" : "text-muted-foreground")}>
              {opt.icon}
            </span>
            <span className="text-[10px] font-medium leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
