/**
 * Blocks API — CRUD and reorder operations for site blocks
 *
 * @module api/blocks
 */

import { apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// BLOCKS API
// =============================================================================

export const blocks = {
  /**
   * List all blocks for a site/page
   *
   * @param siteId - Site ID
   * @param pageId - Optional page filter
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
   */
  async get(siteId: string, blockId: string) {
    const response = await apiFetch<{ block: unknown }>(
      `/api/sites/${siteId}/blocks/${blockId}`
    );
    return response.block;
  },

  /**
   * Create a new block
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
