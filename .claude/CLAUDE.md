# DreamySuite Wedding Builder

## Terminology
- Use 'Tile' not 'Block' in all user-facing text

## Architecture
- Builder preview rendering lives in `$slug.tsx` — check there first for preview bugs before touching public API/SQL
- After CSS/layout changes, verify responsive breakpoints (mobile, tablet, desktop) render correctly
