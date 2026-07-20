import type { CSSProperties } from "react";

/**
 * Presentational home-hero block — the single source for the PUBLISHED markup.
 *
 * Store-free and hook-free so it renders both server-side (public site, via
 * renderReactToHtml) and, in a later PR, inside the editor wrapper. Inputs are
 * fully resolved by the caller (translation already applied). Empty date/location
 * are omitted — placeholders are an editor-only concern and must never reach a
 * published page.
 *
 * This mirrors the previous string renderer `renderHomeHero` exactly (modulo
 * cosmetic whitespace/entity encoding, which is normalized in the parity test).
 */
export interface HomeHeroViewProps {
  id: string;
  type: string;
  title: string;
  date: string;
  location: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function HomeHeroView({
  id,
  type,
  title,
  date,
  location,
  style,
  data,
}: HomeHeroViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  return (
    <section
      className="block block-home-hero"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      aria-label="Hero"
      data-block-id={id}
      data-block-type={type}
    >
      <div className="hero-inner">
        <p className="hero-eyebrow">We&#39;re getting married</p>
        <h1 className="hero-title" data-lang-field="couple">
          {title}
        </h1>
        {date ? (
          <p className="hero-date" data-lang-field="date">
            {date}
          </p>
        ) : null}
        {location ? (
          <p className="hero-location" data-lang-field="location">
            {location}
          </p>
        ) : null}
        <div className="hero-divider" aria-hidden="true">
          {"✶"}
        </div>
      </div>
    </section>
  );
}
