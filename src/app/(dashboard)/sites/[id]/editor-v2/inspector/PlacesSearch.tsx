"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PlacesSearchApiResponse,
  PlacesDetailsApiResponse,
} from "@/lib/schemas/places";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface PlaceDetails {
  name: string;
  photo?: string;
  photoRefs?: string[];
  rating?: number;
  lat?: number;
  lng?: number;
}

export function usePlacesSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local state from props/inputs after mount or a dep change; intentional one-way sync, not a render-phase cascade
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const parsed = PlacesSearchApiResponse.safeParse(await res.json());
          const rows = parsed.success ? parsed.data.results : [];
          setResults(
            rows.map((r) => ({
              placeId: r.place_id ?? "",
              name: r.name ?? "",
              address: r.formatted_address ?? "",
              lat: r.geometry?.location?.lat,
              lng: r.geometry?.location?.lng,
            })),
          );
        }
      } catch {
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

export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  try {
    const res = await fetch(
      `/api/places/details?placeId=${encodeURIComponent(placeId)}`,
    );
    if (!res.ok) return null;
    const parsed = PlacesDetailsApiResponse.safeParse(await res.json());
    const result = parsed.success ? parsed.data.result : undefined;
    if (!result) return null;
    const photoRefs = result.photoRefs ?? [];
    return {
      name: result.name ?? "",
      photo: photoRefs[0] ?? result.photo ?? undefined,
      photoRefs: photoRefs.length > 0 ? photoRefs : undefined,
      rating: result.rating,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
    };
  } catch {
    return null;
  }
}

export function PlacesAutocomplete({
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
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
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
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {loading && results.length === 0 && (
            <p className="px-3 py-2 text-[10px] text-muted-foreground">
              Searching...
            </p>
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
