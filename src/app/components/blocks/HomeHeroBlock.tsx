interface Block { id: string; type: string; [key: string]: unknown }

export function HomeHeroBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const title = String(cfg.coupleNames ?? "Our Special Day");
  const date = String(cfg.dateText ?? "");
  const location = String(cfg.locationText ?? "");

  return (
    <section className="block block-home-hero" data-block-id={block.id} data-block-type={block.type}>
      <div className="hero-inner">
        <p className="hero-eyebrow">We&apos;re getting married</p>
        <h1 className="hero-title">{title}</h1>
        {date && <p className="hero-date">{date}</p>}
        {location && <p className="hero-location">{location}</p>}
        <div className="hero-divider" aria-hidden="true">&#10038;</div>
      </div>
    </section>
  );
}
