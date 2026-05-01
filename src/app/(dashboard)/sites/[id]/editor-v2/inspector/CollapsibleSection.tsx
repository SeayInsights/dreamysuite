"use client";

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const open = useEditorStore((s) => s.openSections[title] ?? false);
  const toggleSection = useEditorStore((s) => s.toggleSection);
  const setSectionOpen = useEditorStore((s) => s.setSectionOpen);

  useEffect(() => {
    if (defaultOpen && !(title in useEditorStore.getState().openSections)) {
      setSectionOpen(title, true);
    }
  }, [title, defaultOpen, setSectionOpen]);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => toggleSection(title)}
        className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-accent/40 transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && <div className="px-4 pb-3 pt-1">{children}</div>}
    </div>
  );
}
