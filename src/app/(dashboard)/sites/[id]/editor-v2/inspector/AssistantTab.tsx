"use client";

import { Sparkles } from "lucide-react";

/**
 * AI Assistant slot — UI shell only.
 *
 * The provider interface (`src/lib/ai`) is already in place. Wiring, model
 * selection, and BYO-key settings land in the dedicated AI sprint documented in
 * memory (project_dreamysuite_ai_strategy).
 */
export function AssistantTab() {
	return (
		<div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
				<Sparkles className="size-5" />
			</div>
			<div className="text-sm font-medium">Assistant — coming soon</div>
			<p className="text-xs text-muted-foreground">
				Draft copy, suggest layouts, and generate imagery. Bring your own key
				or use the bundled free tier.
			</p>
		</div>
	);
}
