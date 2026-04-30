# Block Components

React components that render site content blocks in the editor preview.

## Pattern

Each block receives its config as props and reads editor state from `editorStore`. Blocks are registered in `blocks/index.ts` barrel file.

## Subdirectory: blocks/

Contains all block type components (ScheduleBlock, RegistryBlock, ContentCardBlock, GalleryBlock, etc.) plus their extracted sub-components.

## Adding a new block

1. Create `blocks/MyBlock.tsx` with the block component
2. Export from `blocks/index.ts`
3. Add the block type to the editor's insert palette
4. Add a corresponding renderer in `src/app/[slug]/renderers.ts` for the public site
