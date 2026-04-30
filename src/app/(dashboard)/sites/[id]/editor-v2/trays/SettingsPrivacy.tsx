"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { PanelHeader } from "./SettingsPanelHeader";

export function PrivacyPanel({ onBack }: { onBack: () => void }) {
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
