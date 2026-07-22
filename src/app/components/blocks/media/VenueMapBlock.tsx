"use client";

import { useState, useCallback } from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";

interface Block {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface Hotel {
  id: string;
  placeId: string;
  name: string;
  photo?: string;
  photoRefs?: string[];
  photoIndex?: number;
  rating?: number;
  featured?: boolean;
  stayingHere?: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function parseHotels(raw: string | null | undefined): Hotel[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (h): h is Hotel =>
        h !== null &&
        typeof h === "object" &&
        typeof (h as Hotel).id === "string",
    );
  } catch {
    return [];
  }
}

function parseCoords(raw: string | null | undefined): Coordinates | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as Record<string, unknown>).lat === "number" &&
      typeof (parsed as Record<string, unknown>).lng === "number"
    ) {
      return parsed as Coordinates;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return "";
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const startDate = new Date(start + "T00:00:00");
  const startStr = startDate.toLocaleDateString("en-US", opts);
  if (!end || end === start) return startStr;
  const endDate = new Date(end + "T00:00:00");
  if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth()
  ) {
    return `${startDate.toLocaleDateString("en-US", { month: "short" })} ${startDate.getDate()} – ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }
  return `${startStr} – ${endDate.toLocaleDateString("en-US", opts)}`;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="text-[11px] text-amber-500" aria-label={`${rating} stars`}>
      {"★".repeat(full)}
      {half && "½"}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

function EmbeddedMap({ placeId }: { placeId: string }) {
  return (
    <iframe
      src={`/api/maps/embed?placeId=${encodeURIComponent(placeId)}`}
      title="Venue map"
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: 300, borderRadius: "12px" }}
      allowFullScreen
      loading="lazy"
    />
  );
}

function HotelCard({
  hotel,
  venueCoords,
  editing,
  onPhotoIndexChange,
}: {
  hotel: Hotel;
  venueCoords?: Coordinates;
  editing: boolean;
  onPhotoIndexChange: (id: string, index: number) => void;
}) {
  const distance = venueCoords
    ? haversineDistance(venueCoords, { lat: 0, lng: 0 })
    : null;
  void distance;

  const [hovered, setHovered] = useState(false);
  const photoRefs = hotel.photoRefs ?? (hotel.photo ? [hotel.photo] : []);
  const photoIndex = hotel.photoIndex ?? 0;
  const currentPhotoRef = photoRefs[photoIndex] ?? hotel.photo;
  const hasMultiple = photoRefs.length > 1;

  return (
    <div
      className="flex gap-3 rounded-lg border border-border bg-background p-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {currentPhotoRef && (
        <div className="relative h-16 w-16 shrink-0">
          <div
            className="h-16 w-16 rounded-md bg-cover bg-center"
            style={{
              backgroundImage: `url(/api/places/photo?ref=${encodeURIComponent(currentPhotoRef)})`,
            }}
          />
          {editing && hasMultiple && hovered && (
            <>
              <button
                type="button"
                onClick={() =>
                  onPhotoIndexChange(
                    hotel.id,
                    (photoIndex - 1 + photoRefs.length) % photoRefs.length,
                  )
                }
                className="absolute left-0 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[9px] text-white hover:bg-black/70"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() =>
                  onPhotoIndexChange(
                    hotel.id,
                    (photoIndex + 1) % photoRefs.length,
                  )
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[9px] text-white hover:bg-black/70"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {hotel.name}
        </p>
        {hotel.rating != null && <StarRating rating={hotel.rating} />}
        <div className="mt-1 flex flex-wrap gap-1">
          {hotel.featured && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Featured
            </span>
          )}
          {hotel.stayingHere && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              We&apos;re staying here
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function VenueMapBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as
    | "desktop"
    | "tablet"
    | "mobile";
  const cfg = parseCfg(block.config);
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const fullPreview = useEditorStore((s) => s.fullPreview);
  const editing = !fullPreview;

  // Read from settings first, fall back to block config for backward compat
  const heading = String(cfg.heading ?? "Venue");
  const dateStart =
    typeof cfg.dateStart === "string" ? cfg.dateStart : undefined;
  const dateEnd = typeof cfg.dateEnd === "string" ? cfg.dateEnd : undefined;

  const venueName =
    settings.venueName ??
    (typeof cfg.venueName === "string" ? cfg.venueName : "");
  const venuePlaceId =
    settings.venuePlaceId ??
    (typeof cfg.venuePlaceId === "string" ? cfg.venuePlaceId : "");
  const coords =
    parseCoords(settings.venueCoordinates) ??
    (cfg.venueCoordinates as Coordinates | undefined);
  const noteToGuests =
    settings.venueNote ??
    (typeof cfg.noteToGuests === "string" ? cfg.noteToGuests : "");

  // Hotels from settings JSON, fall back to block config array
  const settingsHotels = parseHotels(settings.venueHotels);
  const cfgHotels: Hotel[] = Array.isArray(cfg.hotels)
    ? (cfg.hotels as Hotel[]).filter(
        (h) => h && typeof h === "object" && typeof h.id === "string",
      )
    : [];
  const hotels = settingsHotels.length > 0 ? settingsHotels : cfgHotels;

  const dateRange = formatDateRange(dateStart, dateEnd);
  const hasVenue = !!venueName && (!!venuePlaceId || !!coords);

  /* eslint-disable react-hooks/preserve-manual-memoization -- these handlers use intentional manual useCallback memoization keyed to the hotels list; the compiler must not re-derive their deps. */
  const handlePhotoIndexChange = useCallback(
    (id: string, index: number) => {
      const updated = hotels.map((h) =>
        h.id === id ? { ...h, photoIndex: index } : h,
      );
      updateSettings({ venueHotels: JSON.stringify(updated) });
    },
    [hotels, updateSettings],
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  return (
    <section
      className="block block-venue-map"
      data-block-id={block.id}
      data-block-type={block.type}
      style={blockSectionStyle(cfg, breakpoint)}
    >
      <TextEffectWrapper
        as="h2"
        className="section-heading"
        style={{ textAlign: "center" }}
      >
        {heading}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: hasVenue ? "1fr 1fr" : "1fr",
          gap: "2rem",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "1rem 0",
        }}
      >
        {/* Left — Map */}
        <div
          style={{ minHeight: 300, borderRadius: "12px", overflow: "hidden" }}
        >
          {hasVenue && venuePlaceId ? (
            <EmbeddedMap placeId={venuePlaceId} />
          ) : hasVenue ? (
            <div
              className="flex h-full items-center justify-center rounded-lg bg-muted/30 text-xs text-muted-foreground"
              style={{ minHeight: 300 }}
            >
              Map requires a place ID — re-search the venue to load it.
            </div>
          ) : editing ? (
            <div
              className="flex h-full items-center justify-center rounded-lg"
              style={{ minHeight: 300 }}
            >
              <p className="text-xs text-muted-foreground italic">
                Set your venue location in Page Settings &rarr; Info to show the
                map
              </p>
            </div>
          ) : null}
        </div>

        {/* Right — Info + Hotels */}
        {hasVenue && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {venueName}
              </h3>
              {dateRange && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {dateRange}
                </p>
              )}
            </div>

            {noteToGuests && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Note to Guests
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {noteToGuests}
                </p>
              </div>
            )}

            {(hotels.length > 0 || editing) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hotels
                </p>
                <div className="mt-2 space-y-2">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      venueCoords={coords}
                      editing={editing}
                      onPhotoIndexChange={handlePhotoIndexChange}
                    />
                  ))}
                  {hotels.length === 0 && editing && (
                    <p className="text-xs text-muted-foreground italic">
                      Add hotels from Page Settings &rarr; Info.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
