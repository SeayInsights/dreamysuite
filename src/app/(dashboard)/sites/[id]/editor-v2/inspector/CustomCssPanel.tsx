"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { sanitizeCss } from "@/lib/cssSanitize";

export function CustomCssPanel({ blockId }: { blockId: string }) {
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const block = blocks.find((b) => b.id === blockId);
	const cfg = parseCfg(block?.config);

	const raw = typeof cfg.customCss === "string" ? cfg.customCss : "";
	const [draft, setDraft] = useState(raw);
	const [errors, setErrors] = useState<string[]>([]);
	const styleRef = useRef<HTMLStyleElement | null>(null);

	useEffect(() => {
		setDraft(raw);
	}, [raw]);

	const apply = useCallback(
		(value: string) => {
			const { css, errors: lintErrors } = sanitizeCss(value);
			setErrors(lintErrors);

			const scoped = css
				.split("}")
				.map((rule) => {
					const trimmed = rule.trim();
					if (!trimmed) return "";
					return `[data-block-id="${blockId}"] ${trimmed}}`;
				})
				.join("\n");

			if (!styleRef.current) {
				styleRef.current = document.createElement("style");
				styleRef.current.setAttribute("data-custom-css", blockId);
				document.head.appendChild(styleRef.current);
			}
			styleRef.current.textContent = scoped;

			const blk = useEditorStore.getState().blocks.find((b) => b.id === blockId);
			const current = parseCfg(blk?.config);
			updateBlock(blockId, { config: { ...current, customCss: value } });
		},
		[blockId, updateBlock],
	);

	useEffect(() => {
		return () => {
			if (styleRef.current) {
				styleRef.current.remove();
				styleRef.current = null;
			}
		};
	}, [blockId]);

	useEffect(() => {
		if (raw) apply(raw);
	}, [blockId]);

	return (
		<div className="space-y-2 border-t border-border pt-4">
			<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
				Custom CSS
			</p>
			<textarea
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={() => apply(draft)}
				placeholder={".inner { color: red; }"}
				rows={5}
				spellCheck={false}
				className="w-full rounded border border-input bg-background px-2 py-1.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
			/>
			{errors.length > 0 && (
				<div className="space-y-0.5">
					{errors.map((err, i) => (
						<p key={i} className="text-[10px] text-destructive">{err}</p>
					))}
				</div>
			)}
			<p className="text-[10px] text-muted-foreground">
				Scoped to this block. No @import or external URLs.
			</p>
		</div>
	);
}
