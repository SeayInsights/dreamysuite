"use client";

import { Monitor, Tablet, Smartphone, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";

type Item = { id: Breakpoint; label: string; Icon: LucideIcon };

const ITEMS: Item[] = [
	{ id: "desktop", label: "Desktop", Icon: Monitor },
	{ id: "tablet", label: "Tablet", Icon: Tablet },
	{ id: "mobile", label: "Mobile", Icon: Smartphone },
];

export function BreakpointToggle() {
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const setBreakpoint = useEditorStore((s) => s.setBreakpoint);
	const selectBlock = useEditorStore((s) => s.selectBlock);

	return (
		<div
			role="radiogroup"
			aria-label="Breakpoint"
			className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5"
		>
			{ITEMS.map(({ id, label, Icon }) => {
				const active = breakpoint === id;
				return (
					<button
						key={id}
						type="button"
						role="radio"
						aria-checked={active}
						aria-label={label}
						title={label}
						onClick={() => { setBreakpoint(id); selectBlock(null); }}
						className={cn(
							"flex h-7 w-8 items-center justify-center rounded-sm transition-colors",
							active
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground hover:bg-accent/50",
						)}
					>
						<Icon className="size-4" />
					</button>
				);
			})}
		</div>
	);
}
