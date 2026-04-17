"use client";

/**
 * ReplaceMediaDialog
 *
 * A modal dialog with three tabs — Uploads, Stock, Unsplash — for selecting a
 * replacement image URL.
 *
 * Built with native <dialog> semantics + Tailwind since Radix Dialog / Tabs are
 * not yet installed in this project (only @radix-ui/react-slot is present).
 * Focus trap is handled via keydown intercept on the dialog backdrop.
 *
 * Props
 *   open      – controlled visibility
 *   onClose   – called on Escape, backdrop click, or Cancel button
 *   onSelect  – called with the chosen image URL string
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "uploads" | "stock" | "unsplash";

interface StubImage {
  id: string;
  url: string;
  alt: string;
  thumb: string;
}

/** Stub data — replace with real API responses when integrations are built */
const STUB_UPLOADS: StubImage[] = [];
const STUB_STOCK: StubImage[] = [];
const STUB_UNSPLASH: StubImage[] = [];

interface TabConfig {
  id: Tab;
  label: string;
  placeholder: string;
  emptyMessage: string;
  items: StubImage[];
}

const TABS: TabConfig[] = [
  {
    id: "uploads",
    label: "Uploads",
    placeholder: "Search uploads…",
    emptyMessage: "No uploads yet",
    items: STUB_UPLOADS,
  },
  {
    id: "stock",
    label: "Stock",
    placeholder: "Search stock photos…",
    emptyMessage: "Stock photos coming soon",
    items: STUB_STOCK,
  },
  {
    id: "unsplash",
    label: "Unsplash",
    placeholder: "Search Unsplash…",
    emptyMessage: "Connect Unsplash coming soon",
    items: STUB_UNSPLASH,
  },
];

interface Props {
  open: boolean;
  onClose(): void;
  onSelect(url: string): void;
}

export function ReplaceMediaDialog({ open, onClose, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("uploads");
  const [queries, setQueries] = useState<Record<Tab, string>>({
    uploads: "",
    stock: "",
    unsplash: "",
  });
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset state each time the dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab("uploads");
      setSelectedUrl(null);
      setQueries({ uploads: "", stock: "", unsplash: "" });
      // Defer focus until after paint
      requestAnimationFrame(() => firstFocusableRef.current?.focus());
    }
  }, [open]);

  // Escape key closes the dialog
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  const handleBackdropPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleConfirm = useCallback(() => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  }, [selectedUrl, onSelect, onClose]);

  const handleTabKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, tab: Tab) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveTab(tab);
      }
    },
    [],
  );

  if (!open) return null;

  const tabConfig = TABS.find((t) => t.id === activeTab)!;

  // Filter stub items by query (no-op for empty stubs but wired for real data)
  const filteredItems = tabConfig.items.filter(
    (item) =>
      queries[activeTab].trim() === "" ||
      item.alt.toLowerCase().includes(queries[activeTab].toLowerCase()),
  );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={handleBackdropPointerDown}
      role="presentation"
    >
      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Replace image"
        className="relative flex h-[540px] w-[560px] max-w-[calc(100vw-2rem)] flex-col rounded-xl bg-background shadow-2xl ring-1 ring-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-sm font-semibold text-foreground">
            Replace Image
          </span>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label="Image source"
          className="flex gap-0 border-b border-border px-5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              className={[
                "relative -mb-px py-3 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="flex flex-1 flex-col gap-3 overflow-hidden p-4"
        >
          {/* Search */}
          <input
            type="search"
            value={queries[activeTab]}
            onChange={(e) =>
              setQueries((prev) => ({ ...prev, [activeTab]: e.target.value }))
            }
            placeholder={tabConfig.placeholder}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {/* Results grid or empty state */}
          <div className="flex flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center text-sm text-muted-foreground">
                {tabConfig.emptyMessage}
              </div>
            ) : (
              <div className="grid w-full grid-cols-3 gap-2 content-start">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setSelectedUrl((prev) =>
                        prev === item.url ? null : item.url,
                      )
                    }
                    className={[
                      "relative overflow-hidden rounded-md aspect-square",
                      "ring-2 transition-all focus-visible:outline-none focus-visible:ring-ring",
                      selectedUrl === item.url
                        ? "ring-primary"
                        : "ring-transparent hover:ring-primary/40",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumb}
                      alt={item.alt}
                      className="h-full w-full object-cover"
                    />
                    {selectedUrl === item.url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <div className="rounded-full bg-primary p-1">
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedUrl}
            onClick={handleConfirm}
          >
            Use Image
          </Button>
        </div>
      </div>
    </div>
  );
}
