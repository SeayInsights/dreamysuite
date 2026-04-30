import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg, cropClipPath } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function GalleryBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const layout = String(cfg.layout ?? "grid");
  const clipPath = cropClipPath(cfg);
  const sized = typeof cfg.blockHeight === "number" && cfg.blockHeight > 0;
  const imageFit = (typeof cfg.imageFit === "string" ? cfg.imageFit : "cover") as React.CSSProperties["objectFit"];

  if (layout === "split") {
    const imageUrl = cfg.imageUrl as string | undefined;
    const heading = String(cfg.heading ?? "");
    const body = String(cfg.body ?? "");
    const imageLayout = String(cfg.imageLayout ?? "left");

    return (
      <section className="block block-gallery" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
        <div style={{
          display: "flex",
          flexDirection: imageLayout === "right" ? "row-reverse" : "row",
          gap: "1.5rem",
          alignItems: sized ? "stretch" : "center",
          ...(sized ? { width: "100%", height: "100%", minHeight: 0, overflow: "hidden" } : {}),
        }}>
          <div style={{ flex: 1, ...(sized ? { minHeight: 0, overflow: "hidden", height: "100%", position: "relative" as const } : {}) }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: imageFit, objectPosition: "center", display: "block", ...(clipPath ? { clipPath } : {}) }} />
            ) : (
              <div style={{ background: "#f5f0eb", borderRadius: "8px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8e85" }}>
                Photo
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {heading && <TextEffectWrapper as="h3">{heading}</TextEffectWrapper>}
            {body
              ? <p>{body}</p>
              : <p style={{ color: "#9b8e85", fontStyle: "italic" }}>Content will appear here.</p>}
          </div>
        </div>
      </section>
    );
  }

  // Grid layout
  const urls = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
  const imageSlot = cfg.imageUrl as string | undefined;
  const images = imageSlot ? [imageSlot] : urls;

  return (
    <section className="block block-gallery" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      {images.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr", ...(sized ? { minHeight: 0, height: "100%", width: "100%", gridAutoRows: "1fr" } : {}) }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: imageFit, objectPosition: "center", display: "block", ...(clipPath ? { clipPath } : {}) }} />
          ))}
        </div>
      ) : (
        <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
          Images will appear here once added.
        </p>
      )}
    </section>
  );
}
