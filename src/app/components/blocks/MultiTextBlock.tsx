import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function MultiTextBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const mode = String(cfg.mode ?? "text");
  const heading = String(cfg.heading ?? "");
  const body = String(cfg.body ?? cfg.text ?? "");

  const labels: Record<string, string> = {
    text: "Text / List", schedule: "Schedule", faq: "Q & A",
    tidbits: "Fun Facts", travel: "Travel Info",
  };

  return (
    <section className="block block-text" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      <TextEffectWrapper
        as="h2"
        className="section-heading"
        {...editableProps(cfg, "heading")}
      >
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />
      <div className="text-body">
        <p {...editableProps(cfg, "body", { whiteSpace: "pre-wrap" })}>
          {body || (
            <span style={{ color: "#9b8e85", fontStyle: "italic" }}>
              {labels[mode] ?? "Text"} content will appear here.
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
