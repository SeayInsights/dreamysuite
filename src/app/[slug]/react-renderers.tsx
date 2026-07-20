import type { RenderContext } from "./renderers";
import { renderReactToHtml } from "@/lib/blocks/reactToHtml";
import { blockContainerStyle, fieldTextStyle } from "@/lib/blocks/container";
import { safeUrl, escHtml } from "./helpers";
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
  TimelineView,
  FaqView,
  TravelView,
  type TimelineEvent,
  type FaqItem,
  type TravelItem,
} from "@/app/components/blocks/presentational/listViews";
import { TextModeView } from "@/app/components/blocks/presentational/TextModeView";
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

export function renderScheduleReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const cfgEvents = Array.isArray(cfg.events)
    ? (cfg.events as TimelineEvent[])
    : [];
  const legacyEvents = Array.isArray(pageContent?.events)
    ? (pageContent.events as TimelineEvent[])
    : [];
  const events = cfgEvents.length > 0 ? cfgEvents : legacyEvents;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <TimelineView
      id={block.id}
      type={block.type}
      heading="The Day"
      placeholderText="The wedding day schedule will appear here once added in the Content tab."
      events={events}
      style={style}
      data={data}
    />,
  );
}

export function renderFaqReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const cfgItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{ question?: string; answer?: string }>)
    : [];
  const legacyItems = Array.isArray(pageContent?.questions)
    ? (pageContent.questions as FaqItem[])
    : [];
  const questions: FaqItem[] =
    cfgItems.length > 0
      ? cfgItems.map((i) => ({ q: i.question, a: i.answer }))
      : legacyItems;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <FaqView
      id={block.id}
      type={block.type}
      heading="Questions & Answers"
      placeholderText="Frequently asked questions will appear here once added in the Content tab."
      questions={questions}
      style={style}
      data={data}
    />,
  );
}

export function renderTravelSectionReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const title = (cfg.title as string | undefined) ?? "Getting There";
  const cfgItems = Array.isArray(cfg.items) ? (cfg.items as TravelItem[]) : [];
  const legacyItems = Array.isArray(pageContent?.travelItems)
    ? (pageContent.travelItems as TravelItem[])
    : [];
  const items = cfgItems.length > 0 ? cfgItems : legacyItems;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <TravelView
      id={block.id}
      type={block.type}
      heading={title}
      placeholderText="Travel details will appear here once added in the Content tab."
      items={items}
      multilineBody
      style={style}
      data={data}
    />,
  );
}

export function renderTravelReact(ctx: RenderContext): string {
  const { block, cfg } = ctx;
  const title = (cfg.title as string | undefined) ?? "Getting There";
  const items = Array.isArray(cfg.items) ? (cfg.items as TravelItem[]) : [];
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <TravelView
      id={block.id}
      type={block.type}
      heading={title}
      placeholderText="Travel details will appear here once added in the Content tab."
      items={items}
      multilineBody
      style={style}
      data={data}
    />,
  );
}

export function renderMultiTextReact(ctx: RenderContext): string {
  const { block, cfg, pageContent } = ctx;
  const mode = String(cfg.mode ?? "text");
  const rawTitle = String(cfg.title ?? "");
  const { style, data } = blockContainerStyle(cfg);

  if (mode === "schedule") {
    const events = Array.isArray(pageContent?.events)
      ? (pageContent.events as TimelineEvent[])
      : [];
    return renderReactToHtml(
      <TimelineView
        id={block.id}
        type={block.type}
        heading={rawTitle || "The Day"}
        placeholderText="The schedule will appear here once added in the Content tab."
        events={events}
        style={style}
        data={data}
      />,
    );
  }

  if (mode === "faq") {
    const questions = Array.isArray(pageContent?.questions)
      ? (pageContent.questions as FaqItem[])
      : [];
    return renderReactToHtml(
      <FaqView
        id={block.id}
        type={block.type}
        heading={rawTitle || "Questions & Answers"}
        placeholderText="Q&A items will appear here once added in the Content tab."
        questions={questions}
        style={style}
        data={data}
      />,
    );
  }

  if (mode === "tidbits") {
    const raw = Array.isArray(pageContent?.tidbits)
      ? (pageContent.tidbits as Array<{
          icon?: string;
          title?: string;
          body?: string;
        }>)
      : [];
    const items: FactsGridItem[] = raw.map((it) => ({
      icon: it.icon,
      label: it.title,
      body: it.body,
    }));
    return renderReactToHtml(
      <FactsGridView
        id={block.id}
        type={block.type}
        showTitle={cfg.showTitle !== false}
        columns={String(cfg.columns ?? "auto")}
        cardStyle={String(cfg.cardStyle ?? "card")}
        labelVariant="tidbits"
        items={items}
        titleOverride={rawTitle || undefined}
        style={style}
        data={data}
      />,
    );
  }

  if (mode === "travel") {
    const travelItems = Array.isArray(pageContent?.travelItems)
      ? (pageContent.travelItems as TravelItem[])
      : [];
    return renderReactToHtml(
      <TravelView
        id={block.id}
        type={block.type}
        heading={rawTitle || "Getting There"}
        placeholderText="Travel details will appear here once added in the Content tab."
        items={travelItems}
        multilineBody={false}
        style={style}
        data={data}
      />,
    );
  }

  // Default: text mode. sectionTitle is escHtml-escaped to match the legacy
  // fallback exactly (the h2 then escapes again — a faithful double-escape when
  // the heading falls back to the title).
  const contentKey = cfg.contentKey as string | undefined;
  const sectionTitle = escHtml(rawTitle);
  const textItemsArr = Array.isArray(cfg.textItems)
    ? (cfg.textItems as Array<{ heading?: string; body?: string }>)
    : null;
  const singleHeading = contentKey
    ? String(
        pageContent?.[`${contentKey}_heading`] ?? cfg.heading ?? sectionTitle,
      )
    : String(cfg.heading ?? sectionTitle ?? "");
  const singleBody = contentKey
    ? String(pageContent?.[contentKey] ?? cfg.body ?? "")
    : String(cfg.body ?? cfg.text ?? cfg.content ?? "");
  const items = textItemsArr ?? [{ heading: singleHeading, body: singleBody }];
  const langKey = !textItemsArr && contentKey ? contentKey : undefined;
  return renderReactToHtml(
    <TextModeView
      id={block.id}
      type={block.type}
      items={items}
      headingStyle={fieldTextStyle(cfg, "heading")}
      bodyStyle={fieldTextStyle(cfg, "body")}
      langKey={langKey}
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
