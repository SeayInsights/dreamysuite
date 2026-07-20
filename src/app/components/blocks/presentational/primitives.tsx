import { Fragment } from "react";

/**
 * Shared presentational primitives for published (React-SSR) block views.
 * These mirror the string helpers in `[slug]/helpers.ts` (placeholder,
 * mediaPlaceholder, nl2br) so migrated blocks emit byte-equivalent markup.
 */

/** Mirror of helpers.nl2br(): render text with newlines as <br> line breaks. */
export function Multiline({ text }: { text: string }) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {line}
    </Fragment>
  ));
}

/** Mirror of helpers.placeholder(). */
export function Placeholder({ text }: { text: string }) {
  return <p className="placeholder-text">{text}</p>;
}

/** Mirror of helpers.mediaPlaceholder(). */
export function MediaPlaceholder({ label }: { label: string }) {
  return (
    <div className="media-placeholder" aria-label={`${label} placeholder`}>
      <span className="media-placeholder-icon" aria-hidden="true">
        {"▶"}
      </span>
      <p>{label} will appear here once added.</p>
    </div>
  );
}
