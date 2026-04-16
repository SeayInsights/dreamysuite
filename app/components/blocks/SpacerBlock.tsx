interface Block { id: string; type: string; [key: string]: unknown }

export function SpacerBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const height = String(cfg.height ?? "2rem");

  return (
    <section
      className="block block-spacer"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ height }}
      aria-hidden="true"
    />
  );
}
