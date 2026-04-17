"use client";

import {
	Globe,
	Search,
	Users,
	Shield,
	ChevronRight,
	type LucideIcon,
} from "lucide-react";

type SettingItem = { id: string; label: string; hint: string; Icon: LucideIcon };

const SETTINGS: SettingItem[] = [
	{ id: "domain", label: "Domain", hint: "Custom URL + subdomain", Icon: Globe },
	{ id: "seo", label: "SEO", hint: "Title, description, preview", Icon: Search },
	{ id: "guests", label: "Guest access", hint: "Invitations and roles", Icon: Users },
	{ id: "privacy", label: "Privacy", hint: "Visibility + password", Icon: Shield },
];

export function SettingsTray() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Settings
				</h2>
			</div>

			<nav className="flex-1 overflow-y-auto p-2">
				{SETTINGS.map(({ id, label, hint, Icon }) => (
					<button
						key={id}
						type="button"
						className="group flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent/30"
					>
						<Icon className="size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0 flex-1">
							<div className="text-sm text-foreground">{label}</div>
							<div className="truncate text-xs text-muted-foreground">{hint}</div>
						</div>
						<ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
					</button>
				))}
			</nav>

			<div className="border-t border-border px-4 py-3">
				<p className="text-[11px] text-muted-foreground">
					Full settings migrate in during cutover
				</p>
			</div>
		</div>
	);
}
