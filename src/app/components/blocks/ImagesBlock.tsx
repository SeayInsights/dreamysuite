import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function ImagesBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const urls = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
  const imageSlot = cfg.imageSlot as string | undefined;

  return (
    <section className="block block-images" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg)}>
      {urls.length > 0 || imageSlot ? (
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: urls.length > 1 ? "1fr 1fr" : "1fr" }}>
          {(imageSlot ? [imageSlot] : urls).map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: "100%", borderRadius: "8px", objectFit: "cover" }} />
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
