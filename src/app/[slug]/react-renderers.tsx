import type { RenderContext } from "./renderers";
import { renderReactToHtml } from "@/lib/blocks/reactToHtml";
import { blockContainerStyle } from "@/lib/blocks/container";
import { safeUrl } from "./helpers";
import { HomeHeroView } from "@/app/components/blocks/presentational/HomeHeroView";
import { SpacerView } from "@/app/components/blocks/presentational/SpacerView";
import { YoutubeView } from "@/app/components/blocks/presentational/YoutubeView";
import { VenueMapView } from "@/app/components/blocks/presentational/VenueMapView";

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

export function renderSpacerReact(ctx: RenderContext): string {
  const height = Math.max(0, Math.min(400, Number(ctx.cfg.height ?? 60)));
  return renderReactToHtml(<SpacerView height={height} />);
}

export function renderYoutubeReact(ctx: RenderContext): string {
  const { block, cfg } = ctx;
  const rawUrl = cfg.url as string | undefined;
  const videoId =
    (cfg.videoId as string | undefined) ??
    (rawUrl
      ? (rawUrl.match(/(?:youtu\.be\/|[?&]v=)([^&\s]+)/)?.[1] ?? "")
      : "");
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <YoutubeView
      id={block.id}
      type={block.type}
      videoId={videoId}
      style={style}
      data={data}
    />,
  );
}

export function renderVenueMapReact(ctx: RenderContext): string {
  const { block, cfg } = ctx;
  const embedUrl =
    (cfg.embedUrl as string | undefined) ?? (cfg.mapUrl as string | undefined);
  const address = cfg.address as string | undefined;
  const name =
    (cfg.name as string | undefined) ?? (cfg.venueName as string | undefined);
  const note = cfg.note as string | undefined;
  const mapSrc = embedUrl
    ? safeUrl(embedUrl)
    : address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
      : null;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <VenueMapView
      id={block.id}
      type={block.type}
      name={name}
      note={note}
      address={address}
      mapSrc={mapSrc}
      style={style}
      data={data}
    />,
  );
}
