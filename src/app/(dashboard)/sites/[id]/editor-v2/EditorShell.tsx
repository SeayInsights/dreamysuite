"use client";

import { type ReactNode, useEffect } from "react";

import { IconRail } from "./IconRail";
import { SlideTray } from "./SlideTray";
import { TopBar } from "./TopBar";
import { Inspector } from "./Inspector";
import { Breadcrumb } from "./Breadcrumb";
import { Canvas } from "./Canvas";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { useShortcuts } from "./hooks/useShortcuts";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useEditorStore } from "@/app/stores/editorStore";
import {
  trackEditorMount,
  flushEditorTelemetry,
} from "@/lib/telemetry/editor";

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
	useSettingsSync(site.id);
	const setSiteId = useEditorStore((s) => s.setSiteId);
	const setSiteMeta = useEditorStore((s) => s.setSiteMeta);

	useEffect(() => {
		setSiteId(site.id);
		setSiteMeta({ slug: site.slug, customDomain: site.customDomain, eventType: site.eventType });
		trackEditorMount(site.id);
		return () => flushEditorTelemetry();
	}, [site.id, site.slug, site.customDomain, site.eventType, setSiteId, setSiteMeta]);

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
					<EditorErrorBoundary siteId={site.id}>
						{children ?? <Canvas siteId={site.id} />}
					</EditorErrorBoundary>
					<Breadcrumb />
				</main>

				<Inspector />
			</div>
		</div>
	);
}
