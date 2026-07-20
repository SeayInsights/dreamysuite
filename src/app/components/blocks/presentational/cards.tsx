import type { CSSProperties } from "react";
import { Placeholder } from "./primitives";

/**
 * Presentational card blocks (registry-card, hotel-card, info-card) — single
 * source for published markup. Store-free/hook-free. `href` is pre-sanitized
 * (safeUrl) by the caller; empty fields are omitted (no editor placeholders).
 */

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

export interface RegistryCardViewProps {
  id: string;
  type: string;
  name?: string;
  note?: string;
  href?: string;
  accent: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function RegistryCardView({
  id,
  type,
  name,
  note,
  href,
  accent,
  style,
  data,
}: RegistryCardViewProps) {
  return (
    <section
      className="block block-registry-card"
      {...containerProps(style, data)}
      aria-label="Gift registry"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">Registry</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {name || href ? (
        <div className="info-card">
          {name ? <p className="card-title">{name}</p> : null}
          {note ? <p className="card-note">{note}</p> : null}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="card-link"
              style={{ color: accent }}
            >
              View Registry
            </a>
          ) : null}
        </div>
      ) : (
        <Placeholder text="Registry details will appear here once added." />
      )}
    </section>
  );
}

export interface HotelCardViewProps {
  id: string;
  type: string;
  name?: string;
  address?: string;
  note?: string;
  href?: string;
  accent: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function HotelCardView({
  id,
  type,
  name,
  address,
  note,
  href,
  accent,
  style,
  data,
}: HotelCardViewProps) {
  return (
    <section
      className="block block-hotel-card"
      {...containerProps(style, data)}
      aria-label="Hotel and accommodations"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">Hotels &amp; Accommodations</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {name || address ? (
        <div className="info-card">
          {name ? <p className="card-title">{name}</p> : null}
          {address ? <p className="card-note">{address}</p> : null}
          {note ? <p className="card-note">{note}</p> : null}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="card-link"
              style={{ color: accent }}
            >
              Book Now
            </a>
          ) : null}
        </div>
      ) : (
        <Placeholder text="Hotel and accommodation details will appear here." />
      )}
    </section>
  );
}

export interface InfoCardViewProps {
  id: string;
  type: string;
  /**
   * The aria-label. NOTE: for the hotel variant this intentionally carries a
   * literal "&amp;" so React re-escapes it to "&amp;amp;", reproducing the
   * legacy string renderer's double-escape (escHtml applied to a value that
   * already contained &amp;). Faithful behavior preservation — the latent a11y
   * double-escape is tracked as a separate fix.
   */
  ariaLabel: string;
  /** Heading text with a real "&" (React escapes it to &amp; like the legacy h2). */
  headingDisplay: string;
  name: string;
  address?: string;
  href?: string;
  imageUrl?: string;
  imgMaxWidth: string;
  linkLabel: string;
  accent: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function InfoCardView({
  id,
  type,
  ariaLabel,
  headingDisplay,
  name,
  address,
  href,
  imageUrl,
  imgMaxWidth,
  linkLabel,
  accent,
  style,
  data,
}: InfoCardViewProps) {
  return (
    <section
      className="block block-info-card"
      {...containerProps(style, data)}
      aria-label={ariaLabel}
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">{headingDisplay}</h2>
      <div className="section-rule" aria-hidden="true"></div>
      <div className="info-card" style={{ textAlign: "center" }}>
        {imageUrl ? (
          // Raw <img> is required: this renders to a static HTML string for the
          // public page (no Next runtime), matching the legacy string renderer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            style={{
              maxWidth: imgMaxWidth,
              borderRadius: "8px",
              marginBottom: "0.75rem",
            }}
          />
        ) : null}
        <p className="card-title">{name}</p>
        {address ? <p className="card-note">{address}</p> : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
            style={{ color: accent }}
          >
            {linkLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
