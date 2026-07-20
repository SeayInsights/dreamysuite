import type { CSSProperties } from "react";
import { MediaPlaceholder } from "./primitives";

export interface YoutubeViewProps {
  id: string;
  type: string;
  videoId: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

/** Presentational YouTube block — single source for published markup. */
export function YoutubeView({
  id,
  type,
  videoId,
  style,
  data,
}: YoutubeViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  return (
    <section
      className="block block-youtube"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      aria-label="YouTube video"
      data-block-id={id}
      data-block-type={type}
    >
      {videoId ? (
        <div className="video-wrap">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="YouTube video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="youtube-iframe"
          />
        </div>
      ) : (
        <MediaPlaceholder label="YouTube Video" />
      )}
    </section>
  );
}
