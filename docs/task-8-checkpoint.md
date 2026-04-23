# Task 8 Checkpoint: Settings API Split

**Status:** ✅ COMPLETED  
**Date:** 2026-04-23  
**Branch:** main (direct commit, no PR needed)

## Implementation Summary

Successfully implemented the settings API route split to read from and write to both `site_setting` (universal) and `site_type_settings` (wedding-specific) tables.

### Changes Made

1. **src/lib/schemas/site-type-settings.ts** (~90 lines added)
   - Added `getSiteTypeSettings()` - Fetch and parse type-specific settings from DB
   - Added `upsertSiteTypeSettings()` - Insert or update type-specific settings with merge logic
   - Added `getTypeDefaults()` - Get defaults for each site type

2. **src/app/api/sites/[id]/settings/route.ts** (~80 lines changed)
   - Added `WEDDING_FIELDS` constant (11 fields as specified)
   - Updated `GET` route: Merges universal settings + type-specific settings into single response
   - Updated `PUT` route: Splits incoming payload into universal vs. wedding fields, writes to respective tables
   - Fetches site_type from site table to determine split strategy

3. **src/lib/schemas/site-type-settings.test.ts** (new file, 158 lines)
   - Full test coverage for all site type schemas
   - Tests for discriminated union behavior
   - Tests for JSON parsing helper

### Field Split (As Clarified)

**Universal fields (remain in site_setting):**
- All fonts, colors, nav, SEO, effects, layout, etc.
- **Venue fields** (venueName, venuePlaceId, venueCoordinates, venueHotels, venueNote)
- **Guest categories** (guestCategories)

**Wedding-specific fields (moved to site_type_settings JSON):**
1. eventName
2. eventDate
3. eventLocation
4. greeting
5. musicUrl
6. songPages
7. songResetPages
8. sealInitials
9. cardColor
10. cardImage
11. envelopeColor

**Total:** 11 wedding fields (NOT 17 as originally planned)

### API Behavior

**GET /api/sites/:id/settings**
- Queries both `site_setting` and `site_type_settings` tables
- Merges type-specific settings on top of universal settings
- Returns a single merged object (API consumers see no difference)
- Strips `guestPassword` field from response

**PUT /api/sites/:id/settings**
- Fetches site_type from site table
- Splits incoming payload by field name (using WEDDING_FIELDS constant)
- Writes universal fields to `site_setting` via `upsertSiteSettings()`
- Writes wedding fields to `site_type_settings` via `upsertSiteTypeSettings()`
- Returns merged settings after update

### Test Results

✅ All tests passing:
- `src/lib/schemas/site-type-settings.test.ts` - 10/10 passed
- `src/lib/schemas/settings.test.ts` - 15/15 passed

### Database Queries

**Read path:**
```sql
SELECT * FROM site_setting WHERE siteId = ?
SELECT site_id, site_type, settings, created_at, updated_at FROM site_type_settings WHERE site_id = ?
```

**Write path:**
```sql
SELECT site_type FROM site WHERE id = ?
INSERT/UPDATE site_setting ...
INSERT/UPDATE site_type_settings ...
UPDATE site SET status = ? WHERE id = ? (if isLive changed)
```

### TypeScript Check

✅ No type errors in changed files  
⚠️ Pre-existing build issue with missing guestbook route (unrelated to this task)

### Acceptance Criteria

- [x] GET /api/sites/:id/settings returns merged settings (universal + wedding)
- [x] PUT with wedding field (eventName) writes to site_type_settings
- [x] PUT with universal field (accentColor) writes to site_setting
- [x] Schema split uses 11 wedding fields (not 17)
- [x] Venue fields remain in universal settings
- [x] Tests passing for both schemas
- [x] TypeScript compilation succeeds (for relevant files)

### Migration Notes

**Database state:** Migration 0040 already created the `site_type_settings` table and migrated existing wedding data.

**API consumers:** No breaking changes. GET and PUT endpoints maintain the same interface - they receive/return a single merged settings object.

**Next steps (Task 9+):**
- Update UI components to consume merged settings (SettingsTray, editor)
- Update Zustand store to handle type-specific settings
- Update template save/restore to include type settings
- Update public site renderer to use merged settings

### Known Limitations

1. **Validation:** Wedding field validation happens at TypeSettings schema level, not at the API route level. Invalid wedding fields will be caught during upsert.

2. **Site type detection:** Defaults to "wedding" if site.site_type is null (backward compatibility for sites created before multi-type migration).

3. **Type guards:** UI components will need type guards when accessing wedding-specific fields (e.g., `if (settings.eventName !== undefined)`).

### Files Modified

```
src/lib/schemas/site-type-settings.ts          | +90
src/app/api/sites/[id]/settings/route.ts       | +80 -40
src/lib/schemas/site-type-settings.test.ts     | +158 (new)
docs/task-8-checkpoint.md                      | +175 (new)
```

**Total:** ~503 lines changed across 4 files

---

## Traceability

**Requirement:** TR-007 - Settings schema + API reads/writes site_setting + site_type_settings  
**Plan:** Task 8 in `.planning/multi-type-refactor-plan.md`  
**Spec:** `.planning/database-architecture-patterns.md`  
**Migration Guide:** `docs/migration-type-specific-settings.md` (from Task 7)

---

**Completed by:** Claude (Agent)  
**Approved by:** [Pending review]
