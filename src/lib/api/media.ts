/**
 * Media API — upload, list, and delete media assets for a site
 *
 * @module api/media
 */

import { ApiClientError, apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CreateMediaRequest {
  key: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
  metadata?: unknown;
}

// =============================================================================
// MEDIA API
// =============================================================================

export const media = {
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
   * Upload media (FormData support — bypasses apiFetch to omit Content-Type)
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
