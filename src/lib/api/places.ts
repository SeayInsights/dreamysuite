/**
 * Places API — Google Places search and details (external)
 *
 * @module api/places
 */

import { apiFetch } from './_core';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// PLACES API
// =============================================================================

export const places = {
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
