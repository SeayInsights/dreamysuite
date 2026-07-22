import type { CSSProperties } from "react";
import { Placeholder, MediaPlaceholder } from "./primitives";
import { safeUrl } from "@/app/[slug]/helpers";

/**
 * Presentational views for countdown / video / media-video blocks. Store-free.
 * The live countdown/video clocks are still driven by the published site's
 * vanilla scripts.ts, which finds these elements by their [data-cd-clock] /
 * id="cd-*" markers — the markup below preserves those exactly.
 */

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

/** The four cd-days/hours/mins/secs units, keyed by an id prefix. */
export function CountdownUnits({ idPrefix }: { idPrefix: string }) {
  const units: Array<[string, string]> = [
    ["days", "Days"],
    ["hours", "Hours"],
    ["mins", "Minutes"],
    ["secs", "Seconds"],
  ];
  return (
    <>
      {units.map(([key, label]) => (
        <div key={key} className="countdown-unit">
          <span className="countdown-num" id={`cd-${key}-${idPrefix}`}>
            --
          </span>
          <span className="countdown-unit-label">{label}</span>
        </div>
      ))}
    </>
  );
}

export interface CountdownViewProps {
  id: string;
  type: string;
  label: string;
  targetDate: string;
  showRsvp: boolean;
  rsvpText: string;
  rsvpBg: string;
  rsvpFg: string;
  rsvpBorderColor?: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function CountdownView({
  id,
  type,
  label,
  targetDate,
  showRsvp,
  rsvpText,
  rsvpBg,
  rsvpFg,
  rsvpBorderColor,
  style,
  data,
}: CountdownViewProps) {
  return (
    <section
      className="block block-countdown"
      {...containerProps(style, data)}
      aria-label="Countdown"
      data-block-id={id}
      data-block-type={type}
    >
      <p className="countdown-label">{label}</p>
      {targetDate ? (
        <div
          className="countdown-units"
          data-cd-clock=""
          data-date={targetDate}
          data-block-id={id}
        >
          <CountdownUnits idPrefix={id} />
        </div>
      ) : (
        <Placeholder text="Set an event date in Site Settings to show the countdown." />
      )}
      <div
        className="rsvp-wrap"
        style={{
          textAlign: "center",
          marginTop: "2rem",
          ...(showRsvp ? {} : { display: "none" }),
        }}
      >
        <a
          href="#rsvp"
          className="rsvp-submit"
          style={{
            background: rsvpBg,
            color: rsvpFg,
            ...(rsvpBorderColor
              ? { border: `2px solid ${rsvpBorderColor}` }
              : {}),
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          {rsvpText}
        </a>
      </div>
    </section>
  );
}

/** Countdown overlay used inside the video blocks (bottom/x offsets + clock). */
function VideoCountdownOverlay({
  id,
  targetDate,
  cdX,
  cdY,
}: {
  id: string;
  targetDate: string;
  cdX: number;
  cdY: number;
}) {
  return (
    <div
      className="video-cd-overlay"
      style={{
        bottom: `${cdY}px`,
        transform: `translateX(calc(-50% + ${cdX}px))`,
      }}
      data-cd-clock=""
      data-date={targetDate}
      data-block-id={`${id}-overlay`}
    >
      <div className="countdown-units">
        <CountdownUnits idPrefix={`${id}-overlay`} />
      </div>
    </div>
  );
}

export interface VideoViewProps {
  id: string;
  type: string;
  vimeoId?: string;
  url?: string;
  height: string;
  showCountdown: boolean;
  targetDate: string;
  cdX: number;
  cdY: number;
}

export function VideoView({
  id,
  type,
  vimeoId,
  url,
  height,
  showCountdown,
  targetDate,
  cdX,
  cdY,
}: VideoViewProps) {
  const overlay =
    showCountdown && targetDate ? (
      <VideoCountdownOverlay
        id={id}
        targetDate={targetDate}
        cdX={cdX}
        cdY={cdY}
      />
    ) : null;

  if (vimeoId) {
    return (
      <section
        className="block block-video"
        aria-label="Video"
        data-block-id={id}
        data-block-type={type}
        style={{
          position: "relative",
          width: "100%",
          height,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          data-lazy-src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "177.78vh",
            minWidth: "100%",
            minHeight: "100%",
            height: "56.25vw",
            transform: "translate(-50%,-50%)",
            border: 0,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Wedding video"
        />
        {overlay}
      </section>
    );
  }
  return (
    <section
      className="block block-video"
      aria-label="Video"
      data-block-id={id}
      data-block-type={type}
      style={{ position: "relative" }}
    >
      {url ? (
        <video
          src={safeUrl(url)}
          controls
          className="media-element"
          aria-label="Wedding video"
        ></video>
      ) : (
        <MediaPlaceholder label="Video" />
      )}
      {overlay}
    </section>
  );
}

export interface MediaVideoViewProps {
  id: string;
  type: string;
  resolvedVimeoId?: string;
  isYoutube: boolean;
  ytId: string;
  url?: string;
  height: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function MediaVideoView({
  id,
  type,
  resolvedVimeoId,
  isYoutube,
  ytId,
  url,
  height,
  style,
  data,
}: MediaVideoViewProps) {
  if (resolvedVimeoId) {
    return (
      <section
        className="block block-media-video"
        {...(data ?? {})}
        aria-label="Video"
        data-block-id={id}
        data-block-type={type}
        style={{
          position: "relative",
          width: "100%",
          height,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          data-lazy-src={`https://player.vimeo.com/video/${resolvedVimeoId}?autoplay=1&muted=1&loop=1&background=1`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "177.78vh",
            minWidth: "100%",
            minHeight: "100%",
            height: "56.25vw",
            transform: "translate(-50%,-50%)",
            border: 0,
          }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video"
        />
      </section>
    );
  }

  if (isYoutube && url) {
    return (
      <section
        className="block block-media-video"
        {...containerProps(style, data)}
        aria-label="Video"
        data-block-id={id}
        data-block-type={type}
      >
        {ytId ? (
          <div className="video-wrap">
            <iframe
              data-lazy-src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="youtube-iframe"
            ></iframe>
          </div>
        ) : (
          <Placeholder text="Invalid YouTube URL." />
        )}
      </section>
    );
  }

  return (
    <section
      className="block block-media-video"
      {...(data ?? {})}
      aria-label="Video"
      data-block-id={id}
      data-block-type={type}
      style={{ position: "relative", ...(url ? { height } : {}) }}
    >
      {url ? (
        <video
          src={safeUrl(url)}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        ></video>
      ) : (
        <MediaPlaceholder label="Video" />
      )}
    </section>
  );
}
