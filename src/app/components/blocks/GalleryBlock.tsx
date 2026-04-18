import { blockSectionStyle, parseCfg, cropClipPath } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function GalleryBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const layout = String(cfg.layout ?? "grid");
  const clipPath = cropClipPath(cfg);

  if (layout === "split") {
    const imageUrl = cfg.imageUrl as string | undefined;
    const heading = String(cfg.heading ?? "");
    const body = String(cfg.body ?? "");
    const imageLayout = String(cfg.imageLayout ?? "left");

    return (
      <section className="block block-gallery" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
        <div style={{
          display: "flex",
          flexDirection: imageLayout === "right" ? "row-reverse" : "row",
          gap: "1.5rem",
          alignItems: "center",
        }}>
          <div style={{ flex: 1 }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", ...(clipPath ? { clipPath } : {}) }} />
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
    <section className="block block-gallery" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      {images.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr" }}>
          {images.map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: "100%", borderRadius: "8px", objectFit: "cover", ...(clipPath ? { clipPath } : {}) }} />
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
