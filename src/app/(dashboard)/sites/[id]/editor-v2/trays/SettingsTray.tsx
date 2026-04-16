"use client";

export function SettingsTray() {
	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Settings
			</h2>
			<p className="text-sm text-muted-foreground">
				Site setup moves in from the V1 left nav during the cutover phase.
			</p>
		</div>
	);
}
