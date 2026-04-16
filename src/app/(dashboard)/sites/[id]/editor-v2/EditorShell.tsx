"use client";

import type { ReactNode } from "react";

import { IconRail } from "./IconRail";
import { SlideTray } from "./SlideTray";
import { TopBar } from "./TopBar";

export interface EditorV2Site {
	id: string;
	name: string;
	slug: string;
	customDomain: string | null;
	eventType: string | null;
	status: string;
	previewColor: string;
	updatedAt: number;
}

export interface EditorV2User {
	id: string;
	email: string;
	name?: string | null;
}

interface Props {
	site: EditorV2Site;
	user: EditorV2User;
	children?: ReactNode;
}

/**
 * V2 editor shell.
 *
 * Layout slots (filled incrementally by Phase 2 tasks):
 *   - TopBar           (Task 8)
 *   - IconRail         (Task 7, here)
 *   - SlideTray        (Task 7, here)
 *   - BreakpointFrame  (Task 10)
 *   - SelectionLayer   (Task 10)
 *   - Inspector        (Task 11)
 *   - Breadcrumb       (Task 11)
 *
 * Gated by NEXT_PUBLIC_EDITOR_V2 at src/lib/flags.ts.
 */
export function EditorShell({ site, user, children }: Props) {
	return (
		<div className="fixed inset-0 flex flex-col bg-background text-foreground antialiased">
			<div className="pointer-events-none absolute right-3 top-3 z-30 rounded-md bg-neutral-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
				Editor V2
			</div>

			<TopBar site={site} />

			<div className="relative flex flex-1 overflow-hidden">
				<IconRail />
				<SlideTray />

				<main className="relative flex-1 overflow-auto">
					{children ?? (
						<div className="flex h-full items-center justify-center">
							<div className="text-center">
								<div className="text-xs uppercase tracking-widest text-muted-foreground">
									Canvas
								</div>
								<div className="mt-2 text-xl font-semibold">{site.name}</div>
								<div className="mt-1 text-sm text-muted-foreground">
									Breakpoint frame + direct-manipulation canvas arrive in Phase 3.
								</div>
								<div className="mt-4 text-[11px] text-muted-foreground/80">
									Signed in as {user.email}
								</div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
