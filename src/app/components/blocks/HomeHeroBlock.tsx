import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function HomeHeroBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const title = String(cfg.coupleNames ?? "Our Special Day");
  const date = String(cfg.dateText ?? "");
  const location = String(cfg.locationText ?? "");

  return (
    <section className="block block-home-hero" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <div className="hero-inner">
        <p className="hero-eyebrow">We&apos;re getting married</p>
        <h1 className="hero-title" {...editableProps(cfg, "coupleNames")}>{title}</h1>
        <p className="hero-date" {...editableProps(cfg, "dateText")}>
          {date || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add wedding date</span>}
        </p>
        <p className="hero-location" {...editableProps(cfg, "locationText")}>
          {location || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add location</span>}
        </p>
        <div className="hero-divider" aria-hidden="true">&#10038;</div>
      </div>
    </section>
  );
}
