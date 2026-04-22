"use client";

import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";

interface Block { id: string; type: string; [key: string]: unknown }

interface Hotel {
  id: string;
  placeId: string;
  name: string;
  photo?: string;
  rating?: number;
  featured?: boolean;
  stayingHere?: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const startDate = new Date(start + "T00:00:00");
  const startStr = startDate.toLocaleDateString("en-US", opts);
  if (!end || end === start) return startStr;
  const endDate = new Date(end + "T00:00:00");
  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
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
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: 300, borderRadius: "12px" }}
      allowFullScreen
      loading="lazy"
    />
  );
}

function HotelCard({ hotel, venueCoords }: { hotel: Hotel; venueCoords?: Coordinates }) {
  const distance = venueCoords
    ? haversineDistance(venueCoords, { lat: 0, lng: 0 })
    : null;
  void distance;

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-3">
      {hotel.photo && (
        <div
          className="h-16 w-16 shrink-0 rounded-md bg-cover bg-center"
          style={{ backgroundImage: `url(/api/places/photo?ref=${encodeURIComponent(hotel.photo)})` }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{hotel.name}</p>
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
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Venue");
  const venueName = typeof cfg.venueName === "string" ? cfg.venueName : "";
  const venuePlaceId = typeof cfg.venuePlaceId === "string" ? cfg.venuePlaceId : "";
  const coords = cfg.venueCoordinates as Coordinates | undefined;
  const dateStart = typeof cfg.dateStart === "string" ? cfg.dateStart : undefined;
  const dateEnd = typeof cfg.dateEnd === "string" ? cfg.dateEnd : undefined;
  const noteToGuests = typeof cfg.noteToGuests === "string" ? cfg.noteToGuests : "";
  const hotels: Hotel[] = Array.isArray(cfg.hotels)
    ? (cfg.hotels as Hotel[]).filter((h) => h && typeof h === "object" && typeof h.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const editing = !fullPreview;

  const dateRange = formatDateRange(dateStart, dateEnd);
  const hasVenue = !!venueName && (!!venuePlaceId || !!coords);

  return (
    <section
      className="block block-venue-map"
      data-block-id={block.id}
      data-block-type={block.type}
      style={blockSectionStyle(cfg)}
    >
      <TextEffectWrapper as="h2" className="section-heading" style={{ textAlign: "center" }}>
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
        <div style={{ minHeight: 300, borderRadius: "12px", overflow: "hidden" }}>
          {hasVenue && venuePlaceId ? (
            <EmbeddedMap placeId={venuePlaceId} />
          ) : hasVenue ? (
            <div className="flex h-full items-center justify-center rounded-lg bg-muted/30 text-xs text-muted-foreground" style={{ minHeight: 300 }}>
              Map requires a place ID — re-search the venue to load it.
            </div>
          ) : editing ? (
            <div
              className="flex h-full items-center justify-center rounded-lg"
              style={{ minHeight: 300 }}
            >
              <p className="text-xs text-muted-foreground italic">
                Set your venue location in Page Settings &rarr; Info to show the map
              </p>
            </div>
          ) : null}
        </div>

        {/* Right — Info + Hotels */}
        {hasVenue && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{venueName}</h3>
              {dateRange && (
                <p className="mt-0.5 text-sm text-muted-foreground">{dateRange}</p>
              )}
            </div>

            {noteToGuests && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Note to Guests
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">{noteToGuests}</p>
              </div>
            )}

            {(hotels.length > 0 || editing) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Hotels
                </p>
                <div className="mt-2 space-y-2">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} venueCoords={coords} />
                  ))}
                  {hotels.length === 0 && editing && (
                    <p className="text-xs text-muted-foreground italic">
                      Add hotels from the inspector panel.
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
