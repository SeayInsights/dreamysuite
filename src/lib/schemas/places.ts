import { z } from "zod";

/**
 * Schemas for the Google Places boundary. The two /api/places routes fetch
 * Google's API directly (untrusted external payload) and previously cast the
 * parsed JSON to `any`. These schemas validate the fields we actually use;
 * everything is optional because Google omits fields freely, and unknown keys
 * are ignored.
 */

const LatLng = z.object({ lat: z.number(), lng: z.number() });
const Geometry = z.object({ location: LatLng.optional() });

/** Google Text Search response (upstream). */
export const GoogleTextSearchResponse = z.object({
  results: z
    .array(
      z.object({
        place_id: z.string().optional(),
        name: z.string().optional(),
        formatted_address: z.string().optional(),
        geometry: Geometry.optional(),
      }),
    )
    .default([]),
});

/** Google Place Details response (upstream). */
export const GoogleDetailsResponse = z.object({
  result: z
    .object({
      name: z.string().optional(),
      rating: z.number().optional(),
      geometry: Geometry.optional(),
      photos: z.array(z.object({ photo_reference: z.string() })).optional(),
    })
    .optional(),
});

/** Our /api/places/search response (consumed by the editor client). */
export const PlacesSearchApiResponse = z.object({
  results: z
    .array(
      z.object({
        place_id: z.string().optional(),
        name: z.string().optional(),
        formatted_address: z.string().optional(),
        geometry: Geometry.optional(),
      }),
    )
    .default([]),
});

/** Our /api/places/details response (consumed by the editor client). */
export const PlacesDetailsApiResponse = z.object({
  result: z
    .object({
      name: z.string().optional(),
      rating: z.number().optional(),
      geometry: Geometry.optional(),
      photo: z.string().optional(),
      photoRefs: z.array(z.string()).optional(),
    })
    .optional(),
});
