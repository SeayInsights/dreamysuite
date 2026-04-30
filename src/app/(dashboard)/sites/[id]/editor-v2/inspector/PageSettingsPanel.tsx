"use client";

import { Globe } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { FormInput } from "./FormInput";
import { DateTimeInput } from "./DateTimeInput";
import { LayoutSection } from "./LayoutSection";
import { VenueHotelSection } from "./VenueHotelSection";
import { Accordion } from "@/components/ui/Accordion";

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
      <Accordion
        title={
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Event Information
          </span>
        }
        defaultOpen={false}
      >
        <div className="space-y-4">
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
        </div>
      </Accordion>

      {/* Layout */}
      <Accordion
        title={
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Layout
          </span>
        }
        defaultOpen={false}
      >
        <LayoutSection />
      </Accordion>

      {/* Venue & Hotels */}
      <Accordion
        title={
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Venue & Hotels
          </span>
        }
        defaultOpen={false}
      >
        <VenueHotelSection />
      </Accordion>
    </div>
  );
}
