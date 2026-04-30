import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function SpacerBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const height = Math.max(0, Math.min(400, Number(cfg.height ?? 60)));

  return (
    <div
      className="block-spacer"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
