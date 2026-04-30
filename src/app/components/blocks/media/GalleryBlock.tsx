import Image from "next/image";
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

  if (layout === "split" || layout === "left" || layout === "right") {
    const imageUrl = cfg.imageUrl as string | undefined;
    const heading = String(cfg.heading ?? "");
    const body = String(cfg.body ?? cfg.text ?? "");
    const imageLayout = layout === "left" || layout === "right" ? layout : String(cfg.imageLayout ?? "left");

    return (
      <section className="block block-gallery" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
        <div style={{
          display: "flex",
          flexDirection: imageLayout === "right" ? "row-reverse" : "row",
          gap: "1.5rem",
          alignItems: sized ? "stretch" : "center",
          ...(sized ? { width: "100%", height: "100%", minHeight: 0, overflow: "hidden" } : {}),
        }}>
          <div style={{ flex: 1, position: "relative" as const, ...(sized ? { minHeight: 0, overflow: "hidden", height: "100%" } : { minHeight: "200px" }) }}>
            {imageUrl ? (
              <Image src={imageUrl} alt={String(cfg.imageAlt || cfg.heading || "Wedding photo")} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ borderRadius: "8px", objectFit: imageFit, objectPosition: "center", ...(clipPath ? { clipPath } : {}) }} />
            ) : (
              <div style={{ background: "var(--bg)", borderRadius: "8px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                Photo
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {heading && <TextEffectWrapper as="h3">{heading}</TextEffectWrapper>}
            {body
              ? <p>{body}</p>
              : <p style={{ color: "var(--muted)", fontStyle: "italic" }}>Content will appear here.</p>}
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
            <div key={i} style={{ position: "relative", width: "100%", paddingBottom: sized ? undefined : "75%", height: sized ? "100%" : undefined }}>
              <Image src={url} alt={String(cfg.imageAlt || cfg.heading || "Wedding photo")} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ borderRadius: "8px", objectFit: imageFit, objectPosition: "center", ...(clipPath ? { clipPath } : {}) }} />
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
          Images will appear here once added.
        </p>
      )}
    </section>
  );
}
