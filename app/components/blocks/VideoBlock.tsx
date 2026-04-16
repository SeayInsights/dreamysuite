interface Block { id: string; type: string; [key: string]: unknown }

export function VideoBlock({ block }: { block: Block }) {
  const cfg = typeof block.config === "string" ? JSON.parse(block.config || "{}") : (block.config ?? {});
  const url = String(cfg.url ?? "");
  const height = String(cfg.height ?? "100dvh");

  return (
    <section
      className="block block-video"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ height, position: "relative" }}
    >
      {url ? (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9b8e85" }}>
          No video selected
        </div>
      )}
    </section>
  );
}
