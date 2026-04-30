/**
 * API Client — re-export barrel
 *
 * Aggregates all domain API modules into a single `apiClient` object.
 * Import from here OR from individual domain modules directly.
 *
 * ## Usage
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 * import { apiClient, ApiClientError } from '@/lib/api/client';
 *
 * const blocks = await apiClient.blocks.list(siteId);
 * const page   = await apiClient.pages.get(siteId, pageId);
 * ```
 *
 * ## Domain modules
 * - `_core.ts`     — ApiClientError, apiFetch
 * - `blocks.ts`    — CRUD + reorder
 * - `pages.ts`     — CRUD
 * - `sites.ts`     — CRUD + settings
 * - `media.ts`     — upload, list, delete
 * - `places.ts`    — Google Places search + details
 * - `translate.ts` — block translation
 *
 * @module api/client
 */

// Re-export shared infrastructure
export { ApiClientError } from './_core';

// Re-export domain types
export type { CreateBlockRequest, UpdateBlockRequest, ReorderUpdate } from './blocks';
export type { CreatePageRequest, UpdatePageRequest, PageWithBlocks } from './pages';
export type { CreateSiteRequest, UpdateSiteRequest, UpdateSettingsRequest } from './sites';
export type { CreateMediaRequest } from './media';
export type { PlaceResult, PlaceDetails } from './places';
export type { TranslateRequest } from './translate';

// Import domain namespaces for the aggregate client
import { blocks } from './blocks';
import { pages } from './pages';
import { sites } from './sites';
import { media } from './media';
import { places } from './places';
import { translate } from './translate';

/**
 * Centralized API client for all client-side API calls
 *
 * @example
 * import { apiClient } from '@/lib/api/client';
 *
 * const blocks = await apiClient.blocks.list(siteId);
 * const page = await apiClient.pages.get(siteId, pageId);
 */
export const apiClient = {
  blocks,
  pages,
  sites,
  media,
  places,
  translate,
};
