"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { EditorV2Site } from "./EditorShell";
import { BreakpointToggle } from "./topbar/BreakpointToggle";
import { InspectorToggle } from "./topbar/InspectorToggle";
import { ModeToggle } from "./topbar/ModeToggle";
import { UndoRedo } from "./topbar/UndoRedo";
import { PreviewButton } from "./topbar/PreviewButton";
import { SaveStatus } from "./topbar/SaveStatus";
import { PublishButton } from "./topbar/PublishButton";

interface Props {
  site: EditorV2Site;
}

export function TopBar({ site }: Props) {
  return (
    <header
      data-topbar
      className="relative z-[var(--z-chrome)] flex h-12 shrink-0 items-center gap-3 border-b border-border bg-white px-3"
      aria-label="Editor top bar"
    >
      {/* Left cluster: back + site name */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0 truncate text-sm font-medium" title={site.name}>
          {site.name}
        </div>
        <SaveStatus />
      </div>

      {/* Center cluster: breakpoint toggle */}
      <div className="flex flex-1 items-center justify-center">
        <BreakpointToggle />
      </div>

      {/* Right cluster: mode / undo-redo / inspector / preview / publish */}
      <div className="flex items-center gap-2">
        <ModeToggle />
        <div className="h-6 w-px bg-border" aria-hidden />
        <UndoRedo />
        <InspectorToggle />
        <PreviewButton siteId={site.id} />
        <PublishButton siteId={site.id} />
      </div>
    </header>
  );
}
