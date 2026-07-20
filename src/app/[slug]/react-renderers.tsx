import type { RenderContext } from "./renderers";
import { renderReactToHtml } from "@/lib/blocks/reactToHtml";
import { blockContainerStyle } from "@/lib/blocks/container";
import { HomeHeroView } from "@/app/components/blocks/presentational/HomeHeroView";

/**
 * React-SSR block renderers. Each function resolves inputs from the shared
 * RenderContext (identically to its legacy string renderer) and renders the
 * presentational component to a static HTML string. These are wired into
 * BLOCK_RENDERERS as block types migrate off the hand-written string path.
 */
export function renderHomeHeroReact(ctx: RenderContext): string {
  const { block, settings, cfg, cnt } = ctx;
  const title = cnt(
    "couple",
    "coupleNames",
    settings?.eventName ?? "Our Special Day",
  );
  const date = cnt("date", "dateText", settings?.eventDate ?? "");
  const location = cnt(
    "location",
    "locationText",
    settings?.eventLocation ?? "",
  );
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <HomeHeroView
      id={block.id}
      type={block.type}
      title={title}
      date={date}
      location={location}
      style={style}
      data={data}
    />,
  );
}
