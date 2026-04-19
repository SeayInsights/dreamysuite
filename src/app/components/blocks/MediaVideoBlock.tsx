import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|[?&]v=)([^&\s]+)/);
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/);
  return match?.[1] ?? null;
}

export function MediaVideoBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const url = String(cfg.url ?? "");
  const height = String(cfg.height ?? "100dvh");
  const sectionStyle = blockSectionStyle(cfg);

  const isYoutube = cfg.provider === "youtube" ||
    (cfg.provider !== "direct" && (url.includes("youtube.com") || url.includes("youtu.be")));
  const isVimeo = cfg.provider === "vimeo" ||
    (cfg.provider !== "direct" && url.includes("vimeo.com"));

  if (!url) {
    return (
      <section className="block block-media-video" data-block-id={block.id} data-block-type={block.type}
        style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9b8e85", border: "1px dashed #e0dbd4", borderRadius: "8px", ...sectionStyle }}>
        No video selected
      </section>
    );
  }

  if (isYoutube) {
    const videoId = extractYoutubeId(url);
    return (
      <section className="block block-media-video" data-block-id={block.id} data-block-type={block.type} style={sectionStyle}>
        {videoId ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : (
          <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
            Invalid YouTube URL.
          </p>
        )}
      </section>
    );
  }

  if (isVimeo) {
    const videoId = extractVimeoId(url);
    return (
      <section className="block block-media-video" data-block-id={block.id} data-block-type={block.type} style={sectionStyle}>
        {videoId ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px" }}>
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Vimeo video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : (
          <p style={{ color: "#9b8e85", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
            Invalid Vimeo URL.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="block block-media-video" data-block-id={block.id} data-block-type={block.type}
      style={{ height, position: "relative", ...sectionStyle }}>
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </section>
  );
}
