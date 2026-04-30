import Image from "next/image";
import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function ImagesBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const urls = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
  const imageSlot = cfg.imageSlot as string | undefined;
  const sized = typeof cfg.blockHeight === "number" && cfg.blockHeight > 0;
  const imageFit = (typeof cfg.imageFit === "string" ? cfg.imageFit : "cover") as React.CSSProperties["objectFit"];

  return (
    <section className="block block-images" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      {urls.length > 0 || imageSlot ? (
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: urls.length > 1 ? "1fr 1fr" : "1fr", ...(sized ? { minHeight: 0, height: "100%", width: "100%", gridAutoRows: "1fr" } : {}) }}>
          {(imageSlot ? [imageSlot] : urls).map((url, i) => (
            <div key={i} style={{ position: "relative", width: "100%", paddingBottom: sized ? undefined : "75%", height: sized ? "100%" : undefined }}>
              <Image src={url} alt={String(cfg.imageAlt || cfg.heading || "Wedding photo")} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ borderRadius: "8px", objectFit: imageFit, objectPosition: "center" }} />
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
