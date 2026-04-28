/**
 * API Client - Single Source of Truth
 *
 * All client-side API calls live here. No scattered fetch() in components.
 *
 * ## Architecture Decision
 *
 * This module centralizes all client-side API communication.
 * It provides:
 * - Typed request/response contracts
 * - Resource-based organization
 * - Standardized error handling
 * - Automatic URL construction
 *
 * ## Why This Pattern?
 *
 * **Before:** fetch() scattered across 47+ files
 * - Inline fetch calls in components
 * - No type safety on responses
 * - Inconsistent error handling
 * - Manual URL construction
 *
 * **After:** Single import path for all API calls
 * - `import { apiClient } from '@/lib/api/client'`
 * - Typed methods for all resources
 * - Standardized error responses
 * - Easy to audit and maintain
 *
 * ## Usage Guidelines
 *
 * ### Basic CRUD Operations
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 *
 * // List blocks
 * const blocks = await apiClient.blocks.list(siteId);
 * // blocks: Block[]
 *
 * // Create block
 * const newBlock = await apiClient.blocks.create(siteId, {
 *   pageId: 'page-123',
 *   type: 'hero',
 *   config: { title: 'Welcome' },
 * });
 * ```
 *
 * ### Error Handling
 * ```typescript
 * import { apiClient, ApiClientError } from '@/lib/api/client';
 *
 * try {
 *   const block = await apiClient.blocks.get(siteId, blockId);
 * } catch (error) {
 *   if (error instanceof ApiClientError) {
 *     console.error(`API Error ${error.status}: ${error.code}`);
 *   }
 * }
 * ```
 *
 * ## Adding New Endpoints
 *
 * 1. Define request/response types
 * 2. Add method to appropriate resource namespace
 * 3. Update type exports
 * 4. Update components to use new method
 *
 * ## Refactor Status
 *
 * - [ ] Block API (priority 1)
 * - [ ] Page API
 * - [ ] Site API
 * - [ ] Media API
 * - [ ] Guest/Contact API
 * - [ ] Translation API
 * - [ ] Places API (external)
 * - [ ] Settings API
 * - [ ] Template API
 *
 * @module api/client
 */

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling and type safety
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({
      error: {
        code: 'UNKNOWN',
        message: res.statusText,
      },
    }))) as { error?: { code?: string; message?: string } };
    throw new ApiClientError(
      res.status,
      error.error?.code || 'UNKNOWN',
      error.error?.message || res.statusText
    );
  }

  const data = await res.json();
  return data as T;
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Block types
export interface CreateBlockRequest {
  id?: string;
  pageId: string;
  type: string;
  config: unknown;
  sortOrder?: number;
}

export interface UpdateBlockRequest {
  type?: string;
  config?: unknown;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface ReorderUpdate {
  id: string;
  sortOrder: number;
}

// Page types
export interface CreatePageRequest {
  slug: string;
  title: string;
  sortOrder?: number;
}

export interface UpdatePageRequest {
  slug?: string;
  title?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface PageWithBlocks {
  page: {
    id: string;
    siteId: string;
    slug: string;
    title: string;
    sortOrder: number;
    isPublished: number;
    createdAt: number;
    updatedAt: number;
  };
  blocks: Array<{
    id: string;
    siteId: string;
    pageId: string;
    type: string;
    config: string;
    sortOrder: number;
    isVisible: number;
    createdAt: number;
    updatedAt: number;
  }>;
}

// Site types
export interface CreateSiteRequest {
  site_type: string;
  slug?: string;
  title?: string;
}

export interface UpdateSiteRequest {
  site_type?: string;
  slug?: string;
  title?: string;
}

// Media types
export interface CreateMediaRequest {
  key: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
  metadata?: unknown;
}

// Places types (Google Places API)
export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photos?: string[];
  website?: string;
  phone?: string;
}

// Settings types
export interface UpdateSettingsRequest {
  [key: string]: unknown;
}

// Translation types
export interface TranslateRequest {
  blockId: string;
  lang: string;
  fields: Record<string, string>;
}

// =============================================================================
// BLOCKS API
// =============================================================================

const blocks = {
  /**
   * List all blocks for a site/page
   *
   * @param siteId - Site ID
   * @returns Array of blocks
   *
   * @example
   * const blocks = await apiClient.blocks.list(siteId);
   */
  async list(siteId: string, pageId?: string) {
    const url = pageId
      ? `/api/sites/${siteId}/blocks?pageId=${pageId}`
      : `/api/sites/${siteId}/blocks`;
    const response = await apiFetch<{ blocks: unknown[] }>(url);
    return response.blocks || [];
  },

  /**
   * Get a single block
   *
   * @param siteId - Site ID
   * @param blockId - Block ID
   * @returns Block
   */
  async get(siteId: string, blockId: string) {
    const response = await apiFetch<{ block: unknown }>(
      `/api/sites/${siteId}/blocks/${blockId}`
    );
    return response.block;
  },

  /**
   * Create a new block
   *
   * @param siteId - Site ID
   * @param data - Block data
   * @returns Created block
   */
  async create(siteId: string, data: CreateBlockRequest) {
    const response = await apiFetch<{ block: unknown }>(
      `/api/sites/${siteId}/blocks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.block;
  },

  /**
   * Update a block
   *
   * @param siteId - Site ID
   * @param blockId - Block ID
   * @param data - Partial block data
   * @returns Updated block
   */
  async update(siteId: string, blockId: string, data: UpdateBlockRequest) {
    const response = await apiFetch<{ block: unknown }>(
      `/api/sites/${siteId}/blocks/${blockId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.block;
  },

  /**
   * Delete a block
   *
   * @param siteId - Site ID
   * @param blockId - Block ID
   */
  async delete(siteId: string, blockId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/sites/${siteId}/blocks/${blockId}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Reorder blocks
   *
   * @param siteId - Site ID
   * @param updates - Array of block ID and sortOrder pairs
   */
  async reorder(siteId: string, updates: ReorderUpdate[]): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/sites/${siteId}/blocks/reorder`,
      {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }
    );
  },
};

// =============================================================================
// PAGES API
// =============================================================================

const pages = {
  /**
   * List all pages for a site
   */
  async list(siteId: string) {
    const response = await apiFetch<{ pages: unknown[] }>(
      `/api/sites/${siteId}/pages`
    );
    return response.pages || [];
  },

  /**
   * Get a single page with its blocks
   */
  async get(siteId: string, pageId: string): Promise<PageWithBlocks> {
    return apiFetch<PageWithBlocks>(`/api/sites/${siteId}/pages/${pageId}`);
  },

  /**
   * Create a new page
   */
  async create(siteId: string, data: CreatePageRequest) {
    const response = await apiFetch<{ page: unknown }>(
      `/api/sites/${siteId}/pages`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.page;
  },

  /**
   * Update a page
   */
  async update(siteId: string, pageId: string, data: UpdatePageRequest) {
    const response = await apiFetch<{ page: unknown }>(
      `/api/sites/${siteId}/pages/${pageId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.page;
  },

  /**
   * Delete a page
   */
  async delete(siteId: string, pageId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/sites/${siteId}/pages/${pageId}`,
      {
        method: 'DELETE',
      }
    );
  },
};

// =============================================================================
// SITES API
// =============================================================================

const sites = {
  /**
   * List all sites for the current user
   */
  async list() {
    const response = await apiFetch<{ sites: unknown[] }>('/api/sites');
    return response.sites || [];
  },

  /**
   * Get a single site
   */
  async get(siteId: string) {
    const response = await apiFetch<{ site: unknown }>(`/api/sites/${siteId}`);
    return response.site;
  },

  /**
   * Create a new site
   */
  async create(data: CreateSiteRequest) {
    const response = await apiFetch<{ site: unknown }>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.site;
  },

  /**
   * Update a site
   */
  async update(siteId: string, data: UpdateSiteRequest) {
    const response = await apiFetch<{ site: unknown }>(`/api/sites/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.site;
  },

  /**
   * Site settings sub-resource
   */
  settings: {
    /**
     * Get site settings
     */
    async get(siteId: string) {
      const response = await apiFetch<{ settings: unknown }>(
        `/api/sites/${siteId}/settings`
      );
      return response.settings;
    },

    /**
     * Update site settings
     */
    async update(siteId: string, data: UpdateSettingsRequest) {
      const response = await apiFetch<{ settings: unknown }>(
        `/api/sites/${siteId}/settings`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.settings;
    },
  },
};

// =============================================================================
// MEDIA API
// =============================================================================

const media = {
  /**
   * List all media for a site
   */
  async list(siteId: string, type?: 'photo' | 'video') {
    const url = type
      ? `/api/sites/${siteId}/media?type=${type}`
      : `/api/sites/${siteId}/media`;
    const response = await apiFetch<{ media: unknown[] }>(url);
    return response.media || [];
  },

  /**
   * List all photos for a site (alias for media with type=photo)
   */
  async listPhotos(siteId: string) {
    const response = await apiFetch<{ photos: unknown[] }>(
      `/api/sites/${siteId}/photos`
    );
    return response.photos || [];
  },

  /**
   * Get a single media item
   */
  async get(siteId: string, mediaId: string) {
    const response = await apiFetch<{ media: unknown }>(
      `/api/sites/${siteId}/media/${mediaId}`
    );
    return response.media;
  },

  /**
   * Upload media (FormData support)
   */
  async upload(siteId: string, formData: FormData) {
    const res = await fetch(`/api/sites/${siteId}/media`, {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    });

    if (!res.ok) {
      const error = (await res.json().catch(() => ({
        error: { code: 'UNKNOWN', message: res.statusText },
      }))) as { error?: { code?: string; message?: string } };
      throw new ApiClientError(
        res.status,
        error.error?.code || 'UNKNOWN',
        error.error?.message || res.statusText
      );
    }

    return res.json();
  },

  /**
   * Delete a media item
   */
  async delete(siteId: string, mediaId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(
      `/api/sites/${siteId}/media/${mediaId}`,
      {
        method: 'DELETE',
      }
    );
  },
};

// =============================================================================
// PLACES API (Google Places)
// =============================================================================

const places = {
  /**
   * Search for places
   */
  async search(query: string): Promise<PlaceResult[]> {
    const response = await apiFetch<{ results: PlaceResult[] }>(
      `/api/places/search?q=${encodeURIComponent(query)}`
    );
    return response.results || [];
  },

  /**
   * Get place details
   */
  async details(placeId: string): Promise<PlaceDetails> {
    return apiFetch<PlaceDetails>(
      `/api/places/details?placeId=${encodeURIComponent(placeId)}`
    );
  },
};

// =============================================================================
// TRANSLATION API
// =============================================================================

const translate = {
  /**
   * Translate a block
   */
  async translateBlock(siteId: string, data: TranslateRequest) {
    const response = await apiFetch<{ translation: unknown }>(
      `/api/sites/${siteId}/translate`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.translation;
  },

  /**
   * Get all translations for a site
   */
  async list(siteId: string) {
    const response = await apiFetch<{ translations: unknown[] }>(
      `/api/sites/${siteId}/translations`
    );
    return response.translations || [];
  },
};

// =============================================================================
// API CLIENT EXPORT
// =============================================================================

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
