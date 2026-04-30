/**
 * API Core — shared infrastructure for all domain API modules
 *
 * Exports:
 * - ApiClientError: typed error class
 * - apiFetch: base fetch wrapper with error handling
 *
 * @module api/_core
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
export async function apiFetch<T>(
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
