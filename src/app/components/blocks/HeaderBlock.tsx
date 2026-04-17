import { editableProps, parseCfg, styleFromField } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function HeaderBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const text = String(cfg.title ?? cfg.heading ?? cfg.text ?? "Section");

  // Legacy per-field style keys (titleSize, titleAlign, etc.) map onto the
  // "title" field convention so editableProps + inspector stay aligned.
  const legacyStyle = {
    ...(cfg.titleSize ? { fontSize: String(cfg.titleSize) } : {}),
    ...(cfg.titleAlign ? { textAlign: cfg.titleAlign as React.CSSProperties["textAlign"] } : {}),
    ...(cfg.titleBold ? { fontWeight: 700 } : {}),
    ...(cfg.titleItalic ? { fontStyle: "italic" as const } : {}),
    ...(cfg.titleUnderline ? { textDecoration: "underline" } : {}),
  };

  // New convention takes priority — merge with legacy fallback
  const fieldStyle = { ...legacyStyle, ...styleFromField(cfg, "title") };

  return (
    <section className="block block-header" data-block-id={block.id} data-block-type={block.type}>
      <h2
        className="section-heading"
        data-editable-field="title"
        style={fieldStyle}
      >
        {text}
      </h2>
      <div className="section-rule" aria-hidden="true" />
    </section>
  );
}
