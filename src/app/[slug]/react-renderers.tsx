import type { RenderContext } from "./renderers";
import { renderReactToHtml } from "@/lib/blocks/reactToHtml";
import { blockContainerStyle, fieldTextStyle } from "@/lib/blocks/container";
import { safeUrl } from "./helpers";
import { HomeHeroView } from "@/app/components/blocks/presentational/HomeHeroView";
import { SpacerView } from "@/app/components/blocks/presentational/SpacerView";
import { YoutubeView } from "@/app/components/blocks/presentational/YoutubeView";
import { VenueMapView } from "@/app/components/blocks/presentational/VenueMapView";
import { HeaderView } from "@/app/components/blocks/presentational/HeaderView";
import { TextView } from "@/app/components/blocks/presentational/TextView";
import {
  FactsGridView,
  type FactsGridItem,
} from "@/app/components/blocks/presentational/FactsGridView";
import {
  RegistryCardView,
  HotelCardView,
  InfoCardView,
} from "@/app/components/blocks/presentational/cards";

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

export function renderHeaderReact(ctx: RenderContext): string {
  const { block, cfg, cnt } = ctx;
  const text = cnt(
    "title",
    "title",
    cnt("heading", "heading", cnt("text", "text", "Section")),
  );
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <HeaderView
      id={block.id}
      type={block.type}
      text={text}
      titleStyle={fieldTextStyle(cfg, "title")}
      style={style}
      data={data}
    />,
  );
}

export function renderTidbitsReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const cfgItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{ icon?: string; title?: string; body?: string }>)
    : [];
  const legacyItems = Array.isArray(pageContent?.tidbits)
    ? (pageContent.tidbits as Array<{
        icon?: string;
        title?: string;
        body?: string;
      }>)
    : [];
  const raw = cfgItems.length > 0 ? cfgItems : legacyItems;
  const items: FactsGridItem[] = raw.map((it) => ({
    icon: it.icon,
    label: it.title,
    body: it.body,
  }));
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <FactsGridView
      id={block.id}
      type={block.type}
      showTitle={cfg.showTitle !== false}
      columns={String(cfg.columns ?? "auto")}
      cardStyle={String(cfg.cardStyle ?? "card")}
      labelVariant="tidbits"
      items={items}
      style={style}
      data={data}
    />,
  );
}

export function renderFunFactsReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const cfgItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{ icon?: string; question?: string; body?: string }>)
    : [];
  const legacyItems = Array.isArray(pageContent?.tidbits)
    ? (pageContent.tidbits as Array<{
        icon?: string;
        question?: string;
        body?: string;
      }>)
    : [];
  const raw = cfgItems.length > 0 ? cfgItems : legacyItems;
  const items: FactsGridItem[] = raw.map((it) => ({
    icon: it.icon,
    label: it.question,
    body: it.body,
  }));
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <FactsGridView
      id={block.id}
      type={block.type}
      showTitle={cfg.showTitle !== false}
      columns={String(cfg.columns ?? "auto")}
      cardStyle={String(cfg.cardStyle ?? "card")}
      labelVariant="fun-facts"
      items={items}
      style={style}
      data={data}
    />,
  );
}

export function renderTextReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const contentKey = cfg.contentKey as string | undefined;
  const heading = contentKey
    ? String(pageContent?.[`${contentKey}_heading`] ?? cfg.heading ?? "")
    : String(cfg.heading ?? "");
  const body = contentKey
    ? String(pageContent?.[contentKey] ?? cfg.body ?? "")
    : String(cfg.body ?? cfg.text ?? cfg.content ?? "");
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <TextView
      id={block.id}
      type={block.type}
      heading={heading}
      body={body}
      contentKey={contentKey}
      headingStyle={fieldTextStyle(cfg, "heading")}
      bodyStyle={fieldTextStyle(cfg, "body")}
      style={style}
      data={data}
    />,
  );
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

export function renderRegistryCardReact(ctx: RenderContext): string {
  const { block, cfg, accent } = ctx;
  const url = cfg.url as string | undefined;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <RegistryCardView
      id={block.id}
      type={block.type}
      name={cfg.name as string | undefined}
      note={cfg.note as string | undefined}
      href={url ? safeUrl(url) : undefined}
      accent={accent}
      style={style}
      data={data}
    />,
  );
}

export function renderHotelCardReact(ctx: RenderContext): string {
  const { block, cfg, accent } = ctx;
  const url = cfg.url as string | undefined;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <HotelCardView
      id={block.id}
      type={block.type}
      name={cfg.name as string | undefined}
      address={cfg.address as string | undefined}
      note={cfg.note as string | undefined}
      href={url ? safeUrl(url) : undefined}
      accent={accent}
      style={style}
      data={data}
    />,
  );
}

export function renderInfoCardReact(ctx: RenderContext): string {
  const { block, cfg, accent } = ctx;
  const variant = String(cfg.variant ?? "registry");
  const isHotel = variant === "hotel";
  const name = String(
    cfg.name ?? cfg.title ?? (isHotel ? "Hotel" : "Registry"),
  );
  const url = cfg.url as string | undefined;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <InfoCardView
      id={block.id}
      type={block.type}
      // Real "&" -> React escapes to &amp; (matches the legacy raw-inserted h2).
      headingDisplay={isHotel ? "Hotels & Accommodations" : "Registry"}
      // Literal "&amp;" -> React escapes to &amp;amp;, reproducing the legacy
      // escHtml(headingLabel) double-escape. Faithful, not a new bug.
      ariaLabel={isHotel ? "Hotels &amp; Accommodations" : "Registry"}
      name={name}
      address={cfg.address as string | undefined}
      href={url ? safeUrl(url) : undefined}
      imageUrl={cfg.imageUrl as string | undefined}
      imgMaxWidth={isHotel ? "200px" : "120px"}
      linkLabel={isHotel ? "Book Now" : "View Registry"}
      accent={accent}
      style={style}
      data={data}
    />,
  );
}
