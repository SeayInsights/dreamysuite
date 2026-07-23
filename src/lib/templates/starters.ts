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
  {
    id: "golden-anniversary",
    name: "Golden Anniversary",
    description: "Warm gold serif elegance for a milestone anniversary.",
    eventType: "anniversary",
    previewColor: "#C99A2E",
    settings: {
      headingFont: "Cormorant Garamond",
      bodyFont: "Nunito",
      accentColor: "#C99A2E",
      bgColor: "#fbf7ef",
      siteTextColor: "#2b2417",
      animation: "envelope",
      eventName: "Our Anniversary",
      greeting: "Celebrating years of love — and the many more to come.",
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
              label: "Counting down to the celebration",
              showRsvpButton: true,
              rsvpButtonText: "RSVP",
            },
          },
        ],
      },
      {
        slug: "journey",
        label: "Our Journey",
        blocks: [
          {
            type: "multi-text",
            config: {
              mode: "text",
              heading: "Our Journey",
              body: "From the day we said 'I do' to today — share the moments that made these years unforgettable. Replace this with your own story.",
            },
          },
        ],
      },
      {
        slug: "celebration",
        label: "Celebration",
        blocks: [
          {
            type: "schedule",
            config: {
              heading: "The Evening",
              displayMode: "timeline",
              events: [
                {
                  id: "s1",
                  name: "Cocktail Hour",
                  time: "17:00",
                  description: "Drinks and mingling.",
                },
                {
                  id: "s2",
                  name: "Dinner & Toasts",
                  time: "18:30",
                  description: "A seated dinner with a few words.",
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
              heading: "RSVP",
              subheading: "Kindly let us know if you can join us.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "engagement-party",
    name: "Engagement Party",
    description: "Bold, modern rose tones to announce the big news.",
    eventType: "engagement",
    previewColor: "#E14D8B",
    settings: {
      headingFont: "Montserrat",
      bodyFont: "Inter",
      accentColor: "#E14D8B",
      bgColor: "#fff5f8",
      siteTextColor: "#2a1a22",
      animation: "doors",
      eventName: "We're Engaged!",
      greeting: "Come celebrate with us.",
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
              label: "The party's coming up",
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
              heading: "How We Got Here",
              body: "The story of how you met and the proposal. Swap this out for your own words.",
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
              heading: "Join Us",
              subheading: "Let us know you're coming.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "vow-renewal",
    name: "Vow Renewal",
    description: "Soft sage and script for renewing your promises.",
    eventType: "vow-renewal",
    previewColor: "#6B8E7A",
    settings: {
      headingFont: "Great Vibes",
      bodyFont: "Lora",
      accentColor: "#6B8E7A",
      bgColor: "#f4f7f4",
      siteTextColor: "#26302b",
      animation: "storybook",
      eventName: "Renewing Our Vows",
      greeting: "Ten years on, we'd choose each other all over again.",
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
              label: "Counting down",
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
              heading: "Our Story So Far",
              body: "Reflect on the journey that brought you back to this moment. Replace with your own words.",
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
                  description: "A renewal of our vows.",
                },
                {
                  id: "s2",
                  name: "Reception",
                  time: "17:30",
                  description: "Dinner and celebration.",
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
              heading: "RSVP",
              subheading: "We hope you'll join us.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "elopement-adventure",
    name: "Elopement",
    description: "Moody, cinematic dark theme with a soft aurora backdrop.",
    eventType: "elopement",
    previewColor: "#3E5C76",
    settings: {
      headingFont: "Libre Baskerville",
      bodyFont: "Raleway",
      accentColor: "#8FB3D9",
      bgColor: "#0f1720",
      siteTextColor: "#e8edf2",
      animation: "none",
      effectBg: "aurora",
      eventName: "We Eloped",
      greeting: "We ran away to say 'I do' — here's the story.",
    },
    pages: [
      {
        slug: "home",
        label: "Home",
        blocks: [
          { type: "home-hero", config: {} },
          {
            type: "multi-text",
            config: {
              mode: "text",
              heading: "The Adventure",
              body: "Where you went, why you eloped, and what it meant. Replace with your own words.",
            },
          },
          {
            type: "rsvp-form",
            config: {
              heading: "Celebrate With Us",
              subheading: "We'd love to see you at the after-party.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "starlit-evening",
    name: "Starlit Evening",
    description: "Dramatic indigo night sky with a galaxy background.",
    eventType: "celebration",
    previewColor: "#4C3A8C",
    settings: {
      headingFont: "Playfair Display",
      bodyFont: "Nunito",
      accentColor: "#B9A7FF",
      bgColor: "#0b0a1a",
      siteTextColor: "#ece9ff",
      animation: "none",
      effectBg: "galaxy",
      eventName: "An Evening to Remember",
      greeting: "Join us under the stars.",
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
              label: "The countdown begins",
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
              heading: "The Night",
              displayMode: "timeline",
              events: [
                {
                  id: "s1",
                  name: "Arrival",
                  time: "19:00",
                  description: "Welcome drinks.",
                },
                {
                  id: "s2",
                  name: "Dinner & Dancing",
                  time: "20:00",
                  description: "The celebration begins.",
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
              heading: "RSVP",
              subheading: "Save us a spot on the dance floor.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "garden-party",
    name: "Garden Party",
    description: "Fresh, leafy greens for a relaxed daytime celebration.",
    eventType: "celebration",
    previewColor: "#4E7A3A",
    settings: {
      headingFont: "Lora",
      bodyFont: "Nunito",
      accentColor: "#4E7A3A",
      bgColor: "#f6faf2",
      siteTextColor: "#22301c",
      animation: "none",
      eventName: "Garden Celebration",
      greeting: "Join us for an afternoon in the garden.",
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
              label: "See you soon",
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
              heading: "The Afternoon",
              displayMode: "timeline",
              events: [
                {
                  id: "s1",
                  name: "Garden Reception",
                  time: "14:00",
                  description: "Drinks and lawn games.",
                },
                {
                  id: "s2",
                  name: "Lunch",
                  time: "15:00",
                  description: "A relaxed seated meal.",
                },
              ],
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
              heading: "Good to Know",
              displayMode: "faq",
              columns: "1",
              items: [
                {
                  id: "q1",
                  question: "What should I wear?",
                  body: "Garden-party attire — comfortable shoes for the lawn.",
                },
                {
                  id: "q2",
                  question: "Will it be outdoors?",
                  body: "Yes, weather permitting, with covered areas available.",
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
              heading: "RSVP",
              subheading: "Let us know you can make it.",
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

/**
 * Theme-only patches for the in-editor "apply a template theme" action — fonts,
 * colors, intro animation, and background effect, with NO pages/blocks/content.
 * Excludes blank + page-less starters. Client-safe (no db).
 */
export const STARTER_THEMES = STARTERS.filter(
  (s) => s.settings && s.pages.length > 0,
).map((s) => {
  const st = s.settings as Record<string, unknown>;
  return {
    id: s.id,
    name: s.name,
    previewColor: s.previewColor,
    theme: {
      headingFont: st.headingFont as string,
      bodyFont: st.bodyFont as string,
      accentColor: st.accentColor as string,
      bgColor: st.bgColor as string,
      siteTextColor: (st.siteTextColor as string | undefined) ?? null,
      animation: (st.animation as string | undefined) ?? null,
      effectBg: (st.effectBg as string | undefined) ?? null,
      effectText: (st.effectText as string | undefined) ?? null,
      effectCard: (st.effectCard as string | undefined) ?? null,
    },
  };
});

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
           animation, effectBg, effectText, effectCard, isLive, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
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
        (s.effectBg as string) ?? null,
        (s.effectText as string) ?? null,
        (s.effectCard as string) ?? null,
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
