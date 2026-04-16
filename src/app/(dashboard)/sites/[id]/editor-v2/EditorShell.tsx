"use client";

import type { ReactNode } from "react";

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
 * V2 editor shell — scaffold only.
 *
 * This is the root chrome container for the overhauled editor. Shell sub-
 * components (icon rail, top bar, inspector, breadcrumb) land in Phase 2.
 * Canvas + direct-manipulation land in Phase 3.
 *
 * Visible indicators while scaffolded:
 *   - "EDITOR V2" watermark top-right
 *   - Site name + status line in the center
 *
 * Gated by NEXT_PUBLIC_EDITOR_V2 feature flag — see src/lib/flags.ts.
 */
export function EditorShell({ site, user, children }: Props) {
	return (
		<div className="fixed inset-0 flex flex-col bg-neutral-50 text-neutral-900 antialiased">
			<div className="pointer-events-none absolute right-3 top-3 rounded-md bg-neutral-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm">
				Editor V2
			</div>

			<div className="flex flex-1 items-center justify-center">
				{children ?? (
					<div className="text-center">
						<div className="text-xs uppercase tracking-widest text-neutral-400">
							Scaffold
						</div>
						<div className="mt-2 text-xl font-semibold">{site.name}</div>
						<div className="mt-1 text-sm text-neutral-500">
							Shell, canvas, and inspector arrive in later phases.
						</div>
						<div className="mt-4 text-[11px] text-neutral-400">
							Signed in as {user.email}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
