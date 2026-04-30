/**
 * Pages API — CRUD operations for site pages
 *
 * @module api/pages
 */

import { apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// PAGES API
// =============================================================================

export const pages = {
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
