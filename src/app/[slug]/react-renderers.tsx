import type { CSSProperties } from "react";
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
  CountdownView,
  VideoView,
  MediaVideoView,
} from "@/app/components/blocks/presentational/mediaViews";
import {
  ImagesView,
  GalleryView,
} from "@/app/components/blocks/presentational/mediaGridViews";
import {
  PhotoSplitView,
  StoryTimelineView,
  type PsComponent,
  type StoryTimelineEvent,
} from "@/app/components/blocks/presentational/mediaSplitViews";
import {
  RsvpFormView,
  GuestBookView,
} from "@/app/components/blocks/presentational/formViews";
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
export function renderHomeHeroReact(ctx: RenderContext): Promise<string> {
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
  const eyebrow = cfg.eyebrow ? String(cfg.eyebrow) : undefined;
  // Hero background image: sanitize scheme + escape for safe use inside url('…').
  const rawImage = cfg.imageUrl as string | undefined;
  const imageUrl = rawImage
    ? safeUrl(String(rawImage)).replace(/\\/g, "\\\\").replace(/'/g, "\\'")
    : undefined;
  const heroImage = imageUrl && imageUrl !== "#" ? imageUrl : undefined;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <HomeHeroView
      id={block.id}
      type={block.type}
      title={title}
      date={date}
      location={location}
      eyebrow={eyebrow}
      imageUrl={heroImage}
      style={style}
      data={data}
      titleStyle={fieldTextStyle(cfg, "coupleNames")}
      dateStyle={fieldTextStyle(cfg, "dateText")}
      locationStyle={fieldTextStyle(cfg, "locationText")}
    />,
  );
}

export function renderSpacerReact(ctx: RenderContext): Promise<string> {
  const height = Math.max(0, Math.min(400, Number(ctx.cfg.height ?? 60)));
  return renderReactToHtml(<SpacerView height={height} />);
}

export function renderHeaderReact(ctx: RenderContext): Promise<string> {
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

export function renderTidbitsReact(ctx: RenderContext): Promise<string> {
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

export function renderFunFactsReact(ctx: RenderContext): Promise<string> {
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

export function renderRsvpReact(ctx: RenderContext): Promise<string> {
  const { block, cfg, siteSlug } = ctx;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <RsvpFormView
      id={block.id}
      type={block.type}
      title={(cfg.title as string | undefined) ?? "RSVP"}
      subheading=""
      slug={siteSlug ?? ""}
      style={style}
      data={data}
    />,
  );
}

export function renderRsvpFormReact(ctx: RenderContext): Promise<string> {
  const { block, cfg, siteSlug } = ctx;
  const title =
    (cfg.heading as string | undefined) ??
    (cfg.title as string | undefined) ??
    "RSVP";
  return renderReactToHtml(
    <RsvpFormView
      id={block.id}
      type={block.type}
      title={title}
      subheading={(cfg.subheading as string | undefined) ?? ""}
      slug={siteSlug ?? ""}
      {...blockContainerStyle(cfg)}
    />,
  );
}

export function renderGuestBookReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const { style, data } = blockContainerStyle(cfg);
  const sectionStyle: CSSProperties = {
    ...style,
    maxWidth: "600px",
    margin: "0 auto",
  };
  return renderReactToHtml(
    <GuestBookView
      id={block.id}
      type={block.type}
      siteId={block.siteId}
      heading={String(cfg.heading ?? "Guest Book")}
      placeholderText={String(
        cfg.placeholder ?? "Leave a message for the happy couple…",
      )}
      sectionStyle={sectionStyle}
      data={data}
    />,
  );
}

export function renderPhotoSplitReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const photo = (cfg.photo as Record<string, unknown> | undefined) ?? {};
  const flatImageUrl = cfg.imageUrl as string | undefined;
  const photoUrl = String(flatImageUrl ?? photo.url ?? "");
  const photoSide = String(cfg.photoSide ?? cfg.layout ?? "left");
  const cropVal = String(photo.crop ?? "center");
  const wPx = photo.widthPx ? `${Number(photo.widthPx)}px` : "auto";
  const hPx = photo.heightPx ? `${Number(photo.heightPx)}px` : "auto";
  const offsetX = Number(photo.offsetX ?? 0);
  const marginDir = photoSide === "right" ? "right" : "left";
  const photoContainerStyle: CSSProperties = {
    flexShrink: 0,
    ...(offsetX !== 0
      ? marginDir === "right"
        ? { marginRight: `${offsetX}px` }
        : { marginLeft: `${offsetX}px` }
      : {}),
  };
  const imgStyle: CSSProperties = {
    width: wPx,
    height: hPx,
    maxWidth: "100%",
    objectFit: "cover",
    objectPosition: cropVal,
    borderRadius: "8px",
  };
  const flatHeading = cfg.heading as string | undefined;
  const flatBody =
    (cfg.body as string | undefined) ?? (cfg.text as string | undefined);
  const rawComponents =
    (cfg.components as Array<Record<string, unknown>>) ??
    (flatHeading || flatBody
      ? [{ type: "text", heading: flatHeading ?? "", body: flatBody ?? "" }]
      : []);
  const components: PsComponent[] = rawComponents.map((c) => {
    if (c.type === "text") {
      const hStyle: CSSProperties = {
        margin: "0 0 0.6rem",
        ...(c.headingSize ? { fontSize: String(c.headingSize) } : {}),
        ...(c.headingAlign
          ? { textAlign: c.headingAlign as CSSProperties["textAlign"] }
          : {}),
        ...(c.headingBold ? { fontWeight: 700 } : {}),
        ...(c.headingItalic ? { fontStyle: "italic" } : {}),
        ...(c.headingUnderline ? { textDecoration: "underline" } : {}),
      };
      const bStyle: CSSProperties = {
        margin: "0",
        lineHeight: "1.75",
        ...(c.bodySize ? { fontSize: String(c.bodySize) } : {}),
        ...(c.bodyAlign
          ? { textAlign: c.bodyAlign as CSSProperties["textAlign"] }
          : {}),
        ...(c.bodyBold ? { fontWeight: 700 } : {}),
        ...(c.bodyItalic ? { fontStyle: "italic" } : {}),
        ...(c.bodyUnderline ? { textDecoration: "underline" } : {}),
      };
      return {
        isText: true,
        heading: c.heading ? String(c.heading) : "",
        body: c.body ? String(c.body) : "",
        hStyle,
        bStyle,
      };
    }
    return { isText: false };
  });
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <PhotoSplitView
      id={block.id}
      type={block.type}
      photoUrl={photoUrl}
      photoContainerStyle={photoContainerStyle}
      imgStyle={imgStyle}
      photoFirst={photoSide !== "right"}
      components={components}
      style={style}
      data={data}
    />,
  );
}

export function renderStoryTimelineReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const heading = String(cfg.heading ?? "Our Story");
  const events = Array.isArray(cfg.events)
    ? (cfg.events as StoryTimelineEvent[])
    : [];
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <StoryTimelineView
      id={block.id}
      type={block.type}
      heading={heading}
      events={events}
      style={style}
      data={data}
    />,
  );
}

export function renderImagesReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const urls = cfg.urls as string[] | undefined;
  const focusX = String(cfg.imageFocusX ?? "center");
  const focusY = String(cfg.imageFocusY ?? "center");
  const phRaw = Number(cfg.photoHeight);
  const photoH = phRaw > 0 ? `${phRaw}px` : null;
  const pwRaw = Number(cfg.photoWidth);
  const photoW = pwRaw > 0 ? `${pwRaw}px` : null;
  const photoR = String(cfg.photoRadius ?? "8px");
  const photoBW = String(cfg.photoBorder ?? "0");
  const photoBColor = String(cfg.photoBorderColor ?? "#e0dbd4");
  const imgBaseStyle: CSSProperties = {
    objectPosition: `${focusX} ${focusY}`,
    borderRadius: photoR,
    ...(photoBW !== "0" ? { border: `${photoBW} solid ${photoBColor}` } : {}),
    ...(photoH ? { height: photoH } : {}),
    ...(photoW ? { width: photoW } : {}),
  };
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <ImagesView
      id={block.id}
      type={block.type}
      urls={urls}
      imageSlot={cfg.imageSlot as string | undefined}
      layout={String(cfg.layout ?? "grid-3")}
      offsetX={Number(cfg.galleryOffsetX ?? 0)}
      imgBaseStyle={imgBaseStyle}
      style={style}
      data={data}
    />,
  );
}

export function renderGalleryReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const urls = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
  const imageSlot = cfg.imageUrl as string | undefined;
  const images = imageSlot ? [imageSlot] : urls;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <GalleryView
      id={block.id}
      type={block.type}
      layout={String(cfg.layout ?? "grid")}
      imageUrl={cfg.imageUrl as string | undefined}
      heading={String(cfg.heading ?? "")}
      body={String(cfg.body ?? "")}
      imageLayout={String(cfg.imageLayout ?? "left")}
      images={images}
      style={style}
      data={data}
    />,
  );
}

export function renderCountdownReact(ctx: RenderContext): Promise<string> {
  const { block, settings, cfg, accent } = ctx;
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <CountdownView
      id={block.id}
      type={block.type}
      label={(cfg.label as string | undefined) ?? "Until we say I do"}
      labelStyle={fieldTextStyle(cfg, "label")}
      targetDate={settings?.eventDate ?? ""}
      showRsvp={!!cfg.showRsvpButton}
      rsvpText={String(cfg.rsvpButtonText ?? "RSVP Now")}
      rsvpBg={String(cfg.rsvpButtonColor ?? accent)}
      rsvpFg={String(cfg.rsvpButtonTextColor ?? "#fff")}
      rsvpBorderColor={
        cfg.rsvpButtonBorderColor
          ? String(cfg.rsvpButtonBorderColor)
          : undefined
      }
      style={style}
      data={data}
    />,
  );
}

export function renderVideoReact(ctx: RenderContext): Promise<string> {
  const { block, settings, cfg } = ctx;
  const cdXRaw = Number(cfg.countdownX ?? 0);
  const cdYRaw = Number(cfg.countdownY ?? 120);
  return renderReactToHtml(
    <VideoView
      id={block.id}
      type={block.type}
      vimeoId={cfg.vimeoId as string | undefined}
      url={cfg.url as string | undefined}
      height={(cfg.height as string | undefined) ?? "100dvh"}
      showCountdown={!!cfg.showCountdown}
      targetDate={settings?.eventDate ?? ""}
      cdX={isFinite(cdXRaw) ? cdXRaw : 0}
      cdY={isFinite(cdYRaw) ? cdYRaw : 120}
    />,
  );
}

export function renderMediaVideoReact(ctx: RenderContext): Promise<string> {
  const { block, cfg } = ctx;
  const url = cfg.url as string | undefined;
  const vimeoId = cfg.vimeoId as string | undefined;
  const height = (cfg.height as string | undefined) ?? "100dvh";
  const provider = cfg.provider as string | undefined;
  const isYoutube =
    provider === "youtube" ||
    (provider !== "direct" &&
      !!url &&
      (url.includes("youtube.com") || url.includes("youtu.be")));
  const resolvedVimeoId =
    vimeoId ??
    (provider === "vimeo" ||
    (provider !== "direct" && url?.includes("vimeo.com"))
      ? url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
      : undefined);
  const ytId = url
    ? (url.match(/(?:youtu\.be\/|[?&]v=)([^&\s]+)/)?.[1] ?? "")
    : "";
  const { style, data } = blockContainerStyle(cfg);
  return renderReactToHtml(
    <MediaVideoView
      id={block.id}
      type={block.type}
      resolvedVimeoId={resolvedVimeoId}
      isYoutube={isYoutube}
      ytId={ytId}
      url={url}
      height={height}
      style={style}
      data={data}
    />,
  );
}

export function renderScheduleReact(ctx: RenderContext): Promise<string> {
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

export function renderFaqReact(ctx: RenderContext): Promise<string> {
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

export function renderTravelSectionReact(ctx: RenderContext): Promise<string> {
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

export function renderTravelReact(ctx: RenderContext): Promise<string> {
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

export function renderMultiTextReact(ctx: RenderContext): Promise<string> {
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

export function renderTextReact(ctx: RenderContext): Promise<string> {
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

export function renderYoutubeReact(ctx: RenderContext): Promise<string> {
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

export function renderVenueMapReact(ctx: RenderContext): Promise<string> {
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

export function renderRegistryCardReact(ctx: RenderContext): Promise<string> {
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

export function renderHotelCardReact(ctx: RenderContext): Promise<string> {
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

export function renderInfoCardReact(ctx: RenderContext): Promise<string> {
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
