"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { PanelHeader } from "./SettingsPanelHeader";

interface Invite {
	id: string;
	email: string;
	invitedBy: string;
	createdAt: number;
}

export function CollaboratorsPanel({ onBack }: { onBack: () => void }) {
	const siteId = useEditorStore((s) => s.siteId);
	const [invites, setInvites] = useState<Invite[]>([]);
	const [loading, setLoading] = useState(true);
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!siteId) return;
		fetch(`/api/sites/${siteId}/invites`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => setInvites((d as { invites: Invite[] }).invites))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [siteId]);

	async function sendInvite() {
		if (!siteId || !email.trim()) return;
		setSending(true);
		setError(null);
		try {
			const res = await fetch(`/api/sites/${siteId}/invites`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => null) as { error?: { message?: string } } | null;
				setError(data?.error?.message ?? "Failed to send invite");
				return;
			}
			const { invite } = (await res.json()) as { invite: Invite };
			setInvites((prev) => [invite, ...prev]);
			setEmail("");
		} finally {
			setSending(false);
		}
	}

	async function removeInvite(inviteId: string) {
		if (!siteId) return;
		await fetch(`/api/sites/${siteId}/invites`, {
			method: "DELETE",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ inviteId }),
		});
		setInvites((prev) => prev.filter((i) => i.id !== inviteId));
	}

	return (
		<div className="flex h-full flex-col">
			<PanelHeader label="Collaborators" onBack={onBack} />
			<div className="flex-1 overflow-y-auto px-3 py-1">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Invite by email
						</label>
						<div className="flex gap-2">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") sendInvite();
								}}
								placeholder="name@example.com"
								className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
								disabled={sending}
							/>
							<button
								type="button"
								onClick={sendInvite}
								disabled={sending || !email.trim()}
								className="flex shrink-0 items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
							>
								<Plus className="size-3.5" />
								Send
							</button>
						</div>
						{error && (
							<p className="mt-1 text-xs text-destructive">{error}</p>
						)}
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							{loading ? "Loading..." : `Invited (${invites.length})`}
						</label>
						{invites.length === 0 && !loading ? (
							<p className="rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
								No collaborators yet
							</p>
						) : (
							<ul className="flex flex-col gap-1">
								{invites.map((inv) => (
									<li
										key={inv.id}
										className="group flex items-center gap-2 rounded-md border border-border px-3 py-2"
									>
										<span className="flex-1 truncate text-sm">{inv.email}</span>
										<button
											type="button"
											onClick={() => removeInvite(inv.id)}
											className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
											title="Remove invite"
										>
											<Trash2 className="size-3.5" />
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
