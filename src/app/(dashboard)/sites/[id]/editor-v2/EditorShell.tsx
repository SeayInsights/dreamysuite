"use client";

import { useRef, type ReactNode } from "react";

import { IconRail } from "./IconRail";
import { SlideTray } from "./SlideTray";
import { TopBar } from "./TopBar";
import { BreakpointFrame } from "./BreakpointFrame";
import { SelectionLayer } from "./SelectionLayer";
import { Inspector } from "./Inspector";
import { Breadcrumb } from "./Breadcrumb";
import { useSelection } from "./hooks/useSelection";
import { useShortcuts } from "./hooks/useShortcuts";

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
 *   - IconRail         (Task 7)
 *   - SlideTray        (Task 7)
 *   - BreakpointFrame  (Task 10)
 *   - SelectionLayer   (Task 10)
 *   - Inspector        (Task 11)
 *   - Breadcrumb       (Task 11)
 *
 * Gated by NEXT_PUBLIC_EDITOR_V2 at src/lib/flags.ts.
 */
export function EditorShell({ site, user, children }: Props) {
	useShortcuts();
	return (
		<div className="fixed inset-0 flex flex-col bg-background text-foreground antialiased">
			<div className="pointer-events-none absolute right-3 top-3 z-30 rounded-md bg-neutral-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
				Editor V2
			</div>

			<TopBar site={site} />

			<div className="relative flex flex-1 overflow-hidden">
				<IconRail />
				<SlideTray />

				<main className="relative flex-1">
					{children ?? <StubCanvas site={site} user={user} />}
					<Breadcrumb />
				</main>

				<Inspector />
			</div>
		</div>
	);
}

function StubCanvas({ site, user }: { site: EditorV2Site; user: EditorV2User }) {
	const frameRef = useRef<HTMLDivElement>(null);
	const { select, hover, clear } = useSelection();

	return (
		<div className="relative h-full w-full">
			<BreakpointFrame>
				<div
					ref={frameRef}
					className="relative h-full w-full"
					onClick={(e) => {
						const target = e.target as HTMLElement;
						const id = target.closest<HTMLElement>("[data-block-id]")?.dataset
							.blockId;
						if (id) select(id);
						else clear();
					}}
					onMouseMove={(e) => {
						const target = e.target as HTMLElement;
						const id = target.closest<HTMLElement>("[data-block-id]")?.dataset
							.blockId;
						hover(id ?? null);
					}}
					onMouseLeave={() => hover(null)}
				>
					<div className="flex flex-col items-center gap-8 p-12">
						<div className="text-center">
							<div className="text-xs uppercase tracking-widest text-muted-foreground">
								Canvas preview
							</div>
							<div className="mt-2 text-xl font-semibold">{site.name}</div>
							<div className="mt-1 text-sm text-muted-foreground">
								Shared site renderer mounts here in Phase 3.
							</div>
							<div className="mt-3 text-[11px] text-muted-foreground/80">
								Signed in as {user.email}
							</div>
						</div>

						<StubBlock id="stub-hero" type="Hero" />
						<StubBlock id="stub-rsvp" type="RSVP" />
						<StubBlock id="stub-gallery" type="Gallery" />
					</div>

					<SelectionLayer frameRef={frameRef} />
				</div>
			</BreakpointFrame>
		</div>
	);
}

function StubBlock({ id, type }: { id: string; type: string }) {
	return (
		<div
			data-block-id={id}
			data-block-type={type}
			data-block-label={type}
			className="w-full max-w-lg cursor-pointer rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
		>
			{type} block (stub)
		</div>
	);
}
