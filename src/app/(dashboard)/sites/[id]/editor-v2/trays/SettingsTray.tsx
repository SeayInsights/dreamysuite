"use client";

import { useState } from "react";
import { Globe, Users, Shield, UsersRound, ChevronRight, type LucideIcon } from "lucide-react";

import { DomainPanel } from "./SettingsDomain";
import { CollaboratorsPanel } from "./SettingsCollaborators";
import { PrivacyPanel } from "./SettingsPrivacy";
import { GuestsPanel } from "./SettingsGuests";

type PanelId = "domain" | "collaborators" | "privacy" | "guests";

const SETTINGS: { id: PanelId; label: string; hint: string; Icon: LucideIcon }[] = [
	{ id: "domain", label: "Domain", hint: "Custom URL + subdomain", Icon: Globe },
	{ id: "collaborators", label: "Collaborators", hint: "Invite editors", Icon: Users },
	{ id: "privacy", label: "Privacy", hint: "Visibility + password", Icon: Shield },
	{ id: "guests", label: "Guests", hint: "RSVP & guest list", Icon: UsersRound },
];

export function SettingsTray() {
	const [panel, setPanel] = useState<PanelId | null>(null);

	if (panel === "domain") return <DomainPanel onBack={() => setPanel(null)} />;
	if (panel === "collaborators") return <CollaboratorsPanel onBack={() => setPanel(null)} />;
	if (panel === "privacy") return <PrivacyPanel onBack={() => setPanel(null)} />;
	if (panel === "guests") return <GuestsPanel onBack={() => setPanel(null)} />;

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
						onClick={() => setPanel(id)}
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
		</div>
	);
}
