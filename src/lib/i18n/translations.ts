export const TRANSLATABLE_FIELDS: Record<
  string,
  { key: string; label: string; multiline?: boolean }[]
> = {
  "home-hero": [
    { key: "coupleNames", label: "Couple Names" },
    { key: "dateText", label: "Date" },
    { key: "locationText", label: "Location" },
  ],
  header: [{ key: "title", label: "Title" }],
  "multi-text": [
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", multiline: true },
  ],
  countdown: [{ key: "label", label: "Label" }],
  "venue-map": [{ key: "venueName", label: "Venue Name" }],
  "info-card": [{ key: "name", label: "Name" }],
  "rsvp-form": [
    { key: "heading", label: "Heading" },
    { key: "subheading", label: "Subheading" },
  ],
  "story-timeline": [{ key: "heading", label: "Heading" }],
  "guest-book": [
    { key: "heading", label: "Heading" },
    { key: "placeholder", label: "Placeholder" },
  ],
  gallery: [
    { key: "heading", label: "Heading" },
    { key: "body", label: "Body", multiline: true },
  ],
};
