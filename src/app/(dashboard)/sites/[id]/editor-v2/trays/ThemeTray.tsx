"use client";

export function ThemeTray() {
	return (
		<div className="flex h-full flex-col p-4">
			<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Theme
			</h2>
			<p className="text-sm text-muted-foreground">
				Theme tokens (colors, typography) land in Phase 7.
			</p>
		</div>
	);
}
