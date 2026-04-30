import { useEditorStore } from "@/app/stores/editorStore";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function YoutubeBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const url = String(cfg.url ?? "");
  const match = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
  const videoId = match?.[1] ?? "";

  return (
    <section className="block block-youtube" data-block-id={block.id} data-block-type={block.type} style={blockSectionStyle(cfg, breakpoint)}>
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
        <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", padding: "2rem 0" }}>
          Paste a YouTube URL to embed a video.
        </p>
      )}
    </section>
  );
}
