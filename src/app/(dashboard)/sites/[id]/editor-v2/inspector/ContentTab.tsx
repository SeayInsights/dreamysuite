"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { SitePhotoPicker } from "../SitePhotoPicker";
import { BlockContentPanel } from "./BlockContentPanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { PlacesAutocomplete, fetchPlaceDetails } from "./PlacesSearch";
import type { PlaceResult } from "./PlacesSearch";

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[10px] tabular-nums ${draft.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        {maxLength && (
          <span className={`text-[10px] tabular-nums ${draft.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {draft.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={draft}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full resize-none rounded border border-input bg-background px-2.5 py-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function DateTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const dateVal = value?.slice(0, 10) ?? "";
  const timeVal = value?.slice(11, 16) ?? "";

  function update(date: string, time: string) {
    if (!date) { onChange(null); return; }
    onChange(time ? `${date}T${time}` : date);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-1.5">
        <DatePicker
          value={dateVal}
          onChange={(v) => update(v, timeVal)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 flex-1"
        />
        <TimePicker
          value={timeVal}
          onChange={(v) => update(dateVal, v)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 w-24"
          placeholder="Time"
        />
      </div>
      {dateVal && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[10px] text-muted-foreground hover:text-destructive"
        >
          Clear date
        </button>
      )}
    </div>
  );
}

// ── Hotel helpers ─────────────────────────────────────────────────────────────

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
      (h): h is Hotel => h !== null && typeof h === "object" && typeof (h as Hotel).id === "string",
    );
  } catch {
    return [];
  }
}

function parseCoords(raw: string | null | undefined): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as Record<string, unknown>).lat === "number" &&
      typeof (parsed as Record<string, unknown>).lng === "number"
    ) {
      return parsed as { lat: number; lng: number };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

// ── VenueHotelSection ─────────────────────────────────────────────────────────

function VenueHotelSection() {
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
    [updateSettings],
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
    [hotels, updateSettings],
  );

  function deleteHotel(id: string) {
    const updated = hotels.filter((h) => h.id !== id);
    updateSettings({ venueHotels: updated.length > 0 ? JSON.stringify(updated) : null });
  }

  function toggleHotel(id: string, field: "featured" | "stayingHere") {
    const updated = hotels.map((h) =>
      h.id === id ? { ...h, [field]: !h[field] } : h,
    );
    updateSettings({ venueHotels: JSON.stringify(updated) });
  }

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Venue &amp; Hotels
      </p>

      {venueName && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">{venueName}</span>
          <button
            type="button"
            onClick={() =>
              updateSettings({ venueName: null, venuePlaceId: null, venueCoordinates: null })
            }
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

      <TextArea
        label="Note to Guests"
        value={venueNote || null}
        onChange={(v) => updateSettings({ venueNote: v })}
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
              <p className="text-[10px] text-muted-foreground">Rating: {hotel.rating.toFixed(1)}</p>
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => toggleHotel(hotel.id, "featured")}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
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
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
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

// ── CONTENT_BLOCK_TYPES ───────────────────────────────────────────────────────

const CONTENT_BLOCK_TYPES = new Set([
  "faq",
  "schedule",
  "fun-facts",
  "travel",
  "video",
  "media-video",
  "content-card",
  "countdown",
  "venue-map",
]);

// ── ContentTab ────────────────────────────────────────────────────────────────

export function ContentTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null;
  const showBlockPanel = selectedBlock !== null && CONTENT_BLOCK_TYPES.has(selectedBlock.type);

  if (showBlockPanel) {
    return (
      <div>
        <div className="border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => selectBlock(null)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Page settings
          </button>
        </div>
        <BlockContentPanel block={selectedBlock} updateBlock={updateBlock} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <TextInput
        label="Event Name"
        value={settings.eventName}
        onChange={(v) => updateSettings({ eventName: v })}
        placeholder="Our Wedding"
      />

      <DateTimeInput
        label="Event Date & Time"
        value={settings.eventDate}
        onChange={(v) => updateSettings({ eventDate: v })}
      />

      <TextInput
        label="Location"
        value={settings.eventLocation}
        onChange={(v) => updateSettings({ eventLocation: v })}
        placeholder="Grand Ballroom, New York"
      />

      <VenueHotelSection />

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          SEO & Social
        </p>
        <div className="space-y-3">
          <TextInput
            label="Page Title"
            value={settings.seoTitle}
            onChange={(v) => updateSettings({ seoTitle: v })}
            placeholder="Custom page title"
            maxLength={60}
          />

          <TextArea
            label="Meta Description"
            value={settings.seoDescription}
            onChange={(v) => updateSettings({ seoDescription: v })}
            placeholder="A brief description for search engines"
            maxLength={160}
          />

          <SitePhotoPicker
            label="Social Image (OG)"
            value={settings.ogImage ?? null}
            onChange={(v) => updateSettings({ ogImage: v })}
          />
        </div>
      </div>
    </div>
  );
}
