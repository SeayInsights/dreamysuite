/**
 * Sites API — CRUD and settings operations for sites
 *
 * @module api/sites
 */

import { apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

export interface UpdateSettingsRequest {
  [key: string]: unknown;
}

// =============================================================================
// SITES API
// =============================================================================

export const sites = {
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
