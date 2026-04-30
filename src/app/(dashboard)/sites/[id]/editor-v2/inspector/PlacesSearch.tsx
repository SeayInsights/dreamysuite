"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (await res.json()) as any;
          setResults(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data.results ?? data.predictions ?? []).map((r: any) => ({
              placeId: String(r.place_id ?? r.placeId ?? ""),
              name: String(r.name ?? r.description ?? ""),
              address: String(r.formatted_address ?? r.address ?? ""),
              lat: r.geometry?.location?.lat as number | undefined,
              lng: r.geometry?.location?.lng as number | undefined,
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

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const result = data.result ?? data;
    const photoRefs: string[] = result.photoRefs ?? (result.photos ?? []).slice(0, 5).map((p: { photo_reference: string }) => p.photo_reference);
    return {
      name: String(result.name ?? ""),
      photo: photoRefs[0] ?? result.photo ?? undefined,
      photoRefs: photoRefs.length > 0 ? photoRefs : undefined,
      rating: result.rating as number | undefined,
      lat: result.geometry?.location?.lat as number | undefined,
      lng: result.geometry?.location?.lng as number | undefined,
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
