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
  /** Small line above the title. Omitted → the default "We're getting married". */
  eyebrow?: string;
  /**
   * Optional hero background image (already sanitized/escaped by the caller).
   * When set, the hero renders it full-bleed with a readability scrim and the
   * heading text switches to light (`hero-has-image` styles in styles.ts).
   */
  imageUrl?: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function HomeHeroView({
  id,
  type,
  title,
  date,
  location,
  eyebrow,
  imageUrl,
  style,
  data,
}: HomeHeroViewProps) {
  const mergedStyle: CSSProperties | undefined = imageUrl
    ? { ...(style ?? {}), backgroundImage: `url('${imageUrl}')` }
    : style;
  const hasStyle = mergedStyle && Object.keys(mergedStyle).length > 0;
  return (
    <section
      className={`block block-home-hero${imageUrl ? " hero-has-image" : ""}`}
      {...(hasStyle ? { style: mergedStyle } : {})}
      {...(data ?? {})}
      aria-label="Hero"
      data-block-id={id}
      data-block-type={type}
    >
      {imageUrl ? <div className="hero-scrim" aria-hidden="true" /> : null}
      <div className="hero-inner">
        {/* Default kept byte-identical (entity form) so render-parity holds; the
            dynamic branch only runs when a template/owner sets an eyebrow. */}
        {eyebrow ? (
          <p className="hero-eyebrow">{eyebrow}</p>
        ) : (
          <p className="hero-eyebrow">We&#39;re getting married</p>
        )}
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
