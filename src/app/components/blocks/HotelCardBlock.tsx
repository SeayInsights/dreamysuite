import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { CardEffectWrapper } from "@/app/components/CardEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function HotelCardBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const name = String(cfg.name ?? cfg.title ?? "Hotel");
  const address = String(cfg.address ?? "");
  const url = String(cfg.url ?? "");
  const note = String(cfg.note ?? "");
  const imageUrl = cfg.imageUrl as string | undefined;

  return (
    <section className="block block-hotel-card" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <TextEffectWrapper as="h2" className="section-heading">Hotels &amp; Accommodations</TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />
      <CardEffectWrapper>
        <div className="info-card" style={{ textAlign: "center" }}>
          {imageUrl && <img src={imageUrl} alt={name} style={{ maxWidth: "200px", borderRadius: "8px", marginBottom: "0.75rem" }} />}
          <p className="card-title">{name}</p>
          {address && <p className="card-note">{address}</p>}
          {note && <p className="card-note">{note}</p>}
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="card-link" style={{ color: "var(--accent, #B8921A)" }}>Book Now</a>}
        </div>
      </CardEffectWrapper>
    </section>
  );
}
