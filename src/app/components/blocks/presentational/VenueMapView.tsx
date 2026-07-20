import type { CSSProperties } from "react";
import { Placeholder } from "./primitives";

export interface VenueMapViewProps {
  id: string;
  type: string;
  name?: string;
  note?: string;
  address?: string;
  /** Pre-sanitized map iframe src, or null when there is nothing to show. */
  mapSrc: string | null;
  style?: CSSProperties;
  data?: Record<string, string>;
}

/** Presentational venue-map block — single source for published markup. */
export function VenueMapView({
  id,
  type,
  name,
  note,
  address,
  mapSrc,
  style,
  data,
}: VenueMapViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  return (
    <section
      className="block block-venue-map"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      aria-label="Venue location"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">Venue</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {name ? <p className="venue-name">{name}</p> : null}
      {note ? <p className="venue-note">{note}</p> : null}
      {mapSrc ? (
        <>
          <div className="map-wrap">
            <iframe
              src={mapSrc}
              title={address ?? "Venue location"}
              frameBorder="0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="map-iframe"
              aria-label={`Google Maps showing ${address ?? "venue location"}`}
            />
          </div>
          <p className="venue-address">{address}</p>
        </>
      ) : (
        <Placeholder text="Venue address and map will appear here." />
      )}
    </section>
  );
}
