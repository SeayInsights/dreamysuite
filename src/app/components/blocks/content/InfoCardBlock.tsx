import Image from "next/image";
import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { CardEffectWrapper } from "@/app/components/CardEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function InfoCardBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const variant = String(cfg.variant ?? (block.type === "hotel-card" ? "hotel" : "registry"));
  const name = String(cfg.name ?? cfg.title ?? (variant === "hotel" ? "Hotel" : "Registry"));
  const address = String(cfg.address ?? "");
  const url = String(cfg.url ?? "");
  const note = String(cfg.note ?? "");
  const imageUrl = cfg.imageUrl as string | undefined;
  const headingLabel = variant === "hotel" ? "Hotels & Accommodations" : "Registry";
  const linkLabel = variant === "hotel" ? "Book Now" : "View Registry";

  return (
    <section className="block block-info-card" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      <TextEffectWrapper as="h2" className="section-heading">{headingLabel}</TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />
      <CardEffectWrapper>
        <div className="info-card" style={{ textAlign: "center" }}>
          {imageUrl && (
            <div style={{ position: "relative", width: variant === "hotel" ? "200px" : "120px", height: variant === "hotel" ? "120px" : "80px", margin: "0 auto 0.75rem" }}>
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes={variant === "hotel" ? "200px" : "120px"}
                style={{ borderRadius: "8px", objectFit: "contain" }}
              />
            </div>
          )}
          <p className="card-title">{name}</p>
          {address && <p className="card-note">{address}</p>}
          {note && <p className="card-note">{note}</p>}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="card-link" style={{ color: "var(--accent, #B8921A)" }}>
              {linkLabel}
            </a>
          )}
        </div>
      </CardEffectWrapper>
    </section>
  );
}
