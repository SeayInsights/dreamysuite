import { useEditorStore } from "@/app/stores/editorStore";
import {
  blockSectionStyle,
  editableProps,
  parseCfg,
} from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block {
  id: string;
  type: string;
  [key: string]: unknown;
}

export function HomeHeroBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as
    | "desktop"
    | "tablet"
    | "mobile";
  const cfg = parseCfg(block.config);
  const title = String(cfg.coupleNames ?? "Our Special Day");
  const date = String(cfg.dateText ?? "");
  const location = String(cfg.locationText ?? "");
  const eyebrow = cfg.eyebrow ? String(cfg.eyebrow) : "We’re getting married";

  return (
    <section
      className="block block-home-hero"
      data-block-id={block.id}
      data-block-type={block.type}
      style={blockSectionStyle(cfg, breakpoint)}
    >
      <div className="hero-inner">
        <p className="hero-eyebrow">{eyebrow}</p>
        <TextEffectWrapper
          as="h1"
          className="hero-title"
          {...editableProps(cfg, "coupleNames")}
        >
          {title}
        </TextEffectWrapper>
        <p className="hero-date" {...editableProps(cfg, "dateText")}>
          {date || (
            <span style={{ opacity: 0.4, fontStyle: "italic" }}>
              Add wedding date
            </span>
          )}
        </p>
        <p className="hero-location" {...editableProps(cfg, "locationText")}>
          {location || (
            <span style={{ opacity: 0.4, fontStyle: "italic" }}>
              Add location
            </span>
          )}
        </p>
        <div className="hero-divider" aria-hidden="true">
          &#10038;
        </div>
      </div>
    </section>
  );
}
