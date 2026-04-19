import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface FunFactItem {
  id?: string;
  icon?: string;
  title?: string;
  body?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

function cardBorderStyle(cardStyle: string): React.CSSProperties {
  if (cardStyle === "bordered") return { border: "1px solid #d4cfc9", borderRadius: "8px", padding: "1.25rem", background: "transparent" };
  if (cardStyle === "flat") return { padding: "0.75rem 0" };
  // default "card"
  return { background: "#fff", border: "1px solid #e8e3dd", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
}

function columnsValue(columns: string): string {
  if (columns === "2") return "repeat(2, 1fr)";
  if (columns === "3") return "repeat(3, 1fr)";
  return "repeat(auto-fill, minmax(220px, 1fr))";
}

export function FunFactsBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Fun Facts About Us");
  const columns = String(cfg.columns ?? "auto");
  const cardStyle = String(cfg.cardStyle ?? "card");
  const items: FunFactItem[] = Array.isArray(cfg.items) ? cfg.items as FunFactItem[] : [];

  return (
    <section
      className="block block-tidbits"
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
          Add fun facts in the Content panel
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: columnsValue(columns),
          gap: "1.25rem",
          maxWidth: "900px",
          margin: "2rem auto 0",
        }}>
          {items.map((item, i) => (
            <div key={item.id ?? i} style={cardBorderStyle(cardStyle)}>
              {item.icon && (
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
              )}
              {item.title && (
                <h4
                  style={{ margin: "0 0 0.375rem", fontSize: "0.95rem", fontWeight: 600 }}
                  data-editable-item-index={i}
                  data-editable-item-field="title"
                  data-editable-array-key="items"
                >
                  {item.title}
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
              {!item.title && !item.body && !item.icon && (
                <span style={{ color: "#9b8e85", fontStyle: "italic", fontSize: "0.85rem" }}>Empty fact</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
