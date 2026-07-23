# Curated photo drop-in slot

Real photographic stock for templates lives here as `.webp` files. This folder
is a **drop-in slot**: add a photo file, then register it in
`src/lib/stock/library.ts` (`STOCK_IMAGES`, `kind: "photo"`) and it immediately
appears in the editor's stock picker and can be used by templates.

## How to add photos

1. Optimize to `.webp` (≤ ~250 KB, ~1600px wide for heroes, ~1000px for tiles).
2. Save here, e.g. `photos/wedding-arch-01.webp`.
3. Add an entry to `STOCK_IMAGES`:
   ```ts
   {
     id: "wedding-arch-01",
     url: "/stock/photos/wedding-arch-01.webp",
     label: "Garden Ceremony",
     category: "romance",
     kind: "photo",
   }
   ```
4. `npm run build` + the manifest drift test confirms the file exists.

## Licensing

Only commit photos with a clear, permissive license (e.g. Unsplash / Pexels
license) and keep attribution/source in this file. Do not commit copyrighted
images. Entries added here are served same-origin, so they render on published
and custom-domain sites unchanged.

## Currently bundled

_None yet_ — pending curated, license-cleared photography. Until then, templates
use the self-hosted SVG scenes (`scene-*.svg`) as hero imagery.
