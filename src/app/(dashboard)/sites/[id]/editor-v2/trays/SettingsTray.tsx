"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
	X,
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
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [form, setForm] = useState(BLANK);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState<{ id: string; field: string } | null>(null);
	const [editVal, setEditVal] = useState("");
	const [showCatMgr, setShowCatMgr] = useState(false);
	const [newCat, setNewCat] = useState("");
	const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
	const [renameVal, setRenameVal] = useState("");
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [search, setSearch] = useState("");
	const [filterCat, setFilterCat] = useState("");
	const [filterRsvp, setFilterRsvp] = useState("");
	const [filterCeremony, setFilterCeremony] = useState("");
	const [filterType, setFilterType] = useState("");
	const [importModal, setImportModal] = useState<{ headers: string[]; rows: Record<string, string>[]; mapping: Record<string, string> } | null>(null);
	const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
	const [importing, setImporting] = useState(false);
	const DEFAULT_CATS = ["Family","Friends","Coworkers","Wedding Party"];
	const categories: string[] = (() => { try { const p = JSON.parse(settings?.guestCategories ?? ""); return Array.isArray(p) && p.length ? p : DEFAULT_CATS; } catch { return DEFAULT_CATS; } })();
	function saveCats(cats: string[]) { updateSettings({ guestCategories: JSON.stringify(cats) }); }
	function addCat() { const t = newCat.trim(); if (!t || categories.includes(t)) return; saveCats([...categories, t]); setNewCat(""); }
	function deleteCat(i: number) { if (guests.some((g) => g.category === categories[i])) return; saveCats(categories.filter((_,j) => j !== i)); }
	function renameCat(i: number) { const t = renameVal.trim(); if (!t) return; const next = [...categories]; next[i] = t; saveCats(next); setRenamingIdx(null); }

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

	async function patchGuest(guestId: string, field: string, value: string | number) {
		if (!siteId) return;
		const prev = guests.find((g) => g.id === guestId);
		if (!prev) return;
		setGuests((gs) => gs.map((g) => g.id === guestId ? { ...g, [field]: value } : g));
		try {
			const res = await fetch(`/api/sites/${siteId}/guests/${guestId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field]: value }) });
			if (!res.ok) setGuests((gs) => gs.map((g) => g.id === guestId ? prev : g));
		} catch { setGuests((gs) => gs.map((g) => g.id === guestId ? prev : g)); }
		setEditing(null);
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
	const sel = (lbl: string, k: keyof typeof BLANK, opts: string[]) => <label className={`${LB} flex-1`}>{lbl}<select value={form[k]} onChange={set(k)} className={IN}>{opts.map((o) => <option key={o} value={o}>{o ? o[0].toUpperCase()+o.slice(1) : "— Select —"}</option>)}</select></label>;

	const TEXT_FIELDS = ["firstName","lastName","email","phone","address","invitedBy","tableNumber","giftDescription","notes"] as const;
	const DROP_FIELDS: Record<string, string[]> = { rsvpStatus: ["pending","yes","no"], invitationType: ["digital","printed","both"], ceremonyOrReception: ["ceremony","reception","both"], category: categories };

	function cell(g: Guest, field: string, display: ReactNode, tdClass = "px-2 py-1.5") {
		const isEditing = editing?.id === g.id && editing?.field === field;
		const startEdit = () => { setEditing({ id: g.id, field }); setEditVal(String((g as unknown as Record<string, unknown>)[field] ?? "")); };
		if (isEditing && TEXT_FIELDS.includes(field as typeof TEXT_FIELDS[number])) {
			return <td key={field} className={tdClass}><input autoFocus className="w-full rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none" value={editVal} onChange={(e) => setEditVal(e.target.value)} onBlur={() => patchGuest(g.id, field, editVal)} onKeyDown={(e) => { if (e.key==="Enter") { e.currentTarget.blur(); } else if (e.key==="Escape") setEditing(null); }} /></td>;
		}
		if (isEditing && field in DROP_FIELDS) {
			const opts = DROP_FIELDS[field]!;
			return <td key={field} className={tdClass}><select autoFocus className="rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none" value={editVal} onChange={(e) => { patchGuest(g.id, field, e.target.value); }} onBlur={() => setEditing(null)} onKeyDown={(e) => { if (e.key==="Escape") setEditing(null); }}>{opts.map((o) => <option key={o} value={o}>{o[0].toUpperCase()+o.slice(1)}</option>)}</select></td>;
		}
		return <td key={field} className={`${tdClass} cursor-pointer`} onClick={startEdit}>{display}</td>;
	}

	const filtered = useMemo(() => {
		let list = guests;
		if (search) list = list.filter((g) => `${g.firstName} ${g.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase()));
		if (filterCat) list = list.filter((g) => g.category === filterCat);
		if (filterRsvp) list = list.filter((g) => g.rsvpStatus === filterRsvp);
		if (filterCeremony) list = list.filter((g) => g.ceremonyOrReception === filterCeremony);
		if (filterType) list = list.filter((g) => g.invitationType === filterType);
		if (sortCol) list = [...list].sort((a, b) => { const av = (a as unknown as Record<string, unknown>)[sortCol] ?? ""; const bv = (b as unknown as Record<string, unknown>)[sortCol] ?? ""; return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
		return list;
	}, [guests, search, filterCat, filterRsvp, filterCeremony, filterType, sortCol, sortDir]);

	function toggleSort(col: string) { if (col === "#") return; setSortCol((p) => { if (p === col) { setSortDir((d) => d === "asc" ? "desc" : "asc"); return col; } setSortDir("asc"); return col; }); }

	const EXPORT_FIELDS = ["firstName","lastName","email","phone","address","category","invitedBy","rsvpStatus","invitationType","ceremonyOrReception","tableNumber","giftDescription","notes"] as const;
	const GUEST_FIELDS = ["firstName","lastName","email","phone","address","category","invitedBy","ceremonyOrReception","invitationType","tableNumber","notes","giftDescription"];

	function parseCsv(text: string) {
		const lines = text.split(/\r?\n/).filter((l) => l.trim());
		const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
		const rows = lines.slice(1).map((line) => { const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, "")); const row: Record<string, string> = {}; headers.forEach((h, i) => { row[h] = vals[i] ?? ""; }); return row; });
		return { headers, rows };
	}

	function exportCsv() {
		const header = EXPORT_FIELDS.join(",");
		const csvRows = guests.map((g) => EXPORT_FIELDS.map((f) => { const v = String((g as unknown as Record<string, unknown>)[f] ?? ""); return v.includes(",") ? `"${v}"` : v; }).join(","));
		const blob = new Blob([[header, ...csvRows].join("\n")], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a"); a.href = url; a.download = "guests.csv"; a.click();
		URL.revokeObjectURL(url);
	}

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]; if (!file) return;
		e.target.value = "";
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const { headers, rows } = parseCsv(text);
			const mapping: Record<string, string> = {};
			headers.forEach((h) => { const match = GUEST_FIELDS.find((f) => f.toLowerCase() === h.toLowerCase()); mapping[h] = match ?? ""; });
			setImportModal({ headers, rows, mapping });
		};
		reader.readAsText(file);
	}

	async function submitImport() {
		if (!importModal || !siteId) return;
		setImporting(true);
		try {
			const res = await fetch(`/api/sites/${siteId}/guests/import`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows: importModal.rows, mapping: importModal.mapping }) });
			if (!res.ok) return;
			const data = (await res.json()) as { imported: number; skipped: number };
			setImportResult(data);
			const r = await fetch(`/api/sites/${siteId}/guests`);
			if (r.ok) { const d = (await r.json()) as { guests: Guest[] }; setGuests(d.guests); }
			setTimeout(() => { setImportModal(null); setImportResult(null); }, 2500);
		} finally { setImporting(false); }
	}

	const siteName = settings?.eventName ?? "Site";

	return (
		<div className="fixed inset-0 z-[10000] flex flex-col bg-background text-foreground">
			<div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
				<button type="button" onClick={onBack} className="rounded-md p-1.5 hover:bg-accent/50" aria-label="Back to editor">
					<X className="size-5 text-muted-foreground" />
				</button>
				<h1 className="flex-1 text-sm font-semibold">{siteName} — Guest List</h1>
				<button type="button" onClick={() => setShowCatMgr(true)} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30">Categories</button>
				<button type="button" onClick={exportCsv} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30">Export</button>
				<label className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent/30 cursor-pointer">Import<input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} /></label>
				<button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1 text-xs font-medium text-background hover:opacity-90"><Plus className="size-3.5" /> Add Guest</button>
			</div>
			<div className="flex items-center gap-4 border-b border-border px-4 py-2 text-xs">
				<span>Total <b>{guests.length}</b></span>
				<span style={{ color: "#166534" }}>Attending <b>{cnt((g) => g.rsvpStatus === "yes")}</b></span>
				<span style={{ color: "#991b1b" }}>Declined <b>{cnt((g) => g.rsvpStatus === "no")}</b></span>
				<span className="text-muted-foreground">Pending <b>{cnt((g) => g.rsvpStatus === "pending")}</b></span>
				<span className="text-muted-foreground">Printed <b>{cnt((g) => g.invitationType === "printed" || g.invitationType === "both")}</b></span>
			</div>
			<div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
				<input placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-ring min-w-[140px] max-w-xs flex-1" />
				<select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
				<select value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"><option value="">All RSVPs</option><option value="pending">Pending</option><option value="yes">Attending</option><option value="no">Declined</option></select>
				<select value={filterCeremony} onChange={(e) => setFilterCeremony(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"><option value="">All events</option><option value="ceremony">Ceremony</option><option value="reception">Reception</option><option value="both">Both</option></select>
				<select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"><option value="">All types</option><option value="digital">Digital</option><option value="printed">Printed</option><option value="both">Both</option></select>
			</div>
			<div className="flex-1 overflow-auto">
				{loading ? <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading...</p>
				: guests.length === 0 ? <p className="mx-3 my-3 rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">No guests yet. Click Add to get started.</p>
				: <table className="w-full border-collapse text-xs"><thead><tr className="border-b border-border bg-muted/30">{COLS.map(([k,en,vi]) => <th key={k} className={`whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground${k!=="#"?" cursor-pointer select-none hover:text-foreground":""}`} onClick={() => toggleSort(k)}>{en}{sortCol===k&&<span className="ml-0.5 text-[10px]">{sortDir==="asc"?"▲":"▼"}</span>}{lang==="vi"&&<><br/><span className="font-normal opacity-70">{vi}</span></>}</th>)}<th className="w-6 px-2 py-1.5"/></tr></thead>
				<tbody>{filtered.map((g,i) => <tr key={g.id} className="group border-b border-border/50 hover:bg-accent/20">
					<td className="px-2 py-1.5 text-muted-foreground">{i+1}</td>
					{cell(g,"firstName",<>{g.firstName} {g.lastName??""}</>,"whitespace-nowrap px-2 py-1.5")}
					{cell(g,"email",g.email??"—","max-w-[100px] truncate px-2 py-1.5")}
					{cell(g,"phone",g.phone??"—","whitespace-nowrap px-2 py-1.5")}
					{cell(g,"address",g.address??"—","max-w-[100px] truncate px-2 py-1.5")}
					{cell(g,"category",g.category??"—")}
					{cell(g,"invitedBy",g.invitedBy??"—","max-w-[80px] truncate px-2 py-1.5")}
					{cell(g,"rsvpStatus",badge(g.rsvpStatus))}
					<td className="px-2 py-1.5 cursor-pointer" onClick={() => patchGuest(g.id,"invited",g.invited===1?0:1)}>{g.invited===1?<Check className="size-3 text-green-600"/>:<span className="inline-block size-3 rounded-full border border-muted-foreground/40"/>}</td>
					{cell(g,"invitationType",g.invitationType)}
					{cell(g,"ceremonyOrReception",g.ceremonyOrReception)}
					{cell(g,"tableNumber",g.tableNumber??"—")}
					{cell(g,"giftDescription",g.giftDescription??"—","max-w-[80px] truncate px-2 py-1.5")}
					<td className="px-2 py-1.5 cursor-pointer" onClick={() => patchGuest(g.id,"thankYouSent",g.thankYouSent===1?0:1)}>{g.thankYouSent===1?<Check className="size-3 text-green-600"/>:<span className="inline-block size-3 rounded-full border border-muted-foreground/40"/>}</td>
					{cell(g,"notes",g.notes??"—","max-w-[80px] truncate px-2 py-1.5")}
					<td className="px-2 py-1.5"><button type="button" onClick={() => deleteGuest(g.id)} className="rounded p-0.5 opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3"/></button></td>
				</tr>)}</tbody></table>}
			</div>
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
					<form onSubmit={addGuest} onClick={(e) => e.stopPropagation()} className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl">
						<h3 className="text-sm font-semibold">Add Guest</h3>
						<div className="flex gap-2">{fld("First Name","firstName")}{fld("Last Name","lastName")}</div>
						{fld("Email","email","email")}
						{fld("Phone","phone","tel")}
						{sel("Category","category",["", ...categories])}
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
			{showCatMgr && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCatMgr(false)}>
					<div onClick={(e) => e.stopPropagation()} className="flex w-72 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl">
						<h3 className="text-sm font-semibold">Manage Categories</h3>
						<ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
							{categories.map((cat, i) => (
								<li key={cat} className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
									{renamingIdx === i
										? <input autoFocus className="flex-1 rounded border border-ring bg-background px-1 py-0.5 text-xs outline-none" value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onBlur={() => renameCat(i)} onKeyDown={(e) => { if (e.key==="Enter") renameCat(i); else if (e.key==="Escape") setRenamingIdx(null); }} />
										: <span className="flex-1 cursor-pointer text-sm" onClick={() => { setRenamingIdx(i); setRenameVal(cat); }}>{cat}</span>}
									<button type="button" onClick={() => deleteCat(i)} title={guests.some((g) => g.category === cat) ? "In use" : "Delete"} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-30" disabled={guests.some((g) => g.category === cat)}><Trash2 className="size-3" /></button>
								</li>
							))}
						</ul>
						<div className="flex gap-2">
							<input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key==="Enter") addCat(); }} placeholder="New category…" className={`${IN} flex-1`} />
							<button type="button" onClick={addCat} disabled={!newCat.trim()} className="flex items-center gap-1 rounded-md bg-foreground px-2 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"><Plus className="size-3" /></button>
						</div>
						<div className="flex justify-end"><button type="button" onClick={() => setShowCatMgr(false)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30">Done</button></div>
					</div>
				</div>
			)}
			{importModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setImportModal(null)}>
					<div onClick={(e) => e.stopPropagation()} className="flex w-[480px] max-w-[96vw] flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-xl max-h-[90vh] overflow-y-auto">
						<h3 className="text-sm font-semibold">Import Guests</h3>
						{importResult ? (
							<p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Imported {importResult.imported}, skipped {importResult.skipped}</p>
						) : (<>
							<div className="flex flex-col gap-1">
								<p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Preview (first 5 rows)</p>
								<div className="overflow-x-auto rounded-md border border-border">
									<table className="w-full border-collapse text-xs"><thead><tr className="bg-muted/30">{importModal.headers.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1 text-left font-medium">{h}</th>)}</tr></thead>
									<tbody>{importModal.rows.slice(0,5).map((row,i) => <tr key={i} className="border-t border-border/50">{importModal.headers.map((h) => <td key={h} className="max-w-[80px] truncate px-2 py-1">{row[h]}</td>)}</tr>)}</tbody></table>
								</div>
							</div>
							<div className="flex flex-col gap-1">
								<p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Column mapping</p>
								<div className="flex flex-col gap-1">{importModal.headers.map((h) => (
									<div key={h} className="flex items-center gap-2">
										<span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{h}</span>
										<span className="text-xs text-muted-foreground">→</span>
										<select value={importModal.mapping[h] ?? ""} onChange={(e) => setImportModal((p) => p ? { ...p, mapping: { ...p.mapping, [h]: e.target.value } } : p)} className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus:border-ring">
											<option value="">(skip)</option>{GUEST_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
										</select>
									</div>
								))}</div>
							</div>
							<div className="flex justify-end gap-2">
								<button type="button" onClick={() => setImportModal(null)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/30">Cancel</button>
								<button type="button" onClick={submitImport} disabled={importing} className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50">{importing ? "Importing…" : `Import ${importModal.rows.length} rows`}</button>
							</div>
						</>)}
					</div>
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
