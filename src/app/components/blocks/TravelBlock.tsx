import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface TravelItem {
  id?: string;
  type?: string;
  heading?: string;
  body?: string;
  linkLabel?: string;
  linkUrl?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

export function TravelBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Getting Here");
  const items: TravelItem[] = Array.isArray(cfg.items) ? cfg.items as TravelItem[] : [];

  return (
    <section
      className="block block-travel"
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
          Add travel info in the Content panel
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem",
          maxWidth: "900px",
          margin: "2rem auto 0",
        }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={{
              background: "#fff",
              border: "1px solid #e8e3dd",
              borderRadius: "10px",
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}>
              {item.type && (
                <p style={{
                  margin: 0, fontSize: "0.72rem", fontWeight: 700,
                  color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {item.type}
                </p>
              )}
              {item.heading && (
                <h4
                  style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}
                  data-editable-item-index={i}
                  data-editable-item-field="heading"
                  data-editable-array-key="items"
                >
                  {item.heading}
                </h4>
              )}
              {item.body && (
                <p
                  style={{ margin: 0, fontSize: "0.85rem", color: "#4a4540", lineHeight: 1.55 }}
                  data-editable-item-index={i}
                  data-editable-item-field="body"
                  data-editable-array-key="items"
                >
                  {item.body}
                </p>
              )}
              {item.linkUrl && item.linkLabel && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: "0.25rem", fontSize: "0.82rem", color: "var(--accent, #B8921A)",
                    fontWeight: 600, textDecoration: "underline", alignSelf: "flex-start",
                  }}
                >
                  {item.linkLabel}
                </a>
              )}
              {!item.heading && !item.body && !item.type && (
                <span style={{ color: "#9b8e85", fontStyle: "italic", fontSize: "0.85rem" }}>Empty travel card</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
