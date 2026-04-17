"use client";

import { type ReactNode } from "react";

import { IconRail } from "./IconRail";
import { SlideTray } from "./SlideTray";
import { TopBar } from "./TopBar";
import { Inspector } from "./Inspector";
import { Breadcrumb } from "./Breadcrumb";
import { Canvas } from "./Canvas";
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

export function EditorShell({ site, user: _user, children }: Props) {
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
					{children ?? <Canvas siteId={site.id} />}
					<Breadcrumb />
				</main>

				<Inspector />
			</div>
		</div>
	);
}
