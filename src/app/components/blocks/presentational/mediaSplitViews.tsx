/* eslint-disable @next/next/no-img-element --
   These views render to a static HTML string for the published page (no Next
   runtime); next/image is not applicable and would change the markup. */
import type { CSSProperties } from "react";
import { Placeholder, Multiline } from "./primitives";

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

// ── photo-split ────────────────────────────────────────────────────────────

export interface PsTextComponent {
  isText: true;
  heading: string;
  body: string;
  hStyle: CSSProperties;
  bStyle: CSSProperties;
}
export interface PsOtherComponent {
  isText: false;
}
export type PsComponent = PsTextComponent | PsOtherComponent;

/** Render a body string into one <p> per double-newline paragraph (nl2br within). */
function bodyParagraphs(body: string, bStyle: CSSProperties) {
  return body.split("\n\n").map((para, i) => (
    <p key={i} style={bStyle}>
      <Multiline text={para} />
    </p>
  ));
}

export interface PhotoSplitViewProps {
  id: string;
  type: string;
  photoUrl: string;
  photoContainerStyle: CSSProperties;
  imgStyle: CSSProperties;
  photoFirst: boolean;
  components: PsComponent[];
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function PhotoSplitView({
  id,
  type,
  photoUrl,
  photoContainerStyle,
  imgStyle,
  photoFirst,
  components,
  style,
  data,
}: PhotoSplitViewProps) {
  const img = photoUrl ? (
    <div className="ps-photo" style={photoContainerStyle}>
      <img src={photoUrl} alt="Photo" loading="lazy" style={imgStyle} />
    </div>
  ) : null;

  const content = (
    <div className="ps-content" style={{ flex: 1, minWidth: "200px" }}>
      {components.map((c, i) =>
        c.isText ? (
          <div key={i} className="ps-comp-text">
            {c.heading ? <h3 style={c.hStyle}>{c.heading}</h3> : null}
            {c.body ? bodyParagraphs(c.body, c.bStyle) : null}
          </div>
        ) : null,
      )}
    </div>
  );

  return (
    <section
      className="block block-photo-split"
      {...containerProps(style, data)}
      data-block-id={id}
      data-block-type={type}
    >
      <div
        style={{
          display: "flex",
          gap: "2rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {photoFirst ? (
          <>
            {img}
            {content}
          </>
        ) : (
          <>
            {content}
            {img}
          </>
        )}
      </div>
    </section>
  );
}

// ── story-timeline ───────────────────────────────────────────────────────────

export interface StoryTimelineEvent {
  date?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface StoryTimelineViewProps {
  id: string;
  type: string;
  heading: string;
  events: StoryTimelineEvent[];
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function StoryTimelineView({
  id,
  type,
  heading,
  events,
  style,
  data,
}: StoryTimelineViewProps) {
  return (
    <section
      className="block block-story-timeline"
      {...containerProps(style, data)}
      aria-label="Our Story"
      data-block-id={id}
      data-block-type={type}
    >
      {heading ? (
        <>
          <h2 className="section-heading">{heading}</h2>
          <div className="section-rule" aria-hidden="true"></div>
        </>
      ) : null}
      {events.length > 0 ? (
        <div
          className="story-timeline"
          style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "2px",
              background: "var(--site-border,#e0dbd4)",
              transform: "translateX(-50%)",
            }}
            aria-hidden="true"
          ></div>
          {events.map((ev, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isLeft ? "flex-start" : "flex-end",
                  marginBottom: "2rem",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "0.75rem",
                    width: "12px",
                    height: "12px",
                    background: "var(--site-accent)",
                    borderRadius: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                  }}
                  aria-hidden="true"
                ></div>
                <div
                  style={{
                    width: "44%",
                    background: "#fff",
                    border: "1px solid var(--site-border,#e0dbd4)",
                    borderRadius: "8px",
                    padding: "0.875rem 1rem",
                  }}
                >
                  {ev.imageUrl ? (
                    <img
                      src={ev.imageUrl}
                      alt=""
                      loading="lazy"
                      style={{
                        width: "100%",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                        objectFit: "cover",
                        maxHeight: "120px",
                      }}
                    />
                  ) : null}
                  {ev.date ? (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--site-accent)",
                        fontWeight: 600,
                        margin: "0 0 0.25rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {ev.date}
                    </p>
                  ) : null}
                  {ev.title ? (
                    <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem" }}>
                      {ev.title}
                    </h4>
                  ) : null}
                  {ev.description ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "#6b6560",
                      }}
                    >
                      {ev.description}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Placeholder text="Timeline events will appear here once added." />
      )}
    </section>
  );
}
