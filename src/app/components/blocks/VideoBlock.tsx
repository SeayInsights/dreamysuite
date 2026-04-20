import React from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";

interface Block { id: string; type: string; [key: string]: unknown }

export function VideoBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const url = String(cfg.url ?? "");
  const height = String(cfg.height ?? "100dvh");
  const objectFit = String(cfg.objectFit ?? "cover") as React.CSSProperties["objectFit"];
  const vimeoId = cfg.vimeoId as string | undefined;

  if (vimeoId) {
    return (
      <section
        className="block block-video"
        data-block-id={block.id}
        data-block-type={block.type}
        style={{ position: "relative", width: "100%", height, overflow: "hidden", background: "#000", ...blockSectionStyle(cfg) }}
      >
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`}
          title="Wedding video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", top: "50%", left: "50%", width: "177.78vh", minWidth: "100%", minHeight: "100%", height: "56.25vw", transform: "translate(-50%,-50%)", border: 0 }}
        />
      </section>
    );
  }

  return (
    <section
      className="block block-video"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ height, position: "relative", overflow: "hidden", ...blockSectionStyle(cfg) }}
    >
      {url ? (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit }}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9b8e85" }}>
          No video selected
        </div>
      )}
    </section>
  );
}
