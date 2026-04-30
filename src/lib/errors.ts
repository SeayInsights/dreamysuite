/**
 * Error Handling - Single Source of Truth
 *
 * Custom error classes and safe error extraction utilities.
 *
 * ## Adding New Error Types
 *
 * 1. Extend AppError with specific error class
 * 2. Set appropriate error code
 * 3. Add user-friendly message mapping if needed
 * 4. Export from this module
 *
 * ## Refactor Status
 *
 * - [x] Error class hierarchy
 * - [x] Safe extraction utilities
 * - [x] User-facing formatters
 * - [ ] Database queries migration
 * - [ ] API routes migration
 * - [ ] Component error boundaries
 * - [ ] Form validation errors
 *
 * @module errors
 */

// =============================================================================
// ERROR CLASSES
// =============================================================================

/**
 * Base application error class
 *
 * All custom errors extend this class. Provides:
 * - Error code for programmatic handling
 * - Context object for debugging
 * - Proper error name in stack traces
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/telemetry
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation error
 *
 * Use for input validation failures, schema validation, etc.
 *
 * @example
 * if (!email) {
 *   throw new ValidationError('Email is required', { field: 'email' });
 * }
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

/**
 * Database error
 *
 * Use for database operation failures.
 *
 * @example
 * throw new DatabaseError('Failed to create block', {
 *   operation: 'INSERT',
 *   table: 'block',
 *   blockId: id,
 * });
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
  }
}

/**
 * Network error
 *
 * Use for fetch failures, API timeouts, etc.
 *
 * @example
 * throw new NetworkError('Failed to fetch data', {
 *   url: '/api/sites',
 *   status: 500,
 * });
 */
export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context);
  }
}

/**
 * Not found error
 *
 * Use when a requested resource doesn't exist.
 *
 * @example
 * throw new NotFoundError('Block not found', { blockId });
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', context);
  }
}

/**
 * Unauthorized error
 *
 * Use when user is not authenticated.
 *
 * @example
 * throw new UnauthorizedError('Please sign in to continue');
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', context);
  }
}

/**
 * Forbidden error
 *
 * Use when user is authenticated but lacks permission.
 *
 * @example
 * throw new ForbiddenError('You do not have permission to edit this site');
 */
export class ForbiddenError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', context);
  }
}

/**
 * Rate limit error
 *
 * Use when rate limiting is exceeded.
 *
 * @example
 * throw new RateLimitError('Too many requests', {
 *   retryAfter: 60,
 * });
 */
export class RateLimitError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_EXCEEDED', context);
  }
}

// =============================================================================
// SAFE ERROR UTILITIES
// =============================================================================

/**
 * Safely extract error message from unknown error
 *
 * Works with:
 * - Error instances
 * - String errors
 * - Objects with message property
 * - Unknown values
 *
 * @param error - Unknown error value
 * @returns Error message string
 *
 * @example
 * try {
 *   await operation();
 * } catch (error) {
 *   console.error(getErrorMessage(error)); // Safe!
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Handle API error response format: { error: string | { message: string } }
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error !== null) {
        const errorObj = err.error as Record<string, unknown>;
        if (typeof errorObj.message === 'string') return errorObj.message;
      }
    }

    if (typeof err.message === 'string') {
      return err.message;
    }
  }

  return 'An unknown error occurred';
}
