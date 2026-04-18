import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { CardEffectWrapper } from "@/app/components/CardEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function VenueMapBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const embedUrl = String(cfg.embedUrl ?? cfg.mapUrl ?? "");
  const venueName = String(cfg.name || cfg.venueName || "");

  return (
    <section className="block block-venue-map" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <TextEffectWrapper as="h2" className="section-heading" style={{ textAlign: "center" }}>Venue</TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />
      <CardEffectWrapper>
        {venueName && (
          <p className="venue-name">{venueName}</p>
        )}
        {embedUrl ? (
          <div style={{ borderRadius: "8px", overflow: "hidden" }}>
            <iframe
              src={embedUrl}
              title={`Map of ${venueName || "Venue"}`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
            Add a map embed URL to show the venue location.
          </p>
        )}
      </CardEffectWrapper>
    </section>
  );
}
