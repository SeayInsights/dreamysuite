"use client";

import { Globe, Check, Copy } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useClipboard } from "@/lib/hooks";
import { SitePhotoPicker } from "../SitePhotoPicker";
import { FormInput } from "../inspector/FormInput";
import { PanelHeader } from "./SettingsPanelHeader";

export function DomainPanel({ onBack }: { onBack: () => void }) {
	const slug = useEditorStore((s) => s.siteSlug);
	const customDomain = useEditorStore((s) => s.siteCustomDomain);
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const subdomain = slug ? `${slug}.dreamysuite.com` : null;
	const { copied, copy } = useClipboard({ resetDelay: 1500 });

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
									onClick={() => copy(`https://${subdomain}`)}
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

					<div className="flex flex-col gap-3 border-t border-border pt-3">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							SEO & Social
						</label>

						<FormInput
							mode="page"
							type="text"
							label="Page Title"
							value={settings.seoTitle ?? ""}
							onChange={(v) => updateSettings({ seoTitle: v || null })}
							placeholder="Custom page title"
							maxLength={60}
							helpText="Appears in browser tabs and search results (60 characters max)"
						/>

						<FormInput
							mode="page"
							type="textarea"
							label="Meta Description"
							value={settings.seoDescription ?? ""}
							onChange={(v) => updateSettings({ seoDescription: v || null })}
							placeholder="A brief description for search engines"
							maxLength={160}
							helpText="Brief description for search engines and social shares (160 characters max)"
						/>

						<div className="flex flex-col gap-1">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Social Image (OG)
							</label>
							<SitePhotoPicker
								value={settings.ogImage ?? null}
								onChange={(v) => updateSettings({ ogImage: v })}
							/>
							<p className="text-xs leading-normal text-muted-foreground">
								Image shown when your site is shared on social media (1200x630px recommended)
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
