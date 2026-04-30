"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { FormInput } from "./FormInput";
import { PlacesAutocomplete, fetchPlaceDetails } from "./PlacesSearch";
import type { PlaceResult } from "./PlacesSearch";

// ── Hotel Types ────────────────────────────────────────────────────────────

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

function parseHotels(raw: string | null | undefined): Hotel[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (h): h is Hotel => h !== null && typeof h === "object" && typeof (h as Hotel).id === "string"
    );
  } catch {
    return [];
  }
}

// ── Venue & Hotels Section ────────────────────────────────────────────────

export function VenueHotelSection() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const venueName = settings.venueName ?? "";
  const hotels = parseHotels(settings.venueHotels);
  const venueNote = settings.venueNote ?? "";
  const [addingHotel, setAddingHotel] = useState(false);

  const handleVenueSelect = useCallback(
    (place: PlaceResult) => {
      const patch: Record<string, string | null> = {
        venueName: place.name,
        venuePlaceId: place.placeId,
      };
      if (place.lat != null && place.lng != null) {
        patch.venueCoordinates = JSON.stringify({ lat: place.lat, lng: place.lng });
      }
      updateSettings(patch);
    },
    [updateSettings]
  );

  const handleHotelSelect = useCallback(
    async (place: PlaceResult) => {
      const details = await fetchPlaceDetails(place.placeId);
      const newHotel: Hotel = {
        id: crypto.randomUUID(),
        placeId: place.placeId,
        name: details?.name ?? place.name,
        photo: details?.photo,
        photoRefs: details?.photoRefs,
        rating: details?.rating,
      };
      const updated = [...hotels, newHotel];
      updateSettings({ venueHotels: JSON.stringify(updated) });
      setAddingHotel(false);
    },
    [hotels, updateSettings]
  );

  function deleteHotel(id: string) {
    const updated = hotels.filter((h) => h.id !== id);
    updateSettings({ venueHotels: updated.length > 0 ? JSON.stringify(updated) : null });
  }

  function toggleHotel(id: string, field: "featured" | "stayingHere") {
    const updated = hotels.map((h) => (h.id === id ? { ...h, [field]: !h[field] } : h));
    updateSettings({ venueHotels: JSON.stringify(updated) });
  }

  return (
    <div className="space-y-4">
      {venueName && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5">
          <span className="text-sm text-foreground">{venueName}</span>
          <button
            type="button"
            onClick={() =>
              updateSettings({ venueName: null, venuePlaceId: null, venueCoordinates: null })
            }
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <PlacesAutocomplete label="Venue" placeholder="Search for venue..." onSelect={handleVenueSelect} />

      <FormInput
        mode="page"
        type="textarea"
        label="Note to Guests"
        value={venueNote}
        onChange={(v) => updateSettings({ venueNote: v || null })}
        placeholder="Any special instructions for your guests..."
      />

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Hotels ({hotels.length})
        </p>

        {hotels.length === 0 && !addingHotel && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground italic leading-relaxed">
            No hotels yet. Click &quot;Add Hotel&quot; to get started.
          </p>
        )}

        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="rounded-lg border border-border bg-background/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {hotel.name}
              </span>
              <button
                type="button"
                onClick={() => deleteHotel(hotel.id)}
                title="Delete hotel"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                ✕
              </button>
            </div>
            {hotel.rating != null && (
              <p className="text-xs text-muted-foreground">Rating: {hotel.rating.toFixed(1)}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleHotel(hotel.id, "featured")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  hotel.featured
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => toggleHotel(hotel.id, "stayingHere")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  hotel.stayingHere
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent/50"
                }`}
              >
                We&apos;re staying here
              </button>
            </div>
          </div>
        ))}

        {addingHotel && (
          <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 space-y-3">
            <PlacesAutocomplete
              label="Search Hotel"
              placeholder="Search for a hotel..."
              onSelect={handleHotelSelect}
            />
            <button
              type="button"
              onClick={() => setAddingHotel(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!addingHotel && (
        <button
          type="button"
          onClick={() => setAddingHotel(true)}
          className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          + Add Hotel
        </button>
      )}
    </div>
  );
}
