// Import the edge build explicitly: (1) it is the workerd-safe build (Web APIs,
// no Node built-ins), which is what @opennextjs/cloudflare runs; (2) the bare
// "react-dom/server" specifier trips a Next App Router build guard.
import { renderToReadableStream } from "react-dom/server.edge";
import type { ReactElement } from "react";

/**
 * Render a React element to a static HTML string for the published site.
 *
 * The public `[slug]` route emits a plain HTML document (zero client JS).
 *
 * IMPORTANT: this MUST use the streaming renderer, not `renderToStaticMarkup`
 * / `renderToString`. Those legacy synchronous APIs are rejected at runtime by
 * the Next.js App Router ("Internal Error: do not use legacy react-dom/server
 * APIs") — they pass CI (plain React in vitest) but throw in the deployed
 * workerd runtime, which previously blank-500'd every content-rich published
 * site. `renderToReadableStream` is the supported (non-legacy) API.
 *
 * Block components never suspend, so the stream resolves in a single pass and
 * the collected markup is byte-identical to the old `renderToStaticMarkup`
 * output. The function is therefore async; callers up the chain (renderBlock,
 * buildHtml, the route handler) await it.
 */
export async function renderReactToHtml(
  element: ReactElement,
): Promise<string> {
  const stream = await renderToReadableStream(element);
  // Wait for all (non-suspending) content before collecting, then read the
  // full stream to a string.
  await stream.allReady;
  const html = await new Response(stream).text();
  // The published page is never hydrated (zero client JS), so React's text
  // separator comments (`<!-- -->`) — emitted by the streaming renderer to
  // delimit adjacent text nodes, but never by the old renderToStaticMarkup —
  // serve no purpose here. Strip them so the markup stays byte-identical to
  // the legacy string output (user content is HTML-escaped, so a literal
  // "<!-- -->" can never appear in real text).
  return html.replace(/<!-- -->/g, "");
}
