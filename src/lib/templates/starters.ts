import type { D1Database } from "@cloudflare/workers-types";

/**
 * Starter templates — code-defined so a new site can be created pre-populated
 * instead of blank. Each starter is a set of pages (with blocks) plus a theme
 * (site_setting values). `applyStarter` clones the chosen starter into a freshly
 * created site. Adding a template is just adding an entry here.
 */

export interface StarterBlock {
  type: string;
  config: Record<string, unknown>;
}

export interface StarterPage {
  slug: string;
  label: string;
  blocks: StarterBlock[];
}

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  eventType: string;
  previewColor: string;
  /** site_setting theme values, or null to leave defaults. */
  settings: Record<string, unknown> | null;
  pages: StarterPage[];
}

export const STARTERS: StarterTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "An empty site — build every page from scratch.",
    eventType: "wedding",
    previewColor: "#B8921A",
    settings: null,
    pages: [],
  },
  {
    id: "classic-wedding",
    name: "Classic Wedding",
    description: "Timeless serif elegance with an envelope entrance.",
    eventType: "wedding",
    previewColor: "#B8921A",
    settings: {
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      accentColor: "#B8921A",
      bgColor: "#faf8f5",
      siteTextColor: "#1c1917",
      animation: "envelope",
      eventName: "Our Wedding",
      greeting: "We can't wait to celebrate this day with you.",
    },
    pages: [
      {
        slug: "home",
        label: "Home",
        blocks: [
          { type: "home-hero", config: {} },
          {
            type: "countdown",
            config: {
              label: "Counting down to forever",
              showRsvpButton: true,
              rsvpButtonText: "RSVP",
            },
          },
        ],
      },
      {
        slug: "story",
        label: "Our Story",
        blocks: [
          {
            type: "multi-text",
            config: {
              mode: "text",
              heading: "Our Story",
              body: "Share how you met, the proposal, and the journey that brought you here. Replace this text with your own story.",
            },
          },
        ],
      },
      {
        slug: "rsvp",
        label: "RSVP",
        blocks: [
          {
            type: "rsvp-form",
            config: {
              heading: "RSVP",
              subheading: "Kindly let us know if you can join us.",
            },
          },
        ],
      },
      {
        slug: "faq",
        label: "FAQ",
        blocks: [
          {
            type: "faq",
            config: {
              heading: "Questions & Answers",
              displayMode: "faq",
              columns: "1",
              items: [
                {
                  id: "q1",
                  question: "When should I RSVP by?",
                  body: "Please respond by the date on your invitation so we can finalize the guest count.",
                },
                {
                  id: "q2",
                  question: "What is the dress code?",
                  body: "Add your dress code details here.",
                },
                {
                  id: "q3",
                  question: "Can I bring a guest?",
                  body: "Please check your invitation for your plus-one.",
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "modern-celebration",
    name: "Modern Celebration",
    description: "Clean, contemporary layout with a schedule and RSVP.",
    eventType: "celebration",
    previewColor: "#0d9488",
    settings: {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      accentColor: "#0d9488",
      bgColor: "#ffffff",
      siteTextColor: "#1c1917",
      animation: "none",
      eventName: "Our Celebration",
      greeting: "Join us for a day to remember.",
    },
    pages: [
      {
        slug: "home",
        label: "Home",
        blocks: [
          { type: "home-hero", config: {} },
          {
            type: "countdown",
            config: {
              label: "The countdown is on",
              showRsvpButton: true,
              rsvpButtonText: "RSVP",
            },
          },
        ],
      },
      {
        slug: "schedule",
        label: "Schedule",
        blocks: [
          {
            type: "schedule",
            config: {
              heading: "The Day",
              displayMode: "timeline",
              events: [
                {
                  id: "s1",
                  name: "Ceremony",
                  time: "16:00",
                  description: "Where the celebration begins.",
                },
                {
                  id: "s2",
                  name: "Reception",
                  time: "18:00",
                  description: "Dinner, drinks, and dancing.",
                },
              ],
            },
          },
        ],
      },
      {
        slug: "rsvp",
        label: "RSVP",
        blocks: [
          {
            type: "rsvp-form",
            config: {
              heading: "Will you be there?",
              subheading: "Let us know so we can save you a seat.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "simple-invite",
    name: "Simple Invite",
    description: "A single elegant page — hero, countdown, and RSVP.",
    eventType: "wedding",
    previewColor: "#7c3aed",
    settings: {
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      accentColor: "#7c3aed",
      bgColor: "#faf7ff",
      siteTextColor: "#1c1917",
      animation: "none",
      eventName: "You're Invited",
    },
    pages: [
      {
        slug: "home",
        label: "Home",
        blocks: [
          { type: "home-hero", config: {} },
          {
            type: "countdown",
            config: {
              label: "Save the date",
              showRsvpButton: true,
              rsvpButtonText: "RSVP",
            },
          },
          {
            type: "rsvp-form",
            config: {
              heading: "RSVP",
              subheading: "We hope you can make it.",
            },
          },
        ],
      },
    ],
  },
];

/** Lightweight summaries for the create-site picker (no page/block payloads). */
export const STARTER_SUMMARIES = STARTERS.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  eventType: s.eventType,
  previewColor: s.previewColor,
  pageCount: s.pages.length,
}));

export function getStarter(id: string): StarterTemplate | undefined {
  return STARTERS.find((s) => s.id === id);
}

/**
 * Clone a starter's pages/blocks/theme into an already-created site. No-op for
 * the blank starter (or an unknown id). Each page/block gets a fresh id.
 */
export async function applyStarter(
  db: D1Database,
  siteId: string,
  starterId: string,
  now: number,
): Promise<void> {
  const starter = getStarter(starterId);
  if (!starter || starter.pages.length === 0) return;

  if (starter.settings) {
    const s = starter.settings;
    await db
      .prepare(
        `INSERT INTO site_setting
          (siteId, mainLanguage, headingFont, bodyFont, accentColor, bgColor,
           siteTextColor, eventName, eventDate, eventLocation, greeting,
           animation, isLive, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        siteId,
        (s.mainLanguage as string) ?? "en",
        (s.headingFont as string) ?? "Georgia",
        (s.bodyFont as string) ?? "Inter",
        (s.accentColor as string) ?? "#B8921A",
        (s.bgColor as string) ?? "#ffffff",
        (s.siteTextColor as string) ?? "#1c1917",
        (s.eventName as string) ?? null,
        (s.eventDate as string) ?? null,
        (s.eventLocation as string) ?? null,
        (s.greeting as string) ?? null,
        (s.animation as string) ?? null,
        now,
      )
      .run();
  }

  let pageOrder = 0;
  for (const page of starter.pages) {
    const pageId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)`,
      )
      .bind(pageId, siteId, page.slug, page.label, pageOrder++, now, now)
      .run();

    let blockOrder = 0;
    for (const block of page.blocks) {
      await db
        .prepare(
          `INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          siteId,
          pageId,
          block.type,
          JSON.stringify(block.config ?? {}),
          blockOrder++,
          now,
          now,
        )
        .run();
    }
  }
}
