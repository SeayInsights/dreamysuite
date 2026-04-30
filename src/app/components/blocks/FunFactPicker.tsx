"use client";
import { useEditorStore } from "@/app/stores/editorStore";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FACTS_PROMPTS = [
  "How did you meet?",
  "Who said I love you first?",
  "First date?",
  "What's your song?",
  "Favorite thing about each other?",
  "Who's the better cook?",
  "Most memorable trip together?",
  "What do you argue about most?",
  "Hidden talent your partner has?",
  "Favorite movie to watch together?",
  "Who takes longer to get ready?",
  "What's your couple nickname?",
  "Best gift you've given each other?",
  "What made you say 'they're the one'?",
  "Guilty pleasure you share?",
];

const FAQ_PROMPTS = [
  "Will the ceremony and reception be socially distanced?",
  "How will food and drinks be served?",
  "Are masks required? Will they be provided?",
  "Will you live stream your ceremony?",
  "Will the reception be live streamed?",
  "How do I access the live stream?",
  "What time does the live stream start and end?",
  "Can we interact or give a toast via the livestream?",
  "When is the RSVP deadline?",
  "Can I bring a date?",
  "Are kids welcome?",
  "Will you have babysitters on the premises?",
  "Will food be served?",
  "What if I have a dietary restriction?",
  "What time should I arrive?",
  "Where should I park?",
  "Will I have to pay for parking?",
  "Are the ceremony and reception locations wheelchair accessible?",
  "Is there transportation being provided between reception and hotels?",
  "I am coming from out of town. Where should I stay?",
  "Does your wedding have a theme?",
  "What is a handfasting ceremony?",
  "What is a commitment ceremony?",
  "What is a collaring ceremony?",
  "Is the wedding indoors or outdoors?",
  "What should I wear?",
  "What kind of shoes should/shouldn't I wear?",
  "Will there be dancing?",
  "Will there be any activities happening that I need to know about?",
  "Is it okay to take pictures with our phones and cameras during the wedding?",
  "Will I get a chance to take professional photos with the couple?",
  "What should/could I do between the ceremony and the reception?",
  "What time will the reception end?",
  "Is there a gifts registry?",
  "What if I want to donate my services to a cause instead of give a gift?",
  "Are there any colors that guests should avoid wearing?",
  "How can I help the couple have the best time during their wedding day?",
  "Will last names be changing after the wedding?",
  "Can we decorate your \"Just Married\" getaway car/vehicle?",
  "Whom should I contact with questions?",
  "I have a question not answered here; how do I contact you?",
  "Is there WIFI at the venue?",
];

const TRAVEL_CATEGORIES = [
  {
    label: "Accommodations",
    items: ["Hotel", "Tents / Campsite", "House / Rental"],
  },
  {
    label: "General",
    items: ["Travel List", "Travel Note"],
  },
  {
    label: "Transportation",
    items: [
      "Flight / Airport",
      "Rental Car",
      "Taxi Service",
      "Ferry",
      "Train",
      "Shuttle Schedule",
    ],
  },
];

interface Props {
  open: boolean;
  onSelect: (question: string) => void;
  onCustom: () => void;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  displayMode?: string;
}

function PromptButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-2 py-1.5 text-left text-[11px] leading-snug text-foreground/80 transition-colors hover:border-primary hover:bg-accent/50"
    >
      {label}
    </button>
  );
}

function FactsBody({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-3" style={{ maxHeight: 280, overflowY: "auto" }}>
      {FACTS_PROMPTS.map((prompt) => (
        <PromptButton key={prompt} label={prompt} onClick={() => onSelect(prompt)} />
      ))}
    </div>
  );
}

function FaqBody({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5 p-3" style={{ maxHeight: 400, overflowY: "auto" }}>
      {FAQ_PROMPTS.map((prompt) => (
        <PromptButton key={prompt} label={prompt} onClick={() => onSelect(prompt)} />
      ))}
    </div>
  );
}

function TravelBody({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-1 p-3" style={{ maxHeight: 400, overflowY: "auto" }}>
      {TRAVEL_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <p className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:mt-0">
            {cat.label}
          </p>
          <div className="flex flex-col gap-1.5">
            {cat.items.map((item) => (
              <PromptButton key={item} label={item} onClick={() => onSelect(item)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const PANEL_WIDTH = 320;
const GAP = 8;

function computePosition(anchorRect: DOMRect | null | undefined) {
  if (!anchorRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as React.CSSProperties;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchorRect.bottom + GAP;
  let left = anchorRect.left + anchorRect.width / 2 - PANEL_WIDTH / 2;
  let flipAbove = false;

  if (top + 300 > vh) {
    top = anchorRect.top - GAP;
    flipAbove = true;
  }

  if (left + PANEL_WIDTH > vw) {
    left = anchorRect.right - PANEL_WIDTH;
  }
  if (left < 0) left = 0;

  return {
    position: "fixed" as const,
    top: flipAbove ? undefined : top,
    bottom: flipAbove ? vh - top : undefined,
    left,
  };
}

export function FunFactPicker({ open, onSelect, onCustom, onClose, anchorRect, displayMode }: Props) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  console.log("[FunFactPicker] displayMode prop:", displayMode);

  const pos = computePosition(anchorRect);

  const isFaq = displayMode === "faq";
  const isTravel = displayMode === "travel";
  const isFacts = displayMode === "facts";

  const subtitle = isFaq
    ? "Or write your own FAQ"
    : isTravel
      ? "Or add your own"
      : isFacts
        ? "Or write your own fun fact"
        : "Add a custom card";

  const customLabel = isFaq
    ? "Add Your Own FAQ"
    : isTravel
      ? "Add Your Own"
      : "Add Your Own";

  return createPortal(
    <div
      ref={panelRef}
      className="z-[9999] w-80 rounded-lg border border-border bg-popover shadow-lg"
      style={pos}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">Pick a prompt</p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      {isFaq ? (
        <FaqBody onSelect={onSelect} />
      ) : isTravel ? (
        <TravelBody onSelect={onSelect} />
      ) : isFacts ? (
        <FactsBody onSelect={onSelect} />
      ) : null}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onCustom}
          className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {customLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
