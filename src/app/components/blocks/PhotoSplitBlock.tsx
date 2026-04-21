import { blockSectionStyle, parseCfg, cropClipPath } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function PhotoSplitBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const imageUrl = cfg.imageUrl as string | undefined;
  const heading = String(cfg.heading ?? "");
  const body = String(cfg.body ?? cfg.text ?? "");
  const layout = String(cfg.layout ?? "left");
  const clipPath = cropClipPath(cfg);
  const sized = typeof cfg.blockHeight === "number" && cfg.blockHeight > 0;

  return (
    <section className="block block-photo-split" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      <div style={{
        display: "flex",
        flexDirection: layout === "right" ? "row-reverse" : "row",
        gap: "1.5rem",
        alignItems: "center",
        ...(sized ? { flex: 1, minHeight: 0 } : {}),
      }}>
        <div style={{ flex: 1, ...(sized ? { minHeight: 0, overflow: "hidden" } : {}) }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{ width: "100%", borderRadius: "8px", objectFit: sized ? "contain" : "cover", ...(clipPath ? { clipPath } : {}), ...(sized ? { height: "100%" } : {}) }}
            />
          ) : (
            <div style={{ background: "#f5f0eb", borderRadius: "8px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8e85" }}>
              Photo
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {heading && <TextEffectWrapper as="h3">{heading}</TextEffectWrapper>}
          {body ? <p>{body}</p> : <p style={{ color: "#9b8e85", fontStyle: "italic" }}>Content will appear here.</p>}
        </div>
      </div>
    </section>
  );
}
