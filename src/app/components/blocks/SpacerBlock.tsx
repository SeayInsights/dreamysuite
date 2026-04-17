import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function SpacerBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const height = String(cfg.height ?? "2rem");

  return (
    <section
      className="block block-spacer"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ height, ...blockSectionStyle(cfg) }}
      aria-hidden="true"
    />
  );
}
