/* eslint-disable @next/next/no-img-element --
   These views render to a static HTML string for the published page (no Next
   runtime); next/image is not applicable and would change the markup. */
import type { CSSProperties } from "react";
import { Placeholder, Multiline } from "./primitives";

/**
 * Presentational grid/gallery views (images, gallery). Store-free. Raw <img> is
 * required — these render to a static HTML string for the public page (no Next
 * runtime), matching the legacy string renderers.
 */

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

function imagesWrapperStyle(layout: string, offsetX: number): CSSProperties {
  const s: Record<string, string> = {};
  if (offsetX !== 0) s.transform = `translateX(${offsetX}px)`;
  switch (layout) {
    case "grid-2":
      s.display = "grid";
      s.gridTemplateColumns = "repeat(2,1fr)";
      s.gap = "0.75rem";
      break;
    case "masonry":
      s.columns = "2";
      s.columnGap = "0.75rem";
      break;
    case "filmstrip":
      s.display = "flex";
      s.overflowX = "auto";
      s.gap = "0.75rem";
      s.scrollSnapType = "x mandatory";
      s.WebkitOverflowScrolling = "touch";
      s.paddingBottom = "0.5rem";
      break;
    case "full-bleed":
      s.display = "grid";
      s.gridTemplateColumns = "1fr";
      s.gap = "0.5rem";
      break;
    case "featured-grid":
      s.display = "grid";
      s.gridTemplateColumns = "2fr 1fr";
      s.gap = "0.75rem";
      break;
    // grid-3: rely on .image-grid CSS default
  }
  return s as CSSProperties;
}

function imgExtraStyle(
  layout: string,
  idx: number,
  count: number,
): CSSProperties {
  if (layout === "masonry")
    return { breakInside: "avoid", aspectRatio: "auto" };
  if (layout === "filmstrip")
    return {
      height: "220px",
      width: "auto",
      maxWidth: "none",
      flexShrink: 0,
      scrollSnapAlign: "start",
    };
  if (layout === "featured-grid" && idx === 0 && count > 1)
    return { gridRow: "span 2", height: "100%" };
  if (layout === "full-bleed") return { width: "100%", height: "auto" };
  return {};
}

export interface ImagesViewProps {
  id: string;
  type: string;
  urls?: string[];
  imageSlot?: string;
  layout: string;
  offsetX: number;
  imgBaseStyle: CSSProperties;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function ImagesView({
  id,
  type,
  urls,
  imageSlot,
  layout,
  offsetX,
  imgBaseStyle,
  style,
  data,
}: ImagesViewProps) {
  const wrapperStyle = imagesWrapperStyle(layout, offsetX);
  const hasWrapperStyle = Object.keys(wrapperStyle).length > 0;
  const count = urls?.length ?? 0;
  return (
    <section
      className="block block-images"
      {...containerProps(style, data)}
      aria-label="Photo gallery"
      data-block-id={id}
      data-block-type={type}
    >
      {urls && urls.length > 0 ? (
        <div
          className="image-grid"
          {...(hasWrapperStyle ? { style: wrapperStyle } : {})}
        >
          {urls.map((u, i) => {
            return (
              <img
                key={i}
                src={u}
                alt={`Wedding photo ${i + 1}`}
                loading="lazy"
                width="800"
                height="600"
                className="gallery-img"
                style={{ ...imgBaseStyle, ...imgExtraStyle(layout, i, count) }}
              />
            );
          })}
        </div>
      ) : (
        <Placeholder
          text={
            imageSlot
              ? `Photos for "${imageSlot}" will appear here.`
              : "Photos will appear here once uploaded."
          }
        />
      )}
    </section>
  );
}

export interface GalleryViewProps {
  id: string;
  type: string;
  layout: string;
  imageUrl?: string;
  heading: string;
  body: string;
  imageLayout: string;
  images: string[];
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function GalleryView({
  id,
  type,
  layout,
  imageUrl,
  heading,
  body,
  imageLayout,
  images,
  style,
  data,
}: GalleryViewProps) {
  if (layout === "split") {
    const isRight = imageLayout === "right";
    return (
      <section
        className="block block-gallery"
        {...containerProps(style, data)}
        data-block-id={id}
        data-block-type={type}
      >
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "center",
            flexWrap: "wrap",
            ...(isRight ? { flexDirection: "row-reverse" } : {}),
          }}
        >
          {imageUrl ? (
            <div style={{ flex: 1 }}>
              <img
                src={imageUrl}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                background: "#f5f0eb",
                borderRadius: "8px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9b8e85",
              }}
            >
              Photo
            </div>
          )}
          <div style={{ flex: 1 }}>
            {heading ? <h3>{heading}</h3> : null}
            {body ? (
              <p>
                <Multiline text={body} />
              </p>
            ) : (
              <Placeholder text="Content will appear here." />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="block block-gallery"
      {...containerProps(style, data)}
      aria-label="Photo gallery"
      data-block-id={id}
      data-block-type={type}
    >
      {images.length > 0 ? (
        <div
          className="image-grid"
          style={{
            display: "grid",
            gap: "0.5rem",
            gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr",
          }}
        >
          {images.map((u, i) => {
            return (
              <img
                key={i}
                src={u}
                alt={`Gallery photo ${i + 1}`}
                loading="lazy"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            );
          })}
        </div>
      ) : (
        <Placeholder text="Images will appear here once added." />
      )}
    </section>
  );
}
