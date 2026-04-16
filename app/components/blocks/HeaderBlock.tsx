interface Block { id: string; type: string; [key: string]: unknown }

export function HeaderBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const text = String(cfg.title ?? cfg.heading ?? cfg.text ?? "Section");
  const style: React.CSSProperties = {};
  if (cfg.titleSize) style.fontSize = String(cfg.titleSize);
  if (cfg.titleAlign) style.textAlign = cfg.titleAlign as React.CSSProperties["textAlign"];
  if (cfg.titleBold) style.fontWeight = 700;
  if (cfg.titleItalic) style.fontStyle = "italic";
  if (cfg.titleUnderline) style.textDecoration = "underline";

  return (
    <section className="block block-header" data-block-id={block.id} data-block-type={block.type}>
      <h2 className="section-heading" style={style}>{text}</h2>
      <div className="section-rule" aria-hidden="true" />
    </section>
  );
}
