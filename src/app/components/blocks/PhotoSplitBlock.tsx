import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg, cropClipPath } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function PhotoSplitBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const imageUrl = cfg.imageUrl as string | undefined;
  const heading = String(cfg.heading ?? "");
  const body = String(cfg.body ?? cfg.text ?? "");
  const layout = String(cfg.layout ?? "left");
  const clipPath = cropClipPath(cfg);
  const sized = typeof cfg.blockHeight === "number" && cfg.blockHeight > 0;
  const imageFit = (typeof cfg.imageFit === "string" ? cfg.imageFit : "cover") as React.CSSProperties["objectFit"];

  return (
    <section className="block block-photo-split" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
      <div style={{
        display: "flex",
        flexDirection: layout === "right" ? "row-reverse" : "row",
        gap: "1.5rem",
        alignItems: sized ? "stretch" : "center",
        ...(sized ? { width: "100%", height: "100%", minHeight: 0, overflow: "hidden" } : {}),
      }}>
        <div style={{ flex: 1, ...(sized ? { minHeight: 0, overflow: "hidden", height: "100%", position: "relative" as const } : {}) }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={String(cfg.imageAlt || cfg.heading || "Wedding photo")}
              style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: imageFit, objectPosition: "center", display: "block", ...(clipPath ? { clipPath } : {}) }}
            />
          ) : (
            <div style={{ background: "var(--bg)", borderRadius: "8px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              Photo
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {heading && <TextEffectWrapper as="h3">{heading}</TextEffectWrapper>}
          {body ? <p>{body}</p> : <p style={{ color: "var(--muted)", fontStyle: "italic" }}>Content will appear here.</p>}
        </div>
      </div>
    </section>
  );
}
