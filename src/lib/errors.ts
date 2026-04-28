/**
 * Error Handling - Single Source of Truth
 *
 * All error classes and error handling utilities live here.
 *
 * ## Architecture Decision
 *
 * This module centralizes error handling patterns for the application.
 * It provides:
 * - Custom error classes for different error types
 * - Safe error extraction from unknown errors
 * - User-facing error message formatting
 * - Type guards for error checking
 *
 * ## Why This Pattern?
 *
 * **Before:** Error handling scattered across 81+ files
 * - Generic `throw new Error()` everywhere
 * - No error codes or types
 * - Unsafe error object access
 * - Inconsistent user-facing messages
 *
 * **After:** Typed errors with consistent handling
 * - `throw new ValidationError('message', context)`
 * - Safe error extraction: `getErrorMessage(error)`
 * - Typed error checking: `isErrorType(error, ValidationError)`
 * - User-friendly formatting: `formatUserError(error)`
 *
 * ## Usage Guidelines
 *
 * ### Throwing Typed Errors
 * ```typescript
 * import { ValidationError, DatabaseError } from '@/lib/errors';
 *
 * // Validation errors
 * if (!email) {
 *   throw new ValidationError('Email is required', { field: 'email' });
 * }
 *
 * // Database errors
 * const block = await createBlock(db, data);
 * if (!block) {
 *   throw new DatabaseError('Failed to create block', {
 *     operation: 'INSERT',
 *     table: 'block',
 *   });
 * }
 * ```
 *
 * ### Safe Error Extraction
 * ```typescript
 * import { getErrorMessage, getErrorCode } from '@/lib/errors';
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   // Safe - works with any error type
 *   const message = getErrorMessage(error);
 *   const code = getErrorCode(error);
 *   console.error(`[${code}] ${message}`);
 * }
 * ```
 *
 * ### Error Type Checking
 * ```typescript
 * import { isErrorType, ValidationError } from '@/lib/errors';
 *
 * try {
 *   await validateForm(data);
 * } catch (error) {
 *   if (isErrorType(error, ValidationError)) {
 *     // TypeScript knows error is ValidationError here
 *     console.log('Validation failed:', error.context);
 *   }
 * }
 * ```
 *
 * ### User-Facing Errors
 * ```typescript
 * import { formatUserError } from '@/lib/errors';
 *
 * try {
 *   await saveData();
 * } catch (error) {
 *   // Friendly message for users
 *   toast.error(formatUserError(error));
 * }
 * ```
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

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Safely extract error code
 *
 * @param error - Unknown error value
 * @returns Error code string
 *
 * @example
 * const code = getErrorCode(error);
 * if (code === 'NOT_FOUND') {
 *   // Handle not found
 * }
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return 'UNKNOWN';
}

/**
 * Safely extract error context
 *
 * @param error - Unknown error value
 * @returns Error context object or undefined
 */
export function getErrorContext(error: unknown): Record<string, unknown> | undefined {
  if (error instanceof AppError) {
    return error.context;
  }

  if (
    error &&
    typeof error === 'object' &&
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null
  ) {
    return error.context as Record<string, unknown>;
  }

  return undefined;
}

/**
 * Check if error is of specific type
 *
 * Type guard for narrowing error types.
 *
 * @param error - Unknown error value
 * @param ErrorClass - Error class to check against
 * @returns true if error is instance of ErrorClass
 *
 * @example
 * if (isErrorType(error, ValidationError)) {
 *   // TypeScript knows error is ValidationError
 *   console.log(error.context?.field);
 * }
 */
export function isErrorType<T extends AppError>(
  error: unknown,
  ErrorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof ErrorClass;
}

// =============================================================================
// USER-FACING ERROR FORMATTING
// =============================================================================

/**
 * Format error for user display
 *
 * Converts technical error messages to user-friendly text.
 * Strips implementation details and database errors.
 *
 * @param error - Unknown error value
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   await saveData();
 * } catch (error) {
 *   toast.error(formatUserError(error));
 * }
 */
export function formatUserError(error: unknown): string {
  const message = getErrorMessage(error);

  // Database constraint violations
  if (message.includes('UNIQUE constraint')) {
    return 'This item already exists. Please use a different value.';
  }

  if (message.includes('NOT NULL constraint')) {
    return 'A required field is missing. Please fill in all required fields.';
  }

  if (message.includes('FOREIGN KEY constraint')) {
    return 'Cannot complete this operation. The referenced item may have been deleted.';
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The request took too long. Please try again.';
  }

  // Auth errors
  if (message.includes('Unauthorized') || message.includes('401')) {
    return 'Please sign in to continue.';
  }

  if (message.includes('Forbidden') || message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  // Not found
  if (message.includes('Not found') || message.includes('404')) {
    return 'The requested item could not be found.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Validation errors - pass through as-is (already user-friendly)
  if (error instanceof ValidationError) {
    return message;
  }

  // Fallback - return original message for unknown errors
  return message;
}

/**
 * Get HTTP status code from error
 *
 * @param error - Unknown error value
 * @returns HTTP status code (defaults to 500)
 */
export function getErrorStatus(error: unknown): number {
  const code = getErrorCode(error);

  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'DATABASE_ERROR':
    case 'NETWORK_ERROR':
      return 500;
    default:
      return 500;
  }
}

/**
 * Create error response for API routes
 *
 * @param error - Unknown error value
 * @returns JSON-serializable error object
 *
 * @example
 * try {
 *   // ...
 * } catch (error) {
 *   return NextResponse.json(
 *     createErrorResponse(error),
 *     { status: getErrorStatus(error) }
 *   );
 * }
 */
export function createErrorResponse(error: unknown): {
  error: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
} {
  return {
    error: {
      code: getErrorCode(error),
      message: getErrorMessage(error),
      context: getErrorContext(error),
    },
  };
}
