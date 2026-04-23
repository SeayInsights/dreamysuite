# Migration Guide: Type-Specific Settings

## Overview
This document outlines the migration plan for moving wedding-specific settings from the base `settings` object to the new `site_type_settings` table with discriminated unions.

## Schema Changes Completed

### Fields Removed from `settings.ts`
The following 11 fields have been moved from the base settings schema to `WeddingSettingsSchema` in `site-type-settings.ts`:

1. `eventName` - Event name for weddings
2. `eventDate` - Event date for weddings
3. `eventLocation` - Event location for weddings
4. `greeting` - Greeting message for wedding sites
5. `musicUrl` - Background music URL for wedding sites
6. `songPages` - Pages where music should play
7. `songResetPages` - Pages where music should reset
8. `sealInitials` - Initials for wedding seal/invitation
9. `cardColor` - Card background color for invitations
10. `cardImage` - Card background image for invitations
11. `envelopeColor` - Envelope color for invitations

### New Schema Structure
```typescript
// site-type-settings.ts
export const WeddingSettingsSchema = z.object({
  siteType: z.literal("wedding"),
  eventName: z.string().nullable().default(null),
  eventDate: z.string().nullable().default(null),
  eventLocation: z.string().nullable().default(null),
  greeting: z.string().nullable().default(null),
  musicUrl: z.string().nullable().default(null),
  songPages: z.string().nullable().default(null),
  songResetPages: z.string().nullable().default(null),
  sealInitials: z.string().nullable().default(null),
  cardColor: z.string().nullable().default(null),
  cardImage: z.string().nullable().default(null),
  envelopeColor: z.string().nullable().default(null),
});

export const SiteTypeSettingsSchema = z.object({
  site_id: z.string(),
  site_type: z.string(),
  settings: TypeSettingsSchema,
  created_at: z.number().nullable().default(null),
  updated_at: z.number().nullable().default(null),
});
```

## Files Requiring Migration

### UI Components (Task 8)
The following files reference the removed wedding-specific fields and need to be updated to read from `siteTypeSettings` instead:

1. **src/app/(dashboard)/sites/[id]/editor-v2/inspector/ContentTab.tsx**
   - References: `eventName`, `eventDate`, `eventLocation`, `greeting`
   - Context: Form inputs for wedding event details
   - Migration: Update to read from `siteTypeSettings.settings.*` when `site_type === 'wedding'`

2. **src/app/(dashboard)/sites/[id]/editor-v2/trays/MusicTray.tsx**
   - References: `musicUrl`, `songPages`, `songResetPages`
   - Context: Music configuration UI
   - Migration: Update to read from `siteTypeSettings.settings.*` when `site_type === 'wedding'`

3. **src/app/(dashboard)/sites/[id]/editor-v2/NavPreview.tsx**
   - References: `cardColor`, `cardImage`, `envelopeColor`, `sealInitials`
   - Context: Invitation preview rendering
   - Migration: Update to read from `siteTypeSettings.settings.*` when `site_type === 'wedding'`

4. **src/app/components/blocks/CountdownBlock.tsx**
   - References: `eventDate`, `eventName`
   - Context: Countdown timer block component
   - Migration: Update to read from `siteTypeSettings.settings.*` when `site_type === 'wedding'`

5. **src/app/[slug]/route.ts**
   - References: Multiple wedding fields
   - Context: Public site data API
   - Migration: Include `siteTypeSettings` in the response payload

6. **src/app/(dashboard)/sites/[id]/editor.tsx**
   - References: Multiple wedding fields
   - Context: Legacy editor (may be deprecated)
   - Migration: Update or mark for deprecation

## Migration Strategy

### Phase 1: Schema Split (Task 7 - COMPLETED)
- ✅ Remove wedding-specific fields from `settings.ts`
- ✅ Create `site-type-settings.ts` with discriminated unions
- ✅ Update tests to use non-wedding fields

### Phase 2: Store & API Updates (Task 8)
1. **Update Zustand store** (`src/app/stores/slices/settings.ts`):
   - Add `siteTypeSettings` state alongside `settings`
   - Add actions: `setSiteTypeSettings`, `updateTypeSettings`
   - Ensure both are populated from API responses

2. **Update API routes**:
   - `GET /api/sites/:id` - Include `site_type_settings` table data in response
   - `PUT /api/sites/:id/settings` - Split payload into base settings + type settings
   - `POST /api/sites` - Create both `site_setting` and `site_type_settings` rows

3. **Update UI components**:
   - Replace `settings.eventName` → `siteTypeSettings?.settings?.eventName` (wedding sites only)
   - Add type guards: `if (siteTypeSettings?.siteType === 'wedding') { ... }`
   - Add fallback UI for non-wedding sites

### Phase 3: Database Migration (Task 9)
1. Create `site_type_settings` table
2. Migrate existing wedding data from `site_setting` to `site_type_settings`
3. Remove wedding columns from `site_setting` table
4. Update indexes and foreign keys

### Phase 4: Template System Updates (Task 10)
1. Update template save to include type-specific settings
2. Update template restore to populate both tables
3. Add type-specific template filtering

## Testing Checklist

### Unit Tests
- [x] `settings.test.ts` - Base settings schema (wedding fields removed)
- [ ] `site-type-settings.test.ts` - Type-specific schemas
- [ ] Store actions for type settings

### Integration Tests
- [ ] Wedding site creation includes type settings
- [ ] Non-wedding sites don't create wedding type settings
- [ ] Template save/restore includes type settings
- [ ] Public API includes type settings in response

### Manual QA
- [ ] Wedding site editor shows all event fields
- [ ] Countdown block works with migrated eventDate
- [ ] Music tray works with migrated musicUrl
- [ ] Invitation preview works with migrated card/envelope colors
- [ ] Public wedding sites render correctly
- [ ] Non-wedding sites don't show wedding fields

## Rollback Plan
If issues arise during migration:
1. Revert to `feat/multi-type-schemas` branch
2. Keep dual-read capability: check both `settings` and `siteTypeSettings`
3. Gradual migration: write to both tables during transition period

## Future Considerations

### Adding New Site Types
When adding a new site type (e.g., `insurance_agent`, `nonprofit`):
1. Add schema to `site-type-settings.ts` discriminated union
2. Create UI components specific to that type
3. Add type guards in existing components
4. No changes to base `settings.ts` required

### Field Classification
Guidelines for determining if a field belongs in base settings vs type settings:
- **Base settings**: Styling, navigation, SEO, layout (applies to all site types)
- **Type settings**: Domain-specific data (event details, insurance info, nonprofit data)

## References
- Base settings: `src/lib/schemas/settings.ts`
- Type settings: `src/lib/schemas/site-type-settings.ts`
- Store: `src/app/stores/slices/settings.ts`
- API: `src/app/api/sites/[id]/route.ts`
