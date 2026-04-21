"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const PROMPTS = [
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

interface Props {
  open: boolean;
  onSelect: (question: string) => void;
  onCustom: () => void;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export function FunFactPicker({ open, onSelect, onCustom, onClose, anchorRect }: Props) {
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

  const top = anchorRect ? anchorRect.bottom + 8 : "50%";
  const left = anchorRect ? anchorRect.left + anchorRect.width / 2 : "50%";

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-80 rounded-lg border border-border bg-popover shadow-lg"
      style={{
        top,
        left,
        transform: anchorRect ? "translateX(-50%)" : "translate(-50%, -50%)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">Pick a prompt</p>
        <p className="text-[10px] text-muted-foreground">Or write your own fun fact</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-3" style={{ maxHeight: 280, overflowY: "auto" }}>
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-md border border-border px-2 py-1.5 text-left text-[11px] leading-snug text-foreground/80 transition-colors hover:border-primary hover:bg-accent/50"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onCustom}
          className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Write your own
        </button>
      </div>
    </div>,
    document.body,
  );
}
