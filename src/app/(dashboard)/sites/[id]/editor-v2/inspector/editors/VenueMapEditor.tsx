"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PanelTextInput, PanelTextArea, PanelDateInput } from "../PanelInputs";

interface Hotel {
  id: string;
  placeId: string;
  name: string;
  photo?: string;
  rating?: number;
  featured?: boolean;
  stayingHere?: boolean;
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

function usePlacesSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const fetchUrl = `/api/places/search?q=${encodeURIComponent(query)}`;
      console.log("[VenueSearch] Fetching:", fetchUrl);
      try {
        const res = await fetch(fetchUrl);
        console.log("[VenueSearch] Response status:", res.status);
        const text = await res.text();
        console.log("[VenueSearch] Raw response body:", text);
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = JSON.parse(text);
          setResults(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.results ?? data.predictions ?? []).map((r: any) => ({
              placeId: r.place_id ?? r.placeId ?? "",
              name: r.name ?? r.description ?? "",
              address: r.formatted_address ?? r.address ?? "",
              lat: (r.geometry as Record<string, Record<string, number>>)?.location?.lat,
              lng: (r.geometry as Record<string, Record<string, number>>)?.location?.lng,
            })),
          );
        }
      } catch (err) {
        console.error("[VenueSearch] Caught error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { query, setQuery, results, loading, clear };
}

async function fetchPlaceDetails(placeId: string): Promise<{ name: string; photo?: string; rating?: number; lat?: number; lng?: number } | null> {
  const fetchUrl = `/api/places/details?placeId=${encodeURIComponent(placeId)}`;
  console.log("[VenueDetails] Fetching:", fetchUrl);
  try {
    const res = await fetch(fetchUrl);
    console.log("[VenueDetails] Response status:", res.status);
    const text = await res.text();
    console.log("[VenueDetails] Raw response body:", text);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = JSON.parse(text);
    const result = data.result ?? data;
    return {
      name: result.name ?? "",
      photo: result.photos?.[0]?.photo_reference ?? result.photo ?? undefined,
      rating: result.rating ?? undefined,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
    };
  } catch (err) {
    console.error("[VenueDetails] Caught error:", err);
    return null;
  }
}

function PlacesAutocomplete({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
}) {
  const { query, setQuery, results, loading, clear } = usePlacesSearch();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {loading && results.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-muted-foreground">Searching...</p>
          )}
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              onClick={() => {
                onSelect(r);
                clear();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-accent/50 transition-colors"
            >
              <span className="font-medium text-foreground">{r.name}</span>
              {r.address && (
                <span className="ml-1 text-muted-foreground">{r.address}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent/50"
      }`}
    >
      {label}
    </button>
  );
}

export function VenueMapEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const heading = typeof cfg.heading === "string" ? cfg.heading : "";
  const venueName = typeof cfg.venueName === "string" ? cfg.venueName : "";
  const dateStart = typeof cfg.dateStart === "string" ? cfg.dateStart : "";
  const dateEnd = typeof cfg.dateEnd === "string" ? cfg.dateEnd : "";
  const noteToGuests = typeof cfg.noteToGuests === "string" ? cfg.noteToGuests : "";
  const hotels: Hotel[] = Array.isArray(cfg.hotels)
    ? (cfg.hotels as Hotel[]).filter((h) => h && typeof h === "object" && typeof h.id === "string")
    : [];

  const [addingHotel, setAddingHotel] = useState(false);

  function handleVenueSelect(place: PlaceResult) {
    const patch: Record<string, unknown> = {
      venueName: place.name,
      venuePlaceId: place.placeId,
    };
    if (place.lat != null && place.lng != null) {
      patch.venueCoordinates = { lat: place.lat, lng: place.lng };
    }
    updateConfig(patch);
  }

  async function handleHotelSelect(place: PlaceResult) {
    const details = await fetchPlaceDetails(place.placeId);
    const newHotel: Hotel = {
      id: crypto.randomUUID(),
      placeId: place.placeId,
      name: details?.name ?? place.name,
      photo: details?.photo,
      rating: details?.rating,
    };
    updateConfig({ hotels: [...hotels, newHotel] });
    setAddingHotel(false);
  }

  function deleteHotel(id: string) {
    updateConfig({ hotels: hotels.filter((h) => h.id !== id) });
  }

  function toggleHotel(id: string, field: "featured" | "stayingHere") {
    updateConfig({
      hotels: hotels.map((h) =>
        h.id === id ? { ...h, [field]: !h[field] } : h,
      ),
    });
  }

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="Venue"
      />

      <div className="space-y-1">
        {venueName && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">{venueName}</span>
            <button
              type="button"
              onClick={() => updateConfig({ venueName: "", venuePlaceId: "", venueCoordinates: undefined })}
              className="text-[10px] text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          </div>
        )}
        <PlacesAutocomplete
          label="Venue"
          placeholder="Search for venue..."
          onSelect={handleVenueSelect}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PanelDateInput
          label="Start Date"
          value={dateStart}
          onChange={(v) => updateConfig({ dateStart: v })}
        />
        <PanelDateInput
          label="End Date"
          value={dateEnd}
          onChange={(v) => updateConfig({ dateEnd: v })}
        />
      </div>

      <PanelTextArea
        label="Note to Guests"
        value={noteToGuests}
        onChange={(v) => updateConfig({ noteToGuests: v })}
        placeholder="Any special instructions for your guests..."
      />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Hotels ({hotels.length})
        </p>

        {hotels.length === 0 && !addingHotel && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No hotels yet. Click &quot;Add Hotel&quot; to get started.
          </p>
        )}

        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] font-medium text-foreground">
                {hotel.name}
              </span>
              <button
                type="button"
                onClick={() => deleteHotel(hotel.id)}
                title="Delete hotel"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                ✕
              </button>
            </div>
            {hotel.rating != null && (
              <p className="text-[10px] text-muted-foreground">
                Rating: {hotel.rating.toFixed(1)}
              </p>
            )}
            <div className="flex gap-1.5">
              <ToggleButton
                label="Featured"
                active={!!hotel.featured}
                onClick={() => toggleHotel(hotel.id, "featured")}
              />
              <ToggleButton
                label="We're staying here"
                active={!!hotel.stayingHere}
                onClick={() => toggleHotel(hotel.id, "stayingHere")}
              />
            </div>
          </div>
        ))}

        {addingHotel && (
          <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-3 space-y-2">
            <PlacesAutocomplete
              label="Search Hotel"
              placeholder="Search for a hotel..."
              onSelect={handleHotelSelect}
            />
            <button
              type="button"
              onClick={() => setAddingHotel(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
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
          className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          + Add Hotel
        </button>
      )}
    </div>
  );
}
