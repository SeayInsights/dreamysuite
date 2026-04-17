import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function HotelCardBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const name = String(cfg.name ?? cfg.title ?? "Hotel");
  const address = String(cfg.address ?? "");
  const url = String(cfg.url ?? "");
  const imageUrl = cfg.imageUrl as string | undefined;

  return (
    <section className="block block-hotel-card" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <div style={{ textAlign: "center", padding: "1.5rem" }}>
        {imageUrl && <img src={imageUrl} alt={name} style={{ maxWidth: "200px", borderRadius: "8px", marginBottom: "0.75rem" }} />}
        <h3 style={{ margin: "0 0 0.25rem" }}>{name}</h3>
        {address && <p style={{ color: "#9b8e85", margin: "0 0 0.5rem", fontSize: "0.875rem" }}>{address}</p>}
        {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #B8921A)" }}>Book Now</a>}
      </div>
    </section>
  );
}
