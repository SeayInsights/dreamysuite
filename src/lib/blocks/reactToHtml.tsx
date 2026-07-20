// Import the edge build explicitly: (1) it is the workerd-safe build (Web APIs,
// no Node built-ins), which is what @opennextjs/cloudflare runs; (2) the bare
// "react-dom/server" specifier trips a Next App Router build guard, while
// "react-dom/server.edge" does not. The edge build still exports the synchronous
// renderToStaticMarkup, so renderBlock stays synchronous.
import { renderToStaticMarkup } from "react-dom/server.edge";
import type { ReactElement } from "react";

/**
 * Render a React element to a static HTML string for the published site.
 *
 * The public `[slug]` route emits a plain HTML document (zero client JS), so we
 * render block components with `renderToStaticMarkup` — no hydration markers, no
 * comment nodes, synchronous. This keeps `renderBlock` synchronous so the rest
 * of the string-building pipeline (html-builder, route) is unaffected.
 */
export function renderReactToHtml(element: ReactElement): string {
  return renderToStaticMarkup(element);
}
