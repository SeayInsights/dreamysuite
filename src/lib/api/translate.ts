/**
 * Translation API — block translation and listing for a site
 *
 * @module api/translate
 */

import { apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TranslateRequest {
  blockId: string;
  lang: string;
  fields: Record<string, string>;
}

// =============================================================================
// TRANSLATION API
// =============================================================================

export const translate = {
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
