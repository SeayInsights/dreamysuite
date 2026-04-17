import { parseCfg, cropClipPath } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function PhotoSplitBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const imageUrl = cfg.imageUrl as string | undefined;
  const heading = String(cfg.heading ?? "");
  const body = String(cfg.body ?? cfg.text ?? "");
  const layout = String(cfg.layout ?? "left");
  const clipPath = cropClipPath(cfg);

  return (
    <section className="block block-photo-split" data-block-id={block.id} data-block-type={block.type}>
      <div style={{
        display: "flex",
        flexDirection: layout === "right" ? "row-reverse" : "row",
        gap: "1.5rem",
        alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{ width: "100%", borderRadius: "8px", objectFit: "cover", ...(clipPath ? { clipPath } : {}) }}
            />
          ) : (
            <div style={{ background: "#f5f0eb", borderRadius: "8px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8e85" }}>
              Photo
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {heading && <h3>{heading}</h3>}
          {body ? <p>{body}</p> : <p style={{ color: "#9b8e85", fontStyle: "italic" }}>Content will appear here.</p>}
        </div>
      </div>
    </section>
  );
}
