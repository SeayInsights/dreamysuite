# DreamySuite — Marketing Landing Page Brief

## What This Is
A new marketing/landing page for dreamysuite.com — the public-facing front door for the SaaS product. Does not exist yet. Needs to be built as a new route in the React Router app.

## Tech Stack
- React Router v7 + Cloudflare Pages (Vite)
- Repo: https://github.com/SeayInsights/dreamysuite.git
- Local build: C:\Users\Dannis Seay\studio\builds\dreamysuite
- New route: create a marketing index route (separate from the auth dashboard)

## Design Direction
- **Aesthetic:** Awwwards-tier. Dark OLED hero (`#050505`) transitioning to warm cream content sections (`#FDFBF7`). Gold accent tones. Film grain overlay on hero.
- **Vibe:** What if A24 made a wedding SaaS. Cinematic, modern luxury, emotionally resonant — not typical wedding pink/floral.
- **Typography:** Editorial serif (Bodoni Moda) for headings, Figtree for body (already loaded in dashboard.css)
- **Motion:** Cinematic scroll reveals, staggered text entry, WebGL or Spline 3D element in hero if feasible
- **Layout:** Bento grid feature section (Phenomenon Studio style), asymmetric — not 3-column bootstrap grids

## Key Sections
1. **Hero** — Full-bleed dark. Product statement + CTA + animated preview of a wedding site entrance animation
2. **Feature grid** — Bento layout showcasing the 3 animation types: Envelope, Doors, Storybook
3. **How it works** — 3-step editorial split layout
4. **Social proof / sample sites** — Show real-looking wedding site previews
5. **Final CTA** — Warm cream section, editorial serif headline, single action

## Brand Context
- Product: SaaS event site builder (weddings + any milestone event)
- Brand personality: Cinematic · Effortless · Expressive
- Design context file: `dreamysuite/.impeccable.md` (read this first)

## Constraints
- Do NOT touch: `$slug.tsx`, dashboard routes, D1 schema, any API endpoints
- Preserve: Cloudflare Workers + React Router architecture
- No new npm packages without checking package.json first

## Workflow to Follow
Trigger: `build page: DreamySuite marketing landing page`
Skills fire in order: shape → impeccable + soft-skill + overdrive → emil-design-eng → animate → webapp-testing
