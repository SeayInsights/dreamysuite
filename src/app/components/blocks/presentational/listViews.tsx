import { Fragment, type CSSProperties } from "react";
import { Placeholder, Multiline } from "./primitives";
import { safeUrl } from "@/app/[slug]/helpers";

/**
 * Shared list-style presentational views (timeline / faq / travel). Used by the
 * multi-text block's sub-modes and, later, the standalone schedule/faq/travel
 * blocks. Store-free/hook-free; headings and placeholder text are passed in so
 * the same markup serves both callers. Empty collections render the placeholder.
 */

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

export interface TimelineEvent {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
}

export function TimelineView({
  id,
  type,
  heading,
  placeholderText,
  events,
  style,
  data,
}: {
  id: string;
  type: string;
  heading: string;
  placeholderText: string;
  events: TimelineEvent[];
  style?: CSSProperties;
  data?: Record<string, string>;
}) {
  const mutedP: CSSProperties = {
    fontSize: "0.85em",
    color: "var(--site-muted)",
    margin: "0.2rem 0 0",
  };
  return (
    <section
      className="block block-schedule"
      {...containerProps(style, data)}
      aria-label="Schedule"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">{heading}</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {events.length > 0 ? (
        <ol className="timeline">
          {events.map((ev, i) => (
            <li key={i} className="timeline-item">
              {ev.time ? (
                <span className="timeline-time">{ev.time}</span>
              ) : null}
              <div className="timeline-content">
                {ev.name ? <strong>{ev.name}</strong> : null}
                {ev.date ? <p style={mutedP}>{ev.date}</p> : null}
                {ev.location ? (
                  <p style={mutedP}>
                    {"📍 "}
                    {ev.location}
                  </p>
                ) : null}
                {ev.description ? <p>{ev.description}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Placeholder text={placeholderText} />
      )}
    </section>
  );
}

export interface FaqItem {
  q?: string;
  a?: string;
}

export function FaqView({
  id,
  type,
  heading,
  placeholderText,
  questions,
  style,
  data,
}: {
  id: string;
  type: string;
  heading: string;
  placeholderText: string;
  questions: FaqItem[];
  style?: CSSProperties;
  data?: Record<string, string>;
}) {
  return (
    <section
      className="block block-faq"
      {...containerProps(style, data)}
      aria-label="Frequently asked questions"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">{heading}</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {questions.length > 0 ? (
        <dl className="faq-list">
          {questions.map((item, i) => (
            <Fragment key={i}>
              {item.q ? <dt className="faq-question">{item.q}</dt> : null}
              {item.a ? <dd className="faq-answer">{item.a}</dd> : null}
            </Fragment>
          ))}
        </dl>
      ) : (
        <Placeholder text={placeholderText} />
      )}
    </section>
  );
}

export interface TravelItem {
  heading?: string;
  body?: string;
  linkLabel?: string;
  linkUrl?: string;
}

export function TravelView({
  id,
  type,
  heading,
  placeholderText,
  items,
  multilineBody = false,
  style,
  data,
}: {
  id: string;
  type: string;
  heading: string;
  placeholderText: string;
  items: TravelItem[];
  /** standalone travel/travel-section use nl2br; multi-text travel mode does not. */
  multilineBody?: boolean;
  style?: CSSProperties;
  data?: Record<string, string>;
}) {
  return (
    <section
      className="block block-travel"
      {...containerProps(style, data)}
      aria-label="Travel information"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">{heading}</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {items.length > 0 ? (
        items.map((item, i) => (
          <div key={i} style={{ marginBottom: "1.5rem" }}>
            {item.heading ? (
              <h3 style={{ fontSize: "1.05rem", margin: "0 0 0.4rem" }}>
                {item.heading}
              </h3>
            ) : null}
            {item.body ? (
              <p style={{ margin: "0 0 0.4rem", lineHeight: "1.7" }}>
                {multilineBody ? <Multiline text={item.body} /> : item.body}
              </p>
            ) : null}
            {item.linkUrl && item.linkLabel ? (
              <a
                href={safeUrl(item.linkUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--site-accent)" }}
              >
                {item.linkLabel}
              </a>
            ) : null}
          </div>
        ))
      ) : (
        <Placeholder text={placeholderText} />
      )}
    </section>
  );
}
