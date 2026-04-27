"use client";

import { useState, useCallback } from "react";
import { Globe } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { SitePhotoPicker } from "../SitePhotoPicker";
import { FormInput } from "./FormInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { PlacesAutocomplete, fetchPlaceDetails } from "./PlacesSearch";
import type { PlaceResult } from "./PlacesSearch";

// ---------------------------------------------------------------------------
// Page Settings Panel — Global site settings (no breakpoint cascading)
// ---------------------------------------------------------------------------

/**
 * PageSettingsPanel — Edits page-level/global settings.
 *
 * These settings apply to the entire site and do NOT support breakpoint
 * cascading (unlike block properties).
 *
 * Design: Build philosophy with 40-50% whitespace ratio, clear visual
 * separation from block settings.
 */

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

// ── Date/Time Input ────────────────────────────────────────────────────────

function DateTimeInput({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  helpText?: string;
}) {
  const dateVal = value?.slice(0, 10) ?? "";
  const timeVal = value?.slice(11, 16) ?? "";

  function update(date: string, time: string) {
    if (!date) {
      onChange(null);
      return;
    }
    onChange(time ? `${date}T${time}` : date);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <DatePicker
          value={dateVal}
          onChange={(v) => update(v, timeVal)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-9 flex-1"
        />
        <TimePicker
          value={timeVal}
          onChange={(v) => update(dateVal, v)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-9 w-28"
          placeholder="Time"
        />
      </div>
      {dateVal && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear date
        </button>
      )}
      {helpText && (
        <p className="text-xs leading-normal text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

// ── Venue & Hotels Section ────────────────────────────────────────────────

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
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Venue &amp; Hotels
      </p>

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

// ── Main Component ─────────────────────────────────────────────────────────

export function PageSettingsPanel() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-6 p-4">
      {/* Visual indicator: Page-level settings */}
      <div className="flex items-center gap-2 rounded-lg border-l-4 border-blue-500 bg-blue-50/50 px-3 py-2.5">
        <Globe className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-blue-900">Page Settings</h3>
          <p className="text-xs text-blue-700/80 leading-relaxed">
            Global settings that apply to the entire site (no breakpoint cascading)
          </p>
        </div>
      </div>

      {/* Event Info */}
      <FormInput
        mode="page"
        type="text"
        label="Event Name"
        value={settings.eventName ?? ""}
        onChange={(v) => updateSettings({ eventName: v || null })}
        placeholder="Our Wedding"
        helpText="The name of your event (e.g., 'Sarah & John's Wedding')"
      />

      <DateTimeInput
        label="Event Date & Time"
        value={settings.eventDate}
        onChange={(v) => updateSettings({ eventDate: v })}
        helpText="When is your event taking place?"
      />

      <FormInput
        mode="page"
        type="text"
        label="Location"
        value={settings.eventLocation ?? ""}
        onChange={(v) => updateSettings({ eventLocation: v || null })}
        placeholder="Grand Ballroom, New York"
        helpText="Brief location description (full details in Venue section below)"
      />

      {/* Venue & Hotels */}
      <div className="border-t border-border pt-6">
        <VenueHotelSection />
      </div>

      {/* SEO & Social */}
      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          SEO & Social
        </p>

        <FormInput
          mode="page"
          type="text"
          label="Page Title"
          value={settings.seoTitle ?? ""}
          onChange={(v) => updateSettings({ seoTitle: v || null })}
          placeholder="Custom page title"
          maxLength={60}
          helpText="Appears in browser tabs and search results (60 characters max)"
        />

        <FormInput
          mode="page"
          type="textarea"
          label="Meta Description"
          value={settings.seoDescription ?? ""}
          onChange={(v) => updateSettings({ seoDescription: v || null })}
          placeholder="A brief description for search engines"
          maxLength={160}
          helpText="Brief description for search engines and social shares (160 characters max)"
        />

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Social Image (OG)
          </label>
          <SitePhotoPicker
            value={settings.ogImage ?? null}
            onChange={(v) => updateSettings({ ogImage: v })}
          />
          <p className="text-xs leading-normal text-muted-foreground">
            Image shown when your site is shared on social media (1200x630px recommended)
          </p>
        </div>
      </div>
    </div>
  );
}
