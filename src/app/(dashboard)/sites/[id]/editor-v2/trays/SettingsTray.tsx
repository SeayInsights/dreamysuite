"use client";

import { useEffect, useState } from "react";
import {
	Globe,
	Users,
	Shield,
	UsersRound,
	ChevronLeft,
	ChevronRight,
	Copy,
	Check,
	Plus,
	Trash2,
	Eye,
	EyeOff,
	Lock,
	type LucideIcon,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

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

function PanelHeader({ label, onBack }: { label: string; onBack: () => void }) {
	return (
		<div className="flex items-center gap-2 border-b border-border px-3 py-2">
			<button type="button" onClick={onBack} className="rounded p-0.5 hover:bg-accent/50">
				<ChevronLeft className="size-4 text-muted-foreground" />
			</button>
			<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</h2>
		</div>
	);
}

// ── Domain Panel ───────────────────────────────────────────────────────────

function DomainPanel({ onBack }: { onBack: () => void }) {
	const slug = useEditorStore((s) => s.siteSlug);
	const customDomain = useEditorStore((s) => s.siteCustomDomain);
	const [copied, setCopied] = useState(false);
	const subdomain = slug ? `${slug}.dreamysuite.com` : null;

	function copyUrl(url: string) {
		navigator.clipboard.writeText(`https://${url}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	return (
		<div className="flex h-full flex-col">
			<PanelHeader label="Domain" onBack={onBack} />
			<div className="flex-1 overflow-y-auto px-3 py-1">
				<div className="flex flex-col gap-3">
					{subdomain && (
						<div className="flex flex-col gap-1">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Subdomain
							</label>
							<div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
								<Globe className="size-3.5 shrink-0 text-muted-foreground" />
								<span className="flex-1 truncate text-sm">{subdomain}</span>
								<button
									type="button"
									onClick={() => copyUrl(subdomain)}
									className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50"
									title="Copy URL"
								>
									{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
								</button>
							</div>
						</div>
					)}

					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Custom domain
						</label>
						{customDomain ? (
							<div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
								<Globe className="size-3.5 shrink-0 text-muted-foreground" />
								<span className="flex-1 truncate text-sm">{customDomain}</span>
								<span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
									Active
								</span>
							</div>
						) : (
							<p className="rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
								No custom domain connected.
								<br />
								Set up from your dashboard settings.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ── Collaborators Panel ────────────────────────────────────────────────────

interface Invite {
	id: string;
	email: string;
	invitedBy: string;
	createdAt: number;
}

function CollaboratorsPanel({ onBack }: { onBack: () => void }) {
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

// ── Guests Panel ───────────────────────────────────────────────────────────

interface Guest { id: string; firstName: string; lastName: string | null; party: number | null; rsvpStatus: "pending" | "yes" | "no"; notes: string | null; email: string | null; phone: string | null; address: string | null; invitedBy: string | null; category: string | null; invited: number; ceremonyOrReception: string; invitationType: string; tableNumber: string | null; giftDescription: string | null; thankYouSent: number; customResponses: string | null; }

const COLS = [["#","#","#"],["firstName","Name","Tên"],["email","Email","Email"],["phone","Phone","Điện thoại"],["address","Address","Địa chỉ"],["category","Category","Nhóm"],["invitedBy","Invited By","Người mời"],["rsvpStatus","RSVP","Phản hồi"],["invited","Invite?","Mời?"],["invitationType","Type","Loại thiệp"],["ceremonyOrReception","Ceremony","Lễ"],["tableNumber","Table","Bàn"],["giftDescription","Gift","Quà tặng"],["thankYouSent","Thank You","Cảm ơn"],["notes","Notes","Ghi chú"]] as const;
const BLANK = { firstName: "", lastName: "", email: "", phone: "", category: "", invitedBy: "", ceremonyOrReception: "both", invitationType: "digital", tableNumber: "" };
const IN = "rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-ring";
const LB = "flex flex-col gap-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

function GuestsPanel({ onBack }: { onBack: () => void }) {
	const siteId = useEditorStore((s) => s.siteId);
	const lang = useEditorStore((s) => s.settings?.mainLanguage ?? "en");
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState(BLANK);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!siteId) return;
		fetch(`/api/sites/${siteId}/guests`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => setGuests((d as { guests: Guest[] }).guests))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [siteId]);

	async function deleteGuest(id: string) {
		if (!siteId) return;
		await fetch(`/api/sites/${siteId}/guests/${id}`, { method: "DELETE" });
		setGuests((prev) => prev.filter((g) => g.id !== id));
	}

	async function addGuest(e: { preventDefault(): void }) {
		e.preventDefault();
		if (!siteId) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/sites/${siteId}/guests`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
			if (!res.ok) return;
			const { guest } = (await res.json()) as { guest: Guest };
			setGuests((prev) => [guest, ...prev]);
			setShowModal(false);
			setForm(BLANK);
		} finally { setSaving(false); }
	}

	const cnt = (fn: (g: Guest) => boolean) => guests.filter(fn).length;
	const badge = (s: Guest["rsvpStatus"]) => <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: s==="yes"?"#dcfce7":s==="no"?"#fef2f2":"#f5f5f4", color: s==="yes"?"#166534":s==="no"?"#991b1b":"#78716c" }}>{s==="yes"?"Attending":s==="no"?"Declined":"Pending"}</span>;
	const set = (k: keyof typeof BLANK) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }));
	const fld = (lbl: string, k: keyof typeof BLANK, t = "text") => <label className={LB}>{lbl}<input type={t} value={form[k]} onChange={set(k)} className={IN} /></label>;
	const sel = (lbl: string, k: keyof typeof BLANK, opts: string[]) => <label className={`${LB} flex-1`}>{lbl}<select value={form[k]} onChange={set(k)} className={IN}>{opts.map((o) => <option key={o} value={o}>{o[0].toUpperCase()+o.slice(1)}</option>)}</select></label>;

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<button type="button" onClick={onBack} className="rounded p-0.5 hover:bg-accent/50"><ChevronLeft className="size-4 text-muted-foreground" /></button>
				<h2 className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guests</h2>
				<button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background hover:opacity-90"><Plus className="size-3" /> Add</button>
			</div>
			<div className="flex flex-wrap gap-x-3 border-b border-border px-3 py-1.5 text-[11px]">
				<span>Total <b>{guests.length}</b></span>
				<span style={{ color: "#166534" }}>Attending <b>{cnt((g) => g.rsvpStatus === "yes")}</b></span>
				<span style={{ color: "#991b1b" }}>Declined <b>{cnt((g) => g.rsvpStatus === "no")}</b></span>
				<span className="text-muted-foreground">Pending <b>{cnt((g) => g.rsvpStatus === "pending")}</b></span>
				<span className="text-muted-foreground">Printed <b>{cnt((g) => g.invitationType === "printed" || g.invitationType === "both")}</b></span>
			</div>
			<div className="flex-1 overflow-auto">
				{loading ? <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading...</p>
				: guests.length === 0 ? <p className="mx-3 my-3 rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">No guests yet. Click Add to get started.</p>
				: <table className="w-full border-collapse text-xs"><thead><tr className="border-b border-border bg-muted/30">{COLS.map(([k,en,vi]) => <th key={k} className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">{en}{lang==="vi"&&<><br/><span className="font-normal opacity-70">{vi}</span></>}</th>)}<th className="w-6 px-2 py-1.5"/></tr></thead>
				<tbody>{guests.map((g,i) => <tr key={g.id} className="group border-b border-border/50 hover:bg-accent/20"><td className="px-2 py-1.5 text-muted-foreground">{i+1}</td><td className="whitespace-nowrap px-2 py-1.5">{g.firstName} {g.lastName??""}</td><td className="max-w-[100px] truncate px-2 py-1.5">{g.email??"—"}</td><td className="whitespace-nowrap px-2 py-1.5">{g.phone??"—"}</td><td className="max-w-[100px] truncate px-2 py-1.5">{g.address??"—"}</td><td className="px-2 py-1.5">{g.category??"—"}</td><td className="max-w-[80px] truncate px-2 py-1.5">{g.invitedBy??"—"}</td><td className="px-2 py-1.5">{badge(g.rsvpStatus)}</td><td className="px-2 py-1.5">{g.invited===1?<Check className="size-3 text-green-600"/>:<span className="inline-block size-3 rounded-full border border-muted-foreground/40"/>}</td><td className="px-2 py-1.5">{g.invitationType}</td><td className="px-2 py-1.5">{g.ceremonyOrReception}</td><td className="px-2 py-1.5">{g.tableNumber??"—"}</td><td className="max-w-[80px] truncate px-2 py-1.5">{g.giftDescription??"—"}</td><td className="px-2 py-1.5">{g.thankYouSent===1?<Check className="size-3 text-green-600"/>:<span className="inline-block size-3 rounded-full border border-muted-foreground/40"/>}</td><td className="max-w-[80px] truncate px-2 py-1.5">{g.notes??"—"}</td><td className="px-2 py-1.5"><button type="button" onClick={() => deleteGuest(g.id)} className="rounded p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3"/></button></td></tr>)}</tbody></table>}
			</div>
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
					<form onSubmit={addGuest} onClick={(e) => e.stopPropagation()} className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl">
						<h3 className="text-sm font-semibold">Add Guest</h3>
						<div className="flex gap-2">{fld("First Name","firstName")}{fld("Last Name","lastName")}</div>
						{fld("Email","email","email")}
						{fld("Phone","phone","tel")}
						{fld("Category","category")}
						{fld("Invited By","invitedBy")}
						<div className="flex gap-2">{sel("Ceremony/Reception","ceremonyOrReception",["ceremony","reception","both"])}{sel("Invitation Type","invitationType",["digital","printed","both"])}</div>
						{fld("Table #","tableNumber")}
						<div className="flex justify-end gap-2">
							<button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30">Cancel</button>
							<button type="submit" disabled={saving||!form.firstName.trim()} className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50">{saving?"Saving…":"Add Guest"}</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

// ── Privacy Panel ──────────────────────────────────────────────────────────

function PrivacyPanel({ onBack }: { onBack: () => void }) {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const pages = useEditorStore((s) => s.pages);
	const isLive = settings.isLive === 1;
	const [showPw, setShowPw] = useState(false);

	const passwordPages: string[] = (() => {
		try {
			const parsed = JSON.parse(settings.passwordPages ?? "");
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	})();

	function togglePage(pageId: string) {
		const next = passwordPages.includes(pageId)
			? passwordPages.filter((id) => id !== pageId)
			: [...passwordPages, pageId];
		updateSettings({ passwordPages: next.length > 0 ? JSON.stringify(next) : null });
	}

	return (
		<div className="flex h-full flex-col">
			<PanelHeader label="Privacy" onBack={onBack} />
			<div className="flex-1 overflow-y-auto px-3 py-1">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center justify-between">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Site visibility
							</label>
							<button
								type="button"
								onClick={() => updateSettings({ isLive: isLive ? 0 : 1 })}
								className={
									"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors " +
									(isLive ? "bg-emerald-500" : "bg-muted-foreground/30")
								}
							>
								<span
									className={
										"inline-block size-3.5 rounded-full bg-white shadow transition-transform " +
										(isLive ? "translate-x-[18px]" : "translate-x-[3px]")
									}
								/>
							</button>
						</div>
						<div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
							{isLive ? (
								<>
									<Eye className="size-4 shrink-0 text-emerald-600" />
									<div>
										<p className="text-sm font-medium">Published</p>
										<p className="text-xs text-muted-foreground">Visitors can see your site</p>
									</div>
								</>
							) : (
								<>
									<EyeOff className="size-4 shrink-0 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Draft</p>
										<p className="text-xs text-muted-foreground">Only you and collaborators can see it</p>
									</div>
								</>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Guest password
						</label>
						<p className="text-xs text-muted-foreground">
							Require a password for visitors to view your site
						</p>
						<div className="flex items-center gap-2">
							<div className="relative flex-1">
								<Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<input
									type={showPw ? "text" : "password"}
									value={settings.guestPassword ?? ""}
									onChange={(e) =>
										updateSettings({
											guestPassword: e.target.value || null,
										})
									}
									placeholder="No password set"
									className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-8 text-sm outline-none focus:border-ring"
								/>
								<button
									type="button"
									onClick={() => setShowPw(!showPw)}
									className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
								>
									{showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
								</button>
							</div>
						</div>
						{settings.guestPassword && (
							<>
								<button
									type="button"
									onClick={() => updateSettings({ guestPassword: null, passwordPages: null })}
									className="text-xs text-destructive hover:underline"
								>
									Remove password
								</button>

								{pages.length > 0 && (
									<div className="flex flex-col gap-1 rounded-md border border-border p-2">
										<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
											Protected pages
										</label>
										<p className="text-[11px] text-muted-foreground">
											{passwordPages.length === 0
												? "All pages require the password"
												: `${passwordPages.length} page${passwordPages.length === 1 ? "" : "s"} selected`}
										</p>
										<div className="flex flex-col gap-0.5">
											{pages.map((page) => {
												const on = passwordPages.includes(page.id);
												return (
													<button
														key={page.id}
														type="button"
														onClick={() => togglePage(page.id)}
														className="flex items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-accent/30"
													>
														<span className="flex-1 truncate text-left text-sm">{page.label}</span>
														<span
															className={
																"relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors " +
																(on ? "bg-emerald-500" : "bg-muted-foreground/30")
															}
														>
															<span
																className={
																	"inline-block size-3 rounded-full bg-white shadow transition-transform " +
																	(on ? "translate-x-[13px]" : "translate-x-[2px]")
																}
															/>
														</span>
													</button>
												);
											})}
										</div>
										{passwordPages.length > 0 && (
											<button
												type="button"
												onClick={() => updateSettings({ passwordPages: null })}
												className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
											>
												Reset to all pages
											</button>
										)}
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
