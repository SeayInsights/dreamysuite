import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface FaqItem {
  id?: string;
  question?: string;
  answer?: string;
  category?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

export function FaqBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Frequently Asked Questions");
  const items: FaqItem[] = Array.isArray(cfg.items) ? cfg.items as FaqItem[] : [];

  return (
    <section
      className="block block-faq"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {items.length === 0 ? (
        <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem" }}>
          Add questions in the Content panel
        </p>
      ) : (
        <dl className="faq-list" style={{ maxWidth: "720px", margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{ marginBottom: "1.5rem" }}>
              <dt className="faq-question" style={{ fontWeight: 600, marginBottom: "0.375rem" }}>
                {item.question || <span style={{ color: "#9b8e85", fontStyle: "italic" }}>Question</span>}
              </dt>
              <dd className="faq-answer" style={{ margin: 0, color: "#4a4540", lineHeight: 1.6 }}>
                {item.answer || <span style={{ color: "#9b8e85", fontStyle: "italic" }}>Answer</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
